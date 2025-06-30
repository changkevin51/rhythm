"use strict";

/**
 * Enhanced Rhythm Game Engine
 * Modern, modular approach with better performance and features
 */

class RhythmEngine {
    constructor(canvasId, audioId) {
        // Core elements
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.audio = document.getElementById(audioId);
        
        // Game state
        this.gameState = 'LOADING'; // LOADING, READY, PLAYING, PAUSED, ENDED
        this.time = 0;
        this.preTime = 2000;
        this.offset = -40;
        
        // Chart data
        this.content = null;
        this.timingPoints = [];
        this.hitObjects = [];
        this.bpmData = {};
        
        // Gameplay variables
        this.score = 0;
        this.endScore = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.accuracy = 100;
        this.judgements = [0, 0, 0, 0, 0, 0, 0]; // Perfect, Great, Good, Bad, Miss, etc.
        this.fastCount = 0;
        this.slowCount = 0;
        
        // Visual settings
        this.scrollSpeed = 450;
        this.scale = 100;
        this.noteHeight = 60;
        this.laneWidth = 150;
        this.lanes = 4;
        
        // Input handling
        this.keyBindings = [68, 70, 74, 75]; // D, F, J, K
        this.keyStates = [false, false, false, false];
        this.touchStates = [-1, -1, -1, -1];
        this.laserTimes = [0, 0, 0, 0];
        this.holdStates = [-1, -1, -1, -1];
        
        // Timing windows (ms)
        this.timingWindows = [16, 37, 70, 100, 123, 161];
        this.judgeDisplayTime = 500;
        this.currentJudge = { type: -1, time: 0, fast: false };
        
        // Note queues for each lane
        this.noteQueues = [[], [], [], []];
        this.queueHeads = [0, 0, 0, 0];
        
        // Visual effects
        this.particles = [];
        this.screenShake = 0;
        this.flashEffect = 0;
        
        // Performance monitoring
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.createGradients();
        
        // Start render loop
        this.lastFrameTime = performance.now();
        this.renderLoop();
    }
    
