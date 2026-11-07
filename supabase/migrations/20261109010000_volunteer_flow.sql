-- Volunteer flow in Supabase: organizer creates an event -> volunteer applies -> organizer accepts
-- -> volunteer gets a role on the event (which is what the phone app and widget key off).

-- 1. Event settings the web app already uses (they only lived in the browser before).
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS volunteer_policy TEXT DEFAULT 'my_team';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS volunteer_form JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS participation_type TEXT DEFAULT 'team';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS team_size_min INT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS team_size_max INT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location_mode TEXT DEFAULT 'offline';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS criteria JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS participant_registration_deadline TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS participant_registration_closed BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS volunteer_application_deadline TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS volunteer_applications_closed BOOLEAN DEFAULT false;

-- 2. Volunteer applications.
CREATE TABLE IF NOT EXISTS public.volunteer_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT,
    role_title TEXT,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants and organizers can view applications" ON public.volunteer_applications;
CREATE POLICY "Applicants and organizers can view applications"
ON public.volunteer_applications FOR SELECT
USING (user_id = auth.uid() OR public.is_event_organizer(event_id));

-- Volunteers apply only as themselves, only as 'pending', only while the event is open to volunteers.
DROP POLICY IF EXISTS "Volunteers can apply for themselves" ON public.volunteer_applications;
CREATE POLICY "Volunteers can apply for themselves"
ON public.volunteer_applications FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id
          AND e.deleted_at IS NULL
          AND e.volunteer_policy = 'open'
          AND NOT COALESCE(e.volunteer_applications_closed, false)
          AND (e.volunteer_application_deadline IS NULL OR e.volunteer_application_deadline > NOW())
          AND e.starts_at > NOW()
    )
);
-- No UPDATE/DELETE policies: decisions go through decide_volunteer_application() below.

-- 3. Accept/reject + create the volunteer role atomically (organizer of that event only).
CREATE OR REPLACE FUNCTION public.decide_volunteer_application(p_app_id UUID, p_status TEXT)
RETURNS public.volunteer_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_app public.volunteer_applications;
BEGIN
    IF p_status NOT IN ('accepted', 'rejected') THEN
        RAISE EXCEPTION 'Status must be accepted or rejected' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO v_app FROM public.volunteer_applications WHERE id = p_app_id FOR UPDATE;
    IF v_app.id IS NULL THEN
        RAISE EXCEPTION 'Volunteer application not found' USING ERRCODE = 'P0002';
    END IF;
    IF NOT public.is_event_organizer(v_app.event_id) THEN
        RAISE EXCEPTION 'Only the event organizer can decide applications' USING ERRCODE = '42501';
    END IF;
    IF v_app.status <> 'pending' THEN
        RAISE EXCEPTION 'Application is already %', v_app.status USING ERRCODE = '42501';
    END IF;
    IF EXISTS (SELECT 1 FROM public.events WHERE id = v_app.event_id AND starts_at <= NOW()) THEN
        RAISE EXCEPTION 'The event has started, so applications are locked' USING ERRCODE = '42501';
    END IF;

    UPDATE public.volunteer_applications SET status = p_status WHERE id = p_app_id RETURNING * INTO v_app;

    IF p_status = 'accepted' AND NOT EXISTS (
        SELECT 1 FROM public.roles
        WHERE event_id = v_app.event_id AND user_id = v_app.user_id AND role_type = 'volunteer'
    ) THEN
        INSERT INTO public.roles (user_id, event_id, role_type, role_title)
        VALUES (v_app.user_id, v_app.event_id, 'volunteer', COALESCE(v_app.role_title, 'General Volunteer'));
    END IF;
    RETURN v_app;
END;
$$;

REVOKE ALL ON FUNCTION public.decide_volunteer_application(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_volunteer_application(UUID, TEXT) TO authenticated;
