let selectedDragon = null;
let availableDragons = [];

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
                updateCharacterSprite(selectedDragon.sprite);
            }
        }
        
        renderDragonOptions();
    } catch (error) {
        console.error('Error loading dragons:', error);
        document.getElementById('dragonOptions').innerHTML = 
            '<div class="alert alert-danger">Failed to load dragons. Please refresh the page.</div>';
    }
}

function renderDragonOptions() {
    const container = document.getElementById('dragonOptions');
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

function selectDragon(dragon) {
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
    loadImage(spritePath, img => {
        characterSprite = img;
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
