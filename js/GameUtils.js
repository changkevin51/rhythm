/**
 * Utility functions and enhanced features for the rhythm game
 */

// Global utilities
const GameUtils = {
    // Performance monitoring
    performance: {
        frameCount: 0,
        lastTime: 0,
        fps: 0,
        
        update() {
            this.frameCount++;
            const now = performance.now();
            if (now - this.lastTime >= 1000) {
                this.fps = Math.round(this.frameCount * 1000 / (now - this.lastTime));
                this.frameCount = 0;
                this.lastTime = now;
            }
        },
        
        getFPS() {
            return this.fps;
        }
    },
    
    // Audio utilities
    audio: {
        context: null,
        analyser: null,
        dataArray: null,
        
        init(audioElement) {
            try {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
                const source = this.context.createMediaElementSource(audioElement);
                this.analyser = this.context.createAnalyser();
                
                source.connect(this.analyser);
                this.analyser.connect(this.context.destination);
                
                this.analyser.fftSize = 256;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                
                return true;
            } catch (error) {
                console.warn('Audio analysis not available:', error);
                return false;
            }
        },
        
        getFrequencyData() {
            if (this.analyser && this.dataArray) {
                this.analyser.getByteFrequencyData(this.dataArray);
                return this.dataArray;
            }
            return null;
        },
        
        getAverageFrequency(start = 0, end = null) {
            const data = this.getFrequencyData();
            if (!data) return 0;
            
            end = end || data.length;
            let sum = 0;
            for (let i = start; i < end; i++) {
                sum += data[i];
            }
            return sum / (end - start);
        }
    },
    
    // Visual effects
    effects: {
        particles: [],
        screenShake: 0,
        flashEffect: 0,
        
        addParticle(x, y, options = {}) {
            const particle = {
                x,
                y,
                vx: (Math.random() - 0.5) * (options.velocityRange || 200),
                vy: -Math.random() * (options.upwardVelocity || 300) - 50,
                life: options.life || 1,
                maxLife: options.life || 1,
                size: options.size || Math.random() * 4 + 2,
                color: options.color || '#FFFFFF',
                gravity: options.gravity || 500,
                alpha: 1
            };
            
            this.particles.push(particle);
        },
        
        updateParticles(deltaTime) {
            const dt = deltaTime * 0.001;
            
            this.particles = this.particles.filter(particle => {
                particle.life -= dt;
                particle.vy += particle.gravity * dt;
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.alpha = particle.life / particle.maxLife;
                
                return particle.life > 0 && particle.y < 1000;
            });
        },
        
        renderParticles(ctx) {
            ctx.save();
            
            this.particles.forEach(particle => {
                ctx.globalAlpha = particle.alpha;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.restore();
        },
        
        addScreenShake(intensity) {
            this.screenShake = Math.max(this.screenShake, intensity);
        },
        
        updateScreenShake(deltaTime) {
            this.screenShake = Math.max(0, this.screenShake - deltaTime * 0.01);
        },
        
        addFlash(intensity) {
            this.flashEffect = Math.max(this.flashEffect, intensity);
        },
        
        updateFlash(deltaTime) {
            this.flashEffect = Math.max(0, this.flashEffect - deltaTime * 0.005);
        }
    },
    
    // Math utilities
    math: {
        lerp(a, b, t) {
            return a + (b - a) * t;
        },
        
        smoothstep(edge0, edge1, x) {
            const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
            return t * t * (3 - 2 * t);
        },
        
        easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        },
        
        easeInQuart(t) {
            return t * t * t * t;
        },
        
        clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }
    },
    
    // Color utilities
    color: {
        hsvToRgb(h, s, v) {
            const c = v * s;
            const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const m = v - c;
            
            let r, g, b;
            if (h < 60) {
                [r, g, b] = [c, x, 0];
            } else if (h < 120) {
                [r, g, b] = [x, c, 0];
            } else if (h < 180) {
                [r, g, b] = [0, c, x];
            } else if (h < 240) {
                [r, g, b] = [0, x, c];
            } else if (h < 300) {
                [r, g, b] = [x, 0, c];
            } else {
                [r, g, b] = [c, 0, x];
            }
            
            return [
                Math.round((r + m) * 255),
                Math.round((g + m) * 255),
                Math.round((b + m) * 255)
            ];
        },
        
        rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        
        getJudgementColor(judgement) {
            const colors = [
                '#00FFFF', // Perfect
                '#FFFF00', // Perfect (late)
                '#00FF00', // Great
                '#0000FF', // Good
                '#FF7700', // Bad
                '#FF0000', // Miss
                '#FF0000'  // Miss (auto)
            ];
            return colors[judgement] || '#FFFFFF';
        }
    },
    
    // Input utilities
    input: {
        keyNames: {
            65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H',
            73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P',
            81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X',
            89: 'Y', 90: 'Z', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6',
            55: '7', 56: '8', 57: '9', 48: '0', 32: 'Space', 13: 'Enter', 27: 'Esc',
            37: '←', 38: '↑', 39: '→', 40: '↓', 16: 'Shift', 17: 'Ctrl', 18: 'Alt'
        },
        
        getKeyName(keyCode) {
            return this.keyNames[keyCode] || `Key${keyCode}`;
        },
        
        isValidGameKey(keyCode) {
            // Allow letters, numbers, and some special keys
            return (keyCode >= 65 && keyCode <= 90) || // A-Z
                   (keyCode >= 48 && keyCode <= 57) || // 0-9
                   [32, 16, 17, 18].includes(keyCode); // Space, Shift, Ctrl, Alt
        }
    },
    
    // Storage utilities
    storage: {
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Failed to save to localStorage:', error);
                return false;
            }
        },
        
        load(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Failed to load from localStorage:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Failed to remove from localStorage:', error);
                return false;
            }
        }
    },

    // Beatmap import system
    beatmap: {
        // Validate file types
        isValidChartFile(file) {
            const validExtensions = ['.osu', '.txt'];
            const fileName = file.name.toLowerCase();
            return validExtensions.some(ext => fileName.endsWith(ext));
        },

        isValidAudioFile(file) {
            const validExtensions = ['.mp3', '.wav', '.ogg'];
            const fileName = file.name.toLowerCase();
            return validExtensions.some(ext => fileName.endsWith(ext));
        },

        isValidArchive(file) {
            const fileName = file.name.toLowerCase();
            return fileName.endsWith('.osz') || fileName.endsWith('.zip');
        },

        // Read chart file content
        async readChartFile(file) {
            return new Promise((resolve, reject) => {
                if (!this.isValidChartFile(file)) {
                    reject(new Error('Invalid chart file format. Please use .osu or .txt files.'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const content = event.target.result;
                        
                        // Validate osu!mania mode for .osu files
                        if (file.name.toLowerCase().endsWith('.osu')) {
                            const validationResult = this.validateOsuFile(content);
                            if (!validationResult.isValid) {
                                reject(new Error(validationResult.error));
                                return;
                            }
                        }
                        
                        resolve(content);
                    } catch (error) {
                        reject(new Error('Failed to read chart file: ' + error.message));
                    }
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read chart file'));
                };
                reader.readAsText(file, 'UTF-8');
            });
        },

        // Validate osu file format and mode
        validateOsuFile(content) {
            try {
                const lines = content.split('\n').map(line => line.trim());
                let inGeneralSection = false;
                let modeFound = false;
                let mode = null;

                for (const line of lines) {
                    // Check for section headers
                    if (line.startsWith('[') && line.endsWith(']')) {
                        inGeneralSection = line.toLowerCase() === '[general]';
                        continue;
                    }

                    // Look for Mode in [General] section
                    if (inGeneralSection && line.toLowerCase().startsWith('mode:')) {
                        modeFound = true;
                        mode = parseInt(line.split(':')[1].trim());
                        break;
                    }
                }

                // Check if mode was found and is correct
                if (!modeFound) {
                    return {
                        isValid: false,
                        error: 'Invalid osu! file: Mode not specified in [General] section. Please ensure this is a valid osu!mania beatmap (Mode: 3).'
                    };
                }

                if (mode !== 3) {
                    const modeNames = {
                        0: 'osu! (Standard)',
                        1: 'Taiko',
                        2: 'Catch the Beat',
                        3: 'osu!mania'
                    };
                    
                    return {
                        isValid: false,
                        error: `Invalid game mode: This beatmap is for ${modeNames[mode] || 'Unknown mode'} (Mode: ${mode}). Please use an osu!mania beatmap (Mode: 3).`
                    };
                }

                return {
                    isValid: true,
                    mode: mode
                };

            } catch (error) {
                return {
                    isValid: false,
                    error: 'Failed to parse osu! file: ' + error.message
                };
            }
        },

        // Read audio file and create object URL
        async readAudioFile(file) {
            return new Promise((resolve, reject) => {
                if (!this.isValidAudioFile(file)) {
                    reject(new Error('Invalid audio file format. Please use .mp3, .wav, or .ogg files.'));
                    return;
                }

                try {
                    // Create object URL for the audio file
                    const audioURL = URL.createObjectURL(file);
                    resolve({
                        url: audioURL,
                        filename: file.name,
                        size: file.size,
                        type: file.type
                    });
                } catch (error) {
                    reject(new Error('Failed to process audio file: ' + error.message));
                }
            });
        },

        // Extract .osz archive (requires JSZip library)
        async extractOszArchive(file) {
            return new Promise((resolve, reject) => {
                if (!this.isValidArchive(file)) {
                    reject(new Error('Invalid archive format. Please use .osz or .zip files.'));
                    return;
                }

                // Check if JSZip is available
                if (typeof JSZip === 'undefined') {
                    reject(new Error('JSZip library is required for .osz support. Please include it in your HTML.'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const zip = new JSZip();
                        const zipData = await zip.loadAsync(event.target.result);
                        
                        const extractedFiles = {
                            charts: [],
                            audio: [],
                            images: [],
                            other: []
                        };

                        // Process each file in the archive
                        for (const [filename, fileData] of Object.entries(zipData.files)) {
                            if (fileData.dir) continue; // Skip directories

                            const lowerName = filename.toLowerCase();
                            
                            if (lowerName.endsWith('.osu')) {
                                const content = await fileData.async('text');
                                
                                // Validate osu!mania mode for charts in archive
                                const validationResult = this.validateOsuFile(content);
                                if (validationResult.isValid) {
                                    extractedFiles.charts.push({
                                        filename,
                                        content,
                                        size: content.length,
                                        mode: validationResult.mode
                                    });
                                } else {
                                    console.warn(`Skipping ${filename}: ${validationResult.error}`);
                                }
                            } else if (lowerName.endsWith('.mp3') || lowerName.endsWith('.wav') || lowerName.endsWith('.ogg')) {
                                const blob = await fileData.async('blob');
                                extractedFiles.audio.push({
                                    filename,
                                    url: URL.createObjectURL(blob),
                                    size: blob.size,
                                    type: blob.type
                                });
                            } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png')) {
                                const blob = await fileData.async('blob');
                                extractedFiles.images.push({
                                    filename,
                                    url: URL.createObjectURL(blob),
                                    size: blob.size
                                });
                            } else {
                                extractedFiles.other.push({
                                    filename,
                                    size: fileData._data ? fileData._data.uncompressedSize : 0
                                });
                            }
                        }

                        resolve(extractedFiles);
                    } catch (error) {
                        reject(new Error('Failed to extract archive: ' + error.message));
                    }
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read archive file'));
                };
                reader.readAsArrayBuffer(file);
            });
        },

        // Complete beatmap import handler
        async importBeatmap(chartFile, audioFile = null) {
            try {
                let chartContent = null;
                let audioData = null;

                // Handle different input types
                if (this.isValidArchive(chartFile)) {
                    // Extract .osz archive
                    const extracted = await this.extractOszArchive(chartFile);
                    
                    if (extracted.charts.length === 0) {
                        throw new Error('No valid osu!mania chart files found in archive. Please ensure the archive contains .osu files with Mode: 3.');
                    }
                    
                    if (extracted.audio.length === 0) {
                        throw new Error('No audio files found in archive');
                    }

                    // If multiple charts found, let user choose
                    if (extracted.charts.length > 1) {
                        const selectedChart = await this.showChartSelectionDialog(extracted.charts);
                        if (!selectedChart) {
                            throw new Error('No chart selected');
                        }
                        chartContent = selectedChart.content;
                    } else {
                        // Use the only chart found
                        chartContent = extracted.charts[0].content;
                    }

                    audioData = extracted.audio[0];

                    notifications.show(`Extracted ${extracted.charts.length} valid osu!mania chart(s) and ${extracted.audio.length} audio file(s)`, 'success');
                } else {
                    // Handle separate files
                    if (!chartFile) {
                        throw new Error('Please select a chart file (.osu or .txt)');
                    }

                    chartContent = await this.readChartFile(chartFile);

                    if (audioFile) {
                        audioData = await this.readAudioFile(audioFile);
                    } else {
                        throw new Error('Please select an audio file (.mp3, .wav, or .ogg)');
                    }
                }

                return {
                    chart: chartContent,
                    audio: audioData,
                    success: true
                };

            } catch (error) {
                console.error('Beatmap import failed:', error);
                notifications.show(error.message, 'error');
                return {
                    success: false,
                    error: error.message
                };
            }
        },

        // Show chart selection dialog when multiple charts are found
        async showChartSelectionDialog(charts) {
            return new Promise((resolve) => {
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

                // Parse chart metadata for better display
                const chartInfo = charts.map((chart, index) => {
                    const metadata = this.parseChartMetadata(chart.content);
                    return {
                        ...chart,
                        index,
                        metadata
                    };
                });

                dialog.innerHTML = `
                    <h2 style="color: #00d4ff; margin-bottom: 20px; text-align: center;">
                        Select Difficulty [Exclude 5K or 7K]
                    </h2>
                    <p style="margin-bottom: 20px; text-align: center; color: #ccc;">
                        Multiple osu!mania charts found. Choose which difficulty to play:
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
                                    ${chart.metadata.title || 'Unknown Title'} - ${chart.metadata.artist || 'Unknown Artist'}
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
                            margin-right: 10px;
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
        },

        // Parse basic metadata from chart content
        parseChartMetadata(content) {
            const metadata = {
                title: 'Unknown Title',
                artist: 'Unknown Artist',
                creator: 'Unknown Creator',
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
                        case 'creator':
                            metadata.creator = cleanValue;
                            break;
                        case 'version':
                            metadata.version = cleanValue;
                            break;
                    }
                }
            }

            return metadata;
        },

        // Setup audio element with proper loading
        setupAudioElement(audioElement, audioData) {
            return new Promise((resolve, reject) => {
                if (!audioData || !audioData.url) {
                    reject(new Error('Invalid audio data'));
                    return;
                }

                const audio = audioElement;
                
                // Clear any existing source
                audio.src = '';
                audio.load();

                // Set up event listeners
                const onCanPlay = () => {
                    audio.removeEventListener('canplay', onCanPlay);
                    audio.removeEventListener('error', onError);
                    resolve(audio);
                };

                const onError = (e) => {
                    audio.removeEventListener('canplay', onCanPlay);
                    audio.removeEventListener('error', onError);
                    reject(new Error('Failed to load audio: ' + (e.message || 'Unknown error')));
                };

                audio.addEventListener('canplay', onCanPlay);
                audio.addEventListener('error', onError);

                // Set the source and load
                audio.src = audioData.url;
                audio.load();
            });
        }
    }
};

// Notification system
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = this.createContainer();
    }
    
    createContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        return container;
    }
    
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            margin-bottom: 10px;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            color: white;
            font-family: 'Exo 2', sans-serif;
            font-weight: 600;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            cursor: pointer;
        `;
        
        // Set background based on type
        const backgrounds = {
            success: 'linear-gradient(45deg, #4CAF50, #66BB6A)',
            warning: 'linear-gradient(45deg, #FF9800, #FFB74D)',
            error: 'linear-gradient(45deg, #F44336, #EF5350)',
            info: 'linear-gradient(45deg, #00d4ff, #0099cc)'
        };
        
        notification.style.background = backgrounds[type] || backgrounds.info;
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            this.hide(notification);
        });
        
        this.container.appendChild(notification);
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }
        
        return notification;
    }
    
    hide(notification) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    clear() {
        this.container.innerHTML = '';
    }
}

