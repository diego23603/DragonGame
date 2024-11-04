// Socket instance and connection state
let socket = null;
let isConnecting = false;

function initializeSocket() {
    if (isConnecting || socket) return;
    isConnecting = true;

    // Initialize socket only after auth is loaded
    const authToken = window.getAuthToken?.();
    if (!authToken) {
        isConnecting = false;
        return;
    }

    socket = io();

    // Connection handling
    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('authenticate', { token: authToken });
    });

    // Connection error handling
    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        isConnecting = false;
    });

    // Authentication response
    socket.on('authenticated', (data) => {
        const currentUser = window.getCurrentUser?.();
        if (!currentUser) return;

        currentUser.position = data.position || { x: 400, y: 300 };
        
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
        const currentUser = window.getCurrentUser?.();
        if (currentUser?.position) {
            try {
                await updateUserPosition(currentUser.position.x, currentUser.position.y);
            } catch (error) {
                console.error('Error saving position on disconnect:', error.message || 'Unknown error');
            }
        }
        isConnecting = false;
    });

    // Listen for auth state changes
    document.addEventListener('authStateChanged', () => {
        const token = window.getAuthToken?.();
        if (token && socket?.connected) {
            socket.emit('authenticate', { token });
        }
    });
}

// Position update throttling
let lastPositionUpdate = 0;
const POSITION_UPDATE_INTERVAL = 100; // 100ms throttle

function emitPosition(x, y) {
    const now = Date.now();
    if (now - lastPositionUpdate < POSITION_UPDATE_INTERVAL) return;
    
    lastPositionUpdate = now;
    
    if (socket?.connected) {
        const currentUser = window.getCurrentUser?.();
        socket.emit('position_update', {
            x,
            y,
            username: currentUser?.username,
            dragonSprite: selectedDragon?.sprite
        });
        
        // Also update position in database
        updateUserPosition(x, y).catch(error => {
            console.error('Error updating position:', error.message || 'Unknown error');
        });
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

// Initialize socket when auth is loaded and changed
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth.js to initialize
    setTimeout(initializeSocket, 500);
});

document.addEventListener('authStateChanged', () => {
    initializeSocket();
});
