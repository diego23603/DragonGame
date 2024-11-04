let currentWeather = 'clear';
let weatherParticles = [];
const weatherTypes = ['clear', 'rain', 'snow'];
let weatherIntensity = 0;
let lastWeatherChange = 0;
const WEATHER_CHANGE_INTERVAL = 60000; // Weather changes every minute

function updateWeather() {
    const currentHour = isAutomatic ? getCurrentHour() : manualTime;
    weatherIntensity = calculateWeatherIntensity(currentHour);
    
    // Change weather periodically
    if (Date.now() - lastWeatherChange > WEATHER_CHANGE_INTERVAL) {
        currentWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        lastWeatherChange = Date.now();
    }
    
    // Create new particles based on weather type
    if (frameCount % 2 === 0 && currentWeather !== 'clear') {
        for (let i = 0; i < weatherIntensity; i++) {
            createWeatherParticle();
        }
    }
    
    // Update and draw existing particles
    updateParticles();
}

function calculateWeatherIntensity(hour) {
    // Weather is more intense at night and early morning
    const normalizedHour = (hour < 12) ? hour : 24 - hour;
    return map(normalizedHour, 0, 12, 5, 1);
}

function createWeatherParticle() {
    const particle = {
        x: random(-100, width + 100),
        y: -10,
        speed: random(5, 10),
        size: currentWeather === 'snow' ? random(2, 4) : random(1, 2),
        wind: random(-1, 1)
    };
    weatherParticles.push(particle);
}

function updateParticles() {
    for (let i = weatherParticles.length - 1; i >= 0; i--) {
        const p = weatherParticles[i];
        
        // Update position
        p.y += p.speed;
        p.x += p.wind;
        
        // Draw particle
        push();
        noStroke();
        if (currentWeather === 'rain') {
            fill(200, 200, 255, 200);
            rect(p.x, p.y, 1, p.size * 2);
        } else if (currentWeather === 'snow') {
            fill(255, 255, 255, 200);
            circle(p.x, p.y, p.size);
        }
        pop();
        
        // Remove particles that are off screen
        if (p.y > height) {
            weatherParticles.splice(i, 1);
        }
    }
}

// Add visual effects based on weather
function applyWeatherEffects() {
    push();
    if (currentWeather === 'rain') {
        // Add rain overlay
        fill(0, 0, 50, 20);
        rect(0, 0, width, height);
    } else if (currentWeather === 'snow') {
        // Add snow overlay
        fill(255, 255, 255, 10);
        rect(0, 0, width, height);
    }
    pop();
}
