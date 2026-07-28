// The game contains 10 increasingly challenging mazes. Each row is a string of
// walls (#) and open paths (.) with S marking the start and E marking the exit.
const levels = [
  {
    name: "Starter Path",
    grid: [
      "########",
      "#S....E#",
      "#..#####",
      "#......#",
      "########",
    ],
  },
  {
    name: "Twist Turn",
    grid: [
      "########",
      "#S#..#E#",
      "#.#..#.#",
      "#.#..#.#",
      "#......#",
      "########",
    ],
  },
  {
    name: "Crossroads",
    grid: [
      "#########",
      "#S..#...#",
      "###.#.#.#",
      "#...#.#E#",
      "#.#.#.#.#",
      "#.#...#.#",
      "#..####.#",
      "#########",
    ],
  },
  {
    name: "Spiral Drift",
    grid: [
      "#########",
      "#S..#####",
      "#.#..#..#",
      "#.#.##.#E",
      "#.#....##",
      "#.#.#####",
      "#....#..#",
      "#########",
    ],
  },
  {
    name: "Mini Labyrinth",
    grid: [
      "##########",
      "#S..#....#",
      "#.#.#.##.#",
      "#.#.#....#",
      "#.#.####.#",
      "#...#..#.#",
      "###.#..#E#",
      "#....#....#",
      "##########",
    ],
  },
  {
    name: "The Loop",
    grid: [
      "############",
      "#S..#......#",
      "#.#.#.####.#",
      "#.#.#....#.#",
      "#.#.####.#.#",
      "#...#..#.#.#",
      "###.#..#.#E#",
      "#....##....#",
      "############",
    ],
  },
  {
    name: "Canyon Maze",
    grid: [
      "############",
      "#S..#.....E#",
      "#.#.#.###.#",
      "#.#.#...#.#",
      "#.#.###.#.#",
      "#...#...#.#",
      "####.###.#.#",
      "#....#.....#",
      "############",
    ],
  },
  {
    name: "Dense Forest",
    grid: [
      "#############",
      "#S....#....E#",
      "#.#.##.#.####",
      "#.#....#....#",
      "#.#.####.##.#",
      "#.#....#....#",
      "#.####.#.##.#",
      "#........#..#",
      "#############",
    ],
  },
  {
    name: "Shadow Grid",
    grid: [
      "###############",
      "#S..#....#....#",
      "#.#.#.##.#.##.#",
      "#.#.#....#....#",
      "#.#.####.####.#",
      "#...#....#....E",
      "###.#.##.#.####",
      "#.....#......#",
      "###############",
    ],
  },
  {
    name: "Final Escape",
    grid: [
      "################",
      "#S...#....#...E#",
      "#.#.#.##.#.##.#",
      "#.#.#....#....#",
      "#.#.####.####.#",
      "#...#........#",
      "###.#.####.#.#",
      "#........#.#.#",
      "#.######.#.#.#",
      "################",
    ],
  },
];

const STORAGE_KEY = "maze-escape-unlocked";
const NEXT_LEVEL_DELAY_MS = 2000;
const state = {
  currentLevelIndex: 0,
  player: { row: 0, col: 0 },
  board: null,
  unlockedLevels: 1,
  isPlaying: false,
  isTransitioning: false,
  completedFinalLevel: false,
  nextLevelTimer: null,
};

const levelTitleEl = document.getElementById("levelTitle");
const statusTextEl = document.getElementById("statusText");
const boardEl = document.getElementById("board");
const menuScreenEl = document.getElementById("menuScreen");
const gameScreenEl = document.getElementById("gameScreen");
const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlayTitle");
const overlayTextEl = document.getElementById("overlayText");
const overlayBtnEl = document.getElementById("overlayBtn");
const levelButtonsEl = document.getElementById("levelButtons");
const instructionsPanelEl = document.getElementById("instructionsPanel");
const mobileControlsEl = document.getElementById("mobileControls");
const startBtnEl = document.getElementById("startBtn");
const restartBtnEl = document.getElementById("restartBtn");
const menuBtnEl = document.getElementById("menuBtn");
const levelSelectBtnEl = document.getElementById("levelSelectBtn");
const instructionsBtnEl = document.getElementById("instructionsBtn");

