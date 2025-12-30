// src/supabase.js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://ndfxcuboxpxbbsrdvywv.supabase.co",    // Replace
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZnhjdWJveHB4YmJzcmR2eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Nzk5NjAsImV4cCI6MjA4MDM1NTk2MH0.CTZw0ZAW2msl9B_mEjzTb4zzSAa9n4AW1tPkiX5qBFU"                     // Replace
);
