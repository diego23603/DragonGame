let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];
let nickname = localStorage.getItem('nickname') || 'Anonymous';
let mapScale = 1;
let fallbackSprite;

// Create fallback sprite
function createFallbackSprite() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 48;
    tempCanvas.height = 48;
    const ctx = tempCanvas.getContext('2d');
    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.arc(24, 24, 20, 0, 2 * Math.PI);
    ctx.fill();
    return loadImage(tempCanvas.toDataURL());
}

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

function calculateScale() {
    try {
        const container = document.getElementById('mapContainer');
        if (!container) {
            console.error('Map container not found!');
            return 1;
        }
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const scaleX = containerWidth / mapSize.width;
        const scaleY = containerHeight / mapSize.height;
        
        mapScale = Math.min(scaleX, scaleY, 1);
        console.log('Scale calculated:', mapScale);
        return mapScale;
    } catch (error) {
        console.error('Error calculating scale:', error);
        return 1;
    }
}

function drawGrid() {
    try {
        push();
        strokeWeight(1);
        
        // Main grid lines
        stroke(255, 255, 255, 20);
        for (let x = 0; x < mapSize.width; x += 50) {
            line(x, 0, x, mapSize.height);
        }
        for (let y = 0; y < mapSize.height; y += 50) {
            line(0, y, mapSize.width, y);
        }
        
        // Retro sci-fi accents
        stroke(255, 77, 0, 15);
        for (let i = 0; i < mapSize.width; i += 100) {
            line(i, 0, i, mapSize.height);
            line(0, i, mapSize.width, i);
        }
        
        // Glowing intersection points
        noStroke();
        fill(255, 77, 0, 20);
        for (let x = 0; x < mapSize.width; x += 100) {
            for (let y = 0; y < mapSize.height; y += 100) {
                circle(x, y, 5);
            }
        }
        
        pop();
    } catch (error) {
        console.error('Error drawing grid:', error);
    }
}

function initializeNPCs() {
    console.log('Initializing NPCs...');
    const npcPositions = [
        { x: 100, y: 100, type: 'MERCHANT' },
        { x: 700, y: 500, type: 'GUARD' },
        { x: 400, y: 200, type: 'WIZARD' }
    ];
    
    npcPositions.forEach(pos => {
        const npcType = NPC_TYPES[pos.type];
        loadImage(npcType.sprite, 
            img => {
                console.log(`NPC sprite loaded successfully: ${pos.type}`);
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
            },
            error => {
                console.error(`Error loading NPC sprite: ${pos.type}`, error);
                const fallback = createFallbackSprite();
                npcs.push({
                    x: pos.x,
                    y: pos.y,
                    sprite: fallback,
                    type: pos.type,
                    message: npcType.message,
                    interactionRadius: 60,
                    lastInteraction: 0,
                    messageOpacity: 0
                });
            }
        );
    });
}

function setup() {
    console.log('Setting up canvas...');
    const container = document.getElementById('mapContainer');
    if (!container) {
        console.error('Failed to find map container element!');
        return;
    }
    
    try {
        const canvas = createCanvas(mapSize.width, mapSize.height);
        canvas.parent('mapContainer');
        frameRate(60);
        
        // Create fallback sprite
        fallbackSprite = createFallbackSprite();
        
        calculateScale();
        
        // Initialize game elements
        initializeNPCs();
        initializeCollectibles();
        initBackgroundEffects();
        
        loadSavedPosition();
        setupNicknameHandling();
        
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log('Handling resize...');
                calculateScale();
                // Ensure all elements are within bounds after resize
                constrainPosition(myPosition);
            }, 250);
        });
        
        console.log('Canvas setup completed successfully');
    } catch (error) {
        console.error('Error during canvas setup:', error);
    }
}

function constrainPosition(pos) {
    pos.x = constrain(pos.x, 24, mapSize.width - 24);
    pos.y = constrain(pos.y, 24, mapSize.height - 24);
}

function draw() {
    try {
        mapScale = calculateScale();
        push();
        scale(mapScale);
        
        let bgColor = getDayNightColor();
        background(color(
            red(bgColor) * 1.2,
            green(bgColor) * 0.8,
            blue(bgColor) * 0.7
        ));
        
        drawGrid();
        drawBackgroundEffects();
        updateWeather();
        applyWeatherEffects();
        
        drawEntities();
        
        pop();
    } catch (error) {
        console.error('Error in draw loop:', error);
    }
}

function drawEntities() {
    try {
        drawNPCs();
        drawCollectibles();
        
        users.forEach((user, id) => {
            drawCharacter(user.x, user.y, user.dragonSprite || fallbackSprite, user.nickname || 'Anonymous');
        });
        
        drawCharacter(myPosition.x, myPosition.y, characterSprite || fallbackSprite, nickname);
        
        checkNPCInteractions();
        checkCollectibles();
        updateScore();
        
        if (frameCount % 60 === 0) {
            localStorage.setItem('playerPosition', JSON.stringify(myPosition));
            socket.emit('position_update', {
                x: myPosition.x,
                y: myPosition.y,
                nickname: nickname
            });
        }
    } catch (error) {
        console.error('Error drawing entities:', error);
    }
}

function drawCharacter(x, y, sprite, playerName) {
    try {
        push();
        imageMode(CENTER);
        
        // Draw shadow
        noStroke();
        fill(0, 0, 0, 30);
        ellipse(x, y + 24, 40, 20);
        
        // Draw character
        if (sprite) {
            image(sprite, x, y, 48, 48);
        } else {
            image(fallbackSprite, x, y, 48, 48);
        }
        
        // Draw name
        if (playerName) {
            textAlign(CENTER);
            textSize(14);
            fill(0, 0, 0, 150);
            noStroke();
            const nameWidth = textWidth(playerName);
            rect(x - nameWidth/2 - 5, y - 45, nameWidth + 10, 20, 5);
            fill(255);
            text(playerName, x, y - 30);
        }
        
        pop();
    } catch (error) {
        console.error('Error drawing character:', error);
    }
}

function mouseToGameCoords(mx, my) {
    return {
        x: mx / mapScale,
        y: my / mapScale
    };
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    if (typeof socket !== 'undefined') {
        socket.on('connect', () => {
            console.log('Connected to server');
        });
    }
});
