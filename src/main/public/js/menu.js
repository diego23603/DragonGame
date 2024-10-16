let dragons = []; // Array para almacenar los dragones
let selectedDragon = null; // Inicializa selectedDragon como null
let dragonY = 200; // Posición vertical del dragón
let obstacleX = 800; // Posición horizontal del obstáculo
let obstacleY = Math.random() * (400 - 50); // Altura aleatoria para el obstáculo
let obstacleSpeed = 3; // Velocidad del obstáculo
let gameInterval; // Intervalo del juego
let score = 0; // Puntuación del jugador
let gameOver = false; // Estado del juego
const gameOverSound = new Audio('/sounds/game-over.mp3'); // Sonido de fin del juego

// Variables para el fondo
const bgImage = new Image();
bgImage.src = 'https://img.freepik.com/vector-gratis/fondo-videojuego-dibujado-mano_23-2150315377.jpg?size=626&ext=jpg&ga=GA1.1.2002160653.1727800946&semt=ais_hybrid'; // URL de la imagen de fondo
let bgX = 0; // Posición X del fondo
let bgSpeed = 0.2; // Velocidad de desplazamiento del fondo

// Flag para determinar si el juego está en curso
let gameStarted = false;

let authToken = null;

// Variables para las funciones de accesibilidad
let audioEnabled = false;
let currentFontSize = 16; // Tamaño de fuente inicial en píxeles

let isAdmin = false;


// Función para activar/desactivar la narración de audio
function toggleAudio() {
    audioEnabled = !audioEnabled;
    const button = document.getElementById('toggleAudio');
    button.textContent = audioEnabled ? 'Desactivar narración' : 'Activar narración';
    announceToScreenReader(audioEnabled ? 'Narración activada' : 'Narración desactivada');
}

// Función para aumentar el tamaño del texto
function increaseFontSize() {
    currentFontSize += 2;
    document.body.style.fontSize = `${currentFontSize}px`;
    announceToScreenReader(`Tamaño de texto aumentado a ${currentFontSize} píxeles`);
}

// Función para alternar el modo de alto contraste
function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    const isHighContrast = document.body.classList.contains('high-contrast');
    announceToScreenReader(isHighContrast ? 'Modo de alto contraste activado' : 'Modo de alto contraste desactivado');
}

// Función para narrar elementos cuando se pasa el ratón por encima
function narrate(event) {
    if (audioEnabled) {
        const text = event.target.textContent || event.target.getAttribute('aria-label');
        if (text) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    }
}

// Función para anunciar mensajes a los lectores de pantalla
function announceToScreenReader(message) {
    const announcement = document.getElementById('screenReaderAnnouncement');
    announcement.textContent = message;
}

