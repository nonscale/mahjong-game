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

        this.updateBoardScale(); // 배치가 끝난 후 자동으로 화면에 맞춤
        this.updateState();
    }

    /**
     * 🧪 [Verify] 지능형 자동 리사이징 엔진
     * 모든 타일의 위치를 계산하여 화면(PC/모바일)에 꽉 차도록 보드 스케일을 자동 조절합니다.
     */
    updateBoardScale() {
        if (this.grid.length === 0) return;

        // 1. 모든 타일을 포함하는 영역(Bounding Box) 계산
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        // 실제 픽셀 단위 오프셋을 추측하지 않고, 타일의 상대 좌표 x, y를 이용해 범위를 구함
        // (CSS 변수 var(--tile-w-half) 등의 실제 현재 값을 가져오는 대신 비율로 계산)
        this.grid.forEach(tile => {
            if (tile.isMatched) return;
            // 좌표 단위 기준 (너비 절반=1단위)
            minX = Math.min(minX, tile.x - 1);
            maxX = Math.max(maxX, tile.x + 1);
            minY = Math.min(minY, tile.y - 1.5);
            maxY = Math.max(maxY, tile.y + 1.5);
        });

        const container = document.getElementById('game-container');
        const cw = container.clientWidth;
        const ch = container.clientHeight;

        // 2. 현재 배치가 차지하는 '가상' 픽셀 크기 (모바일 기준 16vw 너비 가정 시)
        // 실제 정확한 픽셀보다는 '비율'이 중요함.
        // x 단위 하나당 var(--tile-w-half) 만큼 이동함.
        const boardWidthUnits = (maxX - minX);
        const boardHeightUnits = (maxY - minY);

        // 3. 화면 가로/세로 중 더 좁은 쪽에 맞춰 스케일 결정 (여백 5% 확보)
        // CSS 기본값이 이미 꽤 크므로(16vw), 화면보다 크면 줄이고 작으면 키움.
        const rootStyles = getComputedStyle(document.documentElement);
        const halfWStr = rootStyles.getPropertyValue('--tile-w-half').trim();
        const halfHStr = rootStyles.getPropertyValue('--tile-h-half').trim();
        
        let unitW, unitH;
        if (halfWStr.includes('vw')) {
            unitW = (parseFloat(halfWStr) / 100) * window.innerWidth;
            unitH = (parseFloat(halfHStr) / 100) * window.innerWidth;
        } else {
            unitW = parseFloat(halfWStr);
            unitH = parseFloat(halfHStr);
        }

        const realBoardW = boardWidthUnits * unitW;
        const realBoardH = boardHeightUnits * unitH;

        const scaleW = (cw * 0.95) / realBoardW;
        const scaleH = (ch * 0.95) / realBoardH;
        const finalScale = Math.min(scaleW, scaleH, 1.2); // 너무 무한정 커지진 않게 1.2배 캡

        this.boardElement.style.transform = `translate(-50%, -50%) scale(${finalScale})`;
    }
    
    getFaceHTML(data) {
        if (data.type === 'man') {
            return `<div class="face"><div class="mj-man"><span class="mj-num">${data.val}</span><span class="mj-char">萬</span></div></div>`;
        }
        if (data.type === 'pin') {
            let dots = '';
            for(let i=0; i<data.val; i++) {
                // 특정 숫자 색상 분리
                let clr = (data.val===1 || (data.val===7 && i>3) || (data.val===9 && i>5) ? 'red' : (data.val===8 && i%2===1 ? 'green' : ''));
                dots += `<div class="dot ${clr}"></div>`;
            }
            return `<div class="face"><div class="mj-pin layout-${data.val}">${dots}</div></div>`;
        }
        if (data.type === 'sou') {
            if (data.val === 1) return `<div class="face"><div class="mj-sou layout-1">🦚</div></div>`;
            let sticks = '';
            for(let i=0; i<data.val; i++) {
                let clr = (data.val===8 && i<4) || (data.val===6 && i<3) ? 'red' : 'green';
                sticks += `<div class="stick ${clr}"></div>`;
            }
            return `<div class="face"><div class="mj-sou layout-${data.val}">${sticks}</div></div>`;
        }
        if (data.type === 'wind') {
            return `<div class="face"><div class="mj-font wind-black">${data.val}</div></div>`;
        }
        if (data.type === 'dragon') {
            let cls = data.val === '中' ? 'dragon-red' : (data.val === '發' ? 'dragon-green' : 'dragon-blue');
            return `<div class="face"><div class="mj-font ${cls}">${data.val==='白'?'B':data.val}</div></div>`;
        }
    }

    createTile(x, y, z, tileData) {
        const el = document.createElement('div');
        el.className = 'tile';
        
        // CSS 변수를 사용하여 PC/모바일 환경에 따라 자동으로 배치 간격 조절
        el.style.left = `50%`; 
        el.style.top = `50%`; 
        el.style.zIndex = z * 10 + 100;
        
        const xTransform = `calc(-50% + (${x} * var(--tile-w-half)) - (${z} * var(--tile-z-x)))`;
        const yTransform = `calc(-50% + (${y} * var(--tile-h-half)) - (${z} * var(--tile-z-y)))`;
        
        el.style.transform = `translate(${xTransform}, ${yTransform})`;

        el.innerHTML = this.getFaceHTML(tileData);
        
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
                // 움직일 수 있는 패가 없으면 자동으로 셔플
                setTimeout(() => {
                    alert("움직일 수 있는 패가 없어 패를 다시 섞습니다! 😊");
                    this.shuffleBoard();
                }, 500);
            }
        } else if (remaining === 0) {
            alert("축하합니다! 모든 패를 맞추셨습니다! 🎉");
        }
    }

    shuffleBoard() {
        if (this.grid.length === 0) return;
        const currentData = this.grid.filter(t => !t.isMatched).map(t => t.data);
        this.shuffle(currentData);
        
        let idx = 0;
        this.grid.forEach(tile => {
            if (!tile.isMatched) {
                tile.data = currentData[idx++];
                tile.value = JSON.stringify(tile.data);
                tile.element.innerHTML = this.getFaceHTML(tile.data);
            }
        });
        
        this.updateBoardScale(); // 셔플 후에도 위치 재조정
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

// 📱 화면 회전 및 리사이즈 시 즉각 대응 (Verify)
window.addEventListener('resize', () => {
    if (window.gameInstance) {
        window.gameInstance.updateBoardScale();
    }
});

window.onload = () => {
    window.gameInstance = new MahjongSolitaire();
};
