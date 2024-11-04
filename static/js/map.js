let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];
let castleImage;
let fireParticles = [];
let windParticles = [];
let runeParticles = [];
let dragonSilhouettes = [];
let auroraPhase = 0;

const CASTLE_WIDTH = 300;
const CASTLE_HEIGHT = 400;
const CASTLE_X = mapSize.width / 2 - CASTLE_WIDTH / 2;
const CASTLE_Y = mapSize.height - CASTLE_HEIGHT;

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

const COLLECTIBLE_TYPES = {
    dragon_egg: {
        red: {
            baseColor: [255, 50, 0],
            effectColor: [255, 150, 0],
            particleType: 'fire'
        },
        blue: {
            baseColor: [0, 150, 255],
            effectColor: [150, 200, 255],
            particleType: 'ice'
        },
        green: {
            baseColor: [50, 200, 50],
            effectColor: [150, 255, 150],
            particleType: 'nature'
        }
    },
    dragon_scale: {
        gold: {
            baseColor: [255, 215, 0],
            effectColor: [255, 255, 150],
            particleType: 'sparkle'
        },
        crystal: {
            baseColor: [200, 200, 255],
            effectColor: [255, 255, 255],
            particleType: 'prismatic'
        },
        ancient: {
            baseColor: [150, 100, 50],
            effectColor: [200, 150, 100],
            particleType: 'rune'
        }
    },
    magic_crystal: {
        fire: {
            baseColor: [255, 50, 0],
            effectColor: [255, 200, 0],
            particleType: 'flame'
        },
        ice: {
            baseColor: [100, 200, 255],
            effectColor: [200, 250, 255],
            particleType: 'frost'
        },
        earth: {
            baseColor: [100, 80, 50],
            effectColor: [150, 120, 80],
            particleType: 'rock'
        }
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
    const types = Object.keys(COLLECTIBLE_TYPES);
    for (let i = 0; i < 9; i++) {
        const type = types[Math.floor(i / 3)];
        const variants = Object.keys(COLLECTIBLE_TYPES[type]);
        const variant = variants[i % variants.length];
        
        collectibles.push({
            x: random(50, mapSize.width - 50),
            y: random(50, mapSize.height - 50),
            type: type,
            variant: variant,
            collected: false,
            value: 10 + (i % 3) * 10,
            pulsePhase: random(TWO_PI),
            particles: []
        });
    }
}

function initializeAtmosphere() {
    for (let i = 0; i < 3; i++) {
        dragonSilhouettes.push({
            x: random(width),
            y: random(height/3),
            size: random(30, 50),
            speed: random(0.5, 1.5),
            amplitude: random(20, 40),
            phase: random(TWO_PI)
        });
    }
    
    for (let i = 0; i < 20; i++) {
        runeParticles.push({
            x: random(width),
            y: random(height),
            char: String.fromCharCode(0x16A0 + floor(random(80))),
            size: random(10, 20),
            opacity: random(50, 150),
            floatPhase: random(TWO_PI)
        });
    }
}

function initializeParticles() {
    for(let i = 0; i < 50; i++) {
        fireParticles.push(createFireParticle());
    }
    
    for(let i = 0; i < 30; i++) {
        windParticles.push(createWindParticle());
    }
}

function createFireParticle() {
    return {
        x: random(CASTLE_X + 50, CASTLE_X + CASTLE_WIDTH - 50),
        y: CASTLE_Y + CASTLE_HEIGHT,
        vx: random(-1, 1),
        vy: random(-5, -2),
        life: random(100, 255),
        size: random(5, 15)
    };
}

function createWindParticle() {
    return {
        x: random(width),
        y: random(height),
        vx: random(1, 3),
        vy: random(-0.5, 0.5),
        size: random(2, 6),
        opacity: random(50, 150)
    };
}

function drawCastleSilhouette(graphics) {
    graphics.clear();
    
    graphics.fill(30, 30, 40);
    graphics.noStroke();
    
    const towers = [
        {x: 25, y: 50, w: 50, h: 350},
        {x: 225, y: 50, w: 50, h: 350},
        {x: 100, y: 75, w: 30, h: 200},
        {x: 170, y: 75, w: 30, h: 200}
    ];
    
    graphics.rect(75, 100, 150, 300);
    
    towers.forEach(tower => {
        graphics.rect(tower.x, tower.y, tower.w, tower.h);
        graphics.triangle(
            tower.x, tower.y,
            tower.x + tower.w/2, tower.y - 30,
            tower.x + tower.w, tower.y
        );
    });
    
    graphics.drawingContext.shadowBlur = 15;
    graphics.drawingContext.shadowColor = 'rgba(255, 150, 0, 0.5)';
    graphics.fill(255, 150, 0, 100);
    
    for (let i = 0; i < 5; i++) {
        const windowHeight = 30 + sin(frameCount * 0.05 + i) * 5;
        graphics.rect(60 + i * 40, 150, 20, windowHeight);
        graphics.rect(60 + i * 40, 250, 20, windowHeight);
    }
    
    graphics.stroke(50, 50, 60);
    graphics.strokeWeight(2);
    graphics.line(25, 150, 275, 150);
    graphics.line(25, 300, 275, 300);
}

function drawAuroraEffect() {
    push();
    drawingContext.globalAlpha = 0.2;
    
    for (let i = 0; i < 3; i++) {
        const gradient = drawingContext.createLinearGradient(0, 0, width, 0);
        const hueShift = sin(auroraPhase + i * TWO_PI/3) * 60;
        
        gradient.addColorStop(0, `hsla(${120 + hueShift}, 70%, 50%, 0.2)`);
        gradient.addColorStop(0.5, `hsla(${180 + hueShift}, 70%, 50%, 0.3)`);
        gradient.addColorStop(1, `hsla(${240 + hueShift}, 70%, 50%, 0.2)`);
        
        drawingContext.fillStyle = gradient;
        
        beginShape();
        for (let x = 0; x <= width; x += 20) {
            const y = height/4 + sin(x * 0.01 + auroraPhase + i) * 50;
            vertex(x, y);
        }
        vertex(width, height/2);
        vertex(0, height/2);
        endShape(CLOSE);
    }
    
    auroraPhase += 0.005;
    pop();
}

function updateParticles() {
    for(let i = fireParticles.length - 1; i >= 0; i--) {
        let p = fireParticles[i];
        p.x += p.vx + sin(frameCount * 0.1) * 0.5;
        p.y += p.vy;
        p.life -= 2;
        p.size *= 0.99;
        
        if(p.life <= 0) {
            fireParticles[i] = createFireParticle();
        }
    }
    
    for(let i = windParticles.length - 1; i >= 0; i--) {
        let p = windParticles[i];
        p.x += p.vx;
        p.y += p.vy + sin(frameCount * 0.05 + p.x * 0.1) * 0.5;
        
        if(p.x > width) {
            p.x = -10;
            p.y = random(height);
        }
    }
}

function drawParticles() {
    fireParticles.forEach(p => {
        noStroke();
        const gradient = drawingContext.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(255, 200, 0, ${p.life/255})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${p.life/510})`);
        gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
        drawingContext.fillStyle = gradient;
        circle(p.x, p.y, p.size * 2);
    });
    
    windParticles.forEach(p => {
        noStroke();
        if(random() < 0.5) {
            fill(255, 150, 0, p.opacity);
        } else {
            fill(200, 200, 200, p.opacity * 0.5);
        }
        circle(p.x, p.y, p.size);
    });
}

function updateDragonSilhouettes() {
    dragonSilhouettes.forEach(dragon => {
        dragon.x -= dragon.speed;
        if (dragon.x < -50) dragon.x = width + 50;
        
        dragon.y += sin(frameCount * 0.02 + dragon.phase) * 0.5;
        
        push();
        noStroke();
        fill(0, 0, 0, 50);
        
        beginShape();
        vertex(dragon.x, dragon.y);
        vertex(dragon.x + dragon.size, dragon.y - dragon.size/4);
        vertex(dragon.x + dragon.size * 1.5, dragon.y);
        vertex(dragon.x + dragon.size, dragon.y + dragon.size/4);
        endShape(CLOSE);
        
        const wingY = dragon.y + sin(frameCount * 0.1) * 5;
        triangle(
            dragon.x + dragon.size * 0.3, dragon.y,
            dragon.x + dragon.size * 0.8, wingY - dragon.size/2,
            dragon.x + dragon.size * 0.8, dragon.y
        );
        pop();
    });
}

function drawCollectible(c) {
    const typeConfig = COLLECTIBLE_TYPES[c.type][c.variant];
    push();
    translate(c.x, c.y);
    
    const glowSize = 20 + sin(frameCount * 0.05 + c.pulsePhase) * 5;
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = `rgb(${typeConfig.effectColor.join(',')})`;
    
    switch(c.type) {
        case 'dragon_egg':
            noStroke();
            for (let i = 3; i > 0; i--) {
                fill(...typeConfig.effectColor, 50/i);
                ellipse(0, 0, glowSize * i, glowSize * 1.3 * i);
            }
            fill(...typeConfig.baseColor);
            ellipse(0, 0, glowSize, glowSize * 1.3);
            
            if (c.variant === 'red') {
                for (let i = 0; i < 5; i++) {
                    const angle = frameCount * 0.1 + i * TWO_PI/5;
                    const x = sin(angle) * glowSize/2;
                    const y = -cos(angle) * glowSize/2;
                    fill(255, 100, 0, 100);
                    circle(x, y, 5);
                }
            } else if (c.variant === 'blue') {
                for (let i = 0; i < 6; i++) {
                    const angle = i * TWO_PI/6;
                    const len = glowSize/2;
                    stroke(200, 250, 255, 150);
                    line(0, 0, cos(angle) * len, sin(angle) * len);
                }
            } else if (c.variant === 'green') {
                for (let i = 0; i < 4; i++) {
                    const angle = frameCount * 0.05 + i * TWO_PI/4;
                    push();
                    rotate(angle);
                    fill(100, 200, 100, 100);
                    ellipse(glowSize/2, 0, 10, 5);
                    pop();
                }
            }
            break;
            
        case 'dragon_scale':
            if (c.variant === 'gold') {
                for (let i = 0; i < 8; i++) {
                    const angle = frameCount * 0.1 + i * TWO_PI/8;
                    const sparkleSize = 2 + sin(angle) * 2;
                    fill(255, 255, 200);
                    circle(cos(angle) * glowSize/2, sin(angle) * glowSize/2, sparkleSize);
                }
            } else if (c.variant === 'crystal') {
                for (let i = 0; i < 6; i++) {
                    const angle = i * TWO_PI/6;
                    fill(random(150, 255), random(150, 255), random(150, 255), 150);
                    arc(0, 0, glowSize, glowSize, angle, angle + TWO_PI/6);
                }
            } else if (c.variant === 'ancient') {
                textSize(glowSize/2);
                textAlign(CENTER, CENTER);
                fill(200, 150, 100);
                text('ᚠᚢᚦ'[floor(frameCount/20) % 3], 0, 0);
            }
            break;
            
        case 'magic_crystal':
            if (c.variant === 'fire') {
                for (let i = 0; i < 8; i++) {
                    const angle = frameCount * 0.1 + i * TWO_PI/8;
                    const flameHeight = glowSize/2 + sin(angle * 2) * 5;
                    fill(255, 100, 0, 100);
                    triangle(0, 0, 
                            cos(angle) * flameHeight/2, sin(angle) * flameHeight/2,
                            cos(angle + 0.2) * flameHeight/2, sin(angle + 0.2) * flameHeight/2);
                }
            } else if (c.variant === 'ice') {
                noFill();
                stroke(200, 250, 255, 100);
                for (let i = 0; i < 3; i++) {
                    beginShape();
                    for (let angle = 0; angle < TWO_PI; angle += 0.5) {
                        const r = glowSize/2 + noise(angle, frameCount * 0.02 + i) * 10;
                        vertex(cos(angle) * r, sin(angle) * r);
                    }
                    endShape(CLOSE);
                }
            } else if (c.variant === 'earth') {
                for (let i = 0; i < 5; i++) {
                    const angle = frameCount * 0.05 + i * TWO_PI/5;
                    const r = glowSize/2;
                    fill(100, 80, 50);
                    push();
                    translate(cos(angle) * r, sin(angle) * r);
                    rotate(angle);
                    rect(-3, -3, 6, 6);
                    pop();
                }
            }
            break;
    }
    
    textAlign(CENTER, CENTER);
    textSize(10);
    fill(255);
    text(`${c.variant} ${c.type}`, 0, glowSize + 15);
    
    pop();
}

function drawCharacter(x, y, dragonSprite, playerName) {
    if (dragonSprite) {
        push();
        imageMode(CENTER);
        
        noStroke();
        fill(0, 0, 0, 30);
        ellipse(x, y + 24, 40, 20);
        
        image(dragonSprite, x, y, 48, 48);
        
        if (playerName) {
            textAlign(CENTER);
            textSize(14);
            fill(255);
            text(playerName, x, y - 35);
        }
        
        pop();
    }
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
            textSize(14);
            fill(255);
            text(npc.type, npc.x, npc.y - 35);
            
            pop();
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
                rectMode(CENTER);
                const messageWidth = textWidth(npc.message) + 20;
                rect(npc.x, npc.y - 70, messageWidth, 30, 10);
                
                fill(255, npc.messageOpacity);
                textAlign(CENTER, CENTER);
                text(npc.message, npc.x, npc.y - 70);
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
            createCollectibleParticles(c.x, c.y);
            updateScore();
        }
    });
}

function createCollectibleParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: random(-3, 3),
            vy: random(-3, 3),
            life: 255
        });
    }
}

function updateScore() {
    document.getElementById('currentScore').textContent = score;
}

function draw() {
    try {
        let bgColor = getDayNightColor();
        background(color(
            red(bgColor) * 0.8,
            green(bgColor) * 0.7,
            blue(bgColor) * 0.9
        ));
        
        drawAuroraEffect();
        
        drawingContext.save();
        const atmosphere = drawingContext.createRadialGradient(
            width/2, height/2, 0,
            width/2, height/2, height
        );
        atmosphere.addColorStop(0, 'rgba(255, 100, 0, 0.1)');
        atmosphere.addColorStop(1, 'rgba(0, 0, 50, 0.2)');
        drawingContext.fillStyle = atmosphere;
        rect(0, 0, width, height);
        drawingContext.restore();
        
        updateDragonSilhouettes();
        
        image(castleImage, CASTLE_X, CASTLE_Y);
        updateParticles();
        drawParticles();
        
        runeParticles.forEach(rune => {
            push();
            textSize(rune.size);
            textAlign(CENTER, CENTER);
            fill(255, 255, 255, rune.opacity + sin(frameCount * 0.05) * 20);
            text(rune.char, 
                 rune.x + sin(frameCount * 0.02 + rune.floatPhase) * 5,
                 rune.y + cos(frameCount * 0.02 + rune.floatPhase) * 5);
            pop();
        });
        
        updateWeather();
        applyWeatherEffects();
        drawNPCs();
        
        collectibles.forEach(c => {
            if (!c.collected) {
                drawCollectible(c);
            }
        });
        
        users.forEach((user, id) => {
            drawCharacter(user.x, user.y, user.dragonSprite, user.username);
        });
        drawCharacter(myPosition.x, myPosition.y, characterSprite, 'You');
        
        checkNPCInteractions();
        checkCollectibles();
        updateScore();
        
    } catch (error) {
        console.error('Error in draw loop:', error);
    }
}

function setup() {
    try {
        const canvas = createCanvas(mapSize.width, mapSize.height);
        canvas.parent('mapContainer');
        frameRate(60);
        
        castleImage = createGraphics(CASTLE_WIDTH, CASTLE_HEIGHT);
        drawCastleSilhouette(castleImage);
        
        initializeNPCs();
        initializeCollectibles();
        initializeParticles();
        initializeAtmosphere();
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error during game initialization:', error);
    }
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