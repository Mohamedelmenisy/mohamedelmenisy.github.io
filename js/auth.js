// js/auth.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aefiigottnlcmjzilqnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';
const supabase = createClient(supabaseUrl, supabaseKey);

const Auth = {
    isAuthenticated: () => {
        return supabase.auth.getSession().then(({ data }) => !!data.session);
    },
    getCurrentUser: () => {
        return supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                return {
                    email: data.user.email,
                    fullName: data.user.user_metadata?.full_name || data.user.email.split('@')[0]
                };
            }
            return null;
        });
    },
    logout: () => {
        return supabase.auth.signOut().then(() => {
            alert("Logged out");
            window.location.href = '/login.html';
        });
    },
    protectPage: () => {
        if (!Auth.isAuthenticated()) {
            alert("You are not authorized.");
            window.location.href = '/login.html';
        }
    }
};

export default Auth;
