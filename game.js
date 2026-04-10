/**
 * 효도 마작 (사천성) 게임 로직
 * 어머님을 위해 직관적이고 부드러운 UI와 가이드를 제공합니다.
 */

class MahjongGame {
    constructor() {
        this.boardElement = document.getElementById('board');
        this.remainingElement = document.getElementById('remaining-count');
        this.timerElement = document.getElementById('timer');
        this.overlay = document.getElementById('overlay');
        
        // 마작 패 (유니코드 활용 또는 간단한 텍스트)
        this.tiles = [
            '🀀', '🀁', '🀂', '🀃', '🀄', '🀅', '🀆', 
            '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏', 
            '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘',
            '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'
        ];
        
        this.cols = 6; // 모바일 가로폭 고려
        this.rows = 8;
        this.grid = [];
        this.selectedTile = null;
        this.timer = 0;
        this.timerId = null;
        this.isProcessing = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startNewGame();
    }

    setupEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('shuffle-btn').addEventListener('click', () => this.shuffleBoard());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
    }

    startNewGame() {
        this.overlay.classList.add('hidden');
        this.stopTimer();
        this.timer = 0;
        this.updateTimerDisplay();
        this.isProcessing = false;
        this.selectedTile = null;
        
        this.generateBoard();
        this.startTimer();
    }

    generateBoard() {
        const totalTiles = this.rows * this.cols;
        let pool = [];
        
        // 패의 쌍을 만듭니다 (각 패는 2개 또는 4개씩)
        const tileTypesCount = Math.floor(totalTiles / 4);
        for (let i = 0; i < tileTypesCount; i++) {
            const tile = this.tiles[i % this.tiles.length];
            pool.push(tile, tile, tile, tile);
        }
        
        // 남은 공간 채우기
        while (pool.length < totalTiles) {
            const tile = this.tiles[Math.floor(Math.random() * this.tiles.length)];
            pool.push(tile, tile);
        }

        // 섞기
        this.shuffle(pool);

        // 그리드 생성
        this.grid = [];
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;

        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                const value = pool.pop();
                const tileObj = {
                    r, c,
                    value,
                    element: this.createTileElement(r, c, value),
                    isMatched: false
                };
                this.grid[r][c] = tileObj;
                this.boardElement.appendChild(tileObj.element);
            }
        }
        
        this.updateRemainingCount();
    }

    createTileElement(r, c, value) {
        const div = document.createElement('div');
        div.className = 'tile';
        div.textContent = value;
        div.dataset.r = r;
        div.dataset.c = c;
        div.addEventListener('click', (e) => this.handleTileClick(r, c));
        return div;
    }

    handleTileClick(r, c) {
        if (this.isProcessing) return;
        
        const clickedTile = this.grid[r][c];
        if (clickedTile.isMatched) return;

        // 같은 패를 다시 클릭하면 선택 해제
        if (this.selectedTile === clickedTile) {
            clickedTile.element.classList.remove('selected');
            this.selectedTile = null;
            return;
        }

        if (!this.selectedTile) {
            // 첫 번째 패 선택
            this.selectedTile = clickedTile;
            clickedTile.element.classList.add('selected');
        } else {
            // 두 번째 패 선택
            const firstTile = this.selectedTile;
            
            if (firstTile.value === clickedTile.value) {
                // 패가 같으면 연결 가능한지 확인
                const path = this.findPath(firstTile, clickedTile);
                if (path) {
                    this.matchTiles(firstTile, clickedTile, path);
                } else {
                    this.mismatchTiles(firstTile, clickedTile);
                }
            } else {
                this.mismatchTiles(firstTile, clickedTile);
            }
        }
    }

    matchTiles(tile1, tile2, path) {
        this.isProcessing = true;
        tile1.element.classList.add('selected');
        tile2.element.classList.add('selected');

        // 매칭 성공 시각 효과 (선 그리기 등은 복잡하므로 간단한 효과만)
        setTimeout(() => {
            tile1.isMatched = true;
            tile2.isMatched = true;
            tile1.element.classList.add('matched');
            tile2.element.classList.add('matched');
            
            this.selectedTile = null;
            this.isProcessing = false;
            this.updateRemainingCount();
            this.checkGameWin();
        }, 300);
    }

    mismatchTiles(tile1, tile2) {
        this.isProcessing = true;
        tile2.element.classList.add('selected');
        
        setTimeout(() => {
            tile1.element.classList.remove('selected');
            tile2.element.classList.remove('selected');
            this.selectedTile = null;
            this.isProcessing = false;
        }, 400);
    }

    // 사천성 경로 탐색 로직 (단순화를 위해 일단 인접하거나 빈 공간을 통한 2번 꺾임까지 허용하는 로직)
    // 여기서는 어머님을 위해 '가로/세로 어느 방향이든 빈 공간이 있으면 가능'하게 하거나 
    // 정석 사천성 로직을 구현합니다.
    findPath(t1, t2) {
        // 사천성 알고리즘: BFS로 최단 경로를 찾되 굴절 횟수가 2회 이하인 경로가 있는지 확인
        // 어머님 게임이므로 보드 외곽으로도 돌아갈 수 있게 보드를 상하좌우 +1씩 확장해서 생각함
        const rows = this.rows;
        const cols = this.cols;
        
        // 경로 찾기를 위한 임시 맵 (0: 빈 공간, 1: 막힘, 2: 목표)
        // 보드 외곽(가상의 공간)을 포함하기 위해 범위를 -1 ~ rows, -1 ~ cols로 잡음
        const queue = [{ r: t1.r, c: t1.c, dir: -1, turns: 0 }];
        const visited = new Map();

        while (queue.length > 0) {
            const curr = queue.shift();
            
            if (curr.turns > 2) continue;
            
            const directions = [
                { r: -1, c: 0 }, { r: 1, c: 0 },
                { r: 0, c: -1 }, { r: 0, c: 1 }
            ];

            for (let i = 0; i < directions.length; i++) {
                let nr = curr.r + directions[i].r;
                let nc = curr.c + directions[i].c;
                
                // 보드 경계 확인 (외곽 한 칸까지 허용)
                if (nr < -1 || nr > rows || nc < -1 || nc > cols) continue;

                const turns = (curr.dir !== -1 && curr.dir !== i) ? curr.turns + 1 : curr.turns;
                if (turns > 2) continue;

                if (nr === t2.r && nc === t2.c) return true; // 도착

                // 중간 경로가 비어있는지 확인
                const isInside = nr >= 0 && nr < rows && nc >= 0 && nc < cols;
                if (isInside && !this.grid[nr][nc].isMatched) continue; // 막힘

                const key = `${nr},${nc},${i}`;
                if (!visited.has(key) || visited.get(key) > turns) {
                    visited.set(key, turns);
                    queue.push({ r: nr, c: nc, dir: i, turns });
                }
            }
        }
        return false;
    }

    shuffleBoard() {
        let pool = [];
        this.grid.forEach(row => {
            row.forEach(tile => {
                if (!tile.isMatched) pool.push(tile.value);
            });
        });

        this.shuffle(pool);

        this.grid.forEach(row => {
            row.forEach(tile => {
                if (!tile.isMatched) {
                    tile.value = pool.pop();
                    tile.element.textContent = tile.value;
                    tile.element.classList.remove('selected');
                }
            });
        });
        this.selectedTile = null;
    }

    showHint() {
        for (let r1 = 0; r1 < this.rows; r1++) {
            for (let c1 = 0; c1 < this.cols; c1++) {
                const t1 = this.grid[r1][c1];
                if (t1.isMatched) continue;

                for (let r2 = 0; r2 < this.rows; r2++) {
                    for (let c2 = 0; c2 < this.cols; c2++) {
                        const t2 = this.grid[r2][c2];
                        if (t2.isMatched || (r1 === r2 && c1 === c2)) continue;

                        if (t1.value === t2.value && this.findPath(t1, t2)) {
                            t1.element.classList.add('hint');
                            t2.element.classList.add('hint');
                            setTimeout(() => {
                                t1.element.classList.remove('hint');
                                t2.element.classList.remove('hint');
                            }, 2000);
                            return;
                        }
                    }
                }
            }
        }
    }

    updateRemainingCount() {
        let count = 0;
        this.grid.forEach(row => {
            row.forEach(tile => {
                if (!tile.isMatched) count++;
            });
        });
        this.remainingElement.textContent = count;
    }

    checkGameWin() {
        const remaining = parseInt(this.remainingElement.textContent);
        if (remaining === 0) {
            this.stopTimer();
            setTimeout(() => {
                this.overlay.classList.remove('hidden');
            }, 500);
        }
    }

    // 유틸리티
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[array[i]]];
        }
    }

    startTimer() {
        this.timerId = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerId);
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.timer / 60).toString().padStart(2, '0');
        const secs = (this.timer % 60).toString().padStart(2, '0');
        this.timerElement.textContent = `${mins}:${secs}`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new MahjongGame();
});
