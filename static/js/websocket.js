const socket = io();
let username = '';
let lastKnownState = {
    position: { x: 400, y: 300 },
    selectedDragon: null,
    score: 0
};
let connectionStatus = 'disconnected';

// Connection handling
socket.on('connect', () => {
    console.log('Connected to server');
    connectionStatus = 'connected';
    username = localStorage.getItem('username') || `Player${Math.floor(Math.random() * 1000)}`;
    
    // Show connection status
    showConnectionStatus('connected');
    
    // Restore last known state
    if (lastKnownState.selectedDragon) {
        socket.emit('dragon_selected', {
            dragonId: lastKnownState.selectedDragon.id,
            username: username
        });
    }
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    connectionStatus = 'error';
    showConnectionStatus('error');
    
    // Attempt to reconnect
    setTimeout(() => {
        if (socket.disconnected) {
            socket.connect();
        }
    }, 5000);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    connectionStatus = 'disconnected';
    showConnectionStatus('disconnected');
});

socket.on('user_moved', (data) => {
    if (data.userId !== socket.id) {
        const dragon = availableDragons.find(d => d.id === data.dragonId);
        users.set(data.userId, {
            x: data.x,
            y: data.y,
            username: data.username,
            dragonSprite: dragon ? loadedSprites.get(dragon.sprite) : null
        });
    }
});

socket.on('dragon_selected', (data) => {
    if (data.userId !== socket.id) {
        const dragon = availableDragons.find(d => d.id === data.dragonId);
        if (dragon && users.has(data.userId)) {
            const user = users.get(data.userId);
            const sprite = loadedSprites.get(dragon.sprite);
            if (sprite) {
                user.dragonSprite = sprite;
                user.username = data.username;
                users.set(data.userId, user);
            }
        }
    }
});

socket.on('user_connected', (data) => {
    console.log('User connected:', data);
    showUserConnectionNotification(data.username, 'connected');
});

socket.on('user_disconnected', (data) => {
    users.delete(data.userId);
    showUserConnectionNotification(data.username, 'disconnected');
});

socket.on('collectibles_state', (state) => {
    state.forEach(collectibleState => {
        const collectible = collectibles.find(c => c.id === collectibleState.id);
        if (collectible) {
            collectible.collected = collectibleState.collected;
            collectible.collectedBy = collectibleState.collectedBy;
            
            if (collectible.collected) {
                createCollectionEffect(collectible.x, collectible.y);
            }
        }
    });
});

socket.on('collectible_collected', (data) => {
    const collectible = collectibles.find(c => c.id === data.id);
    if (collectible && !collectible.collected) {
        collectible.collected = true;
        collectible.collectedBy = data.collectedBy;
        createCollectionEffect(collectible.x, collectible.y);
        
        if (data.collectedBy === username) {
            score += 10;
            lastKnownState.score = score;
            document.getElementById('currentScore').textContent = score;
            showScoreAnimation('+10');
        }
    }
});

// Helper functions for UI feedback
function showConnectionStatus(status) {
    const statusDiv = document.createElement('div');
    statusDiv.className = `connection-status ${status}`;
    statusDiv.style.position = 'fixed';
    statusDiv.style.top = '10px';
    statusDiv.style.right = '10px';
    statusDiv.style.padding = '10px';
    statusDiv.style.borderRadius = '5px';
    statusDiv.style.zIndex = '1000';
    
    switch(status) {
        case 'connected':
            statusDiv.style.backgroundColor = 'var(--bs-success)';
            statusDiv.textContent = 'Connected';
            break;
        case 'disconnected':
            statusDiv.style.backgroundColor = 'var(--bs-warning)';
            statusDiv.textContent = 'Disconnected - Reconnecting...';
            break;
        case 'error':
            statusDiv.style.backgroundColor = 'var(--bs-danger)';
            statusDiv.textContent = 'Connection Error';
            break;
    }
    
    const existingStatus = document.querySelector('.connection-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    document.body.appendChild(statusDiv);
}

function showUserConnectionNotification(username, status) {
    const notification = document.createElement('div');
    notification.className = 'user-notification';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px';
    notification.style.borderRadius = '5px';
    notification.style.backgroundColor = status === 'connected' ? 'var(--bs-success)' : 'var(--bs-warning)';
    notification.style.color = 'white';
    notification.style.zIndex = '1000';
    notification.textContent = `${username} ${status}`;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showScoreAnimation(points) {
    const animation = document.createElement('div');
    animation.className = 'score-animation';
    animation.style.position = 'fixed';
    animation.style.top = '50%';
    animation.style.left = '50%';
    animation.style.transform = 'translate(-50%, -50%)';
    animation.style.fontSize = '24px';
    animation.style.color = 'var(--bs-warning)';
    animation.style.fontWeight = 'bold';
    animation.style.zIndex = '1000';
    animation.textContent = points;
    
    document.body.appendChild(animation);
    
    // Animate
    animation.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: 'translate(-50%, -100%) scale(1.5)', opacity: 0 }
    ], {
        duration: 1000,
        easing: 'ease-out'
    }).onfinish = () => animation.remove();
}

// Cache state management
function updateLastKnownState(newState) {
    lastKnownState = { ...lastKnownState, ...newState };
    localStorage.setItem('lastKnownState', JSON.stringify(lastKnownState));
}

// Export necessary variables
window.username = username;
window.connectionStatus = connectionStatus;
window.lastKnownState = lastKnownState;
