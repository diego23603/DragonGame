// Global state variables with proper declarations
let users = new Map();
let myPosition = { x: 400, y: 300 };
let lastPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite = null;
let collectibles = [];
let score = 0;
let particles = [];
let fireParticles = [];
let smokeTrails = [];
let dragonSilhouettes = [];
let isMovementEnabled = false;
let p5Loaded = false;

// Error message handling
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translateX(-50%)';
    errorDiv.style.zIndex = '1000';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Preload function for p5.js
window.preload = function() {
    try {
        // Load default sprite
        loadImage('/static/images/dragons/red_dragon.svg', 
            img => {
                characterSprite = img;
            },
            error => {
                console.error('Failed to load default sprite:', error);
                showErrorMessage('Failed to load game assets');
            }
        );
    } catch (error) {
        console.error('Error in preload:', error);
        showErrorMessage('Failed to initialize game assets');
    }
};

// Helper functions
function calculateDistance(pos1, pos2) {
    return dist(pos1.x, pos1.y, pos2.x, pos2.y);
}

// Initialize dragon silhouettes
function initializeDragonSilhouettes() {
    try {
        dragonSilhouettes = Array(3).fill().map(() => ({
            x: random(width),
            y: random(height),
            size: random(100, 200),
            speed: random(0.5, 1.5),
            offset: random(TWO_PI),
            direction: random() > 0.5 ? 1 : -1
        }));
    } catch (error) {
        console.error('Error initializing dragon silhouettes:', error);
        dragonSilhouettes = []; // Fallback to empty array
    }
}

// Initialize p5 instance and canvas
window.setup = function() {
    console.log('Setting up map...');
    try {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            throw new Error('Map container not found!');
        }

        const canvas = createCanvas(mapSize.width, mapSize.height);
        canvas.parent('mapContainer');
        frameRate(60);
        
        // Initialize game elements
        initializeCollectibles();
        initializeDragonSilhouettes();
        initializeNPCs();
        
        // Setup WebSocket handlers
        setupWebSocketHandlers();
        
        p5Loaded = true;
    } catch (error) {
        console.error('Error in setup:', error);
        showErrorMessage('Failed to initialize game. Please refresh the page.');
    }
};

// Improved collectibles initialization
function initializeCollectibles() {
    const collectibleTypes = [
        { type: 'dragon_egg', points: 15, rarity: 0.3 },
        { type: 'dragon_scale', points: 10, rarity: 0.5 },
        { type: 'dragon_chest', points: 20, rarity: 0.2 }
    ];

    try {
        collectibles = Array(8).fill().map((_, i) => ({
            id: `collectible_${i}`,
            x: random(50, mapSize.width - 50),
            y: random(50, mapSize.height - 50),
            collected: false,
            type: selectCollectibleType(collectibleTypes).type,
            points: selectCollectibleType(collectibleTypes).points,
            glowPhase: random(TWO_PI),
            floatOffset: random(TWO_PI),
            runeRotation: 0,
            collectedBy: null
        }));
    } catch (error) {
        console.error('Error initializing collectibles:', error);
        collectibles = []; // Fallback to empty array
    }
}

function selectCollectibleType(types) {
    const roll = random();
    let cumulativeProbability = 0;
    
    for (let i = 0; i < types.length; i++) {
        cumulativeProbability += types[i].rarity;
        if (roll < cumulativeProbability) {
            return types[i];
        }
    }
    return types[0]; // Default to first type if something goes wrong
}

// Initialize NPCs with proper error handling
function initializeNPCs() {
    try {
        window.npcs = Array(3).fill().map((_, i) => ({
            id: `npc_${i}`,
            x: random(50, mapSize.width - 50),
            y: random(50, mapSize.height - 50),
            type: ['merchant', 'wizard', 'warrior'][i % 3],
            interactionRadius: 50,
            dialogueState: 'idle',
            messages: [
                "Welcome, traveler!",
                "Would you like to trade?",
                "The dragon realms are full of mysteries..."
            ]
        }));
    } catch (error) {
        console.error('Error initializing NPCs:', error);
        window.npcs = []; // Fallback to empty array
    }
}

