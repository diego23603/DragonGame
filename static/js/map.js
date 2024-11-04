// Only modifying the relevant functions, keeping the rest of the file unchanged

function setup() {
    console.log('Setting up game canvas...');
    const canvas = createCanvas(mapSize.width, mapSize.height);
    canvas.parent('mapContainer');
    frameRate(60);
    
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
    console.log('Initializing dragon silhouettes...');
    for (let i = 0; i < 3; i++) {
        dragonSilhouettes.push({
            x: random(width),
            y: random(height),
            size: random(100, 200),
            speed: random(0.5, 1.5),
            offset: random(TWO_PI)
        });
    }
    
    // Load default sprite if needed
    if (!characterSprite) {
        console.log('Loading default character sprite...');
        const defaultDragon = '/static/images/dragons/red_dragon.svg';
        loadImage(defaultDragon, img => {
            console.log('Default character sprite loaded successfully');
            characterSprite = img;
        });
    }
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
        
        // Draw glow effect for selected dragon
        if (window.selectedDragon && dragonSprite === characterSprite) {
            drawingContext.shadowBlur = 20;
            drawingContext.shadowColor = 'rgba(255, 150, 50, 0.5)';
            drawingContext.shadowOffsetX = 0;
            drawingContext.shadowOffsetY = 0;
        }
        
        pop();
    } catch (error) {
        console.error('Error drawing character:', error);
        // Fallback rendering
        push();
        fill(255, 100, 100);
        noStroke();
        circle(x, y, 24);
        pop();
    }
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
        console.log('Preventing default behavior for arrow key:', keyCode);
        event.preventDefault();
    }
    
    try {
        const newPosition = { ...myPosition };
        
        if (keyCode === LEFT_ARROW) {
            console.log('Moving left');
            newPosition.x = max(24, myPosition.x - step);
            moved = true;
        } else if (keyCode === RIGHT_ARROW) {
            console.log('Moving right');
            newPosition.x = min(mapSize.width - 24, myPosition.x + step);
            moved = true;
        } else if (keyCode === UP_ARROW) {
            console.log('Moving up');
            newPosition.y = max(24, myPosition.y - step);
            moved = true;
        } else if (keyCode === DOWN_ARROW) {
            console.log('Moving down');
            newPosition.y = min(mapSize.height - 24, myPosition.y + step);
            moved = true;
        }
        
        if (moved) {
            // Update position
            myPosition = newPosition;
            
            // Emit position update if connected
            if (socket) {
                try {
                    const updateData = {
                        x: myPosition.x,
                        y: myPosition.y,
                        dragonId: window.selectedDragon?.id,
                        username: window.username
                    };
                    console.log('Emitting position update:', updateData);
                    socket.emit('position_update', updateData);
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
