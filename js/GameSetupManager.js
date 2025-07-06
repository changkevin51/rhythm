// Enhanced Game Setup Functionality
class GameSetupManager {
    constructor() {
        this.initializeGameSetup();
    }

    initializeGameSetup() {
        const settings = gameSettings.getAll();
        
        // Set default values from settings
        const scaleInput = document.getElementById('inputScale');
        const speedInput = document.getElementById('scrollDurationInput');
        const offsetInput = document.getElementById('inputOffset');
        const scaleDisplay = document.getElementById('scale-display');
        const speedDisplay = document.getElementById('speed-display');
        const offsetDisplay = document.getElementById('offset-display');
        const offsetBreakdown = document.getElementById('offset-breakdown');
        
        if (scaleInput) {
            scaleInput.value = settings.scale;
            scaleInput.addEventListener('input', this.updateGameSetupDisplays);
        }
        
        if (speedInput) {
            speedInput.value = settings.scrollSpeed;
            speedInput.addEventListener('input', this.updateGameSetupDisplays);
        }
        
        if (offsetInput) {
            const defaultOffset = gameSettings.getDefaultGameOffset();
            offsetInput.value = defaultOffset;
            offsetInput.addEventListener('input', this.updateOffsetDisplay);
            
            console.log('Setting default offset to:', defaultOffset);
            console.log('Audio calibration offset:', gameSettings.get('audioOffset'));
        }
        
        this.updateGameSetupDisplays();
        this.updateOffsetDisplay();
        
        this.setupScrollDetection();
    }
    
    setupScrollDetection() {
        const gameSetup = document.getElementById('game-setup');
        const customUploadSection = document.getElementById('custom-upload-section');
        const gameSettingsGrid = document.querySelector('.game-settings-grid');
        
        function checkScrollable(element) {
            if (!element) return;
            
            const hasScroll = element.scrollHeight > element.clientHeight;
            element.classList.toggle('has-scroll', hasScroll);
            
            if (hasScroll) {
                element.addEventListener('scroll', () => {
                    const isNearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 10;
                    element.classList.toggle('scrolled-to-bottom', isNearBottom);
                });
            }
        }
        
        setTimeout(() => {
            checkScrollable(gameSetup);
            checkScrollable(customUploadSection);
            checkScrollable(gameSettingsGrid);
        }, 100);
        
        window.addEventListener('resize', () => {
            setTimeout(() => {
                checkScrollable(gameSetup);
                checkScrollable(customUploadSection);
                checkScrollable(gameSettingsGrid);
            }, 100);
        });
    }
    
    updateGameSetupDisplays() {
        const scaleInput = document.getElementById('inputScale');
        const speedInput = document.getElementById('scrollDurationInput');
        const scaleDisplay = document.getElementById('scale-display');
        const speedDisplay = document.getElementById('speed-display');
        
        if (scaleInput && scaleDisplay) {
            scaleDisplay.textContent = scaleInput.value + '%';
        }
        
        if (speedInput && speedDisplay) {
            speedDisplay.textContent = speedInput.value;
        }
    }
    
    updateOffsetDisplay() {
        const offsetInput = document.getElementById('inputOffset');
        const offsetDisplay = document.getElementById('offset-display');
        const offsetBreakdown = document.getElementById('offset-breakdown');
        
        if (offsetInput && offsetDisplay) {
            const totalOffset = parseInt(offsetInput.value);
            const audioOffset = gameSettings.get('audioOffset');
            const manualOffset = totalOffset - audioOffset;
            
            offsetDisplay.textContent = totalOffset + 'ms';
            
            if (offsetBreakdown) {
                offsetBreakdown.innerHTML = `Manual: ${manualOffset}ms + Audio Calibration: ${audioOffset}ms`;
            }
        }
    }

    showGameSetup(chartText, songTitle) {
        window.chartDataFromLoader = chartText;

        document.getElementById('loading-screen').classList.remove('active');
        const setupScreen = document.getElementById('game-setup');
        setupScreen.classList.add('active');
        document.getElementById('setup-title').textContent = songTitle || "Custom Song";

        this.initializeGameSetup();

        if (!chartText) {
            this.clearBackgroundImage();
            
            document.getElementById('custom-upload-section').style.display = 'block';
            setupScreen.classList.add('has-custom-upload');
            document.getElementById('start-game-btn').disabled = true;
            
            document.getElementById('setup-title').textContent = "Custom Song Setup";
        } else {
            document.getElementById('custom-upload-section').style.display = 'none';
            setupScreen.classList.remove('has-custom-upload');
            document.getElementById('start-game-btn').disabled = false;
        }
    }

    hideGameSettings() {
        document.getElementById('start-game-btn').disabled = true;
    }

    clearBackgroundImage() {
        const existingStyles = document.querySelectorAll('style');
        existingStyles.forEach(style => {
            if (style.textContent.includes('game-setup.has-background::before')) {
                style.remove();
            }
        });
    }
}

function initializeGameSetup() {
    if (!window.gameSetupManager) {
        window.gameSetupManager = new GameSetupManager();
    }
    return window.gameSetupManager.initializeGameSetup();
}

function updateGameSetupDisplays() {
    if (window.gameSetupManager) {
        window.gameSetupManager.updateGameSetupDisplays();
    }
}

function updateOffsetDisplay() {
    if (window.gameSetupManager) {
        window.gameSetupManager.updateOffsetDisplay();
    }
}

function showGameSetup(chartText, songTitle) {
    if (!window.gameSetupManager) {
        window.gameSetupManager = new GameSetupManager();
    }
    return window.gameSetupManager.showGameSetup(chartText, songTitle);
}

function hideGameSettings() {
    if (window.gameSetupManager) {
        window.gameSetupManager.hideGameSettings();
    }
}

function clearBackgroundImage() {
    if (window.gameSetupManager) {
        window.gameSetupManager.clearBackgroundImage();
    }
}

window.GameSetupManager = GameSetupManager;
