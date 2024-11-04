[Previous map.js content up to line 508]

// Handle keyboard input with improved error handling and feedback
function keyPressed() {
    // Check connection status first
    if (!window.socket?.connected) {
        showMovementFeedback('error', 'Not connected to server');
        return;
    }

    if (!characterSprite) {
        showMovementFeedback('error', 'Character not loaded');
        return;
    }

    if (!isMovementEnabled) {
        showMovementFeedback('error', 'Movement temporarily disabled');
        return;
    }

    // Prevent default behavior for arrow keys first
    if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || 
        keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
        event.preventDefault();
        console.log('Prevented default arrow key behavior');
    } else {
        return; // Only handle arrow keys
    }

    console.log('Key pressed:', keyCode);
    const step = 10;
    let moved = false;
    let blocked = false;
    lastPosition = { ...myPosition };
    let newPosition = { ...myPosition };
    
    // Calculate new position
    switch (keyCode) {
        case LEFT_ARROW:
            newPosition.x = max(24, myPosition.x - step);
            blocked = newPosition.x === 24;
            moved = newPosition.x !== myPosition.x;
            break;
        case RIGHT_ARROW:
            newPosition.x = min(mapSize.width - 24, myPosition.x + step);
            blocked = newPosition.x === mapSize.width - 24;
            moved = newPosition.x !== myPosition.x;
            break;
        case UP_ARROW:
            newPosition.y = max(24, myPosition.y - step);
            blocked = newPosition.y === 24;
            moved = newPosition.y !== myPosition.y;
            break;
        case DOWN_ARROW:
            newPosition.y = min(mapSize.height - 24, myPosition.y + step);
            blocked = newPosition.y === mapSize.height - 24;
            moved = newPosition.y !== myPosition.y;
            break;
    }
    
    // Show feedback if movement is blocked
    if (blocked) {
        showMovementFeedback('warning', 'Cannot move further in this direction');
    }
    
    // Update position if moved
    if (moved) {
        myPosition = newPosition;
        
        // Update last known state
        if (window.lastKnownState) {
            window.lastKnownState.position = newPosition;
        }
        
        // Emit position update
        try {
            console.log('Emitting position update:', myPosition);
            window.socket.emit('position_update', {
                x: myPosition.x,
                y: myPosition.y,
                dragonId: window.selectedDragon?.id,
                username: window.username
            });
        } catch (error) {
            console.error('Error sending position update:', error);
            showMovementFeedback('error', 'Failed to update position');
        }
    }
}

function showMovementFeedback(type, message) {
    const feedback = document.createElement('div');
    feedback.className = `movement-feedback ${type}`;
    feedback.style.position = 'fixed';
    feedback.style.bottom = '20px';
    feedback.style.left = '50%';
    feedback.style.transform = 'translateX(-50%)';
    feedback.style.padding = '10px';
    feedback.style.borderRadius = '5px';
    feedback.style.zIndex = '1000';
    
    switch(type) {
        case 'error':
            feedback.style.backgroundColor = 'var(--bs-danger)';
            break;
        case 'warning':
            feedback.style.backgroundColor = 'var(--bs-warning)';
            break;
        default:
            feedback.style.backgroundColor = 'var(--bs-info)';
    }
    
    feedback.textContent = message;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
}

// Export necessary functions
window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;
