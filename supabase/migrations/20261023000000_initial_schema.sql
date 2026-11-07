-- ====================================================================
-- FestFlow: Complete Supabase / Postgres Schema & Row Level Security
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Events table (with soft delete)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    venue TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
    rounds JSONB NOT NULL DEFAULT '[]'::jsonb,
    seeking_sponsors BOOLEAN NOT NULL DEFAULT true,
    tracks JSONB NOT NULL DEFAULT '["General", "Web3", "AI / ML", "FinTech"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Index for soft delete and public listing
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(starts_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(visibility) WHERE deleted_at IS NULL;

-- 4. Roles table (organizer assigns or registers user to role)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    role_type TEXT NOT NULL CHECK (role_type IN ('organizer', 'volunteer', 'sponsor', 'participant')),
    role_title TEXT DEFAULT NULL, -- For volunteers, e.g. "Lead Logistics"
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, event_id, role_type)
);

-- 5. Invites table (for volunteer and participant onboarding links)
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    role_type TEXT NOT NULL CHECK (role_type IN ('volunteer', 'participant', 'sponsor')),
    role_title TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 6. Teams table (participants can create/join teams with join_code)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    join_code TEXT NOT NULL UNIQUE,
    table_number TEXT DEFAULT NULL,
    track TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Team members junction table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(team_id, user_id)
);

-- 7. Submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    repo_url TEXT NOT NULL,
    demo_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('not_submitted', 'submitted')) DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(team_id)
);

-- 8. Tasks table (reusable task widget for volunteers and sponsors)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assignee_type TEXT NOT NULL CHECK (assignee_type IN ('volunteer', 'sponsor')),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Announcements table (timestamped feed with audience filtering)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    audience TEXT NOT NULL CHECK (audience IN ('all', 'participants', 'volunteers', 'sponsors')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Judge links (token-based guest access per table or track)
CREATE TABLE IF NOT EXISTS public.judge_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    table_assignment TEXT DEFAULT NULL, -- e.g. "Table 1-5" or specific table
    track_assignment TEXT DEFAULT NULL, -- e.g. "AI / ML"
    judge_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Marks table
CREATE TABLE IF NOT EXISTS public.marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judge_link_id UUID NOT NULL REFERENCES public.judge_links(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    round TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    criteria JSONB DEFAULT '{"innovation": 25, "technical": 25, "design": 25, "impact": 25}'::jsonb,
    notes TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(judge_link_id, submission_id, round)
);

-- 12. Sponsorship applications
CREATE TABLE IF NOT EXISTS public.sponsorship_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    sponsor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('applied', 'under_review', 'confirmed')) DEFAULT 'applied',
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_applications ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RLS Policies
-- ====================================================================

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- EVENTS
-- Anyone can view public active events. Event members or organizers can view private active events.
CREATE POLICY "Public active events are viewable by everyone" 
ON public.events FOR SELECT 
USING (
    deleted_at IS NULL AND (
        visibility = 'public' 
        OR organizer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.roles WHERE roles.event_id = events.id AND roles.user_id = auth.uid())
    )
);

CREATE POLICY "Organizers can create events" 
ON public.events FOR INSERT 
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own events" 
ON public.events FOR UPDATE 
USING (auth.uid() = organizer_id AND deleted_at IS NULL);

-- Soft delete policy
CREATE POLICY "Organizers can soft delete their events" 
ON public.events FOR UPDATE 
USING (auth.uid() = organizer_id);

-- ROLES
CREATE POLICY "Users can view roles for events they participate in" 
ON public.roles FOR SELECT 
USING (
    user_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.events WHERE events.id = roles.event_id AND events.organizer_id = auth.uid())
);

CREATE POLICY "Organizers can manage roles" 
ON public.roles FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = roles.event_id AND events.organizer_id = auth.uid())
);

-- INVITES
CREATE POLICY "Organizers can manage invites" 
ON public.invites FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = invites.event_id AND events.organizer_id = auth.uid())
);

CREATE POLICY "Anyone with invite token can read invite" 
ON public.invites FOR SELECT 
USING (expires_at > NOW());

-- TEAMS
CREATE POLICY "Event participants and organizers can view teams" 
ON public.teams FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = teams.event_id AND (
        events.organizer_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM public.roles WHERE roles.event_id = events.id AND roles.user_id = auth.uid())
    ))
);

CREATE POLICY "Participants can create teams" 
ON public.teams FOR INSERT 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.roles WHERE roles.event_id = teams.event_id AND roles.user_id = auth.uid() AND roles.role_type = 'participant')
);

CREATE POLICY "Team members can update their team" 
ON public.teams FOR UPDATE 
USING (
    EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.events WHERE events.id = teams.event_id AND events.organizer_id = auth.uid())
);

-- TEAM MEMBERS
CREATE POLICY "Team members viewable by event participants" 
ON public.team_members FOR SELECT USING (true);

CREATE POLICY "Users can join team" 
ON public.team_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- SUBMISSIONS
CREATE POLICY "Submissions viewable by organizers, judges and participants" 
ON public.submissions FOR SELECT USING (true);

