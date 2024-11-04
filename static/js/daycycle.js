let isAutomatic = true;
let manualTime = 12; // noon
const HOURS_PER_MINUTE = 24 / 1440; // 24 hours per real minute

function getDayNightColor() {
    const hour = isAutomatic ? getCurrentHour() : manualTime;
    const brightness = calculateBrightness(hour);
    // Return a slightly blue-tinted color for better visibility
    return color(brightness * 0.7, brightness * 0.8, brightness);
}

function getCurrentHour() {
    const date = new Date();
    return date.getHours() + date.getMinutes() / 60;
}

function calculateBrightness(hour) {
    // Peak brightness at noon (12), darkest at midnight (0/24)
    const normalized = Math.abs(12 - hour) / 12;
    // Increase minimum brightness from 20 to 40 for better visibility
    return map(normalized, 0, 1, 255, 40);
}

function toggleDayNightMode() {
    isAutomatic = !isAutomatic;
    if (!isAutomatic) {
        manualTime = getCurrentHour();
    }
}

// Update time display
setInterval(() => {
    const hour = isAutomatic ? getCurrentHour() : manualTime;
    document.getElementById('timeDisplay').textContent = 
        `${Math.floor(hour)}:${String(Math.floor((hour % 1) * 60)).padStart(2, '0')}`;
}, 1000);

document.getElementById('toggleDayNight').addEventListener('click', toggleDayNightMode);
