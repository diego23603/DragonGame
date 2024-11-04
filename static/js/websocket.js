const socket = io();
let currentUsername = '';

socket.on('connect', () => {
    console.log('Connected to server');
    // Load saved auth token
    const token = localStorage.getItem('authToken');
    if (token) {
        socket.emit('authenticate', { token });
    }
});

socket.on('authenticated', (data) => {
    currentUsername = data.username;
    myPosition = data.position || { x: 400, y: 300 };
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
            dragonSprite: dragon ? loadImage(dragon.sprite) : null
        });
    }
});

socket.on('dragon_selected', (data) => {
    if (data.userId !== socket.id) {
        const dragon = availableDragons.find(d => d.id === data.dragonId);
        if (dragon && users.has(data.userId)) {
            const user = users.get(data.userId);
            loadImage(dragon.sprite, img => {
                user.dragonSprite = img;
                users.set(data.userId, user);
            });
        }
    }
});

socket.on('user_connected', (data) => {
    console.log('User connected:', data);
});

socket.on('user_disconnected', (data) => {
    users.delete(data.userId);
});

function emitPosition(x, y, dragonId) {
    if (socket && socket.connected) {
        socket.emit('position_update', {
            x,
            y,
            dragonId,
            username: currentUsername
        });
    }
}

// Update keyPressed function in map.js to use the new emitPosition function
function keyPressed() {
    const step = 10;
    let moved = false;
    
    if (keyCode === LEFT_ARROW) {
        myPosition.x = max(24, myPosition.x - step);
        moved = true;
    } else if (keyCode === RIGHT_ARROW) {
        myPosition.x = min(mapSize.width - 24, myPosition.x + step);
        moved = true;
    } else if (keyCode === UP_ARROW) {
        myPosition.y = max(24, myPosition.y - step);
        moved = true;
    } else if (keyCode === DOWN_ARROW) {
        myPosition.y = min(mapSize.height - 24, myPosition.y + step);
        moved = true;
    }
    
    if (moved) {
        emitPosition(myPosition.x, myPosition.y, selectedDragon?.id);
    }
}
