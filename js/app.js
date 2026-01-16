/**
 * MateAula Pro - Application Logic v8.1
 * Optimized for Cross-Browser Stability & Horizontal Layouts
 */

class MathApp {
    constructor() {
        // State
        this.apiKey = ""; // API Key for Gemini (Optional)
        this.score = 0;
        this.currentDifficulty = 1;
        this.gameMode = 'sumas';
        this.val1 = null;
        this.val2 = null;
        this.roundFinished = false;

        // Input States
        this.userInputValue = "";
        this.userSelectedSymbol = null;
        this.lectInputs = { pures: "", units: "", total: "" };
        this.activeField = 'pures';
        this.userBlocks = { tens: 0, units: 0 };
        this.antPostInputs = { before: "", after: "" };
        this.activeAntPost = 'before';

        // Camino State
        this.currentPathNum = 1;
        this.caminoStart = 1;
        this.caminoEnd = 100;
        this.caminoDirection = 1;
        this.caminoSettings = {
            rows: 3,
            cols: 5,
            displayMode: 'ordered',  // 'ordered', 'snake', 'path', 'random'
            step: 1  // 1, 2, or 5
        };
        this.caminoNumbers = [];
        this.caminoGrid = [];  // Para guardar posiciones

        // UI State
        this.isRolling = { 1: false, 2: false };
        this.showSticksIA = true;
        this.lastIAStory = "";

        // Cache DOM elements
        this.elements = {
            viewMenu: document.getElementById('view-menu'),
            viewGame: document.getElementById('view-game'),
            gameTitle: document.getElementById('game-title'),
            score: document.getElementById('score'),
            instruction: document.getElementById('instruction'),
            exerciseContainer: document.getElementById('exercise-container'),
            diceSection: document.getElementById('dice-section'),
            toggleSticks: document.getElementById('toggle-sticks'),
            canvas: document.getElementById('canvas-pizarra'),
            ctx: document.getElementById('canvas-pizarra') ? document.getElementById('canvas-pizarra').getContext('2d') : null,
            geminiModal: document.getElementById('gemini-modal'),
            geminiContent: document.getElementById('gemini-content'),
            iaResponseText: document.getElementById('ia-response-text'),
            inputs: {
                numKeypad: document.getElementById('num-keypad'),
                symbolKeypad: document.getElementById('symbol-keypad'),
                rightPanel: document.getElementById('right-panel'),
                gameContainer: document.getElementById('game-container'),
                diff1: document.getElementById('diff-1'),
                diff2: document.getElementById('diff-2'),
                diff3: document.getElementById('diff-3')
            }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        setTimeout(() => {
            this.initPizarra();
            this.resizeCanvas();
        }, 100);
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    bindEvents() {
        // Expose methods for HTML interaction
        window.startActivity = (mode) => this.startActivity(mode);
        window.goToMenu = () => this.goToMenu();
        window.setDifficulty = (d) => this.setDifficulty(d);
        window.resetRound = () => this.resetRound();
        window.clearCanvas = () => this.clearCanvas();
        window.pressNum = (n) => this.pressNum(n);
        window.backspace = () => this.backspace();
        window.checkAnswerIA = () => this.checkAnswer();
        window.checkComparisonIA = (s) => this.checkComparison(s);
        window.handleDice = (id) => this.handleDice(id);
        window.clickCamino = (n, el) => this.clickCamino(n, el);
        window.adjustBlock = (t, a) => this.adjustBlock(t, a);

        // AI methods
        window.readInstructionIA = () => this.readText(this.elements.instruction.innerText);
        window.toggleSticksIA = () => this.toggleSticks();
        window.getStoryIA = () => this.getStory();
        window.readProblemIA = () => this.lastIAStory && this.readText(this.lastIAStory);
        window.closeModalIA = () => this.elements.geminiModal.style.display = 'none';
        window.generateExercise = () => this.generateExercise();
    }

    startActivity(mode) {
        this.elements.viewMenu.classList.remove('active');
        this.elements.viewGame.classList.add('active');
        this.setGameMode(mode);
    }

    goToMenu() {
        this.elements.viewGame.classList.remove('active');
        this.elements.viewMenu.classList.add('active');
    }

    setGameMode(mode) {
        this.gameMode = mode;
        const els = this.elements;
        const isCamino = mode.includes('camino');

        els.toggleSticks.classList.add('hidden');
        document.getElementById('page-badge').classList.add('hidden');

        // Layout adjustments
        if (isCamino) {
            els.inputs.gameContainer.classList.add('layout-fullscreen');
            els.inputs.rightPanel.classList.add('hidden');
            els.gameTitle.innerText = "CAMINO MATEMÁTICO";
            els.diceSection.innerHTML = `<button onclick="generateExercise()" class="btn-game-action">Nueva Serie 🎲</button>`;
        } else {
            els.inputs.gameContainer.classList.remove('layout-fullscreen');
            els.inputs.rightPanel.classList.remove('hidden');
            els.gameTitle.innerText = mode.toUpperCase();

            if (mode === 'comparar') {
                els.inputs.numKeypad.classList.add('hidden');
                els.inputs.symbolKeypad.classList.remove('hidden');
                document.getElementById('btn-lt').innerHTML = this.getComparisonSVG('lt');
                document.getElementById('btn-gt').innerHTML = this.getComparisonSVG('gt');
            } else {
                els.inputs.numKeypad.classList.remove('hidden');
                els.inputs.symbolKeypad.classList.add('hidden');
            }

            if (['sumas', 'restas'].includes(mode) && this.currentDifficulty === 2) {
                els.toggleSticks.classList.remove('hidden');
            }

            if (['lectura', 'bloques', 'representa', 'antpost', 'batido', 'vecinos', 'reloj', 'puzzle'].includes(mode)) {
                els.diceSection.innerHTML = `<button onclick="generateExercise()" class="btn-game-action">Nuevo Reto 🎲</button>`;
            } else {
                const opSymbol = mode === 'sumas' ? '＋' : (mode === 'restas' ? '－' : '🐊');
                els.diceSection.innerHTML = `
                    <div id="dice-slot-1" onclick="handleDice(1)" class="dice-slot"><span class="text-2xl">❓</span></div>
                    <div class="op-symbol-small">${opSymbol}</div>
                    <div id="dice-slot-2" onclick="handleDice(2)" class="dice-slot"><span class="text-2xl">❓</span></div>
                    <button id="btn-ia-story" onclick="getStoryIA()" class="gemini-btn" style="display:none">✨ CUENTO</button>
                `;
            }
        }

        this.generateExercise();
        setTimeout(() => this.resizeCanvas(), 100);
    }

    setDifficulty(d) {
        this.currentDifficulty = d;
        this.elements.inputs.diff1.className = d === 1 ? 'difficulty-btn active' : 'difficulty-btn';
        this.elements.inputs.diff2.className = d === 2 ? 'difficulty-btn active' : 'difficulty-btn';
        this.elements.inputs.diff3.className = d === 3 ? 'difficulty-btn active' : 'difficulty-btn';
        this.setGameMode(this.gameMode);
    }

    resetRound() {
        if (['lectura', 'bloques', 'representa', 'antpost', 'camino', 'batido', 'vecinos', 'reloj', 'puzzle'].some(m => this.gameMode.includes(m))) {
            this.generateExercise();
        } else {
            this.val1 = null; this.val2 = null; this.roundFinished = false;
            this.userInputValue = ""; this.userSelectedSymbol = null;

            this.elements.exerciseContainer.innerHTML = `<div class="placeholder-msg" style="color: var(--neutral-300); text-transform:uppercase; font-weight:bold;">Lanza los dados</div>`;
            this.elements.instruction.innerText = "Toca los dados";
            this.elements.instruction.className = "instruction-pill instruction-neutral";

            const s1 = document.getElementById('dice-slot-1');
            const s2 = document.getElementById('dice-slot-2');
            if (s1) s1.innerHTML = '<span class="text-2xl">❓</span>';
            if (s2) s2.innerHTML = '<span class="text-2xl">❓</span>';

            const btnStory = document.getElementById('btn-ia-story');
            if (btnStory) btnStory.style.display = 'none';

            this.clearCanvas();
        }
    }

    generateExercise() {
        this.roundFinished = false;
        this.userInputValue = "";
        this.lectInputs = { pures: "", units: "", total: "" };
        this.userBlocks = { tens: 0, units: 0 };
        this.activeField = 'pures';
        this.antPostInputs = { before: "", after: "" };
        this.activeAntPost = 'before';
        this.val1 = null; this.val2 = null; this.userSelectedSymbol = null;

        this.clearCanvas();
        this.elements.instruction.innerText = "Resuelve el reto";
        this.elements.instruction.className = "instruction-pill instruction-active";

        if (this.gameMode === 'lectura') this.genLectura();
        else if (this.gameMode === 'bloques') this.genBloques();
        else if (this.gameMode === 'representa') this.genRepresenta();
        else if (this.gameMode === 'antpost') this.genAntPost();
        else if (this.gameMode.includes('camino')) this.genCamino();
        else if (this.gameMode === 'batido') this.genBatido();
        else if (this.gameMode === 'vecinos') this.genVecinos();
        else if (this.gameMode === 'reloj') this.genReloj();
        else if (this.gameMode === 'puzzle') this.genPuzzle();
        else {
            this.elements.exerciseContainer.innerHTML = `<div class="placeholder-msg" style="color: var(--neutral-300); text-transform:uppercase; font-weight:bold;">Lanza los dados</div>`;
            this.elements.instruction.innerText = "Toca los dados";
        }
    }

    // --- Generators ---

    genLectura() { this.val1 = this.getRandomNumber(); this.renderLectura(); }
    genBloques() { this.val1 = Math.floor(Math.random() * 99) + 1; this.renderBloques(); }
    genRepresenta() { this.val1 = Math.floor(Math.random() * 99) + 1; this.renderRepresenta(); }
    genAntPost() { this.val1 = Math.floor(Math.random() * 96) + 2; this.renderAntPost(); }
    genCamino() {
        // Generar números según configuración
        const total = this.caminoSettings.rows * this.caminoSettings.cols;
        const step = this.caminoSettings.step;
        this.caminoNumbers = [];
        for (let i = 0; i < total; i++) {
            this.caminoNumbers.push((i + 1) * step);
        }
        this.caminoStart = step;
        this.caminoEnd = total * step;
        this.caminoDirection = 1;
        this.currentPathNum = this.caminoStart;
        this.renderCamino();
    }

    setCaminoSetting(key, value) {
        if (key === 'rows') this.caminoSettings.rows = Math.min(5, Math.max(1, value));
        else if (key === 'cols') this.caminoSettings.cols = Math.min(7, Math.max(1, value));
        else if (key === 'displayMode') this.caminoSettings.displayMode = value;
        else if (key === 'step') this.caminoSettings.step = value;
        this.genCamino();
    }

    getRandomNumber() {
        if (this.currentDifficulty === 1) return Math.floor(Math.random() * 9) + 1;
        if (this.currentDifficulty === 2) return Math.floor(Math.random() * 41) + 10;
        return Math.floor(Math.random() * 51) + 50;
    }

    // --- BATIDO MATEMÁTICO ---
    genBatido() {
        // Generar suma simple con frutas
        const maxNum = this.currentDifficulty === 1 ? 5 : (this.currentDifficulty === 2 ? 10 : 15);
        this.val1 = Math.floor(Math.random() * maxNum) + 1;
        this.val2 = Math.floor(Math.random() * maxNum) + 1;
        this.batidoFrutas = [];
        this.batidoTarget = this.val1 + this.val2;
        this.batidoCount = 0;
        this.renderBatido();
    }

    renderBatido() {
        const frutas = ['🍓', '🍊', '🍇', '🍎', '🍌'];
        const fruta1 = frutas[Math.floor(Math.random() * frutas.length)];
        const fruta2 = frutas[Math.floor(Math.random() * frutas.length)];

        this.elements.exerciseContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:1rem;" class="animate-pop">
                <div style="font-size:1.5rem; font-weight:bold;">¿Cuántas frutas hay en total?</div>
                <div style="display:flex; align-items:center; gap:1rem; font-size:2rem;">
                    <div style="padding:1rem; background:#fef2f2; border-radius:12px;">
                        ${fruta1.repeat(this.val1)}
                    </div>
                    <span style="font-size:3rem; color:var(--neutral-300);">+</span>
                    <div style="padding:1rem; background:#f0fdf4; border-radius:12px;">
                        ${fruta2.repeat(this.val2)}
                    </div>
                    <span style="font-size:3rem; color:var(--neutral-300);">=</span>
                    <div class="number-box" style="min-width:80px; border:3px solid var(--primary); border-radius:12px; padding:0.5rem;">
                        ${this.userInputValue || '?'}
                    </div>
                </div>
            </div>`;
        this.elements.instruction.innerText = "Cuenta las frutas y escribe el total";
    }

    // --- VECINOS (Casas) ---
    genVecinos() {
        const maxNum = this.currentDifficulty === 1 ? 18 : (this.currentDifficulty === 2 ? 48 : 97);
        this.val1 = Math.floor(Math.random() * maxNum) + 2;
        this.vecinoInputs = { before: '', after: '' };
        this.activeVecino = 'before';
        this.renderVecinos();
    }

    renderVecinos() {
        const houseStyle = 'display:flex; flex-direction:column; align-items:center;';
        const roofStyle = 'width:0; height:0; border-left:40px solid transparent; border-right:40px solid transparent;';
        const bodyStyle = 'width:70px; height:60px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:bold; border-radius:4px;';

        this.elements.exerciseContainer.innerHTML = `
            <div style="display:flex; align-items:flex-end; gap:1.5rem; justify-content:center;" class="animate-pop">
                <div style="${houseStyle}" onclick="app.setActiveVecino('before')">
                    <div style="${roofStyle} border-bottom:35px solid #dc2626;"></div>
                    <div style="${bodyStyle} background:#fed7aa; border:3px solid ${this.activeVecino === 'before' ? 'var(--primary)' : '#f97316'}; cursor:pointer;">
                        ${this.vecinoInputs.before || '?'}
                    </div>
                </div>
                <div style="${houseStyle}">
                    <div style="${roofStyle} border-bottom:45px solid #22c55e;"></div>
                    <div style="${bodyStyle} background:#fef08a; border:3px solid #eab308; font-size:2rem; height:70px; width:80px;">
                        ${this.val1}
                    </div>
                </div>
                <div style="${houseStyle}" onclick="app.setActiveVecino('after')">
                    <div style="${roofStyle} border-bottom:35px solid #dc2626;"></div>
                    <div style="${bodyStyle} background:#fed7aa; border:3px solid ${this.activeVecino === 'after' ? 'var(--primary)' : '#f97316'}; cursor:pointer;">
                        ${this.vecinoInputs.after || '?'}
                    </div>
                </div>
            </div>`;
        this.elements.instruction.innerText = "¿Qué números viven al lado?";
    }

    setActiveVecino(v) { this.activeVecino = v; this.renderVecinos(); }

    // --- RELOJ ---
    genReloj() {
        // Nivel 1: horas en punto, Nivel 2: y media, Nivel 3: cuartos
        this.relojHora = Math.floor(Math.random() * 12) + 1;
        if (this.currentDifficulty === 1) {
            this.relojMinutos = 0;
        } else if (this.currentDifficulty === 2) {
            this.relojMinutos = Math.random() > 0.5 ? 0 : 30;
        } else {
            this.relojMinutos = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
        }
        this.renderReloj();
    }

    renderReloj() {
        const h = this.relojHora;
        const m = this.relojMinutos;
        // Calcular ángulos de las manecillas
        const hourAngle = (h % 12) * 30 + m * 0.5 - 90;
        const minAngle = m * 6 - 90;

        // Generar opciones de respuesta
        let options = [];
        const correctText = m === 0 ? `${h}:00` : `${h}:${m < 10 ? '0' + m : m}`;
        options.push(correctText);
        // Añadir distractores
        for (let i = 0; i < 3; i++) {
            let fakeH = Math.floor(Math.random() * 12) + 1;
            let fakeM = this.currentDifficulty === 1 ? 0 : [0, 15, 30, 45][Math.floor(Math.random() * 4)];
            let fakeText = fakeM === 0 ? `${fakeH}:00` : `${fakeH}:${fakeM < 10 ? '0' + fakeM : fakeM}`;
            if (!options.includes(fakeText)) options.push(fakeText);
        }
        while (options.length < 4) options.push(`${Math.floor(Math.random() * 12) + 1}:00`);
        options = options.sort(() => Math.random() - 0.5);

        this.elements.exerciseContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:1.5rem;" class="animate-pop">
                <svg width="150" height="150" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="white" stroke="var(--primary)" stroke-width="4"/>
                    ${[12, 3, 6, 9].map((n, i) => `<text x="${50 + 35 * Math.sin(i * Math.PI / 2)}" y="${55 - 35 * Math.cos(i * Math.PI / 2)}" text-anchor="middle" font-size="10" font-weight="bold">${n}</text>`).join('')}
                    <line x1="50" y1="50" x2="${50 + 25 * Math.cos(hourAngle * Math.PI / 180)}" y2="${50 + 25 * Math.sin(hourAngle * Math.PI / 180)}" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
                    <line x1="50" y1="50" x2="${50 + 35 * Math.cos(minAngle * Math.PI / 180)}" y2="${50 + 35 * Math.sin(minAngle * Math.PI / 180)}" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="50" cy="50" r="3" fill="#ef4444"/>
                </svg>
                <div style="display:flex; gap:0.75rem; flex-wrap:wrap; justify-content:center;">
                    ${options.map(opt => `<button onclick="app.checkReloj('${opt}')" class="btn-nav" style="padding:0.75rem 1.5rem; font-size:1.2rem; font-weight:bold;">${opt}</button>`).join('')}
                </div>
            </div>`;
        this.elements.instruction.innerText = "¿Qué hora marca el reloj?";
    }

    checkReloj(answer) {
        if (this.roundFinished) return;
        const m = this.relojMinutos;
        const correct = m === 0 ? `${this.relojHora}:00` : `${this.relojHora}:${m < 10 ? '0' + m : m}`;
        this.handleFeedback(answer === correct);
    }

    // --- PUZZLE NUMÉRICO (Series) ---
    genPuzzle() {
        // Nivel 1: 0-20, Nivel 2: 0-50, Nivel 3: 0-99
        const maxStart = this.currentDifficulty === 1 ? 15 : (this.currentDifficulty === 2 ? 45 : 94);
        const isAscending = Math.random() > 0.3; // 70% ascendente
        this.puzzleAscending = isAscending;

        const start = Math.floor(Math.random() * maxStart) + (isAscending ? 1 : 5);
        this.puzzleSeries = [];
        this.puzzleMissingIndex = Math.floor(Math.random() * 5); // 5 números en la serie

        for (let i = 0; i < 5; i++) {
            this.puzzleSeries.push(isAscending ? start + i : start - i);
        }
        this.puzzleAnswer = this.puzzleSeries[this.puzzleMissingIndex];
        this.renderPuzzle();
    }

    renderPuzzle() {
        const dir = this.puzzleAscending ? '↗️ Subiendo' : '↘️ Bajando';

        this.elements.exerciseContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:1.5rem;" class="animate-pop">
                <div style="font-size:1.2rem; color:var(--neutral-500);">${dir}</div>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    ${this.puzzleSeries.map((num, i) => {
            if (i === this.puzzleMissingIndex) {
                return `<div style="width:60px; height:60px; background:#fef3c7; border:3px solid var(--primary); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:bold;">${this.userInputValue || '?'}</div>`;
            }
            return `<div style="width:60px; height:60px; background:#dbeafe; border:2px solid #3b82f6; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:bold;">${num}</div>`;
        }).join('')}
                </div>
            </div>`;
        this.elements.instruction.innerText = "¿Qué número falta en la serie?";
    }

    // --- Renderers (Horizontal Layouts) ---

    renderLectura() {
        // Mostrar palabra escrita -> el niño teclea el número
        this.elements.exerciseContainer.innerHTML = `
            <div style="display:flex; flex-direction:row; align-items:center; justify-content:center; gap:2rem;" class="animate-pop">
                <div class="cursive-text" style="font-size:3rem;">${this.getColoredWord(this.val1)}</div>
                <span style="font-size:2rem; color:var(--neutral-300);">→</span>
                <div class="number-box" style="min-width:100px; border:3px solid var(--primary); border-radius:12px; padding:0.5rem;">${this.userInputValue || '?'}</div>
            </div>`;
        this.elements.instruction.innerText = "Escribe el número";
    }

    setActiveField(f) { this.activeField = f; this.renderBloques(); }

    renderBloques() {
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center gap-6 w-full animate-pop" style="min-height: 120px; display:flex; flex-direction:row; flex-wrap:nowrap; align-items:center; justify-content:center;">
                <div style="display:flex; align-items:flex-end;">${this.getSticks(this.val1, '#1e3a8a')}</div>
                <span class="text-4xl" style="color:var(--neutral-300); font-weight:lighter;">=</span>
                <div class="flex-row gap-4 items-center" style="display:flex; flex-direction:row; align-items:center; gap:1rem;">
                    <div onclick="app.setActiveField('pures')" class="input-box-field tens-border ${this.activeField === 'pures' ? 'active' : ''}">${this.lectInputs.pures ? `<span class="tens">${this.lectInputs.pures}</span>` : ''}</div>
                    <div onclick="app.setActiveField('units')" class="input-box-field units-border ${this.activeField === 'units' ? 'active' : ''}">${this.lectInputs.units ? `<span class="units">${this.lectInputs.units}</span>` : ''}</div>
                    <span class="text-xl" style="color:var(--neutral-300)">=</span>
                    <div onclick="app.setActiveField('total')" class="input-box-field total-border ${this.activeField === 'total' ? 'active' : ''}">${this.lectInputs.total}</div>
                </div>
            </div>`;
        this.elements.instruction.innerText = "Cuenta los bloques";
    }

    renderRepresenta() {
        // Generar cubos azules dinámicamente según userBlocks.units
        let unitCubes = '';
        for (let i = 0; i < this.userBlocks.units; i++) {
            unitCubes += '<div class="unit-cube" style="width:20px; height:20px; background:var(--primary); border:1px solid #1e3a8a; margin:2px;"></div>';
        }

        // Generar barras rojas dinámicamente según userBlocks.tens
        let tenBars = '';
        for (let i = 0; i < this.userBlocks.tens; i++) {
            tenBars += '<div class="ten-bar" style="width:14px; height:60px; margin:2px;"><div class="bar-segment"></div>'.repeat(1) + '</div>';
        }

        this.elements.exerciseContainer.innerHTML = `
            <div style="display:flex; flex-direction:row; align-items:center; justify-content:center; gap:2rem;" class="animate-pop">
                <div class="number-box" style="font-size:4rem;">${this.val1}</div>
                <span style="font-size:2rem; color:var(--neutral-300);">→</span>
                <div style="display:flex; flex-direction:row; align-items:flex-start; gap:1.5rem;">
                    <div class="interactive-block tens-block" style="min-width:80px; text-align:center;">
                        <div style="display:flex; flex-wrap:wrap; justify-content:center; min-height:70px;">${tenBars || '<span style="color:var(--neutral-300);">0</span>'}</div>
                        <div style="display:flex; gap:8px; margin-top:8px;">
                            <button onclick="adjustBlock('tens',1)" class="btn-adjust btn-plus">+</button>
                            <button onclick="adjustBlock('tens',-1)" class="btn-adjust btn-minus">-</button>
                        </div>
                        <div class="tens font-bold" style="margin-top:4px;">${this.userBlocks.tens} D</div>
                    </div>
                    <div class="interactive-block units-block" style="min-width:80px; text-align:center;">
                        <div style="display:flex; flex-wrap:wrap; justify-content:center; min-height:70px;">${unitCubes || '<span style="color:var(--neutral-300);">0</span>'}</div>
                        <div style="display:flex; gap:8px; margin-top:8px;">
                            <button onclick="adjustBlock('units',1)" class="btn-adjust btn-plus-u">+</button>
                            <button onclick="adjustBlock('units',-1)" class="btn-adjust btn-minus-u">-</button>
                        </div>
                        <div class="units font-bold" style="margin-top:4px;">${this.userBlocks.units} U</div>
                    </div>
                </div>
            </div>`;
        this.elements.instruction.innerText = "Representa el número";
    }

    renderStandard(colorClass = "text-blue-600") {
        const showS = (this.currentDifficulty === 1 || (this.currentDifficulty === 2 && this.showSticksIA));
        const s1 = showS ? this.getSticks(this.val1, '#1e3a8a') : '';
        const s2 = showS ? this.getSticks(this.val2, this.gameMode === 'sumas' ? '#1e3a8a' : '#dc2626') : '';

        // Ensure horizontal flow for sums/subtractions too
        this.elements.exerciseContainer.innerHTML = `
            <div class="animate-pop w-full" style="display:grid; grid-template-columns: repeat(5, auto); align-items:center; justify-content:center; gap:10px;">
                <div class="flex-col items-center">${this.formatNumber(this.val1)}${s1}</div>
                <div class="op-symbol" style="justify-self: center;">${this.gameMode === 'sumas' ? '＋' : '－'}</div>
                <div class="flex-col items-center">${this.formatNumber(this.val2)}${s2}</div>
                <span class="op-symbol" style="justify-self: center;">＝</span>
                <div class="number-box" style="color:var(--primary); min-width:80px; border-bottom:3px solid var(--neutral-100);">${this.userInputValue || '?'}</div>
            </div>`;
    }

    renderAntPost() {
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center gap-3 animate-pop" style="display:flex; flex-direction:row; align-items:center; justify-content:center;">
                <div onclick="app.setActiveAntPost('before')" class="input-box-field total-border ${this.activeAntPost === 'before' ? 'active' : ''}">${this.antPostInputs.before}</div>
                <span class="text-xl" style="color:var(--neutral-300); opacity:0.5;">&lt;</span>
                <div class="central-number-card">${this.val1}</div>
                <span class="text-xl" style="color:var(--neutral-300); opacity:0.5;">&lt;</span>
                <div onclick="app.setActiveAntPost('after')" class="input-box-field total-border ${this.activeAntPost === 'after' ? 'active' : ''}">${this.antPostInputs.after}</div>
            </div>`;
        this.elements.instruction.innerText = "Toca una casilla y escribe";
    }

    renderComparar(signClass = "text-gray-400") {
        let midContent = "";
        if (this.userSelectedSymbol) {
            if (this.userSelectedSymbol === '=') midContent = `<span class="${signClass} font-bold text-7xl md:text-9xl">=</span>`;
            else midContent = this.getComparisonSVG(this.userSelectedSymbol === '>' ? 'gt' : 'lt', true, signClass.includes('correct') ? '#22c55e' : '#facc15');
        } else {
            midContent = `<span class="text-7xl md:text-9xl font-bold" style="color:var(--neutral-300)">?</span>`;
        }
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center gap-10 animate-pop" style="display:flex; flex-direction:row; align-items:center; justify-content:center; gap:2.5rem;">
                <div>${this.formatNumber(this.val1, true)}</div>
                <div class="flex-row items-center justify-center" style="min-width: 120px;">${midContent}</div>
                <div>${this.formatNumber(this.val2, true)}</div>
            </div>`;
    }

    // --- Handling Input & Game Logic ---

    // ... (Same logic for handleDice, pressNum, backspace, adjustBlock as before, just updated class names if needed)
    handleDice(id) {
        if (this.roundFinished) { this.resetRound(); return; }
        if (this.isRolling[id]) return;
        this.isRolling[id] = true;
        const slot = document.getElementById(`dice-slot-${id}`);
        slot.classList.add('dice-rolling');
        let t = 0;
        const int = setInterval(() => {
            slot.innerHTML = this.getDiceSVG(Math.floor(Math.random() * 6) + 1);
            this.playSound('tick');
            if (++t > 7) {
                clearInterval(int);
                slot.classList.remove('dice-rolling');
                const maxVal = this.currentDifficulty === 1 ? 12 : (this.currentDifficulty === 2 ? 35 : 50);
                const val = Math.floor(Math.random() * maxVal) + 1;
                if (id === 1) this.val1 = val; else this.val2 = val;

                if (val <= 6) slot.innerHTML = this.getDiceSVG(val);
                else slot.innerHTML = `<span class="dice-number">${val}</span>`;

                this.isRolling[id] = false;
                if (this.val1 !== null && this.val2 !== null) {
                    // Para RESTAS: asegurar que val1 >= val2 (nunca negativo)
                    if (this.gameMode === 'restas' && this.val1 < this.val2) {
                        const temp = this.val1;
                        this.val1 = this.val2;
                        this.val2 = temp;
                        // Actualizar visualmente los dados
                        document.getElementById('dice-slot-1').innerHTML = this.val1 <= 6 ? this.getDiceSVG(this.val1) : `<span class="dice-number">${this.val1}</span>`;
                        document.getElementById('dice-slot-2').innerHTML = this.val2 <= 6 ? this.getDiceSVG(this.val2) : `<span class="dice-number">${this.val2}</span>`;
                    }
                    if (this.gameMode === 'comparar') this.renderComparar();
                    else this.renderStandard();

                    const btn = document.getElementById('btn-ia-story');
                    if (this.apiKey && btn) btn.style.display = 'block';
                }
            }
        }, 100);
    }

    pressNum(n) {
        if (this.roundFinished || this.gameMode.includes('representa')) return;
        if (this.gameMode === 'bloques') {
            if (this.lectInputs[this.activeField].length < 3) {
                this.lectInputs[this.activeField] += n;
                this.renderBloques();
            }
        } else if (this.gameMode === 'lectura' || this.gameMode === 'batido' || this.gameMode === 'puzzle') {
            if (this.userInputValue.length < 3) {
                this.userInputValue += n;
                if (this.gameMode === 'lectura') this.renderLectura();
                else if (this.gameMode === 'batido') this.renderBatido();
                else this.renderPuzzle();
            }
        } else if (this.gameMode === 'antpost') {
            if (this.antPostInputs[this.activeAntPost].length < 3) {
                this.antPostInputs[this.activeAntPost] += n;
                this.renderAntPost();
            }
        } else if (this.gameMode === 'vecinos') {
            if (this.vecinoInputs[this.activeVecino].length < 3) {
                this.vecinoInputs[this.activeVecino] += n;
                this.renderVecinos();
            }
        } else {
            if (this.userInputValue.length < 3) {
                this.userInputValue += n;
                this.renderStandard();
            }
        }
        this.playSound('tick');
    }

    backspace() {
        if (this.roundFinished || this.gameMode.includes('representa')) return;
        if (this.gameMode === 'bloques') {
            this.lectInputs[this.activeField] = this.lectInputs[this.activeField].slice(0, -1);
            this.renderBloques();
        } else if (this.gameMode === 'lectura' || this.gameMode === 'batido' || this.gameMode === 'puzzle') {
            this.userInputValue = this.userInputValue.slice(0, -1);
            if (this.gameMode === 'lectura') this.renderLectura();
            else if (this.gameMode === 'batido') this.renderBatido();
            else this.renderPuzzle();
        } else if (this.gameMode === 'antpost') {
            this.antPostInputs[this.activeAntPost] = this.antPostInputs[this.activeAntPost].slice(0, -1);
            this.renderAntPost();
        } else if (this.gameMode === 'vecinos') {
            this.vecinoInputs[this.activeVecino] = this.vecinoInputs[this.activeVecino].slice(0, -1);
            this.renderVecinos();
        } else {
            this.userInputValue = this.userInputValue.slice(0, -1);
            this.renderStandard();
        }
    }

    adjustBlock(type, amount) {
        if (this.roundFinished) return;
        if (type === 'tens') this.userBlocks.tens = Math.max(0, this.userBlocks.tens + amount);
        else this.userBlocks.units = Math.max(0, this.userBlocks.units + amount);
        this.renderRepresenta();
        this.playSound('tick');
    }

    checkAnswer() {
        if (this.roundFinished) return;
        let ok = false;
        const d = Math.floor(this.val1 / 10);
        const u = this.val1 % 10;

        switch (this.gameMode) {
            case 'lectura':
                ok = (parseInt(this.userInputValue) === this.val1);
                break;
            case 'bloques':
                const bDec = parseInt(this.lectInputs.pures) || 0;
                const bUni = parseInt(this.lectInputs.units) || 0;
                const bTot = parseInt(this.lectInputs.total) || 0;
                ok = (bDec === d && bUni === u && bTot === this.val1);
                break;
            case 'representa':
                ok = (this.userBlocks.tens === d && this.userBlocks.units === u);
                break;
            case 'antpost':
                ok = (parseInt(this.antPostInputs.before) === this.val1 - 1 &&
                    parseInt(this.antPostInputs.after) === this.val1 + 1);
                break;
            case 'batido':
                ok = (parseInt(this.userInputValue) === this.batidoTarget);
                break;
            case 'vecinos':
                ok = (parseInt(this.vecinoInputs.before) === this.val1 - 1 &&
                    parseInt(this.vecinoInputs.after) === this.val1 + 1);
                break;
            case 'puzzle':
                ok = (parseInt(this.userInputValue) === this.puzzleAnswer);
                break;
            default:
                if (this.val1 === null || this.val2 === null) return;
                const expected = this.gameMode === 'sumas' ? this.val1 + this.val2 : this.val1 - this.val2;
                ok = parseInt(this.userInputValue) === expected;
        }
        this.handleFeedback(ok);
        if (ok && !['lectura', 'bloques', 'representa', 'antpost', 'batido', 'vecinos', 'puzzle', 'reloj'].includes(this.gameMode)) {
            this.renderStandard("res-correct");
        }
    }

    checkComparison(symbol) {
        if (this.roundFinished) return;
        this.userSelectedSymbol = symbol;
        const correct = this.val1 < this.val2 ? '<' : (this.val1 > this.val2 ? '>' : '=');
        const ok = symbol === correct;
        this.handleFeedback(ok);
        this.renderComparar(ok ? "res-correct" : "res-incorrect");
    }

    handleFeedback(ok) {
        if (ok) {
            this.score += 10;
            this.elements.score.innerText = this.score;
            this.elements.instruction.innerHTML = "<span class='feedback-success'>¡EXCELENTE! ✨</span>";
            this.roundFinished = true;
            this.playSound('applause');
        } else {
            this.playSound('fail');
            this.elements.instruction.innerHTML = "<span class='feedback-error'>¡Inténtalo de nuevo! 💡</span>";
        }
    }

    setActiveAntPost(p) { this.activeAntPost = p; this.renderAntPost(); }

    renderCamino() {
        const pg = document.getElementById('page-badge');
        pg.innerText = `SERIE de ${this.caminoSettings.step} en ${this.caminoSettings.step}`;
        pg.classList.remove('hidden');

        const rows = this.caminoSettings.rows;
        const cols = this.caminoSettings.cols;
        const mode = this.caminoSettings.displayMode;

        // Crear grid 2D para posiciones
        this.caminoGrid = [];
        let numIndex = 0;

        if (mode === 'ordered') {
            // Fila por fila, izquierda a derecha
            for (let r = 0; r < rows; r++) {
                let row = [];
                for (let c = 0; c < cols; c++) {
                    row.push(this.caminoNumbers[numIndex++]);
                }
                this.caminoGrid.push(row);
            }
        } else if (mode === 'snake') {
            // Serpiente: filas alternas van en dirección opuesta
            for (let r = 0; r < rows; r++) {
                let row = [];
                for (let c = 0; c < cols; c++) {
                    row.push(this.caminoNumbers[numIndex++]);
                }
                if (r % 2 === 1) row.reverse();  // Invertir filas impares
                this.caminoGrid.push(row);
            }
        } else if (mode === 'path') {
            // Camino: cada número adyacente al anterior (genera un recorrido aleatorio)
            let grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
            let pos = { r: 0, c: 0 };
            let visited = new Set();

            for (let i = 0; i < this.caminoNumbers.length; i++) {
                grid[pos.r][pos.c] = this.caminoNumbers[i];
                visited.add(`${pos.r},${pos.c}`);

                // Buscar siguiente posición adyacente libre
                const dirs = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];
                const shuffledDirs = dirs.sort(() => Math.random() - 0.5);
                let found = false;
                for (let d of shuffledDirs) {
                    const nr = pos.r + d.r, nc = pos.c + d.c;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(`${nr},${nc}`)) {
                        pos = { r: nr, c: nc };
                        found = true;
                        break;
                    }
                }
                if (!found) break;  // No hay más posiciones libres
            }
            this.caminoGrid = grid;
        } else {
            // Random: mezclar completamente
            let shuffled = [...this.caminoNumbers].sort(() => Math.random() - 0.5);
            let idx = 0;
            for (let r = 0; r < rows; r++) {
                let row = [];
                for (let c = 0; c < cols; c++) {
                    row.push(shuffled[idx++]);
                }
                this.caminoGrid.push(row);
            }
        }

        // Panel de controles
        const isMode = (m) => this.caminoSettings.displayMode === m ? 'background:var(--primary); color:white;' : '';
        const controls = `
            <div style="display:flex; gap:0.75rem; flex-wrap:wrap; justify-content:center; margin-bottom:0.75rem; padding:0.5rem; background:rgba(255,255,255,0.5); border-radius:8px; font-size:0.7rem;">
                <div style="display:flex; align-items:center; gap:4px;">
                    <span style="font-weight:bold;">Filas:</span>
                    <button onclick="app.setCaminoSetting('rows', app.caminoSettings.rows-1)" class="btn-adjust" style="width:22px;height:22px;">-</button>
                    <span style="min-width:16px; text-align:center;">${rows}</span>
                    <button onclick="app.setCaminoSetting('rows', app.caminoSettings.rows+1)" class="btn-adjust" style="width:22px;height:22px;">+</button>
                </div>
                <div style="display:flex; align-items:center; gap:4px;">
                    <span style="font-weight:bold;">Cols:</span>
                    <button onclick="app.setCaminoSetting('cols', app.caminoSettings.cols-1)" class="btn-adjust" style="width:22px;height:22px;">-</button>
                    <span style="min-width:16px; text-align:center;">${cols}</span>
                    <button onclick="app.setCaminoSetting('cols', app.caminoSettings.cols+1)" class="btn-adjust" style="width:22px;height:22px;">+</button>
                </div>
                <div style="display:flex; align-items:center; gap:3px;">
                    <button onclick="app.setCaminoSetting('displayMode', 'ordered')" class="btn-nav" style="padding:3px 6px; font-size:0.6rem; ${isMode('ordered')}">Ordenado</button>
                    <button onclick="app.setCaminoSetting('displayMode', 'snake')" class="btn-nav" style="padding:3px 6px; font-size:0.6rem; ${isMode('snake')}">Serpiente</button>
                    <button onclick="app.setCaminoSetting('displayMode', 'path')" class="btn-nav" style="padding:3px 6px; font-size:0.6rem; ${isMode('path')}">Camino</button>
                    <button onclick="app.setCaminoSetting('displayMode', 'random')" class="btn-nav" style="padding:3px 6px; font-size:0.6rem; ${isMode('random')}">Mezclado</button>
                </div>
                <div style="display:flex; align-items:center; gap:3px;">
                    <button onclick="app.setCaminoSetting('step', 1)" class="btn-nav" style="padding:3px 6px; font-size:0.6rem; ${this.caminoSettings.step === 1 ? 'background:var(--success); color:white;' : ''}">1en1</button>
                    <button onclick="app.setCaminoSetting('step', 2)" class="btn-nav" style="padding:3px 6px; font-size:0.6rem; ${this.caminoSettings.step === 2 ? 'background:var(--success); color:white;' : ''}">2en2</button>
                    <button onclick="app.setCaminoSetting('step', 5)" class="btn-nav" style="padding:3px 6px; font-size:0.6rem; ${this.caminoSettings.step === 5 ? 'background:var(--success); color:white;' : ''}">5en5</button>
                </div>
            </div>`;

        // Calcular tamaño de burbujas en función de filas y columnas
        const maxGridHeight = 300; // altura máxima disponible para el grid
        const maxGridWidth = 500;  // ancho máximo disponible
        const gap = 6;
        const bubbleHeight = Math.floor((maxGridHeight - (rows - 1) * gap) / rows);
        const bubbleWidth = Math.floor((maxGridWidth - (cols - 1) * gap) / cols);
        const bubbleSize = Math.min(bubbleHeight, bubbleWidth, 70); // máximo 70px
        const fontSize = bubbleSize > 40 ? '1.2rem' : (bubbleSize > 25 ? '0.9rem' : '0.7rem');

        // Generar grid visual
        let grid = `<div style="display:grid; grid-template-columns:repeat(${cols}, ${bubbleSize}px); gap:${gap}px; justify-content:center;">`;
        for (let r = 0; r < this.caminoGrid.length; r++) {
            for (let c = 0; c < this.caminoGrid[r].length; c++) {
                const num = this.caminoGrid[r][c];
                if (num === null) {
                    grid += `<div style="width:${bubbleSize}px; height:${bubbleSize}px;"></div>`;
                } else {
                    const isPassed = num < this.currentPathNum;
                    grid += `<div onclick="clickCamino(${num}, this)" class="camino-btn ${isPassed ? 'active-path' : ''}" style="width:${bubbleSize}px; height:${bubbleSize}px; display:flex; align-items:center; justify-content:center; font-size:${fontSize};">${num}</div>`;
                }
            }
        }
        grid += '</div>';

        this.elements.exerciseContainer.innerHTML = controls + grid;
        this.elements.instruction.innerText = `Busca el ${this.currentPathNum}`;
    }

