let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];
let castleImage;
let fireParticles = [];
let windParticles = [];

// Castle dimensions
const CASTLE_WIDTH = 300;
const CASTLE_HEIGHT = 400;
const CASTLE_X = mapSize.width / 2 - CASTLE_WIDTH / 2;
const CASTLE_Y = mapSize.height - CASTLE_HEIGHT;

const NPC_TYPES = {
    MERCHANT: {
        sprite: '/static/images/dragons/green_dragon.svg',
        message: 'Welcome traveler! Want to trade?'
    },
    GUARD: {
        sprite: '/static/images/dragons/red_dragon.svg',
        message: 'Keep the peace in Dragon World!'
    },
    WIZARD: {
        sprite: '/static/images/dragons/blue_dragon.svg',
        message: 'Seeking ancient dragon magic?'
    }
};

// Initialize NPCs with predefined positions
function initializeNPCs() {
    const npcPositions = [
        { x: 100, y: 100, type: 'MERCHANT' },
        { x: 700, y: 500, type: 'GUARD' },
        { x: 400, y: 200, type: 'WIZARD' }
    ];
    
    npcPositions.forEach(pos => {
        const npcType = NPC_TYPES[pos.type];
        loadImage(npcType.sprite, img => {
            npcs.push({
                x: pos.x,
                y: pos.y,
                sprite: img,
                type: pos.type,
                message: npcType.message,
                interactionRadius: 60,
                lastInteraction: 0,
                messageOpacity: 0
            });
        });
    });
}

// Initialize collectibles with random positions
function initializeCollectibles() {
    for (let i = 0; i < 5; i++) {
        collectibles.push({
            x: random(50, mapSize.width - 50),
            y: random(50, mapSize.height - 50),
            type: random(['dragon_egg', 'dragon_scale', 'magic_crystal']),
            collected: false,
            value: random([10, 20, 30]),
            pulsePhase: random(TWO_PI)
        });
    }
}

function drawCastleSilhouette(graphics) {
    graphics.clear();
    
    // Main castle body
    graphics.fill(30, 30, 40);
    graphics.noStroke();
    graphics.rect(50, 100, 200, 300);
    
    // Towers
    graphics.rect(25, 50, 50, 350);
    graphics.rect(225, 50, 50, 350);
    
    // Tower tops
    graphics.triangle(25, 50, 50, 0, 75, 50);
    graphics.triangle(225, 50, 250, 0, 275, 50);
    
    // Windows with glowing effect
    graphics.fill(255, 150, 0, 100);
    for(let i = 0; i < 3; i++) {
        graphics.rect(100 + i * 50, 150, 30, 50);
        graphics.rect(100 + i * 50, 250, 30, 50);
    }
}

function initializeParticles() {
    // Initialize fire particles
    for(let i = 0; i < 50; i++) {
        fireParticles.push(createFireParticle());
    }
    
    // Initialize wind particles
    for(let i = 0; i < 30; i++) {
        windParticles.push(createWindParticle());
    }
}

function createFireParticle() {
    return {
        x: random(CASTLE_X + 50, CASTLE_X + CASTLE_WIDTH - 50),
        y: CASTLE_Y + CASTLE_HEIGHT,
        vx: random(-1, 1),
        vy: random(-5, -2),
        life: random(100, 255),
        size: random(5, 15)
    };
}

function createWindParticle() {
    return {
        x: random(width),
        y: random(height),
        vx: random(1, 3),
        vy: random(-0.5, 0.5),
        size: random(2, 6),
        opacity: random(50, 150)
    };
}

function setup() {
    try {
        const canvas = createCanvas(mapSize.width, mapSize.height);
        canvas.parent('mapContainer');
        frameRate(60);
        
        // Create castle silhouette
        castleImage = createGraphics(CASTLE_WIDTH, CASTLE_HEIGHT);
        drawCastleSilhouette(castleImage);
        
        // Initialize game elements
        initializeNPCs();
        initializeCollectibles();
        initializeParticles();
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error during game initialization:', error);
    }
}

function updateParticles() {
    // Update fire particles
    for(let i = fireParticles.length - 1; i >= 0; i--) {
        let p = fireParticles[i];
        p.x += p.vx + sin(frameCount * 0.1) * 0.5;
        p.y += p.vy;
        p.life -= 2;
        p.size *= 0.99;
        
        if(p.life <= 0) {
            fireParticles[i] = createFireParticle();
        }
    }
    
    // Update wind particles
    for(let i = windParticles.length - 1; i >= 0; i--) {
        let p = windParticles[i];
        p.x += p.vx;
        p.y += p.vy + sin(frameCount * 0.05 + p.x * 0.1) * 0.5;
        
        if(p.x > width) {
            p.x = -10;
            p.y = random(height);
        }
    }
}

