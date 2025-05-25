// js/auth.js
import { supabase } from './supabase.js';

const Auth = {
    isAuthenticated: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const isAuthenticated = !!session;
            console.log('[auth.js] isAuthenticated:', isAuthenticated);
            return isAuthenticated;
        } catch (error) {
            console.error('[auth.js] Error in isAuthenticated:', error);
            return false;
        }
    },

    getCurrentUser: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log('[auth.js] getCurrentUser retrieved user:', user);
                return {
                    email: user.email,
                    fullName: user.user_metadata?.full_name || user.email.split('@')[0] // Fallback to email prefix if no full_name
                };
            }
            console.warn('[auth.js] No user found in getCurrentUser.');
            return null;
        } catch (error) {
            console.error('[auth.js] Error in getCurrentUser:', error);
            return null;
        }
    },

    logout: async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('[auth.js] Logout failed:', error);
                throw error;
            }
            console.log('[auth.js] Logout successful.');
            alert('You have been logged out successfully.');
            window.location.href = '/login.html'; // Redirect to login page
        } catch (error) {
            console.error('[auth.js] Error during logout:', error);
            alert('Logout failed, please try again.');
            throw error;
        }
    },

    protectPage: async () => {
        try {
            const isAuthenticated = await Auth.isAuthenticated();
            if (!isAuthenticated) {
                console.warn('[auth.js] User not authenticated, redirecting to login.');
                alert('You are not authorized. Please log in.');
                window.location.href = '/login.html';
            } else {
                console.log('[auth.js] protectPage: User is authenticated.');
            }
        } catch (error) {
            console.error('[auth.js] Error in protectPage:', error);
            window.location.href = '/login.html';
        }
    }
};

export default Auth;