    setupCanvas() {
        // Set up high DPI canvas
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    createGradients() {
        // Create reusable gradients for performance
        this.gradients = {
            laser: this.ctx.createLinearGradient(0, 500, 0, 800),
            note: this.ctx.createLinearGradient(0, 0, 0, this.noteHeight),
            combo: this.ctx.createRadialGradient(300, 200, 0, 300, 200, 100)
        };
        
        this.gradients.laser.addColorStop(0, 'rgba(158, 211, 255, 0.8)');
        this.gradients.laser.addColorStop(1, 'rgba(158, 211, 255, 0)');
        
        this.gradients.note.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        this.gradients.note.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
        
        this.gradients.combo.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        this.gradients.combo.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e), true);
        document.addEventListener('keyup', (e) => this.handleKeyUp(e), true);
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), true);
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), true);
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), true);
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Audio events
        this.audio.addEventListener('ended', () => this.endGame());
        this.audio.addEventListener('pause', () => this.pauseGame());
        this.audio.addEventListener('play', () => this.resumeGame());
    }
    
    async loadChart(chartPath) {
        try {
            this.gameState = 'LOADING';
            const response = await fetch(chartPath);
            const chartData = await response.text();
            this.parseChart(chartData);
            this.gameState = 'READY';
            return true;
        } catch (error) {
            console.error('Failed to load chart:', error);
            return false;
        }
    }
    
    parseChart(data) {
        const sections = this.parseOsuFormat(data);
        
        // Process timing points
        this.timingPoints = [];
        this.bpmData = {};
        let bpmIndex = 0;
        
        if (sections.TimingPoints) {
            Object.values(sections.TimingPoints).forEach((tp, index) => {
                if (tp[1] > 0) {
                    this.bpmData[bpmIndex] = {
                        time: tp[0],
                        bpm: tp[1],
                        beats: tp[2]
                    };
                    tp.bpmIndex = bpmIndex++;
                } else {
                    tp.bpmIndex = bpmIndex - 1;
                }
                this.timingPoints.push(tp);
            });
        }
        
        // Process hit objects
        this.hitObjects = [];
        if (sections.HitObjects) {
            Object.values(sections.HitObjects).forEach((ho, index) => {
                const note = {
                    id: index,
                    lane: Math.min(3, Math.floor(ho[0] / (512 / 4))),
                    startTime: ho[2],
                    endTime: ho[5] || 0,
                    type: ho[5] > 0 ? 'HOLD' : 'TAP',
                    hit: false,
                    active: true
                };
                
                this.hitObjects.push(note);
                this.noteQueues[note.lane].push(note);
            });
        }
        
        // Calculate total score
        this.endScore = this.hitObjects.length * 5 + 
                       this.hitObjects.filter(n => n.type === 'HOLD').length * 5;
    }
    
    parseOsuFormat(data) {
        const regex = {
            section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
            param: /^\s*([\w.\-_]+)\s*:\s*(.*?)\s*$/,
            timingPoint: /^\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*$/,
            hitObject: /^\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*/,
            comment: /^\s*\/\/.*$/
        };
        
        const result = {};
        const lines = data.split(/\r\n|\r|\n/);
        let currentSection = null;
        let itemIndex = 0;
        
        lines.forEach(line => {
            if (regex.comment.test(line)) return;
            
            const sectionMatch = line.match(regex.section);
            if (sectionMatch) {
                currentSection = sectionMatch[1];
                result[currentSection] = {};
                itemIndex = 0;
                return;
            }
            
            if (!currentSection) {
                const paramMatch = line.match(regex.param);
                if (paramMatch) {
                    result[paramMatch[1]] = paramMatch[2];
                }
                return;
            }
            
            const paramMatch = line.match(regex.param);
            if (paramMatch) {
                result[currentSection][paramMatch[1]] = paramMatch[2];
                return;
            }
            
            const timingMatch = line.match(regex.timingPoint);
            if (timingMatch && currentSection === 'TimingPoints') {
                result[currentSection][itemIndex] = timingMatch.slice(1, 9).map(Number);
                itemIndex++;
                return;
            }
            
            const objectMatch = line.match(regex.hitObject);
            if (objectMatch && currentSection === 'HitObjects') {
                result[currentSection][itemIndex] = objectMatch.slice(1, 7).map(Number);
                itemIndex++;
                return;
            }
        });
        
        return result;
    }
    
    start() {
        if (this.gameState !== 'READY') return false;
        
        this.gameState = 'PLAYING';
        this.resetGameState();
        this.startCountdown();
        return true;
    }
    
    resetGameState() {
        this.time = -this.preTime + this.offset;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.judgements.fill(0);
        this.fastCount = 0;
        this.slowCount = 0;
        this.queueHeads.fill(0);
        this.particles = [];
        this.screenShake = 0;
        this.flashEffect = 0;
        
        // Reset note states
        this.hitObjects.forEach(note => {
            note.hit = false;
            note.active = true;
        });
    }
    
    startCountdown() {
        const countdown = () => {
            if (this.preTime > 0) {
                this.time = -this.preTime + this.offset;
                this.preTime -= 16.67; // ~60fps
                setTimeout(countdown, 16.67);
                return;
            }
            
            if (this.preTime <= 0 && this.gameState === 'PLAYING') {
                this.audio.currentTime = 0;
                this.audio.play();
                this.preTime = -1;
            }
        };
        countdown();
    }
    
    update(deltaTime) {
        if (this.gameState !== 'PLAYING') return;
        
        // Update time
        if (this.preTime <= 0 && this.audio && !this.audio.paused) {
            this.time = this.audio.currentTime * 1000 + this.offset;
        }
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update screen effects
        this.screenShake = Math.max(0, this.screenShake - deltaTime * 0.01);
        this.flashEffect = Math.max(0, this.flashEffect - deltaTime * 0.005);
        
        // Update judgement display
        if (this.currentJudge.type >= 0) {
            if (performance.now() - this.currentJudge.time > this.judgeDisplayTime) {
                this.currentJudge.type = -1;
            }
        }
        
        // Check for missed notes
        this.checkMissedNotes();
        
        // Update FPS counter
        this.updateFPS(deltaTime);
    }
    
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime * 0.001;
            particle.y += particle.velocityY * deltaTime * 0.001;
            particle.x += particle.velocityX * deltaTime * 0.001;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    }
    
    updateFPS(deltaTime) {
        this.frameCount++;
        if (performance.now() - this.lastFpsUpdate > 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (performance.now() - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = performance.now();
        }
    }
    
    checkMissedNotes() {
        for (let lane = 0; lane < this.lanes; lane++) {
            const queue = this.noteQueues[lane];
            const head = this.queueHeads[lane];
            
            if (head >= queue.length) continue;
            
            const note = queue[head];
            if (!note.active || note.hit) {
                this.queueHeads[lane]++;
                continue;
            }
            
            // Check if note is too late
            if (this.time - note.startTime > this.timingWindows[5]) {
                this.processHit(lane, 6, false); // Miss
                this.queueHeads[lane]++;
            }
        }
    }
    
    calculateNotePosition(noteTime) {
        // Calculate note position based on scroll speed and timing
        const timeDiff = noteTime - this.time;
        return 800 - (timeDiff * this.scrollSpeed / 1000);
    }
    
    handleKeyDown(event) {
        if (this.gameState !== 'PLAYING') {
            if (event.keyCode === 27) { // ESC
                this.togglePause();
            }
            return;
        }
        
        const lane = this.keyBindings.indexOf(event.keyCode);
        if (lane === -1 || this.keyStates[lane]) return;
        
        this.keyStates[lane] = true;
        this.laserTimes[lane] = -1;
        this.processInput(lane, 'DOWN');
    }
    
    handleKeyUp(event) {
        const lane = this.keyBindings.indexOf(event.keyCode);
        if (lane === -1 || !this.keyStates[lane]) return;
        
        this.keyStates[lane] = false;
        this.laserTimes[lane] = this.time + 150;
        this.processInput(lane, 'UP');
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        if (this.gameState !== 'PLAYING') return;
        
        const touch = event.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const lane = Math.floor(x / (this.laneWidth * this.scale / 100));
        
        if (lane < 0 || lane >= this.lanes || this.keyStates[lane]) return;
        
        this.keyStates[lane] = true;
        this.touchStates[lane] = touch.identifier;
        this.laserTimes[lane] = -1;
        this.processInput(lane, 'DOWN');
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        
        const touch = event.changedTouches[0];
        let lane = -1;
        
        for (let i = 0; i < this.lanes; i++) {
            if (this.touchStates[i] === touch.identifier) {
                lane = i;
                break;
            }
        }
        
        if (lane === -1) return;
        
        this.keyStates[lane] = false;
        this.touchStates[lane] = -1;
        this.laserTimes[lane] = this.time + 150;
        this.processInput(lane, 'UP');
    }
    
    processInput(lane, type) {
        const queue = this.noteQueues[lane];
        const head = this.queueHeads[lane];
        
        if (head >= queue.length) return;
        
        const note = queue[head];
        if (!note.active) return;
        
        const timeDiff = this.time - note.startTime;
        
        if (type === 'DOWN') {
            if (note.type === 'TAP') {
                this.evaluateHit(lane, timeDiff);
                this.queueHeads[lane]++;
            } else if (note.type === 'HOLD') {
                if (Math.abs(timeDiff) <= this.timingWindows[4]) {
                    this.holdStates[lane] = note.id;
                    this.evaluateHit(lane, timeDiff);
                }
            }
        } else if (type === 'UP' && note.type === 'HOLD' && this.holdStates[lane] === note.id) {
            const endTimeDiff = this.time - note.endTime;
            this.holdStates[lane] = -1;
            note.active = false;
            this.evaluateHit(lane, endTimeDiff);
            this.queueHeads[lane]++;
        }
    }
    
    evaluateHit(lane, timeDiff) {
        const absDiff = Math.abs(timeDiff);
        let judgement = 6; // Miss
        
        for (let i = 0; i < this.timingWindows.length; i++) {
            if (absDiff <= this.timingWindows[i]) {
                judgement = i;
                break;
            }
        }
        
        this.processHit(lane, judgement, timeDiff < 0);
    }
    
    processHit(lane, judgement, isFast) {
        // Update statistics
        this.judgements[judgement]++;
        
        if (judgement <= 4) {
            this.combo++;
            this.score += 5 - judgement;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
        } else {
            this.combo = 0;
        }
        
        if (judgement > 0 && judgement <= 5) {
            if (isFast) this.fastCount++;
            else this.slowCount++;
        }
        
        // Update accuracy
        this.accuracy = this.endScore > 0 ? (this.score / this.endScore) * 100 : 100;
        
        // Show judgement
        this.currentJudge = {
            type: judgement,
            time: performance.now(),
            fast: isFast
        };
        
        // Visual effects
        this.addHitEffect(lane, judgement);
        
        if (judgement === 0) {
            this.screenShake = 5;
            this.flashEffect = 0.3;
        }
    }
    
    addHitEffect(lane, judgement) {
        const colors = [
            '#00FFFF', '#FFFF00', '#00FF00', '#0000FF', '#FF0000', '#FF0000', '#FF0000'
        ];
        
        const x = lane * this.laneWidth + this.laneWidth / 2;
        const particleCount = judgement === 0 ? 15 : Math.max(1, 10 - judgement * 2);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 50,
                y: 750 + (Math.random() - 0.5) * 30,
                velocityX: (Math.random() - 0.5) * 200,
                velocityY: -Math.random() * 300 - 100,
                life: 1,
                maxLife: 1,
                color: colors[judgement],
                size: Math.random() * 4 + 2,
                alpha: 1
            });
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        if (this.screenShake > 0) {
            this.ctx.save();
            this.ctx.translate(
                (Math.random() - 0.5) * this.screenShake,
                (Math.random() - 0.5) * this.screenShake
            );
        }
        
        // Apply flash effect
        if (this.flashEffect > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = this.flashEffect;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
        
        if (this.gameState === 'PLAYING') {
            this.renderGameplay();
        } else if (this.gameState === 'ENDED') {
            this.renderResults();
        } else if (this.gameState === 'LOADING') {
            this.renderLoading();
        }
        
        // Restore screen shake transform
        if (this.screenShake > 0) {
            this.ctx.restore();
        }
        
        // Debug info
        this.renderDebugInfo();
    }
    
    renderGameplay() {
        this.renderLanes();
        this.renderNotes();
        this.renderLasers();
        this.renderUI();
        this.renderParticles();
        this.renderJudgement();
    }
    
    renderLanes() {
        // Draw lane separators
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        
        for (let i = 1; i < this.lanes; i++) {
            const x = i * this.laneWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, 800);
            this.ctx.stroke();
        }
        
        // Draw hit line
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 750);
        this.ctx.lineTo(600, 750);
        this.ctx.stroke();
    }
    
    renderNotes() {
        this.ctx.save();
        
        for (let lane = 0; lane < this.lanes; lane++) {
            const queue = this.noteQueues[lane];
            
            for (let i = this.queueHeads[lane]; i < queue.length; i++) {
                const note = queue[i];
                const position = this.calculateNotePosition(note.startTime);
                
                // Skip notes that are too far offscreen
                if (position > 850) break;
                if (position < -this.noteHeight && note.type === 'TAP') continue;
                
                const x = lane * this.laneWidth;
                const color = this.getNoteColor(lane, note);
                
                if (note.type === 'HOLD') {
                    const endPosition = this.calculateNotePosition(note.endTime);
                    this.renderHoldNote(x, endPosition, position, color, note.active);
                } else {
                    this.renderTapNote(x, position, color, note.active);
                }
            }
        }
        
        this.ctx.restore();
    }
    
    getNoteColor(lane, note) {
        const colors = ['#FFFFFF', '#00DDFF', '#00DDFF', '#FFFFFF'];
        const inactiveColors = ['#777777', '#005577', '#005577', '#777777'];
        
        return note.active ? colors[lane] : inactiveColors[lane];
    }
    
    renderTapNote(x, y, color, active) {
        // Note body
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + 5, y, this.laneWidth - 10, this.noteHeight);
        
        // Note border
        this.ctx.strokeStyle = active ? '#FFFFFF' : '#555555';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 5, y, this.laneWidth - 10, this.noteHeight);
        
        // Note highlight
        if (active) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(x + 5, y, this.laneWidth - 10, 15);
        }
    }
    
    renderHoldNote(x, startY, endY, color, active) {
        const height = endY - startY;
        
        // Hold body
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillRect(x + 20, startY, this.laneWidth - 40, height);
        this.ctx.globalAlpha = 1;
        
        // Hold borders
        this.ctx.strokeStyle = active ? '#FFFFFF' : '#555555';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x + 20, startY, this.laneWidth - 40, height);
        
        // Start note
        this.renderTapNote(x, endY - this.noteHeight, color, active);
        
        // End cap
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + 5, startY - 10, this.laneWidth - 10, 20);
        this.ctx.strokeRect(x + 5, startY - 10, this.laneWidth - 10, 20);
    }
    
    renderLasers() {
        this.ctx.save();
        
        for (let lane = 0; lane < this.lanes; lane++) {
            if (!this.keyStates[lane] && this.laserTimes[lane] <= this.time) continue;
            
            let alpha = 1;
            if (this.laserTimes[lane] > this.time) {
                alpha = (this.laserTimes[lane] - this.time) / 150;
            }
            
            const x = lane * this.laneWidth;
            this.ctx.globalAlpha = alpha * 0.7;
            this.ctx.fillStyle = this.gradients.laser;
            this.ctx.fillRect(x, 500, this.laneWidth, 300);
        }
        
        this.ctx.restore();
    }
    
    renderUI() {
        // Score
        this.renderText(this.score.toString(), 580, 50, '40px Orbitron', '#FFFFFF', 'end');
        
        // Accuracy
        const acc = Math.round(this.accuracy * 100) / 100;
        this.renderText(acc + '%', 580, 90, '25px Orbitron', '#FFFFFF', 'end');
        
        // Combo
        if (this.combo > 0) {
            this.renderText(this.combo.toString(), 300, 180, '80px Orbitron', '#FFFFFF', 'center');
        }
    }
    
    renderParticles() {
        this.ctx.save();
        
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    renderJudgement() {
        if (this.currentJudge.type < 0) return;
        
        const judgements = ['PERFECT', 'PERFECT', 'GREAT', 'GOOD', 'BAD', 'MISS', 'MISS'];
        const colors = ['#00FFFF', '#FFFF00', '#00FF00', '#0000FF', '#FF0000', '#FF0000', '#FF0000'];
        
        const text = judgements[this.currentJudge.type];
        const color = colors[this.currentJudge.type];
        
        this.renderText(text, 300, 280, '90px Orbitron', color, 'center');
        
        if (this.currentJudge.type > 0 && this.currentJudge.type <= 5) {
            const fastSlow = this.currentJudge.fast ? 'FAST' : 'SLOW';
            const fsColor = this.currentJudge.fast ? '#0077FF' : '#FF7700';
            this.renderText(fastSlow, 300, 320, '20px Orbitron', fsColor, 'center');
        }
    }
    
    renderText(text, x, y, font, color, align = 'start') {
        this.ctx.save();
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'middle';
        
        this.ctx.strokeText(text, x, y);
        this.ctx.fillText(text, x, y);
        
        this.ctx.restore();
    }
    
    renderResults() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, 600, 800);
        
        const results = [
            { label: 'PERFECT', value: this.judgements[0] + this.judgements[1], color: '#00FFFF' },
            { label: 'GREAT', value: this.judgements[2], color: '#00FF00' },
            { label: 'GOOD', value: this.judgements[3], color: '#0000FF' },
            { label: 'BAD', value: this.judgements[4], color: '#FF7700' },
            { label: 'MISS', value: this.judgements[5] + this.judgements[6], color: '#FF0000' }
        ];
        
        this.renderText('RESULTS', 300, 100, '60px Orbitron', '#FFFFFF', 'center');
        
        results.forEach((result, index) => {
            const y = 180 + index * 60;
            this.renderText(`${result.label}: ${result.value}`, 50, y, '40px Orbitron', result.color);
        });
        
        this.renderText(`SCORE: ${this.score}/${this.endScore}`, 50, 520, '30px Orbitron', '#FFFFFF');
        this.renderText(`MAX COMBO: ${this.maxCombo}`, 50, 560, '30px Orbitron', '#FFFFFF');
        this.renderText(`ACCURACY: ${Math.round(this.accuracy * 100) / 100}%`, 50, 600, '30px Orbitron', '#FFFFFF');
        
        this.ctx.restore();
    }
    
    renderLoading() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, 600, 800);
        
        this.renderText('LOADING...', 300, 400, '40px Orbitron', '#FFFFFF', 'center');
        
        this.ctx.restore();
    }
    
    renderDebugInfo() {
        if (this.gameState !== 'PLAYING') return;
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 150, 80);
        
        this.renderText(`FPS: ${this.fps}`, 20, 25, '16px monospace', '#FFFFFF');
        this.renderText(`Time: ${Math.round(this.time)}ms`, 20, 45, '16px monospace', '#FFFFFF');
        this.renderText(`Notes: ${this.hitObjects.length}`, 20, 65, '16px monospace', '#FFFFFF');
        
        this.ctx.restore();
    }
    
    renderLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.renderLoop());
    }
    
    togglePause() {
        if (this.gameState === 'PLAYING') {
            this.audio.pause();
            this.gameState = 'PAUSED';
        } else if (this.gameState === 'PAUSED') {
            this.audio.play();
            this.gameState = 'PLAYING';
        }
    }
    
    pauseGame() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
        }
    }
    
    resumeGame() {
        if (this.gameState === 'PAUSED') {
            this.gameState = 'PLAYING';
        }
    }
    
    endGame() {
        this.gameState = 'ENDED';
        this.maxCombo = Math.max(this.maxCombo, this.combo);
    }
    
    // Settings management
    updateSettings(settings) {
        if (settings.offset !== undefined) this.offset = settings.offset;
        if (settings.scrollSpeed !== undefined) this.scrollSpeed = settings.scrollSpeed;
        if (settings.keyBindings !== undefined) this.keyBindings = settings.keyBindings;
        if (settings.scale !== undefined) this.scale = settings.scale;
    }
    
    getStats() {
        return {
            score: this.score,
            endScore: this.endScore,
            accuracy: this.accuracy,
            combo: this.combo,
            maxCombo: this.maxCombo,
            judgements: [...this.judgements],
            fastCount: this.fastCount,
            slowCount: this.slowCount
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RhythmEngine;
}