function init() {
  // Restore unlocked progress from localStorage so the player can return later.
  state.unlockedLevels = Math.max(1, Number(localStorage.getItem(STORAGE_KEY) || 1));
  bindEvents();
  renderLevelButtons();
  updateMobileControls();
  showMenu();
}

function bindEvents() {
  window.addEventListener("keydown", handleKeyPress);
  window.addEventListener("resize", updateMobileControls);

  startBtnEl.addEventListener("click", () => startLevel(0));
  restartBtnEl.addEventListener("click", restartLevel);
  menuBtnEl.addEventListener("click", showMenu);
  overlayBtnEl.addEventListener("click", continueFromOverlay);
  levelSelectBtnEl.addEventListener("click", () => toggleSection(levelButtonsEl));
  instructionsBtnEl.addEventListener("click", () => toggleSection(instructionsPanelEl));
}

function toggleSection(element) {
  element.classList.toggle("hidden");
}

function clearPendingLevelTransition() {
  if (state.nextLevelTimer) {
    clearTimeout(state.nextLevelTimer);
    state.nextLevelTimer = null;
  }
}

function showMenu() {
  clearPendingLevelTransition();
  overlayEl.classList.add("hidden");
  menuScreenEl.classList.remove("hidden");
  menuScreenEl.classList.add("active");
  gameScreenEl.classList.add("hidden");
  gameScreenEl.classList.remove("active");
  state.isPlaying = false;
  state.isTransitioning = false;
  renderLevelButtons();
}

function startLevel(index) {
  if (index < 0 || index >= levels.length) return;
  if (index + 1 > state.unlockedLevels) return;

  clearPendingLevelTransition();
  state.currentLevelIndex = index;
  state.isPlaying = true;
  state.isTransitioning = false;
  state.completedFinalLevel = false;
  state.board = buildLevel(levels[index]);
  state.player = { ...state.board.start };
  overlayEl.classList.add("hidden");

  menuScreenEl.classList.add("hidden");
  gameScreenEl.classList.remove("hidden");
  gameScreenEl.classList.add("active");

  levelTitleEl.textContent = `Level ${index + 1}: ${levels[index].name}`;
  statusTextEl.textContent = "Find the green exit tile.";
  renderBoard();
  updateMobileControls();
}

function restartLevel() {
  if (!state.isPlaying) return;
  clearPendingLevelTransition();
  startLevel(state.currentLevelIndex);
}

function continueFromOverlay() {
  clearPendingLevelTransition();
  overlayEl.classList.add("hidden");
  if (state.completedFinalLevel) {
    state.completedFinalLevel = false;
    startLevel(0);
    return;
  }
  if (state.currentLevelIndex + 1 >= levels.length) {
    showMenu();
    return;
  }
  startLevel(state.currentLevelIndex + 1);
}

function buildLevel(levelData) {
  const grid = levelData.grid.map((row) => row.split(""));
  let start = { row: 0, col: 0 };
  let exit = { row: 0, col: 0 };

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === "S") {
        start = { row, col };
        grid[row][col] = ".";
      }
      if (grid[row][col] === "E") {
        exit = { row, col };
        grid[row][col] = ".";
      }
    }
  }

  return { levelData, grid, start, exit, rows: grid.length, cols: grid[0].length };
}

function renderBoard() {
  const { grid, rows, cols, exit } = state.board;
  const boardSize = getBoardSize(rows, cols);
  boardEl.innerHTML = "";
  boardEl.style.width = `${boardSize.width}px`;
  boardEl.style.height = `${boardSize.height}px`;

  const cellSize = boardSize.cellSize;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cellEl = document.createElement("div");
      cellEl.className = `cell ${grid[row][col] === "#" ? "wall" : "path"}`;
      cellEl.style.left = `${col * cellSize}px`;
      cellEl.style.top = `${row * cellSize}px`;
      cellEl.style.width = `${cellSize}px`;
      cellEl.style.height = `${cellSize}px`;
      boardEl.appendChild(cellEl);
    }
  }

  const exitEl = document.createElement("div");
  exitEl.className = "exit";
  exitEl.style.left = `${exit.col * cellSize}px`;
  exitEl.style.top = `${exit.row * cellSize}px`;
  exitEl.style.width = `${cellSize}px`;
  exitEl.style.height = `${cellSize}px`;
  boardEl.appendChild(exitEl);

  const playerEl = document.createElement("div");
  playerEl.className = "player";
  playerEl.style.left = `${state.player.col * cellSize}px`;
  playerEl.style.top = `${state.player.row * cellSize}px`;
  playerEl.style.width = `${cellSize}px`;
  playerEl.style.height = `${cellSize}px`;
  boardEl.appendChild(playerEl);
}

