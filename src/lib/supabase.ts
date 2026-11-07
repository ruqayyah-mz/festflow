import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const forceMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const isLiveSupabaseConfigured = Boolean(
  !forceMock && supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')
);

// One sign-in per browser tab, so a demo can run a tab per role. Kept in sessionStorage (survives reloads,
// not shared with other tabs); the per-tab key also gives each tab its own Supabase cross-tab channel,
// so signing in/out in one tab never switches the account of another.
function tabStorageKey() {
  let id = sessionStorage.getItem('festflow_tab_id');
  if (!id) sessionStorage.setItem('festflow_tab_id', (id = crypto.randomUUID()));
  return `festflow-auth-${id}`;
}

export const supabase = isLiveSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: window.sessionStorage,
        storageKey: tabStorageKey(),
      },
    })
  : null;
