const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 15;
const cols = canvas.width / gridSize;  // 30
const rows = canvas.height / gridSize; // 30

const infoPlayerPos = document.getElementById("players-position");
const infoApplePos = document.getElementById("applePos");
const infoPlayerScore = document.getElementById("score");
const infoPlayerLenght = document.getElementById("lenght");
const infoGameOver = document.getElementById("gameStat");
const infoWhosPlaying = document.getElementById("player");
const infoTrainingThink = document.getElementById("training");

const clearLatestButton = document.getElementById("clear-latest");

let snake = [{ x: 15, y: 15 }];
let direction = { x: 0, y: 0};
let playerPos = { x: 15, y: 15 };
let applePos = { x: 0, y: 0 };

let playerScore = 0;
let snakeLength = 1;

let nextDirection = null;

let isAiPlaying = false;
let gameover = false;
let win = false;
let isTraining = false;

function auto_refresh() {
    if (!isAiPlaying) {return;} // avoid not wanted execution
    if (win || gameover) {
        location.reload(true);
    }
}

function send_response(response) {
    fetch('./ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to send");
        return res.json();
    })
    .then(response => {
        console.log("Backend accepted:", response);
     })
    .catch(err => {
        console.error("Backend error:", err);
    });
}

function sync_ai() {
  fetch('/ai-latest')
    .then(res => res.json())
    .then(data => {
      let latest = data.latest;
      
      if (!data || !data.latest) {
        console.log("Data or data.latest were not sent...");
        return;
      }

      let response = { message: "Error, no coordinates were sent", code: "2" };

      console.log("Data that were sent:", latest);

      if (latest.status != "run") {
        return;
      }

      // Check if latest is valid
      if (
        !latest ||
        typeof latest.direction_x !== 'number' ||
        typeof latest.direction_y !== 'number' 
      ) {
        send_response(response);
        return;
      }

      isAiPlaying = true;

      // Set direction
      direction.x = latest.direction_x;
      direction.y = latest.direction_y;

      let ainame = latest.name;
      training = latest.training;

      infoWhosPlaying.textContent = `Who is playing: AI - ${ainame}`;

      if (training == "yes") {
        isTraining = true;
      }

      if (
        applePos.x < 0 ||
        applePos.y < 0 ||
        playerPos.x < 0 ||
        playerPos.y < 0
      ) {
        return;
      }

      response = {
        apple: `${applePos.x}x${applePos.y}`,
        head: `${playerPos.x}x${playerPos.y}`,
        game_over: gameover,
        game_won: win
      };
      send_response(response);

      if (![ -1, 0, 1 ].includes(direction.x) || ![ -1, 0, 1 ].includes(direction.y)) return;
      nextDirection = { x: direction.x, y: direction.y };

      console.log("training: ", isTraining);

    })
    .catch(err => {
      console.error("Fetch error:", err);
      send_response({ message: "Fetch error", code: "3" });
    });
}


document.addEventListener("keydown", (e) => {
    if (gameover || isAiPlaying) {return;}

    if (e.key === "ArrowUp" && direction.y !== 1) direction = { x: 0, y: -1 };
    else if (e.key === "ArrowDown" && direction.y !== -1) direction = { x: 0, y: 1 };
    else if (e.key === "ArrowLeft" && direction.x !== 1) direction = { x: -1, y: 0 };
    else if (e.key === "ArrowRight" && direction.x !== -1) direction = { x: 1, y: 0 };
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawGrid() {
    ctx.strokeStyle = "#444";
    for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * gridSize, 0);
        ctx.lineTo(x * gridSize, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * gridSize);
        ctx.lineTo(canvas.width, y * gridSize);
        ctx.stroke();
    }
}

function drawPlayer(x, y) {
    ctx.fillStyle = "lime";
    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
}

function drawDebugFeatures() {
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, gridSize, gridSize);
    ctx.fillRect(canvas.height - gridSize, canvas.height - gridSize, gridSize, gridSize);
}

function drawApple(x, y) {
    ctx.fillStyle = "red";
    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
}

