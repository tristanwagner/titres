const benchmarkNode = document.createElement("p");
const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 800;

document.body.appendChild(canvas);
document.body.appendChild(benchmarkNode);

const ctx = canvas.getContext("2d");

const colors = {
    WHITE: 1,
    RED: 2,
};

let gameExit = false;
let gameOver = false;
let score = 0;
let gameFrame = 0;

let keyboard = {
    key: false,
    code: false,
    pressing: false,
};

let canvasPosition = canvas.getBoundingClientRect();

window.addEventListener('resize', () => {
  canvasPosition = canvas.getBoundingClientRect();
})

window.addEventListener('keydown', (event) => {
    keyboard = {
        key: event.key,
        code: event.code,
        pressing: true,
    };
    console.log(keyboard)
})

window.addEventListener('keyup', () => {
    keyboard.pressing = false;
})


// matrice that represent the game board
// 0 there is nothing to show
// != 0 we expect a string with a color
function initGrid(rows, columns) {
    const _grid = [];
    for (let i = 0; i < rows; i++) {
        _grid[i] = [];
        for (let j = 0; j < columns; j++) {
            _grid[i][j] = 0;
        }
    }
    return _grid;
}

//rows
const gridRows = 20;
//columns
const gridColumns = 10;

// pixels
const gridCellWidth = 32;
const gridCellHeight = 32;

const gridWidth = gridColumns * gridCellWidth;
const gridHeight = gridRows * gridCellHeight;

const grid = initGrid(gridRows, gridColumns);

function displayFrames(x, y){
    ctx.fillStyle = 'black';
    ctx.font = '32px serif';
    ctx.fillText(`Frame: ${gameFrame}`, x, y);
};

//***
// *
const PT = {
    vectors : [{ x: 0, y: 0}, { x: 1, y: 0}, { x: 2, y: 0}, { x: 1, y: 1}],
    color: "blue",
}

//****
const P_ = {
    vectors : [{ x: 0, y: 0}, { x: 1, y: 0}, { x: 2, y: 0}, { x: 3, y: 0}],
    color: "green",
}

//**
// **
const PZ = {
    vectors : [{ x: 0, y: 0}, { x: 1, y: 0}, { x: 1, y: 1}, { x: 2, y: 1}],
    color: "grey",
}

// **
//**
const PRZ = {
    vectors : [{ x: 1, y: 0}, { x: 2, y: 0}, { x: 0, y: 1}, { x: 1, y: 1}],
    color: "white",
}

//**
//**
const PC = {
    vectors : [{ x: 0, y: 0}, { x: 1, y: 0}, { x: 0, y: 1}, { x: 1, y: 1}],
    color: "yellow",
}

//***
//*
const PL = {
    vectors : [{ x: 0, y: 0}, { x: 1, y: 0}, { x: 2, y: 0}, { x: 0, y: 1}],
    color: "purple",
}

//***
//  *
const PRL = {
    vectors : [{ x: 0, y: 0}, { x: 1, y: 0}, { x: 2, y: 0}, { x: 2, y: 1}],
    color: "grey",
}

const pieces = [
    PT,
    P_,
    PZ,
    PRZ,
    PC,
    PL,
    PRL,
]

function getRandomPiece() {
    return pieces[Math.floor(Math.random() * pieces.length)];
}

const spawn = {
    x: gridWidth / 2,
    y: 0,
}

const player = {
    x: spawn.x,
    y: spawn.y,
    piece: getRandomPiece(),
    nextPiece: getRandomPiece(),
}

let speed = 60;

function checkPlayerBounds(player) {
    return player.piece.vectors
        .reduce((blocked, vector) => {
            const col = (player.x / gridCellWidth) + vector.x;
            const row = (player.y / gridCellHeight) + vector.y;
            if (!blocked.bottom) {
                blocked.bottom = (col >= gridColumns || row + 1 >= gridRows) || grid[row + 1][col] != 0;
            }

            // do we actually need that ?
            if (!blocked.top) {
                blocked.top = row - 1 < 0 || grid[row - 1]?.[col] != 0;
            }

            if (!blocked.left) {
                blocked.left = col - 1 < 0 || grid[row]?.[col - 1] != 0;
            }

            if (!blocked.right) {
                blocked.right = col + 1 >= gridColumns || grid[row]?.[col + 1] != 0;
            }

            return blocked;
        }, { bottom: false, top: false, left: false, right: false })
}

