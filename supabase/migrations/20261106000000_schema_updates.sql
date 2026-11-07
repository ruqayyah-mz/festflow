-- ====================================================================
-- FestFlow: Additive Schema Updates (Phase 2)
-- ====================================================================

-- 1. Add completed_at to tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add title to announcements
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Announcement';

-- 3. Device tokens table for FCM Push Notifications
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, fcm_token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.device_tokens(user_id);

-- 4. Enable RLS on device_tokens
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own device tokens" 
ON public.device_tokens FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Automatic completed_at trigger for tasks
CREATE OR REPLACE FUNCTION public.handle_task_status_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done' OR NEW.completed_at IS NULL) THEN
        NEW.completed_at = TIMEZONE('utc'::text, NOW());
    ELSIF NEW.status != 'done' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_task_status_update ON public.tasks;
CREATE TRIGGER trg_task_status_update
BEFORE UPDATE OR INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_task_status_update();

-- 6. Enhanced Judge Token Validation & Submission Filtering RPC
CREATE OR REPLACE FUNCTION public.get_judge_evaluation_bundle(p_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_link RECORD;
    v_event RECORD;
    v_submissions JSONB;
BEGIN
    SELECT * INTO v_link FROM public.judge_links WHERE token = p_token;
    IF v_link.id IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Token invalid or expired');
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = v_link.event_id AND deleted_at IS NULL;
    IF v_event.id IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Associated event is not active');
    END IF;

    -- Query submissions filtered by table/track assignment
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'team_id', s.team_id,
            'title', s.title,
            'description', s.description,
            'repo_url', s.repo_url,
            'demo_url', s.demo_url,
            'status', s.status,
            'team_name', t.name,
            'table_number', t.table_number,
            'track', t.track
        )
    ) INTO v_submissions
    FROM public.submissions s
    JOIN public.teams t ON t.id = s.team_id
    WHERE s.event_id = v_link.event_id
      AND (
          v_link.table_assignment IS NULL 
          OR lower(v_link.table_assignment) LIKE '%all%' 
          OR t.table_number IS NULL
          OR position(t.table_number in v_link.table_assignment) > 0
      );

    RETURN jsonb_build_object(
        'valid', true,
        'judge_link', jsonb_build_object(
            'id', v_link.id,
            'judge_name', v_link.judge_name,
            'table_assignment', v_link.table_assignment,
            'track_assignment', v_link.track_assignment
        ),
        'event', jsonb_build_object(
            'id', v_event.id,
            'name', v_event.name,
            'rounds', v_event.rounds
        ),
        'submissions', COALESCE(v_submissions, '[]'::jsonb)
    );
END;
$$;

-- ====================================================================
-- Security Audit & RLS Hardening (Tightening Overly Permissive Policies)
-- ====================================================================

-- 7. Tighten Submissions SELECT policy to prevent private event leakage
DROP POLICY IF EXISTS "Submissions viewable by organizers, judges and participants" ON public.submissions;
CREATE POLICY "Submissions viewable for active public events or event members" 
ON public.submissions FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = submissions.event_id 
          AND (
              events.visibility = 'public' 
              OR events.organizer_id = auth.uid() 
              OR EXISTS (SELECT 1 FROM public.roles WHERE roles.event_id = events.id AND roles.user_id = auth.uid())
          )
    )
);

-- 8. Restrict direct Marks SELECT to event organizers (Judges evaluate via SECURITY DEFINER RPCs)
DROP POLICY IF EXISTS "Marks viewable by organizers and judge token" ON public.marks;
CREATE POLICY "Marks viewable by organizers only" 
ON public.marks FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.judge_links jl 
        JOIN public.events e ON e.id = jl.event_id 
        WHERE jl.id = marks.judge_link_id AND e.organizer_id = auth.uid()
    )
);

