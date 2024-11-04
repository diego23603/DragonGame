let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];

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

function initializeCollectibles() {
    const collectibleTypes = ['dragon_egg', 'dragon_scale', 'magic_crystal'];
    for (let i = 0; i < 5; i++) {
        collectibles.push({
            x: random(50, mapSize.width - 50),
            y: random(50, mapSize.height - 50),
            type: random(collectibleTypes),
            collected: false,
            value: random([10, 20, 30]),
            pulsePhase: random(TWO_PI)
        });
    }
}

function setup() {
    const canvas = createCanvas(mapSize.width, mapSize.height);
    canvas.parent('mapContainer');
    frameRate(60);
    
    initializeNPCs();
    initializeCollectibles();
    initBackgroundEffects();
}

function draw() {
    let bgColor = getDayNightColor();
    background(color(
        red(bgColor) * 1.2,
        green(bgColor) * 0.8,
        blue(bgColor) * 0.7
    ));
    
    drawBackgroundEffects();
    
    updateWeather();
    applyWeatherEffects();
    
    drawGrid();
    drawNPCs();
    drawCollectibles();
    
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y, user.dragonSprite, user.username);
    });
    
    drawCharacter(myPosition.x, myPosition.y, characterSprite, 'You');
    
    checkNPCInteractions();
    checkCollectibles();
    
    updateScore();
}

function drawGrid() {
    stroke(255, 255, 255, 20);
    strokeWeight(1);
    for (let x = 0; x < width; x += 50) {
        line(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 50) {
        line(0, y, width, y);
    }
}

function drawCharacter(x, y, dragonSprite = characterSprite, playerName = '') {
    if (dragonSprite) {
        push();
        imageMode(CENTER);
        
        // Draw dragon shadow
        noStroke();
        fill(0, 0, 0, 30);
        ellipse(x, y + 24, 40, 20);
        
        // Draw dragon sprite
        image(dragonSprite, x, y, 48, 48);
        
        if (playerName) {
            drawPlayerName(x, y, playerName);
        }
        
        pop();
    }
}

function drawPlayerName(x, y, name) {
    push();
    textAlign(CENTER);
    textSize(14);
    
    // Name background
    fill(0, 0, 0, 150);
    noStroke();
    const nameWidth = textWidth(name);
    rect(x - nameWidth/2 - 5, y - 45, nameWidth + 10, 20, 5);
    
    // Name text
    fill(255);
    text(name, x, y - 30);
    pop();
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
            
            // Draw NPC
            image(npc.sprite, npc.x, npc.y, 48, 48);
            
            // Draw NPC type label
            textAlign(CENTER);
            textSize(12);
            fill(0, 0, 0, 150);
            noStroke();
            text(npc.type, npc.x, npc.y - 35);
            
            pop();
        }
    });
}

function drawCollectibles() {
    collectibles.forEach(c => {
        if (!c.collected) {
            push();
            translate(c.x, c.y);
            
            // Pulsing effect
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
            textAlign(CENTER);
            textSize(12);
            fill(255);
            text(c.type, 0, pulseSize + 15);
            
            pop();
        }
    });
}

function checkCollectibles() {
    collectibles.forEach(c => {
        if (!c.collected && dist(myPosition.x, myPosition.y, c.x, c.y) < 30) {
            c.collected = true;
            score += c.value;
            
            // Create collection effect particles
            for (let i = 0; i < 10; i++) {
                particles.push({
                    x: c.x,
                    y: c.y,
                    vx: random(-3, 3),
                    vy: random(-3, 3),
                    life: 255,
                    color: color(255, 200, 0)
                });
            }
            
            document.getElementById('currentScore').textContent = score;
        }
    });
}

function checkNPCInteractions() {
    npcs.forEach(npc => {
        const d = dist(myPosition.x, myPosition.y, npc.x, npc.y);
        if (d < npc.interactionRadius) {
            // Show message with fade in
            npc.messageOpacity = min(npc.messageOpacity + 15, 255);
            
            if (npc.messageOpacity > 0) {
                push();
                fill(0, 0, 0, npc.messageOpacity * 0.7);
                noStroke();
                textAlign(CENTER);
                textSize(14);
                text(npc.message, npc.x, npc.y - 60);
                pop();
            }
        } else {
            // Fade out message
            npc.messageOpacity = max(npc.messageOpacity - 10, 0);
        }
    });
}

function updateScore() {
    fill(255, 150, 50);
    noStroke();
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 10, 10);
}

// Initialize characters when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof socket !== 'undefined') {
        socket.on('connect', () => {
            console.log('Connected to server');
        });
    }
});
