w.disableCursor();
       // Get the canvas element
       const canvas = owot;
       const context = canvas.getContext("2d");

       // Player object
       const player = {
         name: "Player1",
         x: canvas.width / 2,
         y: canvas.height / 2,
         radius: 20,
         angle: 0,
         rotationSpeed: 0.1,
         acceleration: 0.2,
         velocity: {
           x: 0,
           y: 0
         },
         health: 100
       };

       // Bullets array
       const bullets = [];

       // Keyboard state
       const keys = {};

       // Event listeners for keydown and keyup events
       document.addEventListener("keydown", keyDownHandler);
       document.addEventListener("keyup", keyUpHandler);

       // Keydown event handler
       function keyDownHandler(event) {
         keys[event.keyCode] = true;
         if (event.keyCode === 32) {
           // Spacebar to shoot
           bullets.push({
             x: player.x + Math.cos(player.angle) * player.radius,
             y: player.y + Math.sin(player.angle) * player.radius,
             velocity: {
               x: Math.cos(player.angle) * 5,
               y: Math.sin(player.angle) * 5
             }
           });
         }
       }

       // Keyup event handler
       function keyUpHandler(event) {
         delete keys[event.keyCode];
       }

       // Update player movement based on keyboard input
       function updatePlayer() {
         if (keys[65]) {
           // Rotate left (A key)
           player.angle -= player.rotationSpeed;
         }
         if (keys[68]) {
           // Rotate right (D key)
           player.angle += player.rotationSpeed;
         }
         if (keys[87]) {
           // Thrust forward (W key)
           player.velocity.x += Math.cos(player.angle) * player.acceleration;
           player.velocity.y += Math.sin(player.angle) * player.acceleration;
         }
         if (keys[83]) {
           // Thrust backward (S key)
           player.velocity.x -= Math.cos(player.angle) * player.acceleration;
           player.velocity.y -= Math.sin(player.angle) * player.acceleration;
         }

         // Update player position based on velocity
         player.x += player.velocity.x;
         player.y += player.velocity.y;

         // Apply friction to slow down player
         player.velocity.x *= 0.99;
         player.velocity.y *= 0.99;

         // Wrap player around the screen
         if (player.x < 0) {
           player.x = canvas.width;
         } else if (player.x > canvas.width) {
           player.x = 0;
         }
         if (player.y < 0) {
           player.y = canvas.height;
         } else if (player.y > canvas.height) {
           player.y = 0;
         }
       }

       // Function to draw the health bar
       function drawHealthBar() {
         const barWidth = 50;
         const barHeight = 5;
         const xPos = player.x - barWidth / 2;
         const yPos = player.y - player.radius - 20;

         context.fillStyle = "red";
         context.fillRect(xPos, yPos, barWidth, barHeight);

         context.fillStyle = "green";
         const healthWidth = (player.health / 100) * barWidth;
         context.fillRect(xPos, yPos, healthWidth, barHeight);

         // Draw player's name
         context.fillStyle = "white";
         context.font = "16px Arial";
         context.fillText(player.name, player.x - context.measureText(player.name).width / 2, yPos - 5);
       }

       // Function to check if bullet hits player
       function checkBulletCollision() {
         for (let i = 0; i < bullets.length; i++) {
           const bullet = bullets[i];
           const dx = bullet.x - player.x;
           const dy = bullet.y - player.y;
           const distance = Math.sqrt(dx * dx + dy * dy);

           if (distance < 10) {
             // Bullet hit player
             bullets.splice(i, 1);
             i--;

             // Reduce player health
             player.health -= 10;
             if (player.health < 0) {
               player.health = 0;
             }
           }
         }
       }

       // Game loop
       function gameLoop() {
         // Clear the canvas
         context.clearRect(0, 0, canvas.width, canvas.height);

         // Update player movement
         updatePlayer();

         // Update and draw bullets
         for (let i = 0; i < bullets.length; i++) {
           const bullet = bullets[i];
           bullet.x += bullet.velocity.x;
           bullet.y += bullet.velocity.y;

           // Remove bullets that are off-screen
           if (
             bullet.x < 0 ||
             bullet.x > canvas.width ||
             bullet.y < 0 ||
             bullet.y > canvas.height
           ) {
             bullets.splice(i, 1);
             i--;
           }

           // Draw bullets
           context.fillStyle = "yellow";
           context.fillRect(bullet.x, bullet.y, 5, 5);
         }
         // Draw the player ship
         context.strokeStyle = "white";
         context.lineWidth = 2;
         context.beginPath();
         context.moveTo(
           player.x + Math.cos(player.angle + (3 / 4) * Math.PI) * player.radius,
           player.y + Math.sin(player.angle + (3 / 4) * Math.PI) * player.radius
         );
         context.lineTo(
           player.x + Math.cos(player.angle + Math.PI) * player.radius / player.radius,
           player.y + Math.sin(player.angle + Math.PI) * player.radius / player.radius
         );
         context.lineTo(
           player.x + Math.cos(player.angle + (5 / 4) * Math.PI) * player.radius,
           player.y + Math.sin(player.angle + (5 / 4) * Math.PI) * player.radius
         );
         context.closePath();
         context.stroke();
         // Check bullet-player collision	
         checkBulletCollision();
         // Draw the health bar	
         drawHealthBar();
         // Request the next frame	
         requestAnimationFrame(gameLoop);
       }
       // Start the game loop	
       gameLoop();
