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

// Asset loading in preload
function preload() {
    // Load default sprite
    loadImage('/static/images/dragons/red_dragon.svg', img => {
        characterSprite = img;
    }, error => {
        console.error('Failed to load default sprite:', error);
    });
}

// Helper functions
function calculateDistance(pos1, pos2) {
    return dist(pos1.x, pos1.y, pos2.x, pos2.y);
}

// Initialize p5 instance and canvas
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
        
        // Initialize collectibles
        initializeCollectibles();
        initializeDragonSilhouettes();
        
        // WebSocket connection status handling
        if (window.socket) {
            window.socket.on('connect', () => {
                console.log('WebSocket connected, enabling movement');
                isMovementEnabled = true;
            });

            window.socket.on('disconnect', () => {
                console.log('WebSocket disconnected, disabling movement');
                isMovementEnabled = false;
            });
        }
    } catch (error) {
        console.error('Error initializing canvas:', error);
    }
}

function initializeCollectibles() {
    // Create different types of collectibles
    const collectibleTypes = [
        { type: 'dragon_egg', points: 15, rarity: 0.3 },
        { type: 'dragon_scale', points: 10, rarity: 0.5 },
        { type: 'dragon_chest', points: 20, rarity: 0.2 }
    ];

    for (let i = 0; i < 8; i++) {
        const type = selectCollectibleType(collectibleTypes);
        collectibles.push({
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
        });
    }
}

function selectCollectibleType(types) {
    const roll = random();
    let cumulativeProbability = 0;
    
    for (const type of types) {
        cumulativeProbability += type.rarity;
        if (roll < cumulativeProbability) {
            return type;
        }
    }
    return types[0]; // Default to first type if something goes wrong
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
    if (!isMovementEnabled) return;

    let bgColor = window.getDayNightColor ? getDayNightColor() : color(30, 20, 40);
    background(bgColor);
    
    // Draw map elements
    drawDragonGrid();
    drawDragonSilhouettes();
    updateFireParticles();
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

[Rest of the map.js file with drawing functions and event handlers...]