// Funciones de autenticación
function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    // Validación básica en el cliente
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
// Modify login function
// Modificar la función login
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
                // Decodificar el token en el servidor y enviar isAdmin como parte de la respuesta
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
// Función para cerrar sesión
function logout() {
    authToken = null;
    isAdmin = false;
    localStorage.removeItem('authToken');

    // Ocultar secciones y mostrar sección de autenticación
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('gameSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'none';

    // Limpiar datos de usuario
    document.getElementById('selectedDragon').innerText = '';
    document.getElementById('dragonsContainer').innerHTML = '';

    // Limpiar datos específicos de administrador
    document.getElementById('userList').innerHTML = '';
    document.getElementById('sessionList').innerHTML = '';

    // Reiniciar variables del juego
    dragons = [];
    selectedDragon = null;
    gameStarted = false;
    score = 0;

    // Limpiar el canvas si existe
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    announceToScreenReader('Has cerrado sesión. Todos los datos han sido limpiados.');
}

function loadUsers() {
    fetch('/admin/users', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => response.json())
        .then(users => {
            const userList = document.getElementById('userList');
            userList.innerHTML = '';
            users.forEach(user => {
                const li = document.createElement('li');
                li.textContent = `${user.username} ${user.isAdmin ? '(Admin)' : ''}`;
                userList.appendChild(li);
            });
        })
        .catch(error => console.error('Error loading users:', error));
}

function loadSessions() {
    fetch('/admin/sessions', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => response.json())
        .then(sessions => {
            const sessionList = document.getElementById('sessionList');
            sessionList.innerHTML = '';
            sessions.forEach(session => {
                const li = document.createElement('li');
                li.textContent = `${session.username} - Login time: ${new Date(session.loginTime).toLocaleString()}`;
                const terminateButton = document.createElement('button');
                terminateButton.textContent = 'Terminar';
                terminateButton.onclick = () => terminateSession(session.id);
                li.appendChild(terminateButton);
                sessionList.appendChild(li);
            });
        })
        .catch(error => console.error('Error loading sessions:', error));
}

function terminateSession(sessionId) {
    fetch(`/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => response.json())
        .then(data => {
            announceToScreenReader(data.message);
            loadSessions();
        })
        .catch(error => console.error('Error terminating session:', error));
}


// Add event listeners for admin functions
if (document.getElementById('loadUsersButton')) {
    document.getElementById('loadUsersButton').addEventListener('click', loadUsers);
}
if (document.getElementById('loadSessionsButton')) {
    document.getElementById('loadSessionsButton').addEventListener('click', loadSessions);
}

// Función para cargar dragones desde el servidor
function loadDragons() {
    fetch('/dragons', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            dragons = data; // Asigna los dragones obtenidos
            renderDragons(); // Llama a renderizar los dragones
            announceToScreenReader('Dragones cargados. Puedes seleccionar uno para jugar.');
        })
        .catch(error => {
            console.error('Error al cargar los dragones:', error);
            const errorMessage = 'No se pudieron cargar los dragones. Por favor, inicia sesión de nuevo.';
            alert(errorMessage);
            announceToScreenReader(errorMessage);
            // Redirigir al usuario a la pantalla de inicio de sesión
            document.getElementById('authSection').style.display = 'block';
            document.getElementById('gameSection').style.display = 'none';
        });
}

// Función para guardar los dragones en el servidor
function saveDragons() {
    fetch('/dragons', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(dragons)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(() => {
            console.log('Dragones guardados correctamente.');
            announceToScreenReader('Dragones guardados correctamente.');
        })
        .catch(error => {
            console.error('Error al guardar los dragones:', error);
            const errorMessage = 'No se pudieron guardar los dragones. Por favor, inicia sesión de nuevo.';
            alert(errorMessage);
            announceToScreenReader(errorMessage);
            // Redirigir al usuario a la pantalla de inicio de sesión
            document.getElementById('authSection').style.display = 'block';
            document.getElementById('gameSection').style.display = 'none';
        });
}

// Función para renderizar los dragones en el contenedor
function renderDragons() {
    const dragonsContainer = document.getElementById('dragonsContainer');
    dragonsContainer.innerHTML = ''; // Limpia el contenedor

    dragons.forEach((dragon, index) => {
        const dragonLabel = document.createElement('div');
        dragonLabel.role = 'listitem';
        dragonLabel.innerHTML = `
            <input type="radio" name="dragon" id="dragon${index}" value="${dragon.name}" onclick="selectDragon(${index})">
            <label for="dragon${index}">
                <img src="${dragon.image}" alt="${dragon.name}" width="${dragon.size}">
                <span class="dragon-name">${dragon.name}</span>
            </label>
            <button onclick="editDragon(${index})" aria-label="Editar ${dragon.name}">Editar</button>
        `;
        dragonsContainer.appendChild(dragonLabel);
    });

    announceToScreenReader(`${dragons.length} dragones disponibles para seleccionar.`);
}

// Función para seleccionar un dragón basado en el índice
function selectDragon(index) {
    selectedDragon = dragons[index];
    document.getElementById('selectedDragon').innerText = `Dragón seleccionado: ${selectedDragon.name}`;
    announceToScreenReader(`Has seleccionado el dragón ${selectedDragon.name}`);
}

// Función para editar un dragón
function editDragon(index) {
    selectedDragon = dragons[index];
    document.getElementById('editDragonForm').style.display = 'block';
    document.getElementById('editDragonName').value = selectedDragon.name;
    document.getElementById('editDragonSize').value = selectedDragon.size;
    document.getElementById('editDragonImage').value = selectedDragon.image;
    announceToScreenReader(`Editando el dragón ${selectedDragon.name}`);
}

function updateDragon(event) {
    event.preventDefault();
    if (selectedDragon) {
        selectedDragon.name = document.getElementById('editDragonName').value;
        selectedDragon.size = parseInt(document.getElementById('editDragonSize').value, 10);
        selectedDragon.image = document.getElementById('editDragonImage').value;
        saveDragons();
        renderDragons();
        document.getElementById('editDragonForm').style.display = 'none';
        announceToScreenReader(`Dragón ${selectedDragon.name} actualizado correctamente`);
    }
}

// Función para añadir un dragón
function addDragon(event) {
    event.preventDefault();
    const name = document.getElementById('dragonName').value;
    const size = parseInt(document.getElementById('dragonSize').value, 10);
    const image = document.getElementById('dragonImage').value;

    if (name && size && image) {
        const newDragon = { name, image, size };
        dragons.push(newDragon);
        saveDragons();
        renderDragons();

        // Limpia el formulario
        document.getElementById('dragonName').value = '';
        document.getElementById('dragonSize').value = '';
        document.getElementById('dragonImage').value = '';
        announceToScreenReader(`Nuevo dragón ${name} añadido correctamente`);
    } else {
        alert("Por favor, completa todos los campos para añadir un dragón.");
        announceToScreenReader("Por favor, completa todos los campos para añadir un dragón.");
    }
}

// Función para eliminar un dragón
function deleteDragon() {
    if (selectedDragon) {
        const index = dragons.indexOf(selectedDragon);
        if (index > -1) {
            const deletedDragonName = selectedDragon.name;
            dragons.splice(index, 1);
            saveDragons();
            renderDragons();
            document.getElementById('editDragonForm').style.display = 'none';
            selectedDragon = null;
            document.getElementById('selectedDragon').innerText = '';
            announceToScreenReader(`Dragón ${deletedDragonName} eliminado correctamente`);
        }
    }
}

// Función para iniciar el juego
function playGame() {
    if (!selectedDragon) {
        alert("Por favor, selecciona un dragón para jugar.");
        announceToScreenReader("Por favor, selecciona un dragón para jugar.");
        return;
    }

    // Reiniciar variables del juego
    dragonY = 200;
    obstacleX = 800;
    obstacleY = Math.random() * (400 - 50);
    obstacleSpeed = 3;
    score = 0;
    gameOver = false;
    gameStarted = true;

    // Configurar el canvas
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 400;

    // Cargar la imagen del dragón
    const dragonImg = new Image();
    dragonImg.src = selectedDragon.image;

    // Cargar la imagen del obstáculo
    const obstacleImg = new Image();
    obstacleImg.src = "/images/obstacle.png";

    // Escuchar eventos de teclado para mover el dragón
    document.addEventListener('keydown', moveDragon);

    // Iniciar el bucle del juego
    gameInterval = setInterval(() => {
        if (!gameOver) {
            updateGame(ctx, dragonImg, obstacleImg);
        }
    }, 20);

    // Anunciar el inicio del juego para lectores de pantalla
    announceToScreenReader(`Juego iniciado con el dragón ${selectedDragon.name}. Usa las flechas arriba y abajo para mover el dragón.`);
}

// Mueve el dragón
function moveDragon(event) {
    if (!gameStarted) return;

    if (event.key === 'ArrowUp') {
        event.preventDefault();
        dragonY -= 10;
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        dragonY += 10;
    }

    // Limitar el movimiento del dragón dentro del canvas
    const canvas = document.getElementById("gameCanvas");
    if (dragonY < 0) {
        dragonY = 0;
    } else if (dragonY + selectedDragon.size > canvas.height) {
        dragonY = canvas.height - selectedDragon.size;
    }
}

// Actualiza el estado del juego
function updateGame(ctx, dragonImg, obstacleImg) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Dibuja el fondo dinámico
    drawBackground(ctx);

    // Dibuja el dragón
    ctx.drawImage(dragonImg, 50, dragonY, selectedDragon.size, selectedDragon.size);

    // Mueve el obstáculo
    obstacleX -= obstacleSpeed;

    // Si el obstáculo sale del canvas, reinicia su posición y genera nueva altura
    if (obstacleX < -75) {
        obstacleX = ctx.canvas.width;
        obstacleY = Math.random() * (400 - 50);
        score++;
        increaseObstacleSpeed();
        announceToScreenReader(`Puntuación: ${score}`);
    }

    // Dibuja el obstáculo
    ctx.drawImage(obstacleImg, obstacleX, obstacleY, 75, 75);

    // Verifica colisión
    if (checkCollision(50, dragonY, selectedDragon.size, selectedDragon.size, obstacleX, obstacleY, 75, 75)) {
        endGame(ctx);
    }

    // Muestra la puntuación
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Puntuación: ${score}`, 10, 20);
}

// Dibuja el fondo dinámico
function drawBackground(ctx) {
    bgX -= bgSpeed;
    if (bgX <= -ctx.canvas.width) {
        bgX = 0;
    }
    ctx.drawImage(bgImage, bgX, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(bgImage, bgX + ctx.canvas.width, 0, ctx.canvas.width, ctx.canvas.height);
}

// Verifica colisiones entre el dragón y el obstáculo
function checkCollision(dragonX, dragonY, dragonWidth, dragonHeight, obstacleX, obstacleY, obstacleWidth, obstacleHeight) {
    return (
        dragonX < obstacleX + obstacleWidth &&
        dragonX + dragonWidth > obstacleX &&
        dragonY < obstacleY + obstacleHeight &&
        dragonY + dragonHeight > obstacleY
    );
}

// Aumenta la velocidad del obstáculo
function increaseObstacleSpeed() {
    if (score % 5 === 0) {
        obstacleSpeed += 0.5;
    }
}

// Termina el juego
function endGame(ctx) {
    clearInterval(gameInterval);
    gameOver = true;
    document.removeEventListener('keydown', moveDragon);

    // Muestra un mensaje de Game Over
    ctx.fillStyle = 'red';
    ctx.font = '40px Arial';
    ctx.fillText('¡Game Over!', ctx.canvas.width / 2 - 100, ctx.canvas.height / 2);
    ctx.fillText(`Puntuación final: ${score}`, ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 50);
    gameOverSound.play();

    // Anunciar el fin del juego para lectores de pantalla
    announceToScreenReader(`Juego terminado. Puntuación final: ${score}`);
}



let narracionActivada = false;

// Función para narrar un mensaje
function narrarMensaje(mensaje) {
    if (narracionActivada) {
        const narracion = new SpeechSynthesisUtterance(mensaje);
        window.speechSynthesis.speak(narracion);
    }
}

// Activar/Desactivar la narración con el botón
document.getElementById("toggleAudio").addEventListener("click", () => {
    narracionActivada = !narracionActivada;
    if (narracionActivada) {
        narrarMensaje("Narración activada.");
    } else {
        narrarMensaje("Narración desactivada.");
    }
});

// Llamar a la función para añadir narración a todos los elementos interactivos
function agregarNarracionAElementos() {
    const botones = document.querySelectorAll("button");
    const inputs = document.querySelectorAll("input");
    const headers = document.querySelectorAll("h1, h2, h3");

    // Narrar al enfocar y hacer clic en botones
    botones.forEach((boton) => {
        boton.addEventListener("focus", () => narrarMensaje(`Botón: ${boton.textContent}`));
        boton.addEventListener("click", () => narrarMensaje(`Has pulsado el botón: ${boton.textContent}`));
    });

    // Narrar al enfocar campos de entrada
    inputs.forEach((input) => {
        input.addEventListener("focus", () => {
            const label = document.querySelector(`label[for='${input.id}']`);
            if (label) {
                narrarMensaje(`Campo de entrada: ${label.textContent}`);
            }
        });
    });

    // Narrar los encabezados de las secciones
    headers.forEach((header) => narrarMensaje(`Sección: ${header.textContent}`));
}

// Añadir event listeners para los formularios de registro y login
document.getElementById("registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    narrarMensaje("Registro completado con éxito.");
    register(); // Asumiendo que tienes esta función implementada
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    narrarMensaje("Inicio de sesión exitoso.");
    login(); // Asumiendo que tienes esta función implementada
});

document.getElementById("logoutButton").addEventListener("click", () => {
    narrarMensaje("Has cerrado sesión.");
    logout(); // Asumiendo que tienes esta función implementada
});

document.getElementById("addDragonForm").addEventListener("submit", (e) => {
    e.preventDefault();
    narrarMensaje("Dragón añadido con éxito.");
    addDragon(); // Asumiendo que tienes esta función implementada
});

document.getElementById("editDragonForm").addEventListener("submit", (e) => {
    e.preventDefault();
    narrarMensaje("Dragón actualizado con éxito.");
    updateDragon(); // Asumiendo que tienes esta función implementada
});

document.getElementById("deleteDragonButton").addEventListener("click", () => {
    narrarMensaje("Dragón eliminado.");
    deleteDragon(); // Asumiendo que tienes esta función implementada
});

document.getElementById("playButton").addEventListener("click", () => {
    narrarMensaje("Has comenzado el juego.");
    playGame(); // Asumiendo que tienes esta función implementada
});

// Añadir narración a todos los botones y elementos interactivos al cargar la página
document.addEventListener("DOMContentLoaded", agregarNarracionAElementos);

// Verificar token y mostrar secciones correspondientes
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
            })
            .catch(error => {
                console.error('Error verifying token:', error);
                localStorage.removeItem('authToken');
            });
    }
});

// Función para aumentar el tamaño de la fuente
document.getElementById('increaseFontSize').addEventListener('click', increaseFontSize);

// Función para cambiar el contraste
document.getElementById('toggleHighContrast').addEventListener('click', toggleHighContrast);