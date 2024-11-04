let selectedDragon = null;
let availableDragons = [];
let loadedSprites = new Map();
let spriteLoadingPromises = new Map();
let loadingState = 'idle';

async function initializeDragons() {
    console.log('Initializing dragons...');
    showLoadingState('loading');
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
                window.selectedDragon = selectedDragon;
            }
        }
        
        // Preload all dragon sprites
        console.log('Preloading dragon sprites...');
        await Promise.all(availableDragons.map(dragon => 
            loadDragonSprite(dragon.sprite)
        ));
        console.log('All dragon sprites loaded');
        
        renderDragonOptions();
        showLoadingState('success');
    } catch (error) {
        console.error('Error loading dragons:', error);
        showLoadingState('error', error.message);
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
    
    // Create new loading promise with timeout
    const loadingPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Sprite loading timeout'));
        }, 10000);

        try {
            console.log('Creating new sprite load promise:', spritePath);
            loadImage(spritePath, 
                img => {
                    clearTimeout(timeout);
                    console.log('Successfully loaded sprite:', spritePath);
                    loadedSprites.set(spritePath, img);
                    spriteLoadingPromises.delete(spritePath);
                    resolve(img);
                },
                error => {
                    clearTimeout(timeout);
                    console.error('Failed to load sprite:', spritePath, error);
                    spriteLoadingPromises.delete(spritePath);
                    reject(error);
                }
            );
        } catch (error) {
            clearTimeout(timeout);
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
        // Check WebSocket connection
        if (!window.socket?.connected) {
            throw new Error('Not connected to server');
        }

        // Load sprite if not already loaded
        if (!loadedSprites.has(dragon.sprite)) {
            showLoadingState('loading', `Loading ${dragon.name}...`);
            console.log('Loading sprite for selected dragon:', dragon.sprite);
            await loadDragonSprite(dragon.sprite);
        }
        
        selectedDragon = dragon;
        window.selectedDragon = dragon;
        localStorage.setItem('selectedDragonId', dragon.id);
        console.log('Dragon selection saved:', dragon.id);
        
        await updateCharacterSprite(dragon.sprite);
        renderDragonOptions();
        
        // Update last known state
        if (window.lastKnownState) {
            window.lastKnownState.selectedDragon = dragon;
        }
        
        // Notify server about dragon selection
        window.socket.emit('dragon_selected', {
            dragonId: dragon.id,
            username: window.username
        });
        
        showSelectionFeedback('success', `Selected ${dragon.name}!`);
        
    } catch (error) {
        console.error('Error selecting dragon:', error);
        showSelectionFeedback('error', `Failed to select dragon: ${error.message}`);
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
        throw error;
    }
}

// UI Feedback functions
function showLoadingState(state, message = '') {
    loadingState = state;
    const container = document.getElementById('dragonOptions');
    
    switch (state) {
        case 'loading':
            container.innerHTML = `
                <div class="loading-indicator">
                    <div class="spinner-border text-warning" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="mt-2">${message || 'Loading dragons...'}</div>
                </div>
            `;
            break;
        case 'error':
            container.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load dragons. ${message}
                    <button onclick="initializeDragons()" class="btn btn-outline-danger mt-2">
                        Retry
                    </button>
                </div>
            `;
            break;
        case 'success':
            renderDragonOptions();
            break;
    }
}

function showSelectionFeedback(type, message) {
    const feedback = document.createElement('div');
    feedback.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed top-0 start-50 translate-middle-x mt-3`;
    feedback.style.zIndex = '1000';
    feedback.textContent = message;
    
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
}

// Export necessary variables and functions
window.selectedDragon = selectedDragon;
window.availableDragons = availableDragons;
