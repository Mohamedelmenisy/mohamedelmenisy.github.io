// /infini-base/js/supabase.js
const SUPABASE_URL = 'https://aefiigottnlcmjzilqnh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';

// Ensure the supabase global is available from the CDN
if (typeof supabase === 'undefined') {
    console.error('Supabase CDN script not loaded!');
    // Optionally, you could try to load it dynamically or show a critical error
} else {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[supabase.js] window.supabaseClient initialized.');
}
