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

        this.updateState();
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
        
        // CSS에서 tile 너비는 9vw, 높이는 12.5vw로 설정되어 있음
        // 1 단위(unit)는 타일 너비/높이의 정확히 절반.
        // 따라서 화면 크기와 무관하게 항상 동일한 퍼즐 맞물림을 보장함.
        const xOffsetVw = x * 4.5; // (9vw / 2)
        const yOffsetVw = y * 6;   // (12vw / 2 == 약간 상하 겹침 유도)
        const zShiftX = z * 0.4;
        const zShiftY = z * 0.6;
        
        el.style.left = `50%`; 
        el.style.top = `50%`; 
        el.style.zIndex = z * 10 + 100;
        
        // 기기 크기에 상관없이 동일한 비율로 보드를 렌더링
        el.style.transform = `translate(calc(-50% + ${xOffsetVw}vw - ${zShiftX}vw), calc(-50% + ${yOffsetVw}vw - ${zShiftY}vw))`;

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


