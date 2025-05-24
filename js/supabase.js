(function() {
    // Check if the CDN import is available (for debugging purposes)
    if (typeof createClient === 'undefined') {
        console.error("Supabase SDK not loaded from CDN. Ensure the import works or use a local file.");
        return;
    }

    const supabaseUrl = 'https://aefiigottnlcmjzilqnh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase URL or Anon Key is missing. Make sure they are correctly set in supabase.js");
        return;
    }

    // Create the Supabase client and attach it to the window object
    window.supabase = createClient(supabaseUrl, supabaseAnonKey);
})();
