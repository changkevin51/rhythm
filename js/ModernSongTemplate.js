/**
 * Universal Modern UI Template for Rhythm Game Songs
 * This template applies the Aleph-0 UI style to all songs including custom ones
 */

function createModernSongTemplate(songConfig) {
    return `<!doctype html>
<html lang="en">
<head>
    <title>Rhythm Nexus - ${songConfig.title}</title>
    <meta charset="UTF-8">
    <meta name="description" content="Play ${songConfig.title} by ${songConfig.artist}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Exo 2', sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d1b69 100%);
            color: white;
            overflow: hidden;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .game-header {
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .song-info h1 {
            font-family: 'Orbitron', monospace;
            font-size: 1.5rem;
            background: linear-gradient(45deg, #00d4ff, #ff00dc);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .song-info p {
            color: #a0a0ff;
            font-size: 0.9rem;
            margin-top: 5px;
        }

        .difficulty-badge {
            background: ${songConfig.difficultyColor || '#F44336'};
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-left: 10px;
        }

        .header-controls {
            display: flex;
            gap: 10px;
        }

        .btn {
            padding: 10px 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Orbitron', monospace;
            font-size: 0.9rem;
            text-decoration: none;
            display: inline-block;
        }

        .btn:hover {
            border-color: #00d4ff;
            background: rgba(0, 212, 255, 0.2);
            box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);
        }

        .btn.primary {
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            border-color: #00d4ff;
        }

        .btn.primary:hover {
            background: linear-gradient(45deg, #00b8e6, #007399);
        }

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .game-container {
            position: relative;
            display: none;
        }

        .game-canvas {
            border: 4px solid #7f7f7f;
            border-radius: 10px;
            background: black;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
        }

        .setup-panel {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 2rem;
            backdrop-filter: blur(10px);
            max-width: 500px;
            width: 90%;
        }

        .setup-panel h2 {
            font-family: 'Orbitron', monospace;
            font-size: 1.8rem;
            text-align: center;
            margin-bottom: 2rem;
            color: #00d4ff;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #a0a0ff;
        }

        .form-group input, .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #00d4ff;
            box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
        }

        .settings-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .loading-spinner {
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid #00d4ff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .pause-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .pause-panel {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            backdrop-filter: blur(20px);
        }

        .pause-panel h2 {
            font-family: 'Orbitron', monospace;
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #00d4ff;
        }

        .pause-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
        }

        @media (max-width: 768px) {
            .game-header {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
            
            .header-controls {
                justify-content: center;
            }
            
            .settings-grid {
                grid-template-columns: 1fr;
            }
            
            .pause-buttons {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="game-header">
        <div class="song-info">
            <h1>${songConfig.title} <span class="difficulty-badge">${songConfig.difficulty}</span></h1>
            <p>by ${songConfig.artist} • ${songConfig.charter ? songConfig.charter + ' Chart' : 'Official Chart'}</p>
        </div>
        <div class="header-controls">
            <a href="index.html" class="btn">← Back to Menu</a>
            <button class="btn" onclick="openSettings()">⚙️ Settings</button>
        </div>
    </div>

    <div class="main-content">
        <!-- Loading Phase -->
        <div id="loadingPhase" class="setup-panel">
            <div class="loading-spinner"></div>
            <h2>Loading ${songConfig.title}...</h2>
            <p>Preparing beatmap and audio</p>
        </div>

        <!-- Game Settings Phase -->
        <div id="gameSettings" class="setup-panel" style="display: none;">
            <h2>Game Settings</h2>
            
            <div class="settings-grid">
                <div class="form-group">
                    <label for="scrollSpeed">Scroll Speed (ms)</label>
                    <input type="number" id="scrollSpeed" value="450" min="200" max="1000" step="50">
                </div>
                
                <div class="form-group">
                    <label for="offset">Audio Offset (ms)</label>
                    <input type="number" id="offset" value="-40" min="-200" max="200" step="10">
                </div>
                
                <div class="form-group">
                    <label for="gameScale">Game Scale (%)</label>
                    <input type="number" id="gameScale" value="100" min="50" max="150" step="10">
                </div>
                
                <div class="form-group">
                    <label for="keyBindings">Key Layout</label>
                    <select id="keyBindings">
                        <option value="DFJK">D-F-J-K (Default)</option>
                        <option value="ASDF">A-S-D-F</option>
                        <option value="HJKL">H-J-K-L</option>
                        <option value="1234">1-2-3-4</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <button class="btn primary" onclick="startGame()" style="width: 100%; padding: 15px; font-size: 1.1rem;">
                    🎮 Start Game
                </button>
            </div>
        </div>

        <!-- Game Canvas -->
        <div id="gameContainer" class="game-container">
            <canvas id="gameCanvas" class="game-canvas" width="600" height="800">
                Your browser doesn't support HTML5 Canvas.
            </canvas>
        </div>
    </div>

    <!-- Pause Overlay -->
    <div id="pauseOverlay" class="pause-overlay">
        <div class="pause-panel">
            <h2>Game Paused</h2>
            <p>Press ESC or click Resume to continue</p>
            <div class="pause-buttons">
                <button class="btn primary" onclick="resumeGame()">▶️ Resume</button>
                <button class="btn" onclick="restartGame()">🔄 Restart</button>
                <button class="btn" onclick="exitGame()">🚪 Exit</button>
            </div>
        </div>
    </div>

    <!-- Audio Element -->
    <audio id="gameAudio" src="${songConfig.audioPath}" preload="auto"></audio>

    <!-- Game Scripts -->
    <script src="js/GameUtils.js"></script>
    <script src="js/Game.js"></script>
    <script>
        const chartPath = "${songConfig.chartPath}";
        let gameSettings = {
            scrollSpeed: 450,
            offset: -40,
            scale: 100,
            keyBindings: [68, 70, 74, 75] // D, F, J, K
        };

        // Key binding presets
        const keyPresets = {
            'DFJK': [68, 70, 74, 75],
            'ASDF': [65, 83, 68, 70],
            'HJKL': [72, 74, 75, 76],
            '1234': [49, 50, 51, 52]
        };

        async function initializeGame() {
            try {
                // Load chart data
                const response = await fetch(chartPath);
                if (!response.ok) {
                    throw new Error('Chart file not found');
                }
                const chartData = await response.text();
                
                // Validate chart data (if it's an osu file)
                if (chartPath.toLowerCase().includes('.osu')) {
                    const validationResult = GameUtils.beatmap.validateOsuFile(chartData);
                    if (!validationResult.isValid) {
                        throw new Error(validationResult.error);
                    }
                }
                
                gameSettings.chartData = chartData;
                
                // Show settings after loading
                setTimeout(() => {
                    document.getElementById('loadingPhase').style.display = 'none';
                    document.getElementById('gameSettings').style.display = 'block';
                }, 1500);
                
            } catch (error) {
                console.error('Failed to initialize game:', error);
                document.getElementById('loadingPhase').innerHTML = \`
                    <h2>Error Loading Game</h2>
                    <p style="color: #ff6b6b;">Failed to load chart: \${error.message}</p>
                    <a href="index.html" class="btn" style="margin-top: 1rem;">← Back to Menu</a>
                \`;
            }
        }

        async function startGame() {
            try {
                // Reset all game variables
                resetGameVariables();
                
                // Set up audio element
                const audioElement = document.getElementById('gameAudio');
                
                // Apply the custom key bindings
                const keyLayout = document.getElementById('keyBindings').value;
                const newKeys = keyPresets[keyLayout];
                for (let i = 0; i < 4; i++) {
                    bindKey[i] = newKeys[i];
                }
                
                // Parse the chart data using existing function
                content = parseOsuString(gameSettings.chartData);
                
                // Process the parsed data
                for(let i=0;i<TPnums;i++)if(content["TimingPoints"][i][1]<0)content["TimingPoints"][i][8]=BPMnums-1;else{
                    content["TimingPoints"][i][8]=BPMnums;
                    BPMs[BPMnums]={};
                    BPMs[BPMnums][0]=content["TimingPoints"][i][0];
                    BPMs[BPMnums][1]=content["TimingPoints"][i][1];
                    BPMs[BPMnums][2]=content["TimingPoints"][i][2];
                    BPMnums++;
                }
                for(let i=0;i<HOnums;i++){
                    Objs[i]={};
                    Objs[i]["Key"]=Math.floor(content["HitObjects"][i][0]/(512/4));
                    if(Objs[i]["Key"]>=4)Objs[i]["Key"]=3;
                    Objs[i]["StartTime"]=content["HitObjects"][i][2];
                    Objs[i]["EndTime"]=content["HitObjects"][i][5];
                    if(Objs[i]["EndTime"]>0)LN++;
                    Objs[i]["Available"]=true;
                    LineQueue[Objs[i]["Key"]][LineQueueTail[Objs[i]["Key"]]++]=i;
                }
                EndScore=(LN+HOnums)*5;
                
                // Apply settings
                Scale = parseInt(document.getElementById('gameScale').value) || 100;
                scrollDuration = parseInt(document.getElementById('scrollSpeed').value) || 450;
                offset = parseInt(document.getElementById('offset').value) || -40;
                
                // Start the game
                document.getElementById('gameSettings').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                
                // Update canvas and context references for the new canvas
                c = document.getElementById('gameCanvas');
                ctx = c.getContext('2d');
                audio1 = document.getElementById('gameAudio');
                
                // Recreate the linear gradient for the new context
                linear = ctx.createLinearGradient(75,850,75,500);
                linear.addColorStop(0,"#9ED3FF");
                linear.addColorStop(1,"rgba(0,0,0,0)");
                
                // Setup canvas scaling
                const canvas = document.getElementById('gameCanvas');
                const scale = Scale / 100;
                canvas.style.width = (600 * scale) + 'px';
                canvas.style.height = (800 * scale) + 'px';
                
                // Start the game using existing system
                setTimeout(() => {
                    bt_start_onclick();
                }, 500);
                
            } catch (error) {
                console.error('Error starting game:', error);
                alert('Failed to start game: ' + error.message);
            }
        }

        // Reset all game variables
        function resetGameVariables() {
            preTime = 2000;
            time = 0;
            content = null;
            TPnums = 0;
            BPMnums = 0;
            BPMs = {};
            Objs = {};
            HOnums = 0;
            scrollDuration = 500;
            MpB = 0;
            baseMpB = 0;
            percent = 100;
            BpB = 4;
            measure = BpB * MpB;
            p = 0;
            noteThick = 60;
            LineQueue = [{},{},{},{}];
            LineQueueTail = [0,0,0,0];
            LineQueueHead = [0,0,0,0];
            keyAsync = [false,false,false,false];
            keyLaserTime = [0,0,0,0];
            JudgeTime = 500;
            JudgeNew = 0;
            JudgeType = 0;
            FSType = false;
            LN = 0;
            Score = 0;
            EndScore = 0;
            Combo = 0;
            LineHold = [-1,-1,-1,-1];
            TouchHold = [-1,-1,-1,-1];
            LaserTime = 150;
            Result = [0,0,0,0,0,0,0];
            FastCount = 0;
            SlowCount = 0;
            MaxCombo = 0;
        }

        function pauseGame() {
            if (audio1 && !audio1.ended) {
                audio1.pause();
                document.getElementById('pauseOverlay').style.display = 'flex';
            }
        }

        function resumeGame() {
            if (audio1 && !audio1.ended) {
                audio1.play();
                document.getElementById('pauseOverlay').style.display = 'none';
                startTime();
            }
        }

        function restartGame() {
            document.getElementById('pauseOverlay').style.display = 'none';
            startGame();
        }

        function exitGame() {
            window.location.href = 'index.html';
        }

        function openSettings() {
            alert(\`Game Settings:

Current Settings:
• Scroll Speed: \${gameSettings.scrollSpeed}ms
• Audio Offset: \${gameSettings.offset}ms  
• Scale: \${gameSettings.scale}%
• Keys: \${Object.keys(keyPresets)[Object.values(keyPresets).findIndex(k => JSON.stringify(k) === JSON.stringify(gameSettings.keyBindings))]}

\${Score !== undefined ? \`
Current Stats:
• Score: \${Score}/\${EndScore}
• Accuracy: \${Math.round(Score/EndScore*10000)/100}%
• Combo: \${Combo} (Max: \${MaxCombo})
• Perfect: \${Result[0] + Result[1]}
• Great: \${Result[2]}
• Good: \${Result[3]}
• Bad: \${Result[4]}
• Miss: \${Result[5] + Result[6]}\` : ''}\`);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.keyCode === 27) { // ESC
                if (audio1 && !audio1.ended && !audio1.paused) {
                    pauseGame();
                } else if (document.getElementById('pauseOverlay').style.display === 'flex') {
                    resumeGame();
                }
            }
        });

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', initializeGame);
    </script>
</body>
</html>`;
}

