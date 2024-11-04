let users = new Map();
let myPosition = { x: 400, y: 300 }; // Start in center
let mapSize = { width: 800, height: 600 };
let characterSprite;

function preload() {
    // Load the sprite before setup
    characterSprite = loadImage('/static/images/character_sprite.svg');
}

function setup() {
    const canvas = createCanvas(mapSize.width, mapSize.height);
    canvas.parent('mapContainer');
}

function draw() {
    // Get background color from day/night cycle
    let bgColor = getDayNightColor();
    background(red(bgColor), green(bgColor), blue(bgColor));
    
    // Draw grid for better visibility
    drawGrid();
    
    // Draw all users
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y);
    });
    
    // Draw local player
    drawCharacter(myPosition.x, myPosition.y);
}

function drawGrid() {
    stroke(100, 100, 100, 50);
    strokeWeight(1);
    
    // Draw vertical lines
    for (let x = 0; x < width; x += 50) {
        line(x, 0, x, height);
    }
    
    // Draw horizontal lines
    for (let y = 0; y < height; y += 50) {
        line(0, y, width, y);
    }
}

function keyPressed() {
    const step = 5;
    let moved = false;
    
    if (keyCode === LEFT_ARROW) {
        myPosition.x = max(16, myPosition.x - step);
        moved = true;
    } else if (keyCode === RIGHT_ARROW) {
        myPosition.x = min(mapSize.width - 16, myPosition.x + step);
        moved = true;
    } else if (keyCode === UP_ARROW) {
        myPosition.y = max(16, myPosition.y - step);
        moved = true;
    } else if (keyCode === DOWN_ARROW) {
        myPosition.y = min(mapSize.height - 16, myPosition.y + step);
        moved = true;
    }
    
    if (moved && socket) {
        socket.emit('position_update', {
            x: myPosition.x,
            y: myPosition.y
        });
    }
}

function drawCharacter(x, y) {
    if (characterSprite) {
        push();
        imageMode(CENTER);
        image(characterSprite, x, y, 32, 32);
        pop();
    }
}
