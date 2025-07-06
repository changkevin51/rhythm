// Game Initialization and Startup Logic
class GameInitializer {
    constructor() {
        this.initializeStartButton();
    }

    initializeStartButton() {
        // The button click handler for starting the game
        document.getElementById('start-game-btn').addEventListener('click', async () => {
            if (!window.chartDataFromLoader && !window.fileUploadManager.filesLoaded.chart) {
                alert("Chart data not loaded! Please select a song or upload a file.");
                return;
            }

            console.log('Start game button clicked, preparing to start...');
            
            // Disable the start button to prevent multiple clicks
            const startBtn = document.getElementById('start-game-btn');
            startBtn.disabled = true;
            startBtn.textContent = 'Starting...';
            
            try {
                // Initialize wave manager if available and wait for it to be ready
                if (typeof waveManager !== 'undefined' && waveManager.loadPromise) {
                    console.log('Waiting for existing wave manager to be ready...');
                    await waveManager.loadPromise; // Wait for wave frames to load
                    console.log('Wave manager ready');
                } else if (typeof WaveAnimationManager !== 'undefined') {
                    console.log('Creating wave manager...');
                    window.waveManager = new WaveAnimationManager();
                    await waveManager.loadPromise; // Wait for wave frames to load
                    console.log('Wave manager ready');
                }
                
                // Small delay to ensure DOM is fully ready
                await new Promise(resolve => setTimeout(resolve, 100));
                
                console.log('Starting game now...');
                await this.startGameNow();
                
            } catch (error) {
                console.error('Error during game initialization:', error);
                alert('Error starting game: ' + error.message);
                
                // Re-enable the button
                startBtn.disabled = false;
                startBtn.textContent = 'Start Game';
            }
        });
    }
    
    async startGameNow() {
        console.log('Starting game now...');
        
        // Debug: Check critical elements
        const audioElement = document.getElementById('audioPlayer');
        const canvasElement = document.getElementById('myCanvas');
        console.log('Audio element exists:', !!audioElement);
        console.log('Canvas element exists:', !!canvasElement);
        console.log('Chart data exists:', !!window.chartDataFromLoader);
        console.log('Chart data length:', window.chartDataFromLoader ? window.chartDataFromLoader.length : 0);
        
        if (!window.chartDataFromLoader) {
            console.error('No chart data available!');
            alert('No chart data loaded. Please select a song first.');
            return;
        }
        
        if (!audioElement) {
            console.error('Audio element not found!');
            alert('Audio player not found. There may be an issue with the HTML.');
            return;
        }
        
        if (!canvasElement) {
            console.error('Canvas element not found!');
            alert('Game canvas not found. There may be an issue with the HTML.');
            return;
        }
        
        try {
            // 0. First initialize game elements
            if (!(await initializeGameElements())) {
                throw new Error('Failed to initialize game elements (canvas, audio, etc.)');
            }
            
            // 0.5. Reset game state to ensure clean start
            resetGameState();
            
            // 1. Process the chart data using the original working function
            processChartData(window.chartDataFromLoader);

            // 2. Apply settings from the form if they exist
            if (document.getElementById('inputScale')) {
                Scale = Number(document.getElementById('inputScale').value) || 100;
            }
            if (document.getElementById("scrollDurationInput")) {
                scrollDuration = Number(document.getElementById("scrollDurationInput").value) || 500;
            }
            if (document.getElementById("inputOffset")) {
                offset = Number(document.getElementById("inputOffset").value) || -40;
            }
            updateOffsetFromSettings(); // Update effective offset
            
            // --- THIS IS THE FIX ---
            // Get the baseMpB from the first timing point.
            const baseBPMElement = document.getElementById("baseBPM");
            if (baseBPMElement && baseBPMElement.value) {
                // If user provides a value, use it (convert BPM to ms per beat)
                baseMpB = 60000 / Number(baseBPMElement.value);
                console.log(`User-provided baseMpB: ${baseMpB} (from ${baseBPMElement.value} BPM)`);
            } else {
                // Get it automatically from the first uninherited timing point.
                const chartBaseMpB = getBaseMpBFromChart();
                if (chartBaseMpB && chartBaseMpB > 0) {
                    console.log(`Auto-detected baseMpB: ${baseMpB}`);
                } else {
                    console.error('Failed to auto-detect baseMpB from chart. Using default value.');
                    baseMpB = 500; // Default fallback
                }
            }
            // --- END OF FIX ---

            // 3. Hide setup, show game
            const gameSetup = document.getElementById('game-setup');
            const gameContainer = document.getElementById('game-container');
            
            if (gameSetup) {
                gameSetup.classList.remove('active');
                gameSetup.style.setProperty('display', 'none', 'important'); // Force hide with !important
                console.log('Game setup hidden');
            }
            
            if (gameContainer) {
                gameContainer.classList.add('active');
                gameContainer.style.display = 'block'; // Ensure game container is visible
                console.log('Game container shown');
            }

            // 4. Initialize key listeners and start the game
            initKeyListener();
            updateOffsetFromSettings(); // Ensure offset is updated one more time
            
            console.log('Starting game with chartDataFromLoader:', !!window.chartDataFromLoader);
            console.log('Starting game loop...');
            
            // Start the actual game loop
            startTime();
            
            // Add a timeout to detect if the game gets stuck
            const gameStartTimeout = setTimeout(() => {
                alert('Game appears to be stuck during startup. Please refresh and try again.');
            }, 10000); // 10 second timeout
            
            try {
                clearTimeout(gameStartTimeout);
            } catch (error) {
                console.error('Error during final game start:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error starting game:', error);
            alert('Error starting game: ' + error.message);
        }
    }
}

// Initialize all managers when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing managers...');
    
