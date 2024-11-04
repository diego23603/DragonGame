const socket = io();

socket.on('connect', () => {
    console.log('Connected to server');
    if (selectedDragon) {
        socket.emit('dragon_selected', {
            dragonId: selectedDragon.id
        });
    }
});

socket.on('user_moved', (data) => {
    if (data.userId !== socket.id) {
        const dragon = availableDragons.find(d => d.id === data.dragonId);
        users.set(data.userId, {
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

socket.on('collectibles_state', (state) => {
    Object.entries(state).forEach(([id, collected]) => {
        const [x, y] = id.split('_').map(Number);
        const collectible = collectibles.find(c => c.x === x && c.y === y);
        if (collectible) {
            collectible.collected = collected;
        }
    });
});

socket.on('collectible_collected', (data) => {
    const collectible = collectibles.find(c => 
        c.x === data.x && c.y === data.y && !c.collected
    );
    if (collectible) {
        collectible.collected = true;
    }
});
