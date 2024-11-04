let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];
let fireParticles = [];
let smokeTrails = [];
let dragonSilhouettes = [];

// Dragon-themed decorative elements
const decorativeElements = [
    { x: 100, y: 100, type: 'castle', size: 80 },
    { x: 700, y: 500, type: 'castle', size: 80 },
    { x: 200, y: 400, type: 'ancient_runes', size: 60 },
    { x: 600, y: 200, type: 'dragon_statue', size: 70 }
];

function setup() {
    const canvas = createCanvas(mapSize.width, mapSize.height);
    canvas.parent('mapContainer');
    frameRate(60);
    
    // Initialize collectibles with dragon theme
    for (let i = 0; i < 5; i++) {
        collectibles.push({
            x: random(50, mapSize.width - 50),
            y: random(50, mapSize.height - 50),
            collected: false,
            type: random(['dragon_egg', 'dragon_scale', 'dragon_chest']),
            glowPhase: random(TWO_PI),
            floatOffset: random(TWO_PI),
            runeRotation: 0
        });
    }
    
    // Initialize dragon silhouettes
    for (let i = 0; i < 3; i++) {
        dragonSilhouettes.push({
            x: random(width),
            y: random(height),
            size: random(100, 200),
            speed: random(0.5, 1.5),
            offset: random(TWO_PI)
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
    
    // Draw shimmering dragon scale pattern
    drawDragonScales();
    
    // Draw floating dragon silhouettes
    drawDragonSilhouettes();
    
    // Draw medieval grid pattern
    drawDragonGrid();
    
    // Draw decorative elements
    drawDecorativeElements();
    
    // Update and draw fire particles
    updateFireParticles();
    
    // Update and draw smoke trails
    updateSmokeTrails();
    
    // Draw collectibles with enhanced effects
    drawCollectibles();
    
    // Draw all other users
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y, user.dragonSprite || characterSprite);
    });
    
    // Draw local player with smoke trail
    drawCharacter(myPosition.x, myPosition.y, characterSprite);
    
    // Draw score
    updateScore();
    
    // Check collectible collection
    checkCollectibles();
}

function drawDragonScales() {
    push();
    noFill();
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
        
        // Simple dragon silhouette
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
    strokeWeight(2);
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
    decorativeElements.forEach(elem => {
        push();
        if (elem.type === 'castle') {
            drawCastle(elem);
        } else if (elem.type === 'ancient_runes') {
            drawRunes(elem);
        } else if (elem.type === 'dragon_statue') {
            drawDragonStatue(elem);
        }
        pop();
    });
}

function drawCastle(elem) {
    fill(100, 50, 50, 100);
    rect(elem.x - elem.size/2, elem.y - elem.size, elem.size, elem.size);
    for(let i = 0; i < 4; i++) {
        rect(elem.x - elem.size/2 + i*elem.size/4, 
             elem.y - elem.size - 10, 
             elem.size/6, 20);
    }
    // Add glowing windows
    fill(255, 200, 0, 50 + sin(frameCount * 0.05) * 30);
    for(let i = 0; i < 3; i++) {
        rect(elem.x - elem.size/3 + i*elem.size/3,
             elem.y - elem.size*0.7,
             elem.size/8, elem.size/8);
    }
}

function drawRunes(elem) {
    push();
    translate(elem.x, elem.y);
    rotate(frameCount * 0.01);
    
    // Draw magical circle
    noFill();
    for(let i = 0; i < 3; i++) {
        stroke(255, 100, 50, 50 - i * 10);
        circle(0, 0, elem.size + i * 10);
    }
    
    // Draw rune symbols
    stroke(255, 150, 50, 100);
    for(let i = 0; i < 8; i++) {
        push();
        rotate(i * TWO_PI/8);
        line(0, elem.size/3, 0, elem.size/2);
        pop();
    }
    pop();
}

function drawDragonStatue(elem) {
    push();
    translate(elem.x, elem.y);
    
    // Base
    fill(80, 40, 40);
    rect(-elem.size/3, -elem.size/4, elem.size*2/3, elem.size/4);
    
    // Dragon silhouette
    fill(100, 50, 50);
    beginShape();
    vertex(0, -elem.size/2);
    vertex(elem.size/3, -elem.size*3/4);
    vertex(0, -elem.size);
    vertex(-elem.size/3, -elem.size*3/4);
    endShape(CLOSE);
    
    // Glowing effect
    noFill();
    stroke(255, 100, 50, 30 + sin(frameCount * 0.05) * 20);
    circle(0, -elem.size/2, elem.size/2);
    pop();
}

