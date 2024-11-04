let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];

// NPC configuration
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

function setup() {
    const canvas = createCanvas(mapSize.width, mapSize.height);
    canvas.parent('mapContainer');
    frameRate(60);
    
    // Initialize NPCs
    initializeNPCs();
    
    // Initialize collectibles
    initializeCollectibles();
}

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
                messageOpacity: 0 // Add opacity for fade effect
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

function draw() {
    let bgColor = getDayNightColor();
    background(color(
        red(bgColor) * 1.2,
        green(bgColor) * 0.8,
        blue(bgColor) * 0.7
    ));
    
    drawGrid();
    drawNPCs();
    drawCollectibles();
    
    // Draw other players
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y, user.dragonSprite, user.username);
    });
    
    // Draw current player
    drawCharacter(myPosition.x, myPosition.y, characterSprite, 'You');
    
    // Check interactions
    checkNPCInteractions();
    checkCollectibles();
    
    // Draw score
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
        
        // Draw shadow
        noStroke();
        fill(0, 0, 0, 30);
        ellipse(x, y + 24, 40, 20);
        
        // Draw character
        image(dragonSprite, x, y, 48, 48);
        
        // Draw name
        if (playerName) {
            drawPlayerName(x, y, playerName);
        }
        
        pop();
    }
}

function drawPlayerName(x, y, name) {
    push();
    // Draw message bubble background
    const padding = 8;
    const fontSize = 16;
    textSize(fontSize);
    const textWidth = name.length * fontSize * 0.6; // Approximate width
    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = fontSize + padding * 2;
    const bubbleY = y - 50; // Position above character

    // Draw bubble shadow
    fill(0, 0, 0, 50);
    noStroke();
    rect(x - bubbleWidth/2 + 2, bubbleY + 2, bubbleWidth, bubbleHeight, 10);

    // Draw bubble background
    fill(0, 0, 0, 180);
    rect(x - bubbleWidth/2, bubbleY, bubbleWidth, bubbleHeight, 10);

    // Draw text
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(fontSize);
    text(name, x, bubbleY + bubbleHeight/2);
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
            
            // Draw type label with improved visibility
            const labelY = npc.y - 35;
            textSize(14);
            const labelWidth = textWidth(npc.type);
            
            // Draw label background
            fill(0, 0, 0, 180);
            noStroke();
            rect(npc.x - labelWidth/2 - 5, labelY - 10, labelWidth + 10, 20, 5);
            
            // Draw label text
            fill(255);
            textAlign(CENTER);
            text(npc.type, npc.x, labelY);
            
            pop();
        }
    });
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
            
            // Draw type label with improved visibility
            textAlign(CENTER);
            textSize(12);
            const labelY = pulseSize + 15;
            const labelWidth = textWidth(c.type);
            
            // Draw label background
            fill(0, 0, 0, 180);
            noStroke();
            rect(-labelWidth/2 - 5, labelY - 10, labelWidth + 10, 20, 5);
            
            // Draw label text
            fill(255);
            text(c.type, 0, labelY + 5);
            
            pop();
        }
    });
}

function checkNPCInteractions() {
    npcs.forEach(npc => {
        const d = dist(myPosition.x, myPosition.y, npc.x, npc.y);
        if (d < npc.interactionRadius) {
            // Fade in message
            npc.messageOpacity = min(npc.messageOpacity + 15, 255);
            
            // Display message above NPC with improved styling
            if (npc.messageOpacity > 0) {
                push();
                const fontSize = 16;
                textSize(fontSize);
                const messageWidth = textWidth(npc.message);
                const padding = 10;
                const bubbleWidth = messageWidth + padding * 2;
                const bubbleHeight = fontSize + padding * 2;
                const bubbleY = npc.y - 70;

                // Draw message bubble background with fade effect
                fill(0, 0, 0, npc.messageOpacity * 0.7);
                noStroke();
                rect(npc.x - bubbleWidth/2, bubbleY, bubbleWidth, bubbleHeight, 10);

                // Draw text with fade effect
                fill(255, npc.messageOpacity);
                textAlign(CENTER, CENTER);
                text(npc.message, npc.x, bubbleY + bubbleHeight/2);
                pop();
            }
        } else {
            // Fade out message when out of range
            npc.messageOpacity = max(npc.messageOpacity - 10, 0);
        }
    });
}

function checkCollectibles() {
    collectibles.forEach(c => {
        if (!c.collected && dist(myPosition.x, myPosition.y, c.x, c.y) < 30) {
            c.collected = true;
            score += c.value;
            
            // Create particles
            for (let i = 0; i < 10; i++) {
                particles.push({
                    x: c.x,
                    y: c.y,
                    vx: random(-3, 3),
                    vy: random(-3, 3),
                    life: 255
                });
            }
            
            // Update score display
            document.getElementById('currentScore').textContent = score;
            
            // Emit collection event
            if (socket) {
                socket.emit('collectible_collected', { x: c.x, y: c.y });
            }
        }
    });
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 5;
        
        // Draw particle
        noStroke();
        fill(255, 200, 0, p.life);
        circle(p.x, p.y, 5);
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateScore() {
    fill(255, 150, 50);
    noStroke();
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 10, 10);
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
