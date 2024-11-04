let currentWeather = 'clear';
let weatherParticles = [];
const weatherTypes = ['clear', 'rain', 'snow'];
let weatherIntensity = 0;
let lastWeatherChange = 0;
const WEATHER_CHANGE_INTERVAL = 60000; // Weather changes every minute

function updateWeather() {
    const currentHour = isAutomatic ? getCurrentHour() : manualTime;
    weatherIntensity = calculateWeatherIntensity(currentHour);
    
    // Change weather periodically with smooth transition
    if (Date.now() - lastWeatherChange > WEATHER_CHANGE_INTERVAL) {
        const oldWeather = currentWeather;
        currentWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        if (oldWeather !== currentWeather) {
            updateWeatherDisplay(currentWeather);
        }
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

function updateWeatherDisplay(weather) {
    const display = document.getElementById('weatherDisplay');
    if (display) {
        display.textContent = weather.charAt(0).toUpperCase() + weather.slice(1);
        display.className = `badge bg-${weather === 'clear' ? 'success' : weather === 'rain' ? 'info' : 'light'} fs-6`;
    }
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
        wind: random(-1, 1),
        alpha: 255,
        color: currentWeather === 'snow' ? color(255, 255, 255) : color(100, 150, 255)
    };
    weatherParticles.push(particle);
}

function updateParticles() {
    for (let i = weatherParticles.length - 1; i >= 0; i--) {
        const p = weatherParticles[i];
        
        // Update position with wind effect
        p.y += p.speed;
        p.x += p.wind + sin(frameCount * 0.02 + p.y * 0.1) * 0.5;
        
        // Fade out particles near the bottom
        if (p.y > height - 100) {
            p.alpha = map(p.y, height - 100, height, 255, 0);
        }
        
        // Draw particle with glow effect
        push();
        if (currentWeather === 'rain') {
            // Rain streak effect
            stroke(p.color.levels[0], p.color.levels[1], p.color.levels[2], p.alpha);
            strokeWeight(1);
            line(p.x, p.y, p.x + p.wind * 2, p.y + p.speed);
            
            // Rain splash effect when hitting ground
            if (p.y > height - 10) {
                noStroke();
                fill(p.color.levels[0], p.color.levels[1], p.color.levels[2], p.alpha * 0.5);
                ellipse(p.x, height, random(2, 4), 1);
            }
        } else if (currentWeather === 'snow') {
            // Snow flake with glow
            noStroke();
            fill(255, 255, 255, p.alpha * 0.3);
            circle(p.x, p.y, p.size * 2);
            fill(255, 255, 255, p.alpha);
            circle(p.x, p.y, p.size);
        }
        pop();
        
        // Remove particles that are off screen or fully faded
        if (p.y > height || p.alpha <= 0) {
            weatherParticles.splice(i, 1);
        }
    }
}

// Add visual effects based on weather
function applyWeatherEffects() {
    push();
    if (currentWeather === 'rain') {
        // Add dynamic rain overlay
        fill(0, 0, 50, 10 + sin(frameCount * 0.02) * 5);
        rect(0, 0, width, height);
    } else if (currentWeather === 'snow') {
        // Add snow accumulation effect
        fill(255, 255, 255, 5 + sin(frameCount * 0.01) * 2);
        rect(0, 0, width, height);
    }
    pop();
}
