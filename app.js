//basic owot settings
w.broadcastReceive(true);
w.disableCursor();
//init global vars
var app = {
  c: "chat",
  t: "/test",
  cmd: "cmd",
  id: w.clientId,
  title: "spacefighters",
  b: []
};

var started = false;
var localDraw = [];
var historyDraw = [];
var isCtrlPressed = false;
var drawBuffer = [];
//init base  functions
function run(a, b) {
  w.on(a, b);
}

function cancel(a, b) {
  w.off(a, b);
}

function send(a) {
  network.chat(a);
}

function isValidJSON(str) {
  try {
    JSON.parse(str);
    return JSON.parse(str);
  } catch (error) {
    return false;
  }
}

function convertToNestedArray(string) {
  if (typeof string == "string") {
    var hexArray = string.split(',');
    var nestedArray = hexArray.map((hex) => parseInt(hex, 16));
    return nestedArray;
  }
  return string
}

function convertToHexString(array) {
  return array.map((element) => element.toString(16)).join(',');
}

function addToShiftArray(array, element, n) {
  array.push(element); // Add the new element to the array

  if (array.length > n) {
    array.shift(); // Remove the first element from the array
  }

  return array;
}

function getLastEntries(array, max) {
  var startIndex = Math.max(array.length - max, 0);
  return array.slice(startIndex);
}

function getFirstNEntries(array, n) {
  return array.slice(0, n);
}

function CellToPixelCoords(tileX, tileY, charX, charY) {
  if (Array.isArray(tileX)) {
    // If the first argument is an array, destructure the values
    [tileX, tileY, charX, charY] = tileX;
  }
  tileX /= 2;
  tileY /= 2;
  // calculate in-tile cell position
  var charXInTile = tileX * tileC + charX;
  var charYInTile = tileY * tileR + charY;

  // calculate global cell position
  var charXGlobal = Math.floor(tileX * tileC * cellW + charXInTile * cellW + positionX + Math.trunc(owotWidth / 2));
  var charYGlobal = Math.floor(tileY * tileR * cellH + charYInTile * cellH + positionY + Math.trunc(owotHeight / 2));

  return [charXGlobal, charYGlobal];
}

function sendmessage(namespace = "", obj = {
  data: null
}) {
  obj.namespace = namespace;
  const o = JSON.stringify(obj);
  network.cmd(o, true);
}

run(app.cmd, function(e) {
  const sender = e.sender;
  const d = isValidJSON(e.data);
  if (d) {

    if (d.namespace == app.title) {

      onMessageReceived(d)
    }

  }
})
// Setup main appliction functions
function onMessageReceived(e) {
  if (e.namespace == app.title) {
    // Dumb update of bullets
    if (e.bullets) {
      for (let i = 0; i < e.bullets.length; i++) {
        const bullet = e.bullets[i];
        playerBullets.push([bullet]);
      }
    }

    if (playerShips.hasOwnProperty(e.id)) {
      // Clear the existing timeout for playerShips[e.id] if it exists
      clearTimeout(playerShips[e.id].timeout);
      const ship = playerShips[e.id];
      if (
        ship.location === e.location &&
        ship.health === e.health &&
        ship.angle === e.angle &&
        ship.color === e.color
      ) {
        // All values are the same, no need to update
        return;
      }
    }

    // Set new values for the player ship
    playerShips[e.id] = {
      location: e.location,
      health: e.health,
      angle: e.angle,
      color: e.color,
    };

    // Set a timer to remove the player ship after 1 second
    playerShips[e.id].timeout = setTimeout(() => {
      delete playerShips[e.id];
    }, 1000);
  }
}



send(app.t)

run(app.c, function(e) {
  var regex = /^T\w+(?: \w+){6}\.$/;
  if (regex.test(e.message)) {
    var capturedMessage = e.message;
    elm.page_chatfield.lastChild.remove();
    app.id = getBestID(e);
    player.name = app.id;
    if (!started) {
      gameLoop();
    }
  }
})
// Setup Application UI
// Clone the canvas node
var SFCanvas = owot.cloneNode(true);

// Set styles for paint_canvas
SFCanvas.id = "paint_canvas"; // Set an ID for the cloned canvas
SFCanvas.style.position = "absolute"; // Example: set position to absolute
SFCanvas.style.left = owot.offsetLeft + "px"; // Example: match left position
SFCanvas.style.top = owot.offsetTop + "px"; // Example: match top position
SFCanvas.style.zIndex = parseInt(owot.style.zIndex) + 1; // Example: higher z-index
SFCanvas.style.cursor = "crosshair";
// Disable pointer events for paint_canvas