// Main draw loop with error boundaries
window.draw = function() {
    if (!p5Loaded || !isMovementEnabled) return;

    try {
        let bgColor = window.getDayNightColor ? getDayNightColor() : color(30, 20, 40);
        background(bgColor);
        
        // Draw map elements
        drawGrid();
        drawDragonSilhouettes();
        drawCollectibles();
        drawNPCs();
        drawPlayers();
        
        // Update game state
        updateParticles();
        checkInteractions();
        updateScore();
    } catch (error) {
        console.error('Error in draw loop:', error);
    }
};

// Draw functions with error handling
function drawGrid() {
    try {
        stroke(100, 100, 100, 50);
        strokeWeight(1);
        for (let x = 0; x < width; x += 50) {
            line(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 50) {
            line(0, y, width, y);
        }
    } catch (error) {
        console.error('Error drawing grid:', error);
    }
}

function drawDragonSilhouettes() {
    try {
        dragonSilhouettes.forEach(silhouette => {
            push();
            noFill();
            stroke(255, 100, 50, 30);
            strokeWeight(2);
            
            // Update position
            silhouette.x += silhouette.speed * silhouette.direction;
            if (silhouette.x > width + 100) silhouette.x = -100;
            if (silhouette.x < -100) silhouette.x = width + 100;
            
            // Draw shadow
            let y = silhouette.y + sin(frameCount * 0.02 + silhouette.offset) * 20;
            beginShape();
            for (let i = 0; i < TWO_PI; i += 0.5) {
                let px = silhouette.x + cos(i) * silhouette.size * 0.5;
                let py = y + sin(i) * silhouette.size * 0.3;
                curveVertex(px, py);
            }
            endShape(CLOSE);
            pop();
        });
    } catch (error) {
        console.error('Error drawing dragon silhouettes:', error);
    }
}

function drawCollectibles() {
    try {
        collectibles.forEach(collectible => {
            if (collectible.collected) return;
            
            push();
            translate(collectible.x, collectible.y);
            rotate(collectible.runeRotation);
            
            // Draw glow effect
            let glowSize = 30 + sin(frameCount * 0.05 + collectible.glowPhase) * 8;
            for (let i = 0; i < 3; i++) {
                noFill();
                stroke(255, 150, 50, 40 - i * 10);
                circle(0, 0, glowSize + i * 10);
            }
            
            // Draw collectible
            fill(255, 200, 150);
            noStroke();
            if (collectible.type === 'dragon_egg') {
                ellipse(0, 0, 25, 35);
            } else if (collectible.type === 'dragon_scale') {
                beginShape();
                vertex(0, -15);
                vertex(12, 0);
                vertex(0, 15);
                vertex(-12, 0);
                endShape(CLOSE);
            }
            
            pop();
        });
    } catch (error) {
        console.error('Error drawing collectibles:', error);
    }
}

function drawNPCs() {
    try {
        if (!window.npcs) return;
        window.npcs.forEach(npc => {
            push();
            translate(npc.x, npc.y);
            
            // Draw NPC
            fill(200, 200, 200);
            stroke(100, 100, 100);
            ellipse(0, 0, 40, 40);
            
            // Draw interaction indicator if player is nearby
            const distance = dist(myPosition.x, myPosition.y, npc.x, npc.y);
            if (distance < npc.interactionRadius) {
                noFill();
                stroke(255, 255, 0, 150);
                circle(0, 0, npc.interactionRadius * 2);
                
                // Draw interaction prompt
                fill(255);
                noStroke();
                textAlign(CENTER);
                text('Press E to interact', 0, -30);
            }
            
            pop();
            
            // Draw dialogue if active
            if (npc.dialogueState === 'talking') {
                drawDialogue(npc);
            }
        });
    } catch (error) {
        console.error('Error drawing NPCs:', error);
    }
}

function drawDialogue(npc) {
    push();
    translate(npc.x, npc.y - 60);
    
    // Draw dialogue box
    fill(0, 0, 0, 200);
    stroke(255, 200);
    rect(-100, -40, 200, 40, 10);
    
    // Draw text
    fill(255);
    noStroke();
    textAlign(CENTER);
    textSize(12);
    text(npc.messages[frameCount % npc.messages.length], 0, -20);
    pop();
}

function drawPlayers() {
    try {
        // Draw other players
        users.forEach((user, id) => {
            const dist = calculateDistance(myPosition, user);
            if (dist < 100) {
                drawInteractionEffect(user.x, user.y);
            }
            drawCharacter(user.x, user.y, user.dragonSprite || characterSprite);
            drawPlayerName(user.x, user.y - 30, user.username || 'Player');
        });
        
        // Draw local player
        if (characterSprite) {
            drawCharacter(myPosition.x, myPosition.y, characterSprite);
            drawPlayerName(myPosition.x, myPosition.y - 30, window.username || 'You');
        }
    } catch (error) {
        console.error('Error drawing players:', error);
    }
}

function drawCharacter(x, y, sprite) {
    if (!sprite) return;
    push();
    imageMode(CENTER);
    image(sprite, x, y, 48, 48);
    pop();
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
    stroke(255, 255, 255, 50);
    let size = 20 + sin(frameCount * 0.1) * 5;
    circle(x, y, size);
    pop();
}

function updateParticles() {
    // Update particle effects
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 2;
    });
}

