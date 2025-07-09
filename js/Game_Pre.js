"use strict";

let preTime=2000;
let time=0;
let content;
let TPnums=0;
let BPMnums=0;
let BPMs={};
let Objs={};
let HOnums=0;
let scrollDuration=500;
let MpB=0;
let baseMpB=0;
let percent=100;
let BpB=4;
let measure=BpB*MpB;
let p=0;
let noteThick=60;
let LineQueue=[{},{},{},{}],LineQueueTail=[0,0,0,0],LineQueueHead=[0,0,0,0];
let timing=[16,37,70,100,123,161];
let audio1;
let keyAsync=[false,false,false,false];
let keyLaserTime=[0,0,0,0];
let JudgeTime=500;
let JudgeNew=0;
let JudgeType=0;
let FSType=false;
let LN=0;
let Score=0,EndScore=0;
let Combo=0;
let LineHold=[-1,-1,-1,-1];
let TouchHold=[-1,-1,-1,-1];
let LaserTime=150;
let offset = -40;
let effectiveOffset = offset;

// Hit sound variables
let hitSound;
let hitSoundPool = [];
let holdSoundIntervals = [-1, -1, -1, -1]; 
const HOLD_SOUND_INTERVAL = 80; 
let audioContextResumed = false;

const JUDGEMENT_LINE_Y = 680;
const CANVAS_HEIGHT = 800;

function updateOffsetFromSettings() {
    if (typeof gameSettings !== 'undefined' && gameSettings) {
        try {
            effectiveOffset = gameSettings.getEffectiveOffset();
            console.log(`Updated effective offset to: ${effectiveOffset}ms`);
        } catch (error) {
            console.warn('Failed to get effective offset from settings, using default:', error);
            effectiveOffset = offset;
        }
    } else {
        console.warn('gameSettings not available, using default offset');
        effectiveOffset = offset;
    }
}

function loadHitSound() {
    console.log('Loading hit sound...');
    return new Promise((resolve) => {
        try {
            let soundsLoaded = 0;
            const totalSounds = 10;
            
            // Create a pool of audio objects for simultaneous playback
            for (let i = 0; i < totalSounds; i++) {
                const sound = new Audio('assets/sound/hitsound.mp3');
                sound.volume = 0.8; // Set volume to 80% to be audible over music
                sound.preload = 'auto';
                
                // Handle successful loading
                const onCanPlay = () => {
                    soundsLoaded++;
                    sound.removeEventListener('canplaythrough', onCanPlay);
                    sound.removeEventListener('error', onError);
                    
                    if (soundsLoaded === 1) {
                        // As soon as the first sound is loaded, we can continue
                        hitSound = sound;
                        console.log('First hit sound loaded successfully');
                        resolve();
                    }
                };
                
                // Handle loading errors
                const onError = (e) => {
                    console.warn(`Hit sound ${i} failed to load:`, e);
                    sound.removeEventListener('canplaythrough', onCanPlay);
                    sound.removeEventListener('error', onError);
                    
                    soundsLoaded++;
                    if (soundsLoaded === 1) {
                        // Even if the first sound fails, continue without hit sounds
                        console.warn('Hit sound failed to load, continuing without hit sounds');
                        resolve();
                    }
                };
                
                sound.addEventListener('canplaythrough', onCanPlay);
                sound.addEventListener('error', onError);
                
                hitSoundPool.push(sound);
            }
            
            // Fallback timeout in case audio loading gets stuck
            setTimeout(() => {
                if (soundsLoaded === 0) {
                    console.warn('Hit sound loading timed out, continuing without hit sounds');
                    resolve();
                }
            }, 2000); // 2 second timeout
            
        } catch (error) {
            console.error('Failed to load hit sound:', error);
            resolve(); // Continue without hit sounds
        }
    });
}

function playHitSound() {
    if (!hitSoundPool || hitSoundPool.length === 0) {
        console.warn('Hit sound pool not available');
        return;
    }

    try {
        if (!audioContextResumed) {
            const firstSound = hitSoundPool[0];
            if (firstSound) {
                const context = firstSound.context || (window.AudioContext || window.webkitAudioContext) && new (window.AudioContext || window.webkitAudioContext)();
                if (context && context.state === 'suspended') {
                    context.resume().then(() => {
                        console.log("AudioContext resumed by user interaction.");
                        audioContextResumed = true;
                    });
                } else {
                    audioContextResumed = true; 
                }
            }
        }

        if (typeof gameSettings !== 'undefined' && !gameSettings.hitSounds) {
            return; // Hit sounds are disabled
        }

        let availableSound = hitSoundPool.find(sound => sound.paused || sound.ended);

        if (!availableSound) {
            availableSound = hitSoundPool[0];
        }

        if (!availableSound) {
            console.warn('No hit sound available to play');
            return;
        }

        availableSound.currentTime = 0;
        const playPromise = availableSound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('Hit sound play failed:', error);
            });
        }
    } catch (error) {
        console.warn('Error playing hit sound:', error);
    }
}

function startHoldSound(lane) {
    if (holdSoundIntervals[lane] !== -1) return; // Already playing
    
    holdSoundIntervals[lane] = setInterval(() => {
        playHitSound();
    }, HOLD_SOUND_INTERVAL);
}

function stopHoldSound(lane, playFinalSound = true) {
    if (holdSoundIntervals[lane] !== -1) {
        clearInterval(holdSoundIntervals[lane]);
        holdSoundIntervals[lane] = -1;
        // Only play final hit sound if it's a proper hold note completion
        if (playFinalSound) {
            playHitSound();
        }
    }
}

async function initializeGameElements() {
    console.log('Initializing game elements...');
    audio1 = document.getElementById("audioPlayer");
    if (!audio1) {
        console.error('Audio element not found!');
        return false;
    }
    c = document.getElementById("myCanvas");
    if (!c) {
        console.error('Canvas element not found!');
        return false;
    }
    ctx = c.getContext("2d");
    if (!ctx) {
        console.error('Canvas context not available!');
        return false;
    }
    linear = ctx.createLinearGradient(75,CANVAS_HEIGHT,75,JUDGEMENT_LINE_Y);
    linear.addColorStop(0,"#9ED3FF");
    linear.addColorStop(1,"rgba(0,0,0,0)");
    waveGradient = ctx.createLinearGradient(0, 0, 600, 0);
    waveGradient.addColorStop(0, "rgba(0, 180, 255, 0.3)");
    waveGradient.addColorStop(0.5, "rgba(0, 255, 200, 0.2)");
    waveGradient.addColorStop(1, "rgba(0, 120, 200, 0.3)");
    
    // Load hit sound (now async)
    await loadHitSound();
    
    // Initialize key binding display
    initializeKeyBindingDisplay();
    
    console.log('Game elements initialized successfully');
    return true;
}
let Scale=100;
let Result=[0,0,0,0,0,0,0];
let FastCount=0,SlowCount=0,MaxCombo=0;
const bindKey=[68,70,74,75];
let c, ctx, linear, waveGradient;

