// Settings Modal Functionality
class GameSettingsUI {
    constructor() {
        this.modal = document.getElementById('settings-modal');
        this.initializeElements();
        this.bindEvents();
        this.loadCurrentSettings();
    }
    
    initializeElements() {
        // Modal controls
        this.openBtn = document.getElementById('open-settings-btn');
        this.closeBtn = document.getElementById('close-settings');
        this.saveBtn = document.getElementById('save-settings-btn');
        this.resetBtn = document.getElementById('reset-settings-btn');
        
        // Tab controls
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Setting inputs
        this.scrollSpeedInput = document.getElementById('scroll-speed-setting');
        this.offsetInput = document.getElementById('offset-setting');
        this.scaleInput = document.getElementById('scale-setting');
        this.masterVolumeInput = document.getElementById('master-volume-setting');
        this.musicVolumeInput = document.getElementById('music-volume-setting');
        this.effectsVolumeInput = document.getElementById('effects-volume-setting');
        this.backgroundDimInput = document.getElementById('background-dim-setting');
        this.showFpsInput = document.getElementById('show-fps-setting');
        this.particleEffectsInput = document.getElementById('particle-effects-setting');
        this.screenShakeInput = document.getElementById('screen-shake-setting');
        this.keyLayoutSelect = document.getElementById('key-layout-select');
        
        // Display elements
        this.scrollSpeedValue = document.getElementById('scroll-speed-value');
        this.offsetValue = document.getElementById('offset-value');
        this.scaleValue = document.getElementById('scale-value');
        this.masterVolumeValue = document.getElementById('master-volume-value');
        this.musicVolumeValue = document.getElementById('music-volume-value');
        this.effectsVolumeValue = document.getElementById('effects-volume-value');
        this.backgroundDimValue = document.getElementById('background-dim-value');
        this.currentKeysDisplay = document.getElementById('current-keys-display');
        this.calibrationStatus = document.getElementById('calibration-status');
        this.currentAudioOffset = document.getElementById('current-audio-offset');
        this.startCalibrationBtn = document.getElementById('start-calibration-btn');
    }
    
    bindEvents() {
        // Modal controls
        this.openBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.saveBtn.addEventListener('click', () => this.saveSettings());
        this.resetBtn.addEventListener('click', () => this.resetSettings());
        
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Range input updates
        this.setupRangeInput(this.scrollSpeedInput, this.scrollSpeedValue);
        this.setupRangeInput(this.offsetInput, this.offsetValue, 'ms');
        this.setupRangeInput(this.scaleInput, this.scaleValue, '%');
        this.setupRangeInput(this.masterVolumeInput, this.masterVolumeValue, '%');
        this.setupRangeInput(this.musicVolumeInput, this.musicVolumeValue, '%');
        this.setupRangeInput(this.effectsVolumeInput, this.effectsVolumeValue, '%');
        this.setupRangeInput(this.backgroundDimInput, this.backgroundDimValue, '%');
        
        // Key layout change
        this.keyLayoutSelect.addEventListener('change', () => this.updateKeyDisplay());
        
        // Calibration
        this.startCalibrationBtn.addEventListener('click', () => this.startCalibration());
        
        // Close modal on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
    }
    
