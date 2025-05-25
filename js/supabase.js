// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://aefiigottnlcmjzilqnh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';

let supabaseInstance;

try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[supabase.js] Supabase client initialized and exported.');
} catch (error) {
    console.error("[supabase.js] Supabase client initialization failed:", error);
    throw new Error(`Failed to initialize Supabase client: ${error.message}`);
}

export const supabase = supabaseInstance;