    clickCamino(n, el) {
        if (this.roundFinished || el.classList.contains('active-path')) return;
        if (n === this.currentPathNum) {
            el.classList.add('active-path');
            this.playSound('tick');
            this.currentPathNum += this.caminoSettings.step;
            const done = this.currentPathNum > this.caminoEnd;
            if (done) {
                this.score += 50;
                this.handleFeedback(true);
            } else {
                this.elements.instruction.innerText = `Busca el ${this.currentPathNum}`;
            }
        } else {
            el.classList.add('shake');
            setTimeout(() => el.classList.remove('shake'), 300);
            this.playSound('fail');
        }
    }

    // --- Helpers ---

    formatNumber(num, isGiant = false) {
        if (num === null) return '';
        const baseClass = isGiant ? 'number-box-giant' : 'number-box';
        const c = Math.floor(num / 100), d = Math.floor((num % 100) / 10), u = num % 10;
        return `
            <div class="flex-col items-center">
                <div class="flex-row ${baseClass}">
                    ${c > 0 ? `<span class="hundreds">${c}</span>` : ''}
                    ${d > 0 || c > 0 ? `<span class="tens">${d}</span>` : ''}
                    <span class="units">${u}</span>
                </div>
                <div class="flex-row label-guide">
                    ${c > 0 ? `<span class="hundreds">C</span>` : ''}
                    ${d > 0 || c > 0 ? `<span class="tens">D</span>` : ''}
                    <span class="units">U</span>
                </div>
            </div>`;
    }