// Global notification instance
const notifications = new NotificationManager();

// Enhanced settings UI functions
function showSettingsPanel() {
    const overlay = document.getElementById('settingsOverlay') || createSettingsOverlay();
    const panel = document.getElementById('settingsPanel');
    
    if (panel) {
        panel.innerHTML = gameSettings.createSettingsPanel();
        overlay.style.display = 'flex';
        panel.style.display = 'flex';
    }
}

function createSettingsOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'settingsOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div id="settingsPanel" class="settings-panel"></div>`;
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSettings();
        }
    });
    
    document.body.appendChild(overlay);
    return overlay;
}

function closeSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showSettingsTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const tab = document.getElementById(tabName + 'Tab');
    const btn = document.querySelector(`[onclick="showSettingsTab('${tabName}')"]`);
    
    if (tab) tab.classList.add('active');
    if (btn) btn.classList.add('active');
}

function updateSetting(key, value) {
    // Convert string values to appropriate types
    if (typeof gameSettings.get(key) === 'number') {
        value = parseFloat(value);
    } else if (typeof gameSettings.get(key) === 'boolean') {
        value = Boolean(value);
    }
    
    gameSettings.set(key, value);
    
    // Update display value if it exists
    const displayElement = document.getElementById(key + 'Value');
    if (displayElement) {
        displayElement.textContent = value + (key.includes('Volume') || key.includes('Dim') ? '%' : key.includes('Speed') || key.includes('offset') ? 'ms' : '');
    }
    
    notifications.show(`${key} updated to ${value}`, 'success', 2000);
}

