class GameplayEnhancer {
    constructor() {
        this.activeJudgements = [];
        this.particlePool = [];
        this.canvas = null;
        this.ctx = null;
        this.hitEffectOverlay = null;
        this.isInitialized = false;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.canvas = document.getElementById('myCanvas');
        if (!this.canvas) {
            console.warn('Canvas not found, retrying in 1 second...');
            setTimeout(() => this.initialize(), 1000);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.createHitEffectOverlay();
        this.isInitialized = true;
        console.log('GameplayEnhancer initialized');
    }

    createHitEffectOverlay() {
        if (!this.canvas) return;

        const gameContainer = this.canvas.parentElement;
        if (!gameContainer) return;

        this.hitEffectOverlay = document.createElement('div');
        this.hitEffectOverlay.className = 'hit-effect-overlay';
        gameContainer.appendChild(this.hitEffectOverlay);
    }

    showChaoticJudgement(judgementType, lane = null) {
        if (!this.isInitialized || !this.canvas) {
            console.warn('GameplayEnhancer not initialized');
            return;
        }

        const judgementElement = document.createElement('div');
        judgementElement.className = 'judgement-text';

        const judgementData = this.getJudgementData(judgementType);
        judgementElement.textContent = judgementData.text;
        judgementElement.classList.add(judgementData.class);

        // Add subtle randomness to positioning while keeping it in the same general area
        const canvasRect = this.canvas.getBoundingClientRect();
        const randomPos = this.getSubtlyRandomPosition(judgementType, canvasRect);
        
        // Override CSS positioning with subtle variations
        judgementElement.style.position = 'absolute';
        judgementElement.style.left = randomPos.x + 'px';
        judgementElement.style.top = randomPos.y + 'px';
        judgementElement.style.transform = 'translateX(-50%)';
        judgementElement.style.zIndex = '1500';

        if (this.hitEffectOverlay) {
            this.hitEffectOverlay.appendChild(judgementElement);
        } else {
            document.body.appendChild(judgementElement);
        }

        this.activeJudgements.push(judgementElement);

        if (judgementType <= 1) {
            this.createParticleEffect(randomPos.x, randomPos.y, judgementData.color);
        }


        setTimeout(() => {
            this.removeJudgement(judgementElement);
        }, 1200);
    }

    getJudgementData(type) {
        const judgements = {
            0: { text: 'PERFECT', class: 'judgement-perfect', color: '#00FFFF' },
            1: { text: 'PERFECT', class: 'judgement-perfect', color: '#FFFF00' },
            2: { text: 'GREAT', class: 'judgement-great', color: '#00FF00' },
            3: { text: 'GOOD', class: 'judgement-good', color: '#0088FF' },
            4: { text: 'BAD', class: 'judgement-bad', color: '#FF6600' },
            5: { text: 'MISS', class: 'judgement-miss', color: '#FF0000' },
            6: { text: 'MISS', class: 'judgement-miss', color: '#FF0000' }
        };
        return judgements[type] || judgements[6];
    }

    getSubtlyRandomPosition(judgementType, canvasRect) {
        const baseX = canvasRect.left + canvasRect.width / 2;
        const baseY = canvasRect.top + canvasRect.height * 0.30;

        const variationMultiplier = {
            0: 0.8,   // Perfect - small variation
            1: 0.8,   // Perfect - small variation  
            2: 1.0,   // Great - moderate variation
            3: 1.2,   // Good - bit more variation
            4: 1.5,   // Bad - more variation
            5: 1.8,   // Miss - most variation
            6: 1.8    // Miss - most variation
        };

        const variation = variationMultiplier[judgementType] || 1.0;
        const variationX = (Math.random() - 0.5) * 80 * variation;
        const variationY = (Math.random() - 0.5) * 40 * variation;

        const finalX = baseX + variationX;
        const finalY = baseY + variationY;

        const boundedX = Math.max(canvasRect.left + 150, Math.min(canvasRect.right - 150, finalX));
        const boundedY = Math.max(canvasRect.top + canvasRect.height * 0.15, Math.min(canvasRect.top + canvasRect.height * 0.45, finalY));

        return { x: boundedX, y: boundedY };
    }

    createParticleEffect(x, y, color) {
        const particleCount = 8 + Math.random() * 12;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.position = 'absolute';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.color = color;

            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const distance = 50 + Math.random() * 100;
            const deltaX = Math.cos(angle) * distance;
            const deltaY = Math.sin(angle) * distance;

            particle.style.setProperty('--particle-x', deltaX + 'px');
            particle.style.setProperty('--particle-y', deltaY + 'px');

            if (this.hitEffectOverlay) {
                this.hitEffectOverlay.appendChild(particle);
            } else {
                document.body.appendChild(particle);
            }

            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1500);
        }
    }

    removeJudgement(element) {
        const index = this.activeJudgements.indexOf(element);
        if (index > -1) {
            this.activeJudgements.splice(index, 1);
        }

        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    enhanceNoteRendering(ctx, x, y, width, height, lane, isLongNote = false) {
        if (!ctx) return;

        ctx.save();

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.getLaneGlowColor(lane);

        const gradient = this.createEnhancedNoteGradient(ctx, x, y, width, height, lane);
        ctx.fillStyle = gradient;

        ctx.fillRect(x, y, width, height);

        const highlightGradient = ctx.createLinearGradient(x, y, x, y + height * 0.3);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        ctx.fillStyle = highlightGradient;
        ctx.fillRect(x + 2, y + 2, width - 4, height * 0.3);

        if (isLongNote) {
            this.addLongNoteSparkles(ctx, x, y, width, height);
        }

        ctx.restore();
    }

    createEnhancedNoteGradient(ctx, x, y, width, height, lane) {
        const gradient = ctx.createRadialGradient(
            x + width / 2, y + height / 2, 0,
            x + width / 2, y + height / 2, Math.max(width, height) / 2
        );

        switch (lane) {
            case 0:
            case 3:
                gradient.addColorStop(0, 'rgba(220, 250, 255, 0.95)');
                gradient.addColorStop(0.3, 'rgba(180, 230, 255, 0.9)');
                gradient.addColorStop(0.7, 'rgba(100, 200, 255, 0.85)');
                gradient.addColorStop(1, 'rgba(0, 150, 255, 0.8)');
                break;
            case 1:
            case 2:
                gradient.addColorStop(0, 'rgba(200, 255, 240, 0.95)');
                gradient.addColorStop(0.3, 'rgba(150, 255, 220, 0.9)');
                gradient.addColorStop(0.7, 'rgba(100, 255, 200, 0.85)');
                gradient.addColorStop(1, 'rgba(0, 200, 160, 0.8)');
                break;
        }

        return gradient;
    }

    getLaneGlowColor(lane) {
        switch (lane) {
            case 0:
            case 3:
                return '#0080FF';
            case 1:
            case 2:
                return '#00FFAA';
            default:
                return '#00CCFF';
        }
    }

    addLongNoteSparkles(ctx, x, y, width, height) {
        const sparkleCount = Math.floor(height / 20);
        const time = Date.now() * 0.005;

        for (let i = 0; i < sparkleCount; i++) {
            const sparkleY = y + (i * 20) + Math.sin(time + i) * 5;
            const sparkleX = x + width * 0.2 + Math.cos(time + i * 0.5) * (width * 0.6);

            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    updateComboDisplay(combo) {
        const comboElement = document.querySelector('.combo-display');
        if (!comboElement) return;

        comboElement.textContent = combo;

        if (combo > 0 && (combo % 50 === 0 || combo % 100 === 0)) {
            comboElement.classList.add('combo-milestone');
            setTimeout(() => {
                comboElement.classList.remove('combo-milestone');
            }, 800);
        }
    }

    cleanup() {
        this.activeJudgements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.activeJudgements = [];

        if (this.hitEffectOverlay && this.hitEffectOverlay.parentNode) {
            this.hitEffectOverlay.parentNode.removeChild(this.hitEffectOverlay);
        }
    }
}

window.gameplayEnhancer = new GameplayEnhancer();

if (typeof window !== 'undefined') {
    window.enhancedJudgement = (type, lane) => {
        if (window.gameplayEnhancer) {
            window.gameplayEnhancer.showChaoticJudgement(type, lane);
        }
    };

    const originalHitEvent = window.HitEvent;
    if (originalHitEvent) {
        window.HitEvent = function(Col, number) {
            const result = originalHitEvent.call(this, Col, number);
            if (window.gameplayEnhancer) {
                window.gameplayEnhancer.showChaoticJudgement(number, Col);
            }
            return result;
        };
    }

    const originalMissEvent = window.MissEvent;
    if (originalMissEvent) {
        window.MissEvent = function(early) {
            const result = originalMissEvent.call(this, early);
            if (window.gameplayEnhancer) {
                window.gameplayEnhancer.showChaoticJudgement(6, null);
            }
            return result;
        };
    }
}

console.log('GameplayEnhancer loaded successfully');
