// Socket instance and connection state
let socket = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

// Socket initialization and connection management
function initializeSocket() {
    if (isConnecting || socket?.connected) return;
    isConnecting = true;

    try {
        const authToken = window.getAuthToken?.();
        if (!authToken) {
            console.log('Auth token not available, waiting...');
            isConnecting = false;
            return;
        }

        socket = io({
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: RECONNECT_DELAY,
            auth: { token: authToken }
        });

        setupSocketListeners();
    } catch (error) {
        console.error('Socket initialization error:', error);
        handleReconnection();
    }
}

function setupSocketListeners() {
    if (!socket) return;

    socket.on('connect', () => {
        console.log('Connected to server');
        isConnecting = false;
        reconnectAttempts = 0;
        const authToken = window.getAuthToken?.();
        if (authToken) {
            socket.emit('authenticate', { token: authToken });
        }
        // Dispatch event for other modules
        document.dispatchEvent(new Event('socketConnected'));
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        handleReconnection();
    });

    socket.on('disconnect', async () => {
        console.log('Disconnected from server');
        handleDisconnect();
    });

    socket.on('authenticated', (data) => {
        handleAuthentication(data);
    });

    socket.on('user_moved', (data) => {
        handleUserMovement(data);
    });
}

function handleReconnection() {
    isConnecting = false;
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        setTimeout(initializeSocket, RECONNECT_DELAY);
    } else {
        console.error('Max reconnection attempts reached');
    }
}

async function handleDisconnect() {
    const currentUser = window.getCurrentUser?.();
    if (currentUser?.position) {
        try {
            await updateUserPosition(currentUser.position.x, currentUser.position.y);
        } catch (error) {
            console.error('Error saving position on disconnect:', error.message || 'Unknown error');
        }
    }
    isConnecting = false;
}

function handleAuthentication(data) {
    const currentUser = window.getCurrentUser?.();
    if (!currentUser) return;

    currentUser.position = data.position || { x: 400, y: 300 };
    if (data.position) {
        myPosition = data.position;
    }
    emitPosition(myPosition.x, myPosition.y);
}

function handleUserMovement(data) {
    if (!socket || !data.userId || data.userId === socket.id) return;
    
    users.set(data.userId, {
        username: data.username,
        x: data.x,
        y: data.y,
        dragonSprite: data.dragonSprite
    });
}

// Position update throttling
let lastPositionUpdate = 0;
const POSITION_UPDATE_INTERVAL = 100;

function emitPosition(x, y) {
    if (!socket?.connected) return;

    const now = Date.now();
    if (now - lastPositionUpdate < POSITION_UPDATE_INTERVAL) return;
    
    lastPositionUpdate = now;
    
    const currentUser = window.getCurrentUser?.();
    if (!currentUser) return;

    socket.emit('position_update', {
        x,
        y,
        username: currentUser.username,
        dragonSprite: selectedDragon?.sprite
    });
    
    updateUserPosition(x, y).catch(error => {
        console.error('Error updating position:', error.message || 'Unknown error');
    });
}

function keyPressed() {
    if (!socket?.connected) return;

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

// Initialize socket when auth is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth.js to initialize
    setTimeout(initializeSocket, 1000);
});

document.addEventListener('authStateChanged', () => {
    if (!socket?.connected) {
        initializeSocket();
    } else {
        const authToken = window.getAuthToken?.();
        if (authToken) {
            socket.emit('authenticate', { token: authToken });
        }
    }
});
