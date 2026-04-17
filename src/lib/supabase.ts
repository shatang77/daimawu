import { createClient } from '@supabase/supabase-js';

// Fallback to hardcoded variables if .env fails, for immediate troubleshooting
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

// Auto-correct if user only pasted the project ID
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  // If they pasted just "hgidgvsxtcfllahwxwzh", convert to the full URL
  if (supabaseUrl.length === 20 && !supabaseUrl.includes('.')) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
  } else {
    supabaseUrl = `https://${supabaseUrl}`; // Fallback best effort
  }
}

let client = null;
export let supabaseError = null;

try {
  if (supabaseUrl.startsWith('http') && supabaseKey) {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    if (typeof window !== 'undefined') window.localStorage.removeItem('temp_sb_err'); // Clear error on success
  } else if (supabaseUrl || supabaseKey) {
    supabaseError = "未检测到有效的配置，请检查您的设置。";
    if (typeof window !== 'undefined') window.localStorage.setItem('temp_sb_err', supabaseError);
  }
} catch (e: any) {
  console.warn('Supabase initialization failed. Displaying setup UI.', e);
  supabaseError = e?.message || String(e);
  if (typeof window !== 'undefined') window.localStorage.setItem('temp_sb_err', supabaseError);
}

export const supabase = client;
