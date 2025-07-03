"use strict";

class SongManager {
    constructor() {
        this.songs = {};
        this.currentSong = null;
        this.loadSongsConfig();
    }

    loadSongsConfig() {
        this.songs = {
            "naruto": { 
                id: "naruto", 
                title: "Silhouette", 
                artist: "KANA-BOON", 
                difficulty: "Multiple Difficulties", 
                difficultyColor: "#0080FF", 
                oszFile: "Songs/naruto/310793 KANA-BOON - Silhouette.osz",
                allowDifficultySelection: true,
                audioFile: "Songs/naruto/audio.mp3", 
                chartFile: "Songs/naruto/LeaF - Aleph-0 (jakads) [Cardinality].txt", 
                background: "linear-gradient(135deg, #001122 0%, #003366 50%, #0080FF 100%)", 
                description: "Ride the waves of ancient melodies" 
            },
            "quiet-water": { 
                id: "quiet-water", 
                title: "Quiet Water", 
                artist: "Toby Fox", 
                difficulty: "Multiple Difficulties", 
                difficultyColor: "#00FFAA", 
                oszFile: "Songs/quiet-water/1596272 toby fox - Quiet Water.osz",
                allowDifficultySelection: true,
                audioFile: null, 
                chartFile: null, 
                background: "linear-gradient(135deg, #003366 0%, #006699 50%, #00FFAA 100%)", 
                description: "Journey through oceanic paradise with ethereal waves" 
            },
            "yeah-boy": { 
                id: "yeah-boy", 
                title: "Yeah Boy - Shooting Stars", 
                artist: "BaconAkin", 
                difficulty: "Multiple Difficulties", 
                difficultyColor: "#00CCFF", 
                oszFile: "Songs/yeah-boy/576426 BaconAkin - Yeah Boy - Shooting Stars [no video].osz",
                allowDifficultySelection: true,
                audioFile: "Songs/yeah-boy/05 Fastest Crash.mp3", 
                chartFile: "Songs/Fastest Crash/Camellia - Fastest Crash (Shoegazer) [Paroxysm].txt", 
                background: "linear-gradient(135deg, #0099CC 0%, #00CCFF 50%, #80E0FF 100%)", 
                description: "Surf the stars with electronic wave madness" 
            },
            "nano-death": { 
                id: "nano-death", 
                title: "NANO DEATH!!!!!", 
                artist: "LeaF", 
                difficulty: "Multiple Difficulties", 
                difficultyColor: "#0066AA", 
                oszFile: "Songs/NANO DEATH/478161 LeaF - NANO DEATH!!!!!.osz",
                allowDifficultySelection: true,
                audioFile: "Songs/NANO DEATH/audio.mp3", 
                chartFile: "Songs/NANO DEATH/LeaF - NANO DEATH!!!!! (nowsmart) [Expert].txt", 
                background: "linear-gradient(135deg, #001166 0%, #0066AA 50%, #00AAFF 100%)", 
                description: "Microscopic tsunamis in electronic form" 
            },
            "senbonzakura": { 
                id: "senbonzakura", 
                title: "Senbonzakura", 
                artist: "Lindsey Stirling", 
                difficulty: "Multiple Difficulties", 
                difficultyColor: "#FF69B4", 
                oszFile: "Songs/senbonzakura/senbonzakura.osz",
                allowDifficultySelection: true,
                audioFile: null, 
                chartFile: null, 
                background: "linear-gradient(135deg, #330022 0%, #660044 50%, #FF69B4 100%)", 
                description: "Cherry blossoms dance on ocean waves" 
            },
            "bad-apple": { 
                id: "bad-apple", 
                title: "Bad Apple!!", 
                artist: "Alstroemeria Records feat. nomico", 
                difficulty: "Multiple Difficulties", 
                difficultyColor: "#8B0000", 
                oszFile: "Songs/bad-apple/bad-apple.osz",
                allowDifficultySelection: true,
                audioFile: null, 
                chartFile: null, 
                background: "linear-gradient(135deg, #000000 0%, #330000 50%, #8B0000 100%)", 
                description: "Silhouettes flow like dark tidal waves" 
            }
        };
    }

