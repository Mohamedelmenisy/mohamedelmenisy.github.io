// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aefiigottnlcmjzilqnh.supabase.co'; // 👈 بياناتك هنا
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4'; // 👈 بياناتك هنا

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing. Make sure they are correctly set in supabase.js");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
