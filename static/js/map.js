// Map state variables
let users = new Map();
let myPosition = { x: 400, y: 300 };
let lastPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];
let fireParticles = [];
let smokeTrails = [];
let dragonSilhouettes = [];
let isMovementEnabled = false;

// Helper functions
function calculateDistance(pos1, pos2) {
    return dist(pos1.x, pos1.y, pos2.x, pos2.y);
}

function random(min, max) {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    return Math.random() * (max - min) + min;
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Initialize the map
function setup() {
    console.log('Setting up map...');
    try {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            throw new Error('Map container not found!');
        }

        const canvas = createCanvas(mapSize.width, mapSize.height);
        canvas.parent('mapContainer');
        frameRate(60);
        
        // Only enable movement when WebSocket is connected
        socket.on('connect', () => {
            console.log('WebSocket connected, enabling movement');
            isMovementEnabled = true;
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected, disabling movement');
            isMovementEnabled = false;
        });
        
        // Initialize collectibles
        console.log('Initializing collectibles...');
        initializeCollectibles();
        initializeDragonSilhouettes();
        
        // Load default sprite if none is selected
        if (!characterSprite) {
            console.log('Loading default character sprite');
            loadImage('/static/images/dragons/red_dragon.svg', img => {
                console.log('Default sprite loaded');
                characterSprite = img;
            });
        }
    } catch (error) {
        console.error('Error initializing canvas:', error);
    }
}

function initializeCollectibles() {
    for (let i = 0; i < 5; i++) {
        collectibles.push({
            id: `collectible_${i}`,
            x: random(50, mapSize.width - 50),
            y: random(50, mapSize.height - 50),
            collected: false,
            type: random(['dragon_egg', 'dragon_scale', 'dragon_chest']),
            glowPhase: random(TWO_PI),
            floatOffset: random(TWO_PI),
            runeRotation: 0,
            collectedBy: null
        });
    }
}

function initializeDragonSilhouettes() {
    for (let i = 0; i < 3; i++) {
        dragonSilhouettes.push({
            x: random(width),
            y: random(height),
            size: random(100, 200),
            speed: random(0.5, 1.5),
            offset: random(TWO_PI)
        });
    }
}

// Main draw loop
function draw() {
    let bgColor = getDayNightColor();
    background(color(
        red(bgColor) * 1.2,
        green(bgColor) * 0.8,
        blue(bgColor) * 0.7
    ));
    
    // Draw map elements
    drawDragonScales();
    drawDragonSilhouettes();
    drawDragonGrid();
    drawDecorativeElements();
    updateFireParticles();
    updateSmokeTrails();
    drawCollectibles();
    
    // Smooth position updates
    myPosition.x = lerp(lastPosition.x, myPosition.x, 0.3);
    myPosition.y = lerp(lastPosition.y, myPosition.y, 0.3);
    
    // Draw other users
    users.forEach((user, id) => {
        const dist = calculateDistance(myPosition, user);
        if (dist < 100) {
            drawInteractionEffect(user.x, user.y);
        }
        drawCharacter(user.x, user.y, user.dragonSprite || characterSprite);
        drawPlayerName(user.x, user.y - 30, user.username || 'Player');
    });
    
    // Draw player character
    drawCharacter(myPosition.x, myPosition.y, characterSprite);
    drawPlayerName(myPosition.x, myPosition.y - 30, window.username || 'You');
    
    // Update game state
    updateScore();
    checkCollectibles();
    checkPlayerCollisions();
}

// Drawing functions
function drawDragonScales() {
    push();
    noFill();
    strokeWeight(1);
    for (let x = 0; x < width; x += 30) {
        for (let y = 0; y < height; y += 30) {
            let shimmerAmount = sin(frameCount * 0.02 + x * 0.1 + y * 0.1) * 0.5 + 0.5;
            stroke(255, 100, 50, 20 * shimmerAmount);
            arc(x, y, 25, 25, 0, PI * 0.8);
        }
    }
    pop();
}

function drawDragonSilhouettes() {
    push();
    noStroke();
    dragonSilhouettes.forEach(dragon => {
        dragon.x += dragon.speed;
        if (dragon.x > width + dragon.size) dragon.x = -dragon.size;
        
        let y = dragon.y + sin(frameCount * 0.02 + dragon.offset) * 20;
        fill(255, 100, 50, 30);
        
        beginShape();
        vertex(dragon.x, y);
        vertex(dragon.x + dragon.size * 0.8, y - dragon.size * 0.2);
        vertex(dragon.x + dragon.size, y);
        vertex(dragon.x + dragon.size * 0.8, y + dragon.size * 0.2);
        endShape(CLOSE);
    });
    pop();
}