function parseOsuString(data) {
    let regex = {
        section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
        param: /^\s*([\w.\-_]+)\s*:\s*(.*?)\s*$/,
        param2: /^\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*$/,
        param3: /^\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*,\s*([?.\-\d]+)\s*/,
        comment: /^\s*\/\/.*$/
    };
    let value = {};
    let lines = data.split(/\r\n|\r|\n/);
    let section = null;
    TPnums = 0;
    HOnums = 0;
    lines.forEach(function(line){
        if(regex.comment.test(line)){
            return;
        }else if(regex.param.test(line)){
            let match = line.match(regex.param);
            if(section){
                value[section][match[1]] = match[2];
            }else{
                value[match[1]] = match[2];
            }
        }else if(regex.param2.test(line)){
            let match = line.match(regex.param2);
            if (!value[section]) value[section] = {};
            value[section][TPnums]={};
            for(let i=0;i<8;i++)
                if(section){
                    value[section][TPnums][i] = Number(match[1+i]);
                }
            TPnums++;
        }else if(regex.param3.test(line)){
            let match = line.match(regex.param3);
            if (!value[section]) value[section] = {};
            value[section][HOnums]={};
            for(let i=0;i<6;i++)
                if(section){
                    value[section][HOnums][i] = Number(match[1+i]);
                }
            HOnums++;
        }else if(regex.section.test(line)){
            let match = line.match(regex.section);
            value[match[1]] = {};
            section = match[1];
        }else if(line.length === 0 && section){
            section = null;
        };
    });
    return value;
}

function processChartData(chartText) {
    console.log('Processing chart data...', chartText ? 'Data provided' : 'No data');
    if (!chartText) {
        throw new Error('No chart data provided to processChartData');
    }
    // --- (Keep all your existing variable resets) ---
    p = 0; BPMnums = 0; LN = 0; Score = 0; Combo = 0; MaxCombo = 0;
    FastCount = 0; SlowCount = 0;
    BPMs = {}; Objs = {}; Result.fill(0);
    LineQueue=[[],[],[],[]];
    LineQueueTail=[0,0,0,0]; LineQueueHead=[0,0,0,0];
    if(typeof waveManager !== 'undefined') {
        waveManager.clearWaves();
    }
    if(window.waveNotesTracked) {
        window.waveNotesTracked.clear();
    }

    try {
        content = parseOsuString(chartText);
        console.log('Chart parsed, content:', content);
        if (!content) {
            throw new Error('Failed to parse chart data');
        }
        if (!content["TimingPoints"] || !content["HitObjects"]) {
            throw new Error('Chart missing required sections (TimingPoints or HitObjects)');
        }
        console.log(`Chart contains ${TPnums} timing points and ${HOnums} hit objects`);

        // --- (Keep all your existing parsing loops for TimingPoints and HitObjects) ---
        for(let i=0;i<TPnums;i++) {
            if(content["TimingPoints"][i][1]<0) {
                content["TimingPoints"][i][8] = BPMnums - 1;
            } else {
                content["TimingPoints"][i][8] = BPMnums;
                BPMs[BPMnums]={};
                BPMs[BPMnums][0]=content["TimingPoints"][i][0];
                BPMs[BPMnums][1]=content["TimingPoints"][i][1];
                BPMs[BPMnums][2]=content["TimingPoints"][i][2];
                BPMnums++;
            }
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

        // --- (This part is identical to your existing code) ---
        console.log(`Chart processed: ${TPnums} TPs, ${HOnums} Notes. EndScore: ${EndScore}`);
        if (TPnums === 0) {
            throw new Error('No timing points found in chart');
        }
        if (HOnums === 0) {
            throw new Error('No hit objects found in chart');
        }

        const chartBaseMpB = getBaseMpBFromChart();
        if (chartBaseMpB && chartBaseMpB > 0) {
            baseMpB = chartBaseMpB;
            console.log(`Chart's baseMpB set to: ${baseMpB} (from ${60000 / baseMpB} BPM)`);
        } else {
            console.error('Failed to auto-detect baseMpB from chart. Using fallback 500.');
            baseMpB = 500; // Default fallback (120 BPM)
        }

    } catch (error) {
        console.error('Error processing chart data:', error);
        throw error;
    }
}

window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimaitonFrame ||
        function (callback) {
            window.setTimeout(callback, 1000/60);
        };
})();
document.ontouchmove = function (e) {
    e.preventDefault();
    return false;
}
let gameStarted = false;

