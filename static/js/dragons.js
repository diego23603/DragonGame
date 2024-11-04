let selectedDragon = null;
let availableDragons = [];
let loadedSprites = new Map();

async function initializeDragons() {
    try {
        const response = await fetch('/static/dragons.json');
        if (!response.ok) {
            throw new Error('Failed to load dragons');
        }
        const data = await response.json();
        availableDragons = data.dragons;
        
        // Load previously selected dragon from localStorage
        const savedDragonId = localStorage.getItem('selectedDragonId');
        if (savedDragonId) {
            selectedDragon = availableDragons.find(d => d.id === savedDragonId);
            if (selectedDragon) {
                await updateCharacterSprite(selectedDragon.sprite);
            }
        }
        
        // Preload all dragon sprites
        await Promise.all(availableDragons.map(dragon => 
            loadDragonSprite(dragon.sprite)
        ));
        
        renderDragonOptions();
    } catch (error) {
        console.error('Error loading dragons:', error);
        document.getElementById('dragonOptions').innerHTML = 
            '<div class="alert alert-danger">Failed to load dragons. Please refresh the page.</div>';
    }
}

async function loadDragonSprite(spritePath) {
    if (loadedSprites.has(spritePath)) {
        return loadedSprites.get(spritePath);
    }

    return new Promise((resolve, reject) => {
        try {
            loadImage(spritePath, img => {
                loadedSprites.set(spritePath, img);
                resolve(img);
            }, 
            error => {
                console.error('Error loading sprite:', spritePath, error);
                reject(error);
            });
        } catch (error) {
            console.error('Error in loadImage:', error);
            reject(error);
        }
    });
}

function renderDragonOptions() {
    const container = document.getElementById('dragonOptions');
    container.innerHTML = '';
    
    availableDragons.forEach(dragon => {
        const dragonElement = document.createElement('div');
        dragonElement.className = 'dragon-option p-2 text-center';
        
        const sprite = loadedSprites.get(dragon.sprite);
        const imgSrc = sprite ? dragon.sprite : '/static/images/dragons/red_dragon.svg'; // Fallback sprite
        
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

async function updateCharacterSprite(spritePath) {
    try {
        const sprite = await loadDragonSprite(spritePath);
        characterSprite = sprite;
    } catch (error) {
        console.error('Error updating character sprite:', error);
        // Use default sprite if available
        if (loadedSprites.has('/static/images/dragons/red_dragon.svg')) {
            characterSprite = loadedSprites.get('/static/images/dragons/red_dragon.svg');
        }
    }
}

// Rest of the file remains the same...
