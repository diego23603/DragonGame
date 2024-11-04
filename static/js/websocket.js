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
