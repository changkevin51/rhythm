class GamePageInitializer {
    constructor() {
        this.initializeGlobalVariables();
        this.setupEventListeners();
    }

    initializeGlobalVariables() {
        window.chartDataFromLoader = null;
        window.filesLoaded = { chart: false, audio: false };
        window.currentUploadMode = 'individual';
        window.oszData = null;
        window.availableCharts = [];

        window.beatmapAPI = (typeof GameUtils !== 'undefined' && GameUtils.beatmap) ? GameUtils.beatmap : BeatmapUtils;
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const songParam = urlParams.get('song');
            
            if (!songParam) {
                this.showUploadSection();
            }
        });
    }

    showUploadSection() {
        console.log('No song parameter found, showing upload section');
        
        const loadingScreen = document.getElementById('loading-screen');
        const customUploadSection = document.getElementById('custom-upload-section');
        const gameSetup = document.getElementById('game-setup');
        
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
            loadingScreen.style.display = 'none';
            console.log('Loading screen hidden');
        }
        
        if (gameSetup) {
            gameSetup.style.display = 'block';
            gameSetup.classList.add('active');
            console.log('Game setup shown');
        }
        
        if (customUploadSection) {
            customUploadSection.style.display = 'block';
            console.log('Custom upload section shown');
        } else {
            console.error('Custom upload section not found!');
        }
        
        setTimeout(() => {
            if (window.fileUploadManager) {
                console.log('FileUploadManager is available');
            } else {
                console.warn('FileUploadManager not available, initializing fallback');
                this.initializeFallbackUploadHandlers();
            }
        }, 500);
    }

    initializeFallbackUploadHandlers() {
        console.log('Initializing fallback upload handlers');
        
        const oszUpload = document.getElementById('uploadOsz');
        if (oszUpload) {
            oszUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                console.log('OSZ file selected:', file.name);
                
                try {
                    if (!window.beatmapAPI.isValidArchive(file)) {
                        throw new Error('Invalid archive format. Please use .osz files.');
                    }
                    
                    console.log('Extracting OSZ archive...');
                    const extractedData = await window.beatmapAPI.extractOszArchive(file);
                    console.log('Extracted data:', extractedData);
                    
                    if (extractedData.charts.length === 0) {
                        throw new Error('No valid osu!mania charts found in the archive.');
                    }
                    
                    window.oszData = extractedData;
                    window.availableCharts = extractedData.charts;
                    
                    this.handleChartSelection(extractedData.charts);
                    
                } catch (error) {
                    console.error('Error processing OSZ file:', error);
                    alert('Error: ' + error.message);
                }
            });
        }
    }

    async handleChartSelection(charts) {
        console.log('Handling chart selection for', charts.length, 'charts');
        
        if (charts.length === 1) {
            this.selectChart(0, charts);
        } else {
            try {
                const selectedChart = await window.beatmapAPI.showChartSelectionDialog(charts);
                if (selectedChart) {
                    const chartIndex = charts.findIndex(chart => chart === selectedChart);
                    this.selectChart(chartIndex, charts);
                }
            } catch (error) {
                console.error('Error in chart selection:', error);
                
                if (window.fileUploadManager && window.fileUploadManager.showChartSelectionModal) {
                    this.showDifficultySelectionInterface(charts);
                }
            }
        }
    }

    
    showDifficultySelectionInterface(charts) {
        console.log('Showing difficulty selection interface for', charts.length, 'charts');
        
        
        document.getElementById('custom-upload-section').style.display = 'none';
        document.getElementById('difficulty-selection-container').style.display = 'block';
        
        const chartsCountElement = document.getElementById('charts-found-count');
        const selectBtn = document.getElementById('select-chart-btn');
        
        if (chartsCountElement) {
            chartsCountElement.textContent = `${charts.length} chart${charts.length > 1 ? 's' : ''} found`;
        }
        
        if (selectBtn) {
            selectBtn.onclick = () => {
                console.log('Select chart button clicked');
                
                if (window.fileUploadManager && window.fileUploadManager.showChartSelectionModal) {
                    window.fileUploadManager.availableCharts = charts;
                    window.fileUploadManager.showChartSelectionModal(charts);
                }
            };
        }
    }

    
    selectChart(index, charts) {
        const selectedChart = charts[index];
        const metadata = window.beatmapAPI.parseChartMetadata(selectedChart.content);
        
        console.log('Selected chart:', metadata);
        
        
        window.chartDataFromLoader = selectedChart.content;
        window.filesLoaded = { chart: true, audio: true };
        
        
        const selectedInfo = document.getElementById('selected-chart-info');
        const selectedTitle = document.getElementById('selected-chart-title');
        const selectedDetails = document.getElementById('selected-chart-details');
        
        if (selectedTitle) selectedTitle.textContent = metadata.title;
        if (selectedDetails) selectedDetails.textContent = `${metadata.artist} - [${metadata.version}] by ${metadata.creator}`;
        if (selectedInfo) selectedInfo.style.display = 'block';
        
        
        const settingsElements = [
            'settings-divider',
            'game-settings-grid', 
            'quick-settings'
        ];
        
        settingsElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = id === 'game-settings-grid' ? 'grid' : 'block';
            }
        });
        
        console.log('Chart selection complete, game settings shown');
    }

    
    switchUploadMode(mode) {
        if (window.fileUploadManager) {
            window.fileUploadManager.switchUploadMode(mode);
        } else {
            
            console.log('Switching upload mode to:', mode);
            window.currentUploadMode = mode;
            
            const individualUpload = document.getElementById('individual-upload');
            const oszUpload = document.getElementById('osz-upload');
            const modeButtons = document.querySelectorAll('.mode-btn');
            
            
            modeButtons.forEach(btn => {
                btn.classList.remove('active');
                if ((mode === 'individual' && btn.textContent.includes('Individual')) ||
                    (mode === 'osz' && btn.textContent.includes('OSZ'))) {
                    btn.classList.add('active');
                }
            });
            
            
            if (mode === 'individual') {
                if (individualUpload) individualUpload.style.display = 'block';
                if (oszUpload) oszUpload.style.display = 'none';
            } else if (mode === 'osz') {
                if (individualUpload) individualUpload.style.display = 'none';
                if (oszUpload) oszUpload.style.display = 'block';
            }
        }
    }
}


const gamePageInitializer = new GamePageInitializer();


window.switchUploadMode = (mode) => gamePageInitializer.switchUploadMode(mode);


if (typeof window !== 'undefined') {
    window.GamePageInitializer = GamePageInitializer;
    window.gamePageInitializer = gamePageInitializer;
}
