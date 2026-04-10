class MahjongSolitaire {
    constructor() {
        this.boardElement = document.getElementById('board');
        this.remainingElement = document.getElementById('remaining-count');
        this.timerElement = document.getElementById('timer');
        
        // 브라우저 렌더링 무손실 마작 아트웍 데이터
        this.tiles = [];
        
        // 1. 만자 (1~9)
        const hanjas = ['一','二','三','四','五','六','七','八','九'];
        for(let i=0; i<9; i++) this.tiles.push({ type: 'man', val: hanjas[i], num: i+1 });
        
        // 2. 통자 (1~9)
        for(let i=1; i<=9; i++) this.tiles.push({ type: 'pin', val: i });
        
        // 3. 삭자 (1~9)
        for(let i=1; i<=9; i++) this.tiles.push({ type: 'sou', val: i });
        
        // 4. 풍패/자패
        const winds = ['東','南','西','北'];
        const dragons = ['中','發','白'];
        winds.forEach(w => this.tiles.push({ type: 'wind', val: w }));
        dragons.forEach(d => this.tiles.push({ type: 'dragon', val: d }));
        
        this.grid = [];
        this.selectedTile = null;
        this.timer = 0;
        this.isProcessing = false;

        this.init();
        window.addEventListener('resize', () => this.scaleBoard());
    }

    scaleBoard() {
        const container = document.getElementById('game-container');
        const board = this.boardElement;
        
        // 보드의 실제 차지 범위 및 기하학적 중심 계산
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        this.layout.forEach(([z, y, x]) => {
            const tx = x * 24;
            const ty = y * 32;
            minX = Math.min(minX, tx - 30);
            maxX = Math.max(maxX, tx + 30);
            minY = Math.min(minY, ty - 40);
            maxY = Math.max(maxY, ty + 40);
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        
        // 중심점 오프셋 계산 (오른쪽 하단 쏠림 방지)
        const offsetX = (minX + maxX) / 2;
        const offsetY = (minY + maxY) / 2;
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const scaleX = containerWidth / contentWidth;
        const scaleY = containerHeight / contentHeight;
        const scale = Math.min(scaleX, scaleY);
        
        // 중심점 보정을 포함한 트랜스폼 적용
        board.style.transform = `translate(calc(-50% - ${offsetX * scale}px), calc(-50% - ${offsetY * scale}px)) scale(${scale})`;
    }

    // 1. 거북이 레이아웃 (더욱 축소)
    getMobileTurtleLayout() {
        let coords = [];
        for (let y = -4; y <= 4; y += 2) {
            for (let x = -6; x <= 6; x += 2) {
                if (Math.abs(x) + Math.abs(y) <= 8) coords.push([0, y, x]);
            }
        }
        for (let y = -2; y <= 2; y += 2) {
            for (let x = -4; x <= 4; x += 2) {
                if (Math.abs(x) + Math.abs(y) <= 4) coords.push([1, y, x]);
            }
        }
        coords.push([2, 0, 0]);
        return coords;
    }

    // 2. 피라미드 레이아웃 (더욱 축소)
    getPyramidLayout() {
        let coords = [];
        for (let z = 0; z < 3; z++) {
            let size = 4 - z * 2;
            if (size < 0) break;
            for (let y = -size; y <= size; y += 2) {
                for (let x = -size; x <= size; x += 2) {
                    coords.push([z, y, x]);
                }
            }
        }
        return coords;
    }

    // 3. 아레나 레이아웃 (더욱 축소)
    getArenaLayout() {
        let coords = [];
        for (let y = -4; y <= 4; y += 2) {
            for (let x = -4; x <= 4; x += 2) {
                coords.push([0, y, x]);
            }
        }
        for (let z = 1; z < 3; z++) {
            for (let y = -4; y <= 4; y += 2) {
                for (let x = -4; x <= 4; x += 2) {
                    if (Math.abs(x) === 4 || Math.abs(y) === 4) {
                        coords.push([z, y, x]);
                    }
                }
            }
        }
        return coords;
    }

    // 4. 십자형 레이아웃 (더욱 축소)
    getCrossLayout() {
        let coords = [];
        for (let z = 0; z < 3; z++) {
            let size = 6 - z * 2;
            for (let i = -size; i <= size; i += 2) {
                coords.push([z, 0, i]); 
                if (i !== 0) coords.push([z, i, 0]); 
            }
        }
        return coords;
    }

    // 5. 다이아몬드 레이아웃 (더욱 축소 - 마름모형)
    getDiamondLayout() {
        let coords = [];
        for (let z = 0; z < 2; z++) {
            let size = 6 - z * 2;
            for (let y = -size; y <= size; y += 2) {
                for (let x = -size; x <= size; x += 2) {
                    if (Math.abs(x) + Math.abs(y) <= size) {
                        coords.push([z, y, x]);
                    }
                }
            }
        }
        return coords;
    }

    init() {
        document.getElementById('reset-btn').onclick = () => this.startNewGame();
        document.getElementById('shuffle-btn').onclick = () => this.shuffleBoard();
        this.startNewGame();
    }

    startNewGame() {
        this.timer = 0;
        this.selectedTile = null;
        this.boardElement.innerHTML = '';
        this.grid = [];

        const layouts = [
            this.getMobileTurtleLayout(),
            this.getPyramidLayout(),
            this.getArenaLayout(),
            this.getCrossLayout(),
            this.getDiamondLayout()
        ];
        this.layout = layouts[Math.floor(Math.random() * layouts.length)];
        
        if (this.layout.length % 2 !== 0) this.layout.pop();
        
        let pool = [];
        const numTiles = this.layout.length;
        for (let i = 0; i < numTiles / 2; i++) {
            const t = this.tiles[i % this.tiles.length];
            pool.push(t, t);
        }
        this.shuffle(pool);

        this.layout.forEach((pos, i) => {
            const [z, y, x] = pos;
            const tileData = pool[i];
            const tile = this.createTile(x, y, z, tileData);
            this.grid.push(tile);
            this.boardElement.appendChild(tile.element);
        });

        this.scaleBoard();
        this.updateState();
    }
    
    getFaceHTML(data) {
        const basePath = 'riichi-mahjong-tiles-master/Regular';
        let fileName = '';

        if (data.type === 'man') fileName = `Man${data.num || data.val}`;
        else if (data.type === 'pin') fileName = `Pin${data.val}`;
        else if (data.type === 'sou') fileName = `Sou${data.val}`;
        else if (data.type === 'wind') {
            const windMap = { '東': 'Ton', '南': 'Nan', '西': 'Shaa', '北': 'Pei' };
            fileName = windMap[data.val];
        } else if (data.type === 'dragon') {
            const dragonMap = { '中': 'Chun', '發': 'Hatsu', '白': 'Haku' };
            fileName = dragonMap[data.val];
        }

        if (fileName) {
            return `<div class="face">
                <img src="${basePath}/${fileName}.svg" alt="${fileName}" class="mj-img">
                <div class="mj-guide-num">${data.val}</div>
            </div>`;
        }
        return `<div class="face">${data.val}</div>`;
    }

    createTile(x, y, z, tileData) {
        const el = document.createElement('div');
        el.className = 'tile';
        
        // 보드 중앙점(50%, 50%)을 기준으로 일정한 픽셀 간격 배치
        const xOffset = x * 24; 
        const yOffset = y * 32; 
        
        el.style.left = `50%`; 
        el.style.top = `50%`; 
        el.style.zIndex = z * 10 + 100;
        
        // x, y 위치 기반 + z 높이 오프셋(두께감)을 통합하여 계산
        el.style.transform = `translate(calc(-50% + ${xOffset}px - ${z * 4}px), calc(-50% + ${yOffset}px - ${z * 6}px))`;

        el.innerHTML = this.getFaceHTML(tileData);
        
        // 타일 클릭 시 들썩임 방지를 위해 트랜스폼 값을 저장해 둡니다.
        el.dataset.baseTransform = el.style.transform;
        
        const tile = { x, y, z, value: JSON.stringify(tileData), data: tileData, element: el, isMatched: false };
        el.onclick = () => this.handleTileClick(tile);
        
        return tile;
    }

    handleTileClick(tile) {
        if (this.isProcessing || tile.isMatched) return;
        
        if (this.isBlocked(tile)) {
            // 막힌 패는 클릭해도 제자리에 있게 하되 에러 피드백을 색상으로만 줍니다
            tile.element.style.filter = "brightness(0.3) sepia(1)";
            setTimeout(() => {
                tile.element.style.filter = "";
            }, 150);
            return;
        }

        if (this.selectedTile === tile) {
            tile.element.classList.remove('selected');
            this.selectedTile = null;
            return;
        }

        if (!this.selectedTile) {
            this.selectedTile = tile;
            tile.element.classList.add('selected');
        } else {
            if (this.selectedTile.value === tile.value) {
                this.matchTiles(this.selectedTile, tile);
            } else {
                this.selectedTile.element.classList.remove('selected');
                this.selectedTile = tile;
                tile.element.classList.add('selected');
            }
        }
    }

    isBlocked(tile) {
        const isOverlapping = (t1, t2) => {
            return Math.abs(t1.x - t2.x) < 2 && Math.abs(t1.y - t2.y) < 2;
        };

        const hasTop = this.grid.some(other => 
            !other.isMatched && other.z > tile.z && isOverlapping(tile, other)
        );
        if (hasTop) return true;

        const hasLeft = this.grid.some(other => 
            !other.isMatched && other.z === tile.z && 
            other.x < tile.x && (other.x + 2 > tile.x - 0.1) && Math.abs(other.y - tile.y) < 2
        );
        
        const hasRight = this.grid.some(other => 
            !other.isMatched && other.z === tile.z && 
            other.x > tile.x && (tile.x + 2 > other.x - 0.1) && Math.abs(other.y - tile.y) < 2
        );

        return hasLeft && hasRight;
    }

    matchTiles(t1, t2) {
        this.isProcessing = true;
        t1.element.classList.add('matched');
        t2.element.classList.add('matched');
        t1.isMatched = true;
        t2.isMatched = true;

        setTimeout(() => {
            this.selectedTile = null;
            this.isProcessing = false;
            this.updateState();
        }, 300);
    }

    updateState() {
        let remaining = 0;
        let activeTiles = [];
        this.grid.forEach(tile => {
            if (!tile.isMatched) {
                remaining++;
                if (this.isBlocked(tile)) {
                    tile.element.classList.add('blocked');
                } else {
                    tile.element.classList.remove('blocked');
                    activeTiles.push(tile);
                }
            }
        });
        this.remainingElement.textContent = remaining;

        // 매칭 가능한 패가 있는지 확인
        if (remaining > 0) {
            let hasMoves = false;
            for (let i = 0; i < activeTiles.length; i++) {
                for (let j = i + 1; j < activeTiles.length; j++) {
                    if (activeTiles[i].value === activeTiles[j].value) {
                        hasMoves = true;
                        break;
                    }
                }
                if (hasMoves) break;
            }

            if (!hasMoves) {
                // 움직일 수 있는 패가 없으면 자동으로 셔플 (알림 없이 즉시 실행하여 흐름 유지)
                setTimeout(() => {
                    this.shuffleBoard();
                }, 500);
            }
        } else if (remaining === 0) {
            // 모든 패를 맞추면 잠시 후 자동으로 새 게임 시작
            setTimeout(() => {
                alert("축하합니다! 모든 패를 맞추셨습니다! 🎉");
                this.startNewGame();
            }, 500);
        }
    }

    shuffleBoard() {
        let pool = [];
        this.grid.forEach(t => { if (!t.isMatched) pool.push(t.data); });
        this.shuffle(pool);
        this.grid.forEach(t => { 
            if (!t.isMatched) { 
                t.data = pool.pop(); 
                t.value = JSON.stringify(t.data);
                t.element.innerHTML = this.getFaceHTML(t.data); 
            } 
        });
        this.selectedTile = null;
        this.updateState();
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

window.onload = () => new MahjongSolitaire();


