// js/initAuth.js
const SUPABASE_URL = 'https://aefiigottnlcmjzilqnh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';

if (typeof Supabase === 'undefined' || typeof Supabase.createClient === 'undefined') {
    console.error('CRITICAL: Supabase SDK not loaded or createClient is not a function when initAuth.js is executed.');
    const pElement = document.querySelector('.loading-container p');
    if (pElement) {
        pElement.textContent = 'Error initializing application. Supabase SDK failed to load. Please check your internet connection and try refreshing.';
    }
    // لا تفعل شيئًا آخر إذا لم يتم تحميل Supabase
    throw new Error("Supabase SDK not available for initAuth.js"); 
}

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAuthStatusAndRedirect() {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('Error getting session in initAuth.js:', sessionError);
            window.location.replace('signup.html');
            return;
        }

        if (session) {
            console.log('User is authenticated (session exists in initAuth.js). Redirecting to dashboard.html');
            window.location.replace('dashboard.html');
        } else {
            console.log('User is not authenticated (no session in initAuth.js). Redirecting to signup.html');
            window.location.replace('signup.html');
        }
    } catch (error) {
        console.error('Critical error during auth check in initAuth.js:', error);
        window.location.replace('signup.html'); // Fallback
    }
}

// استدعاء الدالة مباشرة لأن هذا السكريبت سيتم تحميله بـ defer
checkAuthStatusAndRedirect();