function drawParticles() {
    // Draw fire particles
    fireParticles.forEach(p => {
        noStroke();
        const gradient = drawingContext.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(255, 200, 0, ${p.life/255})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${p.life/510})`);
        gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
        drawingContext.fillStyle = gradient;
        circle(p.x, p.y, p.size * 2);
    });
    
    // Draw wind particles (embers and smoke)
    windParticles.forEach(p => {
        noStroke();
        if(random() < 0.5) {
            // Embers
            fill(255, 150, 0, p.opacity);
        } else {
            // Smoke
            fill(200, 200, 200, p.opacity * 0.5);
        }
        circle(p.x, p.y, p.size);
    });
}

function drawNPCs() {
    npcs.forEach(npc => {
        if (npc.sprite) {
            push();
            imageMode(CENTER);
            
            // Draw interaction radius
            noFill();
            stroke(255, 255, 255, 50 + sin(frameCount * 0.05) * 20);
            circle(npc.x, npc.y, npc.interactionRadius * 2);
            
            // Draw NPC sprite
            image(npc.sprite, npc.x, npc.y, 48, 48);
            
            // Draw NPC label
            textAlign(CENTER);
            textSize(14);
            fill(255);
            text(npc.type, npc.x, npc.y - 35);
            
            pop();
        }
    });
}

function drawCharacter(x, y, dragonSprite, playerName) {
    if (dragonSprite) {
        push();
        imageMode(CENTER);
        
        // Draw shadow
        noStroke();
        fill(0, 0, 0, 30);
        ellipse(x, y + 24, 40, 20);
        
        // Draw character
        image(dragonSprite, x, y, 48, 48);
        
        // Draw player name
        if (playerName) {
            textAlign(CENTER);
            textSize(14);
            fill(255);
            text(playerName, x, y - 35);
        }
        
        pop();
    }
}

function draw() {
    try {
        let bgColor = getDayNightColor();
        background(color(
            red(bgColor) * 0.8,
            green(bgColor) * 0.7,
            blue(bgColor) * 0.9
        ));
        
        // Draw atmospheric background
        drawingContext.save();
        const atmosphere = drawingContext.createRadialGradient(
            width/2, height/2, 0,
            width/2, height/2, height
        );
        atmosphere.addColorStop(0, 'rgba(255, 100, 0, 0.1)');
        atmosphere.addColorStop(1, 'rgba(0, 0, 50, 0.2)');
        drawingContext.fillStyle = atmosphere;
        rect(0, 0, width, height);
        drawingContext.restore();
        
        // Draw castle and effects
        image(castleImage, CASTLE_X, CASTLE_Y);
        updateParticles();
        drawParticles();
        
        // Draw game elements
        updateWeather();
        applyWeatherEffects();
        drawNPCs();
        drawCollectibles();
        
        // Draw characters
        users.forEach((user, id) => {
            drawCharacter(user.x, user.y, user.dragonSprite, user.username);
        });
        drawCharacter(myPosition.x, myPosition.y, characterSprite, 'You');
        
        // Update interactions
        checkNPCInteractions();
        checkCollectibles();
        updateScore();
        
    } catch (error) {
        console.error('Error in draw loop:', error);
    }
}

function checkNPCInteractions() {
    npcs.forEach(npc => {
        const d = dist(myPosition.x, myPosition.y, npc.x, npc.y);
        if (d < npc.interactionRadius) {
            npc.messageOpacity = min(npc.messageOpacity + 15, 255);
            
            if (npc.messageOpacity > 0) {
                push();
                fill(0, 0, 0, npc.messageOpacity * 0.7);
                noStroke();
                rectMode(CENTER);
                const messageWidth = textWidth(npc.message) + 20;
                rect(npc.x, npc.y - 70, messageWidth, 30, 10);
                
                fill(255, npc.messageOpacity);
                textAlign(CENTER, CENTER);
                text(npc.message, npc.x, npc.y - 70);
                pop();
            }
        } else {
            npc.messageOpacity = max(npc.messageOpacity - 10, 0);
        }
    });
}

function checkCollectibles() {
    collectibles.forEach(c => {
        if (!c.collected && dist(myPosition.x, myPosition.y, c.x, c.y) < 30) {
            c.collected = true;
            score += c.value;
            createCollectibleParticles(c.x, c.y);
            updateScore();
        }
    });
}

function createCollectibleParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: random(-3, 3),
            vy: random(-3, 3),
            life: 255
        });
    }
}

function drawCollectibles() {
    collectibles.forEach(c => {
        if (!c.collected) {
            push();
            translate(c.x, c.y);
            
            // Pulse effect
            let pulseSize = 20 + sin(frameCount * 0.05 + c.pulsePhase) * 5;
            
            // Glow effect
            noFill();
            for (let i = 0; i < 3; i++) {
                stroke(255, 200, 0, 50 - i * 15);
                circle(0, 0, pulseSize + i * 10);
            }
            
            // Draw collectible
            fill(255, 200, 0);
            noStroke();
            circle(0, 0, pulseSize);
            
            // Label
            textAlign(CENTER, CENTER);
            fill(255);
            text(c.type, 0, pulseSize + 15);
            
            pop();
        }
    });
}

function updateScore() {
    document.getElementById('currentScore').textContent = score;
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
