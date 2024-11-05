const socket = io();
let currentUsername = '';

socket.on('connect', () => {
    console.log('Connected to server');
    const token = localStorage.getItem('authToken');
    if (token) {
        socket.emit('authenticate', { token });
    }
});

socket.on('authenticated', (data) => {
    currentUsername = data.username;
    myPosition = data.position || { x: 400, y: 300 };
    if (data.score !== undefined) {
        score = data.score;
        updateScoreDisplay();
    }
    if (data.selectedDragon) {
        selectDragon(data.selectedDragon);
    }
});

socket.on('user_moved', (data) => {
    if (data.userId !== socket.id) {
        const dragon = availableDragons.find(d => d.id === data.dragonId);
        users.set(data.userId, {
            username: data.username,
            x: data.x,
            y: data.y,
            score: data.score || 0,
            dragonSprite: dragon ? loadImage(dragon.sprite) : null
        });
    }
});

socket.on('score_update', (data) => {
    if (data.userId !== socket.id) {
        const user = users.get(data.userId);
        if (user) {
            user.score = data.score;
            users.set(data.userId, user);
        }
    }
});

function emitPosition(x, y, dragonId, currentScore) {
    if (socket && socket.connected) {
        socket.emit('position_update', {
            x,
            y,
            dragonId,
            score: currentScore,
            username: currentUsername
        });
    }
}

function updateScoreDisplay() {
    const scoreElement = document.getElementById('currentScore');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}

// Emit score updates separately for important events
function emitScoreUpdate(newScore) {
    if (socket && socket.connected) {
        socket.emit('score_update', {
            score: newScore
        });
    }
}

socket.on('user_disconnected', (data) => {
    users.delete(data.userId);
});

socket.on('chat_message', (data) => {
    handleChatMessage(data);
});
