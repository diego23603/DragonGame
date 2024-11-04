let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];

const ZONES = {
    FOREST: {
        color: '#2d5a27',
        overlay: '#1a4a1f',
        gridColor: 'rgba(45, 90, 39, 0.3)',
        name: 'Mystic Forest'
    },
    MOUNTAINS: {
        color: '#4a4a4a',
        overlay: '#363636',
        gridColor: 'rgba(74, 74, 74, 0.3)',
        name: 'Dragon Mountains'
    },
    DESERT: {
        color: '#c2b280',
        overlay: '#a89b6a',
        gridColor: 'rgba(194, 178, 128, 0.3)',
        name: 'Scorched Sands'
    },
    LAKE: {
        color: '#1e90ff',
        overlay: '#0066cc',
        gridColor: 'rgba(30, 144, 255, 0.3)',
        name: 'Crystal Lake'
    }
};

let zoneMap = [];
const ZONE_SIZE = 100;

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
    
    initializeZones();
    initializeNPCs();
    initializeCollectibles();
}

function initializeZones() {
    for (let y = 0; y < mapSize.height; y += ZONE_SIZE) {
        let row = [];
        for (let x = 0; x < mapSize.width; x += ZONE_SIZE) {
            if (x < mapSize.width / 2 && y < mapSize.height / 2) {
                row.push(ZONES.FOREST);
            } else if (x >= mapSize.width / 2 && y < mapSize.height / 2) {
                row.push(ZONES.MOUNTAINS);
            } else if (x < mapSize.width / 2 && y >= mapSize.height / 2) {
                row.push(ZONES.DESERT);
            } else {
                row.push(ZONES.LAKE);
            }
        }
        zoneMap.push(row);
    }
}

function getCurrentZone(x, y) {
    const zoneX = floor(x / ZONE_SIZE);
    const zoneY = floor(y / ZONE_SIZE);
    if (zoneY < zoneMap.length && zoneX < zoneMap[0].length) {
        return zoneMap[zoneY][zoneX];
    }
    return ZONES.FOREST;
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
            value: 50,
            color: '#FFD700',
            size: 25,
            pulseSpeed: 0.08,
            particleColor: '#FFE4B5'
        },
        {
            type: 'dragon_scale',
            value: 30,
            color: '#4169E1',
            size: 20,
            pulseSpeed: 0.05,
            particleColor: '#87CEEB'
        },
        {
            type: 'magic_crystal',
            value: 40,
            color: '#FF1493',
            size: 22,
            pulseSpeed: 0.06,
            particleColor: '#FF69B4'
        }
    ];

    for (let i = 0; i < 8; i++) {
        const type = random(collectibleTypes);
        collectibles.push({
            x: random(50, mapSize.width - 50),
            y: random(50, mapSize.height - 50),
            type: type.type,
            collected: false,
            value: type.value,
            color: type.color,
            size: type.size,
            pulseSpeed: type.pulseSpeed,
            particleColor: type.particleColor,
            pulsePhase: random(TWO_PI),
            rotationAngle: 0
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
    
    drawZones();
    updateWeather();
    applyWeatherEffects();
    
    drawGrid();
    drawNPCs();
    drawCollectibles();
    drawZoneLabels();
    
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y, user.dragonSprite, user.username);
    });
    
    drawCharacter(myPosition.x, myPosition.y, characterSprite, 'You');
    
    checkNPCInteractions();
    checkCollectibles();
    
    updateScore();
    
    const currentZone = getCurrentZone(myPosition.x, myPosition.y);
    displayZoneInfo(currentZone);
}

function drawZones() {
    for (let y = 0; y < zoneMap.length; y++) {
        for (let x = 0; x < zoneMap[y].length; x++) {
            const zone = zoneMap[y][x];
            fill(zone.color);
            noStroke();
            rect(x * ZONE_SIZE, y * ZONE_SIZE, ZONE_SIZE, ZONE_SIZE);
            
            drawZoneDecorations(x * ZONE_SIZE, y * ZONE_SIZE, zone);
        }
    }
}

