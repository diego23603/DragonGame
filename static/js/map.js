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

// Castle dimensions
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

function setup() {
    const canvas = createCanvas(mapSize.width, mapSize.height);
    canvas.parent('mapContainer');
    frameRate(60);
    
    // Create castle silhouette
    castleImage = createGraphics(CASTLE_WIDTH, CASTLE_HEIGHT);
    drawCastleSilhouette(castleImage);
    
    initializeNPCs();
    initializeCollectibles();
    initializeParticles();
}

function drawCastleSilhouette(graphics) {
    graphics.fill(0);
    graphics.noStroke();
    
    // Main castle body
    graphics.rect(50, 100, 200, 300);
    
    // Towers
    graphics.rect(25, 50, 50, 350);
    graphics.rect(225, 50, 50, 350);
    
    // Tower tops
    graphics.triangle(25, 50, 50, 0, 75, 50);
    graphics.triangle(225, 50, 250, 0, 275, 50);
    
    // Windows
    graphics.fill(255, 150, 0, 100);
    for(let i = 0; i < 3; i++) {
        graphics.rect(100 + i * 50, 150, 30, 50);
        graphics.rect(100 + i * 50, 250, 30, 50);
    }
}

function initializeParticles() {
    // Initialize fire particles
    for(let i = 0; i < 50; i++) {
        fireParticles.push({
            x: random(CASTLE_X + 50, CASTLE_X + CASTLE_WIDTH - 50),
            y: CASTLE_Y + CASTLE_HEIGHT,
            vx: random(-1, 1),
            vy: random(-5, -2),
            life: random(100, 255),
            size: random(5, 15)
        });
    }
    
    // Initialize wind particles
    for(let i = 0; i < 30; i++) {
        windParticles.push({
            x: random(width),
            y: random(height),
            vx: random(1, 3),
            vy: random(-0.5, 0.5),
            size: random(2, 6),
            opacity: random(50, 150)
        });
    }
}

function updateParticles() {
    // Update fire particles
    for(let i = fireParticles.length - 1; i >= 0; i--) {
        let p = fireParticles[i];
        p.x += p.vx + sin(frameCount * 0.1) * 0.5;
        p.y += p.vy;
        p.life -= 2;
        p.size *= 0.99;
        
        if(p.life <= 0) {
            fireParticles[i] = {
                x: random(CASTLE_X + 50, CASTLE_X + CASTLE_WIDTH - 50),
                y: CASTLE_Y + CASTLE_HEIGHT,
                vx: random(-1, 1),
                vy: random(-5, -2),
                life: random(100, 255),
                size: random(5, 15)
            };
        }
    }
    
    // Update wind particles
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
    // Draw fire particles
    fireParticles.forEach(p => {
        noStroke();
        const gradient = drawingContext.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(255, 200, 0, ${p.life/255})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${p.life/510})`);
        gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
        drawingContext.fillStyle = gradient;
        circle(p.x, p.y, p.size * 2);
    });
    
    // Draw wind particles (embers and smoke)
    windParticles.forEach(p => {
        noStroke();
        if(random() < 0.5) {
            // Embers
            fill(255, 150, 0, p.opacity);
        } else {
            // Smoke
            fill(200, 200, 200, p.opacity * 0.5);
        }
        circle(p.x, p.y, p.size);
    });
}

function draw() {
    let bgColor = getDayNightColor();
    background(color(
        red(bgColor) * 0.8,
        green(bgColor) * 0.7,
        blue(bgColor) * 0.9
    ));
    
    // Draw atmospheric background
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
    
    // Draw castle
    image(castleImage, CASTLE_X, CASTLE_Y);
    
    updateParticles();
    drawParticles();
    
    updateWeather();
    applyWeatherEffects();
    
    drawNPCs();
    drawCollectibles();
    
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y, user.dragonSprite, user.username);
    });
    
    drawCharacter(myPosition.x, myPosition.y, characterSprite, 'You');
    
    checkNPCInteractions();
    checkCollectibles();
    
    updateScore();
}

// Rest of the existing functions (drawCharacter, drawPlayerName, etc.) remain the same...