function getBoardSize(rows, cols) {
  const maxWidth = Math.min(window.innerWidth - 32, 760);
  const maxHeight = Math.min(window.innerHeight - 250, 700);
  const cellSize = Math.max(20, Math.min(Math.floor(maxWidth / cols), Math.floor(maxHeight / rows)) - 1);
  return {
    width: cellSize * cols,
    height: cellSize * rows,
    cellSize,
  };
}

function handleKeyPress(event) {
  if (!state.isPlaying || state.isTransitioning) return;
  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };
  const direction = keyMap[event.key];
  if (direction) {
    event.preventDefault();
    movePlayer(direction);
  }
}

function movePlayer(direction) {
  if (!state.isPlaying || state.isTransitioning) return;

  const nextPosition = getNextPosition(direction);
  const { grid } = state.board;
  const nextCell = grid[nextPosition.row]?.[nextPosition.col];

  if (!nextCell || nextCell === "#") return;

  state.player = nextPosition;
  renderBoard();
  statusTextEl.textContent = "Keep going!";

  if (isExitReached(nextPosition)) {
    completeLevel();
  }
}

function getNextPosition(direction) {
  const { row, col } = state.player;
  switch (direction) {
    case "up":
      return { row: row - 1, col };
    case "down":
      return { row: row + 1, col };
    case "left":
      return { row, col: col - 1 };
    case "right":
      return { row, col: col + 1 };
    default:
      return { row, col };
  }
}

function isExitReached(position) {
  return position.row === state.board.exit.row && position.col === state.board.exit.col;
}

function completeLevel() {
  state.isTransitioning = true;
  statusTextEl.textContent = "Level complete!";

  if (state.currentLevelIndex + 1 > state.unlockedLevels) {
    state.unlockedLevels = state.currentLevelIndex + 1;
    localStorage.setItem(STORAGE_KEY, String(state.unlockedLevels));
  }

  renderLevelButtons();

  if (state.currentLevelIndex + 1 >= levels.length) {
    state.completedFinalLevel = true;
    showOverlay(
      "Congratulations! You Escaped Every Maze!",
      "You cleared every challenge. Press the button to play again.",
      "Play Again"
    );
    return;
  }

  showOverlay("Level Complete!", `A new maze is loading in ${NEXT_LEVEL_DELAY_MS / 1000} seconds...`, "Continue");
  state.nextLevelTimer = window.setTimeout(() => {
    state.nextLevelTimer = null;
    startLevel(state.currentLevelIndex + 1);
  }, NEXT_LEVEL_DELAY_MS);
}

function showOverlay(title, text, buttonText) {
  overlayTitleEl.textContent = title;
  overlayTextEl.textContent = text;
  overlayBtnEl.textContent = buttonText;
  overlayEl.classList.remove("hidden");
}

function renderLevelButtons() {
  levelButtonsEl.innerHTML = "";
  for (let i = 0; i < levels.length; i += 1) {
    const button = document.createElement("button");
    button.className = `level-btn ${i + 1 > state.unlockedLevels ? "locked" : ""}`;
    button.textContent = `${i + 1}`;
    button.disabled = i + 1 > state.unlockedLevels;
    button.addEventListener("click", () => {
      if (i + 1 <= state.unlockedLevels) {
        startLevel(i);
      }
    });
    levelButtonsEl.appendChild(button);
  }
}

function updateMobileControls() {
  const showControls = window.innerWidth < 768 || navigator.maxTouchPoints > 0;
  mobileControlsEl.innerHTML = "";

  if (!showControls) {
    mobileControlsEl.style.display = "none";
    return;
  }

  mobileControlsEl.style.display = "grid";
  const directions = [
    { key: "up", label: "▲" },
    { key: "left", label: "◀" },
    { key: "right", label: "▶" },
    { key: "down", label: "▼" },
  ];

  directions.forEach(({ key, label }) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.setAttribute("aria-label", key);
    button.addEventListener("click", () => movePlayer(key));
    mobileControlsEl.appendChild(button);
  });
}

init();
