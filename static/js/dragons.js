let selectedDragon = null;
let availableDragons = [];
let loadedSprites = new Map();
let spriteLoadingPromises = new Map();

async function initializeDragons() {
    console.log('Initializing dragons...');
    try {
        const response = await fetch('/static/dragons.json');
        if (!response.ok) {
            throw new Error('Failed to load dragons');
        }
        const data = await response.json();
        availableDragons = data.dragons;
        console.log('Available dragons:', availableDragons);
        
        // Load previously selected dragon from localStorage
        const savedDragonId = localStorage.getItem('selectedDragonId');
        if (savedDragonId) {
            console.log('Found saved dragon:', savedDragonId);
            selectedDragon = availableDragons.find(d => d.id === savedDragonId);
            if (selectedDragon) {
                console.log('Restoring previous dragon selection:', selectedDragon.name);
                await updateCharacterSprite(selectedDragon.sprite);
            }
        }
        
        // Preload all dragon sprites
        console.log('Preloading dragon sprites...');
        await Promise.all(availableDragons.map(dragon => 
            loadDragonSprite(dragon.sprite)
        ));
        console.log('All dragon sprites loaded');
        
        renderDragonOptions();
    } catch (error) {
        console.error('Error loading dragons:', error);
        const container = document.getElementById('dragonOptions');
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load dragons. Please try refreshing the page.
                Error: ${error.message}
            </div>
        `;
    }
}

async function loadDragonSprite(spritePath) {
    console.log('Loading sprite:', spritePath);
    // Return cached sprite if available
    if (loadedSprites.has(spritePath)) {
        console.log('Using cached sprite:', spritePath);
        return loadedSprites.get(spritePath);
    }
    
    // Return existing promise if sprite is currently loading
    if (spriteLoadingPromises.has(spritePath)) {
        console.log('Sprite already loading:', spritePath);
        return spriteLoadingPromises.get(spritePath);
    }
    
    // Create new loading promise
    const loadingPromise = new Promise((resolve, reject) => {
        try {
            console.log('Creating new sprite load promise:', spritePath);
            loadImage(spritePath, 
                img => {
                    console.log('Successfully loaded sprite:', spritePath);
                    loadedSprites.set(spritePath, img);
                    spriteLoadingPromises.delete(spritePath);
                    resolve(img);
                },
                error => {
                    console.error('Failed to load sprite:', spritePath, error);
                    spriteLoadingPromises.delete(spritePath);
                    reject(error);
                }
            );
        } catch (error) {
            console.error('Error in loadImage:', error);
            spriteLoadingPromises.delete(spritePath);
            reject(error);
        }
    });
    
    spriteLoadingPromises.set(spritePath, loadingPromise);
    return loadingPromise;
}

function renderDragonOptions() {
    console.log('Rendering dragon options...');
    const container = document.getElementById('dragonOptions');
    container.innerHTML = '';
    
    availableDragons.forEach(dragon => {
        const dragonElement = document.createElement('div');
        dragonElement.className = 'dragon-option p-2 text-center';
        
        const sprite = loadedSprites.get(dragon.sprite);
        const imgSrc = sprite ? dragon.sprite : '/static/images/dragons/red_dragon.svg';
        console.log(`Rendering dragon ${dragon.name} with sprite:`, imgSrc);
        
        dragonElement.innerHTML = `
            <div class="position-relative ${selectedDragon?.id === dragon.id ? 'selected-dragon' : ''}">
                <img src="${imgSrc}" 
                     alt="${dragon.name}" 
                     class="dragon-sprite mb-2 ${selectedDragon?.id === dragon.id ? 'selected' : ''}"
                     width="${dragon.size}" 
                     height="${dragon.size}"
                     style="cursor: pointer; transition: all 0.3s ease;">
                <div class="dragon-name">${dragon.name}</div>
                ${selectedDragon?.id === dragon.id ? 
                    '<div class="selected-indicator position-absolute top-0 start-0 w-100 h-100 border border-2 border-warning rounded"></div>' 
                    : ''}
            </div>
        `;
        
        dragonElement.addEventListener('click', () => selectDragon(dragon));
        container.appendChild(dragonElement);
    });
}

async function selectDragon(dragon) {
    console.log('Selecting dragon:', dragon.name);
    try {
        // Verify WebSocket connection
        if (!socket?.connected) {
            console.error('WebSocket not connected! Cannot select dragon.');
            throw new Error('WebSocket connection not available');
        }

        // Load sprite if not already loaded
        if (!loadedSprites.has(dragon.sprite)) {
            console.log('Loading sprite for selected dragon:', dragon.sprite);
            await loadDragonSprite(dragon.sprite);
        }
        
        selectedDragon = dragon;
        localStorage.setItem('selectedDragonId', dragon.id);
        console.log('Dragon selection saved:', dragon.id);
        
        await updateCharacterSprite(dragon.sprite);
        renderDragonOptions();
        
        // Notify server about dragon selection
        if (socket && window.authToken) {
            console.log('Emitting dragon selection to server:', dragon.id);
            socket.emit('dragon_selected', {
                dragonId: dragon.id,
                username: window.username
            });
        }
        
        // Show selection feedback
        const feedback = document.createElement('div');
        feedback.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
        feedback.style.zIndex = '1000';
        feedback.textContent = `Selected ${dragon.name}!`;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
        
    } catch (error) {
        console.error('Error selecting dragon:', error);
        const feedback = document.createElement('div');
        feedback.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3';
        feedback.style.zIndex = '1000';
        feedback.textContent = `Failed to select dragon. Please try again.`;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    }
}

async function updateCharacterSprite(spritePath) {
    console.log('Updating character sprite:', spritePath);
    try {
        const sprite = await loadDragonSprite(spritePath);
        window.characterSprite = sprite;
        console.log('Character sprite updated successfully');
    } catch (error) {
        console.error('Error updating character sprite:', error);
        // Use default sprite if available
        if (loadedSprites.has('/static/images/dragons/red_dragon.svg')) {
            console.log('Using default red dragon sprite as fallback');
            window.characterSprite = loadedSprites.get('/static/images/dragons/red_dragon.svg');
        }
    }
}

// Export necessary variables and functions
window.selectedDragon = selectedDragon;
window.availableDragons = availableDragons;
