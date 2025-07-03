class WaveAnimationManager {
    constructor() {
        this.waveFrames = [];
        this.activeWaves = [];
        this.frameCount = 12; // frame_0000.svg to frame_0011.svg
        this.loadPromise = this.loadWaveFrames();
        
        // Game constants
        this.JUDGEMENT_LINE_Y = 650;
        this.CANVAS_HEIGHT = 800;
        
        // Wave animation settings
        this.waveSettings = {
            fadeDistance: 600, // Distance over which wave fades
            minOpacity: 0,
            maxOpacity: 0.3, // Increased visibility to distinguish from notes
            animationSpeed: 20, // Slower animation for better visibility
            trailLength: 1, // Number of wave instances per note
            offsetDistance: 50 // Distance between wave instances
        };
        
        // Performance trackin g
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
                canvas.width = 120; // Adjusted for vertical orientation
                canvas.height = 150;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#00AAFF';
                ctx.fillRect(0, 0, 120, 150);
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
    addWaveForNote(lane, noteY, startTime, endTime = null) {
        if (this.waveFrames.length === 0) {
            console.warn('Wave frames not loaded yet');
            return;
        }
        
        const isLongNote = endTime !== null;
        
        // Don't animate long notes to avoid confusion
        if (isLongNote) {
            console.log('Skipping wave animation for long note to avoid confusion');
            return;
        }
        
        const laneX = lane * 150;
        
        // Create multiple wave instances for trail effect
        for (let i = 0; i < this.waveSettings.trailLength; i++) {
            const wave = {
                id: Date.now() + Math.random(),
                lane: lane,
                x: laneX + 75, // Center of lane
                y: noteY - (i * this.waveSettings.offsetDistance),
                startTime: startTime,
                endTime: endTime,
                isLongNote: isLongNote,
                opacity: this.waveSettings.maxOpacity * (1 - i * 0.15), // Less opacity reduction for better visibility
                scale: 1.2 - (i * 0.1), // Larger base scale, less reduction
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
            
            // Calculate wave position to follow the note
            const notePos = this.calculateNotePosition(wave.startTime, currentTime);
            wave.y = this.JUDGEMENT_LINE_Y - notePos;
            
            // Calculate fade based on distance from judgement line and age
            const distanceFromJudgement = Math.abs(wave.y - this.JUDGEMENT_LINE_Y);
            const fadeProgress = Math.min(distanceFromJudgement / this.waveSettings.fadeDistance, 1);
            
            // Age-based fading for smoother transitions
            const age = now - wave.creationTime;
            const maxAge = 8000; // 8 seconds max life
            const ageFade = Math.min(age / maxAge, 1);
            
            // Combine distance and age fading
            const totalFade = Math.max(fadeProgress, ageFade * 0.5);
            const baseOpacity = this.waveSettings.maxOpacity * (1 - totalFade * 0.6);
            wave.opacity = Math.max(baseOpacity * wave.scale, this.waveSettings.minOpacity);
            
            // Remove waves that are too far or too old
            if (wave.y < -150 || wave.y > this.CANVAS_HEIGHT + 50 || age > maxAge) {
                wave.active = false;
                return false;
            }
            
            return true;
        });
    }
    
    // Calculate note position (using the same logic as the main game)
    calculateNotePosition(noteTime, currentTime) {
        // Use the same logic as calcPOS function in Game_Pre.js
        if (typeof calcPOS === 'function') {
            return calcPOS(noteTime);
        }
        
        // Fallback calculation if calcPOS is not available
        const timeDiff = noteTime - currentTime;
        const scrollSpeed = (typeof scrollDuration !== 'undefined') ? scrollDuration : 500;
        return (timeDiff / 1000) * scrollSpeed;
    }
    
    // Render all active waves
    render(ctx) {
        if (this.waveFrames.length === 0) {
            console.warn('No wave frames loaded');
            return;
        }
        if (this.activeWaves.length === 0) {
            // Debug: Show when no active waves
            // console.log('No active waves to render');
            return;
        }
                
        ctx.save();
        
        this.activeWaves.forEach(wave => {
            if (!wave.active || wave.opacity <= 0) return;
            
            const frameIndex = (this.currentFrame + wave.frameOffset) % this.frameCount;
            const frame = this.waveFrames[frameIndex];
            
            if (!frame) return;
            
            // Position and scale the wave to follow the note
            const noteWidth = 140; // Standard note width
            const width = (noteWidth * 2) * wave.scale; // 2 times wider than note width
            const height = 420 * wave.scale; // Height for wave animation
            const x = wave.x - width / 2;
            // Position wave so it touches the note and extends upward
            const y = wave.y; // Wave bottom touches note position, extends upward
            
            ctx.save();
            
            // Add a stronger glow effect to distinguish from notes
            ctx.shadowBlur = 25;
            ctx.shadowColor = this.getLaneColor(wave.lane);
            
            // Apply more distinct lane-specific coloring to avoid confusion with notes
            switch (wave.lane) {
                case 0:
                case 3:
                    ctx.filter = 'hue-rotate(-30deg) saturate(200%) brightness(1.3)'; // More distinct blue-white tint
                    break;
                case 1:
                case 2:
                    ctx.filter = 'hue-rotate(150deg) saturate(200%) brightness(1.3)'; // More distinct cyan-aqua tint
                    break;
            }
            
            // Rotate the wave by 90 degrees to make it vertical
            ctx.translate(wave.x, wave.y);
            ctx.rotate(Math.PI / 2); // 90 degrees rotation
            
            // Create a vertical gradient for consistent opacity pattern
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = height;
            tempCanvas.height = width;
            
            tempCtx.drawImage(frame, 0, 0, height, width);
            
            const gradient = tempCtx.createLinearGradient(0, 0, height, 0);
            const maxOpacity = wave.opacity; // Use wave opacity as the maximum
            gradient.addColorStop(0, `rgba(255, 255, 255, ${maxOpacity * 0.1})`); // 10% of wave opacity at far end
            gradient.addColorStop(0.3, `rgba(255, 255, 255, ${maxOpacity * 0.4})`); // 40% of wave opacity
            gradient.addColorStop(0.6, `rgba(255, 255, 255, ${maxOpacity * 0.7})`); // 70% of wave opacity
            gradient.addColorStop(0.85, `rgba(255, 255, 255, ${maxOpacity * 0.9})`); // 90% of wave opacity
            gradient.addColorStop(1, `rgba(255, 255, 255, ${maxOpacity})`); // Full wave opacity at note position
            
            // Apply the gradient mask (wave opacity is already factored into the gradient)
            tempCtx.globalCompositeOperation = 'destination-in';
            tempCtx.fillStyle = gradient;
            tempCtx.fillRect(0, 0, height, width);
            
            // Draw the final result without additional opacity since it's already in the gradient
            ctx.globalAlpha = 1.0;
            ctx.drawImage(tempCanvas, -height+40, -width / 2); // Wave starts at note position, extends upward
            
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    // Get appropriate glow color for each lane
    getLaneColor(lane) {
        switch (lane) {
            case 0:
            case 3:
                return '#00AAFF'; // Blue glow
            case 1:
            case 2:
                return '#00FFCC'; // Cyan glow
            default:
                return '#00CCFF';
        }
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
        for (let i = 0; i < 4; i++) { // Increased number of splash effects
            const splash = {
                id: Date.now() + Math.random(),
                lane: lane,
                x: laneX + 75 + (Math.random() - 0.5) * 60,
                y: this.JUDGEMENT_LINE_Y + (Math.random() - 0.5) * 30, // Around judgement line
                startY: this.JUDGEMENT_LINE_Y,
                startTime: 0,
                endTime: null,
                isLongNote: false,
                opacity: intensity * 0.9, // Increased opacity for splash
                scale: 1.4 + Math.random() * 0.6, // Larger splash effects
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
