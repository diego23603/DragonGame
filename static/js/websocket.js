const socket = io();
let username = '';

socket.on('connect', () => {
    console.log('Connected to server');
    username = localStorage.getItem('username') || `Player${Math.floor(Math.random() * 1000)}`;
    
    if (selectedDragon) {
        socket.emit('dragon_selected', {
            dragonId: selectedDragon.id,
            username: username
        });
    }
});

socket.on('user_moved', (data) => {
    if (data.userId !== socket.id) {
        const dragon = availableDragons.find(d => d.id === data.dragonId);
        users.set(data.userId, {
            x: data.x,
            y: data.y,
            username: data.username,
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
                user.username = data.username;
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
        
        // Update score for all players
        if (data.collectedBy === username) {
            score += 10;
            document.getElementById('currentScore').textContent = score;
        }
    }
});

// Export username for other modules
window.username = username;
