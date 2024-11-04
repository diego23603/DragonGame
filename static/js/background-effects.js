let dragonSilhouettes = [];
let castleImage;
let particles = [];
let windParticles = [];
let torchParticles = [];
const numSilhouettes = 3;

function initBackgroundEffects() {
    // Load castle image
    loadImage('/static/images/dragons/castle.svg', img => {
        castleImage = img;
    });

    // Initialize dragon silhouettes
    for (let i = 0; i < numSilhouettes; i++) {
        dragonSilhouettes.push({
            x: random(width),
            y: random(height),
            size: random(100, 200),
            speed: random(0.5, 1.5),
            opacity: random(10, 30),
            angle: random(TWO_PI),
            wingPhase: random(TWO_PI),
            breathPhase: random(TWO_PI),
            scaleShimmer: random(TWO_PI)
        });
    }

    // Initialize wind particles
    for (let i = 0; i < 50; i++) {
        windParticles.push({
            x: random(width),
            y: random(height),
            size: random(2, 5),
            speed: random(2, 4),
            angle: random(TWO_PI),
            type: random(['leaf', 'debris'])
        });
    }

    // Initialize torch particles
    const torchPositions = [
        { x: width * 0.3, y: height * 0.6 },
        { x: width * 0.7, y: height * 0.6 }
    ];

    torchPositions.forEach(pos => {
        for (let i = 0; i < 20; i++) {
            torchParticles.push({
                x: pos.x,
                y: pos.y,
                baseX: pos.x,
                baseY: pos.y,
                size: random(2, 4),
                life: 255,
                speed: random(1, 3),
                angle: random(-PI/4, PI/4)
            });
        }
    });
}

function drawBackgroundEffects() {
    // Draw castle
    if (castleImage) {
        push();
        tint(255, 150);
        image(castleImage, width/2 - 400, height/2 - 200, 800, 400);
        pop();
    }

    // Update and draw wind particles
    updateWindParticles();
    
    // Draw dragon silhouettes with enhanced effects
    drawEnhancedDragons();
    
    // Update and draw torch particles
    updateTorchParticles();
    
    // Add ember particles
    if (frameCount % 5 === 0) {
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
    updateEmberParticles();
}

function drawEnhancedDragons() {
    push();
    noStroke();
    
    dragonSilhouettes.forEach(dragon => {
        push();
        translate(dragon.x, dragon.y);
        rotate(dragon.angle + frameCount * 0.001);
        
        // Dragon body with scale shimmer effect
        let shimmerIntensity = sin(frameCount * 0.05 + dragon.scaleShimmer) * 20;
        fill(255, 100 + shimmerIntensity, 0, dragon.opacity);
        
        // Wing flutter animation
        let wingOffset = sin(frameCount * 0.1 + dragon.wingPhase) * 20;
        
        // Draw enhanced dragon shape with animated wings
        beginShape();
        vertex(0, -dragon.size/2);
        vertex(dragon.size/4 + wingOffset, -dragon.size/4);
        vertex(dragon.size/2, 0);
        vertex(dragon.size/4 + wingOffset, dragon.size/4);
        vertex(0, dragon.size/2);
        vertex(-dragon.size/4 - wingOffset, dragon.size/4);
        vertex(-dragon.size/2, 0);
        vertex(-dragon.size/4 - wingOffset, -dragon.size/4);
        endShape(CLOSE);
        
        // Glowing eyes
        let eyeGlow = sin(frameCount * 0.1) * 2 + 3;
        fill(255, 255, 0, dragon.opacity * 2);
        circle(-dragon.size/6, -dragon.size/4, eyeGlow);
        circle(dragon.size/6, -dragon.size/4, eyeGlow);
        
        // Dragon breath effect
        if (random() < 0.05) {
            let breathAngle = dragon.angle + PI;
            for (let i = 0; i < 5; i++) {
                particles.push({
                    x: dragon.x - cos(breathAngle) * dragon.size/2,
                    y: dragon.y - sin(breathAngle) * dragon.size/2,
                    vx: -cos(breathAngle + random(-0.2, 0.2)) * random(2, 4),
                    vy: -sin(breathAngle + random(-0.2, 0.2)) * random(2, 4),
                    life: 255,
                    color: color(255, random(100, 200), 0, 150)
                });
            }
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
    
    pop();
}

function updateWindParticles() {
    push();
    windParticles.forEach(p => {
        p.x += cos(p.angle) * p.speed;
        p.y += sin(p.angle) * p.speed;
        
        if (p.type === 'leaf') {
            fill(139, 69, 19, 150);
            rotate(frameCount * 0.01);
            ellipse(p.x, p.y, p.size, p.size * 2);
        } else {
            fill(160, 160, 160, 150);
            circle(p.x, p.y, p.size);
        }
        
        // Wrap around screen
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;
        if (p.y > height) p.y = 0;
        if (p.y < 0) p.y = height;
        
        // Gradually change direction
        p.angle += random(-0.1, 0.1);
    });
    pop();
}

function updateTorchParticles() {
    push();
    torchParticles.forEach(p => {
        // Update position
        p.y -= p.speed;
        p.x += sin(frameCount * 0.1) * 0.5;
        p.life -= 3;
        
        // Draw fire particle
        let flameColor = color(255, 150, 0, p.life);
        fill(flameColor);
        noStroke();
        circle(p.x, p.y, p.size);
        
        // Reset particle when it dies
        if (p.life <= 0) {
            p.x = p.baseX;
            p.y = p.baseY;
            p.life = 255;
        }
    });
    pop();
}

function updateEmberParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.99;
        p.life -= 2;
        
        fill(p.color);
        circle(p.x, p.y, p.size);
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}
