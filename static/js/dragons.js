// Previous code remains the same until selectDragon function
function selectDragon(dragon) {
    console.log('Selecting dragon:', dragon.name);
    selectedDragon = dragon;
    localStorage.setItem('selectedDragonId', dragon.id);
    
    // Update character sprite
    updateCharacterSprite(dragon.sprite);
    
    // Update UI
    renderDragonOptions();
    
    // Show selection feedback
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
    feedbackEl.style.zIndex = '1000';
    feedbackEl.textContent = `Selected ${dragon.name}!`;
    document.body.appendChild(feedbackEl);
    
    setTimeout(() => {
        feedbackEl.remove();
    }, 2000);
    
    // Emit dragon selection to server for persistence
    if (typeof emitDragonSelection === 'function') {
        emitDragonSelection(dragon.id);
    }
}

// Rest of the code remains the same