function drawDragonGrid() {
    push();
    strokeWeight(1);
    for (let x = 0; x < width; x += 50) {
        for (let y = 0; y < height; y += 50) {
            stroke(255, 100, 50, 10 + sin(frameCount * 0.02 + x * 0.1 + y * 0.1) * 5);
            noFill();
            arc(x, y, 40, 40, 0, PI/2);
        }
    }
    pop();
}

function drawDecorativeElements() {
    // Draw ancient runes
    push();
    translate(width/4, height/4);
    rotate(frameCount * 0.01);
    drawRunes(80);
    pop();

    // Draw dragon statues
    drawDragonStatue(width * 0.75, height * 0.25, 100);
    drawDragonStatue(width * 0.25, height * 0.75, 100);
}

function drawRunes(size) {
    push();
    noFill();
    stroke(255, 150, 50, 50 + sin(frameCount * 0.05) * 20);
    
    // Draw magical circles
    for (let i = 0; i < 3; i++) {
        circle(0, 0, size + i * 20);
    }
    
    // Draw rune symbols
    for (let i = 0; i < 8; i++) {
        push();
        rotate(i * TWO_PI/8);
        line(0, size/2, 0, size/2 + 20);
        pop();
    }
    pop();
}

function drawDragonStatue(x, y, size) {
    push();
    translate(x, y);
    
    // Base
    fill(100, 50, 50);
    rect(-size/3, -size/4, size*2/3, size/4);
    
    // Dragon head
    fill(120, 60, 60);
    beginShape();
    vertex(0, -size/2);
    vertex(size/3, -size*3/4);
    vertex(0, -size);
    vertex(-size/3, -size*3/4);
    endShape(CLOSE);
    
    // Glowing effect
    noFill();
    stroke(255, 100, 50, 30 + sin(frameCount * 0.05) * 20);
    circle(0, -size/2, size/2);
    pop();
}

function updateFireParticles() {
    if (frameCount % 3 === 0) {
        fireParticles.push({
            x: random(width),
            y: height + 10,
            vx: random(-2, 2),
            vy: random(-8, -4),
            size: random(5, 15),
            life: 255,
            hue: random(0, 40)
        });
    }
    
    for (let i = fireParticles.length - 1; i >= 0; i--) {
        let p = fireParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.98;
        p.life -= 4;
        p.size *= 0.98;
        
        noStroke();
        fill(p.hue + 10, 100, 50, p.life);
        circle(p.x + sin(frameCount * 0.1) * 2, p.y, p.size);
        
        if (p.life <= 0) {
            fireParticles.splice(i, 1);
        }
    }
}

