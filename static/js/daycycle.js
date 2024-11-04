let isAutomatic = true;
let manualTime = 12; // noon
const HOURS_PER_MINUTE = 24 / 1440; // 24 hours per real minute

function getDayNightColor() {
    const hour = isAutomatic ? getCurrentHour() : manualTime;
    const brightness = calculateBrightness(hour);
    return color(0, 0, brightness);
}

function getCurrentHour() {
    const date = new Date();
    return date.getHours() + date.getMinutes() / 60;
}

function calculateBrightness(hour) {
    // Peak brightness at noon (12), darkest at midnight (0/24)
    const normalized = Math.abs(12 - hour) / 12;
    return map(normalized, 0, 1, 255, 20);
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
