const socket = io();

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('user_moved', (data) => {
    if (data.user_id !== USER_ID) {
        users.set(data.user_id, {
            x: data.x,
            y: data.y,
            sprite: data.sprite
        });
    }
});

socket.on('user_connected', (data) => {
    console.log('User connected:', data);
});

socket.on('collectibles_state', (state) => {
    // Update collectibles based on server state
    Object.entries(state).forEach(([id, collected]) => {
        const [x, y] = id.split('_').map(Number);
        const collectible = collectibles.find(c => c.x === x && c.y === y);
        if (collectible) {
            collectible.collected = collected;
        }
    });
});

socket.on('collectible_collected', (data) => {
    // Mark collectible as collected when another player collects it
    const collectible = collectibles.find(c => 
        c.x === data.x && c.y === data.y && !c.collected
    );
    if (collectible) {
        collectible.collected = true;
    }
});
