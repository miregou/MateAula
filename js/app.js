/**
 * MateAula Pro - Application Logic v8.2
 * Optimized for Cross-Browser Stability & Accessibility
 */

class MathApp {
    constructor() {
        this.score = 0;
        this.currentDifficulty = 1;
        this.gameMode = 'sumas';
        this.val1 = null;
        this.val2 = null;
        this.roundFinished = false;

        this.userInputValue = "";
        this.userSelectedSymbol = null;
        this.lectInputs = { pures: "", units: "", total: "" };
        this.activeField = 'pures';
        this.userBlocks = { tens: 0, units: 0 };
        this.antPostInputs = { before: "", after: "" };
        this.activeAntPost = 'before';

        this.caminoSettings = { rows: 4, cols: 5, mode: 'ordered', step: 1, direction: 'forward' };
        this.puzzleSettings = { mode: 'ordered', step: 1 };
        this.caminoNumbers = [];
        this.caminoGrid = [];

        // Global Activity Configuration (Dice, Whiteboard, Visual Aids)
        this.config = {
            diceVisible: true,           // Show/Hide dice in activities
            pizarraVisible: true,        // Show/Hide whiteboard
            visualAidsEnabled: true,     // Show/Hide sticks/blocks representations
            showSticks: true             // Specifically for sticks in number activities
        };

        this.isRolling = { 1: false, 2: false };
        this.showSticksIA = this.config.showSticks;

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

        this.activityNames = {
            sumas: 'Sumas', restas: 'Restas', comparar: 'Compara', antpost: 'Ant. y Post.',
            lectura: 'Nº Escritos', bloques: 'Bloques', representa: 'Representa',
            camino1: 'Camino', batido: 'Batido', vecinos: 'Vecinos', reloj: 'Reloj', puzzle: 'Puzzle'
        };

        this.init();

        window.addEventListener('message', (event) => {
            if (event.data.type === 'INIT_USER') {
                this.score = event.data.user.points || 0;
                this.elements.score.innerText = this.score;
            }
        });
    }

