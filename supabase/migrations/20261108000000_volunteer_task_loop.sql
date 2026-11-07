-- ====================================================================
-- FestFlow: Volunteer task loop (widget tick-box + assignment notifications)
-- Additive. Safe to run after 20261106000000_schema_updates.sql.
--
-- Flow:
--   organizer inserts/reassigns a task
--     -> trg_tasks_notify_assignee -> pg_net POST -> edge function `push-notifications`
--     -> Expo push to the volunteer's phone + Web Push to their browsers
--   volunteer taps the widget tick box / web toggle
--     -> rpc set_task_status() -> Realtime broadcasts the row -> dashboards update live
-- ====================================================================

-- 0. Fix infinite RLS recursion (pre-existing): the events SELECT policy queries roles, and the roles
--    policies query events, so any signed-in query touching events/roles/tasks failed with
--    "infinite recursion detected in policy for relation events". These helpers check membership
--    without re-entering RLS.
CREATE OR REPLACE FUNCTION public.is_event_organizer(p_event_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.events WHERE id = p_event_id AND organizer_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_event_member(p_event_id UUID, p_role_type TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.roles
        WHERE event_id = p_event_id AND user_id = auth.uid()
          AND (p_role_type IS NULL OR role_type = p_role_type)
    );
$$;

REVOKE ALL ON FUNCTION public.is_event_organizer(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_event_member(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_event_organizer(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_member(UUID, TEXT) TO anon, authenticated;

DROP POLICY IF EXISTS "Public active events are viewable by everyone" ON public.events;
CREATE POLICY "Public active events are viewable by everyone"
ON public.events FOR SELECT
USING (
    deleted_at IS NULL AND (
        visibility = 'public'
        OR organizer_id = auth.uid()
        OR public.is_event_member(id)
    )
);

DROP POLICY IF EXISTS "Users can view roles for events they participate in" ON public.roles;
CREATE POLICY "Users can view roles for events they participate in"
ON public.roles FOR SELECT
USING (user_id = auth.uid() OR public.is_event_organizer(event_id));

DROP POLICY IF EXISTS "Organizers can manage roles" ON public.roles;
CREATE POLICY "Organizers can manage roles"
ON public.roles FOR ALL
USING (public.is_event_organizer(event_id))
WITH CHECK (public.is_event_organizer(event_id));

-- 1. Columns the web dashboard already uses
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS claimed_at  TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_event ON public.tasks(event_id);

CREATE OR REPLACE FUNCTION public.touch_task_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_touch_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_touch_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.touch_task_updated_at();

-- 2. Create a profile row automatically when someone signs up (profiles.id -> auth.users.id)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(COALESCE(NEW.email, 'Volunteer'), '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Volunteers of an event can see that event's open (unassigned) volunteer tasks, so they can take them up
DROP POLICY IF EXISTS "Event volunteers can view open volunteer tasks" ON public.tasks;
CREATE POLICY "Event volunteers can view open volunteer tasks"
ON public.tasks FOR SELECT
USING (
    assignee_id IS NULL
    AND assignee_type = 'volunteer'
    AND public.is_event_member(event_id, 'volunteer')
);

-- 4. Assignees no longer get raw UPDATE on tasks (it let them rewrite the title, due date, etc.).
--    They change status only through the functions below; organizers keep full control via their FOR ALL policy.
DROP POLICY IF EXISTS "Assignees can update status of their tasks" ON public.tasks;

CREATE OR REPLACE FUNCTION public.set_task_status(p_task_id UUID, p_status TEXT)
RETURNS public.tasks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_task public.tasks;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
    END IF;
    IF p_status NOT IN ('todo', 'in_progress', 'done') THEN
        RAISE EXCEPTION 'Invalid status %', p_status USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id FOR UPDATE;
    IF v_task.id IS NULL THEN
        RAISE EXCEPTION 'Task not found' USING ERRCODE = 'P0002';
    END IF;
    IF v_task.assignee_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'This task is not assigned to you' USING ERRCODE = '42501';
    END IF;
    IF EXISTS (SELECT 1 FROM public.events WHERE id = v_task.event_id AND deleted_at IS NOT NULL) THEN
        RAISE EXCEPTION 'This event has been removed' USING ERRCODE = '42501';
    END IF;

    -- Idempotent: a widget retrying an already-applied tick is a no-op, not an error.
    IF v_task.status = p_status THEN
        RETURN v_task;
    END IF;

    UPDATE public.tasks
    SET status = p_status,
        verified_at = NULL -- any status change needs organizer re-verification
    WHERE id = p_task_id
    RETURNING * INTO v_task; -- completed_at is set/cleared by trg_task_status_update

    RETURN v_task;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_task(p_task_id UUID)
RETURNS public.tasks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_task public.tasks;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
    END IF;

    SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id FOR UPDATE;
    IF v_task.id IS NULL THEN
        RAISE EXCEPTION 'Task not found' USING ERRCODE = 'P0002';
    END IF;
    IF v_task.assignee_type <> 'volunteer' THEN
        RAISE EXCEPTION 'Only volunteer tasks can be taken up' USING ERRCODE = '42501';
    END IF;
    IF v_task.assignee_id IS NOT NULL THEN
        RAISE EXCEPTION 'Someone has already taken up this task' USING ERRCODE = '42501';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.roles
        WHERE event_id = v_task.event_id AND user_id = auth.uid() AND role_type = 'volunteer'
    ) THEN
        RAISE EXCEPTION 'Only volunteers of this event can take up its tasks' USING ERRCODE = '42501';
    END IF;

    UPDATE public.tasks
    SET assignee_id = auth.uid(), claimed_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_task_id
    RETURNING * INTO v_task;
    RETURN v_task;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_task(p_task_id UUID)
RETURNS public.tasks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_task public.tasks;
BEGIN
    SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id FOR UPDATE;
    IF v_task.id IS NULL THEN
        RAISE EXCEPTION 'Task not found' USING ERRCODE = 'P0002';
    END IF;
    IF v_task.assignee_id IS DISTINCT FROM auth.uid() OR v_task.claimed_at IS NULL THEN
        RAISE EXCEPTION 'You can only release tasks you took up' USING ERRCODE = '42501';
    END IF;
    IF v_task.status = 'done' THEN
        RAISE EXCEPTION 'Completed tasks cannot be released' USING ERRCODE = '42501';
    END IF;

    UPDATE public.tasks
    SET assignee_id = NULL, claimed_at = NULL, status = 'todo'
    WHERE id = p_task_id
    RETURNING * INTO v_task;
    RETURN v_task;
END;
$$;

REVOKE ALL ON FUNCTION public.set_task_status(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_task(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.release_task(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_task_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_task(UUID) TO authenticated;

-- 5. Device tokens: phones (Expo push tokens) and browsers (Web Push subscriptions) in one table
ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'expo';
ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS subscription JSONB DEFAULT NULL;
DO $$ BEGIN
    ALTER TABLE public.device_tokens
        ADD CONSTRAINT device_tokens_provider_check CHECK (provider IN ('expo', 'webpush'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON COLUMN public.device_tokens.fcm_token IS
    'Expo push token (provider=expo) or the Web Push endpoint URL (provider=webpush)';
COMMENT ON COLUMN public.device_tokens.subscription IS
    'Full PushSubscription JSON (endpoint + keys) for provider=webpush';

-- 6. Assignment notifications: call the edge function when a task gets a (new) assignee
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net could not be enabled here (%). Enable it under Database -> Extensions.', SQLERRM;
END $$;

-- Reads two Vault secrets you create once per project (see docs/VOLUNTEER_WIDGET_SETUP.md):
--   festflow_functions_url   e.g. https://<project-ref>.supabase.co/functions/v1
--   festflow_webhook_secret  random string, also set as WEBHOOK_SECRET on the edge function
CREATE OR REPLACE FUNCTION public.notify_task_assignee()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_url TEXT;
    v_secret TEXT;
BEGIN
    IF NEW.assignee_id IS NULL THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.assignee_id IS NOT DISTINCT FROM OLD.assignee_id THEN
        RETURN NEW;
    END IF;
    -- A volunteer taking up a task themselves doesn't need a "you've been assigned" push.
    IF NEW.assignee_id = auth.uid() THEN
        RETURN NEW;
    END IF;

    BEGIN
        SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'festflow_functions_url';
        SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'festflow_webhook_secret';

        IF v_url IS NULL OR v_secret IS NULL THEN
            RAISE NOTICE 'Task push skipped: Vault secrets festflow_functions_url / festflow_webhook_secret are not set';
            RETURN NEW;
        END IF;

        PERFORM net.http_post(
            url := rtrim(v_url, '/') || '/push-notifications',
            headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
            body := jsonb_build_object(
                'type', TG_OP,
                'table', 'tasks',
                'schema', 'public',
                'record', to_jsonb(NEW),
                'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
            )
        );
    EXCEPTION WHEN OTHERS THEN
        -- Never block task creation because a notification couldn't be queued.
        RAISE WARNING 'Task push could not be queued: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_notify_assignee ON public.tasks;
CREATE TRIGGER trg_tasks_notify_assignee
AFTER INSERT OR UPDATE OF assignee_id ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_task_assignee();

-- 7. Realtime: broadcast task changes so web dashboards and the app update without refreshing.
--    Realtime respects the SELECT policies above, so each user only receives rows they can see.
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
