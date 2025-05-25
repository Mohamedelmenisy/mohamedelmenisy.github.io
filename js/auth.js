// js/auth.js - placeholder for testing

const Auth = {
    isAuthenticated: () => true,
    getCurrentUser: () => ({
        email: "user@example.com",
        fullName: "John Doe"
    }),
    logout: () => {
        alert("Logged out");
        location.reload();
    }
};

function protectPage() {
    if (!Auth.isAuthenticated()) {
        alert("You are not authorized.");
        location.href = "/login.html";
    }
}
