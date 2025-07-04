class SplashAnimationManager {
    constructor() {
        this.splashFrames = [];
        this.activeSplashes = [];
        this.frameCount = 8;
        this.loadPromise = this.loadSplashFrames();
        this.splashSettings = {
            duration: 600,
            frameRate: 60,
            scale: 1.0,
            fadeOutStart: 0.7
        };
        this.frameInterval = this.splashSettings.duration / this.frameCount;
    }

    async loadSplashFrames() {
        console.log('Loading splash animation frames...');
        const loadPromises = [];
        for (let i = 0; i < this.frameCount; i++) {
            const frameNum = (i * 5).toString().padStart(2, '0');
            const framePath = `assets/splash_frames/frame_${frameNum}-min.png`;
            loadPromises.push(this.loadImageFrame(framePath, i));
        }
        try {
            await Promise.all(loadPromises);
            console.log(`Successfully loaded ${this.splashFrames.length} splash frames`);
            return true;
        } catch (error) {
            console.error('Error loading splash frames:', error);
            return false;
        }
    }

    async loadImageFrame(path, index) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.splashFrames[index] = img;
                console.log(`Loaded splash frame ${index}: ${path}`);
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load splash frame: ${path}`);
                reject(new Error(`Failed to load ${path}`));
            };
            img.src = path;
        });
    }

    addHitSplash(lane, judgement) {
        if (this.splashFrames.length === 0) {
            console.warn('Splash frames not loaded yet');
            return;
        }
        if (judgement >= 5) {
            return;
        }
        const laneX = lane * 150 + 75;
        const splashY = 650;
        const splash = {
            id: Date.now() + Math.random(),
            lane: lane,
            x: laneX,
            y: splashY,
            judgement: judgement,
            startTime: Date.now(),
            active: true,
            currentFrame: 0
        };
        this.activeSplashes.push(splash);
        console.log(`Added splash animation for lane ${lane}, judgement ${judgement} at position (${laneX}, ${splashY})`);
    }

    update() {
        const now = Date.now();
        this.activeSplashes = this.activeSplashes.filter(splash => {
            if (!splash.active) return false;
            const elapsed = now - splash.startTime;
            const progress = elapsed / this.splashSettings.duration;
            if (progress >= 1.0) {
                return false;
            }
            splash.currentFrame = Math.floor(progress * this.frameCount);
            splash.currentFrame = Math.min(splash.currentFrame, this.frameCount - 1);
            return true;
        });
    }

    render(ctx) {
        if (this.splashFrames.length === 0) return;
        ctx.save();
        this.activeSplashes.forEach(splash => {
            if (!splash.active) return;
            const frameIndex = splash.currentFrame;
            const frame = this.splashFrames[frameIndex];
            if (!frame) return;
            const elapsed = Date.now() - splash.startTime;
            const progress = elapsed / this.splashSettings.duration;
            let scale = this.splashSettings.scale;
            let opacity = 1.0;
            switch (splash.judgement) {
                case 0:
                    scale *= 1.4;
                    break;
                case 1:
                    scale *= 1.3;
                    break;
                case 2:
                    scale *= 1.2;
                    break;
                case 3:
                    scale *= 1.1;
                    break;
                case 4:
                    scale *= 1.0;
                    break;
            }
            const scaleAnimation = 0.3 + (0.7 * Math.min(progress * 2, 1));
            scale *= scaleAnimation;
            if (progress > 0.6) {
                const fadeProgress = (progress - 0.6) / 0.4;
                opacity = 1.0 - fadeProgress;
            }
            const minSize = 80;
            const maxSize = 200;
            const finalWidth = Math.max(minSize, Math.min(maxSize, frame.width * scale));
            const finalHeight = Math.max(minSize, Math.min(maxSize, frame.height * scale));
            const x = splash.x - finalWidth / 2;
            const y = splash.y - finalHeight / 2;
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.getJudgementColor(splash.judgement);
            ctx.filter = this.getJudgementFilter(splash.judgement);
            ctx.drawImage(frame, x, y, finalWidth, finalHeight);
            ctx.restore();
        });
        ctx.restore();
    }

    getJudgementColor(judgement) {
        switch (judgement) {
            case 0:
                return '#00FFFF';
            case 1:
                return '#00FFAA';
            case 2:
                return '#FFFF00';
            case 3:
                return '#FF8800';
            case 4:
                return '#FF4444';
            default:
                return '#FFFFFF';
        }
    }

    getJudgementFilter(judgement) {
        switch (judgement) {
            case 0:
                return 'hue-rotate(180deg) saturate(1.5) brightness(1.2)';
            case 1:
                return 'hue-rotate(120deg) saturate(1.3) brightness(1.1)';
            case 2:
                return 'hue-rotate(60deg) saturate(1.2)';
            case 3:
                return 'hue-rotate(30deg) saturate(1.1)';
            case 4:
                return 'hue-rotate(0deg) saturate(1.5) brightness(0.8)';
            default:
                return 'none';
        }
    }

    clearSplashes() {
        this.activeSplashes = [];
    }

    isReady() {
        return this.splashFrames.length === this.frameCount;
    }
}

let splashManager = new SplashAnimationManager();

if (typeof window !== 'undefined') {
    window.splashManager = splashManager;
}