    // Initialize BeatmapUtils API
    window.beatmapAPI = (typeof GameUtils !== 'undefined' && GameUtils.beatmap) ? GameUtils.beatmap : BeatmapUtils;
    
    // Initialize SongManager first
    window.songManager = new SongManager();
    
    // Initialize managers
    window.fileUploadManager = new FileUploadManager();
    window.gameInitializer = new GameInitializer();
    
    // Check for song parameter in URL and load it
    const songId = window.songManager.getSongFromURL();
    const urlParams = new URLSearchParams(window.location.search);
    const openSettings = urlParams.get('settings') === 'true';
    
    if (songId) {
        console.log(`Song parameter found in URL: ${songId}`);
        try {
            await window.songManager.loadSongAndSetup(songId);
            console.log(`Successfully loaded song: ${songId}`);
        } catch (error) {
            console.error(`Error loading song ${songId}:`, error);
            // Hide loading screen and show upload section if song fails to load
            document.getElementById('loading-screen').classList.remove('active');
            document.getElementById('custom-upload-section').style.display = 'block';
        }
    } else {
        console.log('No song parameter found, showing upload section');
        // No song parameter, show upload section
        document.getElementById('loading-screen').classList.remove('active');
        document.getElementById('custom-upload-section').style.display = 'block';
    }
    
    // Check if settings should be opened
    if (openSettings) {
        // Wait a bit for the UI to be ready, then open settings
        setTimeout(() => {
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) {
                settingsModal.style.display = 'flex';
            }
        }, 500);
    }
    
    // Initialize Settings UI after gameSettings is available
    setTimeout(() => {
        if (typeof gameSettings !== 'undefined') {
            window.gameSettingsUI = new GameSettingsUI();
            console.log('Game settings UI initialized');
        } else {
            console.warn('gameSettings not available, settings UI not initialized');
        }
    }, 100);
    
    // Initialize WaveAnimationManager if available
    if (typeof WaveAnimationManager !== 'undefined') {
        console.log('WaveAnimationManager class found, initializing wave manager...');
        window.waveManager = new WaveAnimationManager();
        waveManager.loadPromise.then(() => {
            console.log('Wave animation manager loaded and ready');
        }).catch(error => {
            console.error('Error loading wave animation manager:', error);
        });
    } else {
        console.log('WaveAnimationManager class not available');
    }
});

// Make GameInitializer globally available
window.GameInitializer = GameInitializer;
