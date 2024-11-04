let dragonSilhouettes = [];
const numSilhouettes = 3;

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
}

function drawBackgroundEffects() {
    // Draw dragon silhouettes
    push();
    noStroke();
    
    dragonSilhouettes.forEach(dragon => {
        push();
        translate(dragon.x, dragon.y);
        rotate(dragon.angle + frameCount * 0.001);
        
        // Draw dragon silhouette
        fill(255, 100, 0, dragon.opacity);
        beginShape();
        // Simplified dragon shape
        vertex(0, -dragon.size/2);
        vertex(dragon.size/4, -dragon.size/4);
        vertex(dragon.size/2, 0);
        vertex(dragon.size/4, dragon.size/4);
        vertex(0, dragon.size/2);
        vertex(-dragon.size/4, dragon.size/4);
        vertex(-dragon.size/2, 0);
        vertex(-dragon.size/4, -dragon.size/4);
        endShape(CLOSE);
        
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
        
        fill(p.color);
        circle(p.x, p.y, p.size);
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    pop();
}
