var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');
var balls = [];


document.getElementById('audioPlayer').play();



var circle = {
    centerX: window.innerWidth / 2,
    centerY: window.innerHeight / 2,
    radius: 280, // Doubled the size
    lineWidth: 5
};

var colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink'];

var colorCounts = colors.reduce((acc, color) => {
    acc[color] = { count: 0, timer: null }; // Include timer for each color
    return acc;
}, {});

function generateRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

function spawnBall(color) {
    // Determine the radius for the spawn area (1/3 of the outer circle's radius)
    var spawnRadius = circle.radius / 5;

    if(!color){
         color = generateRandomColor();
    }

    // Generate a random angle in radians
    var angle = Math.random() * Math.PI * 2;
    // Generate a random radius within the spawn circle
    var randomRadius = Math.random() * spawnRadius;
    // Calculate the spawn position
    var x = circle.centerX + randomRadius * Math.cos(angle);
    var y = (circle.centerY-(circle.radius/2)) + randomRadius * Math.sin(angle);
    return {
        x: x,
        y: y,
        radius: 10, // Halved the size
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        gravity: 0.3,
        damping: 1.0001,
        color: color,
        generation: 0,
        markedForRemoval: false,
    };

    
}
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    circle.centerX = canvas.width / 2;
    circle.centerY = canvas.height / 2;
    if (balls.length === 0) {

        colors.forEach(color => {
            balls.push(spawnBall(color));
        });

    }
    draw();
}

function grow(ball) {
    if (ball.radius < 30) {
        ball.radius += 0.1;
    } else {
        // Instead of growing, explode into new balls
        ball.generation++;
        let newBalls = explode(ball);
        // Flag this ball for removal and add new balls
        ball.markedForRemoval = true;
        balls.push(...newBalls);
        console.log(ball.color + "gen " + ball.generation + " exploded!");
    }
}

function shrink(ball){
    if(ball.radius >=3){
        ball.radius -= 0.1;
        return false;
    }else{
        colorCounts[ball.color].count--; // Decrement the color count
        if(colorCounts[ball.color].count == 0){
            colorCounts[ball.color].timer = 180000;
        }
        return true;
    }
    
}

function explode(ball) {
    const newBalls = [];
    const numberOfBalls = 5;
    const angleIncrement = (Math.PI * 2) / numberOfBalls; // Divide circle into 5 parts
    
    for (let i = 0; i < numberOfBalls; i++) {
        let angle = angleIncrement * i; // Angle for this ball
        let x = ball.x + Math.cos(angle) * ball.radius; // Position on the edge of the original ball
        let y = ball.y + Math.sin(angle) * ball.radius;
    
        // Calculate velocity to make the ball explode away from the center
        let speed = (Math.random() - 0.5) * 100; // Speed magnitude
        let vx = Math.cos(angle) * speed; // Velocity component in x direction
        let vy = Math.sin(angle) * speed; // Velocity component in y direction
        let color = ball.generation < 3 ? ball.color : generateRandomColor();
        let generation = ball.generation < 3 ? ball.generation : 0 

        let newBall = {
            x: x,
            y: y,
            radius: 5, // Size of new balls
            vx: vx,
            vy: vy,
            gravity: ball.gravity,
            damping: ball.damping,
            color: color,
            generation: generation
        };
        newBalls.push(newBall);
    }


    return newBalls;
}

// Function to update the color count display with specifications
function updateColorCountDisplay() {
    var lineHeight = 40;
    var startingY = 40;
    var textX = 10;
    
    ctx.font = '32px Arial';
    ctx.textAlign = 'left';
    
    colors.forEach((color, index) => {
        var textY = startingY + (lineHeight * index);
        ctx.fillStyle = color;
        var displayText = colorCounts[color].count > 0 ? colorCounts[color].count : formatTimer(colorCounts[color].timer);
        ctx.fillText(`${color}: ${displayText}`, textX, textY);
    });
}