function otherDebugFeatures() {
    console.log("rows: ", rows);
    console.log("cols: ", cols);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updatePlayerInfo() {
    infoPlayerPos.textContent = `Players position: ${playerPos.x}x${playerPos.y}`;
    infoPlayerScore.textContent = `Players score: ${playerScore}`;
    infoPlayerLenght.textContent = `Players lenght: ${snakeLength}`;
    if (isAiPlaying){
        if (isTraining) {
            infoTrainingThink.textContent = `Training in progress...`;
        }
    } else {
        infoTrainingThink.textContent = ``;
    }
}

function updateApplePosInfo() {
    infoApplePos.textContent = `Apples position: ${applePos.x}x${applePos.y}`;
}

function apple() {
    drawApple(applePos.x, applePos.y);
}

function spawApple() {
    applePos.x = getRandomInt(0, cols - 1)
    applePos.y = getRandomInt(0, rows - 1);
}

function appleCollisionChecker() {
    if (playerPos.x == applePos.x && playerPos.y == applePos.y) {
        console.log("Player touched apple !");
        playerScore += 0.5;
        snakeLength += 1
        spawApple();
    } 
}

function won() {
    let max_length = 100; // just for now  
    if (snakeLength <= max_length) {
        return;
    }

    gameover = false;
    win = true;
    breakOut();

    infoGameOver.textContent = `You Won!`;
}

function clear_cache() {
    console.log("Clearing AI cache...");
    deleting_response = {
        del_latest: true
    }
    send_response(deleting_response)
}

function playerCollisionChecker() {
    for (let segment of snake) {
        if (
            segment.x == playerPos.x &&
            segment.y == playerPos.y &&
            snake[0] !== segment
        ) {
            console.log("Player collided with itself...");
            gameover = true;
            breakOut();
        }
    }
}

function player() {
    //playerPos.x += direction.x;
    //playerPos.y += direction.y;

    if (nextDirection) {
        direction = { ...nextDirection }; // Apply and clear
        nextDirection = null;
    }

    if (playerPos.x < 0) { playerPos.x -= 1; gameover = true; drawPlayer(playerPos.x, playerPos.y); breakOut(); }
    if (playerPos.x >= cols) { playerPos.x -= 1; gameover = true; drawPlayer(playerPos.x, playerPos.y); breakOut(); }
    if (playerPos.y < 0) { playerPos.y -= 1; gameover = true; drawPlayer(playerPos.x, playerPos.y); breakOut(); }
    if (playerPos.y >= rows) { playerPos.y -= 1; gameover = true; drawPlayer(playerPos.x, playerPos.y); breakOut(); }

    const newHead = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Add new head at front
    snake.unshift(newHead);

    // Remove last segment if too long
    if (snake.length > snakeLength) {
        snake.pop();
    }

    // Update head position
    playerPos.x = newHead.x;
    playerPos.y = newHead.y;
}

function gameLoop() {
    clearCanvas();
    drawGrid();
    apple();
    appleCollisionChecker();
    playerCollisionChecker();
    for (let segment of snake) {
        drawPlayer(segment.x, segment.y);
    }
    updatePlayerInfo();
    updateApplePosInfo();
}

otherDebugFeatures();
let playerinterval = setInterval(player, 200);
let maingameloop = setInterval(gameLoop, 1000 / 30); // 30 FPS
let winningtracker = setInterval(won, 100);
let aiHandler = setInterval(sync_ai, 200);

function breakOut() {
    if (gameover) { // just to be sure
        infoGameOver.textContent = `Game Over!`;
    }

    if (isTraining == true) {
        auto_refresh();
    }

    send_response({
        apple: `${applePos.x}x${applePos.y}`,
        head: `${playerPos.x}x${playerPos.y}`,
        game_over: gameover,
        game_won: win
    });

    win = false;

    clearInterval(maingameloop); // most important !!!
    clearInterval(playerinterval);
    clearInterval(winningtracker);
    clearInterval(aiHandler);
}