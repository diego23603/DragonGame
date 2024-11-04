let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];
let fireParticles = [];

// Dragon-themed decorative elements
const decorativeElements = [
    { x: 100, y: 100, type: 'castle', size: 80 },
    { x: 700, y: 500, type: 'castle', size: 80 },
    { x: 200, y: 400, type: 'treasure', size: 40 },
    { x: 600, y: 200, type: 'treasure', size: 40 }
];

function setup() {
    const canvas = createCanvas(mapSize.width, mapSize.height);
    canvas.parent('mapContainer');
    frameRate(60);
    
    // Initialize collectibles
    for (let i = 0; i < 5; i++) {
        collectibles.push({
            x: random(50, mapSize.width - 50),
            y: random(50, mapSize.height - 50),
            collected: false,
            type: random(['gem', 'coin', 'chest']),
            glowPhase: random(TWO_PI)
        });
    }
    
    // Initialize default sprite if none selected
    if (!characterSprite) {
        const defaultDragon = '/static/images/dragons/red_dragon.svg';
        loadImage(defaultDragon, img => {
            characterSprite = img;
        });
    }
}

function draw() {
    // Get background color from day/night cycle with warm tint
    let bgColor = getDayNightColor();
    background(color(
        red(bgColor) * 1.2,    // Increase red component
        green(bgColor) * 0.8,  // Reduce green
        blue(bgColor) * 0.7    // Reduce blue
    ));
    
    // Draw medieval grid pattern
    drawDragonGrid();
    
    // Draw decorative elements
    drawDecorativeElements();
    
    // Update and draw fire particles
    updateFireParticles();
    
    // Draw collectibles
    drawCollectibles();
    
    // Draw all other users
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y, user.dragonSprite || characterSprite);
    });
    
    // Draw local player
    drawCharacter(myPosition.x, myPosition.y, characterSprite);
    
    // Draw score
    updateScore();
    
    // Check collectible collection
    checkCollectibles();
}

function drawDragonGrid() {
    // Draw fantasy-style grid with dragon scale pattern
    push();
    strokeWeight(2);
    for (let x = 0; x < width; x += 50) {
        for (let y = 0; y < height; y += 50) {
            // Create scale pattern
            stroke(255, 100, 50, 20 + sin(frameCount * 0.02 + x * 0.1 + y * 0.1) * 10);
            noFill();
            arc(x, y, 40, 40, 0, PI/2);
        }
    }
    pop();
}

function drawDecorativeElements() {
    decorativeElements.forEach(elem => {
        push();
        if (elem.type === 'castle') {
            // Draw castle towers
            fill(100, 50, 50, 100);
            rect(elem.x - elem.size/2, elem.y - elem.size, elem.size, elem.size);
            // Draw battlements
            for(let i = 0; i < 4; i++) {
                rect(elem.x - elem.size/2 + i*elem.size/4, 
                     elem.y - elem.size - 10, 
                     elem.size/6, 20);
            }
        } else if (elem.type === 'treasure') {
            // Draw treasure chest
            fill(150, 100, 0, 150);
            rect(elem.x - elem.size/2, elem.y - elem.size/2, 
                 elem.size, elem.size/2);
            // Add glow effect
            noFill();
            stroke(255, 200, 0, 50 + sin(frameCount * 0.05) * 30);
            circle(elem.x, elem.y, elem.size * 1.5);
        }
        pop();
    });
}

function updateFireParticles() {
    // Create new fire particles
    if (frameCount % 5 === 0) {
        fireParticles.push({
            x: random(width),
            y: height + 10,
            vx: random(-1, 1),
            vy: random(-5, -3),
            life: 255
        });
    }
    
    // Update and draw fire particles
    for (let i = fireParticles.length - 1; i >= 0; i--) {
        let p = fireParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 3;
        
        // Draw particle
        noStroke();
        fill(255, 100, 50, p.life);
        circle(p.x, p.y, 8);
        
        // Remove dead particles
        if (p.life <= 0) {
            fireParticles.splice(i, 1);
        }
    }
}

function drawCollectibles() {
    collectibles.forEach((c, index) => {
        if (!c.collected) {
            push();
            translate(c.x, c.y);
            rotate(frameCount * 0.02);
            
            // Draw glow effect
            let glowSize = 20 + sin(frameCount * 0.05 + c.glowPhase) * 5;
            noFill();
            stroke(255, 200, 0, 100);
            circle(0, 0, glowSize);
            
            // Draw collectible
            if (c.type === 'gem') {
                fill(0, 255, 255);
                beginShape();
                vertex(0, -10);
                vertex(10, 0);
                vertex(0, 10);
                vertex(-10, 0);
                endShape(CLOSE);
            } else if (c.type === 'coin') {
                fill(255, 215, 0);
                circle(0, 0, 15);
            } else if (c.type === 'chest') {
                fill(139, 69, 19);
                rect(-10, -8, 20, 16);
                fill(255, 215, 0);
                rect(-8, -3, 16, 6);
            }
            pop();
        }
    });
}

function checkCollectibles() {
    collectibles.forEach((c, index) => {
        if (!c.collected && dist(myPosition.x, myPosition.y, c.x, c.y) < 30) {
            c.collected = true;
            score += 10;
            // Emit collectible collection to server
            if (socket) {
                socket.emit('collectible_collected', {
                    x: c.x,
                    y: c.y
                });
            }
        }
    });
}

function drawCharacter(x, y, dragonSprite = characterSprite) {
    if (dragonSprite) {
        push();
        imageMode(CENTER);
        
        // Add glowing effect
        noFill();
        for (let i = 0; i < 3; i++) {
            stroke(255, 100, 100, (30 - i*10) + sin(frameCount * 0.1) * 20);
            circle(x, y, 40 + i*10);
        }
        
        // Draw dragon shadow
        noStroke();
        fill(0, 0, 0, 30);
        ellipse(x, y + 24, 40, 20);
        
        // Draw dragon sprite
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