function updateFireParticles() {
    // Create new fire particles
    if (frameCount % 3 === 0) {
        fireParticles.push({
            x: random(width),
            y: height + 10,
            vx: random(-2, 2),
            vy: random(-8, -4),
            size: random(5, 15),
            life: 255,
            hue: random(0, 40)  // Warm colors
        });
    }
    
    // Update and draw fire particles
    for (let i = fireParticles.length - 1; i >= 0; i--) {
        let p = fireParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.98;  // Slow down vertical movement
        p.life -= 4;
        p.size *= 0.98;
        
        // Draw particle with heat distortion
        noStroke();
        let warmth = map(p.life, 0, 255, 0, 1);
        fill(p.hue + 10, 100, 50, p.life);
        circle(p.x + sin(frameCount * 0.1) * 2, p.y, p.size);
        
        // Remove dead particles
        if (p.life <= 0) {
            fireParticles.splice(i, 1);
        }
    }
}

function updateSmokeTrails() {
    // Add new smoke particles behind the character
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
    
    // Update and draw smoke particles
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
    collectibles.forEach((c, index) => {
        if (!c.collected) {
            push();
            translate(c.x, c.y + sin(frameCount * 0.05 + c.floatOffset) * 5);  // Floating effect
            
            // Draw magical rune circle
            c.runeRotation += 0.01;
            drawRuneCircle(c);
            
            // Draw glow effect
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

function drawRuneCircle(collectible) {
    push();
    rotate(collectible.runeRotation);
    noFill();
    stroke(255, 150, 50, 50);
    circle(0, 0, 40);
    
    // Draw rune symbols
    for (let i = 0; i < 6; i++) {
        push();
        rotate(i * TWO_PI/6);
        stroke(255, 150, 50, 70);
        line(0, 15, 0, 20);
        pop();
    }
    pop();
}

function drawDragonEgg() {
    // Egg shape
    fill(255, 200, 150);
    ellipse(0, 0, 25, 35);
    
    // Pattern on egg
    stroke(255, 150, 50);
    noFill();
    for (let i = 0; i < 3; i++) {
        arc(0, -5 + i * 5, 20 - i * 5, 10, 0, PI);
    }
}

function drawDragonScale() {
    push();
    rotate(sin(frameCount * 0.05) * 0.2);  // Gentle swaying
    
    // Main scale
    fill(255, 150, 50);
    beginShape();
    vertex(0, -15);
    vertex(12, 0);
    vertex(0, 15);
    vertex(-12, 0);
    endShape(CLOSE);
    
    // Iridescent effect
    noFill();
    stroke(255, 200, 150, 100);
    beginShape();
    vertex(0, -12);
    vertex(10, 0);
    vertex(0, 12);
    vertex(-10, 0);
    endShape(CLOSE);
    pop();
}

function drawDragonChest() {
    // Main chest
    fill(139, 69, 19);
    rect(-15, -12, 30, 24);
    
    // Lid
    fill(101, 67, 33);
    rect(-15, -12, 30, 8);
    
    // Gold trim
    fill(255, 215, 0);
    rect(-16, -4, 32, 2);
    
    // Lock
    fill(218, 165, 32);
    rect(-2, -8, 4, 8);
}

function checkCollectibles() {
    collectibles.forEach((c, index) => {
        if (!c.collected && dist(myPosition.x, myPosition.y, c.x, c.y) < 30) {
            c.collected = true;
            score += 10;
            
            // Create collection effect particles
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
            
            // Emit collectible collection to server
            if (socket) {
                socket.emit('collectible_collected', {
                    x: c.x,
                    y: c.y
                });
            }
        }
    });
    
    // Update collection effect particles
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

function drawCharacter(x, y, dragonSprite = characterSprite) {
    if (dragonSprite) {
        push();
        imageMode(CENTER);
        
        // Add heat distortion effect
        drawingContext.filter = 'url(#heat-distortion)';
        
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
        
        // Reset filter
        drawingContext.filter = 'none';
        pop();
    }
}

function updateScore() {
    fill(255, 150, 50);
    noStroke();
    textSize(20);
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
