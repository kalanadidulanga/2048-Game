document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const size = 4;
    let board = [];
    let currentScore = 0;
    const currentScoreElem = document.getElementById('current-score');
    const finalScoreElem = document.getElementById('final-score');

    // Get the high score from local storage or set it to 0 if not found
    let highScore = localStorage.getItem('2048-highscore') || 0;
    const highScoreElem = document.getElementById('high-score');
    highScoreElem.textContent = highScore;

    const gameOverElem = document.getElementById('game-over');

    // Function to update the score
    function updateScore(value) {
        currentScore += value;
        currentScoreElem.textContent = currentScore;
        finalScoreElem.textContent = currentScore;
        if (currentScore > highScore) {
            highScore = currentScore;
            highScoreElem.textContent = highScore;
            localStorage.setItem('2048-highscore', highScore);
        }
    }

    // Function to restart the game
    function restartGame() {
        currentScore = 0;
        currentScoreElem.textContent = '0';
        finalScoreElem.textContent = '0';
        gameOverElem.style.display = 'none';
        initializeGame();
    }

    // Function to initialize the game
    function initializeGame() {
        board = [...Array(size)].map(() => Array(size).fill(0));
        placeRandom();
        placeRandom();
        renderBoard();
    }

    // Function to render the game board
    function renderBoard() {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                const prevValue = cell.dataset.value;
                const currentValue = board[i][j];

                if (currentValue !== 0) {
                    cell.dataset.value = currentValue;
                    cell.textContent = currentValue;
                    if (currentValue !== parseInt(prevValue) && !cell.classList.contains('new-tile')) {
                        cell.classList.add('merged-tile');
                    }
                } else {
                    cell.textContent = '';
                    delete cell.dataset.value;
                    cell.classList.remove('merged-tile', 'new-tile');
                }
            }
        }

        // Cleanup animation classes
        setTimeout(() => {
            const cells = document.querySelectorAll('.grid-cell');
            cells.forEach(cell => {
                cell.classList.remove('merged-tile', 'new-tile');
            });
        }, 300);
    }

    // Function to place a random tile
    function placeRandom() {
        const available = [];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] === 0) {
                    available.push({ x: i, y: j });
                }
            }
        }

        if (available.length > 0) {
            const randomCell = available[Math.floor(Math.random() * available.length)];
            board[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
            const cell = document.querySelector(`[data-row="${randomCell.x}"][data-col="${randomCell.y}"]`);
            cell.classList.add('new-tile');
        }
    }

    // Function to move tiles
    function move(direction) {
        let hasChanged = false;
        const oldBoard = board.map(row => [...row]);

        if (direction === 'ArrowUp' || direction === 'ArrowDown') {
            for (let j = 0; j < size; j++) {
                const column = [...Array(size)].map((_, i) => board[i][j]);
                const newColumn = transform(column, direction === 'ArrowUp');
                for (let i = 0; i < size; i++) {
                    if (board[i][j] !== newColumn[i]) {
                        hasChanged = true;
                        board[i][j] = newColumn[i];
                    }
                }
            }
        } else if (direction === 'ArrowLeft' || direction === 'ArrowRight') {
            for (let i = 0; i < size; i++) {
                const row = [...board[i]];
                const newRow = transform(row, direction === 'ArrowLeft');
                if (row.join(',') !== newRow.join(',')) {
                    hasChanged = true;
                    board[i] = newRow;
                }
            }
        }

        if (hasChanged) {
            placeRandom();
            renderBoard();
            checkGameOver();
        }
    }

    // Function to transform a line (row or column)
    function transform(line, moveTowardsStart) {
        let newLine = line.filter(cell => cell !== 0);
        if (!moveTowardsStart) {
            newLine.reverse();
        }

        for (let i = 0; i < newLine.length - 1; i++) {
            if (newLine[i] === newLine[i + 1]) {
                newLine[i] *= 2;
                updateScore(newLine[i]);
                newLine.splice(i + 1, 1);
            }
        }

        while (newLine.length < size) {
            newLine.push(0);
        }

        if (!moveTowardsStart) {
            newLine.reverse();
        }

        return newLine;
    }

    // Function to check if game is over
    function checkGameOver() {
        // Check for empty cells
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] === 0) return;
            }
        }

        // Check for possible merges horizontally
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size - 1; j++) {
                if (board[i][j] === board[i][j + 1]) return;
            }
        }

        // Check for possible merges vertically
        for (let i = 0; i < size - 1; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] === board[i + 1][j]) return;
            }
        }

        // If we reach here, game is over
        gameOverElem.style.display = 'flex';
    }

    // Handle keyboard events for moves
    document.addEventListener('keydown', event => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            move(event.key);
        }
    });

    // Handle touch events for mobile play
    let touchStartX, touchStartY;
    let touchEndX, touchEndY;

    document.addEventListener('touchstart', event => {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }, false);

    document.addEventListener('touchend', event => {
        touchEndX = event.changedTouches[0].clientX;
        touchEndY = event.changedTouches[0].clientY;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Require a minimum swipe distance to trigger a move
        const minSwipeDistance = 30;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    move('ArrowRight');
                } else {
                    move('ArrowLeft');
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    move('ArrowDown');
                } else {
                    move('ArrowUp');
                }
            }
        }
    }

    // Handle restart button clicks
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('restart-btn-overlay').addEventListener('click', restartGame);

    // Initialize the game when the page loads
    initializeGame();
});