function startTime() {
    if (!audio1) {
        console.error('Audio element not available in startTime()');
        return;
    }
    if (!c || !ctx) {
        console.error('Canvas or context not available in startTime()');
        return;
    }
    if (!gameStarted) {
        gameStarted = true;
        console.log('Game loop started');
        // Show key binding display at the start of the game
        showKeyBindingDisplay();
    }
    if(preTime>0){
        time=-preTime+effectiveOffset;
        try {
            draw();
        } catch (error) {
            console.error('Error in draw during preTime:', error);
        }
        preTime-=5;
        setTimeout(startTime,5);
        return;
    }
    if(preTime===0){
        console.log('Starting audio playback...');
        try {
            const playPromise = audio1.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Failed to play audio:', error);
                });
            }
        } catch (error) {
            console.error('Error playing audio:', error);
        }
        preTime=-1;
    }
    if(audio1.ended){
        gameStarted = false;
        removeKeyListener();
        EndingScene();
        return;
    }
    if(audio1.ended||audio1.paused)return;
    time=audio1.currentTime * 1000+effectiveOffset;
    while(p<TPnums-1&&time>=content["TimingPoints"][p+1][0])p++;
    try {
        draw();
    } catch (error) {
        console.error('Error in draw during main loop:', error);
    }
    if(!(audio1.ended||audio1.paused))requestAnimFrame(startTime);
}
function initKeyListener() {
    window.addEventListener("keydown",processKeydown, true);
    window.addEventListener("keyup", processKeyup, true);
    c.addEventListener('touchstart', processTouchstart, true);
    c.addEventListener('touchend', processTouchend, true);
}
function removeKeyListener() {
    window.removeEventListener("keydown",processKeydown, true);
    window.removeEventListener("keyup", processKeyup, true);
    c.removeEventListener('touchstart', processTouchstart, true);
    c.removeEventListener('touchend', processTouchend, true);
}
function calcPOS(tt) {
    if (!baseMpB || baseMpB <= 0) {
        baseMpB = 500;
        console.warn(`baseMpB was invalid (${baseMpB}), using fallback: 500`);
    }
    let p1 = p;
    while (p1 > 0 && tt < content["TimingPoints"][p1][0]) p1--;
    tt = Number(tt);
    let tpos = 0;
    let pos = 0;
    let MpB = 0;
    let c = 0;
    if (!BPMs[content["TimingPoints"][p1][8]]) return 0;
    for (let i = p1; i < TPnums; i++) {
        if (!BPMs[content["TimingPoints"][i][8]]) continue;
        MpB = BPMs[content["TimingPoints"][i][8]][1];
        if (content["TimingPoints"][i][1] > 0) percent = 1; else percent = -content["TimingPoints"][i][1] / 100;
        const scroll = scrollDuration * MpB * percent / baseMpB;
        if (scroll <= 0) continue;
        if (i === TPnums - 1 || content["TimingPoints"][i + 1][0] > time) {
            c = (time - content["TimingPoints"][i][0]) * JUDGEMENT_LINE_Y / scroll;
        } else {
            c = (content["TimingPoints"][i + 1][0] - content["TimingPoints"][i][0]) * JUDGEMENT_LINE_Y / scroll;
        }
        tpos = tpos + c;
        if (i === TPnums - 1 || content["TimingPoints"][i + 1][0] > time) break;
    }
    for (let i = p1; i < TPnums; i++) {
        if (!BPMs[content["TimingPoints"][i][8]]) continue;
        MpB = BPMs[content["TimingPoints"][i][8]][1];
        if (content["TimingPoints"][i][1] > 0) percent = 1; else percent = -content["TimingPoints"][i][1] / 100;
        const scroll = scrollDuration * MpB * percent / baseMpB;
        if (scroll <= 0) continue;
        if (i === TPnums - 1 || content["TimingPoints"][i + 1][0] > tt) {
            c = (tt - content["TimingPoints"][i][0]) * JUDGEMENT_LINE_Y / scroll;
        } else {
            c = (content["TimingPoints"][i + 1][0] - content["TimingPoints"][i][0]) * JUDGEMENT_LINE_Y / scroll;
        }
        pos = pos + c;
        if (i === TPnums - 1 || content["TimingPoints"][i + 1][0] > tt) break;
    }
    return Number(pos - tpos);
}