function drawZoneDecorations(x, y, zone) {
    push();
    noStroke();
    
    switch(zone) {
        case ZONES.FOREST:
            for (let i = 0; i < 3; i++) {
                const treeX = x + random(20, ZONE_SIZE - 20);
                const treeY = y + random(20, ZONE_SIZE - 20);
                fill(zone.overlay);
                triangle(
                    treeX, treeY - 20,
                    treeX - 15, treeY + 10,
                    treeX + 15, treeY + 10
                );
            }
            break;
            
        case ZONES.MOUNTAINS:
            for (let i = 0; i < 2; i++) {
                const peakX = x + random(30, ZONE_SIZE - 30);
                const peakY = y + random(30, ZONE_SIZE - 30);
                fill(zone.overlay);
                triangle(
                    peakX, peakY - 25,
                    peakX - 20, peakY + 15,
                    peakX + 20, peakY + 15
                );
            }
            break;
            
        case ZONES.DESERT:
            for (let i = 0; i < 3; i++) {
                const duneX = x + random(20, ZONE_SIZE - 20);
                const duneY = y + random(20, ZONE_SIZE - 20);
                fill(zone.overlay);
                arc(duneX, duneY, 40, 40, PI, TWO_PI);
            }
            break;
            
        case ZONES.LAKE:
            for (let i = 0; i < 3; i++) {
                const rippleX = x + random(20, ZONE_SIZE - 20);
                const rippleY = y + random(20, ZONE_SIZE - 20);
                fill(zone.overlay);
                noFill();
                stroke(zone.overlay);
                strokeWeight(2);
                circle(rippleX, rippleY, 20 + sin(frameCount * 0.05) * 5);
            }
            break;
    }
    
    pop();
}

function drawGrid() {
    for (let y = 0; y < zoneMap.length; y++) {
        for (let x = 0; x < zoneMap[y].length; x++) {
            const zone = zoneMap[y][x];
            stroke(zone.gridColor);
            strokeWeight(1);
            
            for (let i = 0; i <= ZONE_SIZE; i += 25) {
                line(x * ZONE_SIZE + i, y * ZONE_SIZE, x * ZONE_SIZE + i, (y + 1) * ZONE_SIZE);
            }
            
            for (let i = 0; i <= ZONE_SIZE; i += 25) {
                line(x * ZONE_SIZE, y * ZONE_SIZE + i, (x + 1) * ZONE_SIZE, y * ZONE_SIZE + i);
            }
        }
    }
}

function drawZoneLabels() {
    textAlign(CENTER, CENTER);
    textSize(14);
    fill(255);
    stroke(0);
    strokeWeight(2);
    
    for (let y = 0; y < zoneMap.length; y++) {
        for (let x = 0; x < zoneMap[y].length; x++) {
            const zone = zoneMap[y][x];
            const centerX = x * ZONE_SIZE + ZONE_SIZE / 2;
            const centerY = y * ZONE_SIZE + ZONE_SIZE / 2;
            text(zone.name, centerX, centerY);
        }
    }
}

