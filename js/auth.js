// js/auth.js
const Auth = {
    // Simulate a user database (in a real app, this would be a backend)
    _users: JSON.parse(localStorage.getItem('kb_users')) || [],

    // Helper to save users to localStorage
    _saveUsers: function() {
        localStorage.setItem('kb_users', JSON.stringify(this._users));
    },

    signup: function(fullName, email, password) {
        // Basic validation (should be more robust)
        if (!fullName || !email || !password) {
            alert('All fields are required for signup.');
            return false;
        }
        // Check if email format is valid (very basic) and ends with @thecehfz.com
        // --- MODIFIED LINE ---
        if (!email.includes('@') || !email.endsWith('@thecehfz.com')) { 
             alert('Please use a valid work email ending with @thecehfz.com.');
             return false;
        }
        // Check if user already exists
        if (this._users.find(user => user.email === email)) {
            alert('User with this email already exists. Please login.');
            // Optionally redirect to login or clear form
            window.location.href = 'login.html'; // Redirect to login
            return false;
        }

        // Simulate password hashing (in real app, use bcrypt)
        const hashedPassword = 'hashed_' + password; // DO NOT DO THIS IN PRODUCTION

        const newUser = { fullName, email, password: hashedPassword };
        this._users.push(newUser);
        this._saveUsers();

        alert('Signup successful! Please login.');
        console.log('User signed up:', newUser);
        window.location.href = 'login.html'; // Redirect to login page after signup
        return true;
    },

    login: function(email, password, rememberMe = false) {
        const user = this._users.find(u => u.email === email);

        // Simulate password check
        if (user && user.password === 'hashed_' + password) {
            console.log('Login successful for:', email);
            const sessionData = {
                token: 'fake-session-token-' + Date.now(), // Simulate a session token
                email: user.email,
                fullName: user.fullName,
                expires: Date.now() + (rememberMe ? (7 * 24 * 60 * 60 * 1000) : (1 * 60 * 60 * 1000)) // 7 days or 1 hour
            };

            if (rememberMe) {
                localStorage.setItem('userSession', JSON.stringify(sessionData));
            } else {
                sessionStorage.setItem('userSession', JSON.stringify(sessionData));
            }
            window.location.href = 'index.html'; // Redirect to the main redirector page
        } else {
            alert('Invalid email or password.');
            console.log('Login failed for:', email);
        }
    },

    logout: function() {
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        console.log('User logged out.');
        window.location.href = 'login.html';
    },

    getCurrentUser: function() {
        const session = sessionStorage.getItem('userSession') || localStorage.getItem('userSession');
        if (!session) return null;

        const sessionData = JSON.parse(session);
        // Check for expiration
        if (Date.now() > sessionData.expires) {
            this.logout(); // Session expired
            return null;
        }
        return { email: sessionData.email, fullName: sessionData.fullName };
    },

    isAuthenticated: function() {
        return this.getCurrentUser() !== null;
    }
};

// Example of protecting a page (call this at the top of dashboard.js or similar)
function protectPage() {
    if (!Auth.isAuthenticated()) {
        Auth.logout(); // Ensure clean state and redirect
    }
}
