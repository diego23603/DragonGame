// Previous code remains the same until line 471
function brighten(colorStr) {
    let c = color(colorStr);
    let r = red(c);
    let g = green(c);
    let b = blue(c);
    
    return color(
        Math.min(255, r * 1.2),
        Math.min(255, g * 1.2),
        Math.min(255, b * 1.2)
    );
}

// Rest of the code remains the same
