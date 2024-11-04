let dragonSilhouettes = [];
let dragonConstellations = [];
let particles = [];
const numSilhouettes = 3;
const numConstellations = 5;

function initBackgroundEffects() {
    // Initialize dragon silhouettes
    for (let i = 0; i < numSilhouettes; i++) {
        dragonSilhouettes.push({
            x: random(width),
            y: random(height),
            size: random(100, 200),
            speed: random(0.5, 1.5),
            opacity: random(10, 30),
            angle: random(TWO_PI)
        });
    }
    
    // Initialize dragon constellations
    for (let i = 0; i < numConstellations; i++) {
        const points = [];
        const numPoints = floor(random(5, 8));
        const centerX = random(width);
        const centerY = random(height);
        
        for (let j = 0; j < numPoints; j++) {
            points.push({
                x: centerX + random(-50, 50),
                y: centerY + random(-50, 50),
                brightness: random(100, 255)
            });
        }
        
        dragonConstellations.push({
            points,
            opacity: random(100, 200)
        });
    }
}

function drawBackgroundEffects() {
    // Draw constellations
    push();
    stroke(255, 150, 0, 100);
    strokeWeight(1);
    
    dragonConstellations.forEach(constellation => {
        // Draw constellation lines
        beginShape();
        constellation.points.forEach(point => {
            const brightness = (sin(frameCount * 0.02) * 50 + point.brightness);
            stroke(255, 150, 0, brightness);
            vertex(point.x, point.y);
        });
        endShape(CLOSE);
        
        // Draw constellation points
        constellation.points.forEach(point => {
            const brightness = (sin(frameCount * 0.02) * 50 + point.brightness);
            fill(255, 150, 0, brightness);
            noStroke();
            circle(point.x, point.y, 3); // Fixed: Added diameter parameter
        });
    });
    pop();

    // Draw dragon silhouettes
    push();
    noStroke();
    
    dragonSilhouettes.forEach(dragon => {
        push();
        translate(dragon.x, dragon.y);
        rotate(dragon.angle + frameCount * 0.001);
        
        // Draw dragon silhouette with glowing effect
        for (let i = 3; i >= 0; i--) {
            const opacity = dragon.opacity / (i + 1);
            const size = dragon.size + i * 10;
            fill(255, 100, 0, opacity);
            beginShape();
            vertex(0, -size/2);
            vertex(size/4, -size/4);
            vertex(size/2, 0);
            vertex(size/4, size/4);
            vertex(0, size/2);
            vertex(-size/4, size/4);
            vertex(-size/2, 0);
            vertex(-size/4, -size/4);
            endShape(CLOSE);
        }
        
        // Move silhouette
        dragon.x += dragon.speed;
        dragon.y += sin(frameCount * 0.02) * 0.5;
        
        // Wrap around screen
        if (dragon.x > width + dragon.size) {
            dragon.x = -dragon.size;
            dragon.y = random(height);
        }
        
        pop();
    });
    
    // Add ember particles
    if (frameCount % 10 === 0) {
        particles.push({
            x: random(width),
            y: height + 10,
            vx: random(-1, 1),
            vy: random(-2, -4),
            size: random(2, 5),
            life: 255,
            color: color(255, random(100, 200), 0, 200)
        });
    }
    
    // Update and draw ember particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.99; // Slow down vertical speed
        p.life -= 2;
        
        // Draw particle with glow effect
        push();
        noStroke();
        // Inner particle
        fill(p.color);
        circle(p.x, p.y, p.size);
        // Outer glow
        fill(red(p.color), green(p.color), blue(p.color), p.life * 0.3);
        circle(p.x, p.y, p.size * 2);
        pop();
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    pop();
}

// Dragon breath effect
function drawDragonBreath(x, y, direction) {
    push();
    translate(x, y);
    rotate(direction);
    
    for (let i = 0; i < 5; i++) {
        const opacity = map(i, 0, 5, 200, 0);
        const size = map(i, 0, 5, 10, 30);
        fill(255, 100, 0, opacity);
        noStroke();
        circle(i * 10, 0, size);
    }
    pop();
}
