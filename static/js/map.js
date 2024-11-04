let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];

// Classes remain the same...

function preload() {
    // Load default dragon sprite
    const defaultDragon = '/static/images/dragons/red_dragon.svg';
    characterSprite = loadImage(defaultDragon);
}

// Rest of the existing functions remain the same...

function drawCharacter(x, y, dragonSprite = characterSprite) {
    if (dragonSprite) {
        push();
        imageMode(CENTER);
        // Add glowing effect
        noFill();
        stroke(255, 100, 100, 50 + sin(frameCount * 0.1) * 30);
        circle(x, y, 40);
        image(dragonSprite, x, y, 48, 48);
        pop();
    }
}

// Update the position update emission to include dragon information
function emitPosition() {
    if (socket && selectedDragon) {
        socket.emit('position_update', {
            x: myPosition.x,
            y: myPosition.y,
            dragonId: selectedDragon.id
        });
    }
}

// Add this to the keyPressed function
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
        emitPosition();
    }
}
