// Global constants
const mapSize = {
    width: 800,
    height: 600
};

// Global variables for game state
let characterSprite = null;
let myPosition = { x: 400, y: 300 };
let lastPosition = { x: 400, y: 300 };
let collectibles = [];
let dragonSilhouettes = [];
let users = new Map();
let npcs = [];
let score = 0;

// NPC definitions
const npcTypes = {
    merchant: {
        sprite: '/static/images/dragons/blue_dragon.svg',
        size: 40,
        dialogue: ["Welcome traveler!", "Would you like to trade?", "Safe travels!"]
    },
    guard: {
        sprite: '/static/images/dragons/red_dragon.svg',
        size: 40,
        dialogue: ["Halt!", "The castle is protected.", "Move along now."]
    },
    wizard: {
        sprite: '/static/images/dragons/green_dragon.svg',
        size: 40,
        dialogue: ["Seeking knowledge?", "The ancient magic flows strong here.", "Return when you're ready to learn more."]
    }
};

function setup() {
    console.log('Setting up game canvas...');
    const canvas = createCanvas(mapSize.width, mapSize.height);
    canvas.parent('mapContainer');
    frameRate(60);
    
    // Initialize NPCs
    console.log('Initializing NPCs...');
    initializeNPCs();
    
    // Initialize collectibles
    console.log('Initializing collectibles...');
    initializeCollectibles();
    
    // Initialize dragon silhouettes
    console.log('Initializing dragon silhouettes...');
    initializeSilhouettes();
}

function initializeNPCs() {
    // Add NPCs at strategic locations
    npcs = [
        {
            type: 'merchant',
            x: 100,
            y: 100,
            dialogueIndex: 0,
            lastInteractionTime: 0,
            ...npcTypes.merchant
        },
        {
            type: 'guard',
            x: mapSize.width - 100,
            y: mapSize.height - 100,
            dialogueIndex: 0,
            lastInteractionTime: 0,
            ...npcTypes.guard
        },
        {
            type: 'wizard',
            x: mapSize.width / 2,
            y: mapSize.height / 2,
            dialogueIndex: 0,
            lastInteractionTime: 0,
            ...npcTypes.wizard
        }
    ];
}

function initializeCollectibles() {
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
}

function initializeSilhouettes() {
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

function draw() {
    // Get background color based on day/night cycle
    const bgColor = getDayNightColor();
    background(bgColor);
    
    // Draw game elements
    drawGrid();
    drawCollectibles();
    drawNPCs();
    drawCharacters();
    drawUI();
    
    // Update character position with smooth lerp
    myPosition.x = lerp(lastPosition.x, myPosition.x, 0.3);
    myPosition.y = lerp(lastPosition.y, myPosition.y, 0.3);
    
    // Check for NPC interactions
    checkNPCInteractions();
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

function drawNPCs() {
    npcs.forEach(npc => {
        push();
        imageMode(CENTER);
        
        // Draw shadow
        noStroke();
        fill(0, 0, 0, 30);
        ellipse(npc.x, npc.y + 20, npc.size, npc.size/2);
        
        // Draw NPC sprite
        if (loadedSprites.has(npc.sprite)) {
            const sprite = loadedSprites.get(npc.sprite);
            image(sprite, npc.x, npc.y, npc.size, npc.size);
        }
        
        // Draw interaction radius
        noFill();
        stroke(255, 255, 255, 50);
        circle(npc.x, npc.y, 100);
        
        pop();
    });
}

function drawCharacters() {
    // Draw other users
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y, user.dragonSprite || characterSprite);
        drawPlayerName(user.x, user.y - 30, user.username || 'Player');
    });
    
    // Draw main character
    drawCharacter(myPosition.x, myPosition.y);
    drawPlayerName(myPosition.x, myPosition.y - 30, window.username || 'You');
}

function drawCharacter(x, y, dragonSprite = characterSprite) {
    try {
        if (!dragonSprite) {
            console.warn('Missing dragon sprite for character rendering, using fallback');
            push();
            fill(255, 100, 100);
            noStroke();
            circle(x, y, 24);
            pop();
            return;
        }

        push();
        imageMode(CENTER);
        
        // Draw shadow
        noStroke();
        fill(0, 0, 0, 30);
        ellipse(x, y + 24, 40, 20);
        
        // Draw sprite
        image(dragonSprite, x, y, 48, 48);
        
        pop();
    } catch (error) {
        console.error('Error drawing character:', error);
        push();
        fill(255, 100, 100);
        noStroke();
        circle(x, y, 24);
        pop();
    }
}

function drawUI() {
    // Draw score
    push();
    fill(255);
    noStroke();
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 10, 10);
    pop();
}

function checkNPCInteractions() {
    npcs.forEach(npc => {
        const d = dist(myPosition.x, myPosition.y, npc.x, npc.y);
        if (d < 50) { // Interaction radius
            const currentTime = millis();
            if (currentTime - npc.lastInteractionTime > 2000) { // Cooldown period
                npc.dialogueIndex = (npc.dialogueIndex + 1) % npc.dialogue.length;
                npc.lastInteractionTime = currentTime;
                
                // Display dialogue
                const dialogueText = npc.dialogue[npc.dialogueIndex];
                displayDialogue(npc.x, npc.y - 50, dialogueText);
            }
        }
    });
}

function displayDialogue(x, y, text) {
    push();
    fill(0, 0, 0, 200);
    noStroke();
    rectMode(CENTER);
    rect(x, y, textWidth(text) + 20, 30, 5);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(text, x, y);
    pop();
}

function keyPressed() {
    if (!characterSprite) {
        console.warn('Character sprite not loaded yet - movement disabled');
        return;
    }

    const step = 10;
    let moved = false;
    lastPosition = { ...myPosition };
    
    // Prevent default behavior for arrow keys
    if ([LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW].includes(keyCode)) {
        event.preventDefault();
    }
    
    try {
        const newPosition = { ...myPosition };
        
        if (keyCode === LEFT_ARROW) {
            newPosition.x = max(24, myPosition.x - step);
            moved = true;
        } else if (keyCode === RIGHT_ARROW) {
            newPosition.x = min(mapSize.width - 24, myPosition.x + step);
            moved = true;
        } else if (keyCode === UP_ARROW) {
            newPosition.y = max(24, myPosition.y - step);
            moved = true;
        } else if (keyCode === DOWN_ARROW) {
            newPosition.y = min(mapSize.height - 24, myPosition.y + step);
            moved = true;
        }
        
        if (moved) {
            myPosition = newPosition;
            if (socket) {
                try {
                    socket.emit('position_update', {
                        x: myPosition.x,
                        y: myPosition.y,
                        dragonId: window.selectedDragon?.id,
                        username: window.username
                    });
                } catch (socketError) {
                    console.error('Error emitting position update:', socketError);
                }
            }
        }
    } catch (error) {
        console.error('Error in keyPressed function:', error);
        myPosition = { ...lastPosition };
    }
}

// Export necessary functions for p5.js
window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;
