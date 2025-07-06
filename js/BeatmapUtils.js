// Fallback validation functions if GameUtils is not available
const BeatmapUtils = {
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
                    
                    // Basic validation for .osu files
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

    validateOsuFile(content) {
        try {
            const lines = content.split('\n').map(line => line.trim());
            let inGeneralSection = false;
            let modeFound = false;
            let mode = null;

            for (const line of lines) {
                if (line.startsWith('[') && line.endsWith(']')) {
                    inGeneralSection = line.toLowerCase() === '[general]';
                    continue;
                }

                if (inGeneralSection && line.toLowerCase().startsWith('mode:')) {
                    modeFound = true;
                    mode = parseInt(line.split(':')[1].trim());
                    break;
                }
            }

            if (!modeFound) {
                return {
                    isValid: false,
                    error: 'Invalid osu! file: Mode not specified. Please ensure this is a valid osu!mania beatmap (Mode: 3).'
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

            return { isValid: true, mode: mode };

        } catch (error) {
            return {
                isValid: false,
                error: 'Failed to parse osu! file: ' + error.message
            };
        }
    },

    async readAudioFile(file) {
        return new Promise((resolve, reject) => {
            if (!this.isValidAudioFile(file)) {
                reject(new Error('Invalid audio file format. Please use .mp3, .wav, or .ogg files.'));
                return;
            }

            try {
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

    async setupAudioElement(audioElement, audioData) {
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
    },

    async extractOszArchive(file) {
        return new Promise((resolve, reject) => {
            if (!this.isValidArchive(file)) {
                reject(new Error('Invalid archive format. Please use .osz or .zip files.'));
                return;
            }

            // Check if JSZip is available
            if (typeof JSZip === 'undefined') {
                reject(new Error('JSZip library is required for .osz support. Please reload the page.'));
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
    }
};

// Make BeatmapUtils globally available
window.BeatmapUtils = BeatmapUtils;
