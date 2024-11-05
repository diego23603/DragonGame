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
        
        if (!data.dragons || !Array.isArray(data.dragons)) {
            throw new Error('Invalid dragons data structure');
        }
        
        availableDragons = data.dragons;
        
        // Load previously selected dragon from localStorage
        const savedDragonId = localStorage.getItem('selectedDragonId');
        if (savedDragonId) {
            selectedDragon = availableDragons.find(d => d.id === savedDragonId);
            if (selectedDragon) {
                console.log('Restored previous dragon selection:', selectedDragon.name);
                await loadDragonSprite(selectedDragon);
            }
        }
        
        await loadAllDragonSprites();
        renderDragonOptions();
        
    } catch (error) {
        console.error('Error loading dragons:', error);
        const errorMessage = 'Failed to load dragons. Please refresh the page.';
        document.getElementById('dragonOptions').innerHTML = 
            `<div class="alert alert-danger">${errorMessage}</div>`;
    }
}

async function loadAllDragonSprites() {
    const loadPromises = availableDragons.map(dragon => loadDragonSprite(dragon));
    await Promise.allSettled(loadPromises);
}

async function loadDragonSprite(dragon) {
    try {
        const spriteResponse = await fetch(dragon.sprite);
        if (!spriteResponse.ok) {
            console.error(`Failed to load sprite for dragon ${dragon.name}: ${dragon.sprite}`);
            dragon.spriteLoadError = true;
            return false;
        }
        dragon.spriteLoadError = false;
        return true;
    } catch (error) {
        console.error(`Error loading sprite for dragon ${dragon.name}:`, error);
        dragon.spriteLoadError = true;
        return false;
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
                ${dragon.spriteLoadError ? '<div class="sprite-error">!</div>' : ''}
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
    
    updateCharacterSprite(dragon.sprite);
    renderDragonOptions();
    
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
    feedbackEl.style.zIndex = '1000';
    feedbackEl.textContent = `Selected ${dragon.name}!`;
    document.body.appendChild(feedbackEl);
    
    setTimeout(() => {
        feedbackEl.remove();
    }, 2000);
    
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
        // Load default sprite on error
        loadImage('/static/images/dragons/default-dragon.svg', img => {
            characterSprite = img;
        });
    });
}

function updateNickname() {
    const nicknameInput = document.getElementById('nicknameInput');
    const nickname = nicknameInput.value.trim();
    
    // Check for authentication token
    const token = localStorage.getItem('authToken');
    if (!token) {
        showNicknameFeedback('Please login first to update your nickname', 'danger');
        setTimeout(() => {
            window.location.href = '/'; // Redirect to login page
        }, 2000);
        return;
    }
    
    // Validate nickname
    if (!nickname) {
        showNicknameFeedback('Please enter a valid nickname', 'danger');
        return;
    }
    
    if (nickname.length < 2 || nickname.length > 64) {
        showNicknameFeedback('Nickname must be between 2 and 64 characters', 'danger');
        return;
    }
    
    fetch('/update-nickname', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nickname })
    })
    .then(response => {
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            throw new Error('Authentication expired. Please login again.');
        }
        if (!response.ok) {
            throw new Error(response.statusText || 'Failed to update nickname');
        }
        return response.json();
    })
    .then(data => {
        if (data.message === 'Nickname updated successfully') {
            document.getElementById('nicknameDisplay').textContent = `Nickname: ${data.nickname}`;
            nicknameInput.value = '';
            showNicknameFeedback('Nickname updated successfully!', 'success');
        } else {
            showNicknameFeedback(data.message, 'warning');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.message.includes('Authentication expired')) {
            showNicknameFeedback('Your session has expired. Redirecting to login...', 'danger');
            setTimeout(() => {
                window.location.href = '/'; // Redirect to login page
            }, 2000);
        } else {
            showNicknameFeedback('Error updating nickname. Please try again.', 'danger');
        }
    });
}

function showNicknameFeedback(message, type) {
    const feedbackDiv = document.getElementById('nicknameFeedback');
    feedbackDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    if (type !== 'danger') {
        setTimeout(() => {
            feedbackDiv.innerHTML = '';
        }, 3000);
    }
}

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
    
    .sprite-error {
        position: absolute;
        top: -5px;
        right: -5px;
        width: 20px;
        height: 20px;
        background-color: var(--bs-danger);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', initializeDragons);
