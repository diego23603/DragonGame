// Authentication state management
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Initialize the authentication state
function initAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        verifyAndLoadGame();
    }
}

// Register new user
async function register(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        
        if (response.ok) {
            errorDiv.classList.add('d-none');
            // Auto login after successful registration
            await login(null, username, password);
        } else {
            errorDiv.textContent = data.message;
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = 'Registration failed. Please try again.';
        errorDiv.classList.remove('d-none');
    }
}

// Login user
async function login(event, username = null, password = null) {
    if (event) event.preventDefault();
    
    // If credentials aren't passed, get them from the form
    username = username || document.getElementById('loginUsername').value;
    password = password || document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        
        if (response.ok && data.token) {
            errorDiv.classList.add('d-none');
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('username', username);
            currentUser = username;
            showGameSection();
            initializeGame();
        } else {
            errorDiv.textContent = data.message;
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Login failed. Please try again.';
        errorDiv.classList.remove('d-none');
    }
}

// Verify token and load game
async function verifyAndLoadGame() {
    try {
        const response = await fetch('/verify-token', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showGameSection();
            initializeGame();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Token verification error:', error);
        logout();
    }
}

// Logout user
async function logout() {
    try {
        if (authToken) {
            await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('selectedDragonId');
        showAuthSection();
    }
}

// UI helpers
function showGameSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('gameSection').style.display = 'block';
}

function showAuthSection() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('gameSection').style.display = 'none';
}

function initializeGame() {
    // Initialize game components
    initializeDragons();
    window.username = currentUser || localStorage.getItem('username');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerForm').addEventListener('submit', register);
    document.getElementById('loginForm').addEventListener('submit', login);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    initAuth();
});

// Export auth state for other modules
window.authToken = authToken;
window.currentUser = currentUser;
