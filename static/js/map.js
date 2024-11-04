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
let lastPosition = { x: 400, y: 300 };

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
    
    for (let i = 0; i < 3; i++) {
        dragonSilhouettes.push({
            x: random(width),
            y: random(height),
            size: random(100, 200),
            speed: random(0.5, 1.5),
            offset: random(TWO_PI)
        });
    }
    
    if (!characterSprite) {
        const defaultDragon = '/static/images/dragons/red_dragon.svg';
        loadImage(defaultDragon, img => {
            characterSprite = img;
        });
    }
}

function draw() {
    let bgColor = getDayNightColor();
    background(color(
        red(bgColor) * 1.2,
        green(bgColor) * 0.8,
        blue(bgColor) * 0.7
    ));
    
    drawDragonScales();
    drawDragonSilhouettes();
    drawDragonGrid();
    drawDecorativeElements();
    updateFireParticles();
    updateSmokeTrails();
    drawCollectibles();
    
    myPosition.x = lerp(lastPosition.x, myPosition.x, 0.3);
    myPosition.y = lerp(lastPosition.y, myPosition.y, 0.3);
    
    users.forEach((user, id) => {
        const dist = calculateDistance(myPosition, user);
        if (dist < 100) {
            drawInteractionEffect(user.x, user.y);
        }
        drawCharacter(user.x, user.y, user.dragonSprite || characterSprite);
        drawPlayerName(user.x, user.y - 30, user.username || 'Player');
    });
    
    drawCharacter(myPosition.x, myPosition.y, characterSprite);
    drawPlayerName(myPosition.x, myPosition.y - 30, window.username || 'You');
    updateScore();
    checkCollectibles();
    checkPlayerCollisions();
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
    
    noFill();
    for(let i = 0; i < 3; i++) {
        stroke(255, 100, 50, 50 - i * 10);
        circle(0, 0, elem.size + i * 10);
    }
    
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
    
    fill(80, 40, 40);
    rect(-elem.size/3, -elem.size/4, elem.size*2/3, elem.size/4);
    
    fill(100, 50, 50);
    beginShape();
    vertex(0, -elem.size/2);
    vertex(elem.size/3, -elem.size*3/4);
    vertex(0, -elem.size);
    vertex(-elem.size/3, -elem.size*3/4);
    endShape(CLOSE);
    
    noFill();
    stroke(255, 100, 50, 30 + sin(frameCount * 0.05) * 20);
    circle(0, -elem.size/2, elem.size/2);
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
        let warmth = map(p.life, 0, 255, 0, 1);
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
    collectibles.forEach((c, index) => {
        if (!c.collected) {
            push();
            translate(c.x, c.y + sin(frameCount * 0.05 + c.floatOffset) * 5);
            
            c.runeRotation += 0.01;
            drawRuneCircle(c);
            
            let glowSize = 30 + sin(frameCount * 0.05 + c.glowPhase) * 8;
            for (let i = 0; i < 3; i++) {
                noFill();
                stroke(255, 150, 50, 40 - i * 10);
                circle(0, 0, glowSize + i * 10);
            }
            
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
    fill(255, 200, 150);
    ellipse(0, 0, 25, 35);
    
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
    fill(139, 69, 19);
    rect(-15, -12, 30, 24);
    
    fill(101, 67, 33);
    rect(-15, -12, 30, 8);
    
    fill(255, 215, 0);
    rect(-16, -4, 32, 2);
    
    fill(218, 165, 32);
    rect(-2, -8, 4, 8);
}

function drawPlayerName(x, y, name) {
    push();
    fill(255);
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

function calculateDistance(pos1, pos2) {
    return dist(pos1.x, pos1.y, pos2.x, pos2.y);
}

function checkPlayerCollisions() {
    users.forEach((user, id) => {
        const distance = calculateDistance(myPosition, user);
        if (distance < 50) {
            createCollisionEffect(
                (myPosition.x + user.x) / 2,
                (myPosition.y + user.y) / 2
            );
        }
    });
}

function createCollisionEffect(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: random(-2, 2),
            vy: random(-2, 2),
            life: 255,
            color: color(255, 200, 50)
        });
    }
}

function checkCollectibles() {
    collectibles.forEach((c, index) => {
        if (!c.collected && dist(myPosition.x, myPosition.y, c.x, c.y) < 30) {
            c.collected = true;
            c.collectedBy = window.username;
            score += 10;
            document.getElementById('currentScore').textContent = score;
            
            createCollectionEffect(c.x, c.y);
            
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
    
    updateParticles();
}

function createCollectionEffect(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: random(-3, 3),
            vy: random(-3, 3),
            life: 255,
            color: color(255, 200, 50)
        });
    }
}

function updateParticles() {
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
    try {
        if (!dragonSprite) {
            console.warn('Missing dragon sprite for character rendering');
            push();
            fill(255, 0, 0);
            noStroke();
            circle(x, y, 24);
            pop();
            return;
        }

        push();
        imageMode(CENTER);
        
        noStroke();
        fill(0, 0, 0, 30);
        ellipse(x, y + 24, 40, 20);
        
        image(dragonSprite, x, y, 48, 48);
        pop();
    } catch (error) {
        console.error('Error drawing character:', error);
        push();
        fill(255, 0, 0);
        noStroke();
        circle(x, y, 24);
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
    if (!characterSprite) {
        console.warn('Character sprite not loaded yet - movement disabled');
        return;
    }

    const step = 10;
    let moved = false;
    lastPosition = { ...myPosition };
    
    if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || 
        keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
        event.preventDefault();
    }
    
    try {
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
            try {
                console.log('Emitting position update:', {
                    x: myPosition.x,
                    y: myPosition.y,
                    dragonId: selectedDragon?.id
                });
                
                socket.emit('position_update', {
                    x: myPosition.x,
                    y: myPosition.y,
                    dragonId: selectedDragon?.id,
                    username: window.username
                });
            } catch (socketError) {
                console.error('Error emitting position update:', socketError);
            }
        }
    } catch (error) {
        console.error('Error in keyPressed function:', error);
        myPosition = { ...lastPosition };
    }
}

window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;