function checkInteractions() {
    // Check collectible collection
    collectibles.forEach(collectible => {
        if (!collectible.collected && dist(myPosition.x, myPosition.y, collectible.x, collectible.y) < 30) {
            collectCollectible(collectible);
        }
    });
}

function collectCollectible(collectible) {
    collectible.collected = true;
    score += collectible.points;
    updateScore();
    
    // Create collection effect
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: collectible.x,
            y: collectible.y,
            vx: random(-2, 2),
            vy: random(-2, 2),
            alpha: 255
        });
    }
    
    // Emit collection event
    if (window.socket?.connected) {
        window.socket.emit('collectible_collected', {
            id: collectible.id,
            x: collectible.x,
            y: collectible.y,
            collectedBy: window.username
        });
    }
}

function updateScore() {
    const scoreElement = document.getElementById('currentScore');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}

// Event handlers
window.keyPressed = function() {
    if (!p5Loaded || !isMovementEnabled) return;

    try {
        // Movement
        if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || 
            keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
            handleMovement();
        }
        
        // NPC Interaction
        if (keyCode === 69) { // 'E' key
            handleNPCInteraction();
        }
    } catch (error) {
        console.error('Error handling key press:', error);
    }
};

function handleMovement() {
    const step = 10;
    lastPosition = { ...myPosition };

    switch (keyCode) {
        case LEFT_ARROW:
            myPosition.x = max(24, myPosition.x - step);
            break;
        case RIGHT_ARROW:
            myPosition.x = min(mapSize.width - 24, myPosition.x + step);
            break;
        case UP_ARROW:
            myPosition.y = max(24, myPosition.y - step);
            break;
        case DOWN_ARROW:
            myPosition.y = min(mapSize.height - 24, myPosition.y + step);
            break;
    }

    if (window.socket?.connected) {
        window.socket.emit('position_update', {
            x: myPosition.x,
            y: myPosition.y,
            dragonId: window.selectedDragon?.id,
            username: window.username
        });
    }
}

function handleNPCInteraction() {
    const nearbyNPC = window.npcs?.find(npc => 
        dist(myPosition.x, myPosition.y, npc.x, npc.y) < npc.interactionRadius
    );
    
    if (nearbyNPC) {
        nearbyNPC.dialogueState = nearbyNPC.dialogueState === 'talking' ? 'idle' : 'talking';
    }
}

// WebSocket handlers
function setupWebSocketHandlers() {
    if (!window.socket) return;

    try {
        window.socket.on('connect', () => {
            console.log('WebSocket connected, enabling movement');
            isMovementEnabled = true;
        });

        window.socket.on('disconnect', () => {
            console.log('WebSocket disconnected, disabling movement');
            isMovementEnabled = false;
        });
    } catch (error) {
        console.error('Error setting up WebSocket handlers:', error);
    }
}
