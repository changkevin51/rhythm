// File Upload Management
class FileUploadManager {
    constructor() {
        this.filesLoaded = { chart: false, audio: false };
        this.currentUploadMode = 'individual';
        this.oszData = null;
        this.availableCharts = [];
        this.initializeUploadHandlers();
    }

    initializeUploadHandlers() {
        // Individual File Upload Logic
        document.getElementById('uploadOsu').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // Validate file type
                if (!window.beatmapAPI.isValidChartFile(file)) {
                    throw new Error('Invalid chart file format. Please use .osu or .txt files.');
                }

                const chartData = await window.beatmapAPI.readChartFile(file);
                
                window.chartDataFromLoader = chartData;
                this.filesLoaded.chart = true;
                this.showStatus('chart-status', `Loaded: ${file.name}`);
                
                if (this.filesLoaded.audio) {
                    this.showGameSettings();
                }
            } catch (error) {
                this.showStatus('chart-status', `Error: ${error.message}`, true);
                this.filesLoaded.chart = false;
                window.chartDataFromLoader = null;
            }
        });

        document.getElementById('uploadAudio').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // Validate file type
                if (!window.beatmapAPI.isValidAudioFile(file)) {
                    throw new Error('Invalid audio file format. Please use .mp3, .wav, or .ogg files.');
                }

                const audioElement = document.getElementById('audioPlayer');
                const audioData = await window.beatmapAPI.readAudioFile(file);
                await window.beatmapAPI.setupAudioElement(audioElement, audioData);
                
                this.filesLoaded.audio = true;
                this.showStatus('audio-status', `Loaded: ${file.name}`);
                
                if (this.filesLoaded.chart) {
                    this.showGameSettings();
                }
            } catch (error) {
                this.showStatus('audio-status', `Error: ${error.message}`, true);
                this.filesLoaded.audio = false;
            }
        });

        // OSZ File Upload Logic
        document.getElementById('uploadOsz').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                this.showStatus('osz-status', 'Extracting archive...');
                
                const extractedFiles = await window.beatmapAPI.extractOszArchive(file);
                this.oszData = extractedFiles;
                
                if (extractedFiles.charts.length === 0) {
                    throw new Error('No valid osu!mania charts found in the archive.');
                }
                
                if (extractedFiles.audio.length === 0) {
                    throw new Error('No audio files found in the archive.');
                }
                
                // Auto-setup audio with first available audio file
                const firstAudio = extractedFiles.audio[0];
                const audioElement = document.getElementById('audioPlayer');
                await window.beatmapAPI.setupAudioElement(audioElement, firstAudio);
                
                this.showStatus('osz-status', `Extracted ${extractedFiles.charts.length} chart(s) and ${extractedFiles.audio.length} audio file(s)`);
                
                this.populateChartSelector(extractedFiles.charts);
                
            } catch (error) {
                this.showStatus('osz-status', `Error: ${error.message}`, true);
                this.oszData = null;
                this.availableCharts = [];
            }
        });
    }

    // Upload mode switching
    switchUploadMode(mode) {
        this.currentUploadMode = mode;
        
        // Update button states
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Show/hide sections
        document.querySelectorAll('.upload-section').forEach(section => section.classList.remove('active'));
        document.getElementById(mode === 'individual' ? 'individual-upload' : 'osz-upload').classList.add('active');
        
        // Reset states
        this.resetUploadStates();
    }

    resetUploadStates() {
        this.filesLoaded = { chart: false, audio: false };
        window.chartDataFromLoader = null;
        this.oszData = null;
        this.availableCharts = [];
        document.getElementById('start-game-btn').disabled = true;
        
        // Clear background image
        if (window.clearBackgroundImage) {
            window.clearBackgroundImage();
        }
        
        // Hide all status messages
        document.querySelectorAll('.file-status').forEach(status => {
            status.style.display = 'none';
        });
        
        // Reset file inputs
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.value = '';
        });
        
        // Hide game settings
        if (window.hideGameSettings) {
            window.hideGameSettings();
        }
    }

    showStatus(elementId, message, isError = false) {
        const statusDiv = document.getElementById(elementId);
        statusDiv.textContent = message;
        statusDiv.className = `file-status ${isError ? 'error' : 'success'}`;
        statusDiv.style.display = 'block';
    }

    showGameSettings() {
        document.getElementById('start-game-btn').disabled = false;
    }

    populateChartSelector(charts) {
        this.availableCharts = charts;
        const chartsCountElement = document.getElementById('charts-found-count');
        const selectBtn = document.getElementById('select-chart-btn');
        const selectedInfo = document.getElementById('selected-chart-info');
        
        chartsCountElement.textContent = `${charts.length} chart${charts.length > 1 ? 's' : ''} found`;
        
        // Show difficulty selection container
        document.getElementById('difficulty-selection-container').style.display = 'block';
        
        // Add click event to select button
        selectBtn.onclick = () => this.showChartSelectionModal(charts);
        
        // Auto-select if only one chart
        if (charts.length === 1) {
            this.selectChart(0, charts);
        }
    }

    async showChartSelectionModal(charts) {
        try {
            // Use the better chart selection dialog from GameUtils
            const selectedChart = await GameUtils.beatmap.showChartSelectionDialog(charts);
            
            if (selectedChart) {
                // Find the index of the selected chart
                const selectedIndex = charts.findIndex(chart => chart === selectedChart);
                if (selectedIndex !== -1) {
                    this.selectChart(selectedIndex, charts);
                }
            }
        } catch (error) {
            console.error('Error showing chart selection modal:', error);
            // Fallback to selecting the first chart if there's an error
            if (charts.length > 0) {
                this.selectChart(0, charts);
            }
        }
    }

    selectChart(index, charts) {
        const selectedChart = charts[index];
        window.chartDataFromLoader = selectedChart.content;
        
        const metadata = window.beatmapAPI.parseChartMetadata(selectedChart.content);
        
        // Update selected chart info
        const selectedInfo = document.getElementById('selected-chart-info');
        selectedInfo.innerHTML = `
            <strong>${metadata.title}</strong><br>
            <span class="chart-details">${metadata.artist} - [${metadata.version}]</span>
        `;
        selectedInfo.style.display = 'block';
        
        // Enable start button
        this.showGameSettings();
        
        // Add background image if available
        if (this.oszData && this.oszData.images.length > 0) {
            this.setBackgroundImage(this.oszData.images[0].url);
        }
    }

    setBackgroundImage(imageUrl) {
        // Remove any existing background style elements
        if (window.clearBackgroundImage) {
            window.clearBackgroundImage();
        }
        
        // Create new style element for background
        const style = document.createElement('style');
        style.textContent = `
            .game-setup.has-background::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: url('${imageUrl}');
                background-size: cover;
                background-position: center;
                opacity: 0.1;
                z-index: -1;
            }
        `;
        document.head.appendChild(style);
        
        // Add background class to game setup
        document.getElementById('game-setup').classList.add('has-background');
    }
}

// Global functions to maintain compatibility
function switchUploadMode(mode) {
    if (window.fileUploadManager) {
        window.fileUploadManager.switchUploadMode(mode);
    }
}

// Make FileUploadManager globally available
window.FileUploadManager = FileUploadManager;
