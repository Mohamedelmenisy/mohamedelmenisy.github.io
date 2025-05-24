(function() {
    // Check if the CDN import's createClient function is available
    if (typeof supabase === 'undefined' || typeof supabase.createClient === 'undefined') {
        console.error("Supabase SDK (supabase.createClient) not loaded from CDN. Ensure the import works.");
        // If createClient was expected to be global directly (less common for Supabase v2 CDN)
        if (typeof createClient === 'undefined') {
             console.error("Global createClient function also not found.");
        }
        return;
    }

    const supabaseUrl = 'https://aefiigottnlcmjzilqnh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase URL or Anon Key is missing. Make sure they are correctly set in supabase.js");
        return;
    }

    // Create the Supabase client and attach it to the window object
    // The CDN loads a 'supabase' object which has the 'createClient' method.
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey); // Changed to window.supabaseClient
    console.log("[supabase.js] Supabase client initialized and attached to window.supabaseClient");
})();
