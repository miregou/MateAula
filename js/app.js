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

            if (['lectura', 'bloques', 'representa', 'antpost'].includes(mode)) {
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
        if (['lectura', 'bloques', 'representa', 'antpost', 'camino'].some(m => this.gameMode.includes(m))) {
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
        const d = this.currentDifficulty;
        if (d === 1) { this.caminoStart = 1; this.caminoEnd = 20; this.caminoDirection = 1; }
        else if (d === 2) {
            const rev = Math.random() > 0.5;
            this.caminoStart = rev ? 20 : 20; this.caminoEnd = rev ? 1 : 50; this.caminoDirection = rev ? -1 : 1;
        } else {
            const rev = Math.random() > 0.5;
            this.caminoStart = rev ? 50 : 1; this.caminoEnd = rev ? 1 : 100; this.caminoDirection = rev ? -1 : 1;
        }
        this.currentPathNum = this.caminoStart;
        this.renderCamino();
    }

    getRandomNumber() {
        if (this.currentDifficulty === 1) return Math.floor(Math.random() * 9) + 1;
        if (this.currentDifficulty === 2) return Math.floor(Math.random() * 41) + 10;
        return Math.floor(Math.random() * 51) + 50;
    }

    // --- Renderers (Horizontal Layouts) ---

    renderLectura() {
        const pText = this.lectInputs.pures ? `<span class="tens">${this.lectInputs.pures}</span>` : '';
        const uText = this.lectInputs.units ? `<span class="units">${this.lectInputs.units}</span>` : '';
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center gap-4 w-full animate-pop wrap">
                <div class="cursive-text" style="font-size:3rem; margin-right:1rem;">${this.getColoredWord(this.val1)}</div>
                <div class="flex-row items-center gap-2">
                    <span class="text-3xl" style="color:var(--neutral-300)">→</span>
                    <div onclick="app.setActiveField('pures')" class="input-box-field tens-border ${this.activeField === 'pures' ? 'active' : ''}">${pText}</div>
                    <span class="text-2xl" style="color:var(--neutral-300)">+</span>
                    <div onclick="app.setActiveField('units')" class="input-box-field units-border ${this.activeField === 'units' ? 'active' : ''}">${uText}</div>
                    <span class="text-2xl" style="color:var(--neutral-300)">=</span>
                    <div onclick="app.setActiveField('total')" class="input-box-field total-border ${this.activeField === 'total' ? 'active' : ''}">${this.lectInputs.total}</div>
                </div>
            </div>`;
        this.elements.instruction.innerText = "Escribe el número";
    }

    setActiveField(f) { this.activeField = f; if (this.gameMode === 'lectura') this.renderLectura(); else this.renderBloques(); }

    renderBloques() {
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center gap-6 w-full animate-pop wrap" style="min-height: 120px;">
                <div style="display:flex; align-items:flex-end;">${this.getSticks(this.val1, '#1e3a8a')}</div>
                <span class="text-4xl" style="color:var(--neutral-300); font-weight:lighter;">=</span>
                <div class="flex-row gap-4 items-center">
                    <div onclick="app.setActiveField('pures')" class="input-box-field tens-border ${this.activeField === 'pures' ? 'active' : ''}">${this.lectInputs.pures ? `<span class="tens">${this.lectInputs.pures}</span>` : ''}</div>
                    <div onclick="app.setActiveField('units')" class="input-box-field units-border ${this.activeField === 'units' ? 'active' : ''}">${this.lectInputs.units ? `<span class="units">${this.lectInputs.units}</span>` : ''}</div>
                    <span class="text-xl" style="color:var(--neutral-300)">=</span>
                    <div onclick="app.setActiveField('total')" class="input-box-field total-border ${this.activeField === 'total' ? 'active' : ''}">${this.lectInputs.total}</div>
                </div>
            </div>`;
        this.elements.instruction.innerText = "Cuenta los bloques";
    }

    renderRepresenta() {
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-col items-center justify-center w-full h-full">
                <div class="flex-row items-center justify-center gap-6 animate-pop w-full mb-auto mt-auto">
                    <div class="number-box" style="transform: scale(1.2);">${this.val1}</div>
                    <span class="text-4xl" style="color:var(--neutral-300); font-weight:lighter;">→</span>
                    <div class="flex-row gap-4 items-center">
                        <div class="interactive-block tens-block">
                            <div class="ten-bar scale-50 -my-8">${'<div class="bar-segment"></div>'.repeat(10)}</div>
                            <button onclick="adjustBlock('tens',1)" class="btn-adjust btn-plus">+</button>
                            <button onclick="adjustBlock('tens',-1)" class="btn-adjust btn-minus">-</button>
                            <div class="tens font-bold">${this.userBlocks.tens}D</div>
                        </div>
                        <div class="interactive-block units-block">
                            <div class="unit-cube scale-75"></div>
                            <button onclick="adjustBlock('units',1)" class="btn-adjust btn-plus-u">+</button>
                            <button onclick="adjustBlock('units',-1)" class="btn-adjust btn-minus-u">-</button>
                            <div class="units font-bold">${this.userBlocks.units}U</div>
                        </div>
                    </div>
                </div>
                <div style="opacity:0.5; transform: scale(0.8); margin-bottom: 5px;">
                    ${this.getSticks(this.userBlocks.tens * 10 + this.userBlocks.units, '#1e3a8a')}
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
            <div class="flex-row items-center justify-center gap-4 animate-pop w-full wrap">
                <div class="flex-col items-center">${this.formatNumber(this.val1)}${s1}</div>
                <div class="op-symbol">${this.gameMode === 'sumas' ? '＋' : '－'}</div>
                <div class="flex-col items-center">${this.formatNumber(this.val2)}${s2}</div>
                <span class="op-symbol">＝</span>
                <div class="number-box" style="color:var(--primary); min-width:80px; border-bottom:3px solid var(--neutral-100);">${this.userInputValue || '?'}</div>
            </div>`;
    }

    renderAntPost() {
        this.elements.exerciseContainer.innerHTML = `
            <div class="flex-row items-center justify-center gap-3 animate-pop">
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
            <div class="flex-row items-center justify-center gap-10 animate-pop">
                <div>${this.formatNumber(this.val1, true)}</div>
                <div class="flex-row items-center justify-center min-w-[120px]">${midContent}</div>
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
        if (['lectura', 'bloques'].includes(this.gameMode)) {
            if (this.lectInputs[this.activeField].length < 3) {
                this.lectInputs[this.activeField] += n;
                this.gameMode === 'lectura' ? this.renderLectura() : this.renderBloques();
            }
        } else if (this.gameMode === 'antpost') {
            if (this.antPostInputs[this.activeAntPost].length < 3) {
                this.antPostInputs[this.activeAntPost] += n;
                this.renderAntPost();
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
        if (['lectura', 'bloques'].includes(this.gameMode)) {
            this.lectInputs[this.activeField] = this.lectInputs[this.activeField].slice(0, -1);
            this.gameMode === 'lectura' ? this.renderLectura() : this.renderBloques();
        } else if (this.gameMode === 'antpost') {
            this.antPostInputs[this.activeAntPost] = this.antPostInputs[this.activeAntPost].slice(0, -1);
            this.renderAntPost();
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
            case 'lectura': ok = (parseInt(this.lectInputs.pures) === d * 10 && parseInt(this.lectInputs.units) === u && parseInt(this.lectInputs.total) === this.val1); break;
            case 'bloques': ok = (parseInt(this.lectInputs.pures) === d && parseInt(this.lectInputs.units) === u && parseInt(this.lectInputs.total) === this.val1); break;
            case 'representa': ok = (this.userBlocks.tens * 10 + this.userBlocks.units === this.val1); break;
            case 'antpost': ok = (parseInt(this.antPostInputs.before) === this.val1 - 1 && parseInt(this.antPostInputs.after) === this.val1 + 1); break;
            default:
                if (this.val1 === null || this.val2 === null) return;
                const expected = this.gameMode === 'sumas' ? this.val1 + this.val2 : this.val1 - this.val2;
                ok = parseInt(this.userInputValue) === expected;
        }
        this.handleFeedback(ok);
        // Only re-render if correct to show green success state, otherwise simple shake/sound handled in feedback
        if (ok && !['lectura', 'bloques', 'representa', 'antpost'].includes(this.gameMode)) {
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
        pg.innerText = `SERIE: ${this.caminoStart} al ${this.caminoEnd}`;
        pg.classList.remove('hidden');
        let pool = [];
        const low = Math.min(this.caminoStart, this.caminoEnd), high = Math.max(this.caminoStart, this.caminoEnd);
        for (let i = low; i <= high; i++) pool.push({ n: i });
        if (pool.length < 100) { while (pool.length < 100) pool.push({ n: null }); }
        let h = `<div class="camino-wrapper"><div class="camino-grid">`;
        pool.forEach(item => {
            const isPassed = (this.caminoDirection === 1) ? (item.n < this.currentPathNum) : (item.n > this.currentPathNum);
            if (item.n === null) h += `<div class="camino-filler"></div>`;
            else h += `<div onclick="clickCamino(${item.n}, this)" class="camino-btn animate-pop ${isPassed ? 'active-path' : ''}">${item.n}</div>`;
        });
        this.elements.exerciseContainer.innerHTML = h + '</div></div>';
        this.elements.instruction.innerText = `Busca el ${this.currentPathNum}`;
    }

    clickCamino(n, el) {
        if (this.roundFinished || el.classList.contains('active-path')) return;
        if (n === this.currentPathNum) {
            el.classList.add('active-path'); this.playSound('tick');
            this.currentPathNum += this.caminoDirection;
            const done = (this.caminoDirection === 1 && this.currentPathNum > this.caminoEnd) || (this.caminoDirection === -1 && this.currentPathNum < this.caminoEnd);
            if (done) { this.score += 50; this.handleFeedback(true); }
            else this.elements.instruction.innerText = `Busca el ${this.currentPathNum}`;
        } else {
            el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 300); this.playSound('fail');
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
