let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];
let canvas;
let p5Initialized = false;
let loadingAssets = true;
let loadingErrors = [];

function preload() {
    // This runs before setup, ensuring p5.js is ready
    p5Initialized = true;
}

function setup() {
    try {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            throw new Error('Map container element not found');
        }

        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-warning" role="status"></div>
                <p class="mt-2">Loading Dragon World...</p>
            </div>
        `;
        mapContainer.appendChild(loadingOverlay);

        canvas = createCanvas(mapSize.width, mapSize.height);
        canvas.parent('mapContainer');
        
        if (!canvas) {
            throw new Error('Failed to create canvas');
        }
        
        if (canvas.width !== mapSize.width || canvas.height !== mapSize.height) {
            console.warn('Canvas dimensions mismatch, resizing...');
            resizeCanvas(mapSize.width, mapSize.height);
        }
        
        frameRate(60);
        
        // Initialize game elements with error handling
        Promise.all([
            initializeNPCs(),
            initializeCollectibles(),
            initBackgroundEffects(),
            initializeDragons()
        ]).then(() => {
            loadingAssets = false;
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.remove();
            }
        }).catch(error => {
            console.error('Error initializing game elements:', error);
            showError('Failed to initialize game elements. Please refresh the page.');
        });
        
        console.log('Game canvas initialized successfully');
    } catch (error) {
        console.error('Error during setup:', error);
        showError(`Failed to initialize game canvas: ${error.message}`);
    }
}

function draw() {
    if (loadingAssets) {
        // Show loading state
        background(42, 24, 16);
        fill(255);
        textAlign(CENTER, CENTER);
        text('Loading Dragon World...', width/2, height/2);
        return;
    }

    let bgColor = getDayNightColor();
    background(color(
        red(bgColor) * 1.2,
        green(bgColor) * 0.8,
        blue(bgColor) * 0.7
    ));
    
    drawBackgroundEffects();
    updateWeather();
    applyWeatherEffects();
    
    drawGrid();
    drawNPCs();
    drawCollectibles();
    
    users.forEach((user, id) => {
        drawCharacter(user.x, user.y, user.dragonSprite, user.username);
    });
    
    drawCharacter(myPosition.x, myPosition.y, characterSprite, 'You');
    
    if (loadingErrors.length > 0) {
        showError(loadingErrors.join('\n'));
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger position-absolute top-0 start-50 translate-middle-x mt-3';
    errorDiv.style.zIndex = '1000';
    errorDiv.innerHTML = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function addLoadingError(error) {
    loadingErrors.push(error);
    console.error(error);
}

// Add loading overlay styles
const style = document.createElement('style');
style.textContent = `
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(42, 24, 16, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        border-radius: 15px;
    }

    .loading-content {
        text-align: center;
        color: var(--dragon-secondary);
    }
`;
document.head.appendChild(style);
