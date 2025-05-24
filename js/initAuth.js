// js/initAuth.js
const SUPABASE_URL = 'https://aefiigottnlcmjzilqnh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';

// دالة لإظهار رسالة خطأ إذا لم يتم تحميل Supabase
function handleSupabaseLoadError() {
    console.error('CRITICAL: Supabase SDK could not be initialized when initAuth.js was executed.');
    const pElement = document.querySelector('.loading-container p');
    if (pElement) {
        pElement.textContent = 'Error initializing application. Supabase SDK failed to load. Please check your internet connection and try refreshing.';
    }
    // لا تفعل شيئًا آخر إذا لم يتم تحميل Supabase
}

// تحقق من وجود كائن Supabase العالمي
if (typeof Supabase === 'undefined' || typeof Supabase.createClient !== 'function') {
    // إذا لم يكن Supabase متاحًا على الفور، انتظر قليلاً ثم حاول مرة أخرى.
    // هذا حل بديل إذا كان DOMContentLoaded و defer لا يكفيان دائمًا لـ CDN.
    console.warn('Supabase not immediately available, will retry after a short delay...');
    setTimeout(() => {
        if (typeof Supabase === 'undefined' || typeof Supabase.createClient !== 'function') {
            handleSupabaseLoadError();
            return; // لا تتابع إذا فشل التحميل
        }
        initializeApp();
    }, 500); // انتظر نصف ثانية ثم حاول مرة أخرى
} else {
    initializeApp(); // إذا كان متاحًا، قم بتهيئة التطبيق مباشرة
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
                // افترض أن الخطأ يعني عدم تسجيل الدخول وتوجه إلى signup
                window.location.replace('signup.html'); // تأكد من أن هذا المسار صحيح
                return;
            }

            if (session) {
                console.log('User is authenticated (session active). Redirecting to dashboard.html from initAuth.js');
                window.location.replace('dashboard.html'); // تأكد من أن هذا المسار صحيح
            } else {
                console.log('User is NOT authenticated (no active session). Redirecting to signup.html from initAuth.js');
                window.location.replace('signup.html'); // تأكد من أن هذا المسار صحيح
            }
        } catch (error) {
            console.error('Critical error during auth check in initAuth.js:', error.message);
            // كإجراء احتياطي، توجه إلى signup
            window.location.replace('signup.html');
        }
    }

    checkAuthStatusAndRedirect();
}
