// js/auth.js
import { supabase } from './supabase.js'; // تأكد أن المسار صحيح

const Auth = {
    signup: async function(fullName, email, password) {
        const normalizedEmail = email.trim().toLowerCase();

        if (!fullName || !password) {
            alert('Full name and password are required for signup.');
            console.warn('Signup attempt with missing full name or password.');
            return { user: null, error: { message: 'Full name and password are required.' }};
        }

        const expectedDomain = '@thecehfz.com';
        if (!normalizedEmail.endsWith(expectedDomain.toLowerCase())) {
            alert(`Please use a valid work email ending with ${expectedDomain}.`);
            console.warn(`Signup attempt with invalid domain: ${normalizedEmail}`);
            return { user: null, error: { message: `Invalid email domain. Must be ${expectedDomain}.` }};
        }

        // Supabase handles checking if user exists automatically during signUp
        // The 'data' object in options will be stored in raw_user_meta_data in auth.users
        // Our trigger will then use this to populate the 'name' column in public.users
        const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: password,
            options: {
                data: {
                    full_name: fullName.trim()
                }
            }
        });

        if (error) {
            alert(`Signup failed: ${error.message}`);
            console.error('Signup error:', error);
            if (error.message.includes("User already registered")) {
                 window.location.href = 'login.html'; // Redirect if user exists
            }
            return { user: null, error };
        }

        if (data.user && data.user.identities && data.user.identities.length === 0) {
            // This case can happen if email confirmation is required and user is already "soft" registered
            // but hasn't confirmed. Supabase might return a user object but indicate action is needed.
            alert('A user with this email may already exist or require confirmation. Please try logging in or check your email.');
            console.log('Signup response indicates possible existing user or confirmation needed:', data);
             window.location.href = 'login.html';
            return { user: data.user, error: { message: 'User may exist or require confirmation.'} };
        }

        // If email confirmation is enabled in Supabase Auth settings,
        // data.user will be non-null, but data.session will be null.
        if (data.user && !data.session) {
             alert('Signup successful! Please check your email to confirm your account before logging in.');
             console.log('User signed up, confirmation email sent:', data.user);
             // No automatic login, user needs to confirm first.
             // Redirect to login or a page saying "check your email".
             window.location.href = 'login.html'; // Or a specific "check email" page
             return { user: data.user, error: null };
        }
        
        // If email confirmation is NOT required, or for some providers, session might be created.
        // However, standard Supabase email/password signup often requires confirmation.
        // The trigger `handle_new_user` will create the entry in `public.users`.
        alert('Signup successful! Please login.'); // Or redirect to login
        console.log('User signed up:', data.user);
        window.location.href = 'login.html';
        return { user: data.user, error: null };
    },

    login: async function(email, password) { // rememberMe is not directly used by Supabase client like this
        const normalizedEmail = email.trim().toLowerCase();

        const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: password,
        });

        if (error) {
            alert(`Login failed: ${error.message}`);
            console.error('Login error:', error);
            return { user: null, session: null, error };
        }

        if (data.user && data.session) {
            console.log('Login successful for:', data.user.email);
            // Supabase client automatically handles session persistence (localStorage by default)
            // No need for manual sessionData or rememberMe logic here for basic setup
            window.location.href = 'index.html'; // Redirect to index, which should then go to dashboard
            return { user: data.user, session: data.session, error: null };
        }
        // Should not happen if no error, but as a fallback
        alert('Login failed. Please try again.');
        return { user: null, session: null, error: { message: "Unknown login error."}};
    },

    logout: async function() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
            alert(`Logout failed: ${error.message}`);
        } else {
            console.log('User logged out. Redirecting to login.html');
        }
        // Always redirect to login page after attempting logout
        window.location.href = 'login.html';
    },

    getCurrentUser: async function() {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error("Error getting session:", sessionError.message);
            return null;
        }
        if (!session) {
            // console.log('No active user session found.');
            return null;
        }

        // Session exists, let's get the user object associated with it
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
            console.error('Error fetching user:', userError.message);
            // Potentially invalid session, treat as logged out
            // await this.logout(); // Could cause redirect loop if called from protectPage
            return null;
        }
        if (user) {
             // console.log('Active user session found for:', user.email);
             // The full_name should be in user_metadata if the trigger and signup options are correct
            return {
                id: user.id,
                email: user.email,
                fullName: user.user_metadata?.full_name || "User", // Fallback if not set
                // You can add other fields from user object if needed
            };
        }
        return null;
    },

    isAuthenticated: async function() {
        const user = await this.getCurrentUser();
        return user !== null;
    },

    // This function is intended for pages that require authentication
    // Call it at the beginning of scripts for protected pages (e.g., dashboard.html, index.html if it's protected)
    protectPage: async function() {
        console.log('[auth.js] protectPage called. Checking authentication status.');
        if (!(await this.isAuthenticated())) {
            console.log('[auth.js] User not authenticated. Redirecting to login.');
            window.location.href = 'login.html'; // Redirect if not authenticated
        } else {
            console.log('[auth.js] User is authenticated.');
        }
    },

    // Function to check auth status and redirect from login/signup if already logged in
    redirectIfAuthenticated: async function(targetPath = 'dashboard.html') {
        if (await this.isAuthenticated()) {
            console.log(`[auth.js] User already authenticated, redirecting to ${targetPath}.`);
            window.location.href = targetPath;
        }
    }
};

// Make Auth globally available if you are not using modules in your HTML script tags for event handlers
// If you use <script type="module"> for the inline scripts in HTML, this is not needed.
window.Auth = Auth;

// Example: If you have an index.html that should redirect to dashboard or login:
//
// On index.html:
// <script type="module">
//   import { Auth } from './js/auth.js'; // Adjust path
//   (async () => {
//     if (await Auth.isAuthenticated()) {
//       window.location.href = 'dashboard.html';
//     } else {
//       window.location.href = 'login.html';
//     }
//   })();
// </script>
