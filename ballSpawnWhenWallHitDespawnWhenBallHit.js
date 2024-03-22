var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');
var isPaused = false; // This flag controls the pause state

// Find buttons by ID
var pauseBtn = document.getElementById('pauseBtn');
var restartBtn = document.getElementById('restartBtn');

// Pause Button Event Listener
pauseBtn.addEventListener('click', function() {
    isPaused = !isPaused; // Toggle pause state
    if (!isPaused) {
        // If we're unpausing, start the animation again
        requestAnimationFrame(draw);
    }
    // Update button text based on the state
    pauseBtn.textContent = isPaused ? "Resume" : "Pause";
});

// Restart Button Event Listener
restartBtn.addEventListener('click', function() {
    // Reset or reinitialize your balls array or any other state as needed
    balls = []; // Example: Clearing the balls array
    isPaused = false; // Ensure animation isn't paused
    // Optionally, reinitialize the canvas or game state here as needed
    resizeCanvas(); // This will redraw the canvas and restart the animation
});




var balls = [];
var ballHitsWallSound = new Audio('ballHitsWall.wav');
var ballHitsBallSound = new Audio('ballHitsBall.wav');



var circle = {
    centerX: window.innerWidth / 2,
    centerY: window.innerHeight / 2,
    radius: 280, // Doubled the size
    lineWidth: 5
};

function generateRandomColor() {
    var colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function spawnBall(color) {
    // Determine the radius for the spawn area (1/3 of the outer circle's radius)
    var spawnRadius = circle.radius / 5;
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
        radius: 5, // Halved the size
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        gravity: 0.3,
        damping: 0.8,
        color: color || generateRandomColor()
    };
}
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    circle.centerX = canvas.width / 2;
    circle.centerY = canvas.height / 2;
    if (balls.length === 0) {
        balls.push(spawnBall('blue')); // Initial ball is blue
    }
    draw();
}

function draw() {
    if (isPaused) return; // Stop the function if paused

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
            balls.push(spawnBall());
            
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

    // Collision between balls
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            let dx = balls[j].x - balls[i].x;
            let dy = balls[j].y - balls[i].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < balls[i].radius + balls[j].radius) {
                // Remove balls on collision
                balls.splice(j, 1);
                balls.splice(i, 1);
                //ballHitsBallSound.play();
                break; // Exit the inner loop after handling collision to avoid indexing errors
            }
        }
    }

    requestAnimationFrame(draw);
}

window.addEventListener('resize', resizeCanvas, false);
resizeCanvas();