function MissEvent(early) {
    Combo=0;
    FSType=early;
    JudgeType=6;
    Result[6]++;
    JudgeNew=time+JudgeTime;
    if(early)FastCount++;else SlowCount++;
    
    // Trigger chaotic judgement display for miss
    if (typeof window !== 'undefined' && window.gameplayEnhancer) {
        window.gameplayEnhancer.showChaoticJudgement(6, null);
    }
}
function HitEvent(Key, number, early, isHoldStart = false) {
    if(number<5)Combo++;else Combo=0;
    if(Combo>MaxCombo)MaxCombo=Combo;
    Score+=5-number;
    FSType=early;
    JudgeType=number;
    if(number!==0)
        if(early)FastCount++;else SlowCount++;
    Result[number]++;
    JudgeNew=time+JudgeTime;
    
    // Trigger chaotic judgement display
    if (typeof window !== 'undefined' && window.gameplayEnhancer) {
        window.gameplayEnhancer.showChaoticJudgement(number, Key);
    }
    
    // Play hit sound for successful hits (not for misses)
    if (number < 6) { // 0-5 are successful hits, 6 is miss
        playHitSound();
        
        // Only start hold sound when explicitly starting a hold note
        if (isHoldStart && number < 5) {
            startHoldSound(Key);
        }
    }
    
    if(typeof waveManager !== 'undefined' && waveManager.isReady()) {
        waveManager.addHitSplash(Key, number);
    }
    // Add splash animation for note hits
    if(typeof splashManager !== 'undefined' && splashManager.isReady()) {
        splashManager.addHitSplash(Key, number);
    }
}
function processTouchstart(e) {
	e.preventDefault();
    let ID=e.changedTouches[0].identifier;
    let X=e.changedTouches[0].clientX-c.offsetLeft;
    let Key=0,Finded=false;
    if(X<=150*Scale/100)Key=0;else if(X<=300*Scale/100)Key=1;else if(X<=450*Scale/100)Key=2;else Key=3;
    if (!keyAsync[Key]) {
        keyAsync[Key] = true;
        keyLaserTime[Key] = -1;
        TouchHold[Key]=ID;
        Finded=true;
    }
    if(time<0)return;
    if(!Finded)return;
    if(null != audio1&&!audio1.ended&&!audio1.paused) {
        LineHold[Key]=-1;
        let i=LineQueueHead[Key];
        while(i<LineQueueTail[Key]&&!Objs[LineQueue[Key][i]]["Available"])i++;
        if (i >= LineQueueTail[Key]) return;
        let st = Objs[LineQueue[Key][i]]["StartTime"],
            et = Objs[LineQueue[Key][i]]["EndTime"];
        if (time + timing[5] < st) return;

        if (et === 0) {
            if (st < time - timing[5]) {
                MissEvent(time<st);
                LineQueueHead[Key]=i+1;
                return;
            }
            if (time - timing[0] <= st && st <= time + timing[0]) {
                HitEvent(Key, 0);
                LineQueueHead[Key]=i+1;
            } else if (time - timing[1] <= st && st <= time + timing[1]) {
                HitEvent(Key, 1, time<st);
                LineQueueHead[Key]=i+1;
            } else if (time - timing[2] <= st && st <= time + timing[2]) {
                HitEvent(Key, 2, time<st);
                LineQueueHead[Key]=i+1;
            } else if (time - timing[3] <= st && st <= time + timing[3]) {
                HitEvent(Key, 3, time<st);
                LineQueueHead[Key]=i+1;
            } else if (time - timing[4] <= st && st <= time + timing[4]) {
                HitEvent(Key, 4, time<st);
                LineQueueHead[Key]=i+1;
            } else {
                HitEvent(Key, 5, time<st);
                LineQueueHead[Key]=i+1;
            }
        } else if(Objs[LineQueue[Key][i]]["Available"]){
            if (st < time - timing[5]) {
                MissEvent(time<st);
                LineHold[Key]=-1;
                Objs[LineQueue[Key][i]]["Available"] = false;
                return;
            }
            LineHold[Key]=LineQueue[Key][i];
            if (time - timing[0] <= st && st <= time + timing[0]) {
                HitEvent(Key, 0, time<st, true); // true = this is a hold start
            } else if (time - timing[1] <= st && st <= time + timing[1]) {
                HitEvent(Key, 1, time<st, true);
            } else if (time - timing[2] <= st && st <= time + timing[2]) {
                HitEvent(Key, 2, time<st, true);
            } else if (time - timing[3] <= st && st <= time + timing[3]) {
                HitEvent(Key, 3, time<st, true);
            } else if (time - timing[4] <= st && st <= time + timing[4]) {
                HitEvent(Key, 4, time<st, true);
            } else {
                HitEvent(Key, 5, time<st, true);
            }
        }
    }
}
function processTouchend(e){
	e.preventDefault();
    let ID=e.changedTouches[0].identifier;
    let Key=0,Finded=false;
    for(let i=0;i<4;i++) {
        if (TouchHold[i] === ID && keyAsync[i]) {
            keyAsync[i] = false;
            keyLaserTime[i] = LaserTime+time;
            Finded=true;
            Key=i;
            // Stop hold sound when touch is released
            stopHoldSound(i, false); // false = don't play final sound for early release
            break;
        }
    }
    if(time<0)return;
    if(!Finded)return;
    if(null != audio1&&!audio1.ended&&!audio1.paused) {
        let i=LineQueueHead[Key];
        while(i<LineQueueTail[Key]&&!Objs[LineQueue[Key][i]]["Available"])i++;
        if (i >= LineQueueTail[Key]) return;
        if (LineHold[Key] === -1) return;
        if (LineQueue[Key][i] !== LineHold[Key]) {
            LineHold[Key] = -1;
            return;
        }
        let et = Objs[LineQueue[Key][i]]["EndTime"];
        LineHold[Key] = -1;
        // Stop hold sound for long notes (touch)
        stopHoldSound(Key);
        Objs[LineQueue[Key][i]]["Available"] = false;
        if (time + timing[5] < et) {
            MissEvent(time<et);
            return;
        }else if (time >= et) {
            HitEvent(Key, 0, time<et);
            return;
        }
        if (time - timing[0] <= et && et <= time + timing[0]) {
            HitEvent(Key, 0, time<et);
        } else if (time - timing[1] <= et && et <= time + timing[1]) {
            HitEvent(Key, 1, time<et);
        } else if (time - timing[2] <= et && et <= time + timing[2]) {
            HitEvent(Key, 2, time<et);
        } else if (time - timing[3] <= et && et <= time + timing[3]) {
            HitEvent(Key, 3, time<et);
        } else if (time - timing[4] <= et && et <= time + timing[4]) {
            HitEvent(Key, 4, time<et);
        } else {
            HitEvent(Key, 5, time<et);
        }
    }
}
function processKeydown(e) {
    let keys = e.keyCode,Key=0,Finded=false;
    if(null != audio1&&(!audio1.ended)&&time>0) {
        if(keys===27){
            audio1.paused?audio1.play():audio1.pause();
            if(!(audio1.ended||audio1.paused))startTime();
        }
    }
    for(let i=0;i<4;i++) {
        if (bindKey[i] === keys && !keyAsync[i]) {
            keyAsync[i] = true;
            keyLaserTime[i] = -1;
            Finded=true;
            Key=i;
            break;
        }
    }
    if(time<0)return;
    if(!Finded)return;
    if(null != audio1&&!audio1.ended&&!audio1.paused) {
        LineHold[Key]=-1;
        let i=LineQueueHead[Key];
        while(i<LineQueueTail[Key]&&!Objs[LineQueue[Key][i]]["Available"])i++;
        if (i >= LineQueueTail[Key]) return;
        let st = Objs[LineQueue[Key][i]]["StartTime"],
            et = Objs[LineQueue[Key][i]]["EndTime"];
        if (time + timing[5] < st) return;

        if (et === 0) {
            if (st < time - timing[5]) {
                MissEvent(time<st);
                LineQueueHead[Key]=i+1;
                return;
            }
            if (time - timing[0] <= st && st <= time + timing[0]) {
                HitEvent(Key, 0);
                LineQueueHead[Key]=i+1;
            } else if (time - timing[1] <= st && st <= time + timing[1]) {
                HitEvent(Key, 1, time<st);
                LineQueueHead[Key]=i+1;
            } else if (time - timing[2] <= st && st <= time + timing[2]) {
                HitEvent(Key, 2, time<st);
                LineQueueHead[Key]=i+1;
            } else if (time - timing[3] <= st && st <= time + timing[3]) {
                HitEvent(Key, 3, time<st);
                LineQueueHead[Key]=i+1;
            } else if (time - timing[4] <= st && st <= time + timing[4]) {
                HitEvent(Key, 4, time<st);
                LineQueueHead[Key]=i+1;
            } else {
                HitEvent(Key, 5, time<st);
                LineQueueHead[Key]=i+1;
            }
        } else if(Objs[LineQueue[Key][i]]["Available"]){
            if (st < time - timing[5]) {
                MissEvent(time<st);
                LineHold[Key]=-1;
                Objs[LineQueue[Key][i]]["Available"] = false;
                return;
            }
            LineHold[Key]=LineQueue[Key][i];
            if (time - timing[0] <= st && st <= time + timing[0]) {
                HitEvent(Key, 0, time<st, true); // true = this is a hold start
            } else if (time - timing[1] <= st && st <= time + timing[1]) {
                HitEvent(Key, 1, time<st, true);
            } else if (time - timing[2] <= st && st <= time + timing[2]) {
                HitEvent(Key, 2, time<st, true);
            } else if (time - timing[3] <= st && st <= time + timing[3]) {
                HitEvent(Key, 3, time<st, true);
            } else if (time - timing[4] <= st && st <= time + timing[4]) {
                HitEvent(Key, 4, time<st, true);
            } else {
                HitEvent(Key, 5, time<st, true);
            }
        }
    }
}
function processKeyup(e){
    let keys = e.keyCode,Key=0,Finded=false;
    for(let i=0;i<4;i++) {
        if (bindKey[i] === keys && keyAsync[i]) {
            keyAsync[i] = false;
            keyLaserTime[i] = LaserTime+time;
            Finded=true;
            Key=i;
            // Stop hold sound when key is released
            stopHoldSound(i, false); // false = don't play final sound for early release
            break;
        }
    }
    if(time<0)return;
    if(!Finded)return;
    TouchHold[Key]=-1;
    if(null != audio1&&!audio1.ended&&!audio1.paused) {
        let i=LineQueueHead[Key];
        while(i<LineQueueTail[Key]&&!Objs[LineQueue[Key][i]]["Available"])i++;
        if (i >= LineQueueTail[Key]) return;
        if (LineHold[Key] === -1) return;
        if (LineQueue[Key][i] !== LineHold[Key]) {
            LineHold[Key] = -1;
            return;
        }
        let et = Objs[LineQueue[Key][i]]["EndTime"];
        LineHold[Key] = -1;
        // Stop hold sound for long notes (keyboard)
        stopHoldSound(Key);
        Objs[LineQueue[Key][i]]["Available"] = false;
        if (time + timing[5] < et) {
            MissEvent(time<et);
            return;
        }else if (time >= et) {
            HitEvent(Key, 0, time<et);
            return;
        }
        if (time - timing[0] <= et && et <= time + timing[0]) {
            HitEvent(Key, 0, time<et);
        } else if (time - timing[1] <= et && et <= time + timing[1]) {
            HitEvent(Key, 1, time<et);
        } else if (time - timing[2] <= et && et <= time + timing[2]) {
            HitEvent(Key, 2, time<et);
        } else if (time - timing[3] <= et && et <= time + timing[3]) {
            HitEvent(Key, 3, time<et);
        } else if (time - timing[4] <= et && et <= time + timing[4]) {
            HitEvent(Key, 4, time<et);
        } else {
            HitEvent(Key, 5, time<et);
        }
    }
}
function draw_Bar_Line() {
    ctx.save();
    for(let i=content["TimingPoints"][p][8];i<BPMnums;i++){
        if (!BPMs[i]) continue;
        BpB=BPMs[i][2];
        MpB=BPMs[i][1];
        measure=BpB*MpB;
        let a=false;
        for(let tt=BPMs[i][0]; i===BPMnums-1||(i<BPMnums-1&&tt<BPMs[i+1][0]); tt=tt+measure){
            a=true;
            if(tt<time)continue;
            let pos=calcPOS(tt);
            if(pos>JUDGEMENT_LINE_Y+noteThick)break;
            ctx.fillStyle="#FF0000";
            ctx.fillRect(0,JUDGEMENT_LINE_Y-pos+noteThick,600,2);
            a=false;
        }
        if(a)break;
    }
    ctx.restore();
}

