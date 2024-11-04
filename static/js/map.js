let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];

function setup() {
    const canvas = createCanvas(mapSize.width, mapSize.height);
    canvas.parent('mapContainer');
    frameRate(60);
    
    // Initialize default sprite if none selected
    if (!characterSprite) {
        const defaultDragon = '/static/images/dragons/red_dragon.svg';
        loadImage(defaultDragon, img => {
            characterSprite = img;
        });
    }
}

function draw() {
    // Get background color from day/night cycle
    let bgColor = getDayNightColor();
    background(bgColor);
    
    // Draw grid
    drawGrid();
    
    // Draw all other users
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y, user.dragonSprite || characterSprite);
    });
    
    // Draw local player
    drawCharacter(myPosition.x, myPosition.y, characterSprite);
    
    // Draw score
    updateScore();
}

function drawGrid() {
    stroke(255, 255, 255, 30);
    strokeWeight(1);
    
    // Draw vertical lines
    for (let x = 0; x < width; x += 50) {
        line(x, 0, x, height);
    }
    
    // Draw horizontal lines
    for (let y = 0; y < height; y += 50) {
        line(0, y, width, y);
    }
    
    // Draw coordinate markers
    textSize(10);
    fill(255, 255, 255, 100);
    noStroke();
    for (let x = 0; x < width; x += 100) {
        text(x, x, 10);
    }
    for (let y = 0; y < height; y += 100) {
        text(y, 5, y);
    }
}

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

function updateScore() {
    fill(255);
    noStroke();
    textSize(16);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 10, 20);
}

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
    
    if (moved && socket) {
        socket.emit('position_update', {
            x: myPosition.x,
            y: myPosition.y,
            dragonId: selectedDragon?.id
        });
    }
}
