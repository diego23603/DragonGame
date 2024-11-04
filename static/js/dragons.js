let selectedDragon = null;
let availableDragons = [];
let loadedSprites = new Map();
let loadingErrors = [];

async function initializeDragons() {
    try {
        // Clear any previous errors
        loadingErrors = [];
        
        // Create mapContainer if it doesn't exist
        let mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            mapContainer = document.createElement('div');
            mapContainer.id = 'mapContainer';
            document.body.appendChild(mapContainer);
            console.log('Created mapContainer element');
        }

        const response = await fetch('/static/dragons.json');
        if (!response.ok) {
            throw new Error(`Failed to load dragons: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        availableDragons = data.dragons;
        
        // Load all dragon sprites
        await Promise.all(availableDragons.map(async dragon => {
            try {
                await loadDragonSprite(dragon);
            } catch (error) {
                loadingErrors.push(`Failed to load sprite for ${dragon.name}: ${error.message}`);
                console.error(`Error loading sprite for ${dragon.name}:`, error);
            }
        }));
        
        // Load previously selected dragon from localStorage
        const savedDragonId = localStorage.getItem('selectedDragonId');
        if (savedDragonId) {
            selectedDragon = availableDragons.find(d => d.id === savedDragonId);
            if (selectedDragon) {
                updateCharacterSprite(selectedDragon.sprite);
            }
        }
        
        if (loadingErrors.length > 0) {
            console.warn('Some dragons failed to load:', loadingErrors);
        }
        
        renderDragonOptions();
    } catch (error) {
        console.error('Error loading dragons:', error);
        const errorMessage = 'Failed to load dragons. Please refresh the page or check your connection.';
        document.getElementById('dragonOptions').innerHTML = 
            `<div class="alert alert-danger">${errorMessage}</div>`;
        throw error;
    }
}

function loadDragonSprite(dragon) {
    return new Promise((resolve, reject) => {
        loadImage(dragon.sprite, 
            img => {
                loadedSprites.set(dragon.id, img);
                resolve(img);
            },
            () => reject(new Error(`Failed to load sprite: ${dragon.sprite}`))
        );
    });
}

function renderDragonOptions() {
    const container = document.getElementById('dragonOptions');
    if (!container) {
        console.error('Dragon options container not found');
        return;
    }
    
    container.innerHTML = '';
    
    availableDragons.forEach(dragon => {
        const dragonElement = document.createElement('div');
        dragonElement.className = 'dragon-option p-2 text-center';
        
        // Check if sprite was successfully loaded
        const spriteLoaded = loadedSprites.has(dragon.id);
        
        dragonElement.innerHTML = `
            <div class="position-relative ${selectedDragon?.id === dragon.id ? 'selected-dragon' : ''}">
                ${spriteLoaded ? `
                    <img src="${dragon.sprite}" 
                         alt="${dragon.name}" 
                         class="dragon-sprite mb-2 ${selectedDragon?.id === dragon.id ? 'selected' : ''}"
                         width="${dragon.size}" 
                         height="${dragon.size}"
                         style="cursor: pointer; transition: all 0.3s ease;">
                ` : `
                    <div class="dragon-sprite-error mb-2">
                        Failed to load sprite
                    </div>
                `}
                <div class="dragon-name">${dragon.name}</div>
                ${selectedDragon?.id === dragon.id ? 
                    '<div class="selected-indicator position-absolute top-0 start-0 w-100 h-100 border border-2 border-warning rounded"></div>' 
                    : ''}
            </div>
        `;
        
        if (spriteLoaded) {
            dragonElement.addEventListener('click', () => selectDragon(dragon));
        }
        container.appendChild(dragonElement);
    });
}

function selectDragon(dragon) {
    if (!loadedSprites.has(dragon.id)) {
        console.error(`Cannot select dragon ${dragon.name}: sprite not loaded`);
        return;
    }
    
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
    
    // Emit dragon selection to other players
    if (socket && socket.connected) {
        socket.emit('dragon_selected', {
            dragonId: dragon.id
        });
    }
}

function updateCharacterSprite(spritePath) {
    if (!spritePath) {
        console.error('Invalid sprite path');
        return;
    }

    loadImage(spritePath, 
        img => {
            characterSprite = img;
        },
        error => {
            console.error('Error loading character sprite:', error);
        }
    );
}

// Add styles for dragon selection
const style = document.createElement('style');
style.textContent = `
    .dragon-option {
        display: inline-block;
        margin: 10px;
        transition: transform 0.3s ease;
    }
    
    .dragon-option:hover {
        transform: scale(1.1);
    }
    
    .dragon-sprite.selected {
        filter: drop-shadow(0 0 10px #ffc107);
        transform: scale(1.1);
    }
    
    .selected-dragon {
        animation: pulse 2s infinite;
    }
    
    .dragon-sprite-error {
        width: 48px;
        height: 48px;
        background: #dc3545;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        border-radius: 8px;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Initialize dragons when the page loads
document.addEventListener('DOMContentLoaded', initializeDragons);