// Song configurations
const songConfigs = {
    'Aleph-0': {
        title: 'Aleph-0',
        artist: 'LeaF',
        difficulty: 'CARDINALITY',
        difficultyColor: '#F44336',
        charter: 'jakads',
        audioPath: 'Songs/Aleph-0/audio.mp3',
        chartPath: 'Songs/Aleph-0/LeaF - Aleph-0 (jakads) [Cardinality].txt'
    },
    'Elysium': {
        title: 'Elysium',
        artist: 'Rob Gasser',
        difficulty: 'HEAVENLY PARADISE',
        difficultyColor: '#4CAF50',
        charter: 'LuigiClaren',
        audioPath: 'Songs/Elysium/Rob Gasser - Elysium Original Mix FREE DOWNLOAD.mp3',
        chartPath: 'Songs/Elysium/Rob Gasser - Elysium (LuigiClaren) [Heavenly Paradise].txt'
    },
    'Fastest-Crash': {
        title: 'Fastest Crash',
        artist: 'Camellia',
        difficulty: 'PAROXYSM',
        difficultyColor: '#FF9800',
        charter: 'Shoegazer',
        audioPath: 'Songs/Fastest Crash/05 Fastest Crash.mp3',
        chartPath: 'Songs/Fastest Crash/Camellia - Fastest Crash (Shoegazer) [Paroxysm].txt'
    },
    'NANO-DEATH': {
        title: 'NANO DEATH!!!!!',
        artist: 'LeaF',
        difficulty: 'EXPERT',
        difficultyColor: '#9C27B0',
        charter: 'nowsmart',
        audioPath: 'Songs/NANO DEATH/audio.mp3',
        chartPath: 'Songs/NANO DEATH/LeaF - NANO DEATH!!!!! (nowsmart) [Expert].txt'
    },
    'Blue-Zenith': {
        title: 'Blue Zenith',
        artist: 'xi',
        difficulty: 'FOUR DIMENSIONS',
        difficultyColor: '#2196F3',
        charter: 'Jepetski',
        audioPath: 'Songs/zenith/zenith.mp3',
        chartPath: 'Songs/zenith/xi - Blue Zenith (Jepetski) [FOUR DIMENSIONS].txt'
    },
    'Blue-Zenith-Another': {
        title: 'Blue Zenith',
        artist: 'xi',
        difficulty: 'FRENZY ANOTHER',
        difficultyColor: '#E91E63',
        charter: 'Jepetski',
        audioPath: 'Songs/zenith/zenith.mp3',
        chartPath: 'Songs/zenith/xi - Blue Zenith (Jepetski) [Frenzy Another].txt'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createModernSongTemplate, songConfigs };
}