    getSticks(num, color) {
        let s = `<div class="sticks-container">`;
        const d = Math.floor(num / 10), u = num % 10;
        for (let i = 0; i < d; i++) s += `<div class="ten-bar flex-shrink-0">${'<div class="bar-segment"></div>'.repeat(10)}</div>`;
        if (u > 0 || (d > 0 && u === 0)) { s += `<div class="unit-stack flex-shrink-0">`; for (let i = 0; i < u; i++) s += `<div class="unit-cube"></div>`; s += `</div>`; }
        return s + `</div>`;
    }

    getDiceSVG(v) {
        const dots = { 1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[25, 25], [50, 50], [75, 75]], 4: [[30, 30], [70, 30], [30, 70], [70, 70]], 5: [[25, 25], [75, 25], [25, 75], [75, 75], [50, 50]], 6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]] };
        let s = `<svg viewBox="0 0 100 100" class="dice-svg"><rect width="100" height="100" rx="18" fill="white" stroke="#3b82f6" stroke-width="8"/>`;
        dots[v].forEach(d => s += `<circle cx="${d[0]}" cy="${d[1]}" r="8" fill="#1e3a8a"/>`); return s + `</svg>`;
    }

    getComparisonSVG(type, isBig = false, colorOverride = null) {
        const size = isBig ? 120 : 60;
        const color = colorOverride || (type === 'gt' ? '#dc2626' : '#2563eb');
        const path = type === 'gt' ? "M30 20 L75 50 L30 80" : "M75 20 L30 50 L75 80";
        let elements = `<path d="${path}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
        if (this.currentDifficulty === 1 && type === 'gt') {
            elements += `<polygon points="33,26 43,26 38,36" fill="black" /><polygon points="43,32 53,32 48,42" fill="black" /><polygon points="53,38 63,38 58,48" fill="black" /><polygon points="33,74 43,74 38,64" fill="black" /><polygon points="43,68 53,68 48,58" fill="black" /><polygon points="53,62 63,62 58,52" fill="black" />`;
        }
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100">${elements}</svg>`;
    }

    getColoredWord(n) {
        const units = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
        const teens = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
        const tens = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
        if (n < 10) return `<span class="word-units">${units[n]}</span>`;
        if (n === 100) return `<span class="word-tens">cien</span>`;
        let d = Math.floor(n / 10), u = n % 10;
        if (d === 1) return (u <= 5) ? `<span class="word-tens">${teens[u]}</span>` : `<span class="word-tens">dieci</span><span class="word-units">${units[u]}</span>`;
        if (d === 2) { const accents = { 2: "dós", 3: "trés", 6: "séis" }; if (u === 0) return `<span class="word-tens">veinte</span>`; return `<span class="word-tens">veinti</span><span class="word-units">${accents[u] || units[u]}</span>`; }
        return `<span class="word-tens">${tens[d]}</span>${u > 0 ? ` y <span class="word-units">${units[u]}</span>` : ''}`;
    }

    toggleSticks() {
        this.showSticksIA = !this.showSticksIA;
        this.elements.toggleSticks.innerText = `APOYO: ${this.showSticksIA ? 'ON' : 'OFF'}`;
        if (this.val1 && this.val2) this.renderStandard();
    }

    async getStory() {
        if (!this.val1 || !this.val2) return;
        this.elements.geminiModal.style.display = 'flex';
        this.elements.iaResponseText.innerText = "El Mago está pensando...";
        // Call internal or external API logic used to be here
        // If user provides key they can use it, otherwise this function is decorative or needs key
        if (!this.apiKey) { this.elements.iaResponseText.innerText = "Configura la API Key en app.js para cuentos."; return; }
        // ... (AI Logic removed as per request to 'remove fun without internet', but keeping the button hook just incase user adds key later manually)
    }

    // --- Pizarra ---
    initPizarra() {
        this.drawing = false;
        if (!this.elements.canvas) return;
        const getP = (e) => { const r = this.elements.canvas.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top; return { x, y }; };
        const start = (e) => { if (e.touches) e.preventDefault(); this.drawing = true; this.elements.ctx.beginPath(); const p = getP(e); this.elements.ctx.moveTo(p.x, p.y); };
        const move = (e) => { if (e.touches) e.preventDefault(); if (!this.drawing) return; const p = getP(e); this.elements.ctx.lineTo(p.x, p.y); this.elements.ctx.stroke(); };
        const end = () => this.drawing = false;
        this.elements.canvas.addEventListener('mousedown', start);
        this.elements.canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        this.elements.canvas.addEventListener('touchstart', start, { passive: false });
        this.elements.canvas.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', end);
    }
    resizeCanvas() {
        if (!this.elements.canvas) return;
        const parent = this.elements.canvas.parentElement;
        if (parent) {
            this.elements.canvas.width = parent.clientWidth;
            this.elements.canvas.height = parent.clientHeight;
            this.elements.ctx.lineCap = 'round';
            this.elements.ctx.lineWidth = 5;
            this.elements.ctx.strokeStyle = '#475569';
        }
    }
    clearCanvas() { if (this.elements.ctx) this.elements.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height); }

    playSound(t) {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        const a = new (window.AudioContext || window.webkitAudioContext)();
        const o = a.createOscillator(); const g = a.createGain(); o.connect(g); g.connect(a.destination);
        if (t === 'tick') { o.frequency.value = 600; g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.1); o.start(); o.stop(a.currentTime + 0.1); }
        else if (t === 'applause') { o.frequency.value = 523; g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.6); o.start(); o.stop(a.currentTime + 0.6); }
        else { o.frequency.value = 150; g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.3); o.start(); o.stop(a.currentTime + 0.3); }
    }

    // Stub for readText if needed
    readText(t) { }
}

const app = new MathApp();
