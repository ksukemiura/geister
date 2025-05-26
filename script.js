class GeisterGame {
    constructor() {
        this.currentPlayer = 'blue';
        this.gamePhase = 'setup'; // 'setup', 'playing', 'game-over'
        this.setupPlayer = 'blue';
        this.board = Array(6).fill().map(() => Array(6).fill(null));
        this.blueGhosts = [];
        this.redGhosts = [];
        this.selectedGhost = null;
        this.capturedGhosts = { blue: [], red: [] };
        
        this.initializeSetup();
        this.bindEvents();
    }

    initializeSetup() {
        this.updateSetupDisplay();
        this.setupGhostSelectors();
    }

    bindEvents() {
        // Setup phase events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('type-btn')) {
                this.handleTypeSelection(e);
            }
        });

        document.getElementById('confirm-setup').addEventListener('click', () => {
            this.confirmSetup();
        });

        document.getElementById('new-game').addEventListener('click', () => {
            this.newGame();
        });

        // Game phase events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('ghost')) {
                this.selectGhost(e.target);
            } else if (e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
            } else if (e.target.classList.contains('exit')) {
                this.handleExitClick(e.target);
            }
        });
    }

    setupGhostSelectors() {
        const selectors = document.querySelectorAll('.ghost-selector');
        selectors.forEach((selector, index) => {
            const buttons = selector.querySelectorAll('.type-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active class from siblings
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Update ghost appearance
                    const ghost = selector.querySelector('.ghost-piece');
                    const type = btn.dataset.type;
                    ghost.dataset.type = type;
                    ghost.textContent = type === 'good' ? '👻' : '💀';
                    
                    this.updateGhostCounts();
                });
            });
        });
    }

    updateGhostCounts() {
        const selectors = document.querySelectorAll('.ghost-selector');
        let goodCount = 0;
        let evilCount = 0;

        selectors.forEach(selector => {
            const ghost = selector.querySelector('.ghost-piece');
            if (ghost.dataset.type === 'good') {
                goodCount++;
            } else {
                evilCount++;
            }
        });

        document.getElementById('good-count').textContent = goodCount;
        document.getElementById('evil-count').textContent = evilCount;

        const confirmBtn = document.getElementById('confirm-setup');
        confirmBtn.disabled = !(goodCount === 4 && evilCount === 4);
    }

    confirmSetup() {
        const selectors = document.querySelectorAll('.ghost-selector');
        const currentGhosts = [];

        selectors.forEach((selector, index) => {
            const ghost = selector.querySelector('.ghost-piece');
            const type = ghost.dataset.type;
            currentGhosts.push({
                id: `${this.setupPlayer}-${index}`,
                player: this.setupPlayer,
                type: type,
                symbol: type === 'good' ? '👻' : '💀'
            });
        });

        if (this.setupPlayer === 'blue') {
            this.blueGhosts = currentGhosts;
            this.setupPlayer = 'red';
            this.updateSetupDisplay();
            this.resetGhostSelectors();
        } else {
            this.redGhosts = currentGhosts;
            this.startGame();
        }
    }

    resetGhostSelectors() {
        const selectors = document.querySelectorAll('.ghost-selector');
        selectors.forEach(selector => {
            const ghost = selector.querySelector('.ghost-piece');
            const buttons = selector.querySelectorAll('.type-btn');
            
            // Reset to good ghost
            ghost.dataset.type = 'good';
            ghost.textContent = '👻';
            ghost.className = `ghost-piece ${this.setupPlayer}`;
            
            // Reset button states
            buttons.forEach(btn => btn.classList.remove('active'));
            buttons[0].classList.add('active'); // First button is 'good'
        });
        
        this.updateGhostCounts();
    }

    updateSetupDisplay() {
        document.getElementById('setup-player').textContent = this.setupPlayer.charAt(0).toUpperCase() + this.setupPlayer.slice(1);
        
        // Update ghost piece colors
        const ghosts = document.querySelectorAll('.ghost-piece');
        ghosts.forEach(ghost => {
            ghost.className = `ghost-piece ${this.setupPlayer}`;
        });
    }

    startGame() {
        document.getElementById('setup-phase').style.display = 'none';
        document.getElementById('game-board-container').style.display = 'block';
        
        this.gamePhase = 'playing';
        this.currentPlayer = 'blue';
        this.placeGhostsOnBoard();
        this.updateGameDisplay();
    }

    placeGhostsOnBoard() {
        // Place blue ghosts (bottom two rows)
        this.blueGhosts.forEach((ghost, index) => {
            const row = index < 4 ? 4 : 5;
            const col = index % 4 + 1; // Columns 1-4
            this.board[row][col] = ghost;
            ghost.row = row;
            ghost.col = col;
        });

        // Place red ghosts (top two rows)
        this.redGhosts.forEach((ghost, index) => {
            const row = index < 4 ? 1 : 0;
            const col = index % 4 + 1; // Columns 1-4
            this.board[row][col] = ghost;
            ghost.row = row;
            ghost.col = col;
        });

        this.renderBoard();
    }

    renderBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('selected', 'possible-move');
        });

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const ghost = this.board[row][col];
                if (ghost) {
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    const ghostElement = document.createElement('div');
                    ghostElement.className = `ghost ${ghost.player}`;
                    ghostElement.dataset.ghostId = ghost.id;
                    ghostElement.dataset.player = ghost.player;
                    
                    // Only show the symbol to the owner or if it's captured
                    if (ghost.player === this.currentPlayer || ghost.revealed) {
                        ghostElement.textContent = ghost.symbol;
                    } else {
                        ghostElement.textContent = '👻'; // Hidden ghost
                    }
                    
                    cell.appendChild(ghostElement);
                }
            }
        }
    }

    selectGhost(ghostElement) {
        if (this.gamePhase !== 'playing') return;
        
        const player = ghostElement.dataset.player;
        if (player !== this.currentPlayer) return;

        // Clear previous selection
        document.querySelectorAll('.ghost').forEach(g => g.classList.remove('selected'));
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('possible-move'));

        this.selectedGhost = ghostElement;
        ghostElement.classList.add('selected');

        // Show possible moves
        const ghostId = ghostElement.dataset.ghostId;
        const ghost = this.findGhostById(ghostId);
        if (ghost) {
            this.showPossibleMoves(ghost);
        }
    }

    findGhostById(ghostId) {
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const ghost = this.board[row][col];
                if (ghost && ghost.id === ghostId) {
                    return ghost;
                }
            }
        }
        return null;
    }

    showPossibleMoves(ghost) {
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1] // up, down, left, right
        ];

        directions.forEach(([dRow, dCol]) => {
            const newRow = ghost.row + dRow;
            const newCol = ghost.col + dCol;

            if (this.isValidMove(newRow, newCol, ghost.player)) {
                const cell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
                if (cell) {
                    cell.classList.add('possible-move');
                }
            }
        });

        // Check exit possibilities
        this.checkExitPossibilities(ghost);
    }

    checkExitPossibilities(ghost) {
        if (ghost.type !== 'good') return; // Only good ghosts can escape

        if (ghost.player === 'blue') {
            // Blue exits at bottom
            if (ghost.row === 5 && (ghost.col === 0 || ghost.col === 5)) {
                const exitId = ghost.col === 0 ? 'blue-left' : 'blue-right';
                const exit = document.querySelector(`[data-exit="${exitId}"]`);
                if (exit) {
                    exit.classList.add('possible-move');
                }
            }
        } else {
            // Red exits at top
            if (ghost.row === 0 && (ghost.col === 0 || ghost.col === 5)) {
                const exitId = ghost.col === 0 ? 'red-left' : 'red-right';
                const exit = document.querySelector(`[data-exit="${exitId}"]`);
                if (exit) {
                    exit.classList.add('possible-move');
                }
            }
        }
    }

    isValidMove(row, col, player) {
        if (row < 0 || row >= 6 || col < 0 || col >= 6) return false;
        
        const targetGhost = this.board[row][col];
        if (!targetGhost) return true; // Empty cell
        
        return targetGhost.player !== player; // Can capture opponent's ghost
    }

    handleCellClick(cell) {
        if (!this.selectedGhost || !cell.classList.contains('possible-move')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        this.moveGhost(this.selectedGhost, row, col);
    }

    handleExitClick(exit) {
        if (!this.selectedGhost || !exit.classList.contains('possible-move')) return;
        
        const ghostId = this.selectedGhost.dataset.ghostId;
        const ghost = this.findGhostById(ghostId);
        
        if (ghost && ghost.type === 'good') {
            this.escapeGhost(ghost);
        }
    }

    moveGhost(ghostElement, newRow, newCol) {
        const ghostId = ghostElement.dataset.ghostId;
        const ghost = this.findGhostById(ghostId);
        
        if (!ghost) return;

        // Check if there's a ghost to capture
        const targetGhost = this.board[newRow][newCol];
        if (targetGhost) {
            this.captureGhost(targetGhost);
        }

        // Move the ghost
        this.board[ghost.row][ghost.col] = null;
        this.board[newRow][newCol] = ghost;
        ghost.row = newRow;
        ghost.col = newCol;

        this.clearSelection();
        this.renderBoard();
        this.checkWinConditions();
        this.switchTurn();
    }

    captureGhost(ghost) {
        ghost.revealed = true; // Reveal the captured ghost
        this.capturedGhosts[ghost.player].push(ghost);
        this.updateCapturedDisplay();
    }

    escapeGhost(ghost) {
        // Remove ghost from board
        this.board[ghost.row][ghost.col] = null;
        
        this.clearSelection();
        this.renderBoard();
        
        // Good ghost escaped - current player wins
        this.endGame(this.currentPlayer, `${this.currentPlayer.toUpperCase()} wins! A good ghost escaped!`);
    }

    updateCapturedDisplay() {
        ['blue', 'red'].forEach(player => {
            const container = document.getElementById(`${player}-captured`);
            container.innerHTML = '';
            
            this.capturedGhosts[player].forEach(ghost => {
                const ghostElement = document.createElement('div');
                ghostElement.className = `captured-ghost ${ghost.type}`;
                ghostElement.textContent = ghost.symbol;
                container.appendChild(ghostElement);
            });
        });
    }

    clearSelection() {
        this.selectedGhost = null;
        document.querySelectorAll('.ghost').forEach(g => g.classList.remove('selected'));
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('possible-move'));
        document.querySelectorAll('.exit').forEach(e => e.classList.remove('possible-move'));
    }

    checkWinConditions() {
        ['blue', 'red'].forEach(player => {
            const opponent = player === 'blue' ? 'red' : 'blue';
            const capturedOpponentGhosts = this.capturedGhosts[opponent];
            
            // Check if all opponent's good ghosts are captured
            const capturedGoodGhosts = capturedOpponentGhosts.filter(g => g.type === 'good').length;
            if (capturedGoodGhosts === 4) {
                this.endGame(player, `${player.toUpperCase()} wins! All opponent good ghosts captured!`);
                return;
            }
            
            // Check if all opponent's evil ghosts are captured
            const capturedEvilGhosts = capturedOpponentGhosts.filter(g => g.type === 'evil').length;
            if (capturedEvilGhosts === 4) {
                this.endGame(opponent, `${opponent.toUpperCase()} wins! All their evil ghosts were captured!`);
                return;
            }
        });
    }

    switchTurn() {
        this.currentPlayer = this.currentPlayer === 'blue' ? 'red' : 'blue';
        this.updateGameDisplay();
    }

    updateGameDisplay() {
        document.getElementById('current-player').textContent = 
            this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);
        document.getElementById('game-status').textContent = 
            `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s turn`;
    }

    endGame(winner, reason) {
        this.gamePhase = 'game-over';
        document.getElementById('winner-text').textContent = `${winner.toUpperCase()} WINS!`;
        document.getElementById('win-reason').textContent = reason;
        document.getElementById('game-over').style.display = 'flex';
    }

    newGame() {
        // Reset all game state
        this.currentPlayer = 'blue';
        this.gamePhase = 'setup';
        this.setupPlayer = 'blue';
        this.board = Array(6).fill().map(() => Array(6).fill(null));
        this.blueGhosts = [];
        this.redGhosts = [];
        this.selectedGhost = null;
        this.capturedGhosts = { blue: [], red: [] };

        // Hide game over screen
        document.getElementById('game-over').style.display = 'none';
        
        // Show setup phase
        document.getElementById('game-board-container').style.display = 'none';
        document.getElementById('setup-phase').style.display = 'block';
        
        // Reset setup
        this.updateSetupDisplay();
        this.resetGhostSelectors();
        this.updateCapturedDisplay();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GeisterGame();
});