    getSong(songId) { return this.songs[songId] || null; }
    getSongFromURL() { return new URLSearchParams(window.location.search).get('song'); }
    navigateToSong(songId) {
        const url = new URL(window.location);
        url.searchParams.set('song', songId);
        window.location.href = url.toString();
    }

    updateUI(song) {
        if (!song) return;
        document.getElementById('song-title').textContent = song.title;
        document.getElementById('song-artist').textContent = `by ${song.artist}`;
        const difficultyBadge = document.getElementById('song-difficulty');
        difficultyBadge.textContent = song.difficulty;
        difficultyBadge.style.backgroundColor = song.difficultyColor;
        document.body.style.background = song.background;
        document.title = `Rhythm Nexus - ${song.title}`;
        
        // Set background image if available
        if (song.backgroundImage) {
            this.setBackgroundImage(song.backgroundImage);
        } else {
            this.clearBackgroundImage();
        }
    }

    async loadSongAndSetup(songId) {
        console.log(`Loading song: ${songId}`);
        const song = this.getSong(songId);
        if (!song) {
            console.error(`Song with ID "${songId}" not found`);
            if (typeof showGameSetup === 'function')
            return;
        }

        console.log(`Found song:`, song);
        this.currentSong = song;
        this.updateUI(song);

        try {
            console.log("Starting to load song files...");
            const loadResult = await this.loadSongFiles(song);
            console.log("Song files loaded successfully:", loadResult);
            console.log("Handing off to game setup.");
            if (typeof showGameSetup === 'function') {
                showGameSetup(loadResult.chartData, song.title);
            } else {
                console.error("showGameSetup function not available!");
            }

        } catch (error) {
            console.error('Error loading song files:', error);
            console.error('Error stack:', error.stack);
            alert(`Error loading song: ${error.message}`);
            
            if (typeof showGameSetup === 'function') {
                showGameSetup(null, null);
            }
        }
    }

    async loadSongFiles(song) {
        console.log("LoadSongFiles called with:", song.id);
        if (song.oszFile) {
            try {
                console.log(`Attempting to load OSZ file: ${song.oszFile}`);
                const oszResult = await this.loadOszFile(song.oszFile, song);
                if (oszResult.success) {
                    console.log("Successfully loaded OSZ file");
                    return oszResult;
                }
            } catch (error) {
                console.warn(`Failed to load OSZ file ${song.oszFile}:`, error.message);
                console.log("Falling back to individual files...");
            }
        } else {
            console.log("No OSZ file specified, using individual files");
        }
        console.log("Loading individual files...");
        try {
            const result = await this.loadIndividualFiles(song);
            console.log("Individual files loaded successfully");
            return result;
        } catch (error) {
            console.error("Failed to load individual files:", error);
            throw error;
        }
    }

