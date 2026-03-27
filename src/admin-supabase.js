import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ndfxcuboxpxbbsrdvywv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZnhjdWJveHB4YmJzcmR2eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Nzk5NjAsImV4cCI6MjA4MDM1NTk2MH0.CTZw0ZAW2msl9B_mEjzTb4zzSAa9n4AW1tPkiX5qBFU";

// Create a new Supabase client for the admin section with a unique storage key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'elitenest-admin-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: window.sessionStorage
  }
});