function updateKeyLayout(layout) {
    gameSettings.setKeyLayout(layout);
    
    // Update key display
    const keyDisplay = document.querySelector('.key-display');
    if (keyDisplay) {
        const keys = gameSettings.get('keyBindings');
        keyDisplay.innerHTML = keys.map(key => 
            `<span class="key-button">${gameSettings.getKeyName(key)}</span>`
        ).join('');
    }
    
    notifications.show(`Key layout changed to ${layout}`, 'success', 2000);
}

function exportSettings() {
    const data = gameSettings.exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `rhythm-game-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    notifications.show('Settings exported successfully!', 'success');
}

function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const success = gameSettings.importSettings(text);
            
            if (success) {
                notifications.show('Settings imported successfully!', 'success');
                // Refresh the settings panel
                showSettingsPanel();
            } else {
                notifications.show('Failed to import settings: Invalid file format', 'error');
            }
        } catch (error) {
            notifications.show('Failed to import settings: ' + error.message, 'error');
        }
    };
    
    input.click();
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
        gameSettings.resetToDefaults();
        notifications.show('Settings reset to defaults', 'warning');
        showSettingsPanel(); // Refresh the panel
    }
}

function saveAndCloseSettings() {
    const success = gameSettings.saveSettings();
    if (success) {
        notifications.show('Settings saved successfully!', 'success');
        closeSettings();
    } else {
        notifications.show('Failed to save settings', 'error');
    }
}

// Add CSS for animations that weren't in the main CSS file
const additionalCSS = `
@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.notification {
    transition: all 0.3s ease;
}

.settings-panel {
    animation: fadeIn 0.4s ease;
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// Export utilities
if (typeof window !== 'undefined') {
    window.GameUtils = GameUtils;
    window.notifications = notifications;
}
