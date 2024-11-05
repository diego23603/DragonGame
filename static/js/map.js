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
    return mapScale;
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
                messageOpacity: 0
            });
        });
    });
}

function initializeCollectibles() {
    const collectibleTypes = [
        {
            type: 'dragon_egg',
            value: 30,
            color: color(255, 215, 0),
            sound: '/static/sounds/egg_collect.mp3'
        },
        {
            type: 'dragon_scale',
            value: 20,
            color: color(74, 144, 226),
            sound: '/static/sounds/scale_collect.mp3'
        },
        {
            type: 'magic_crystal',
            value: 40,
            color: color(156, 39, 176),
            sound: '/static/sounds/crystal_collect.mp3'
        }
    ];

    for (let i = 0; i < 5; i++) {
        const type = random(collectibleTypes);
        collectibles.push({
            x: random(50, mapSize.width - 50),
            y: random(50, mapSize.height - 50),
            type: type.type,
            collected: false,
            value: type.value,
            color: type.color,
            sound: type.sound,
            pulsePhase: random(TWO_PI)
        });
    }
}

function setup() {
    const container = document.getElementById('mapContainer');
    if (!container) {
        console.error('Failed to find map container element!');
        return;
    }
    
    try {
        const canvas = createCanvas(mapSize.width, mapSize.height);
        canvas.parent('mapContainer');
        frameRate(60);
        
        calculateScale();
        
        initializeNPCs();
        initializeCollectibles();
        initBackgroundEffects();
        
        loadSavedPosition();
        setupNicknameHandling();
        
        window.addEventListener('resize', () => {
            calculateScale();
        });
        
        console.log('Canvas setup completed successfully');
    } catch (error) {
        console.error('Error during canvas setup:', error);
    }
}

function loadSavedPosition() {
    const savedPosition = localStorage.getItem('playerPosition');
    if (savedPosition) {
        try {
            const pos = JSON.parse(savedPosition);
            myPosition = pos;
        } catch (e) {
            console.error('Error loading saved position:', e);
        }
    }
}

function setupNicknameHandling() {
    const nicknameInput = document.getElementById('nicknameInput');
    const saveButton = document.getElementById('saveNickname');
    
    nicknameInput.value = nickname;
    
    saveButton.addEventListener('click', () => {
        const newNickname = nicknameInput.value.trim();
        if (newNickname) {
            nickname = newNickname;
            localStorage.setItem('nickname', nickname);
            socket.emit('nickname_update', { nickname });
        }
    });
}

function draw() {
    mapScale = calculateScale();
    push();
    scale(mapScale); // Using p5.js scale() function
    
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
        drawCharacter(user.x, user.y, user.dragonSprite, user.nickname || 'Anonymous');
    });
    
    drawCharacter(myPosition.x, myPosition.y, characterSprite, nickname);
    
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
    
    pop();
}

// ... rest of the code remains the same ...

function mouseToGameCoords(mx, my) {
    return {
        x: mx / mapScale,
        y: my / mapScale
    };
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof socket !== 'undefined') {
        socket.on('connect', () => {
            console.log('Connected to server');
        });
    }
});