let simulations = 0;
let simulationTime = 0;
let lastSimulation = 0;
let lastDraw = 0;
let lastSimulationDrawed = 0;
let requestAnimationFrameHandle, intervalHandle;

function draw() {
    gameFrame += 1;
    const t = Date.now();

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetX = (canvas.width - gridWidth) / 2;
    const offsetY = (canvas.height - gridHeight) / 2;

    ctx.fillStyle = 'black';
    ctx.fillRect(offsetX, offsetY, gridWidth, gridHeight);

    displayFrames(20, 30);

    // display grid
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridColumns; j++) {
            if (grid[i][j]) {
                ctx.fillStyle = grid[i][j];
                // show grid cell
                ctx.fillRect(offsetX + (j * gridCellWidth) + 1, offsetY + (i * gridCellHeight) + 1, gridCellWidth - 2, gridCellHeight - 2);
            }
        }
    }

    // draw player
    for (let p = 0; p < player.piece.vectors.length; p++) {
        ctx.fillStyle = player.piece.color;
        ctx.fillRect(offsetX + player.x + (player.piece.vectors[p].x * gridCellWidth) + 1,
            offsetY + player.y + (player.piece.vectors[p].y * gridCellHeight) + 1,
            gridCellWidth - 2,
            gridCellHeight - 2
        );
    }

    if (gameOver) {
        ctx.fillStyle = 'white'
        ctx.textAlign = 'center'
        ctx.fillText('RIP ✝', canvas.width / 2, canvas.height / 2)
        return;
    }
    const tEnd = lastDraw = Date.now();

    //Log
    benchmarkNode.innerHTML = ("New draw after " + (simulations - lastSimulationDrawed) + " simulations<br>Drawing took " + (tEnd - t) + " ms<br>Simulation time is " + simulationTime + " ms");

    lastSimulationDrawed = simulations;
};

//Simulate function
function simulate() {
    simulations++;
    const t = Date.now();

    let blocked = checkPlayerBounds(player);

    if (keyboard.pressing){
        switch(keyboard.code) {
            case "ArrowRight":
                if (!blocked.right) {
                    player.x += gridCellWidth;
                }
                break;
            case "ArrowLeft":
                if (!blocked.left) {
                    player.x -= gridCellWidth;
                }
                break;
            case "ArrowDown":
                if (!blocked.bottom) {
                    player.y += gridCellHeight;
                }
                break;
        }
        keyboard.pressing = false;
    }

    // we process new y pos every n simultation
    // according to speed
    if (!(simulations % speed)) {
        // recheck after player input
        blocked = checkPlayerBounds(player);

        if (!blocked.bottom) {
            // increment position (piece falling)
            player.y += gridCellHeight;
        // our piece is on top of something
        } else {
            // save piece in grid
            player.piece.vectors.forEach((vector) => {
                const col = (player.x / gridCellWidth) + vector.x;
                const row = (player.y / gridCellHeight) + vector.y;
                grid[row][col] = player.piece.color;
            })

            // reset player pos
            player.x = spawn.x;
            player.y = spawn.y;

            // transfert next piece and get a new one
            player.piece = player.nextPiece;
            player.nextPiece = getRandomPiece();
        }
    }

    gameExit = keyboard.key == "Escape";

    //TODO:
    // for each line to clear, put line to 0
    //and lower each line above by 1 row
    // and draw new grid
    const linesToClear = grid.reduce((list, row, index) => {
        if (row.every((x) => x != 0)) {
            list.push(index);
        }
        return list;
    }, [])

    if (linesToClear.length) {
      console.log("line to clear", linesToClear);
    }

    // check first line
    gameOver = grid[0].some(x => x != 0);

    const tEnd = Date.now();
    simulationTime = tEnd - t;
    lastSimulation = tEnd;

    // draw every 16 or more ms
    if (t - lastDraw >= 16) {
        cancelAnimationFrame(requestAnimationFrameHandle);
        requestAnimationFrameHandle = requestAnimationFrame(draw);
        if (gameOver || gameExit) {
            clearInterval(intervalHandle);
        }
    }
}

intervalHandle = setInterval(simulate, 1000 / 120);
