-- Announcements posted on the web now live in Supabase (not just the browser), so the phone app can show them.
-- 1. The web/app always had a title; the table didn't.
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';

-- 2. Push new announcements through the same edge function as tasks (it already handles table = 'announcements').
CREATE OR REPLACE FUNCTION public.notify_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_url TEXT;
    v_secret TEXT;
BEGIN
    BEGIN
        SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'festflow_functions_url';
        SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'festflow_webhook_secret';
        IF v_url IS NULL OR v_secret IS NULL THEN
            RETURN NEW;
        END IF;
        PERFORM net.http_post(
            url := rtrim(v_url, '/') || '/push-notifications',
            headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
            body := jsonb_build_object('type', 'INSERT', 'table', 'announcements', 'schema', 'public', 'record', to_jsonb(NEW))
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Announcement push could not be queued: %', SQLERRM; -- never block posting
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_announcements_notify ON public.announcements;
CREATE TRIGGER trg_announcements_notify
AFTER INSERT ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.notify_announcement();
