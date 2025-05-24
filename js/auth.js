// js/auth.js
const Auth = {
    _users: JSON.parse(localStorage.getItem('kb_users')) || [
        // Pre-seed a default user for easier testing if desired, ensure it uses the required domain
        // { fullName: "Test User", email: "test@thechefz.co", password: "hashed_password" } // Corrected domain example
    ],

    _saveUsers: function() {
        localStorage.setItem('kb_users', JSON.stringify(this._users));
    },

    signup: function(fullName, email, password) {
        // Email is already trimmed and lowercased by the calling script (signup.html)
        const normalizedEmail = email;

        if (!fullName || !password) {
            alert('Full name and password are required for signup.');
            console.warn('Signup attempt with missing full name or password.');
            return false;
        }

        const expectedDomain = '@thechefz.co'; // CORRECTED DOMAIN
        if (!normalizedEmail.toLowerCase().endsWith(expectedDomain.toLowerCase())) {
             alert(`Please use a valid work email ending with ${expectedDomain}.`);
             console.warn(`Signup attempt with invalid domain: ${normalizedEmail}`);
             return false;
        }

        if (this._users.find(user => user.email.toLowerCase() === normalizedEmail.toLowerCase())) {
            alert('User with this email already exists. Please login.');
            console.warn(`Signup attempt for existing email: ${normalizedEmail}`);
            window.location.href = 'login.html';
            return false;
        }

        // Simple "hashing" for demonstration. Use a proper library (e.g., bcrypt) in a real app.
        const hashedPassword = 'hashed_' + password;

        const newUser = { fullName: fullName.trim(), email: normalizedEmail, password: hashedPassword };
        this._users.push(newUser);
        this._saveUsers();

        alert('Signup successful! Please login.');
        console.log('User signed up:', { fullName: newUser.fullName, email: newUser.email });
        window.location.href = 'login.html';
        return true;
    },

    login: function(email, password, rememberMe = false) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = this._users.find(u => u.email.toLowerCase() === normalizedEmail);

        // Simple "hashing" check.
        if (user && user.password === 'hashed_' + password) {
            console.log('Login successful for:', user.email);
            const sessionDuration = rememberMe
                                    ? (7 * 24 * 60 * 60 * 1000) // 7 days
                                    : (1 * 60 * 60 * 1000);   // 1 hour (adjust as needed)
            const sessionData = {
                token: 'fake-session-token-' + Date.now() + Math.random().toString(36).substring(2),
                email: user.email,
                fullName: user.fullName,
                expires: Date.now() + sessionDuration
            };

            if (rememberMe) {
                localStorage.setItem('userSession', JSON.stringify(sessionData));
                sessionStorage.removeItem('userSession'); // Clear any existing session storage
            } else {
                sessionStorage.setItem('userSession', JSON.stringify(sessionData));
                localStorage.removeItem('userSession'); // Clear any existing local storage
            }
            window.location.href = 'index.html'; // Redirect to index, which then goes to dashboard
        } else {
            alert('Invalid email or password.');
            console.warn('Login failed for:', normalizedEmail);
        }
    },

    logout: function() {
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        console.log('User logged out. Redirecting to login.html');
        window.location.href = 'login.html';
    },

    getCurrentUser: function() {
        const localSession = localStorage.getItem('userSession');
        const sessionSession = sessionStorage.getItem('userSession');

        const sessionString = localSession || sessionSession;

        if (!sessionString) {
            // console.log('No active user session found.');
            return null;
        }

        try {
            const sessionData = JSON.parse(sessionString);
            if (Date.now() > sessionData.expires) {
                console.log('User session expired. Logging out.');
                this.logout(); // This will cause a redirect
                return null;   // Return null to indicate logged out state
            }
            // console.log('Active user session found for:', sessionData.email);
            return { email: sessionData.email, fullName: sessionData.fullName };
        } catch (error) {
            console.error('Error parsing user session data:', error);
            // Corrupted session data, treat as logged out
            this.logout();
            return null;
        }
    },

    isAuthenticated: function() {
        return this.getCurrentUser() !== null;
    }
};

// This function is called by app.js to protect pages
function protectPage() {
    console.log('[auth.js] protectPage called. Checking authentication status.');
    if (!Auth.isAuthenticated()) {
        console.log('[auth.js] User not authenticated. Calling Auth.logout().');
        Auth.logout(); // Auth.logout() handles the redirect to login.html
    } else {
        console.log('[auth.js] User is authenticated.');
    }
}