    async loadOszFile(oszPath, song) {
        try {
            const response = await fetch(oszPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch OSZ file: ${response.status}`);
            }

            const oszBlob = await response.blob();
            
            const oszFile = new File([oszBlob], oszPath.split('/').pop(), { type: 'application/zip' });
            
            const beatmapAPI = this.getBeatmapAPI();
            const extractedData = await beatmapAPI.extractOszArchive(oszFile);
            
            if (extractedData.charts.length === 0) {
                throw new Error('No valid charts found in OSZ file');
            }
            
            if (extractedData.audio.length === 0) {
                throw new Error('No audio files found in OSZ file');
            }

            if (song.allowDifficultySelection && extractedData.charts.length > 1) {
                const selectedChart = await this.showDifficultySelectionDialog(extractedData.charts, song);
                if (!selectedChart) {
                    throw new Error('No difficulty selected');
                }
                
                await this.setupAudioFromOsz(this.selectBestAudioFile(extractedData.audio));
                
                // Set background image if available
                this.extractAndSetBackgroundImage(extractedData, selectedChart);
                
                return {
                    success: true,
                    chartData: selectedChart.content,
                    source: 'osz-selected'
                };
            } else {
                let selectedChart = extractedData.charts[0]; // Default to first chart
                
                if (song.difficulty && extractedData.charts.length > 1) {
                    const matchingChart = extractedData.charts.find(chart => {
                        const metadata = beatmapAPI.parseChartMetadata(chart.content);
                        return metadata.version === song.difficulty || 
                               metadata.version.toLowerCase().includes(song.difficulty.toLowerCase());
                    });
                    
                    if (matchingChart) {
                        selectedChart = matchingChart;
                        console.log(`Found matching chart for difficulty: ${song.difficulty}`);
                    }
                }

                await this.setupAudioFromOsz(this.selectBestAudioFile(extractedData.audio));
                
                // Set background image if available
                this.extractAndSetBackgroundImage(extractedData, selectedChart);
                
                return {
                    success: true,
                    chartData: selectedChart.content,
                    source: 'osz-auto'
                };
            }

        } catch (error) {
            throw new Error(`OSZ loading failed: ${error.message}`);
        }
    }

    selectBestAudioFile(audioFiles) {
        if (!audioFiles || audioFiles.length === 0) {
            throw new Error('No audio files found');
        }

        const priorities = {
            '.mp3': 3,
            '.ogg': 2,
            '.wav': 1
        };

        const sortedAudio = audioFiles.sort((a, b) => {
            const extA = '.' + a.filename.split('.').pop().toLowerCase();
            const extB = '.' + b.filename.split('.').pop().toLowerCase();
            
            const priorityA = priorities[extA] || 0;
            const priorityB = priorities[extB] || 0;
            
            return priorityB - priorityA;
        });

        console.log(`Selected audio file: ${sortedAudio[0].filename} (from ${audioFiles.length} available)`);
        return sortedAudio[0];
    }

    async setupAudioFromOsz(audioFile) {
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.src = audioFile.url;
        audioPlayer.load();

        await new Promise((resolve, reject) => {
            const canPlayHandler = () => {
                audioPlayer.removeEventListener('error', errorHandler);
                resolve();
            };
            const errorHandler = () => {
                audioPlayer.removeEventListener('canplaythrough', canPlayHandler);
                reject(new Error('Audio file failed to load from OSZ.'));
            };
            audioPlayer.addEventListener('canplaythrough', canPlayHandler, { once: true });
            audioPlayer.addEventListener('error', errorHandler, { once: true });
        });
    }

    async showDifficultySelectionDialog(charts, song) {
        return new Promise((resolve) => {
            const beatmapAPI = this.getBeatmapAPI();
            
            const chartInfo = charts.map((chart, index) => {
                const metadata = beatmapAPI.parseChartMetadata(chart.content);
                return {
                    ...chart,
                    index,
                    metadata
                };
            });

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 3000;
                animation: fadeIn 0.3s ease;
            `;

            // Create dialog
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid #00d4ff;
                border-radius: 15px;
                padding: 30px;
                max-width: 600px;
                max-height: 70vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                color: white;
                font-family: 'Exo 2', sans-serif;
            `;

            dialog.innerHTML = `
                <h2 style="color: #00d4ff; margin-bottom: 20px; text-align: center;">
                    Select Difficulty - ${song.title}
                </h2>
                <p style="margin-bottom: 20px; text-align: center; color: #ccc;">
                    Multiple difficulties found. Do not choose [5K] or [7K] difficulties.
                </p>
                <div id="chartList" style="margin-bottom: 20px;">
                    ${chartInfo.map(chart => `
                        <div class="chart-option" data-index="${chart.index}" style="
                            border: 2px solid #333;
                            border-radius: 10px;
                            padding: 15px;
                            margin-bottom: 10px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            background: rgba(255, 255, 255, 0.05);
                        ">
                            <div style="font-weight: bold; color: #00d4ff; margin-bottom: 5px;">
                                ${chart.metadata.version || 'Unknown Difficulty'}
                            </div>
                            <div style="font-size: 0.9em; color: #ccc;">
                                ${chart.metadata.title || song.title} - ${chart.metadata.artist || song.artist}
                            </div>
                            <div style="font-size: 0.8em; color: #999; margin-top: 5px;">
                                File: ${chart.filename}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="text-align: center;">
                    <button id="cancelBtn" style="
                        background: #666;
                        border: none;
                        color: white;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-family: 'Exo 2', sans-serif;
                    ">Cancel</button>
                </div>
            `;

            // Add hover effects and click handlers
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Add event listeners
            const chartOptions = dialog.querySelectorAll('.chart-option');
            chartOptions.forEach(option => {
                option.addEventListener('mouseenter', () => {
                    option.style.borderColor = '#00d4ff';
                    option.style.background = 'rgba(0, 212, 255, 0.1)';
                });
                
                option.addEventListener('mouseleave', () => {
                    option.style.borderColor = '#333';
                    option.style.background = 'rgba(255, 255, 255, 0.05)';
                });
                
                option.addEventListener('click', () => {
                    const index = parseInt(option.dataset.index);
                    document.body.removeChild(overlay);
                    resolve(charts[index]);
                });
            });

            // Cancel button
            dialog.querySelector('#cancelBtn').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(null);
            });

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    resolve(null);
                }
            });
        });
    }

    async loadIndividualFiles(song) {
        console.log("Loading individual files for song:", song.id);
        try {
            console.log("Loading chart file:", song.chartFile);
            const chartResponse = await fetch(song.chartFile);
            if (!chartResponse.ok) {
                throw new Error(`Failed to load chart: ${chartResponse.status} ${chartResponse.statusText}`);
            }
            const chartData = await chartResponse.text();
            console.log("Chart data loaded, length:", chartData.length);
            console.log("Loading audio file:", song.audioFile);
            const audioPlayer = document.getElementById('audioPlayer');
            audioPlayer.src = song.audioFile;
            try {
                await Promise.race([
                    new Promise((resolve, reject) => {
                        const canPlayHandler = () => {
                            audioPlayer.removeEventListener('error', errorHandler);
                            console.log("Audio loaded successfully");
                            resolve();
                        };
                        const errorHandler = (e) => {
                            audioPlayer.removeEventListener('canplaythrough', canPlayHandler);
                            console.warn("Audio load error:", e);
                            reject(new Error('Audio file failed to load.'));
                        };
                        audioPlayer.addEventListener('canplaythrough', canPlayHandler, { once: true });
                        audioPlayer.addEventListener('error', errorHandler, { once: true });
                        audioPlayer.load();
                    }),
                    // 5 second timeout
                    new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Audio load timeout')), 5000);
                    })
                ]);
            } catch (audioError) {
                console.warn("Audio failed to load, but continuing with chart only:", audioError.message);
            }
            console.log("Individual files loaded successfully");
            return {
                success: true,
                chartData: chartData,
                source: 'individual'
            };
        } catch (error) {
            console.error("Individual files loading failed:", error);
            throw new Error(`Individual files loading failed: ${error.message}`);
        }
    }

    getBeatmapAPI() {
        if (typeof window !== 'undefined' && window.beatmapAPI) {
            return window.beatmapAPI;
        }
        if (typeof GameUtils !== 'undefined' && GameUtils.beatmap) {
            return GameUtils.beatmap;
        }
        return {
            extractOszArchive: async (file) => {
                if (typeof JSZip === 'undefined') {
                    throw new Error('JSZip library is required for OSZ support');
                }
                const zip = new JSZip();
                const zipData = await zip.loadAsync(file);
                const extractedFiles = {
                    charts: [],
                    audio: []
                };
                for (const [filename, fileData] of Object.entries(zipData.files)) {
                    if (fileData.dir) continue;
                    const lowerName = filename.toLowerCase();
                    if (lowerName.endsWith('.osu')) {
                        const content = await fileData.async('text');
                        extractedFiles.charts.push({
                            filename,
                            content,
                            size: content.length
                        });
                    } else if (lowerName.endsWith('.mp3') || lowerName.endsWith('.wav') || lowerName.endsWith('.ogg')) {
                        const blob = await fileData.async('blob');
                        extractedFiles.audio.push({
                            filename,
                            url: URL.createObjectURL(blob),
                            size: blob.size,
                            type: blob.type
                        });
                    }
                }
                extractedFiles.audio.sort((a, b) => {
                    const extA = '.' + a.filename.split('.').pop().toLowerCase();
                    const extB = '.' + b.filename.split('.').pop().toLowerCase();
                    const priorities = { '.mp3': 3, '.ogg': 2, '.wav': 1 };
                    const priorityA = priorities[extA] || 0;
                    const priorityB = priorities[extB] || 0;
                    return priorityB - priorityA;
                });
                return extractedFiles;
            },
            parseChartMetadata: (content) => {
                const metadata = {
                    title: 'Unknown Title',
                    artist: 'Unknown Artist',
                    version: 'Unknown Difficulty'
                };
                const lines = content.split('\n');
                let inMetadataSection = false;
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
                        inMetadataSection = trimmedLine.toLowerCase() === '[metadata]';
                        continue;
                    }
                    if (inMetadataSection && trimmedLine.includes(':')) {
                        const [key, value] = trimmedLine.split(':', 2);
                        const cleanKey = key.trim().toLowerCase();
                        const cleanValue = value.trim();
                        switch (cleanKey) {
                            case 'title':
                                metadata.title = cleanValue;
                                break;
                            case 'artist':
                                metadata.artist = cleanValue;
                                break;
                            case 'version':
                                metadata.version = cleanValue;
                                break;
                        }
                    }
                }
                return metadata;
            }
        };
    }

    extractAndSetBackgroundImage(extractedData, selectedChart) {
        try {
            // Try to find background image from the OSZ data
            if (extractedData.images && extractedData.images.length > 0) {
                // Use the background image functions from game.html
                const chartMetadata = this.getBeatmapAPI().parseChartMetadata(selectedChart.content);
                
                if (typeof window !== 'undefined' && window.findBackgroundImage) {
                    const backgroundImage = window.findBackgroundImage(chartMetadata.title || '', extractedData.images);
                    if (backgroundImage) {
                        this.setBackgroundImage(backgroundImage.url);
                        return;
                    }
                }
                
                // Fallback: use first available image
                if (extractedData.images[0]) {
                    this.setBackgroundImage(extractedData.images[0].url);
                }
            }
        } catch (error) {
            console.warn('Failed to set background image:', error);
        }
    }

    // Background image helper functions
    setBackgroundImage(imageUrl) {
        if (typeof window !== 'undefined' && window.setBackgroundImage) {
            window.setBackgroundImage(imageUrl);
        } else {
            // Fallback implementation
            const gameSetup = document.getElementById('game-setup');
            if (imageUrl && gameSetup) {
                gameSetup.style.setProperty('--bg-image', `url(${imageUrl})`);
                gameSetup.classList.add('has-background');
                // Update the CSS custom property
                const style = document.createElement('style');
                style.textContent = `
                    .game-setup.has-background::before {
                        background-image: url(${imageUrl});
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    clearBackgroundImage() {
        if (typeof window !== 'undefined' && window.clearBackgroundImage) {
            window.clearBackgroundImage();
        } else {
            // Fallback implementation
            const gameSetup = document.getElementById('game-setup');
            if (gameSetup) {
                gameSetup.classList.remove('has-background');
                // Remove any existing background style elements
                const existingStyles = document.querySelectorAll('style');
                existingStyles.forEach(style => {
                    if (style.textContent.includes('game-setup.has-background::before')) {
                        style.remove();
                    }
                });
            }
        }
    }
}