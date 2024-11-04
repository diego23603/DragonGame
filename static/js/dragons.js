let selectedDragon = null;
let availableDragons = [];

async function initializeDragons() {
    console.log('Initializing dragons...');
    try {
        const response = await fetch('/static/dragons.json');
        if (!response.ok) {
            throw new Error(`Failed to load dragons: ${response.status}`);
        }
        const data = await response.json();
        console.log('Dragons data loaded:', data);
        
        // Validate dragons data structure
        if (!data.dragons || !Array.isArray(data.dragons)) {
            throw new Error('Invalid dragons data structure');
        }
        
        availableDragons = data.dragons;
        
        // Verify all dragon sprites exist
        for (const dragon of availableDragons) {
            try {
                const spriteResponse = await fetch(dragon.sprite);
                if (!spriteResponse.ok) {
                    console.error(`Failed to load sprite for dragon ${dragon.name}: ${dragon.sprite}`);
                }
            } catch (error) {
                console.error(`Error loading sprite for dragon ${dragon.name}:`, error);
            }
        }
        
        // Load previously selected dragon from localStorage
        const savedDragonId = localStorage.getItem('selectedDragonId');
        if (savedDragonId) {
            selectedDragon = availableDragons.find(d => d.id === savedDragonId);
            if (selectedDragon) {
                console.log('Restored previous dragon selection:', selectedDragon.name);
                updateCharacterSprite(selectedDragon.sprite);
            }
        }
        
        renderDragonOptions();
    } catch (error) {
        console.error('Error loading dragons:', error);
        const errorMessage = 'Failed to load dragons. Please refresh the page.';
        document.getElementById('dragonOptions').innerHTML = 
            `<div class="alert alert-danger">${errorMessage}</div>`;
    }
}

function renderDragonOptions() {
    console.log('Rendering dragon options...');
    const container = document.getElementById('dragonOptions');
    if (!container) {
        console.error('Dragon options container not found!');
        return;
    }
    
    container.innerHTML = '';
    
    availableDragons.forEach(dragon => {
        const dragonElement = document.createElement('div');
        dragonElement.className = 'dragon-option p-2 text-center';
        dragonElement.innerHTML = `
            <div class="position-relative ${selectedDragon?.id === dragon.id ? 'selected-dragon' : ''}">
                <img src="${dragon.sprite}" 
                     alt="${dragon.name}" 
                     class="dragon-sprite mb-2 ${selectedDragon?.id === dragon.id ? 'selected' : ''}"
                     width="${dragon.size}" 
                     height="${dragon.size}"
                     style="cursor: pointer; transition: all 0.3s ease;"
                     onerror="this.onerror=null; this.src='/static/images/dragons/default-dragon.svg';">
                <div class="dragon-name">${dragon.name}</div>
                ${selectedDragon?.id === dragon.id ? 
                    '<div class="selected-indicator position-absolute top-0 start-0 w-100 h-100 border border-2 border-warning rounded"></div>' 
                    : ''}
            </div>
        `;
        
        dragonElement.addEventListener('click', () => selectDragon(dragon));
        container.appendChild(dragonElement);
    });
    
    console.log('Dragon options rendered successfully');
}

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
    
    // Emit dragon selection to other players
    if (socket) {
        socket.emit('dragon_selected', {
            dragonId: dragon.id
        });
    }
}

function updateCharacterSprite(spritePath) {
    console.log('Updating character sprite:', spritePath);
    loadImage(spritePath, img => {
        console.log('Sprite loaded successfully');
        characterSprite = img;
    }, error => {
        console.error('Error loading sprite:', error);
    });
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
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Initialize dragons when the page loads
document.addEventListener('DOMContentLoaded', initializeDragons);
