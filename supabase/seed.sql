-- ====================================================================
-- FestFlow: Demo Seed Data (Updated with Phase 2 Schema)
-- ====================================================================

-- Demo Organizer User UUID
-- 00000000-0000-0000-0000-000000000001
INSERT INTO public.profiles (id, full_name)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Alex Rivera (Lead Organizer)'),
    ('00000000-0000-0000-0000-000000000002', 'Sarah Chen (Volunteer Coordinator)'),
    ('00000000-0000-0000-0000-000000000003', 'Elena Rostova (DevRel Sponsor)'),
    ('00000000-0000-0000-0000-000000000004', 'David Kim (Team Lead Participant)')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Demo Event
INSERT INTO public.events (
    id, 
    organizer_id, 
    name, 
    description, 
    venue, 
    starts_at, 
    ends_at, 
    visibility, 
    seeking_sponsors,
    rounds,
    tracks
) VALUES (
    'e0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'National Builder HackFest 2026',
    'The flagship 36-hour collegiate builder hackathon. 500+ builders tackling AI, Web3, and Open Infrastructure challenges.',
    'Grand Innovation Arena, Floor 3 & Virtual Discord',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '2 days',
    'public',
    true,
    '[
        {"id": "r1", "name": "Round 1: Idea Validation & Pitch", "weight": 25, "active": false},
        {"id": "r2", "name": "Round 2: Technical Prototype Review", "weight": 35, "active": true},
        {"id": "r3", "name": "Round 3: Grand Stage Finals", "weight": 40, "active": false}
    ]'::jsonb,
    '["AI / ML Systems", "Decentralized Web", "Developer Tooling", "Social Impact"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    venue = EXCLUDED.venue,
    seeking_sponsors = EXCLUDED.seeking_sponsors,
    rounds = EXCLUDED.rounds,
    tracks = EXCLUDED.tracks;

-- Roles for event
INSERT INTO public.roles (user_id, event_id, role_type, role_title) VALUES
    ('00000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'organizer', 'Lead Director'),
    ('00000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'volunteer', 'Volunteer Lead & Logistics'),
    ('00000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'sponsor', 'Tier 1 Platinum Partner'),
    ('00000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'participant', 'Hacker')
ON CONFLICT (user_id, event_id, role_type) DO UPDATE SET role_title = EXCLUDED.role_title;

-- Demo Invites
INSERT INTO public.invites (id, event_id, token, role_type, role_title, expires_at) VALUES
    ('i0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'vol-cq26-lead', 'volunteer', 'Registration & Badging Lead', NOW() + INTERVAL '7 days'),
    ('i0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'vol-cq26-tech', 'volunteer', 'Hardware & Network Support', NOW() + INTERVAL '7 days')
ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at;

-- Teams
INSERT INTO public.teams (id, event_id, name, join_code, table_number, track) VALUES
    ('t0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'NeuralNomads', 'CQ-7701', 'Table 14', 'AI / ML Systems'),
    ('t0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'BlockForge', 'CQ-8822', 'Table 15', 'Decentralized Web'),
    ('t0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'ZeroLag Devs', 'CQ-9933', 'Table 16', 'Developer Tooling')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, table_number = EXCLUDED.table_number, track = EXCLUDED.track;

-- Team members
INSERT INTO public.team_members (team_id, user_id) VALUES
    ('t0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Submissions
INSERT INTO public.submissions (id, team_id, event_id, title, description, repo_url, demo_url, status, submitted_at) VALUES
    (
        's0000000-0000-0000-0000-000000000001',
        't0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000001',
        'PulseAI: Emergency Medical Dispatcher Copilot',
        'Low-latency acoustic emotion and symptom detection agent for emergency call centers.',
        'https://github.com/festflow-builders/pulse-ai',
        'https://pulseai.demo.festflow.dev',
        'submitted',
        NOW() - INTERVAL '4 hours'
    ),
    (
        's0000000-0000-0000-0000-000000000002',
        't0000000-0000-0000-0000-000000000002',
        'e0000000-0000-0000-0000-000000000001',
        'ChainAudit: Autonomous Smart Contract Formal Verification',
        'Real-time symbolic execution and formal verification tool for Solidity EVM bytecodes.',
        'https://github.com/festflow-builders/chain-audit',
        'https://chainaudit.xyz',
        'submitted',
        NOW() - INTERVAL '2 hours'
    )
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Tasks for volunteers & sponsors (with completed_at)
INSERT INTO public.tasks (id, event_id, assignee_id, assignee_type, title, description, status, due_at, completed_at) VALUES
    ('k0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'volunteer', 'Coordinate Midnight Snack Delivery', 'Distribute energy bars and sponsor swag to Tables 1 to 20.', 'done', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '45 minutes'),
    ('k0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'volunteer', 'Check Table Wi-Fi signal & Power strips', 'Verify that all rows have adequate 240V power surge protectors.', 'in_progress', NOW() + INTERVAL '2 hours', NULL),
    ('k0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'sponsor', 'Submit Workshop Slides & API Credits Voucher', 'Upload presentation slides for the 2:00 PM Tech Talk on Edge AI.', 'todo', NOW() + INTERVAL '4 hours', NULL)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, completed_at = EXCLUDED.completed_at;

-- Announcements (with title and message)
INSERT INTO public.announcements (id, event_id, audience, title, message, created_at) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'all', 'Opening Ceremony Ready', 'Welcome to National Builder HackFest 2026! Opening ceremony starts in Main Auditorium at 10:00 AM.', NOW() - INTERVAL '24 hours'),
    ('a0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'participants', 'Round 2 Technical Review', 'Round 2 Technical Prototype reviews start at 3:00 PM. Please ensure your GitHub repo is public.', NOW() - INTERVAL '3 hours'),
    ('a0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'volunteers', 'Volunteer Floor Briefing', 'All volunteers meet at Help Desk A for brief sync regarding dinner distribution logistics.', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message;

-- Judge Links
INSERT INTO public.judge_links (id, event_id, token, table_assignment, track_assignment, judge_name) VALUES
    ('j0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'judge-table-14-15', 'Table 14 - 15', 'AI & Decentralized Web', 'Dr. Marcus Vance (Staff Architect)'),
    ('j0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'judge-all-tracks', 'Tables 1 - 20', 'All Tracks', 'Priya Raman (Partner, Venture Capital)')
ON CONFLICT (token) DO UPDATE SET table_assignment = EXCLUDED.table_assignment;

-- Sponsorship Applications
INSERT INTO public.sponsorship_applications (id, event_id, sponsor_id, status, form_data) VALUES
    (
        'p0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000003',
        'confirmed',
        '{"company_name": "CloudNova Labs", "tier": "Gold ($5,000)", "contact_email": "sponsors@cloudnova.io", "perks_offered": "$20,000 in GPU cloud credits for all participants + fast-track interviews.", "requirements": "Booth space in primary foyer and 30-min technical keynote slot."}'::jsonb
    )
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;