// Append paint_canvas to the parent of owot
owot.parentNode.appendChild(SFCanvas);

// Get the canvas element
var canvas = SFCanvas;
var context = canvas.getContext("2d");

// Player object
const player = {
  name: app.id,
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  angle: 0,
  rotationSpeed: 0.1,
  acceleration: 0.2,
  maxSpeed: 3,
  velocity: {
    x: 0,
    y: 0
  },
  health: 100
};

// Bullets array
const bullets = [];
const playerBullets = [];
const playerShips = {};
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
      x: player.x + Math.cos(player.angle) * (player.radius + cellW * 5),
      y: player.y + Math.sin(player.angle) * (player.radius + cellH * 2),
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

    // Limit maximum speed
    const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
    if (speed > player.maxSpeed) {
      const ratio = player.maxSpeed / speed;
      player.velocity.x *= ratio;
      player.velocity.y *= ratio;
    }
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
  player.x = Lerp(player.x, canvas.width / 2, 0.02)
  player.y = Lerp(player.y, canvas.height / 2, 0.02)
  //player.y = Math.round(Math.max(Math.min(player.y, canvas.height/2 + canvas.height/2), canvas.height/2 - canvas.height/2));
  //player.x = Math.round(Math.max(Math.min(player.x, canvas.width/2 + canvas.width/2), canvas.width/2 - canvas.width/2));
  centerPlayer(getTileCoordsFromMouseCoords(player.x, player.y), [0, 0], 0.05);



}

// Function to draw the health bar
function drawHealthBar(x, y, id, h) {
  const barWidth = 50;
  const barHeight = 5;
  const xPos = x - barWidth / 2;
  const yPos = y - player.radius - 20;

  context.fillStyle = "red";
  context.fillRect(xPos, yPos, barWidth, barHeight);

  context.fillStyle = "green";
  const healthWidth = (h / 100) * barWidth;
  context.fillRect(xPos, yPos, healthWidth, barHeight);

  // Draw player's name
  context.fillStyle = "#303030";
  context.font = "16px Arial";
  context.fillText(id, x - context.measureText(id).width / 2, yPos - 5);

}

// Function to check if bullet hits player
function checkBulletCollision() {

  for (let i = 0; i < playerBullets.length; i++) {

    const bullet = playerBullets[i];

    const [x, y] = CellToPixelCoords(bullet[0]);

    const dx = x - player.x;
    const dy = y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 10) {
      // Bullet hit player
      playerBullets.splice(i, 1);
      i--;

      // Reduce player health
      player.health -= 10;
      if (player.health < 0) {
        player.health = 0;
        document.location.reload()
      }
    }
    context.fillStyle = "red";
    context.fillRect(x, y, 5, 5);
  }
  playerBullets.length = 0;
}

// Game loop
function gameLoop() {
  started = true;
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
  }
  for (const id in playerShips) {
    const {
      location,
      health,
      angle,
      color
    } = playerShips[id];
    const [x, y] = CellToPixelCoords(location);
    // Draw the player ship
    if (x < 0 ||
      x > canvas.width ||
      y < 0 ||
      y > canvas.height) {
    const dx = x - player.x;
    const dy = y - player.y;

const distance = Math.sqrt(dx * dx + dy * dy)*0.001;
const indicatorR = 11 - (Math.max(Math.min(distance, 10), 1));
const indicatorX = Math.max(Math.min(x, canvas.width-indicatorR), indicatorR);
const indicatorY = Math.max(Math.min(y, canvas.height-indicatorR), indicatorR);
context.fillStyle = color;
context.beginPath();
context.arc(indicatorX, indicatorY, indicatorR, 0, 2 * Math.PI);
context.stroke();
context.fill();

} else {

      context.strokeStyle = "#303030";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(
        x + Math.cos(angle + (3 / 4) * Math.PI) * player.radius,
        y + Math.sin(angle + (3 / 4) * Math.PI) * player.radius
      );
      context.lineTo(
        x + Math.cos(angle + Math.PI) * player.radius / player.radius,
        y + Math.sin(angle + Math.PI) * player.radius / player.radius
      );
      context.lineTo(
        x + Math.cos(angle + (5 / 4) * Math.PI) * player.radius,
        y + Math.sin(angle + (5 / 4) * Math.PI) * player.radius
      );

      context.closePath();
      context.fillStyle = color;
      context.fill();
      context.stroke();
      drawHealthBar(x, y, id, health);
    }
    // Request the next frame	
  }

  // Check bullet-player collision	
  checkBulletCollision();
  // Draw the health bar	

  app.b = [];
  for (let i = 0; i < bullets.length; i++) {
    const bullet = bullets[i];
    app.b.push(getTileCoordsFromMouseCoords(bullet.x, bullet.y))
  }


  const d = {

    id: app.id,
    location: getTileCoordsFromMouseCoords(player.x, player.y),
    angle: player.angle,
    health: player.health,
    bullets: app.b,
    color: int_to_hexcode(YourWorld.Color)
  }

  sendmessage(app.title, d);
  requestAnimationFrame(gameLoop);
}





