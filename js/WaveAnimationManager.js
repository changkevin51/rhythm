class WaveAnimationManager {
    constructor() {
        this.waveFrames = [];
        this.activeWaves = [];
        this.frameCount = 12;
        this.loadPromise = this.loadWaveFrames();
        this.JUDGEMENT_LINE_Y = 650;
        this.CANVAS_HEIGHT = 800;
        this.waveSettings = {
            fadeDistance: 600,
            minOpacity: 0,
            maxOpacity: 0.3,
            animationSpeed: 20,
            trailLength: 1,
            offsetDistance: 50
        };
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
                const canvas = document.createElement('canvas');
                canvas.width = 120;
                canvas.height = 150;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#00AAFF';
                ctx.fillRect(0, 0, 120, 150);
                this.waveFrames[index] = canvas;
                resolve();
            };
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

    addWaveForNote(lane, noteY, startTime, endTime = null) {
        if (this.waveFrames.length === 0) {
            console.warn('Wave frames not loaded yet');
            return;
        }
        const isLongNote = endTime !== null;
        if (isLongNote) {
            console.log('Skipping wave animation for long note to avoid confusion');
            return;
        }
        const laneX = lane * 150;
        for (let i = 0; i < this.waveSettings.trailLength; i++) {
            const wave = {
                id: Date.now() + Math.random(),
                lane: lane,
                x: laneX + 75,
                y: noteY - (i * this.waveSettings.offsetDistance),
                startTime: startTime,
                endTime: endTime,
                isLongNote: isLongNote,
                opacity: this.waveSettings.maxOpacity * (1 - i * 0.15),
                scale: 1.2 - (i * 0.1),
                frameOffset: i * 2,
                creationTime: Date.now(),
                active: true
            };
            this.activeWaves.push(wave);
        }
    }

    update(currentTime, deltaTime) {
        const now = Date.now();
        if (now - this.lastFrameTime > this.waveSettings.animationSpeed) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.lastFrameTime = now;
        }
        this.activeWaves = this.activeWaves.filter(wave => {
            if (!wave.active) return false;
            const notePos = this.calculateNotePosition(wave.startTime, currentTime);
            wave.y = this.JUDGEMENT_LINE_Y - notePos;
            const distanceFromJudgement = Math.abs(wave.y - this.JUDGEMENT_LINE_Y);
            const fadeProgress = Math.min(distanceFromJudgement / this.waveSettings.fadeDistance, 1);
            const age = now - wave.creationTime;
            const maxAge = 8000;
            const ageFade = Math.min(age / maxAge, 1);
            const totalFade = Math.max(fadeProgress, ageFade * 0.5);
            const baseOpacity = this.waveSettings.maxOpacity * (1 - totalFade * 0.6);
            wave.opacity = Math.max(baseOpacity * wave.scale, this.waveSettings.minOpacity);
            if (wave.y < -150 || wave.y > this.CANVAS_HEIGHT + 50 || age > maxAge) {
                wave.active = false;
                return false;
            }
            return true;
        });
    }

    calculateNotePosition(noteTime, currentTime) {
        if (typeof calcPOS === 'function') {
            return calcPOS(noteTime);
        }
        const timeDiff = noteTime - currentTime;
        const scrollSpeed = (typeof scrollDuration !== 'undefined') ? scrollDuration : 500;
        return (timeDiff / 1000) * scrollSpeed;
    }

    render(ctx) {
        if (this.waveFrames.length === 0) {
            console.warn('No wave frames loaded');
            return;
        }
        if (this.activeWaves.length === 0) {
            return;
        }
        ctx.save();
        this.activeWaves.forEach(wave => {
            if (!wave.active || wave.opacity <= 0) return;
            const frameIndex = (this.currentFrame + wave.frameOffset) % this.frameCount;
            const frame = this.waveFrames[frameIndex];
            if (!frame) return;
            const noteWidth = 140;
            const width = (noteWidth * 2) * wave.scale;
            const height = 420 * wave.scale;
            const x = wave.x - width / 2;
            const y = wave.y;
            ctx.save();
            ctx.shadowBlur = 25;
            ctx.shadowColor = this.getLaneColor(wave.lane);
            switch (wave.lane) {
                case 0:
                case 3:
                    ctx.filter = 'hue-rotate(-30deg) saturate(200%) brightness(1.3)';
                    break;
                case 1:
                case 2:
                    ctx.filter = 'hue-rotate(150deg) saturate(200%) brightness(1.3)';
                    break;
            }
            ctx.translate(wave.x, wave.y);
            ctx.rotate(Math.PI / 2);
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = height;
            tempCanvas.height = width;
            tempCtx.drawImage(frame, 0, 0, height, width);
            const gradient = tempCtx.createLinearGradient(0, 0, height, 0);
            const maxOpacity = wave.opacity;
            gradient.addColorStop(0, `rgba(255, 255, 255, ${maxOpacity * 0.1})`);
            gradient.addColorStop(0.3, `rgba(255, 255, 255, ${maxOpacity * 0.4})`);
            gradient.addColorStop(0.6, `rgba(255, 255, 255, ${maxOpacity * 0.7})`);
            gradient.addColorStop(0.85, `rgba(255, 255, 255, ${maxOpacity * 0.9})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${maxOpacity})`);
            tempCtx.globalCompositeOperation = 'destination-in';
            tempCtx.fillStyle = gradient;
            tempCtx.fillRect(0, 0, height, width);
            ctx.globalAlpha = 1.0;
            ctx.drawImage(tempCanvas, -height+40, -width / 2);
            ctx.restore();
        });
        ctx.restore();
    }

    getLaneColor(lane) {
        switch (lane) {
            case 0:
            case 3:
                return '#00AAFF';
            case 1:
            case 2:
                return '#00FFCC';
            default:
                return '#00CCFF';
        }
    }

    clearWaves() {
        this.activeWaves = [];
    }

    addHitSplash(lane, judgement) {
        const laneX = lane * 150;
        const intensity = this.getIntensityForJudgement(judgement);
        for (let i = 0; i < 4; i++) {
            const splash = {
                id: Date.now() + Math.random(),
                lane: lane,
                x: laneX + 75 + (Math.random() - 0.5) * 60,
                y: this.JUDGEMENT_LINE_Y + (Math.random() - 0.5) * 30,
                startY: this.JUDGEMENT_LINE_Y,
                startTime: 0,
                endTime: null,
                isLongNote: false,
                opacity: intensity * 0.9,
                scale: 1.4 + Math.random() * 0.6,
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
        switch (judgement) {
            case 0:
            case 1: return 1.0;
            case 2: return 0.8;
            case 3: return 0.6;
            case 4: return 0.4;
            default: return 0.2;
        }
    }

    isReady() {
        return this.waveFrames.length === this.frameCount;
    }
}

let waveManager = new WaveAnimationManager();

if (typeof window !== 'undefined') {
    window.waveManager = waveManager;
}
