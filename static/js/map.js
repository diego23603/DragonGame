let users = new Map();
let myPosition = { x: 0, y: 0 };
let mapSize = { width: 800, height: 600 };

function setup() {
    const canvas = createCanvas(mapSize.width, mapSize.height);
    canvas.parent('mapContainer');
    
    // Load character sprite
    loadSprite();
}

function draw() {
    background(getDayNightColor());
    
    // Draw all users
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y, user.sprite);
    });
    
    // Draw local player
    drawCharacter(myPosition.x, myPosition.y, 'character_sprite.svg');
}

function keyPressed() {
    const step = 5;
    let moved = false;
    
    if (keyCode === LEFT_ARROW) {
        myPosition.x = max(0, myPosition.x - step);
        moved = true;
    } else if (keyCode === RIGHT_ARROW) {
        myPosition.x = min(mapSize.width, myPosition.x + step);
        moved = true;
    } else if (keyCode === UP_ARROW) {
        myPosition.y = max(0, myPosition.y - step);
        moved = true;
    } else if (keyCode === DOWN_ARROW) {
        myPosition.y = min(mapSize.height, myPosition.y + step);
        moved = true;
    }
    
    if (moved) {
        socket.emit('position_update', {
            x: myPosition.x,
            y: myPosition.y,
            user_id: USER_ID // Set by server
        });
    }
}

function drawCharacter(x, y, sprite) {
    push();
    translate(x, y);
    // Draw character using sprite
    image(sprite, 0, 0, 32, 32);
    pop();
}