function formatTimer(milliseconds) {
    if (milliseconds === null) return 'Starting...';
    let seconds = Math.ceil(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimersAndSpawnBalls() {
    updateColorCounts();
    const timerDecrement = 1000 / 60; // Approximately 1 second divided by 60 frames
    Object.keys(colorCounts).forEach(color => {
        if (colorCounts[color].timer !== null) {
            colorCounts[color].timer -= timerDecrement;
            if (colorCounts[color].timer <= 0) {
                colorCounts[color].timer = null; // Reset timer
                balls.push(spawnBall(color)); // Spawn new ball in the middle
            }
        }
    });
}

function updateColorCounts() {
    // Reset the count for each color to 0 before recounting
    Object.keys(colorCounts).forEach(color => {
        colorCounts[color].count = 0;
    });

    // Iterate over each ball to update the count of its color
    balls.forEach(ball => {
        if (!ball.markedForRemoval) {
            if (colorCounts[ball.color]) {
                colorCounts[ball.color].count += 1;
            } else {
                // In case a new color is somehow introduced
                colorCounts[ball.color] = { count: 1, timer: null };
            }
        }
    });

}

function checkBallCollisions(){
        // Collision between balls
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                let dx = balls[j].x - balls[i].x;
                let dy = balls[j].y - balls[i].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < balls[i].radius + balls[j].radius) {
                    //ballHitsBallSound.play();
                    // Calculate vector from i to j
                    let nx = dx / distance;
                    let ny = dy / distance;
        
                    // Calculate the projection of the velocities in these new coordinates
                    let vi = balls[i].vx * nx + balls[i].vy * ny;
                    let vj = balls[j].vx * nx + balls[j].vy * ny;
        
                    // Swap the components of the velocity along the line connecting the centers
                    let temp = vi;
                    vi = vj;
                    vj = temp;
        
                    // Update velocities
                    balls[i].vx += (vi - (balls[i].vx * nx + balls[i].vy * ny)) * nx;
                    balls[i].vy += (vi - (balls[i].vx * nx + balls[i].vy * ny)) * ny;
                    balls[j].vx += (vj - (balls[j].vx * nx + balls[j].vy * ny)) * nx;
                    balls[j].vy += (vj - (balls[j].vx * nx + balls[j].vy * ny)) * ny;
        
                    // Adjust positions to prevent balls from sticking together
                    let overlapAmount = (balls[i].radius + balls[j].radius - distance) + 0.01; // 0.01 is a small buffer to ensure separation
                    balls[i].x -= overlapAmount * nx * 0.5;
                    balls[i].y -= overlapAmount * ny * 0.5;
                    balls[j].x += overlapAmount * nx * 0.5;
                    balls[j].y += overlapAmount * ny * 0.5;

                    if (shrink(balls[j])) {
                        balls[j].markedForRemoval = true;
                    }
                    if (shrink(balls[i])) {
                        balls[i].markedForRemoval = true;
                    }
                    
                }
            }
        }
}



function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer circle
    ctx.beginPath();
    ctx.arc(circle.centerX, circle.centerY, circle.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = circle.lineWidth;
    ctx.stroke();

    balls.forEach(function(ball, index) {
        // Ball physics
        ball.vy += ball.gravity;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Collision detection with circle boundary
        let dx = ball.x - circle.centerX;
        let dy = ball.y - circle.centerY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let effectiveRadius = circle.radius - circle.lineWidth / 2 - ball.radius;
        if (distance > effectiveRadius) {
            //ballHitsWallSound.play();
            // Spawn new ball with a random color on each collision
            grow(ball);
            
            // Reflect ball
            let normalX = dx / distance;
            let normalY = dy / distance;
            let dot = ball.vx * normalX + ball.vy * normalY;
            ball.vx -= 2 * dot * normalX;
            ball.vy -= 2 * dot * normalY;
            ball.vx *= ball.damping;
            ball.vy *= ball.damping;
            ball.x = circle.centerX + normalX * effectiveRadius;
            ball.y = circle.centerY + normalY * effectiveRadius;
        }

        // Draw ball
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
    });


    balls = balls.filter(ball => !ball.markedForRemoval);
    checkBallCollisions();
    updateTimersAndSpawnBalls();
    updateColorCountDisplay();
    requestAnimationFrame(draw);
}

window.addEventListener('resize', resizeCanvas, false);
resizeCanvas();