CREATE POLICY "Team members can insert/update submission" 
ON public.submissions FOR INSERT 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = submissions.team_id AND team_members.user_id = auth.uid())
);

CREATE POLICY "Team members can update submission" 
ON public.submissions FOR UPDATE 
USING (
    EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = submissions.team_id AND team_members.user_id = auth.uid())
);

-- TASKS
CREATE POLICY "Tasks viewable by event organizer and assigned user" 
ON public.tasks FOR SELECT 
USING (
    assignee_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.organizer_id = auth.uid())
);

CREATE POLICY "Organizers can create and manage tasks" 
ON public.tasks FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.organizer_id = auth.uid())
);

CREATE POLICY "Assignees can update status of their tasks" 
ON public.tasks FOR UPDATE 
USING (assignee_id = auth.uid()) 
WITH CHECK (assignee_id = auth.uid());

-- ANNOUNCEMENTS
CREATE POLICY "Announcements viewable based on role" 
ON public.announcements FOR SELECT 
USING (
    audience = 'all'
    OR EXISTS (
        SELECT 1 FROM public.roles 
        WHERE roles.event_id = announcements.event_id 
        AND roles.user_id = auth.uid() 
        AND (
            (announcements.audience = 'participants' AND roles.role_type = 'participant') OR
            (announcements.audience = 'volunteers' AND roles.role_type = 'volunteer') OR
            (announcements.audience = 'sponsors' AND roles.role_type = 'sponsor')
        )
    )
    OR EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = announcements.event_id AND events.organizer_id = auth.uid()
    )
);

CREATE POLICY "Organizers can post announcements" 
ON public.announcements FOR INSERT 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = announcements.event_id AND events.organizer_id = auth.uid())
);

-- JUDGE LINKS & MARKS
-- Judge link token validated via secure RPC function
CREATE POLICY "Organizers can manage judge links" 
ON public.judge_links FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = judge_links.event_id AND events.organizer_id = auth.uid())
);

CREATE POLICY "Marks viewable by organizers and judge token" 
ON public.marks FOR SELECT USING (true);

CREATE POLICY "Marks manageable by organizers" 
ON public.marks FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.judge_links jl 
        JOIN public.events e ON e.id = jl.event_id 
        WHERE jl.id = marks.judge_link_id AND e.organizer_id = auth.uid()
    )
);

-- SPONSORSHIP APPLICATIONS
CREATE POLICY "Sponsors can view and create their applications" 
ON public.sponsorship_applications FOR SELECT 
USING (
    sponsor_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.events WHERE events.id = sponsorship_applications.event_id AND events.organizer_id = auth.uid())
);

CREATE POLICY "Sponsors can submit applications" 
ON public.sponsorship_applications FOR INSERT 
WITH CHECK (sponsor_id = auth.uid());

CREATE POLICY "Organizers can update sponsorship status" 
ON public.sponsorship_applications FOR UPDATE 
USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = sponsorship_applications.event_id AND events.organizer_id = auth.uid())
);

-- ====================================================================
-- Stored Procedures / RPC Functions
-- ====================================================================

-- 1. Verify judge link token and rate limit
CREATE OR REPLACE FUNCTION public.verify_judge_token(p_token TEXT)
RETURNS TABLE (
    valid BOOLEAN,
    judge_link_id UUID,
    event_id UUID,
    judge_name TEXT,
    table_assignment TEXT,
    track_assignment TEXT,
    event_name TEXT,
    rounds JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true AS valid,
        jl.id AS judge_link_id,
        jl.event_id,
        jl.judge_name,
        jl.table_assignment,
        jl.track_assignment,
        e.name AS event_name,
        e.rounds
    FROM public.judge_links jl
    JOIN public.events e ON e.id = jl.event_id
    WHERE jl.token = p_token AND e.deleted_at IS NULL;
END;
$$;

-- 2. Upsert Judge Marks (Autosave with token validation)
CREATE OR REPLACE FUNCTION public.save_judge_mark(
    p_token TEXT,
    p_submission_id UUID,
    p_round TEXT,
    p_score NUMERIC,
    p_notes TEXT,
    p_criteria JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_judge_link_id UUID;
    v_mark_id UUID;
BEGIN
    SELECT id INTO v_judge_link_id FROM public.judge_links WHERE token = p_token;
    IF v_judge_link_id IS NULL THEN
        RAISE EXCEPTION 'Invalid judge token';
    END IF;

    INSERT INTO public.marks (judge_link_id, submission_id, round, score, notes, criteria, updated_at)
    VALUES (v_judge_link_id, p_submission_id, p_round, p_score, p_notes, p_criteria, NOW())
    ON CONFLICT (judge_link_id, submission_id, round)
    DO UPDATE SET 
        score = EXCLUDED.score,
        notes = EXCLUDED.notes,
        criteria = EXCLUDED.criteria,
        updated_at = NOW()
    RETURNING id INTO v_mark_id;

    RETURN jsonb_build_object('success', true, 'mark_id', v_mark_id);
END;
$$;
