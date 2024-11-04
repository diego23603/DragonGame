let isAutomatic = true;
let manualTime = 12; // noon
const HOURS_PER_MINUTE = 24 / 1440; // 24 hours per real minute

function getDayNightColor() {
    const hour = isAutomatic ? getCurrentHour() : manualTime;
    const brightness = calculateBrightness(hour);
    // Return a color with dragon theme (warmer tones)
    return color(
        brightness * 1.0,  // More red
        brightness * 0.7,  // Less green
        brightness * 0.6   // Less blue
    );
}

function getCurrentHour() {
    const date = new Date();
    return date.getHours() + date.getMinutes() / 60;
}

function calculateBrightness(hour) {
    // Peak brightness at noon (12), darkest at midnight (0/24)
    const normalized = Math.abs(12 - hour) / 12;
    // Increase minimum brightness and adjust range for dragon theme
    return map(normalized, 0, 1, 255, 60);
}

function toggleDayNightMode() {
    isAutomatic = !isAutomatic;
    const button = document.getElementById('toggleDayNight');
    
    if (!isAutomatic) {
        manualTime = getCurrentHour();
        button.textContent = 'Switch to Automatic Mode';
        // Add manual time controls
        createManualControls();
    } else {
        button.textContent = 'Switch to Manual Mode';
        // Remove manual controls
        const controls = document.getElementById('manualControls');
        if (controls) controls.remove();
    }
    updateTimeDisplay();
}

function createManualControls() {
    let controls = document.getElementById('manualControls');
    if (!controls) {
        controls = document.createElement('div');
        controls.id = 'manualControls';
        controls.className = 'mt-2';
        controls.innerHTML = `
            <button onclick="adjustTime(-1)" class="btn btn-sm me-2">-1 Hour</button>
            <button onclick="adjustTime(1)" class="btn btn-sm">+1 Hour</button>
        `;
        document.getElementById('toggleDayNight').parentNode.appendChild(controls);
    }
}

function adjustTime(hours) {
    if (!isAutomatic) {
        manualTime = (manualTime + hours + 24) % 24;
        updateTimeDisplay();
    }
}

function updateTimeDisplay() {
    const hour = isAutomatic ? getCurrentHour() : manualTime;
    const timeElement = document.getElementById('timeDisplay');
    if (timeElement) {
        timeElement.textContent = 
            `${Math.floor(hour)}:${String(Math.floor((hour % 1) * 60)).padStart(2, '0')}`;
        timeElement.style.textShadow = `0 0 10px rgba(255, 100, 100, ${0.5 + Math.sin(Date.now() * 0.002) * 0.3})`;
    }
}

// Update time display regularly
setInterval(updateTimeDisplay, 1000);

// Add event listener for toggle button
document.getElementById('toggleDayNight').addEventListener('click', toggleDayNightMode);