function calculateAccuracy() {
    const perfects = Result[1] || 0;
    const greats = Result[2] || 0;
    const goods = Result[3] || 0;
    const bads = Result[4] || 0;
    const misses = (Result[5] || 0) + (Result[6] || 0);

    const totalNotes = perfects + greats + goods + bads + misses;
    if (totalNotes === 0) return 0;

    // Using a weighted score system for accuracy
    const weightedScore = (perfects * 300) + (greats * 200) + (goods * 100) + (bads * 50);
    const maxScore = totalNotes * 300;

    return (weightedScore / maxScore) * 100;
}

function EndingScene() {
    const endingScene = document.getElementById('ending-scene');
    if (!endingScene) return;

    const songTitle = document.getElementById('song-title').textContent;
    const songArtist = document.getElementById('song-artist').textContent;

    const accuracy = calculateAccuracy();

    document.getElementById('end-score').textContent = Score;
    document.getElementById('end-max-combo').textContent = MaxCombo;
    document.getElementById('end-accuracy').textContent = `${accuracy.toFixed(2)}%`;

    const judgements = {
        perfect: Result[1] || 0,
        great: Result[2] || 0,
        good: Result[3] || 0,
        bad: Result[4] || 0,
        miss: (Result[5] || 0) + (Result[6] || 0)
    };

    document.getElementById('judgement-perfect').textContent = judgements.perfect;
    document.getElementById('judgement-great').textContent = judgements.great;
    document.getElementById('judgement-good').textContent = judgements.good;
    document.getElementById('judgement-bad').textContent = judgements.bad;
    document.getElementById('judgement-miss').textContent = judgements.miss;

    // Determine Rank
    let rank = 'D';
    if (accuracy >= 95) rank = 'S';
    else if (accuracy >= 85) rank = 'A';
    else if (accuracy >= 75) rank = 'B';
    else if (accuracy >= 65) rank = 'C';
    document.getElementById('end-rank').textContent = rank;

    endingScene.style.display = 'flex';
}
function draw_Notes() {
    ctx.save();
    for(let Col=0;Col<4;Col++){
        for(let i=LineQueueHead[Col];i<LineQueueTail[Col];i++){
            if(Objs[LineQueue[Col][i]]["EndTime"]>0&&time-Objs[LineQueue[Col][i]]["EndTime"]>0){
                if(Objs[LineQueue[Col][i]]["Available"]&&LineHold[Col]===LineQueue[Col][i]){
                    HitEvent(Col, 0);
                    LineHold[Col]=-1;
                    LineQueueHead[Col]=i+1;
                    continue;
                }
            }
            if(LineHold[Col]!==LineQueue[Col][i]) {
                if(Objs[LineQueue[Col][i]]["Available"])
                    if (time - Objs[LineQueue[Col][i]]["StartTime"] > timing[5]) {
                        MissEvent(time<Objs[LineQueue[Col][i]]["StartTime"]);
                        if (Objs[LineQueue[Col][i]]["EndTime"] === 0) {
                            LineQueueHead[Col] = i + 1;
                            continue;
                        } else {
                            Objs[LineQueue[Col][i]]["Available"] = false;
                        }
                    }
            }
            let L=0;
            let color="#FFFFFF";
            ctx.strokeStyle="#FF0000";
            switch(Col){
                case 0: 
                    L=0; 
                    color="rgba(180, 230, 255, 0.9)";
                    ctx.strokeStyle="#0080FF"; 
                    break;
                case 1: 
                    L=150; 
                    color="rgba(0, 255, 200, 0.9)";
                    ctx.strokeStyle="#00FFAA"; 
                    break;
                case 2: 
                    L=300; 
                    color="rgba(0, 255, 200, 0.9)";
                    ctx.strokeStyle="#00FFAA"; 
                    break;
                case 3: 
                    L=450; 
                    color="rgba(180, 230, 255, 0.9)";
                    ctx.strokeStyle="#0080FF"; 
                    break;
            }
            if(!Objs[LineQueue[Col][i]]["Available"]){
                color="rgba(127, 127, 127, 0.6)";
                ctx.strokeStyle="#7F0000";
                if(Col === 1 || Col === 2) color="rgba(11, 127, 127, 0.6)";
            }
            ctx.fillStyle=color;
            ctx.lineWidth=4;
            let pos=calcPOS(Objs[LineQueue[Col][i]]["StartTime"]);
            if(pos>JUDGEMENT_LINE_Y+noteThick)break;
            if(typeof waveManager !== 'undefined' && waveManager.isReady() && pos <= JUDGEMENT_LINE_Y + 300 && pos >= -100) {
                const noteId = `${Col}_${LineQueue[Col][i]}`;
                if (!window.waveNotesTracked) window.waveNotesTracked = new Set();
                if (!window.waveNotesTracked.has(noteId)) {
                    window.waveNotesTracked.add(noteId);
                    waveManager.addWaveForNote(
                        Col, 
                        JUDGEMENT_LINE_Y - pos, 
                        Objs[LineQueue[Col][i]]["StartTime"], 
                        Objs[LineQueue[Col][i]]["EndTime"] || null
                    );
                }
            }
            if(Objs[LineQueue[Col][i]]["EndTime"]!==0){
                let pos2=calcPOS(Objs[LineQueue[Col][i]]["EndTime"]);
                if(pos2<0){
                    continue;
                }
                ctx.save();
                
                // Enhanced long note rendering
                if (typeof window !== 'undefined' && window.gameplayEnhancer) {
                    window.gameplayEnhancer.enhanceNoteRendering(
                        ctx, L, JUDGEMENT_LINE_Y-pos2, 150, pos2-pos+noteThick, Col, true
                    );
                } else {
                    // Fallback to original rendering
                    const longNoteGradient = ctx.createLinearGradient(L, JUDGEMENT_LINE_Y-pos2, L, JUDGEMENT_LINE_Y-pos+noteThick);
                    longNoteGradient.addColorStop(0, color);
                    longNoteGradient.addColorStop(0.5, color.replace('0.9', '0.7'));
                    longNoteGradient.addColorStop(1, color.replace('0.9', '0.9'));
                    ctx.fillStyle = longNoteGradient;
                    ctx.fillRect(L,JUDGEMENT_LINE_Y-pos2,150,pos2-pos+noteThick);
                    ctx.strokeRect(L+2,JUDGEMENT_LINE_Y-pos2+2,150-4,pos2-pos+noteThick-4);
                }
                ctx.restore();
            }else{
                if(pos<0){
                    continue;
                }
                ctx.save();
                
                // Enhanced single note rendering
                if (typeof window !== 'undefined' && window.gameplayEnhancer) {
                    window.gameplayEnhancer.enhanceNoteRendering(
                        ctx, L, JUDGEMENT_LINE_Y-pos, 150, noteThick, Col, false
                    );
                } else {
                    // Fallback to original rendering
                    const rippleGradient = ctx.createRadialGradient(L+75, JUDGEMENT_LINE_Y-pos+noteThick/2, 0, L+75, JUDGEMENT_LINE_Y-pos+noteThick/2, 75);
                    rippleGradient.addColorStop(0, color);
                    rippleGradient.addColorStop(0.7, color.replace('0.9', '0.6'));
                    rippleGradient.addColorStop(1, color.replace('0.9', '0.2'));
                    ctx.fillStyle = rippleGradient;
                    ctx.fillRect(L,JUDGEMENT_LINE_Y-pos,150,noteThick);
                    ctx.strokeStyle = ctx.strokeStyle;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(L+1,JUDGEMENT_LINE_Y-pos+1,148,noteThick-2);
                }
                ctx.restore();
            }
        }
    }
    ctx.restore();
}
function draw_Lasers() {
    ctx.save();
    for(let Col=0;Col<4;Col++){
        if(keyLaserTime[Col]===0)continue;
        let Width=0;
        if(keyLaserTime[Col]===-1)Width=150;else
            Width=(keyLaserTime[Col]-time)*150/LaserTime;
        if(Width<0){
            keyLaserTime[Col]=0;
            continue;
        }
        let L=Col*150;
        const waveGradient = ctx.createLinearGradient(L, JUDGEMENT_LINE_Y, L, CANVAS_HEIGHT);
        switch(Col) {
            case 0:
            case 3:
                waveGradient.addColorStop(0, "rgba(0, 180, 255, 0.8)");
                waveGradient.addColorStop(0.5, "rgba(0, 120, 200, 0.4)");
                waveGradient.addColorStop(1, "rgba(0, 60, 120, 0.1)");
                break;
            case 1:
            case 2:
                waveGradient.addColorStop(0, "rgba(0, 255, 170, 0.8)");
                waveGradient.addColorStop(0.5, "rgba(0, 200, 140, 0.4)");
                waveGradient.addColorStop(1, "rgba(0, 120, 80, 0.1)");
                break;
        }
        ctx.fillStyle = waveGradient;
        ctx.globalAlpha = Width/150;
        const rippleOffset = (time / 100) % 20;
        for(let i = 0; i < 3; i++) {
            const rippleY = JUDGEMENT_LINE_Y + rippleOffset + i * 60;
            if(rippleY < CANVAS_HEIGHT) {
                ctx.globalAlpha = (Width/150) * (0.3 - i * 0.1);
                ctx.fillRect(L+(150-Width)/2, rippleY, Width, 8);
            }
        }
        ctx.globalAlpha = Width/150;
        ctx.fillRect(L+(150-Width)/2, JUDGEMENT_LINE_Y, Width, CANVAS_HEIGHT-JUDGEMENT_LINE_Y);
    }
    ctx.restore();
}
function draw_Combo() {
    if(Combo===0)return;
    
    // Update enhanced combo display if available
    if (typeof window !== 'undefined' && window.gameplayEnhancer) {
        window.gameplayEnhancer.updateComboDisplay(Combo);
        return; // Skip canvas rendering since we're using HTML element
    }
    
    // Fallback to canvas rendering
    ctx.save();
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const comboGradient = ctx.createLinearGradient(250, 100, 350, 180);
    comboGradient.addColorStop(0, "#00CCFF");
    comboGradient.addColorStop(0.5, "#00FFAA");
    comboGradient.addColorStop(1, "#80E0FF");
    ctx.fillStyle = comboGradient;
    ctx.strokeStyle = "rgba(0, 60, 120, 0.8)";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#00CCFF";
    ctx.shadowBlur = 20;
    ctx.strokeText(Combo, 300, 180);
    ctx.fillText(Combo, 300, 180);
    ctx.restore();
}

