-- 1. Live updates on the website/app for more than tasks (applications, approvals, events, announcements).
--    Realtime respects each table's SELECT policy, so people only receive rows they can already see.
DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['volunteer_applications', 'roles', 'events', 'announcements'] LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END LOOP;
END $$;

-- 2. Push when a volunteer task becomes open (created unassigned, or released back): the edge function
--    notifies the event's volunteers. Assignment pushes are unchanged.
CREATE OR REPLACE FUNCTION public.notify_task_assignee()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_url TEXT;
    v_secret TEXT;
BEGIN
    IF NEW.assignee_id IS NULL THEN
        -- Open task: only volunteer tasks, and only when it just became open.
        IF NEW.assignee_type <> 'volunteer'
           OR (TG_OP = 'UPDATE' AND OLD.assignee_id IS NULL) THEN
            RETURN NEW;
        END IF;
    ELSE
        IF TG_OP = 'UPDATE' AND NEW.assignee_id IS NOT DISTINCT FROM OLD.assignee_id THEN
            RETURN NEW;
        END IF;
        -- A volunteer taking up a task themselves doesn't need a "you've been assigned" push.
        IF NEW.assignee_id = auth.uid() THEN
            RETURN NEW;
        END IF;
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
