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
    if (!isAutomatic) {
        manualTime = getCurrentHour();
    }
}

// Update time display with dragon theme styling
setInterval(() => {
    const hour = isAutomatic ? getCurrentHour() : manualTime;
    const timeElement = document.getElementById('timeDisplay');
    if (timeElement) {
        timeElement.textContent = 
            `${Math.floor(hour)}:${String(Math.floor((hour % 1) * 60)).padStart(2, '0')}`;
        timeElement.style.textShadow = `0 0 10px rgba(255, 100, 100, ${0.5 + Math.sin(Date.now() * 0.002) * 0.3})`;
    }
}, 1000);

// Add event listener for toggle button
document.getElementById('toggleDayNight').addEventListener('click', toggleDayNightMode);
