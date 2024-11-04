let selectedDragon = null;
let availableDragons = [];
let loadedSprites = new Map();
let spriteLoadingPromises = new Map();

async function initializeDragons() {
    console.log('Initializing dragons...');
    try {
        const response = await fetch('/static/dragons.json');
        if (!response.ok) {
            throw new Error('Failed to load dragons configuration');
        }
        const data = await response.json();
        availableDragons = data.dragons;
        console.log('Loaded dragons configuration:', availableDragons);
        
        // Load previously selected dragon from localStorage
        const savedDragonId = localStorage.getItem('selectedDragonId');
        if (savedDragonId) {
            console.log('Found previously selected dragon:', savedDragonId);
            selectedDragon = availableDragons.find(d => d.id === savedDragonId);
            if (selectedDragon) {
                console.log('Restoring previous dragon selection:', selectedDragon.name);
                await loadDragonSprite(selectedDragon.sprite);
                await updateCharacterSprite(selectedDragon.sprite);
            }
        }
        
        // Preload all dragon sprites
        console.log('Preloading dragon sprites...');
        const loadingResults = await Promise.allSettled(
            availableDragons.map(dragon => loadDragonSprite(dragon.sprite))
        );
        
        // Log any sprite loading failures
        loadingResults.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error('Failed to load sprite for dragon:', availableDragons[index].name, result.reason);
            } else {
                console.log('Successfully loaded sprite for dragon:', availableDragons[index].name);
            }
        });
        
        // If no dragon is selected, select the first available one
        if (!selectedDragon && availableDragons.length > 0) {
            console.log('No dragon selected, selecting first available dragon');
            await selectDragon(availableDragons[0]);
        }
        
        renderDragonOptions();
    } catch (error) {
        console.error('Error initializing dragons:', error);
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
    console.log('Loading dragon sprite:', spritePath);
    
    // Return cached sprite if available
    if (loadedSprites.has(spritePath)) {
        console.log('Using cached sprite for:', spritePath);
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
            console.log('Starting new sprite load for:', spritePath);
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
                    reject(new Error(`Failed to load sprite ${spritePath}: ${error.message}`));
                }
            );
        } catch (error) {
            console.error('Error in loadImage:', spritePath, error);
            spriteLoadingPromises.delete(spritePath);
            reject(new Error(`Error loading sprite ${spritePath}: ${error.message}`));
        }
    });
    
    spriteLoadingPromises.set(spritePath, loadingPromise);
    return loadingPromise;
}

async function selectDragon(dragon) {
    console.log('Selecting dragon:', dragon.name);
    try {
        // Load sprite if not already loaded
        if (!loadedSprites.has(dragon.sprite)) {
            console.log('Loading sprite for selected dragon:', dragon.sprite);
            await loadDragonSprite(dragon.sprite);
        }
        
        selectedDragon = dragon;
        localStorage.setItem('selectedDragonId', dragon.id);
        
        console.log('Updating character sprite...');
        await updateCharacterSprite(dragon.sprite);
        renderDragonOptions();
        
        // Notify server about dragon selection
        if (socket && window.authToken) {
            console.log('Notifying server about dragon selection:', dragon.id);
            socket.emit('dragon_selected', {
                dragonId: dragon.id,
                username: window.username
            });
        }
        
        return true;
    } catch (error) {
        console.error('Error selecting dragon:', error);
        return false;
    }
}

async function updateCharacterSprite(spritePath) {
    console.log('Updating character sprite:', spritePath);
    try {
        const sprite = await loadDragonSprite(spritePath);
        window.characterSprite = sprite;
        console.log('Character sprite updated successfully:', spritePath);
        return true;
    } catch (error) {
        console.error('Error updating character sprite:', error);
        // Use default sprite if available
        if (loadedSprites.has('/static/images/dragons/red_dragon.svg')) {
            console.log('Using fallback red dragon sprite');
            window.characterSprite = loadedSprites.get('/static/images/dragons/red_dragon.svg');
            return true;
        }
        return false;
    }
}

function renderDragonOptions() {
    console.log('Rendering dragon options...');
    const container = document.getElementById('dragonOptions');
    container.innerHTML = '';
    
    availableDragons.forEach(dragon => {
        const dragonElement = document.createElement('div');
        dragonElement.className = 'dragon-option p-2 text-center';
        
        const sprite = loadedSprites.get(dragon.sprite);
        dragonElement.innerHTML = `
            <div class="position-relative ${selectedDragon?.id === dragon.id ? 'selected-dragon' : ''}">
                <img src="${dragon.sprite}" 
                     alt="${dragon.name}" 
                     class="dragon-sprite mb-2 ${selectedDragon?.id === dragon.id ? 'selected' : ''}"
                     width="${dragon.size}" 
                     height="${dragon.size}"
                     style="cursor: pointer; transition: all 0.3s ease;"
                     data-dragon-id="${dragon.id}">
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

// Export necessary variables and functions
window.selectedDragon = selectedDragon;
window.availableDragons = availableDragons;
window.initializeDragons = initializeDragons;
window.loadedSprites = loadedSprites;