function draw_Score() {
    ctx.save();
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "end";
    ctx.textBaseline = "bottom";
    const scoreGradient = ctx.createLinearGradient(500, 30, 580, 50);
    scoreGradient.addColorStop(0, "#80E0FF");
    scoreGradient.addColorStop(1, "#00CCFF");
    ctx.fillStyle = scoreGradient;
    ctx.strokeStyle = "rgba(0, 60, 120, 0.6)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00CCFF";
    ctx.shadowBlur = 10;
    ctx.strokeText(Score, 580, 50);
    ctx.fillText(Score, 580, 50);
    ctx.restore();
}

function draw_ACC() {
    ctx.save();
    ctx.font = "bold 25px Arial";
    ctx.textAlign = "end";
    ctx.textBaseline = "bottom";
    if (EndScore === 0) return;
    let Accuracy = Math.round(Score/EndScore*10000)/100;
    let accColor = "#80E0FF";
    if (Accuracy >= 95) accColor = "#00FFAA";
    else if (Accuracy >= 90) accColor = "#00CCFF";
    else if (Accuracy >= 80) accColor = "#0080FF";
    ctx.fillStyle = accColor;
    ctx.strokeStyle = "rgba(0, 40, 80, 0.6)";
    ctx.lineWidth = 2;
    ctx.shadowColor = accColor;
    ctx.shadowBlur = Accuracy >= 95 ? 15 : 8;
    ctx.strokeText(Accuracy+"%", 580, 80);
    ctx.fillText(Accuracy+"%", 580, 80);
    ctx.restore();
}
function draw_Judge() {
    if(JudgeNew==0)return;
    if(JudgeNew-time<0){
        JudgeNew=0;
        return;
    }
    
    // Use enhanced chaotic judgement display if available
    if (typeof window !== 'undefined' && window.gameplayEnhancer) {
        // The chaotic judgement is already triggered in HitEvent/MissEvent
        // So we don't need to do anything here anymore
        return;
    }
    
    // Fallback to original display if enhancer is not available
    ctx.save();
    ctx.font = "bold 90px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.lineWidth=4;
    switch(JudgeType){
        case 0: ctx.fillStyle = "#00FFFF"; ctx.strokeStyle = "#007F7F"; ctx.fillText("PERFECT", 300, 280); ctx.strokeText("PERFECT", 300, 280); break;
        case 1: ctx.fillStyle = "#FFFF00"; ctx.strokeStyle = "#7F7F00"; ctx.fillText("PERFECT", 300, 280); ctx.strokeText("PERFECT", 300, 280); break;
        case 2: ctx.fillStyle = "#00FF00"; ctx.strokeStyle = "#007F00"; ctx.fillText("GREAT", 300, 280); ctx.strokeText("GREAT", 300, 280); break;
        case 3: ctx.fillStyle = "#0000FF"; ctx.strokeStyle = "#00007F"; ctx.fillText("GOOD", 300, 280); ctx.strokeText("GOOD", 300, 280); break;
        case 4: ctx.fillStyle = "#FF0000"; ctx.strokeStyle = "#7F0000"; ctx.fillText("BAD", 300, 280); ctx.strokeText("BAD", 300, 280); break;
        case 5: ctx.fillStyle = "#FF0000"; ctx.strokeStyle = "#7F0000"; ctx.fillText("MISS", 300, 280); ctx.strokeText("MISS", 300, 280); break;
        case 6: ctx.fillStyle = "#FF0000"; ctx.strokeStyle = "#7F0000"; ctx.fillText("MISS", 300, 280); ctx.strokeText("MISS", 300, 280); break;
    }
    ctx.restore();
}
function draw_FS() {
    // Display the indicator if a judgement was just made and it wasn't a perfect hit.
    // JudgeType 0 and 1 are for PERFECT, so we only show this for GREAT or lower.
    if (JudgeNew > time && JudgeType > 1) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "18px 'Exo 2', sans-serif";
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 5;

        // FSType is true for early hits, false for late hits.
        if (FSType) { // Early
            ctx.fillStyle = "#80E0FF"; // A cool blue for "early"
            ctx.fillText("EARLY", 300, 560);
        } else { // Late
            ctx.fillStyle = "#FFB86C"; // A warm orange for "late"
            ctx.fillText("LATE", 300, 560);
        }
        ctx.restore();
    }
}
function draw_Judgement_Line() {
    ctx.save();
    const waveOffset = (time / 200) % (Math.PI * 2);
    const waveAmplitude = 3;
    ctx.beginPath();
    ctx.moveTo(0, JUDGEMENT_LINE_Y);
    for(let x = 0; x <= 600; x += 2) {
        const waveY = JUDGEMENT_LINE_Y + Math.sin((x * 0.03) + waveOffset) * waveAmplitude;
        ctx.lineTo(x, waveY);
    }
    const waveLineGradient = ctx.createLinearGradient(0, 0, 600, 0);
    waveLineGradient.addColorStop(0, "#00CCFF");
    waveLineGradient.addColorStop(0.5, "#00FFAA");
    waveLineGradient.addColorStop(1, "#00CCFF");
    ctx.strokeStyle = waveLineGradient;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.shadowColor = "#00CCFF";
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    for(let i = 1; i < 4; i++) {
        const x = i * 150;
        ctx.beginPath();
        ctx.moveTo(x, JUDGEMENT_LINE_Y - 15);
        for(let y = JUDGEMENT_LINE_Y - 15; y <= JUDGEMENT_LINE_Y + 15; y += 2) {
            const dividerX = x + Math.sin((y * 0.2) + waveOffset) * 2;
            ctx.lineTo(dividerX, y);
        }
        ctx.strokeStyle = "rgba(0, 180, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.restore();
}

function drawWaveBackground() {
    if (!ctx) return;
    try {
        ctx.save();
        const waveOffset = (time / 1000) * 50;
        const waveHeight = 30;
        const waveFrequency = 0.02;
        for (let layer = 0; layer < 3; layer++) {
            ctx.globalAlpha = 0.1 - layer * 0.02;
            ctx.fillStyle = layer === 0 ? '#0080FF' : layer === 1 ? '#00FFAA' : '#80D0FF';
            ctx.beginPath();
            ctx.moveTo(0, CANVAS_HEIGHT);
            for (let x = 0; x <= 600; x += 2) {
                const y = CANVAS_HEIGHT - 50 - layer * 20 + 
                         Math.sin((x + waveOffset) * waveFrequency + layer * Math.PI / 3) * waveHeight;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(600, CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    } catch (error) {
        console.warn('Error in drawWaveBackground:', error);
    }
}

function getBaseMpBFromChart() {
    if (BPMs && BPMs[0] && BPMs[0][1] > 0) {
        return BPMs[0][1];
    }
    return null;
}

function draw() {
    if (!ctx || !c) {
        console.warn('Canvas or context not available in draw()');
        return;
    }
    if (!content) {
        console.warn('Chart content not available in draw()');
        return;
    }
    ctx.clearRect(0, 0, c.width, c.height);
    drawWaveBackground();
    draw_Progress_Bar();
    draw_Bar_Line();
    draw_Notes();
    if(typeof waveManager !== 'undefined' && waveManager.isReady()) {
        waveManager.update(time, 16);
        waveManager.render(ctx);
    }
    draw_Judgement_Line();
    draw_Lasers();
    // Update and render splash animations
    if(typeof splashManager !== 'undefined' && splashManager.isReady()) {
        splashManager.update();
        splashManager.render(ctx);
    }
    draw_Combo();
    draw_Score();
    draw_ACC();
    draw_Judge();
    draw_FS();
}

function resetGameState() {
    console.log('Resetting game state...');
    preTime = 2000;
    time = 0;
    p = 0;
    gameStarted = false;
    Score = 0;
    Combo = 0;
    MaxCombo = 0;
    FastCount = 0;
    SlowCount = 0;
    Result.fill(0);
    keyAsync.fill(false);
    keyLaserTime.fill(0);
    LineHold.fill(-1);
    TouchHold.fill(-1);
    JudgeNew = 0;
    JudgeType = 0;
    FSType = false;
    
    resetKeyBindingDisplay();
    
    if (audio1) {
        audio1.pause();
        audio1.currentTime = 0;
    }
    for (let i = 0; i < 4; i++) {
        if (holdSoundIntervals[i] !== -1) {
            clearInterval(holdSoundIntervals[i]);
            holdSoundIntervals[i] = -1;
        }
    }
    if (typeof waveManager !== 'undefined') {
        waveManager.clearWaves();
    }
    if (typeof splashManager !== 'undefined') {
        splashManager.clearSplashes();
    }
    console.log('Game state reset complete');
}

// Key binding display variables
let laneKeyElements = [];
let keyBindingDisplayTime = 1000; // Show for 1 second  
let keyBindingFadeTime = 1000; // Fade out over 0.8 seconds
let keyBindingShown = false;

const keyCodeToChar = {
    68: 'D',
    70: 'F', 
    74: 'J',
    75: 'K'
};

function initializeKeyBindingDisplay() {
    laneKeyElements = [];
    for (let i = 0; i < 4; i++) {
        const element = document.getElementById(`lane-key-${i}`);
        if (element) {
            laneKeyElements.push(element);
        } else {
            console.warn(`Lane key element ${i} not found`);
        }
    }
    
    // Update key displays based on current bindings
    updateKeyBindingDisplay();
}

function updateKeyBindingDisplay() {
    for (let i = 0; i < 4; i++) {
        const keyElement = laneKeyElements[i];
        if (keyElement && bindKey[i]) {
            const keyChar = keyCodeToChar[bindKey[i]] || String.fromCharCode(bindKey[i]);
            keyElement.textContent = keyChar;
        }
    }
}

function showKeyBindingDisplay() {
    if (keyBindingShown || laneKeyElements.length === 0) return;
    
    console.log('Showing lane key displays');
    keyBindingShown = true;
    
    // Show all lane key displays
    laneKeyElements.forEach((element, index) => {
        if (element) {
            element.style.display = 'flex';
            element.classList.remove('fade-out');
            
            // Add a slight stagger to the appearance
            setTimeout(() => {
                element.style.opacity = '1';
            }, index * 50);
        }
    });
    
    setTimeout(() => {
        hideLaneKeyDisplays();
    }, keyBindingDisplayTime);
}

function hideLaneKeyDisplays() {
    laneKeyElements.forEach((element) => {
        if (element) {
            element.classList.add('fade-out');
        }
    });
    
    setTimeout(() => {
        laneKeyElements.forEach((element) => {
            if (element) {
                element.style.display = 'none';
            }
        });
    }, keyBindingFadeTime);
}

function resetKeyBindingDisplay() {
    keyBindingShown = false;
    laneKeyElements.forEach((element) => {
        if (element) {
            element.classList.remove('fade-out');
            element.style.display = 'none';
            element.style.opacity = '1';
        }
    });
}

function draw_Progress_Bar() {
    if (!audio1 || audio1.duration === 0 || isNaN(audio1.duration)) return;
    
    ctx.save();
    
    // Progress bar dimensions and position
    const barX = 50;
    const barY = 20;
    const barWidth = 500;
    const barHeight = 12;
    const borderRadius = 6;
    
    // Calculate progress percentage
    const currentTime = audio1.currentTime || 0;
    const duration = audio1.duration || 1;
    const progress = Math.min(currentTime / duration, 1);
    
    // Create wave effect for the progress bar
    const waveOffset = (time / 300) % (Math.PI * 2);
    const waveAmplitude = 2;
    
    // Helper function for rounded rectangle (fallback for older browsers)
    function drawRoundedRect(x, y, width, height, radius) {
        if (ctx.roundRect) {
            ctx.roundRect(x, y, width, height, radius);
        } else {
            // Fallback for older browsers
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        }
    }
    
    // Draw background (empty part of progress bar)
    ctx.beginPath();
    drawRoundedRect(barX, barY, barWidth, barHeight, borderRadius);
    const bgGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    bgGradient.addColorStop(0, 'rgba(0, 60, 120, 0.3)');
    bgGradient.addColorStop(0.5, 'rgba(0, 80, 140, 0.4)');
    bgGradient.addColorStop(1, 'rgba(0, 60, 120, 0.3)');
    ctx.fillStyle = bgGradient;
    ctx.fill();
    
    // Draw border with glow effect
    ctx.shadowColor = '#00CCFF';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw filled progress with wave effect
    if (progress > 0) {
        const progressWidth = barWidth * progress;
        
        // Create clipping path for the progress
        ctx.save();
        ctx.beginPath();
        drawRoundedRect(barX, barY, progressWidth, barHeight, borderRadius);
        ctx.clip();
        
        // Draw animated wave fill
        ctx.beginPath();
        ctx.moveTo(barX, barY + barHeight);
        for (let x = 0; x <= progressWidth; x += 2) {
            const waveY = barY + barHeight/2 + Math.sin((x * 0.05) + waveOffset) * waveAmplitude;
            ctx.lineTo(barX + x, waveY);
        }
        ctx.lineTo(barX + progressWidth, barY);
        ctx.lineTo(barX, barY);
        ctx.closePath();
        
        // Create progress gradient
        const progressGradient = ctx.createLinearGradient(barX, barY, barX + progressWidth, barY);
        progressGradient.addColorStop(0, '#00CCFF');
        progressGradient.addColorStop(0.3, '#00FFAA');
        progressGradient.addColorStop(0.7, '#80E0FF');
        progressGradient.addColorStop(1, '#00CCFF');
        ctx.fillStyle = progressGradient;
        ctx.fill();
        
        // Add shimmer effect
        const shimmerGradient = ctx.createLinearGradient(barX, barY, barX + progressWidth, barY + barHeight);
        shimmerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        shimmerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        shimmerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        ctx.fillStyle = shimmerGradient;
        ctx.fillRect(barX, barY, progressWidth, barHeight * 0.4);
        
        ctx.restore();
        
        // Add glow effect to the progress
        ctx.shadowColor = '#00FFAA';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        drawRoundedRect(barX, barY, progressWidth, barHeight, borderRadius);
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    // Draw time indicators
    ctx.font = '12px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#80E0FF';
    ctx.shadowColor = '#00CCFF';
    ctx.shadowBlur = 5;
    
    // Current time
    const currentMinutes = Math.floor(currentTime / 60);
    const currentSeconds = Math.floor(currentTime % 60);
    const currentTimeText = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
    ctx.fillText(currentTimeText, barX, barY + barHeight + 18);
    
    // Total duration
    ctx.textAlign = 'right';
    const totalMinutes = Math.floor(duration / 60);
    const totalSeconds = Math.floor(duration % 60);
    const durationText = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
    ctx.fillText(durationText, barX + barWidth, barY + barHeight + 18);
    
    ctx.restore();
}