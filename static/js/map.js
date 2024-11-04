let users = new Map();
let myPosition = { x: 400, y: 300 }; // Start in center
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];

// Particle Class for special effects
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alpha = 1;
        this.size = random(3, 8);
        this.speedX = random(-1, 1);
        this.speedY = random(-1, 1);
        this.color = color(255, 215, 0);
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= 0.02;
    }

    draw() {
        if (this.alpha > 0) {
            push();
            noStroke();
            this.color.setAlpha(this.alpha * 255);
            fill(this.color);
            circle(this.x, this.y, this.size);
            pop();
        }
    }
}

// NPC Class
class NPC {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = Math.random() * Math.PI * 2;
        this.speed = 1;
        this.particleTimer = 0;
    }

    update() {
        // Random movement pattern
        this.direction += (Math.random() - 0.5) * 0.1;
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        // Keep NPCs within bounds
        this.x = Math.max(16, Math.min(mapSize.width - 16, this.x));
        this.y = Math.max(16, Math.min(mapSize.height - 16, this.y));

        // Add particle effect trail
        this.particleTimer++;
        if (this.particleTimer > 10) {
            particles.push(new Particle(this.x, this.y));
            this.particleTimer = 0;
        }
    }
}

// Collectible Class
class Collectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.collected = false;
        this.pulseSize = 0;
        this.pulseDirection = 1;
        this.particleTimer = 0;
    }

    update() {
        if (!this.collected) {
            // Pulsing animation
            this.pulseSize += 0.1 * this.pulseDirection;
            if (this.pulseSize > 1) this.pulseDirection = -1;
            if (this.pulseSize < 0) this.pulseDirection = 1;

            // Add sparkle particles
            this.particleTimer++;
            if (this.particleTimer > 30) {
                particles.push(new Particle(
                    this.x + random(-10, 10),
                    this.y + random(-10, 10)
                ));
                this.particleTimer = 0;
            }
        }
    }
}

function preload() {
    characterSprite = loadImage('/static/images/character_sprite.svg');
}

function setup() {
    const canvas = createCanvas(mapSize.width, mapSize.height);
    canvas.parent('mapContainer');
    
    // Initialize NPCs
    for (let i = 0; i < 5; i++) {
        npcs.push(new NPC(
            random(50, mapSize.width - 50),
            random(50, mapSize.height - 50)
        ));
    }
    
    // Initialize collectibles
    for (let i = 0; i < 10; i++) {
        collectibles.push(new Collectible(
            random(50, mapSize.width - 50),
            random(50, mapSize.height - 50)
        ));
    }
}

function draw() {
    // Get background color from day/night cycle and apply dragon theme
    let bgColor = getDayNightColor();
    let r = red(bgColor);
    let g = green(bgColor);
    let b = blue(bgColor);
    // Add a slight reddish tint for dragon theme
    background(r + 20, g * 0.8, b * 0.8);
    
    // Draw grid with dragon theme
    drawGrid();
    
    // Update and draw particles
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    // Update and draw NPCs
    npcs.forEach(npc => {
        npc.update();
        drawNPC(npc.x, npc.y);
    });
    
    // Update and draw collectibles
    collectibles.forEach(collectible => {
        if (!collectible.collected) {
            collectible.update();
            drawCollectible(collectible);
            
            // Check for collision with player
            if (dist(myPosition.x, myPosition.y, collectible.x, collectible.y) < 20) {
                collectible.collected = true;
                score += 10;
                // Add collection effect
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(collectible.x, collectible.y));
                }
                if (socket) {
                    socket.emit('collectible_collected', {
                        x: collectible.x,
                        y: collectible.y
                    });
                }
            }
        }
    });
    
    // Draw all users
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y);
    });
    
    // Draw local player
    drawCharacter(myPosition.x, myPosition.y);
    
    // Draw score with dragon theme
    fill(255, 215, 0);
    noStroke();
    textSize(16);
    text(`Score: ${score}`, 10, 20);
}

function drawGrid() {
    stroke(255, 100, 100, 30);
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

function drawNPC(x, y) {
    push();
    fill(200, 50, 50);
    stroke(255, 100, 100);
    strokeWeight(2);
    circle(x, y, 24);
    // Add glowing effect
    noFill();
    stroke(255, 100, 100, 100);
    circle(x, y, 28 + sin(frameCount * 0.1) * 4);
    pop();
}

function drawCollectible(collectible) {
    push();
    fill(255, 215, 0, 200);
    stroke(255, 200, 0);
    strokeWeight(2);
    let size = 12 + collectible.pulseSize * 4;
    star(collectible.x, collectible.y, size/2, size, 5);
    // Add glowing effect
    noFill();
    stroke(255, 215, 0, 100);
    star(collectible.x, collectible.y, size/2 + 2, size + 2, 5);
    pop();
}

function star(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle/2.0;
    beginShape();
    for (let a = -PI/2; a < TWO_PI-PI/2; a += angle) {
        let sx = x + cos(a) * radius2;
        let sy = y + sin(a) * radius2;
        vertex(sx, sy);
        sx = x + cos(a+halfAngle) * radius1;
        sy = y + sin(a+halfAngle) * radius1;
        vertex(sx, sy);
    }
    endShape(CLOSE);
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
        // Add glowing effect
        noFill();
        stroke(255, 100, 100, 50 + sin(frameCount * 0.1) * 30);
        circle(x, y, 40);
        image(characterSprite, x, y, 32, 32);
        pop();
    }
}