w.on("resize", function() {
  SFCanvas.remove();
  SFCanvas = owot.cloneNode(true);

  // Set styles for paint_canvas
  SFCanvas.id = "paint_canvas"; // Set an ID for the cloned canvas
  SFCanvas.style.position = "absolute"; // Example: set position to absolute
  SFCanvas.style.left = owot.offsetLeft + "px"; // Example: match left position
  SFCanvas.style.top = owot.offsetTop + "px"; // Example: match top position
  SFCanvas.style.zIndex = parseInt(owot.style.zIndex) + 1; // Example: higher z-index
  SFCanvas.style.cursor = "crosshair";
  // Disable pointer events for paint_canvas

  // Append paint_canvas to the parent of owot
  owot.parentNode.appendChild(SFCanvas);
  canvas = SFCanvas;
  context = canvas.getContext("2d");
});

const Lerp = (start = 0, end = 0, amt = 0.5, roundResult = false) => {
  let value = (1 - amt) * start + amt * end;
  if (roundResult) {
    value = Math.round(value);
  }
  return value;
}
const SubtractArrays = (arr1, arr2, roundResult = false) => {
  const resultArray = arr1.map((value, index) => {
    let result = value - arr2[index];
    if (roundResult) {
      result = Math.round(result);
    }
    return result;
  });
  return resultArray;
}

const AddArrays = (arr1, arr2, roundResult = false) => {
  // Create a new array to store the results
  const resultArray = [];

  // Loop through the arrays and add the elements at the same index
  for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
    let value = (arr1[i] + arr2[i]);

    if (roundResult) {
      value = Math.round(value);
    }
    resultArray.push(value);
  }

  return resultArray;
}

const LerpArray = (startArray, endArray = startArray.map(() => 0), amt = 0.5, roundResult = false) => {
  let resultArray = startArray.map((value, i) => Lerp(value, endArray[i], amt, roundResult));
  return resultArray;
}

const centerPlayer = (coords, offset = [0, 0], lerpSpeed = 0.01, ...rest) => {
  let x = 0,
    y = 0;
  // If input is an array
  if (Array.isArray(offset) && offset.length < 3) {
    [x = 0, y = 0] = offset;
  }
  // If input is two separate arguments
  else if (rest.length < 2) {
    [x = 0, y = 0] = rest;
  }

  // Invalid input
  else {
    console.error(`centerPlayer: Invalid offset. Arguments can either be [x, y] or x, y. Your offset was: ${offset}`);
    return;
  }
  return ScrollWorld(LerpArray([0, 0], SubtractArrays(CellToPixelCoords(coords), [(owotWidth / 2) + x, (owotHeight / 2) + y]), lerpSpeed));
};

const ScrollWorld = (offset = [0, 0], ...rest) => {
  let x = 0,
    y = 0;

  // If input is an array
  if (Array.isArray(offset) && offset.length < 3) {
    [x = 0, y = 0] = offset;
  }
  // If input is two separate arguments
  else if (rest.length < 2) {
    [x = 0, y = 0] = rest;
  }
  // Invalid input
  else {
    console.error(`ScrollWorld: Invalid offset. Arguments can either be [x, y] or x, y. Your offset was: ${offset}`);
    return;
  }

  const deltaX = Math.trunc(x);
  const deltaY = Math.trunc(y);

  positionY -= deltaY;
  positionX -= deltaX;

  w.emit("scroll", {
    deltaX: -deltaX,
    deltaY: -deltaY
  });
  w.render();
  return [deltaY, deltaX];

};

function getBestID(e) {
  var a;
  if (e.username) {
    a = e.username;
  } else if (e.realUsername) {
    a = e.realUsername;
  } else {
    a = e.id;
  }
  return a;
}
state.background = {
  path: "https://ik.imagekit.io/poopman/Spacefighters2/city_1__HNFrIZH2S.png?updatedAt=1689084313790"
};
loadBackgroundData(() => {
  w.redraw();
}, () => {
  w.redraw();
});
