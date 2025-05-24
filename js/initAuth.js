// js/initAuth.js
const SUPABASE_URL = 'https://aefiigottnlcmjzilqnh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';
const supabaseSdkUrl = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; // تعريف الرابط هنا

function handleSupabaseLoadError(specificError = "") {
    let errorMessage = 'CRITICAL: Supabase SDK could not be initialized when initAuth.js was executed.';
    if (specificError) {
        errorMessage += ` Details: ${specificError}`;
    }
    console.error(errorMessage);
    const pElement = document.querySelector('.loading-container p');
    if (pElement) {
        pElement.textContent = `Error initializing application. Failed to load Supabase SDK from ${supabaseSdkUrl}. Please check your internet connection and try refreshing.`;
    }
}

function initializeApp() {
    console.log('Supabase SDK is available. Initializing Supabase client in initAuth.js.');
    const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    async function checkAuthStatusAndRedirect() {
        console.log('initAuth.js: Checking authentication status...');
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('Error getting session in initAuth.js:', sessionError.message);
                window.location.replace('signup.html');
                return;
            }

            if (session) {
                console.log('User is authenticated (session active). Redirecting to dashboard.html from initAuth.js');
                window.location.replace('dashboard.html');
            } else {
                console.log('User is NOT authenticated (no active session). Redirecting to signup.html from initAuth.js');
                window.location.replace('signup.html');
            }
        } catch (error) {
            console.error('Critical error during auth check in initAuth.js:', error.message);
            window.location.replace('signup.html');
        }
    }
    checkAuthStatusAndRedirect();
}

// ---- Main Execution Logic ----
if (typeof Supabase === 'undefined' || typeof Supabase.createClient !== 'function') {
    console.warn(`Supabase not immediately available. Checking if SDK script (from ${supabaseSdkUrl}) loaded. Will retry after a short delay...`);
    
    // محاولة إضافية للتحقق إذا كان السكريبت موجودًا في DOM ولكنه لم يُنفذ بعد
    let sdkScriptLoaded = false;
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src === supabaseSdkUrl) {
            sdkScriptLoaded = true;
            break;
        }
    }

    if (!sdkScriptLoaded) {
        handleSupabaseLoadError(`SDK script tag for ${supabaseSdkUrl} not found in DOM.`);
    } else {
        setTimeout(() => {
            if (typeof Supabase === 'undefined' || typeof Supabase.createClient !== 'function') {
                handleSupabaseLoadError('Supabase object still not available after delay.');
            } else {
                initializeApp();
            }
        }, 700); // زيادة طفيفة في التأخير
    }
} else {
    initializeApp();
}
