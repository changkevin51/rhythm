"use strict";

class SongManager {
    constructor() {
        this.songs = {};
        this.currentSong = null;
        this.loadSongsConfig();
    }

    loadSongsConfig() {
        this.songs = {
            "aleph-0": { id: "aleph-0", title: "Aleph-0", artist: "LeaF", difficulty: "Cardinality", difficultyColor: "#F44336", audioFile: "Songs/Aleph-0/audio.mp3", chartFile: "Songs/Aleph-0/LeaF - Aleph-0 (jakads) [Cardinality].txt", background: "linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 50%, #45B7D1 100%)", description: "An intense mathematical journey through infinite sets" },
            "elysium": { id: "elysium", title: "Elysium", artist: "Rob Gasser", difficulty: "Heavenly Paradise", difficultyColor: "#FF9800", audioFile: "Songs/Elysium/Rob Gasser - Elysium Original Mix FREE DOWNLOAD.mp3", chartFile: "Songs/Elysium/Rob Gasser - Elysium (LuigiClaren) [Heavenly Paradise].txt", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", description: "Journey through paradise with ethereal melodies" },
            "fastest-crash": { id: "fastest-crash", title: "Fastest Crash", artist: "Camellia", difficulty: "Paroxysm", difficultyColor: "#E91E63", audioFile: "Songs/Fastest Crash/05 Fastest Crash.mp3", chartFile: "Songs/Fastest Crash/Camellia - Fastest Crash (Shoegazer) [Paroxysm].txt", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", description: "Ultra-fast electronic madness that will test your limits" },
            "nano-death": { id: "nano-death", title: "NANO DEATH!!!!!", artist: "LeaF", difficulty: "Expert", difficultyColor: "#9C27B0", audioFile: "Songs/NANO DEATH/audio.mp3", chartFile: "Songs/NANO DEATH/LeaF - NANO DEATH!!!!! (nowsmart) [Expert].txt", background: "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)", description: "Microscopic destruction in electronic form" },
            "zenith": { id: "zenith", title: "Blue Zenith", artist: "xi", difficulty: "FOUR DIMENSIONS", difficultyColor: "#F44336", audioFile: "Songs/zenith/zenith.mp3", chartFile: "Songs/zenith/xi - Blue Zenith (Jepetski) [FOUR DIMENSIONS].txt", background: "linear-gradient(135deg, #209cff 0%, #68e0cf 100%)", description: "Ascend to the peak of rhythm gaming" },
            "zenith-another": { id: "zenith-another", title: "Blue Zenith", artist: "xi", difficulty: "Frenzy Another", difficultyColor: "#000000", audioFile: "Songs/zenith/zenith.mp3", chartFile: "Songs/zenith/xi - Blue Zenith (Jepetski) [Frenzy Another].txt", background: "linear-gradient(135deg, #000428 0%, #004e92 100%)", description: "The ultimate challenge for rhythm masters" }
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
    }

    async loadSongAndSetup(songId) {
        const song = this.getSong(songId);
        if (!song) {
            console.error(`Song with ID "${songId}" not found`);
            if (typeof showGameSetup === 'function') showGameSetup(null, null);
            return;
        }

        this.currentSong = song;
        this.updateUI(song);

        try {
            const chartResponse = await fetch(song.chartFile);
            if (!chartResponse.ok) throw new Error(`Failed to load chart: ${chartResponse.status}`);
            const chartData = await chartResponse.text();
            
            const audioPlayer = document.getElementById('audioPlayer');
            audioPlayer.src = song.audioFile;

            await new Promise((resolve, reject) => {
                const canPlayHandler = () => {
                    audioPlayer.removeEventListener('error', errorHandler);
                    resolve();
                };
                const errorHandler = () => {
                    audioPlayer.removeEventListener('canplaythrough', canPlayHandler);
                    reject(new Error('Audio file failed to load.'));
                };
                audioPlayer.addEventListener('canplaythrough', canPlayHandler, { once: true });
                audioPlayer.addEventListener('error', errorHandler, { once: true });
                audioPlayer.load();
            });

            console.log("Song files loaded. Handing off to game setup.");
            if (typeof showGameSetup === 'function') {
                showGameSetup(chartData, song.title);
            }

        } catch (error) {
            console.error('Error loading song files:', error);
            alert(`Error loading song: ${error.message}`);
        }
    }
}