function updateSmokeTrails() {
    if (frameCount % 4 === 0) {
        smokeTrails.push({
            x: myPosition.x,
            y: myPosition.y,
            size: random(10, 20),
            life: 255,
            vx: random(-0.5, 0.5),
            vy: random(-1, -0.5)
        });
    }
    
    for (let i = smokeTrails.length - 1; i >= 0; i--) {
        let p = smokeTrails[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 5;
        p.size *= 1.02;
        
        noStroke();
        fill(200, p.life * 0.2);
        circle(p.x, p.y, p.size);
        
        if (p.life <= 0) {
            smokeTrails.splice(i, 1);
        }
    }
}

function drawCollectibles() {
    collectibles.forEach(c => {
        if (!c.collected) {
            push();
            translate(c.x, c.y + sin(frameCount * 0.05 + c.floatOffset) * 5);
            
            // Rotating rune circle
            c.runeRotation += 0.01;
            rotate(c.runeRotation);
            
            // Glowing effect
            let glowSize = 30 + sin(frameCount * 0.05 + c.glowPhase) * 8;
            for (let i = 0; i < 3; i++) {
                noFill();
                stroke(255, 150, 50, 40 - i * 10);
                circle(0, 0, glowSize + i * 10);
            }
            
            // Draw collectible based on type
            if (c.type === 'dragon_egg') {
                drawDragonEgg();
            } else if (c.type === 'dragon_scale') {
                drawDragonScale();
            } else if (c.type === 'dragon_chest') {
                drawDragonChest();
            }
            pop();
        }
    });
}

function drawDragonEgg() {
    fill(255, 200, 150);
    ellipse(0, 0, 25, 35);
    
    // Decorative patterns
    stroke(255, 150, 50);
    noFill();
    for (let i = 0; i < 3; i++) {
        arc(0, -5 + i * 5, 20 - i * 5, 10, 0, PI);
    }
}

function drawDragonScale() {
    push();
    rotate(sin(frameCount * 0.05) * 0.2);
    
    fill(255, 150, 50);
    beginShape();
    vertex(0, -15);
    vertex(12, 0);
    vertex(0, 15);
    vertex(-12, 0);
    endShape(CLOSE);
    
    noFill();
    stroke(255, 200, 150);
    beginShape();
    vertex(0, -12);
    vertex(10, 0);
    vertex(0, 12);
    vertex(-10, 0);
    endShape(CLOSE);
    pop();
}

function drawDragonChest() {
    fill(139, 69, 19);
    rect(-15, -12, 30, 24);
    
    fill(101, 67, 33);
    rect(-15, -12, 30, 8);
    
    fill(255, 215, 0);
    rect(-16, -4, 32, 2);
    
    fill(218, 165, 32);
    rect(-2, -8, 4, 8);
}

function drawCharacter(x, y, dragonSprite = characterSprite) {
    if (dragonSprite) {
        push();
        imageMode(CENTER);
        translate(x, y);
        
        // Shadow
        noStroke();
        fill(0, 0, 0, 30);
        ellipse(0, 24, 40, 20);
        
        // Fire glow effect
        noFill();
        for (let i = 0; i < 3; i++) {
            stroke(255, 100, 100, (30 - i*10) + sin(frameCount * 0.1) * 20);
            circle(0, 0, 40 + i*10);
        }
        
        // Dragon sprite
        image(dragonSprite, 0, 0, 48, 48);
        pop();
    }
}

function drawPlayerName(x, y, name) {
    push();
    fill(255);
    noStroke();
    textAlign(CENTER);
    textSize(12);
    text(name, x, y);
    pop();
}

function drawInteractionEffect(x, y) {
    push();
    noFill();
    stroke(255, 150, 50, 100);
    let pulseSize = 50 + sin(frameCount * 0.1) * 10;
    circle(x, y, pulseSize);
    pop();
}

function checkCollectibles() {
    collectibles.forEach(c => {
        if (!c.collected && dist(myPosition.x, myPosition.y, c.x, c.y) < 30) {
            c.collected = true;
            c.collectedBy = window.username;
            score += 10;
            
            // Create collection effect
            for (let i = 0; i < 20; i++) {
                particles.push({
                    x: c.x,
                    y: c.y,
                    vx: random(-3, 3),
                    vy: random(-3, 3),
                    life: 255,
                    color: color(255, 200, 50)
                });
            }
            
            // Notify server
            if (socket) {
                socket.emit('collectible_collected', {
                    id: c.id,
                    x: c.x,
                    y: c.y,
                    collectedBy: window.username
                });
            }
        }
    });
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 5;
        
        noStroke();
        p.color.setAlpha(p.life);
        fill(p.color);
        circle(p.x, p.y, 5);
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function checkPlayerCollisions() {
    users.forEach((user, id) => {
        const distance = calculateDistance(myPosition, user);
        if (distance < 50) {
            // Create collision effect
            for (let i = 0; i < 10; i++) {
                particles.push({
                    x: (myPosition.x + user.x) / 2,
                    y: (myPosition.y + user.y) / 2,
                    vx: random(-2, 2),
                    vy: random(-2, 2),
                    life: 255,
                    color: color(255, 150, 50)
                });
            }
        }
    });
}

function updateScore() {
    fill(255, 150, 50);
    noStroke();
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 10, 20);
}

// Handle keyboard input
function keyPressed() {
    if (!isMovementEnabled) {
        console.log('Movement disabled: WebSocket not connected');
        return;
    }

    if (!characterSprite) {
        console.log('Movement disabled: No character sprite loaded');
        return;
    }

    console.log('Key pressed:', keyCode);
    const step = 10;
    let moved = false;
    lastPosition = { ...myPosition };
    
    // Prevent default behavior for arrow keys
    if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || 
        keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
        event.preventDefault();
        console.log('Prevented default arrow key behavior');
    }
    
    // Update position based on key press
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
    
    // Emit position update if moved
    if (moved && socket?.connected) {
        console.log('Emitting position update:', myPosition);
        socket.emit('position_update', {
            x: myPosition.x,
            y: myPosition.y,
            dragonId: selectedDragon?.id,
            username: window.username
        });
    }
}

// Export necessary functions
window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;
