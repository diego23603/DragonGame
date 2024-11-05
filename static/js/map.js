let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];
let nickname = localStorage.getItem('nickname') || 'Anonymous';
let scale = 1;

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
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const scaleX = containerWidth / mapSize.width;
    const scaleY = containerHeight / mapSize.height;
    
    scale = Math.min(scaleX, scaleY, 1);
    return scale;
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
    scale = calculateScale();
    push();
    scale(scale);
    
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
        
        noStroke();
        fill(0, 0, 0, 30);
        ellipse(x, y + 24, 40, 20);
        
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
    
    fill(0, 0, 0, 150);
    noStroke();
    const nameWidth = textWidth(name);
    rect(x - nameWidth/2 - 5, y - 45, nameWidth + 10, 20, 5);
    
    fill(255);
    text(name, x, y - 30);
    pop();
}

function drawNPCs() {
    npcs.forEach(npc => {
        if (npc.sprite) {
            push();
            imageMode(CENTER);
            
            noFill();
            stroke(255, 255, 255, 50 + sin(frameCount * 0.05) * 20);
            circle(npc.x, npc.y, npc.interactionRadius * 2);
            
            image(npc.sprite, npc.x, npc.y, 48, 48);
            
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
            
            switch (c.type) {
                case 'dragon_egg':
                    drawDragonEgg(c);
                    break;
                case 'dragon_scale':
                    drawDragonScale(c);
                    break;
                case 'magic_crystal':
                    drawMagicCrystal(c);
                    break;
            }
            
            pop();
        }
    });
}

function drawDragonEgg(c) {
    let pulseSize = 1 + sin(frameCount * 0.05 + c.pulsePhase) * 0.1;
    
    noFill();
    for (let i = 0; i < 3; i++) {
        stroke(255, 215, 0, 50 - i * 15);
        ellipse(0, 0, 30 * pulseSize + i * 5, 40 * pulseSize + i * 5);
    }
    
    fill(c.color);
    noStroke();
    ellipse(0, 0, 30 * pulseSize, 40 * pulseSize);
    
    stroke(255, 255, 255, 50);
    noFill();
    arc(0, -5, 20 * pulseSize, 25 * pulseSize, PI, TWO_PI);
}

function drawDragonScale(c) {
    let pulseSize = 1 + sin(frameCount * 0.05 + c.pulsePhase) * 0.1;
    
    noFill();
    for (let i = 0; i < 3; i++) {
        stroke(74, 144, 226, 50 - i * 15);
        beginShape();
        for (let angle = 0; angle < TWO_PI; angle += TWO_PI / 6) {
            let r = 15 * pulseSize + i * 3;
            vertex(cos(angle) * r, sin(angle) * r);
        }
        endShape(CLOSE);
    }
    
    fill(c.color);
    noStroke();
    beginShape();
    for (let angle = 0; angle < TWO_PI; angle += TWO_PI / 6) {
        let r = 15 * pulseSize;
        vertex(cos(angle) * r, sin(angle) * r);
    }
    endShape(CLOSE);
}

function drawMagicCrystal(c) {
    let pulseSize = 1 + sin(frameCount * 0.05 + c.pulsePhase) * 0.1;
    
    noFill();
    for (let i = 0; i < 3; i++) {
        stroke(156, 39, 176, 50 - i * 15);
        beginShape();
        vertex(0, -20 * pulseSize - i);
        vertex(10 * pulseSize + i, -10);
        vertex(15 * pulseSize + i, 10);
        vertex(0, 20 * pulseSize + i);
        vertex(-15 * pulseSize - i, 10);
        vertex(-10 * pulseSize - i, -10);
        endShape(CLOSE);
    }
    
    fill(c.color);
    noStroke();
    beginShape();
    vertex(0, -20 * pulseSize);
    vertex(10 * pulseSize, -10);
    vertex(15 * pulseSize, 10);
    vertex(0, 20 * pulseSize);
    vertex(-15 * pulseSize, 10);
    vertex(-10 * pulseSize, -10);
    endShape(CLOSE);
}

function checkCollectibles() {
    collectibles.forEach(c => {
        if (!c.collected && dist(myPosition.x, myPosition.y, c.x, c.y) < 30) {
            c.collected = true;
            score += c.value;
            
            const sound = new Audio(c.sound);
            sound.play();
            
            const particleCount = c.type === 'magic_crystal' ? 15 : 10;
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: c.x,
                    y: c.y,
                    vx: random(-3, 3),
                    vy: random(-3, 3),
                    life: 255,
                    color: c.color
                });
            }
            
            const collectAnim = document.createElement('div');
            collectAnim.className = `collect-animation ${c.type}`;
            collectAnim.style.left = `${c.x}px`;
            collectAnim.style.top = `${c.y}px`;
            document.getElementById('mapContainer').appendChild(collectAnim);
            
            setTimeout(() => {
                collectAnim.remove();
            }, 500);
            
            document.getElementById('currentScore').textContent = score;
        }
    });
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
                textAlign(CENTER);
                textSize(14);
                text(npc.message, npc.x, npc.y - 60);
                pop();
            }
        } else {
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

function keyPressed() {
    const step = 10;
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
    
    if (moved) {
        socket.emit('position_update', {
            x: myPosition.x,
            y: myPosition.y,
            nickname: nickname
        });
    }
}

function mouseToGameCoords(mx, my) {
    return {
        x: mx / scale,
        y: my / scale
    };
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof socket !== 'undefined') {
        socket.on('connect', () => {
            console.log('Connected to server');
        });
    }
});