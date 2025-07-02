/**
 * Settings Manager for Rhythm Game
 * Handles user preferences, key bindings, and game configuration
 */

class SettingsManager {
    constructor() {
        this.defaultSettings = {
            // Gameplay settings
            scrollSpeed: 500,
            offset: -50,
            audioOffset: 0,            isCalibrated: false,            scale: 100,
            
            // Controls
            keyBindings: [68, 70, 74, 75],            keyLayout: 'DFJK',
            
            // Audio settings
            masterVolume: 100,
            effectsVolume: 80,
            musicVolume: 90,
            
            // Visual settings
            showFPS: false,
            showTimingDisplay: true,
            particleEffects: true,
            screenShake: true,
            flashEffects: true,
            backgroundDim: 20,
            
            // Gameplay features
            autoPlay: false,
            noFail: false,
            suddenDeath: false,
            
            // Skin settings
            skinName: 'default',
            noteStyle: 'classic',
            hitSounds: true,
            
            // Performance
            vsync: true,
            maxFPS: 60,
            
            // Statistics
            totalPlayCount: 0,
            totalScore: 0,
            averageAccuracy: 0,
            favoriteKey: 0,
            calibrationAttempts: 0,  // Track how many times user has calibrated
            lastCalibrationDate: null  // When calibration was last done
        };
        
        this.settings = { ...this.defaultSettings };
        this.loadSettings();
        
        // Key preset definitions
        this.keyPresets = {
            'DFJK': { keys: [68, 70, 74, 75], name: 'D-F-J-K (Default)' },
            'ASDF': { keys: [65, 83, 68, 70], name: 'A-S-D-F' },
            'HJKL': { keys: [72, 74, 75, 76], name: 'H-J-K-L' },
            '1234': { keys: [49, 50, 51, 52], name: '1-2-3-4' },
            'ZXCV': { keys: [90, 88, 67, 86], name: 'Z-X-C-V' },
            'QWER': { keys: [81, 87, 69, 82], name: 'Q-W-E-R' },
            'custom': { keys: [68, 70, 74, 75], name: 'Custom' }
        };
        
        // Timing window presets
        this.timingPresets = {
            'very-easy': { windows: [25, 50, 85, 120, 160, 200], name: 'Very Easy' },
            'easy': { windows: [20, 42, 75, 110, 145, 180], name: 'Easy' },
            'normal': { windows: [16, 37, 70, 100, 123, 161], name: 'Normal' },
            'hard': { windows: [13, 32, 60, 85, 105, 140], name: 'Hard' },
            'very-hard': { windows: [10, 25, 45, 70, 90, 120], name: 'Very Hard' },
            'expert': { windows: [8, 20, 35, 55, 75, 100], name: 'Expert' }
        };
        
        this.callbacks = new Map();
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('rhythmGameSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    this.settings = { ...this.defaultSettings, ...parsed };
                } else {
                    this.settings = { ...this.defaultSettings };
                }
            } else {
                this.settings = { ...this.defaultSettings };
            }
        } catch (error) {
            console.warn('Failed to load settings, using defaults:', error);
            this.settings = { ...this.defaultSettings };
        }
        
        this.validateSettings();
    }
    
    saveSettings() {
        try {
            localStorage.setItem('rhythmGameSettings', JSON.stringify(this.settings));
            this.notifyCallbacks('settingsSaved');
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }
    
    validateSettings() {
        // Ensure settings object exists
        if (!this.settings || typeof this.settings !== 'object') {
            this.settings = {};
        }
        
        // Ensure all required settings exist with valid values
        Object.keys(this.defaultSettings).forEach(key => {
            if (this.settings[key] === undefined) {
                this.settings[key] = this.defaultSettings[key];
            }
        });
        
        // Validate ranges
        this.settings.scrollSpeed = Math.max(100, Math.min(2000, this.settings.scrollSpeed));
        this.settings.offset = Math.max(-500, Math.min(500, this.settings.offset));
        this.settings.scale = Math.max(50, Math.min(200, this.settings.scale));
        this.settings.masterVolume = Math.max(0, Math.min(100, this.settings.masterVolume));
        this.settings.effectsVolume = Math.max(0, Math.min(100, this.settings.effectsVolume));
        this.settings.musicVolume = Math.max(0, Math.min(100, this.settings.musicVolume));
        this.settings.backgroundDim = Math.max(0, Math.min(100, this.settings.backgroundDim));
        this.settings.maxFPS = Math.max(30, Math.min(240, this.settings.maxFPS));
        
        // Validate key bindings
        if (!Array.isArray(this.settings.keyBindings) || this.settings.keyBindings.length !== 4) {
            this.settings.keyBindings = [...this.defaultSettings.keyBindings];
        }
        
        // Update key layout if using preset
        if (this.keyPresets) {
            const preset = Object.entries(this.keyPresets).find(([key, preset]) => 
                JSON.stringify(preset.keys) === JSON.stringify(this.settings.keyBindings)
            );
            if (preset) {
                this.settings.keyLayout = preset[0];
            } else {
                this.settings.keyLayout = 'custom';
            }
        } else {
            this.settings.keyLayout = 'DFJK';
        }
    }
    
    get(key) {
        return this.settings[key];
    }
    
    set(key, value) {
        const oldValue = this.settings[key];
        this.settings[key] = value;
        this.validateSettings();
        
        if (oldValue !== this.settings[key]) {
            this.notifyCallbacks('settingChanged', { key, oldValue, newValue: this.settings[key] });
        }
        
        return this.settings[key];
    }
    
    getAll() {
        return { ...this.settings };
    }
    
    setMultiple(updates) {
        const changes = [];
        Object.entries(updates).forEach(([key, value]) => {
            const oldValue = this.settings[key];
            this.settings[key] = value;
            if (oldValue !== value) {
                changes.push({ key, oldValue, newValue: value });
            }
        });
        
        this.validateSettings();
        
        if (changes.length > 0) {
            this.notifyCallbacks('multipleSettingsChanged', changes);
        }
    }
    
    resetToDefaults() {
        const oldSettings = { ...this.settings };
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
        this.notifyCallbacks('settingsReset', { oldSettings, newSettings: this.settings });
    }
    
    resetSection(section) {
        const sectionKeys = {
            gameplay: ['scrollSpeed', 'offset', 'scale'],
            controls: ['keyBindings', 'keyLayout'],
            audio: ['masterVolume', 'effectsVolume', 'musicVolume'],
            visual: ['showFPS', 'showTimingDisplay', 'particleEffects', 'screenShake', 'flashEffects', 'backgroundDim'],
            performance: ['vsync', 'maxFPS']
        };
        
        if (sectionKeys[section]) {
            const updates = {};
            sectionKeys[section].forEach(key => {
                updates[key] = this.defaultSettings[key];
            });
            this.setMultiple(updates);
        }
    }
    
    setKeyLayout(layout) {
        if (this.keyPresets[layout]) {
            this.set('keyLayout', layout);
            this.set('keyBindings', [...this.keyPresets[layout].keys]);
        }
    }
    
    setCustomKeys(keys) {
        if (Array.isArray(keys) && keys.length === 4) {
            this.set('keyBindings', [...keys]);
            this.set('keyLayout', 'custom');
        }
    }
    
    getKeyName(keyCode) {
        const keyNames = {
            65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H',
            73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P',
            81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X',
            89: 'Y', 90: 'Z', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6',
            55: '7', 56: '8', 57: '9', 48: '0', 32: 'Space', 13: 'Enter', 27: 'Esc',
            37: '←', 38: '↑', 39: '→', 40: '↓', 16: 'Shift', 17: 'Ctrl', 18: 'Alt'
        };
        return keyNames[keyCode] || `Key${keyCode}`;
    }
    
    exportSettings() {
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            settings: this.settings
        };
        return JSON.stringify(exportData, null, 2);
    }
    
    importSettings(data) {
        try {
            const imported = typeof data === 'string' ? JSON.parse(data) : data;
            
            if (imported.settings) {
                this.settings = { ...this.defaultSettings, ...imported.settings };
                this.validateSettings();
                this.saveSettings();
                this.notifyCallbacks('settingsImported');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
    
    getGameplaySettings() {
        return {
            scrollSpeed: this.settings.scrollSpeed,
            offset: this.settings.offset,
            scale: this.settings.scale,
            keyBindings: [...this.settings.keyBindings],
            timingWindows: this.getTimingWindows(),
            autoPlay: this.settings.autoPlay,
            noFail: this.settings.noFail
        };
    }
    
    getTimingWindows() {
        // Default normal timing windows - could be made configurable
        return [16, 37, 70, 100, 123, 161];
    }
    
    updateStats(gameStats) {
        this.settings.totalPlayCount++;
        this.settings.totalScore += gameStats.score || 0;
        
        if (gameStats.accuracy !== undefined) {
            // Update running average accuracy
            const currentAvg = this.settings.averageAccuracy;
            const playCount = this.settings.totalPlayCount;
            this.settings.averageAccuracy = 
                (currentAvg * (playCount - 1) + gameStats.accuracy) / playCount;
        }
        
        // Track most used key (based on perfect hits)
        if (gameStats.keyHits) {
            const maxKey = gameStats.keyHits.indexOf(Math.max(...gameStats.keyHits));
            this.settings.favoriteKey = maxKey;
        }
        
        this.saveSettings();
    }
    
    getStatistics() {
        return {
            totalPlayCount: this.settings.totalPlayCount,
            totalScore: this.settings.totalScore,
            averageAccuracy: Math.round(this.settings.averageAccuracy * 100) / 100,
            favoriteKey: this.settings.favoriteKey
        };
    }
    
    // Audio calibration methods
    saveCalibration(offsetMs) {
        // Clamp offset to safe range (-300ms to +300ms)
        const clampedOffset = Math.max(-300, Math.min(300, offsetMs));
        
        this.settings.audioOffset = Math.round(clampedOffset);
        this.settings.isCalibrated = true;
        this.settings.calibrationAttempts++;
        this.settings.lastCalibrationDate = new Date().toISOString();
        
        this.saveSettings();
        this.notifyCallbacks('calibrationUpdated', {
            offset: this.settings.audioOffset,
            attempts: this.settings.calibrationAttempts
        });
        
        return this.settings.audioOffset;
    }
    
    getEffectiveOffset() {
        // Combine manual offset with calibrated audio offset
        return this.settings.offset + this.settings.audioOffset;
    }
    
    isCalibrationNeeded() {
        // Show calibration if never done or if it's been more than 30 days
        if (!this.settings.isCalibrated) return true;
        
        if (this.settings.lastCalibrationDate) {
            const lastCalibration = new Date(this.settings.lastCalibrationDate);
            const daysSince = (Date.now() - lastCalibration.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince > 30;
        }
        
        return false;
    }
    
    resetCalibration() {
        this.settings.audioOffset = 0;
        this.settings.isCalibrated = false;
        this.settings.calibrationAttempts = 0;
        this.settings.lastCalibrationDate = null;
        this.saveSettings();
    }

    // Update the default offset getter to prioritize calibrated offset
    getDefaultGameOffset() {
        // Return just the audio calibration offset for new games
        // This makes the calibrated offset the starting point for games
        return this.settings.audioOffset;
    }
    
    // Event system for settings changes
    onSettingChange(callback) {
        const id = Date.now() + Math.random();
        this.callbacks.set(id, callback);
        return id;
    }
    
    offSettingChange(id) {
        this.callbacks.delete(id);
    }
    
    notifyCallbacks(event, data) {
        this.callbacks.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Settings callback error:', error);
            }
        });
    }
    
    createSettingsPanel() {
        return `
        <div id="settingsPanel" class="settings-panel">
            <div class="settings-header">
                <h2>⚙️ Game Settings</h2>
                <button class="btn close-btn" onclick="closeSettings()">✕</button>
            </div>
            
            <div class="settings-content">
                <div class="settings-tabs">
                    <button class="tab-btn active" onclick="showSettingsTab('gameplay')">Gameplay</button>
                    <button class="tab-btn" onclick="showSettingsTab('controls')">Controls</button>
                    <button class="tab-btn" onclick="showSettingsTab('audio')">Audio</button>
                    <button class="tab-btn" onclick="showSettingsTab('visual')">Visual</button>
                    <button class="tab-btn" onclick="showSettingsTab('stats')">Statistics</button>
                </div>
                
                <div id="gameplayTab" class="settings-tab active">
                    <h3>Gameplay Settings</h3>
                    <div class="setting-group">
                        <label>Scroll Speed (ms): <span id="scrollSpeedValue">${this.settings.scrollSpeed}</span></label>
                        <input type="range" id="scrollSpeedSlider" min="200" max="1000" step="50" 
                               value="${this.settings.scrollSpeed}" onchange="updateSetting('scrollSpeed', this.value)">
                    </div>
                    
                    <div class="setting-group">
                        <label>Audio Offset (ms): <span id="offsetValue">${this.settings.offset}</span></label>
                        <input type="range" id="offsetSlider" min="-200" max="200" step="10" 
                               value="${this.settings.offset}" onchange="updateSetting('offset', this.value)">
                    </div>
                    
                    <div class="setting-group">
                        <label>Game Scale (%): <span id="scaleValue">${this.settings.scale}</span></label>
                        <input type="range" id="scaleSlider" min="50" max="150" step="10" 
                               value="${this.settings.scale}" onchange="updateSetting('scale', this.value)">
                    </div>
                    
                    <div class="setting-group">
                        <label><input type="checkbox" ${this.settings.noFail ? 'checked' : ''} 
                               onchange="updateSetting('noFail', this.checked)"> No Fail Mode</label>
                    </div>
                </div>
                
                <div id="controlsTab" class="settings-tab">
                    <h3>Control Settings</h3>
                    <div class="setting-group">
                        <label>Key Layout:</label>
                        <select onchange="updateKeyLayout(this.value)">
                            ${Object.entries(this.keyPresets).map(([key, preset]) => 
                                `<option value="${key}" ${this.settings.keyLayout === key ? 'selected' : ''}>${preset.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="key-bindings">
                        <h4>Current Keys:</h4>
                        <div class="key-display">
                            ${this.settings.keyBindings.map(key => 
                                `<span class="key-button">${this.getKeyName(key)}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
                
                <div id="audioTab" class="settings-tab">
                    <h3>Audio Settings</h3>
                    <div class="setting-group">
                        <label>Master Volume: <span id="masterVolumeValue">${this.settings.masterVolume}%</span></label>
                        <input type="range" id="masterVolumeSlider" min="0" max="100" 
                               value="${this.settings.masterVolume}" onchange="updateSetting('masterVolume', this.value)">
                    </div>
                    
                    <div class="setting-group">
                        <label>Music Volume: <span id="musicVolumeValue">${this.settings.musicVolume}%</span></label>
                        <input type="range" id="musicVolumeSlider" min="0" max="100" 
                               value="${this.settings.musicVolume}" onchange="updateSetting('musicVolume', this.value)">
                    </div>
                    
                    <div class="setting-group">
                        <label>Effects Volume: <span id="effectsVolumeValue">${this.settings.effectsVolume}%</span></label>
                        <input type="range" id="effectsVolumeSlider" min="0" max="100" 
                               value="${this.settings.effectsVolume}" onchange="updateSetting('effectsVolume', this.value)">
                    </div>
                </div>
                
                <div id="visualTab" class="settings-tab">
                    <h3>Visual Settings</h3>
                    <div class="setting-group">
                        <label><input type="checkbox" ${this.settings.showFPS ? 'checked' : ''} 
                               onchange="updateSetting('showFPS', this.checked)"> Show FPS Counter</label>
                    </div>
                    
                    <div class="setting-group">
                        <label><input type="checkbox" ${this.settings.particleEffects ? 'checked' : ''} 
                               onchange="updateSetting('particleEffects', this.checked)"> Particle Effects</label>
                    </div>
                    
                    <div class="setting-group">
                        <label><input type="checkbox" ${this.settings.screenShake ? 'checked' : ''} 
                               onchange="updateSetting('screenShake', this.checked)"> Screen Shake</label>
                    </div>
                    
                    <div class="setting-group">
                        <label>Background Dim: <span id="backgroundDimValue">${this.settings.backgroundDim}%</span></label>
                        <input type="range" id="backgroundDimSlider" min="0" max="100" 
                               value="${this.settings.backgroundDim}" onchange="updateSetting('backgroundDim', this.value)">
                    </div>
                </div>
                
                <div id="statsTab" class="settings-tab">
                    <h3>Statistics</h3>
                    <div class="stats-display">
                        <div class="stat-item">
                            <span class="stat-label">Total Plays:</span>
                            <span class="stat-value">${this.settings.totalPlayCount}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Total Score:</span>
                            <span class="stat-value">${this.settings.totalScore.toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Average Accuracy:</span>
                            <span class="stat-value">${Math.round(this.settings.averageAccuracy * 100) / 100}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Favorite Lane:</span>
                            <span class="stat-value">${this.settings.favoriteKey + 1}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-footer">
                <button class="btn" onclick="exportSettings()">📤 Export</button>
                <button class="btn" onclick="importSettings()">📥 Import</button>
                <button class="btn" onclick="resetSettings()">🔄 Reset</button>
                <button class="btn primary" onclick="saveAndCloseSettings()">💾 Save & Close</button>
            </div>
        </div>
        `;
    }
}

// Global settings instance
let gameSettings = new SettingsManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}
