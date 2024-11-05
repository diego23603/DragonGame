let dragons = [];
let selectedDragon = null;
let dragonY = 200;
let obstacleX = 800;
let obstacleY = Math.random() * (400 - 50);
let obstacleSpeed = 3;
let gameInterval;
let score = 0;
let gameOver = false;
const gameOverSound = new Audio('/sounds/game-over.mp3');

const bgImage = new Image();
bgImage.src = 'https://img.freepik.com/vector-gratis/fondo-videojuego-dibujado-mano_23-2150315377.jpg?size=626&ext=jpg&ga=GA1.1.2002160653.1727800946&semt=ais_hybrid';
let bgX = 0;
let bgSpeed = 0.2;

let gameStarted = false;
let authToken = null;
let audioEnabled = false;
let currentFontSize = 16;
let isAdmin = false;

function toggleAudio() {
    audioEnabled = !audioEnabled;
    const button = document.getElementById('toggleAudio');
    button.textContent = audioEnabled ? 'Desactivar narración' : 'Activar narración';
    announceToScreenReader(audioEnabled ? 'Narración activada' : 'Narración desactivada');
}

function increaseFontSize() {
    currentFontSize += 2;
    document.body.style.fontSize = `${currentFontSize}px`;
    announceToScreenReader(`Tamaño de texto aumentado a ${currentFontSize} píxeles`);
}

function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    const isHighContrast = document.body.classList.contains('high-contrast');
    announceToScreenReader(isHighContrast ? 'Modo de alto contraste activado' : 'Modo de alto contraste desactivado');
}

function narrate(event) {
    if (audioEnabled) {
        const text = event.target.textContent || event.target.getAttribute('aria-label');
        if (text) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    }
}

function announceToScreenReader(message) {
    const announcement = document.getElementById('screenReaderAnnouncement');
    announcement.textContent = message;
}

function updateNickname() {
    const nicknameInput = document.getElementById('nicknameInput');
    const nickname = nicknameInput.value.trim();

    if (!nickname) {
        alert('Please enter a valid nickname');
        return;
    }

    fetch('/update-nickname', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ nickname })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Nickname updated successfully') {
            document.getElementById('nicknameDisplay').textContent = `Nickname: ${data.nickname}`;
            nicknameInput.value = '';
            announceToScreenReader(`Nickname updated to ${data.nickname}`);
        } else {
            alert(data.message);
            announceToScreenReader(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error updating nickname. Please try again.');
        announceToScreenReader('Error updating nickname. Please try again.');
    });
}

function loadNickname() {
    fetch('/user-info', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.nickname) {
            document.getElementById('nicknameDisplay').textContent = `Nickname: ${data.nickname}`;
        }
    })
    .catch(error => console.error('Error loading nickname:', error));
}

function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    if (username.length < 3 || password.length < 6) {
        document.getElementById('registerError').textContent = 'El nombre de usuario debe tener al menos 3 caracteres y la contraseña al menos 6 caracteres.';
        return;
    }

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Usuario registrado correctamente') {
            document.getElementById('registerForm').reset();
            document.getElementById('registerError').textContent = '';
            announceToScreenReader(data.message);
            alert(data.message);
        } else {
            document.getElementById('registerError').textContent = data.message;
            announceToScreenReader(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        const errorMessage = 'Error al registrar. Intenta de nuevo.';
        document.getElementById('registerError').textContent = errorMessage;
        announceToScreenReader(errorMessage);
    });
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            authToken = data.token;
            isAdmin = data.isAdmin;
            localStorage.setItem('authToken', authToken);
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('gameSection').style.display = 'block';
            if (isAdmin) {
                document.getElementById('adminSection').style.display = 'block';
            }
            document.getElementById('loginError').textContent = '';
            announceToScreenReader('Inicio de sesión exitoso. ' + (isAdmin ? 'Modo administrador activado.' : 'Ahora puedes seleccionar tu dragón.'));
            loadDragons();
            loadNickname();
        } else {
            document.getElementById('loginError').textContent = data.message;
            announceToScreenReader(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        const errorMessage = 'Error al iniciar sesión. Intenta de nuevo.';
        document.getElementById('loginError').textContent = errorMessage;
        announceToScreenReader(errorMessage);
    });
}

[... Rest of the original functions remain unchanged, including logout(), loadUsers(), loadSessions(), terminateSession(), loadDragons(), saveDragons(), renderDragons(), selectDragon(), editDragon(), updateDragon(), addDragon(), deleteDragon(), playGame(), moveDragon(), updateGame(), drawBackground(), checkCollision(), increaseObstacleSpeed(), endGame(), narrarMensaje(), agregarNarracionAElementos(), toggleMap(), and renderMap() ...]

document.addEventListener('DOMContentLoaded', () => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
        authToken = storedToken;
        fetch('/verify-token', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            isAdmin = data.isAdmin;
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('gameSection').style.display = 'block';
            if (isAdmin) {
                document.getElementById('adminSection').style.display = 'block';
            }
            loadDragons();
            loadNickname();
        })
        .catch(error => {
            console.error('Error verifying token:', error);
            localStorage.removeItem('authToken');
        });
    }
});