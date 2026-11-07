import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const forceMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const isLiveSupabaseConfigured = Boolean(
  !forceMock && supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')
);

export const supabase = isLiveSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