function displayZoneInfo(zone) {
    push();
    fill(0, 0, 0, 180);
    noStroke();
    rect(10, height - 40, 200, 30, 5);
    
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(14);
    text(zone.name, 20, height - 25);
    pop();
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
    const padding = 8;
    const fontSize = 16;
    textSize(fontSize);
    const textWidth = name.length * fontSize * 0.6;
    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = fontSize + padding * 2;
    const bubbleY = y - 50;

    fill(0, 0, 0, 50);
    noStroke();
    rect(x - bubbleWidth/2 + 2, bubbleY + 2, bubbleWidth, bubbleHeight, 10);

    fill(0, 0, 0, 180);
    rect(x - bubbleWidth/2, bubbleY, bubbleWidth, bubbleHeight, 10);

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
            
            noFill();
            stroke(255, 255, 255, 50 + sin(frameCount * 0.05) * 20);
            circle(npc.x, npc.y, npc.interactionRadius * 2);
            
            image(npc.sprite, npc.x, npc.y, 48, 48);
            
            const labelY = npc.y - 35;
            textSize(14);
            const labelWidth = textWidth(npc.type);
            
            fill(0, 0, 0, 180);
            noStroke();
            rect(npc.x - labelWidth/2 - 5, labelY - 10, labelWidth + 10, 20, 5);
            
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
            
            c.rotationAngle += 0.02;
            rotate(c.rotationAngle);
            
            let pulseSize = c.size + sin(frameCount * c.pulseSpeed + c.pulsePhase) * 5;
            
            for (let i = 0; i < 3; i++) {
                noFill();
                stroke(c.color);
                strokeWeight(2 - i * 0.5);
                let auraSize = pulseSize + i * 15;
                
                if (c.type === 'dragon_egg') {
                    ellipse(0, 0, auraSize * 0.8, auraSize);
                } else if (c.type === 'dragon_scale') {
                    beginShape();
                    for (let a = 0; a < TWO_PI; a += PI / 3) {
                        let x = cos(a) * (auraSize / 2);
                        let y = sin(a) * (auraSize / 2);
                        vertex(x, y);
                    }
                    endShape(CLOSE);
                } else {
                    beginShape();
                    for (let a = 0; a < TWO_PI; a += PI / 4) {
                        let r = (a % (PI / 2) < 0.1) ? auraSize * 0.6 : auraSize * 0.4;
                        let x = cos(a) * r;
                        let y = sin(a) * r;
                        vertex(x, y);
                    }
                    endShape(CLOSE);
                }
            }
            
            fill(c.color);
            noStroke();
            
            if (c.type === 'dragon_egg') {
                ellipse(0, 0, pulseSize * 0.8, pulseSize);
                fill(brighten(c.color));
                ellipse(-pulseSize/6, -pulseSize/6, pulseSize/4);
            } else if (c.type === 'dragon_scale') {
                drawScale(pulseSize);
            } else {
                drawCrystal(pulseSize);
            }
            
            resetMatrix();
            textAlign(CENTER);
            textSize(12);
            const labelY = c.y + c.size + 20;
            fill(0, 0, 0, 180);
            noStroke();
            rect(c.x - 50, labelY - 10, 100, 20, 5);
            fill(255);
            text(formatCollectibleName(c.type), c.x, labelY + 5);
            
            pop();
        }
    });
}

function drawScale(size) {
    beginShape();
    for (let a = 0; a < TWO_PI; a += PI / 3) {
        let x = cos(a) * (size / 2);
        let y = sin(a) * (size / 2);
        vertex(x, y);
    }
    endShape(CLOSE);
}

function drawCrystal(size) {
    beginShape();
    for (let a = 0; a < TWO_PI; a += PI / 4) {
        let r = (a % (PI / 2) < 0.1) ? size * 0.6 : size * 0.4;
        let x = cos(a) * r;
        let y = sin(a) * r;
        vertex(x, y);
    }
    endShape(CLOSE);
}

function brighten(color) {
    let c = color(color);
    return color(
        min(255, red(c) * 1.2),
        min(255, green(c) * 1.2),
        min(255, blue(c) * 1.2)
    );
}

function formatCollectibleName(type) {
    return type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function checkNPCInteractions() {
    npcs.forEach(npc => {
        const d = dist(myPosition.x, myPosition.y, npc.x, npc.y);
        if (d < npc.interactionRadius) {
            npc.messageOpacity = min(npc.messageOpacity + 15, 255);
            
            if (npc.messageOpacity > 0) {
                push();
                const fontSize = 16;
                textSize(fontSize);
                const messageWidth = textWidth(npc.message);
                const padding = 10;
                const bubbleWidth = messageWidth + padding * 2;
                const bubbleHeight = fontSize + padding * 2;
                const bubbleY = npc.y - 70;

                fill(0, 0, 0, npc.messageOpacity * 0.7);
                noStroke();
                rect(npc.x - bubbleWidth/2, bubbleY, bubbleWidth, bubbleHeight, 10);

                fill(255, npc.messageOpacity);
                textAlign(CENTER, CENTER);
                text(npc.message, npc.x, bubbleY + bubbleHeight/2);
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
            
            for (let i = 0; i < 20; i++) {
                particles.push({
                    x: c.x,
                    y: c.y,
                    vx: random(-3, 3),
                    vy: random(-3, 3),
                    size: random(3, 6),
                    color: c.particleColor,
                    life: 255,
                    angle: random(TWO_PI)
                });
            }
            
            document.getElementById('currentScore').textContent = score;
            
            if (socket) {
                socket.emit('collectible_collected', { x: c.x, y: c.y });
            }
        }
    });
    
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 3;
        
        push();
        translate(p.x, p.y);
        rotate(p.angle);
        noStroke();
        fill(p.color, p.life);
        rect(-p.size/2, -p.size/2, p.size, p.size);
        pop();
        
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