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
let translationsLoaded = false;

// P5.js initialization with proper error handling
window.setup = function() {
    console.log('Setting up map...');
    try {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            throw new Error('Map container not found!');
        }

        // Wait for translations to load
        if (!translationsLoaded) {
            loadStrings('static/locales/en.json', strings => {
                window.p5Translations = strings;
                translationsLoaded = true;
                console.log('Translations loaded successfully');
            }, error => {
                console.error('Failed to load translations:', error);
                translationsLoaded = true; // Continue without translations
            });
        }

        const canvas = createCanvas(mapSize.width, mapSize.height);
        canvas.parent('mapContainer');
        frameRate(60);
        
        // Initialize game elements
        initializeCollectibles();
        initializeDragonSilhouettes();
        initializeNPCs();
        
        // Setup WebSocket handlers with proper error boundaries
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
        collectibles = Array.from({ length: 8 }, (_, i) => {
            const type = selectCollectibleType(collectibleTypes);
            return {
                id: `collectible_${i}`,
                x: random(50, mapSize.width - 50),
                y: random(50, mapSize.height - 50),
                collected: false,
                type: type.type,
                points: type.points,
                glowPhase: random(TWO_PI),
                floatOffset: random(TWO_PI),
                runeRotation: 0,
                collectedBy: null
            };
        });
    } catch (error) {
        console.error('Error initializing collectibles:', error);
        collectibles = []; // Fallback to empty array
    }
}

// Initialize NPCs with proper error handling
function initializeNPCs() {
    try {
        window.npcs = Array.from({ length: 3 }, (_, i) => ({
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

// Improved WebSocket handlers
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

        window.socket.on('collectible_collected', data => {
            handleCollectibleCollection(data);
        });

        window.socket.on('npc_interaction', data => {
            handleNPCInteraction(data);
        });
    } catch (error) {
        console.error('Error setting up WebSocket handlers:', error);
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

// Export necessary functions
window.preload = preload;
window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;
