// js/supabase.js
    const SUPABASE_URL = 'https://aefiigottnlcmjzilqnh.supabase.co'; // استبدل هذا
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4'; // استبدل هذا

    // Check if Supabase client library is loaded
    if (typeof supabase === 'undefined' || typeof supabase.createClient === 'undefined') {
        console.error("Supabase client library not found. Make sure it's loaded before supabase.js");
        // You might want to throw an error or handle this more gracefully
    }

    // Export the client directly
    export const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
