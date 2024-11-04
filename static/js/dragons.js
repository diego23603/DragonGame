let selectedDragon = null;
let availableDragons = [];
let loadedSprites = new Map();
let loadingErrors = [];

function initializeDragons() {
    return new Promise(async (resolve, reject) => {
        try {
            if (!window.p5Initialized) {
                throw new Error('P5.js not initialized');
            }

            loadingErrors = [];
            
            let mapContainer = document.getElementById('mapContainer');
            if (!mapContainer) {
                mapContainer = document.createElement('div');
                mapContainer.id = 'mapContainer';
                document.body.appendChild(mapContainer);
            }

            const response = await fetch('/static/dragons.json');
            if (!response.ok) {
                throw new Error(`Failed to load dragons: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            availableDragons = data.dragons;
            
            // Load all dragon sprites
            await Promise.all(availableDragons.map(dragon => loadDragonSprite(dragon)));
            
            const savedDragonId = localStorage.getItem('selectedDragonId');
            if (savedDragonId) {
                const saved = availableDragons.find(d => d.id === savedDragonId);
                if (saved && loadedSprites.has(saved.id)) {
                    selectDragon(saved);
                }
            }
            
            if (loadingErrors.length > 0) {
                console.warn('Some dragons failed to load:', loadingErrors);
            }
            
            renderDragonOptions();
            resolve();
        } catch (error) {
            console.error('Error loading dragons:', error);
            const errorMessage = 'Failed to load dragons. Please refresh the page.';
            showDragonError(errorMessage);
            reject(error);
        }
    });
}

function loadDragonSprite(dragon) {
    return new Promise((resolve, reject) => {
        const img = loadImage(
            dragon.sprite,
            (loadedImg) => {
                loadedSprites.set(dragon.id, loadedImg);
                resolve(loadedImg);
            },
            (error) => {
                const errorMsg = `Failed to load sprite for ${dragon.name}`;
                loadingErrors.push(errorMsg);
                console.error(errorMsg, error);
                reject(error);
            }
        );
    });
}

function showDragonError(message) {
    const container = document.getElementById('dragonOptions');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger">
                ${message}
                <button class="btn btn-outline-danger btn-sm ms-3" onclick="retryLoadDragons()">
                    Retry
                </button>
            </div>
        `;
    }
}

function retryLoadDragons() {
    loadingErrors = [];
    initializeDragons().catch(error => {
        console.error('Retry failed:', error);
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
        
        const spriteLoaded = loadedSprites.has(dragon.id);
        const isSelected = selectedDragon?.id === dragon.id;
        
        dragonElement.innerHTML = `
            <div class="position-relative ${isSelected ? 'selected-dragon' : ''}">
                ${spriteLoaded ? `
                    <img src="${dragon.sprite}" 
                         alt="${dragon.name}" 
                         class="dragon-sprite mb-2 ${isSelected ? 'selected' : ''}"
                         width="${dragon.size}" 
                         height="${dragon.size}"
                         style="cursor: pointer; transition: all 0.3s ease;">
                    <div class="dragon-name">${dragon.name}</div>
                    ${isSelected ? `
                        <div class="selected-indicator position-absolute top-0 start-0 w-100 h-100 
                             border border-2 border-warning rounded"></div>
                    ` : ''}
                ` : `
                    <div class="dragon-sprite-error mb-2">
                        <div class="error-icon">❌</div>
                        <div class="error-text">Failed to load</div>
                        <button class="retry-btn" onclick="retryLoadSprite('${dragon.id}')">
                            Retry
                        </button>
                    </div>
                `}
            </div>
        `;
        
        if (spriteLoaded) {
            dragonElement.querySelector('.dragon-sprite').addEventListener('click', () => selectDragon(dragon));
        }
        
        container.appendChild(dragonElement);
    });
}

function retryLoadSprite(dragonId) {
    const dragon = availableDragons.find(d => d.id === dragonId);
    if (dragon) {
        loadDragonSprite(dragon)
            .then(() => renderDragonOptions())
            .catch(error => console.error('Retry failed:', error));
    }
}

// Update the style with enhanced error states
const style = document.createElement('style');
style.textContent = `
    .dragon-sprite-error {
        width: 48px;
        height: 48px;
        background: var(--bs-danger);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        border-radius: 8px;
        padding: 4px;
    }

    .error-icon {
        font-size: 16px;
        margin-bottom: 2px;
    }

    .error-text {
        font-size: 10px;
        margin-bottom: 2px;
    }

    .retry-btn {
        font-size: 10px;
        padding: 2px 6px;
        background: var(--bs-dark);
        color: white;
        border: 1px solid var(--bs-light);
        border-radius: 4px;
        cursor: pointer;
    }

    .retry-btn:hover {
        background: var(--bs-dark-rgb);
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
