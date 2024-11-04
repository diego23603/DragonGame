let users = new Map();
let myPosition = { x: 400, y: 300 };
let mapSize = { width: 800, height: 600 };
let characterSprite;
let collectibles = [];
let npcs = [];
let score = 0;
let particles = [];
let canvas;

function setup() {
    try {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            throw new Error('Map container element not found');
        }

        canvas = createCanvas(mapSize.width, mapSize.height);
        canvas.parent('mapContainer');
        
        // Verify canvas was created successfully
        if (!canvas) {
            throw new Error('Failed to create canvas');
        }
        
        // Verify canvas dimensions
        if (canvas.width !== mapSize.width || canvas.height !== mapSize.height) {
            console.warn('Canvas dimensions mismatch, resizing...');
            resizeCanvas(mapSize.width, mapSize.height);
        }
        
        frameRate(60);
        
        // Initialize game elements with error handling
        try {
            initializeNPCs();
        } catch (error) {
            console.error('Error initializing NPCs:', error);
        }
        
        try {
            initializeCollectibles();
        } catch (error) {
            console.error('Error initializing collectibles:', error);
        }
        
        try {
            initBackgroundEffects();
        } catch (error) {
            console.error('Error initializing background effects:', error);
        }
        
        console.log('Game canvas initialized successfully');
    } catch (error) {
        console.error('Error during setup:', error);
        // Display error message in the container
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to initialize game canvas: ${error.message}
                    <br>Please refresh the page or check your browser compatibility.
                </div>
            `;
        }
    }
}

// Rest of the map.js file remains the same...
[Previous map.js content from line 25 onwards]
