import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vcqvqlicendactenwtwy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcXZxbGljZW5kYWN0ZW53dHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTE0NzksImV4cCI6MjEwMzU2NzQ3OX0.sGlIuCzPc5z_bG_wuC08WKiSGNSjxyyy2yU7UD4ke88';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
