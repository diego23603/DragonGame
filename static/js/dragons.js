let selectedDragon = null;
let availableDragons = [];
let loadedSprites = new Map();
let spriteLoadingPromises = new Map();
let loadingState = 'idle';
const DEFAULT_DRAGON_SPRITE = '/static/images/dragons/red_dragon.svg';

async function initializeDragons() {
    console.log('Initializing dragons...');
    showLoadingState('loading');
    try {
        // Load dragons data
        const response = await fetch('/static/dragons.json');
        if (!response.ok) {
            throw new Error('Failed to load dragons configuration');
        }
        const data = await response.json();
        availableDragons = data.dragons;
        console.log('Available dragons:', availableDragons);
        
        // Load previously selected dragon
        const savedDragonId = localStorage.getItem('selectedDragonId');
        if (savedDragonId) {
            selectedDragon = availableDragons.find(d => d.id === savedDragonId);
            if (selectedDragon) {
                console.log('Restoring previous dragon selection:', selectedDragon.name);
                await loadAndUpdateSprite(selectedDragon.sprite);
            }
        }
        
        // Preload all dragon sprites
        console.log('Preloading dragon sprites...');
        await preloadDragonSprites();
        console.log('All dragon sprites loaded');
        
        renderDragonOptions();
        showLoadingState('success');
    } catch (error) {
        console.error('Error loading dragons:', error);
        showLoadingState('error', error.message);
        // Load default dragon as fallback
        await loadAndUpdateSprite(DEFAULT_DRAGON_SPRITE);
    }
}

async function preloadDragonSprites() {
    const loadPromises = availableDragons.map(dragon => 
        loadDragonSprite(dragon.sprite)
            .catch(error => {
                console.error(`Failed to load sprite for ${dragon.name}:`, error);
                return loadDragonSprite(DEFAULT_DRAGON_SPRITE);
            })
    );
    
    try {
        await Promise.all(loadPromises);
    } catch (error) {
        console.error('Error preloading sprites:', error);
        // Continue with available sprites
    }
}

async function loadDragonSprite(spritePath) {
    if (loadedSprites.has(spritePath)) {
        return loadedSprites.get(spritePath);
    }
    
    if (spriteLoadingPromises.has(spritePath)) {
        return spriteLoadingPromises.get(spritePath);
    }
    
    const loadingPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Sprite loading timeout'));
        }, 10000);

        try {
            loadImage(spritePath, 
                img => {
                    clearTimeout(timeout);
                    loadedSprites.set(spritePath, img);
                    spriteLoadingPromises.delete(spritePath);
                    resolve(img);
                },
                error => {
                    clearTimeout(timeout);
                    console.error(`Failed to load sprite: ${spritePath}`, error);
                    spriteLoadingPromises.delete(spritePath);
                    
                    // Try loading default sprite as fallback
                    if (spritePath !== DEFAULT_DRAGON_SPRITE) {
                        loadDragonSprite(DEFAULT_DRAGON_SPRITE)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(error);
                    }
                }
            );
        } catch (error) {
            clearTimeout(timeout);
            reject(error);
        }
    });
    
    spriteLoadingPromises.set(spritePath, loadingPromise);
    return loadingPromise;
}

async function loadAndUpdateSprite(spritePath) {
    try {
        const sprite = await loadDragonSprite(spritePath);
        window.characterSprite = sprite;
        return sprite;
    } catch (error) {
        console.error('Error loading sprite:', error);
        if (spritePath !== DEFAULT_DRAGON_SPRITE) {
            return loadAndUpdateSprite(DEFAULT_DRAGON_SPRITE);
        }
        throw error;
    }
}

[Rest of the dragons.js file with UI feedback and selection functions...]