    init() {
        this.bindEvents();
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initPizarraWhenReady());
        } else {
            this.initPizarraWhenReady();
        }
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    initPizarraWhenReady() {
        setTimeout(() => {
            if (this.elements.canvas) {
                this.initPizarra();
                console.log('✅ Pizarra inicializada correctamente');
            } else {
                console.warn('⚠️ Canvas no encontrado, reintentando...');
                setTimeout(() => this.initPizarraWhenReady(), 200);
            }
        }, 100);
    }

    bindEvents() {
        window.startActivity = (mode) => this.startActivity(mode);
        window.goToMenu = () => this.goToMenu();
        window.setDifficulty = (d) => this.setDifficulty(d);
        window.resetRound = () => this.resetRound();
        window.clearCanvas = () => this.clearCanvas();
        window.pressNum = (n) => this.pressNum(n);
        window.backspace = () => this.backspace();
        window.checkAnswer = () => this.checkAnswer();
        window.checkAnswerIA = () => this.checkAnswer(); // Fix for HTML calling checkAnswerIA
        window.checkComparison = (s) => this.checkComparison(s);
        window.handleDice = (id) => this.handleDice(id);
        window.clickCamino = (n, el) => this.clickCamino(n, el);
        window.adjustBlock = (t, a) => this.adjustBlock(t, a);
        window.setActiveVecino = (v) => this.setActiveVecino(v);
        window.checkReloj = (opt) => this.checkReloj(opt);
        window.generateExercise = () => this.generateExercise();
        window.toggleSticksIA = () => this.toggleSticksIA();
        window.setActiveField = (f) => this.setActiveField(f);
        window.setActiveAntPost = (p) => this.setActiveAntPost(p);
        window.toggleBatidoIngredient = (num) => this.toggleBatidoIngredient(num);
        window.openConfigModal = () => this.openConfigModal();
        window.closeConfigModal = () => this.closeConfigModal();
        window.setConfig = (key, val) => this.setConfig(key, val);
        window.openCurriculumModal = () => this.openCurriculumModal();
        window.closeCurriculumModal = () => this.closeCurriculumModal();

        // Zoom controls
        window.increaseZoom = () => this.increaseZoom();
        window.decreaseZoom = () => this.decreaseZoom();

        // Initialize zoom from localStorage
        this.initZoom();
    }

    // Zoom Control Methods
    initZoom() {
        const savedZoom = localStorage.getItem('mateaula-zoom');
        if (savedZoom) {
            this.setZoom(parseInt(savedZoom));
        } else {
            this.currentZoom = 100;
        }
    }

    increaseZoom() {
        const levels = [75, 90, 100, 110, 125];
        const currentIndex = levels.indexOf(this.currentZoom);
        if (currentIndex < levels.length - 1) {
            this.setZoom(levels[currentIndex + 1]);
        }
    }

    decreaseZoom() {
        const levels = [75, 90, 100, 110, 125];
        const currentIndex = levels.indexOf(this.currentZoom);
        if (currentIndex > 0) {
            this.setZoom(levels[currentIndex - 1]);
        }
    }

    setZoom(level) {
        this.currentZoom = level;
        const scale = level / 100;
        document.body.style.transform = `scale(${scale})`;
        document.body.style.transformOrigin = 'top center';

        // Update display
        const zoomDisplay = document.getElementById('zoom-level');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${level}%`;
        }

        // Save to localStorage
        localStorage.setItem('mateaula-zoom', level);

        // Adjust for overflow when zoomed out
        if (level < 100) {
            document.body.style.minHeight = `${100 / scale}vh`;
        } else {
            document.body.style.minHeight = '100vh';
        }
    }


    openCurriculumModal() {
        const modal = document.getElementById('curriculum-modal');
        const list = document.getElementById('curriculum-list');
        if (!modal || !list) return;

        // Content for the curriculum
        const objectives = [
            "<strong>Sentencia Numérico:</strong> Contar, ordenar y comparar números hasta el 99.",
            "<strong>Cálculo:</strong> Estrategias de suma y resta (fases de la tabla).",
            "<strong>Sentido Espacial:</strong> Orientación en el plano y recorridos.",
            "<strong>Medida:</strong> El reloj (en punto e y media) y estimación temporal.",
            "<strong>Lógica:</strong> Series, clasificación y resolución de problemas."
        ];

        list.innerHTML = objectives.map(obj =>
            `<div class="curriculum-item" style="margin-bottom:10px; padding:10px; background:#f8fafc; border-radius:8px; border-left:4px solid var(--primary);">
                ${obj}
            </div>`
        ).join('');

        modal.style.display = 'flex';
    }

    closeCurriculumModal() {
        const modal = document.getElementById('curriculum-modal');
        if (modal) modal.style.display = 'none';
    }

    startActivity(mode) {
        this.elements.viewMenu.classList.remove('active');
        this.elements.viewGame.classList.add('active');
        // Ensure canvas is sized correctly now that it is visible
        requestAnimationFrame(() => this.resizeCanvas());
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
        // Botón de apoyo siempre visible (activado por petición del usuario)
        // els.toggleSticks.classList.add('hidden');
        document.getElementById('page-badge').classList.add('hidden');

        if (isCamino) {
            els.inputs.gameContainer.classList.add('layout-fullscreen');
            els.inputs.rightPanel.classList.add('hidden');
            els.gameTitle.innerText = "CAMINO MATEMÁTICO";
            els.diceSection.innerHTML = `<button onclick="generateExercise()" class="btn-game-action">Nueva Serie 🎲</button>`;
        } else {
            els.inputs.gameContainer.classList.remove('layout-fullscreen');
            els.inputs.rightPanel.classList.remove('hidden');
            els.gameTitle.innerText = mode.toUpperCase();

            // toggleFocusMode logic inline or helper
            const isFocus = ['bloques', 'representa'].includes(mode);
            const pizarra = document.getElementById('pizarra-container');
            const gameCont = document.getElementById('game-container');
            if (isFocus) {
                pizarra.style.display = 'none';
                gameCont.style.gridTemplateColumns = '1fr 300px';
                // Make left-panel huge
            } else {
                pizarra.style.display = 'block'; // or flex/initial depending on CSS, block is safe usually for div
                gameCont.style.gridTemplateColumns = ''; // Reset to CSS class
            }

            if (mode === 'comparar') {
                els.inputs.numKeypad.classList.add('hidden');
                els.inputs.symbolKeypad.classList.remove('hidden');
            } else {
                els.inputs.numKeypad.classList.remove('hidden');
                els.inputs.symbolKeypad.classList.add('hidden');
            }
            if (mode === 'sumas' || mode === 'restas') {
                els.toggleSticks.classList.remove('hidden');
                els.toggleSticks.innerText = `APOYO: ${this.showSticksIA ? 'ON' : 'OFF'}`;
                els.toggleSticks.classList.toggle('btn-active', this.showSticksIA);
                els.diceSection.innerHTML = `
                    <div id="dice-slot-1" onclick="handleDice(1)" class="dice-slot">❓</div>
                    <div class="op-symbol-small">${mode === 'sumas' ? '＋' : '－'}</div>
                    <div id="dice-slot-2" onclick="handleDice(2)" class="dice-slot">❓</div>
                `;
            } else {
                els.diceSection.innerHTML = `<button onclick="generateExercise()" class="btn-game-action">Nuevo Reto 🎲</button>`;
            }
        }
        if (isCamino || mode === 'puzzle') {
            // Auto open config on first start of these activities
            this.openConfigModal();
        }

        this.generateExercise();
    }

    setDifficulty(d) {
        this.currentDifficulty = d;
        for (let i = 1; i <= 3; i++) this.elements.inputs[`diff${i}`].className = i === d ? 'difficulty-btn active' : 'difficulty-btn';
        this.setGameMode(this.gameMode);
    }

    resetRound() {
        this.generateExercise();
    }

    generateExercise() {
        this.roundFinished = false;
        this.userInputValue = "";
        this.lectInputs = { pures: "", units: "", total: "" };
        this.userBlocks = { tens: 0, units: 0 };
        this.antPostInputs = { before: "", after: "" };
        this.val1 = null; this.val2 = null;
        this.clearCanvas();
        this.elements.instruction.innerText = "Resuelve el reto";
        this.elements.instruction.className = "instruction-pill instruction-active";

        if (this.gameMode === 'lectura') this.genLectura();
        else if (this.gameMode === 'comparar') this.genComparar();
        else if (this.gameMode === 'bloques') this.genBloques();
        else if (this.gameMode === 'representa') this.genRepresenta();
        else if (this.gameMode === 'antpost') this.genAntPost();
        else if (this.gameMode.includes('camino')) this.genCamino();
        else if (this.gameMode === 'batido') this.genBatido();
        else if (this.gameMode === 'vecinos') this.genVecinos();
        else if (this.gameMode === 'reloj') this.genReloj();
        else if (this.gameMode === 'puzzle') this.genPuzzle();
        else this.elements.exerciseContainer.innerHTML = `<div class="placeholder-msg">Lanza los dados</div>`;
    }

    // --- Config Modal Logic ---
    openConfigModal() {
        const modal = document.getElementById('config-modal');
        const title = document.getElementById('config-title');
        const options = document.getElementById('config-options');

        modal.style.display = 'flex';

        if (this.gameMode.includes('camino')) {
            title.innerText = "⚙️ Configuración del Camino";
            this.renderConfigCamino(options);
        } else if (this.gameMode === 'puzzle') {
            title.innerText = "⚙️ Configuración del Puzzle";
            this.renderConfigPuzzle(options);
        } else {
            title.innerText = "⚙️ Configuración de Actividad";
            this.renderConfigGeneral(options);
        }
    }

    renderConfigCamino(container) {
        const s = this.caminoSettings;
        container.innerHTML = `
            <div class="config-group">
                <div class="config-group-title">📏 Tamaño de la Cuadrícula</div>
                <div class="config-input-row">
                    <label>Filas: <input type="number" value="${s.rows}" onchange="setConfig('rows', this.value)" class="config-number-input" min="2" max="10"></label>
                    <label>Columnas: <input type="number" value="${s.cols}" onchange="setConfig('cols', this.value)" class="config-number-input" min="2" max="10"></label>
                </div>
            </div>
            <div class="config-group">
                <div class="config-group-title">🪜 Salto de Números</div>
                <div class="config-row">
                    <button onclick="setConfig('step', 1)" class="config-btn ${s.step == 1 ? 'active' : ''}">+1</button>
                    <button onclick="setConfig('step', 2)" class="config-btn ${s.step == 2 ? 'active' : ''}">+2</button>
                    <button onclick="setConfig('step', 5)" class="config-btn ${s.step == 5 ? 'active' : ''}">+5</button>
                    <button onclick="setConfig('step', 10)" class="config-btn ${s.step == 10 ? 'active' : ''}">+10</button>
                </div>
            </div>
            <div class="config-group">
                <div class="config-group-title">🧩 Disposición</div>
                <div class="config-row">
                    <button onclick="setConfig('mode', 'ordered')" class="config-btn ${s.mode == 'ordered' ? 'active' : ''}">Ordenado</button>
                    <button onclick="setConfig('mode', 'random')" class="config-btn ${s.mode == 'random' ? 'active' : ''}">Desordenado</button>
                    <button onclick="setConfig('mode', 'neighbor')" class="config-btn ${s.mode == 'neighbor' ? 'active' : ''}">Colindantes</button>
                </div>
            </div>
            <div class="config-group">
                <div class="config-group-title">🔄 Dirección de Búsqueda</div>
                <div class="config-row">
                    <button onclick="setConfig('direction', 'forward')" class="config-btn ${s.direction == 'forward' ? 'active' : ''}">Ascendente (1 > 10)</button>
                    <button onclick="setConfig('direction', 'backward')" class="config-btn ${s.direction == 'backward' ? 'active' : ''}">Inversa (10 > 1)</button>
                </div>
            </div>
        `;
    }

    renderConfigPuzzle(container) {
        const s = this.puzzleSettings;
        container.innerHTML = `
            <div class="config-group">
                <div class="config-group-title">🪜 Salto de Números</div>
                <div class="config-row">
                    <button onclick="setConfig('step', 1)" class="config-btn ${s.step == 1 ? 'active' : ''}">+1</button>
                    <button onclick="setConfig('step', 2)" class="config-btn ${s.step == 2 ? 'active' : ''}">+2</button>
                    <button onclick="setConfig('step', 5)" class="config-btn ${s.step == 5 ? 'active' : ''}">+5</button>
                </div>
            </div>
            <div class="config-group">
                <div class="config-group-title">🧩 Tipo de Secuencia</div>
                <div class="config-row">
                    <button onclick="setConfig('mode', 'ordered')" class="config-btn ${s.mode == 'ordered' ? 'active' : ''}">Correlativa</button>
                    <button onclick="setConfig('mode', 'random')" class="config-btn ${s.mode == 'random' ? 'active' : ''}">Salteada</button>
                </div>
            </div>
        `;
    }

    setConfig(key, val) {
        // Handle global config keys
        if (['diceVisible', 'pizarraVisible', 'visualAidsEnabled', 'showSticks'].includes(key)) {
            this.config[key] = (val === 'true' || val === true);
            if (key === 'showSticks') this.showSticksIA = this.config[key];
            this.openConfigModal(); // Re-render
            this.generateExercise(); // Re-render exercise
            return;
        }

        // Handle activity-specific config
        const settings = this.gameMode.includes('camino') ? this.caminoSettings : this.puzzleSettings;
        if (key === 'rows' || key === 'cols' || key === 'step') val = parseInt(val);
        settings[key] = val;
        this.openConfigModal(); // Re-render
    }

    renderConfigGeneral(container) {
        const c = this.config;
        container.innerHTML = `
            <div class="config-group">
                <div class="config-group-title">🎲 Dados</div>
                <div class="config-row">
                    <button onclick="setConfig('diceVisible', true)" class="config-btn ${c.diceVisible ? 'active' : ''}">Mostrar Dados</button>
                    <button onclick="setConfig('diceVisible', false)" class="config-btn ${!c.diceVisible ? 'active' : ''}">Ocultar Dados</button>
                </div>
            </div>
            <div class="config-group">
                <div class="config-group-title">🖍️ Pizarra</div>
                <div class="config-row">
                    <button onclick="setConfig('pizarraVisible', true)" class="config-btn ${c.pizarraVisible ? 'active' : ''}">Mostrar Pizarra</button>
                    <button onclick="setConfig('pizarraVisible', false)" class="config-btn ${!c.pizarraVisible ? 'active' : ''}">Ocultar Pizarra</button>
                </div>
            </div>
            <div class="config-group">
                <div class="config-group-title">📊 Apoyos Visuales (Palitos/Bloques)</div>
                <div class="config-row">
                    <button onclick="setConfig('visualAidsEnabled', true)" class="config-btn ${c.visualAidsEnabled ? 'active' : ''}">Mostrar Apoyos</button>
                    <button onclick="setConfig('visualAidsEnabled', false)" class="config-btn ${!c.visualAidsEnabled ? 'active' : ''}">Ocultar Apoyos</button>
                </div>
            </div>
        `;
    }

    closeConfigModal() {
        document.getElementById('config-modal').style.display = 'none';
        this.generateExercise();
    }

    // --- Activity Handlers ---
    genLectura() { this.val1 = this.getRandomNumber(); this.renderLectura(); }
    renderLectura() {
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center gap-4 animate-pop">
                <div class="cursive-text" style="font-size:2.5rem;">${this.getColoredWord(this.val1)}</div>
                <div class="number-box">${this.userInputValue || '?'}</div>
            </div>`;
    }

    genBloques() {
        this.lectInputs = { pures: "", units: "", total: "" };
        this.val1 = Math.floor(Math.random() * 99) + 1;
        this.activeField = 'pures';
        this.renderBloques();
    }
    renderBloques() {
        // Horizontal Layout: Visuals (Left) - Inputs (Right)
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center w-full gap-4">
                <div class="flex-column items-center justify-center" style="flex:1;">
                    ${this.getSticks(this.val1, '#1e3a8a')}
                </div>
                <div class="flex-row items-center gap-4" style="background:white; padding:1rem; border-radius:20px; border:2px solid #e2e8f0; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
                    <div onclick="setActiveField('pures')" class="input-box-field tens-border ${this.activeField === 'pures' ? 'active' : ''}">
                        ${this.lectInputs.pures ? `<span class="tens">${this.lectInputs.pures}</span>` : ''}
                        <div class="label-guide" style="position:absolute; bottom:-20px; color:#ef4444;">D</div>
                    </div>
                    <div onclick="setActiveField('units')" class="input-box-field units-border ${this.activeField === 'units' ? 'active' : ''}">
                        ${this.lectInputs.units ? `<span class="units">${this.lectInputs.units}</span>` : ''}
                        <div class="label-guide" style="position:absolute; bottom:-20px; color:#3b82f6;">U</div>
                    </div>
                    <span class="text-3xl text-slate-300">=</span>
                    <div onclick="setActiveField('total')" class="input-box-field total-border ${this.activeField === 'total' ? 'active' : ''}">
                        ${this.lectInputs.total}
                        <div class="label-guide" style="position:absolute; bottom:-20px; color:#64748b;">Total</div>
                    </div>
                </div>
            </div>`;
        this.elements.instruction.innerText = "Cuenta los bloques";
    }
    setActiveField(f) { this.activeField = f; this.renderBloques(); }

    genRepresenta() {
        this.userBlocks = { tens: 0, units: 0 };
        this.val1 = Math.floor(Math.random() * 99) + 1;
        this.renderRepresenta();
    }
    renderRepresenta() {
        // Horizontal Layout: Number (Left) - Controls (Center) - Visuals (Right)
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-around w-full gap-4">
                <div class="number-box animate-pop" style="font-size:5rem; min-width:120px;">${this.val1}</div>
                
                <div class="flex-row gap-6">
                    <div class="flex items-center p-3 bg-red-50 rounded-xl gap-2 border-2 border-red-100 flex-col">
                        <div class="tens font-bold text-xl">${this.userBlocks.tens} D</div>
                        <div class="flex gap-2">
                             <button onclick="adjustBlock('tens',1)" class="w-10 h-10 bg-red-500 text-white font-bold rounded-lg text-xl shadow-sm hover:bg-red-600 transition">+</button>
                             <button onclick="adjustBlock('tens',-1)" class="w-10 h-10 bg-white text-red-500 border-2 border-red-200 rounded-lg text-xl shadow-sm hover:bg-red-50 transition">-</button>
                        </div>
                    </div>
                    <div class="flex items-center p-3 bg-blue-50 rounded-xl gap-2 border-2 border-blue-100 flex-col">
                        <div class="units font-bold text-xl">${this.userBlocks.units} U</div>
                        <div class="flex gap-2">
                            <button onclick="adjustBlock('units',1)" class="w-10 h-10 bg-blue-500 text-white font-bold rounded-lg text-xl shadow-sm hover:bg-blue-600 transition">+</button>
                            <button onclick="adjustBlock('units',-1)" class="w-10 h-10 bg-white text-blue-500 border-2 border-blue-200 rounded-lg text-xl shadow-sm hover:bg-blue-50 transition">-</button>
                        </div>
                    </div>
                </div>

                <div class="flex items-end justify-center" style="min-width:200px; height:120px;">
                    ${this.getSticks(this.userBlocks.tens * 10 + this.userBlocks.units, '#1e3a8a')}
                </div>
            </div>`;
        this.elements.instruction.innerText = "Representa el número";
    }
    adjustBlock(t, a) { if (this.roundFinished) return; if (t === 'tens') this.userBlocks.tens = Math.max(0, this.userBlocks.tens + a); else this.userBlocks.units = Math.max(0, this.userBlocks.units + a); this.renderRepresenta(); this.playSound('tick'); }

    genAntPost() {
        this.antPostInputs = { before: "", after: "" };
        this.val1 = this.getRandomNumber();
        this.activeAntPost = 'before';
        this.renderAntPost();
    }
    renderAntPost() {
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center gap-4 animate-pop">
                <div onclick="setActiveAntPost('before')" class="input-box-field ${this.activeAntPost === 'before' ? 'active' : ''}">${this.antPostInputs.before || '?'}</div>
                <div class="central-number-card">${this.val1}</div>
                <div onclick="setActiveAntPost('after')" class="input-box-field ${this.activeAntPost === 'after' ? 'active' : ''}">${this.antPostInputs.after || '?'}</div>
            </div>`;
    }
    setActiveAntPost(p) { this.activeAntPost = p; this.renderAntPost(); }

    genComparar() { this.val1 = this.getRandomNumber(); this.val2 = this.getRandomNumber(); this.renderComparar(); }
    renderComparar() {
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center gap-6 animate-pop">
                <div class="number-box">${this.val1}</div>
                <div class="number-box text-neutral-400">?</div>
                <div class="number-box">${this.val2}</div>
            </div>`;
    }

    getSticks(num, color) {
        let s = `<div class="sticks-container" style="min-height:50px; margin-top:0;">`;
        const d = Math.floor(num / 10), u = num % 10;
        for (let i = 0; i < d; i++) s += `<div class="ten-bar flex-shrink-0">${'<div class="bar-segment"></div>'.repeat(10)}</div>`;
        if (u > 0 || (d > 0 && u === 0)) {
            // CAMBIO: Cubos en vertical (columna) en lugar de horizontal
            s += `<div class="unit-stack flex-shrink-0">`;
            for (let i = 0; i < u; i++) s += `<div class="unit-cube"></div>`;
            s += `</div>`;
        }
        return s + `</div>`;
    }

    genVecinos() {
        this.vecinosInputs = { before: "", after: "" };
        this.val1 = this.getRandomNumber();
        this.activeVecino = 'before';
        this.renderVecinos();
    }
    renderVecinos() {
        const beforeVal = this.vecinosInputs.before || '?';
        const afterVal = this.vecinosInputs.after || '?';
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center gap-4 animate-pop">
                <div style="text-align:center;">
                    <div style="font-size:0.8rem; color:#64748b; margin-bottom:0.5rem;">🏠 Vecino Anterior</div>
                    <div onclick="setActiveVecino('before')" class="input-box-field ${this.activeVecino === 'before' ? 'active' : ''}" style="border-color:#f97316;">${beforeVal}</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:0.8rem; color:#64748b; margin-bottom:0.5rem;">🏡 Casa Central</div>
                    <div class="central-number-card">${this.val1}</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:0.8rem; color:#64748b; margin-bottom:0.5rem;">🏠 Vecino Posterior</div>
                    <div onclick="setActiveVecino('after')" class="input-box-field ${this.activeVecino === 'after' ? 'active' : ''}" style="border-color:#f97316;">${afterVal}</div>
                </div>
            </div>`;
        this.elements.instruction.innerText = "¿Qué vecinos tiene este número?";
    }
    setActiveVecino(v) { this.activeVecino = v; this.renderVecinos(); }

    genReloj() {
        this.relojHora = Math.floor(Math.random() * 12) + 1;
        this.relojMinutos = this.currentDifficulty === 1 ? 0 : (Math.random() > 0.5 ? 0 : 30);
        this.renderReloj();
    }
    renderReloj() {
        const hora = this.relojHora;
        const minutos = this.relojMinutos;
        const anguloHora = ((hora % 12) + minutos / 60) * 30; // 360/12 = 30 grados por hora
        const anguloMinutos = minutos * 6; // 360/60 = 6 grados por minuto

        // Generar 4 opciones de hora
        const opciones = [];
        const correcta = `${hora}:${minutos === 0 ? '00' : '30'}`;
        opciones.push(correcta);

        // Añadir 3 opciones incorrectas
        while (opciones.length < 4) {
            const h = Math.floor(Math.random() * 12) + 1;
            const m = Math.random() > 0.5 ? 0 : 30;
            const opcion = `${h}:${m === 0 ? '00' : '30'}`;
            if (!opciones.includes(opcion)) opciones.push(opcion);
        }

        // Mezclar opciones
        opciones.sort(() => Math.random() - 0.5);

        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center gap-4 animate-pop" style="width:100%;">
                <div style="position:relative;">
                    <svg width="200" height="200" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="90" fill="white" stroke="#3b82f6" stroke-width="4"/>
                        ${[12, 3, 6, 9].map((num, i) => {
            const angle = (i * 90 - 90) * Math.PI / 180;
            const x = 100 + 70 * Math.cos(angle);
            const y = 100 + 70 * Math.sin(angle);
            return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="20" font-weight="bold" fill="#1e293b">${num}</text>`;
        }).join('')}
                        <line x1="100" y1="100" x2="${100 + 50 * Math.sin(anguloHora * Math.PI / 180)}" y2="${100 - 50 * Math.cos(anguloHora * Math.PI / 180)}" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
                        <line x1="100" y1="100" x2="${100 + 70 * Math.sin(anguloMinutos * Math.PI / 180)}" y2="${100 - 70 * Math.cos(anguloMinutos * Math.PI / 180)}" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>
                        <circle cx="100" cy="100" r="6" fill="#ef4444"/>
                    </svg>
                </div>
                <div class="flex-column gap-3">
                    ${opciones.map(opt => `
                        <button onclick="checkReloj('${opt}')" class="btn-game-action" style="min-width:120px; font-size:1.5rem;">${opt}</button>
                    `).join('')}
                </div>
            </div>`;
        this.elements.instruction.innerText = "¿Qué hora marca el reloj?";
    }
    checkReloj(opt) {
        const correcta = `${this.relojHora}:${this.relojMinutos === 0 ? '00' : '30'}`;
        this.handleFeedback(opt === correcta);
    }

    genPuzzle() {
        const s = this.puzzleSettings;
        const paso = s.step;
        const inicio = Math.floor(Math.random() * 20) + 1;

        if (s.mode === 'ordered') {
            this.puzzleSequence = [inicio, inicio + paso, inicio + 2 * paso, inicio + 3 * paso];
        } else {
            // Salteada pero con lógica
            this.puzzleSequence = [inicio, inicio + paso * 2, inicio + paso, inicio + paso * 3];
        }

        this.puzzleMissingIndex = Math.floor(Math.random() * 4);
        this.puzzleAnswer = this.puzzleSequence[this.puzzleMissingIndex];
        this.userInputValue = "";
        this.renderPuzzle();
    }
    renderPuzzle() {
        const boxes = this.puzzleSequence.map((num, idx) => {
            if (idx === this.puzzleMissingIndex) {
                return `<div class="input-box-field" style="border-color:#f59e0b; min-width:80px;">${this.userInputValue || '?'}</div>`;
            } else {
                return `<div class="number-box" style="font-size:3rem; background:#dbeafe; padding:0.5rem 1rem; border-radius:12px; min-width:80px;">${num}</div>`;
            }
        }).join('');

        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-column items-center justify-center gap-6 animate-pop">
                <div style="font-size:1.2rem; font-weight:700; color:#64748b;">🧩 Completa la secuencia</div>
                <div class="flex-row items-center justify-center gap-4">
                    ${boxes}
                </div>
            </div>`;
        this.elements.instruction.innerText = "¿Qué número falta?";
    }

    genCamino() {
        const s = this.caminoSettings;
        const total = s.rows * s.cols;
        const step = s.step;

        // Generar números basados en el salto
        this.caminoNumbers = [];
        for (let i = 0; i < total; i++) {
            this.caminoNumbers.push(1 + i * step);
        }

        if (s.direction === 'forward') {
            this.currentPathNum = this.caminoNumbers[0];
            this.caminoTargetIndex = 0;
        } else {
            this.currentPathNum = this.caminoNumbers[total - 1];
            this.caminoTargetIndex = total - 1;
        }

        this.caminoClicked = new Set();

        // Mezclar si es random
        this.caminoDisplayNumbers = [...this.caminoNumbers];
        if (s.mode === 'random') {
            this.caminoDisplayNumbers.sort(() => Math.random() - 0.5);
        } else if (s.mode === 'neighbor') {
            // Lógica de colindantes: Empezar en (0,0) y generar camino adyacente
            // Por simplicidad en esta versión, mezclaremos pero asegurando una visualización de grid
            this.caminoDisplayNumbers.sort(() => Math.random() - 0.5);
        }

        this.renderCamino();
    }

    renderCamino() {
        const s = this.caminoSettings;
        let grid = '';

        for (let i = 0; i < this.caminoDisplayNumbers.length; i++) {
            const num = this.caminoDisplayNumbers[i];
            const isClicked = this.caminoClicked.has(num);
            const isNext = num === this.currentPathNum;

            let btnClass = isClicked ? 'active-path' : (isNext ? 'target-path' : '');
            grid += `<button onclick="clickCamino(${num})" class="camino-btn ${btnClass}">${num}</button>`;
        }

        const infoText = s.direction === 'forward' ?
            `Siguiente: <span style="color:var(--primary);">${this.currentPathNum}</span> (Hacia ${this.caminoNumbers[this.caminoNumbers.length - 1]})` :
            `Siguiente: <span style="color:var(--primary);">${this.currentPathNum}</span> (Bajando hacia ${this.caminoNumbers[0]})`;

        this.elements.exerciseContainer.innerHTML = `
            <div class="camino-wrapper animate-pop">
                <div class="camino-grid" style="grid-template-columns: repeat(${s.cols}, 1fr);">
                    ${grid}
                </div>
                <div class="camino-info">${infoText}</div>
            </div>`;

        this.elements.instruction.innerText = "Sigue el camino de números";
    }

    clickCamino(n) {
        if (this.roundFinished) return;
        const s = this.caminoSettings;

        if (n === this.currentPathNum) {
            this.caminoClicked.add(n);
            this.playSound('tick');

            // Avanzar o retroceder en el índice
            if (s.direction === 'forward') {
                this.caminoTargetIndex++;
            } else {
                this.caminoTargetIndex--;
            }

            if (this.caminoTargetIndex < 0 || this.caminoTargetIndex >= this.caminoNumbers.length) {
                this.handleFeedback(true);
            } else {
                this.currentPathNum = this.caminoNumbers[this.caminoTargetIndex];
                this.renderCamino();
            }
        } else {
            this.playSound('fail');
            this.elements.instruction.innerText = `¡Busca el ${this.currentPathNum}! 🔍`;
            this.elements.instruction.className = "instruction-pill feedback-error";
            setTimeout(() => {
                this.elements.instruction.innerText = "Sigue el camino de números";
                this.elements.instruction.className = "instruction-pill instruction-active";
            }, 1000);
        }
    }

    genBatido() {
        // Genera un objetivo y varios números que pueden sumarse para alcanzarlo
        this.batidoTarget = this.currentDifficulty === 1 ? (Math.floor(Math.random() * 6) + 5) : (Math.floor(Math.random() * 11) + 10);
        this.batidoIngredients = [];
        this.batidoSelected = new Set();

        // Generar ingredientes posibles
        const numIngredients = 6;
        const needed = [];
        let remaining = this.batidoTarget;

        // Asegurar que al menos hay una combinación correcta
        while (remaining > 0 && needed.length < 3) {
            const val = Math.min(remaining, Math.floor(Math.random() * 5) + 1);
            needed.push(val);
            remaining -= val;
        }

        // Añadir ingredientes correctos y algunos incorrectos
        this.batidoIngredients = [...needed];
        while (this.batidoIngredients.length < numIngredients) {
            const val = Math.floor(Math.random() * 7) + 1;
            this.batidoIngredients.push(val);
        }

        // Mezclar
        this.batidoIngredients.sort(() => Math.random() - 0.5);
        this.renderBatido();
    }
    renderBatido() {
        const currentSum = Array.from(this.batidoSelected).reduce((a, b) => a + b, 0);
        const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

        const ingredientsHTML = this.batidoIngredients.map((num, idx) => {
            const isSelected = this.batidoSelected.has(num);
            const color = colors[idx % colors.length];
            return `
                <button onclick="toggleBatidoIngredient(${num})" 
                    class="animate-pop" 
                    style="
                        background: ${isSelected ? color : 'white'};
                        color: ${isSelected ? 'white' : color};
                        border: 3px solid ${color};
                        border-radius: 50%;
                        width: 70px;
                        height: 70px;
                        font-size: 1.5rem;
                        font-weight: 800;
                        cursor: pointer;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        transition: all 0.2s;
                    ">${num}</button>
            `;
        }).join('');

        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-column items-center justify-center gap-4 animate-pop" style="width:100%;">
                <div style="text-align:center;">
                    <div style="font-size:1rem; color:#64748b; margin-bottom:0.5rem;">🥤 Crea un batido de valor:</div>
                    <div class="number-box-giant" style="color:#a855f7;">${this.batidoTarget}</div>
                </div>
                
                <div style="background:white; padding:1rem; border-radius:20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <div style="font-size:0.9rem; color:#64748b; margin-bottom:1rem; text-align:center;">Selecciona ingredientes:</div>
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem;">
                        ${ingredientsHTML}
                    </div>
                </div>
                
                <div style="background:#fef3c7; padding:1rem 2rem; border-radius:12px; border:2px solid #f59e0b;">
                    <span style="font-size:1rem; color:#78350f;">Suma actual: </span>
                    <span style="font-size:1.8rem; font-weight:800; color:#f59e0b;">${currentSum}</span>
                </div>
            </div>`;
        this.elements.instruction.innerText = "Selecciona números que sumen el objetivo";
    }
    toggleBatidoIngredient(num) {
        if (this.roundFinished) return;
        if (this.batidoSelected.has(num)) {
            this.batidoSelected.delete(num);
        } else {
            this.batidoSelected.add(num);
        }
        this.renderBatido();
        this.playSound('tick');

        // Auto-check si alcanza el objetivo
        const currentSum = Array.from(this.batidoSelected).reduce((a, b) => a + b, 0);
        if (currentSum === this.batidoTarget) {
            setTimeout(() => this.handleFeedback(true), 300);
        }
    }

    handleDice(id) {
        if (this.isRolling[id]) return;
        this.isRolling[id] = true;
        const slot = document.getElementById(`dice-slot-${id}`);
        slot.classList.add('dice-rolling');
        setTimeout(() => {
            // Constrain second dice for Subtraction to prevent negatives
            let limit = undefined;
            if (this.gameMode === 'restas' && id === 2 && this.val1 !== null) {
                limit = this.val1;
            }

            const val = this.getRandomNumber(limit);
            if (id === 1) this.val1 = val; else this.val2 = val;
            slot.innerHTML = val;
            slot.classList.remove('dice-rolling');
            this.isRolling[id] = false;

            // If we rerolled Dice 1 in subtraction and it's now smaller than Dice 2, reset Dice 2
            if (this.gameMode === 'restas' && id === 1 && this.val2 !== null && this.val1 < this.val2) {
                this.val2 = null;
                document.getElementById('dice-slot-2').innerHTML = '❓';
            }

            if (this.val1 && this.val2) this.renderStandard();
        }, 600);
    }

    renderStandard() {
        let visualHTML = "";
        if (this.showSticksIA) {
            visualHTML = `
                <div class="flex-row items-center justify-center gap-6 mt-6 animate-pop">
                    ${this.getSticks(this.val1, '#ef4444')}
                    <div class="text-4xl opacity-50 font-bold">${this.gameMode === 'sumas' ? '+' : '-'}</div>
                    ${this.getSticks(this.val2, '#3b82f6')}
                </div>
            `;
        }

        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-column items-center justify-center gap-4 animate-pop">
                <div class="flex-row items-center justify-center gap-4" style="font-size:3rem;">
                    ${this.colorDigit(this.val1)} 
                    ${this.gameMode === 'sumas' ? '+' : '-'} 
                    ${this.colorDigit(this.val2)} 
                    = 
                    <span style="color:#475569">${this.userInputValue || '?'}</span>
                </div>
                ${visualHTML}
            </div>`;
    }

    colorDigit(n) {
        if (n === null || n === undefined) return '';
        const s = n.toString();
        if (s.length === 1) return `<span style="color:#3b82f6">${s}</span>`; // Units Blue
        if (s.length === 2) return `<span style="color:#ef4444">${s[0]}</span><span style="color:#3b82f6">${s[1]}</span>`; // Tens Red
        return s;
    }

    toggleSticksIA() {
        this.showSticksIA = !this.showSticksIA;
        const btn = document.getElementById('toggle-sticks');
        if (btn) {
            btn.innerText = `APOYO: ${this.showSticksIA ? 'ON' : 'OFF'}`;
            btn.classList.toggle('btn-active', this.showSticksIA);
        }
        if (this.gameMode === 'sumas' || this.gameMode === 'restas') this.renderStandard();
    }

    // --- Logic ---
    pressNum(n) {
        if (this.roundFinished) return;

        if (this.gameMode === 'bloques' && this.activeField) {
            if (this.lectInputs[this.activeField].length < 3) {
                this.lectInputs[this.activeField] += n;
                this.renderBloques();
            }
        } else if (this.gameMode === 'antpost' && this.activeAntPost) {
            this.antPostInputs[this.activeAntPost] += n;
            this.renderAntPost();
        } else if (this.gameMode === 'vecinos' && this.activeVecino) {
            this.vecinosInputs[this.activeVecino] += n;
            this.renderVecinos();
        } else {
            this.userInputValue += n;
            if (this.gameMode === 'sumas' || this.gameMode === 'restas') this.renderStandard();
            else if (this.gameMode === 'lectura') this.renderLectura();
            else if (this.gameMode === 'comparar') this.renderComparar();
            else if (this.gameMode === 'puzzle') this.renderPuzzle();
        }
        this.playSound('tick');
    }

    backspace() {
        if (this.gameMode === 'bloques' && this.activeField) {
            this.lectInputs[this.activeField] = this.lectInputs[this.activeField].slice(0, -1);
            this.renderBloques();
        } else if (this.gameMode === 'antpost' && this.activeAntPost) {
            this.antPostInputs[this.activeAntPost] = this.antPostInputs[this.activeAntPost].slice(0, -1);
            this.renderAntPost();
        } else if (this.gameMode === 'vecinos' && this.activeVecino) {
            this.vecinosInputs[this.activeVecino] = this.vecinosInputs[this.activeVecino].slice(0, -1);
            this.renderVecinos();
        } else {
            this.userInputValue = this.userInputValue.slice(0, -1);
            if (this.gameMode === 'sumas' || this.gameMode === 'restas') this.renderStandard();
            else if (this.gameMode === 'lectura') this.renderLectura();
            else if (this.gameMode === 'comparar') this.renderComparar();
            else if (this.gameMode === 'puzzle') this.renderPuzzle();
        }
    }

    checkAnswer() {
        let expected;
        if (this.gameMode === 'sumas') expected = this.val1 + this.val2;
        else if (this.gameMode === 'restas') expected = this.val1 - this.val2;
        else if (this.gameMode === 'lectura') expected = this.val1;

        if (expected !== undefined) {
            this.handleFeedback(parseInt(this.userInputValue) === expected);
            return;
        }

        // Expanded Checks
        if (this.gameMode === 'bloques') {
            const d = Math.floor(this.val1 / 10), u = this.val1 % 10;
            const ok = (parseInt(this.lectInputs.pures) === d && parseInt(this.lectInputs.units) === u && parseInt(this.lectInputs.total) === this.val1);
            this.handleFeedback(ok);
        } else if (this.gameMode === 'representa') {
            const ok = (this.userBlocks.tens * 10 + this.userBlocks.units === this.val1);
            this.handleFeedback(ok);
        } else if (this.gameMode === 'antpost') {
            const before = parseInt(this.antPostInputs.before);
            const after = parseInt(this.antPostInputs.after);
            this.handleFeedback(before === (this.val1 - 1) && after === (this.val1 + 1));
        } else if (this.gameMode === 'vecinos') {
            const before = parseInt(this.vecinosInputs.before);
            const after = parseInt(this.vecinosInputs.after);
            this.handleFeedback(before === (this.val1 - 1) && after === (this.val1 + 1));
        } else if (this.gameMode === 'puzzle') {
            this.handleFeedback(parseInt(this.userInputValue) === this.puzzleAnswer);
        }
    }

    checkComparison(symbol) {
        const correct = this.val1 < this.val2 ? '<' : (this.val1 > this.val2 ? '>' : '=');
        this.handleFeedback(symbol === correct);
    }

    handleFeedback(ok) {
        if (ok) {
            this.score += 10;
            this.elements.score.innerText = this.score;
            this.elements.instruction.innerText = "¡Excelente! ✨";
            this.roundFinished = true;
            this.playSound('applause');
        } else {
            this.elements.instruction.innerText = "¡Inténtalo de nuevo! 💡";
            this.playSound('fail');
        }
        this.reportToPortal(ok);
    }

    reportToPortal(ok) {
        window.parent.postMessage({ type: 'UPDATE_SCORE_DETAILED', app: 'mate', activity: this.gameMode, ok: ok, score: this.score }, '*');
    }

    getRandomNumber(limit) {
        let max = this.currentDifficulty === 1 ? 10 : (this.currentDifficulty === 2 ? 50 : 100);
        if (limit !== undefined) {
            max = Math.min(max, limit);
        }
        return Math.floor(Math.random() * max) + 1;
    }

    // --- Helper for Colors ---
    // --- Helper for Colors ---
    getColoredWord(n) {
        const units = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
        const special10_15 = ["diez", "once", "doce", "trece", "catorce", "quince"];
        const tens = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];

        if (n < 10) return `<span style="color:#3b82f6">${units[n]}</span>`; // Blue

        if (n >= 10 && n <= 15) return `<span style="color:#ef4444">${special10_15[n - 10]}</span>`; // Red

        if (n >= 16 && n <= 19) {
            let word = "dieci" + units[n - 10];
            if (n === 16) word = "dieciséis";
            return `<span style="color:#ef4444">${word}</span>`;
        }

        if (n === 20) return `<span style="color:#ef4444">veinte</span>`;

        if (n >= 21 && n <= 29) {
            let word = "veinti" + units[n - 20];
            if (n === 22) word = "veintidós";
            if (n === 23) word = "veintitrés";
            if (n === 26) word = "veintiséis";
            return `<span style="color:#ef4444">${word}</span>`;
        }

        if (n >= 30) {
            const tenVal = Math.floor(n / 10);
            const unitVal = n % 10;
            if (unitVal === 0) return `<span style="color:#ef4444">${tens[tenVal]}</span>`;
            return `<span style="color:#ef4444">${tens[tenVal]}</span> y <span style="color:#3b82f6">${units[unitVal]}</span>`;
        }

        if (n === 100) return `<span style="color:#ef4444">cien</span>`;

        return n.toString();
    }

    initPizarra() {
        if (!this.elements.canvas || !this.elements.ctx) return;
        this.resizeCanvas();

        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        const canvas = this.elements.canvas;
        const ctx = this.elements.ctx;

        // Ensure canvas has pointer events enabled
        canvas.style.pointerEvents = 'auto';
        canvas.style.cursor = 'crosshair';

        ctx.strokeStyle = '#2563eb';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 4;

        // Mouse Events
        canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isDrawing = true;
            canvas.style.cursor = 'crosshair';
            [this.lastX, this.lastY] = [e.offsetX, e.offsetY];
            console.log('🖱️ MOUSEDOWN -', 'Drawing:', this.isDrawing, 'Pos:', this.lastX, this.lastY);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (this.isDrawing) {
                console.log('🖱️ MOUSEMOVE - Drawing line');
                this.draw(e);
            }
        });

        canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
            canvas.style.cursor = 'crosshair';
            console.log('🖱️ MOUSEUP - Drawing stopped');
        });

        canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
            canvas.style.cursor = 'crosshair';
            console.log('🖱️ MOUSELEAVE - Drawing stopped');
        });

        // Touch Events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            this.lastX = e.touches[0].clientX - rect.left;
            this.lastY = e.touches[0].clientY - rect.top;
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDrawing) {
                this.draw(e.touches[0]);
            }
        }, { passive: false });

        canvas.addEventListener('touchend', () => {
            this.isDrawing = false;
        });
    }

    draw(e) {
        if (!this.isDrawing) return;
        const ctx = this.elements.ctx;
        const canvas = this.elements.canvas;

        let x = e.offsetX;
        let y = e.offsetY;

        // Handle Touch coordinates
        if (x === undefined) {
            const rect = canvas.getBoundingClientRect();
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        [this.lastX, this.lastY] = [x, y];
    }

    resizeCanvas() {
        if (!this.elements.canvas) return;
        const canvas = this.elements.canvas;
        // Save current content
        // const tempCanvas = document.createElement('canvas');
        // tempCanvas.width = canvas.width;
        // tempCanvas.height = canvas.height;
        // tempCanvas.getContext('2d').drawImage(canvas, 0, 0);

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Restore properties after resize reset
        if (this.elements.ctx) {
            this.elements.ctx.strokeStyle = '#2563eb';
            this.elements.ctx.lineWidth = 4;
            this.elements.ctx.lineCap = 'round';
        }
    }

    clearCanvas() {
        if (this.elements.ctx) {
            this.elements.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        }
    }

    playSound(t) {
        // Sonidos desactivados por ahora
    }
}


const app = new MathApp();
