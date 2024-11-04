const socket = io();
let currentUsername = '';
let myPosition = { x: 400, y: 300 };

socket.on('connect', () => {
    console.log('Connected to server');
    // Load saved auth token
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    if (token && username) {
        socket.emit('authenticate', { username });
    }
});

socket.on('authenticated', (data) => {
    currentUsername = data.username;
    // Use saved position or default
    myPosition = data.position || { x: 400, y: 300 };
    if (data.selectedDragon) {
        selectDragon(availableDragons.find(d => d.id === data.selectedDragon));
    }
    // Store username for persistence
    localStorage.setItem('username', currentUsername);
});

socket.on('user_moved', (data) => {
    if (data.userId !== socket.id) {
        users.set(data.userId, {
            username: data.username,
            x: data.x,
            y: data.y,
            dragonId: data.dragonId
        });
    }
});

socket.on('dragon_selected', (data) => {
    if (data.userId !== socket.id) {
        const user = users.get(data.userId);
        if (user) {
            user.dragonId = data.dragonId;
            users.set(data.userId, user);
        }
    }
});

function emitPosition(x, y, dragonId) {
    if (socket && socket.connected && currentUsername) {
        socket.emit('position_update', {
            username: currentUsername,
            x,
            y,
            dragonId
        });
    }
}

// Modified dragon selection to persist the choice
function emitDragonSelection(dragonId) {
    if (socket && socket.connected && currentUsername) {
        socket.emit('dragon_selected', {
            username: currentUsername,
            dragonId
        });
    }
}

socket.on('user_connected', (data) => {
    console.log('User connected:', data);
});

socket.on('user_disconnected', (data) => {
    users.delete(data.userId);
});

// Export functions for use in other modules
window.emitPosition = emitPosition;
window.emitDragonSelection = emitDragonSelection;
