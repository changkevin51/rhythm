/**
 * Wave Animation Manager for Wave-themed Rhythm Game
 * Handles wave effects that follow notes and visual enhancements
 */

class WaveAnimationManager {
    constructor() {
        this.waveFrames = [];
        this.activeWaves = [];
        this.frameCount = 12; // frame_0000.svg to frame_0011.svg
        this.loadPromise = this.loadWaveFrames();
        
        // Wave animation settings
        this.waveSettings = {
            fadeDistance: 200, // Distance over which wave fades
            minOpacity: 0.1,
            maxOpacity: 0.6,
            animationSpeed: 120, // ms per frame
            trailLength: 5, // Number of wave instances per note
            offsetDistance: 30 // Distance between wave instances
        };
        
        // Performance tracking
        this.lastFrameTime = 0;
        this.currentFrame = 0;
    }
    
    async loadWaveFrames() {
        console.log('Loading wave animation frames...');
        const loadPromises = [];
        
        for (let i = 0; i < this.frameCount; i++) {
            const frameNum = i.toString().padStart(4, '0');
            const framePath = `assets/wave_frames/frame_${frameNum}.svg`;
            
            loadPromises.push(this.loadSVGFrame(framePath, i));
        }
        
        try {
            await Promise.all(loadPromises);
            console.log(`Successfully loaded ${this.waveFrames.length} wave frames`);
            return true;
        } catch (error) {
            console.error('Error loading wave frames:', error);
            return false;
        }
    }
    
    async loadSVGFrame(path, index) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.waveFrames[index] = img;
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load wave frame: ${path}`);
                // Create a placeholder canvas for missing frames
                const canvas = document.createElement('canvas');
                canvas.width = 150;
                canvas.height = 60;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#00AAFF';
                ctx.fillRect(0, 0, 150, 60);
                this.waveFrames[index] = canvas;
                resolve();
            };
            
            // Convert SVG to data URL for better compatibility
            fetch(path)
                .then(response => response.text())
                .then(svgText => {
                    const blob = new Blob([svgText], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    img.src = url;
                })
                .catch(() => {
                    img.onerror();
                });
        });
    }
    
    // Add a wave effect for a note
    addWaveForNote(lane, startY, startTime, endTime = null) {
        if (this.waveFrames.length === 0) return;
        
        const laneX = lane * 150;
        const isLongNote = endTime !== null;
        
        // Create multiple wave instances for trail effect
        for (let i = 0; i < this.waveSettings.trailLength; i++) {
            const wave = {
                id: Date.now() + Math.random(),
                lane: lane,
                x: laneX + 75, // Center of lane
                y: startY - (i * this.waveSettings.offsetDistance),
                startY: startY,
                startTime: startTime,
                endTime: endTime,
                isLongNote: isLongNote,
                opacity: this.waveSettings.maxOpacity * (1 - i * 0.15),
                scale: 1 - (i * 0.1),
                frameOffset: i * 2, // Offset animation frames for variety
                creationTime: Date.now(),
                active: true
            };
            
            this.activeWaves.push(wave);
        }
    }
    
    // Update wave animations
    update(currentTime, deltaTime) {
        const now = Date.now();
        
        // Update animation frame
        if (now - this.lastFrameTime > this.waveSettings.animationSpeed) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.lastFrameTime = now;
        }
        
        // Update each wave
        this.activeWaves = this.activeWaves.filter(wave => {
            if (!wave.active) return false;
            
            // Calculate wave position based on note movement
            const notePos = this.calculateNotePosition(wave.startTime, currentTime);
            wave.y = wave.startY - notePos;
            
            // Calculate fade based on distance from judgement line
            const distanceFromJudgement = Math.abs(wave.y - 650); // JUDGEMENT_LINE_Y
            const fadeProgress = Math.min(distanceFromJudgement / this.waveSettings.fadeDistance, 1);
            
            // Update opacity with fade
            const baseOpacity = this.waveSettings.maxOpacity * (1 - fadeProgress * 0.7);
            wave.opacity = Math.max(baseOpacity * wave.scale, this.waveSettings.minOpacity);
            
            // Remove waves that are too far or too old
            const age = now - wave.creationTime;
            if (wave.y < -100 || wave.y > 900 || age > 10000) {
                wave.active = false;
                return false;
            }
            
            return true;
        });
    }
    
    // Calculate note position (similar to calcPOS function)
    calculateNotePosition(noteTime, currentTime) {
        // This is a simplified version - should match the actual game's calcPOS logic
        const timeDiff = noteTime - currentTime;
        const scrollSpeed = 500; // Should match game settings
        return (timeDiff / 1000) * scrollSpeed;
    }
    
    // Render all active waves
    render(ctx) {
        if (this.waveFrames.length === 0 || this.activeWaves.length === 0) return;
        
        ctx.save();
        
        // Set blend mode for wave effects
        ctx.globalCompositeOperation = 'screen';
        
        this.activeWaves.forEach(wave => {
            if (!wave.active || wave.opacity <= 0) return;
            
            const frameIndex = (this.currentFrame + wave.frameOffset) % this.frameCount;
            const frame = this.waveFrames[frameIndex];
            
            if (!frame) return;
            
            ctx.globalAlpha = wave.opacity;
            
            // Position and scale the wave
            const width = 150 * wave.scale;
            const height = 60 * wave.scale;
            const x = wave.x - width / 2;
            const y = wave.y - height / 2;
            
            // Add wave color tinting based on lane
            ctx.save();
            
            // Apply lane-specific coloring
            switch (wave.lane) {
                case 0:
                case 3:
                    ctx.filter = 'hue-rotate(0deg) saturate(150%)'; // White/Blue tint
                    break;
                case 1:
                case 2:
                    ctx.filter = 'hue-rotate(180deg) saturate(150%)'; // Cyan tint
                    break;
            }
            
            ctx.drawImage(frame, x, y, width, height);
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    // Clear all waves (useful for song restart)
    clearWaves() {
        this.activeWaves = [];
    }
    
    // Add splash effect at judgement line when note is hit
    addHitSplash(lane, judgement) {
        const laneX = lane * 150;
        const intensity = this.getIntensityForJudgement(judgement);
        
        // Create a more intense wave effect for hits
        for (let i = 0; i < 3; i++) {
            const splash = {
                id: Date.now() + Math.random(),
                lane: lane,
                x: laneX + 75 + (Math.random() - 0.5) * 50,
                y: 650 + (Math.random() - 0.5) * 20, // Around judgement line
                startY: 650,
                startTime: 0,
                endTime: null,
                isLongNote: false,
                opacity: intensity * 0.8,
                scale: 1.2 + Math.random() * 0.5,
                frameOffset: Math.floor(Math.random() * this.frameCount),
                creationTime: Date.now(),
                active: true,
                isSplash: true,
                splashAge: 0
            };
            
            this.activeWaves.push(splash);
        }
    }
    
    getIntensityForJudgement(judgement) {
        // judgement: 0=perfect, 1=perfect, 2=great, 3=good, 4=bad, 5=miss
        switch (judgement) {
            case 0:
            case 1: return 1.0; // Perfect
            case 2: return 0.8;  // Great
            case 3: return 0.6;  // Good
            case 4: return 0.4;  // Bad
            default: return 0.2; // Miss
        }
    }
    
    // Check if waves are ready to use
    isReady() {
        return this.waveFrames.length === this.frameCount;
    }
}

// Global wave manager instance
let waveManager = new WaveAnimationManager();

// Export for module usage
if (typeof window !== 'undefined') {
    window.waveManager = waveManager;
}
