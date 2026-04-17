// /src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// 这里读取的是在 Render 后端界面设置的环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase keys missing, ensure they are set in Environment Variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);