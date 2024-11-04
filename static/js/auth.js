// Auth state management
let authToken = null;
let currentUser = null;
let isLoading = false;

// Export auth token for other modules
window.getAuthToken = () => authToken;
window.getCurrentUser = () => currentUser;

// UI Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const authSection = document.getElementById('authSection');
const gameSection = document.getElementById('gameSection');

// Custom event for auth state changes
const AUTH_STATE_CHANGED = new Event('authStateChanged');

// Initialize auth state from localStorage
function initAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        verifyToken(token);
    }
}

// Token verification
async function verifyToken(token) {
    try {
        setLoading(true);
        const response = await fetch('/verify-token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            handleAuthSuccess(token, data);
        } else {
            handleAuthError('Token expired');
            localStorage.removeItem('authToken');
            authToken = null;
        }
    } catch (error) {
        handleAuthError('Authentication error');
        authToken = null;
    } finally {
        setLoading(false);
        document.dispatchEvent(AUTH_STATE_CHANGED);
    }
}

// Login handler
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!validateCredentials(username, password)) {
        return;
    }
    
    try {
        setLoading(true);
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            handleAuthSuccess(data.token, data);
        } else {
            handleAuthError(data.message || 'Login failed');
        }
    } catch (error) {
        handleAuthError('Network error');
    } finally {
        setLoading(false);
    }
}

// Register handler
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!validateCredentials(username, password)) {
        return;
    }
    
    try {
        setLoading(true);
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showFeedback(registerError, 'Registration successful! Please login.', 'success');
            registerForm.reset();
        } else {
            handleAuthError(data.message || 'Registration failed', 'register');
        }
    } catch (error) {
        handleAuthError('Network error', 'register');
    } finally {
        setLoading(false);
    }
}

// Logout handler
async function handleLogout() {
    try {
        if (myPosition) {
            await updateUserPosition(myPosition.x, myPosition.y);
        }
        
        await fetch('/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        localStorage.removeItem('authToken');
        authToken = null;
        currentUser = null;
        
        authSection.style.display = 'block';
        gameSection.style.display = 'none';
        
        showFeedback(loginError, 'Logged out successfully', 'success');
        document.dispatchEvent(AUTH_STATE_CHANGED);
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Position update
async function updateUserPosition(x, y) {
    if (!authToken) return;
    
    try {
        await fetch('/update-position', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ x, y })
        });
    } catch (error) {
        console.error('Position update error:', error);
    }
}

// Helper functions
function validateCredentials(username, password) {
    if (username.length < 3) {
        handleAuthError('Username must be at least 3 characters');
        return false;
    }
    if (password.length < 6) {
        handleAuthError('Password must be at least 6 characters');
        return false;
    }
    return true;
}

function handleAuthSuccess(token, data) {
    authToken = token;
    localStorage.setItem('authToken', token);
    
    currentUser = {
        username: data.username,
        isAdmin: data.isAdmin,
        position: data.position || { x: 400, y: 300 }
    };
    
    if (currentUser.position) {
        myPosition = currentUser.position;
    }
    
    authSection.style.display = 'none';
    gameSection.style.display = 'block';
    
    if (currentUser.isAdmin) {
        document.getElementById('adminSection').style.display = 'block';
    }

    document.dispatchEvent(AUTH_STATE_CHANGED);
}

function handleAuthError(message, type = 'login') {
    const errorElement = type === 'login' ? loginError : registerError;
    showFeedback(errorElement, message, 'error');
}

function showFeedback(element, message, type) {
    element.textContent = message;
    element.className = `alert alert-${type === 'success' ? 'success' : 'danger'} mt-3`;
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
            element.style.opacity = '1';
        }, 300);
    }, 3000);
}

function setLoading(isLoadingState) {
    isLoading = isLoadingState;
    document.querySelectorAll('button[type="submit"]').forEach(button => {
        button.disabled = isLoading;
        button.innerHTML = isLoading ? 
            '<span class="spinner-border spinner-border-sm me-2"></span>Loading...' : 
            button.getAttribute('data-original-text') || button.innerHTML;
    });
}

// Event listeners
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
document.getElementById('logoutButton').addEventListener('click', handleLogout);

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', initAuth);
