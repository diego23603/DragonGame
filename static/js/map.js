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

// Initialize the map
function setup() {
    console.log('Setting up map...');
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
    
    // Load default sprite if none is selected
    if (!characterSprite) {
        console.log('Loading default character sprite');
        const defaultDragon = '/static/images/dragons/red_dragon.svg';
        loadImage(defaultDragon, img => {
            console.log('Default sprite loaded');
            characterSprite = img;
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