    setupRangeInput(input, display, unit = '') {
        input.addEventListener('input', () => {
            display.textContent = input.value + unit;
        });
    }
    
    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab contents
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName + '-tab');
        });
    }
    
    loadCurrentSettings() {
        const settings = gameSettings.getAll();
        
        // Load values
        this.scrollSpeedInput.value = settings.scrollSpeed;
        this.offsetInput.value = settings.offset;
        this.scaleInput.value = settings.scale;
        this.masterVolumeInput.value = settings.masterVolume;
        this.musicVolumeInput.value = settings.musicVolume;
        this.effectsVolumeInput.value = settings.effectsVolume;
        this.backgroundDimInput.value = settings.backgroundDim;
        this.showFpsInput.checked = settings.showFPS;
        this.particleEffectsInput.checked = settings.particleEffects;
        this.screenShakeInput.checked = settings.screenShake;
        this.keyLayoutSelect.value = settings.keyLayout;
        
        // Update displays
        this.scrollSpeedValue.textContent = settings.scrollSpeed;
        this.offsetValue.textContent = settings.offset + 'ms';
        this.scaleValue.textContent = settings.scale + '%';
        this.masterVolumeValue.textContent = settings.masterVolume + '%';
        this.musicVolumeValue.textContent = settings.musicVolume + '%';
        this.effectsVolumeValue.textContent = settings.effectsVolume + '%';
        this.backgroundDimValue.textContent = settings.backgroundDim + '%';
        
        this.updateKeyDisplay();
        this.updateCalibrationStatus();
    }
    
    updateKeyDisplay() {
        const layout = this.keyLayoutSelect.value;
        const preset = gameSettings.keyPresets[layout];
        if (preset) {
            const keyNames = preset.keys.map(key => gameSettings.getKeyName(key));
            this.currentKeysDisplay.textContent = keyNames.join(' - ');
        }
    }
    
    updateCalibrationStatus() {
        const isCalibrated = gameSettings.get('isCalibrated');
        const audioOffset = gameSettings.get('audioOffset');
        
        if (isCalibrated) {
            this.calibrationStatus.textContent = 'Audio calibrated ✓';
            this.calibrationStatus.style.color = '#00FFAA';
        } else {
            this.calibrationStatus.textContent = 'Not calibrated';
            this.calibrationStatus.style.color = '#FF6464';
        }
        
        this.currentAudioOffset.textContent = `Current offset: ${audioOffset}ms`;
    }
    
    saveSettings() {
        const updates = {
            scrollSpeed: parseInt(this.scrollSpeedInput.value),
            offset: parseInt(this.offsetInput.value),
            scale: parseInt(this.scaleInput.value),
            masterVolume: parseInt(this.masterVolumeInput.value),
            musicVolume: parseInt(this.musicVolumeInput.value),
            effectsVolume: parseInt(this.effectsVolumeInput.value),
            backgroundDim: parseInt(this.backgroundDimInput.value),
            showFPS: this.showFpsInput.checked,
            particleEffects: this.particleEffectsInput.checked,
            screenShake: this.screenShakeInput.checked,
            keyLayout: this.keyLayoutSelect.value
        };
        
        gameSettings.setMultiple(updates);
        gameSettings.setKeyLayout(this.keyLayoutSelect.value);
        
        this.updateGameSetupInputs();
        
        this.closeModal();
        this.showNotification('Settings saved successfully!');
    }
    
    resetSettings() {
        if (confirm('Reset all settings to defaults? This action cannot be undone.')) {
            gameSettings.resetToDefaults();
            this.loadCurrentSettings();
            this.updateGameSetupInputs();
            this.showNotification('Settings reset to defaults');
        }
    }
    
    updateGameSetupInputs() {
        const setupScale = document.getElementById('inputScale');
        const setupSpeed = document.getElementById('scrollDurationInput');
        const setupOffset = document.getElementById('inputOffset');
        
        if (setupScale) setupScale.value = gameSettings.get('scale');
        if (setupSpeed) setupSpeed.value = gameSettings.get('scrollSpeed');
        if (setupOffset) {
            const totalOffset = gameSettings.getEffectiveOffset();
            setupOffset.value = totalOffset;
            updateOffsetDisplay();
        }
        
        updateGameSetupDisplays();
    }
    
    startCalibration() {
        this.closeModal();
        this.createCalibrationOverlay();
    }
    
    createCalibrationOverlay() {
        const existing = document.getElementById('game-calibration-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'game-calibration-overlay';
        overlay.className = 'calibration-overlay active';
        
        overlay.innerHTML = `
            <div class="calibration-modal">
                <h2 class="calibration-title">Audio Offset Calibration</h2>
                <p class="calibration-description">
                    Let's calibrate your audio offset for the best rhythm game experience!<br>
                    This will help synchronize the audio with your input for perfect timing.<br>
                    <small style="color: #80E0FF; margin-top: 0.5rem; display: block;">
                        Don't worry if you miss the first few beats - the calibration focuses on your most recent consistent taps.
                    </small>
                </p>
                
                <div class="metronome-container">
                    <div id="game-metronome-beat" class="metronome-beat"></div>
                </div>
                
                <div class="calibration-instructions">
                    Press <span class="calibration-key">D</span> in sync with the beat
                </div>
                
                <div class="calibration-progress">
                    <div id="game-calibration-progress-fill" class="calibration-progress-fill"></div>
                </div>
                
                <div id="game-calibration-stats" class="calibration-stats">
                    <div class="stat-row">
                        <span>Taps recorded:</span>
                        <span class="stat-value" id="game-taps-count">0</span>
                    </div>
                    <div class="stat-row">
                        <span>Average offset:</span>
                        <span class="stat-value" id="game-avg-offset">0ms</span>
                    </div>
                    <div class="stat-row">
                        <span>Consistency:</span>
                        <span class="stat-value" id="game-consistency">0%</span>
                    </div>
                </div>
                
                <div class="calibration-buttons">
                    <button id="game-start-calibration" class="btn primary">Start Calibration</button>
                    <button id="game-finish-calibration" class="btn" style="display: none;">Save & Continue</button>
                    <button id="game-skip-calibration" class="btn">Skip for Now</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Initialize the calibration system
        this.initGameCalibration();
    }
    
    async initGameCalibration() {
        this.isCalibrating = false;
        this.audioContext = null;
        this.metronomeGain = null;
        this.metronomeOscillator = null;
        this.bpm = 120;
        this.beatInterval = 60000 / this.bpm;
        this.startTime = 0;
        this.beatCount = 0;
        this.tapOffsets = [];
        this.beatTimes = [];
        this.tappedBeats = new Set();
        this.minTaps = 8;
        this.maxTaps = 20;
        this.targetTaps = 12;
        
        // Bind events
        document.getElementById('game-start-calibration').addEventListener('click', () => this.startGameCalibration());
        document.getElementById('game-finish-calibration').addEventListener('click', () => this.finishGameCalibration());
        document.getElementById('game-skip-calibration').addEventListener('click', () => this.skipGameCalibration());
        
        // Key listener for D key
        this.calibrationKeyListener = (e) => {
            if (this.isCalibrating && e.code === 'KeyD') {
                this.recordGameTap();
            }
        };
        document.addEventListener('keydown', this.calibrationKeyListener);
    }
    
    async startGameCalibration() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.metronomeGain = this.audioContext.createGain();
            this.metronomeGain.connect(this.audioContext.destination);
            this.metronomeGain.gain.value = 0.3;
            
            this.isCalibrating = true;
            this.tapOffsets = [];
            this.beatTimes = [];
            this.tappedBeats.clear();
            this.beatCount = 0;
            this.startTime = this.audioContext.currentTime;
            
            document.getElementById('game-start-calibration').style.display = 'none';
            document.getElementById('game-calibration-stats').classList.add('active');
            
            this.runGameMetronome();
        } catch (error) {
            alert('Unable to start audio calibration. Please ensure your browser supports Web Audio API.');
        }
    }
    
    runGameMetronome() {
        if (!this.isCalibrating) return;
        
        this.playGameBeat();
        this.beatCount++;
        
        if (this.beatCount < this.maxTaps + 5) {
            setTimeout(() => this.runGameMetronome(), this.beatInterval);
        } else {
            this.isCalibrating = false;
            document.getElementById('game-finish-calibration').style.display = 'block';
        }
    }
    
    playGameBeat() {
        const oscillator = this.audioContext.createOscillator();
        oscillator.connect(this.metronomeGain);
        oscillator.frequency.value = 800;
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
        
        const beatElement = document.getElementById('game-metronome-beat');
        beatElement.classList.add('active');
        setTimeout(() => beatElement.classList.remove('active'), 100);
        
        this.beatTimes.push(Date.now());
    }
    
    recordGameTap() {
        const tapTime = Date.now();
        if (!this.beatTimes.length) return;

        let closestBeatIndex = -1;
        let minDiff = Infinity;

        // Find the beat with the minimum time difference
        for (let i = 0; i < this.beatTimes.length; i++) {
            const diff = Math.abs(tapTime - this.beatTimes[i]);
            if (diff < minDiff) {
                minDiff = diff;
                closestBeatIndex = i;
            }
        }

        // Ignore tap if it's too far from any beat (more than half a beat interval)
        if (minDiff > this.beatInterval / 2) {
            console.log(`Ignoring tap, too far from beat: ${minDiff}ms`);
            return;
        }

        // Ignore tap if this beat has already been matched
        if (this.tappedBeats.has(closestBeatIndex)) {
            console.log(`Ignoring tap, beat ${closestBeatIndex} already has a tap.`);
            return;
        }

        const offset = tapTime - this.beatTimes[closestBeatIndex];
        this.tapOffsets.push(offset);
        this.tappedBeats.add(closestBeatIndex);

        this.updateGameStats();
        this.updateGameProgress();
    }
    
    updateGameStats() {
        const tapsCount = document.getElementById('game-taps-count');
        const avgOffset = document.getElementById('game-avg-offset');
        const consistency = document.getElementById('game-consistency');
        
        tapsCount.textContent = this.tapOffsets.length;
        
        if (this.tapOffsets.length >= 3) {
            const offset = this.calculateGameOffset();
            const consistencyValue = this.calculateGameConsistency();
            
            avgOffset.textContent = Math.round(offset) + 'ms';
            consistency.textContent = Math.round(consistencyValue) + '%';
            
            // Show which taps are being used for calculation
            const windowSize = Math.min(10, this.tapOffsets.length);
            if (this.tapOffsets.length >= 3) {
                avgOffset.title = `Average of last ${windowSize} taps`;
                consistency.title = `Consistency of last ${windowSize} taps`;
            }
        }
    }
    
    updateGameProgress() {
        const progress = Math.min(this.tapOffsets.length / this.targetTaps, 1) * 100;
        document.getElementById('game-calibration-progress-fill').style.width = progress + '%';
    }
    
    calculateGameOffset() {
        if (this.tapOffsets.length < 3) return 0;
        
        // Use only the last 8-10 taps (sliding window approach)
        const windowSize = Math.min(10, this.tapOffsets.length);
        const startIndex = Math.max(0, this.tapOffsets.length - windowSize);
        const recentOffsets = this.tapOffsets.slice(startIndex);
        
        // Calculate simple average of recent taps
        const sum = recentOffsets.reduce((a, b) => a + b, 0);
        return Math.round(sum / recentOffsets.length);
    }
    
    calculateGameConsistency() {
        if (this.tapOffsets.length < 3) return 0;
        
        // Use only the last 8-10 taps (sliding window approach)
        const windowSize = Math.min(10, this.tapOffsets.length);
        const startIndex = Math.max(0, this.tapOffsets.length - windowSize);
        const recentOffsets = this.tapOffsets.slice(startIndex);
        
        // Calculate standard deviation of recent taps
        const mean = recentOffsets.reduce((a, b) => a + b, 0) / recentOffsets.length;
        const variance = recentOffsets.reduce((sum, offset) => sum + Math.pow(offset - mean, 2), 0) / recentOffsets.length;
        const stdDev = Math.sqrt(variance);
        
        // Convert standard deviation to consistency percentage
        // Lower stdDev = higher consistency (0ms stdDev = 100%, increases as stdDev gets worse)
        return Math.max(0, Math.min(100, 100 - (stdDev / 15)));
    }
    
    finishGameCalibration() {
        this.isCalibrating = false;
        
        if (this.tapOffsets.length >= this.minTaps) {
            const offset = this.calculateGameOffset();
            const savedOffset = gameSettings.saveCalibration(offset);
            
            this.removeCalibrationOverlay();
            this.updateCalibrationStatus();
            this.showNotification(`Audio calibration saved! Offset: ${savedOffset}ms`);
        } else {
            this.showNotification('Not enough taps recorded. Please try again.', true);
        }
    }
    
    skipGameCalibration() {
        this.isCalibrating = false;
        this.removeCalibrationOverlay();
    }
    
    removeCalibrationOverlay() {
        const overlay = document.getElementById('game-calibration-overlay');
        if (overlay) {
            document.removeEventListener('keydown', this.calibrationKeyListener);
            overlay.remove();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
    
    openModal() {
        this.modal.classList.add('active');
        this.loadCurrentSettings(); // Refresh values
    }
    
    closeModal() {
        this.modal.classList.remove('active');
    }
    
    showNotification(message, isError = false) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isError ? 'rgba(255, 100, 100, 0.9)' : 'rgba(0, 255, 170, 0.9)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 3000;
            font-family: 'Orbitron', monospace;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Make GameSettingsUI globally available
window.GameSettingsUI = GameSettingsUI;
