const socket = io();

// Connection handling
socket.on('connect', () => {
    console.log('Connected to server');
    if (authToken) {
        socket.emit('authenticate', { token: authToken });
    }
});

// Authentication response
socket.on('authenticated', (data) => {
    currentUser = {
        username: data.username,
        position: data.position || { x: 400, y: 300 }
    };
    
    // Update position if available
    if (data.position) {
        myPosition = data.position;
    }
    
    // Trigger initial position update
    emitPosition(myPosition.x, myPosition.y);
});

// User movement handling
socket.on('user_moved', (data) => {
    if (!data.userId || data.userId === socket.id) return;
    
    users.set(data.userId, {
        username: data.username,
        x: data.x,
        y: data.y,
        dragonSprite: data.dragonSprite
    });
});

// Disconnection handling
socket.on('disconnect', async () => {
    if (myPosition) {
        try {
            await updateUserPosition(myPosition.x, myPosition.y);
        } catch (error) {
            console.error('Error saving position on disconnect:', error);
        }
    }
});

// Position update throttling
let lastPositionUpdate = 0;
const POSITION_UPDATE_INTERVAL = 100; // 100ms throttle

function emitPosition(x, y) {
    const now = Date.now();
    if (now - lastPositionUpdate < POSITION_UPDATE_INTERVAL) return;
    
    lastPositionUpdate = now;
    
    if (socket && socket.connected) {
        socket.emit('position_update', {
            x,
            y,
            username: currentUser?.username,
            dragonSprite: selectedDragon?.sprite
        });
        
        // Also update position in database
        updateUserPosition(x, y).catch(console.error);
    }
}

// Update keyPressed function to use throttled position updates
function keyPressed() {
    const step = 5;
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
        emitPosition(myPosition.x, myPosition.y);
    }
}
