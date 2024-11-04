let selectedDragon = null;
let availableDragons = [];

// Load available dragons and initialize selection
async function initializeDragons() {
    try {
        const response = await fetch('/static/dragons.json');
        const data = await response.json();
        availableDragons = data.dragons;
        
        // Load previously selected dragon from localStorage
        const savedDragonId = localStorage.getItem('selectedDragonId');
        if (savedDragonId) {
            selectedDragon = availableDragons.find(d => d.id === savedDragonId);
        }
        
        renderDragonOptions();
        if (selectedDragon) {
            updateCharacterSprite(selectedDragon.sprite);
        }
    } catch (error) {
        console.error('Error loading dragons:', error);
    }
}

function renderDragonOptions() {
    const container = document.getElementById('dragonOptions');
    container.innerHTML = '';
    
    availableDragons.forEach(dragon => {
        const dragonElement = document.createElement('div');
        dragonElement.className = 'dragon-option';
        dragonElement.innerHTML = `
            <img src="${dragon.sprite}" alt="${dragon.name}" 
                 class="dragon-sprite ${selectedDragon?.id === dragon.id ? 'selected' : ''}"
                 width="${dragon.size}" height="${dragon.size}">
            <div class="dragon-name">${dragon.name}</div>
        `;
        dragonElement.addEventListener('click', () => selectDragon(dragon));
        container.appendChild(dragonElement);
    });
}

function selectDragon(dragon) {
    selectedDragon = dragon;
    localStorage.setItem('selectedDragonId', dragon.id);
    updateCharacterSprite(dragon.sprite);
    renderDragonOptions();
    
    // Emit dragon selection to other players
    if (socket) {
        socket.emit('dragon_selected', {
            dragonId: dragon.id
        });
    }
}

function updateCharacterSprite(spritePath) {
    // Update the sprite in the game
    loadImage(spritePath, img => {
        characterSprite = img;
    });
}

// Initialize dragons when the page loads
document.addEventListener('DOMContentLoaded', initializeDragons);
