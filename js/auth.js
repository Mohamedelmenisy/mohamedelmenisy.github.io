// js/auth.js
const Auth = {
    _users: JSON.parse(localStorage.getItem('kb_users')) || [],

    _saveUsers: function() {
        localStorage.setItem('kb_users', JSON.stringify(this._users));
    },

    signup: function(fullName, email, password) {
        if (!fullName || !password) { // Email already validated and normalized by calling script
            alert('Full name and password are required for signup.');
            return false;
        }

        // Email is passed already trimmed and lowercased from signup.html
        const normalizedEmail = email; // email is already normalized
        const expectedDomain = '@thecehfz.com'.toLowerCase();

        // This check is somewhat redundant if signup.html does it, but good for direct calls to Auth.signup
        if (!normalizedEmail.includes('@') || !normalizedEmail.endsWith(expectedDomain)) { 
             alert(`Please use a valid work email ending with ${expectedDomain}.`);
             return false;
        }
        
        if (this._users.find(user => user.email === normalizedEmail)) {
            alert('User with this email already exists. Please login.');
            window.location.href = 'login.html';
            return false;
        }

        const hashedPassword = 'hashed_' + password; 

        const newUser = { fullName, email: normalizedEmail, password: hashedPassword };
        this._users.push(newUser);
        this._saveUsers();

        alert('Signup successful! Please login.');
        console.log('User signed up:', newUser);
        window.location.href = 'login.html';
        return true;
    },

    login: function(email, password, rememberMe = false) {
        const normalizedEmail = email.trim().toLowerCase(); // Normalize on login too
        const user = this._users.find(u => u.email === normalizedEmail);

        if (user && user.password === 'hashed_' + password) {
            console.log('Login successful for:', normalizedEmail);
            const sessionData = {
                token: 'fake-session-token-' + Date.now(),
                email: user.email,
                fullName: user.fullName,
                expires: Date.now() + (rememberMe ? (7 * 24 * 60 * 60 * 1000) : (1 * 60 * 60 * 1000))
            };

            if (rememberMe) {
                localStorage.setItem('userSession', JSON.stringify(sessionData));
            } else {
                sessionStorage.setItem('userSession', JSON.stringify(sessionData));
            }
            window.location.href = 'index.html';
        } else {
            alert('Invalid email or password.');
            console.log('Login failed for:', normalizedEmail);
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
        if (Date.now() > sessionData.expires) {
            this.logout(); 
            return null;
        }
        return { email: sessionData.email, fullName: sessionData.fullName };
    },

    isAuthenticated: function() {
        return this.getCurrentUser() !== null;
    }
};

function protectPage() {
    if (!Auth.isAuthenticated()) {
        Auth.logout();
    }
}
