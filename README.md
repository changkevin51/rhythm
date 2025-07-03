# 🌊 Tidal Beats

[Banner image showing ocean waves with musical notes flowing through them]

A beautiful ocean-themed rhythm game that brings the flow of music to life through stunning wave animations. Dive into an immersive musical experience where every beat creates ripples across the digital ocean.

## ✨ What is Tidal Beats?

Tidal Beats is a 4-key rhythm game inspired by the mesmerizing patterns of ocean waves. Each note you hit creates visual waves that flow across the screen, making your musical performance part of a living, breathing oceanic experience. Whether you're a rhythm game veteran or just starting out, Tidal Beats offers an accessible yet challenging way to ride the musical waves.

[Screenshot of the main game interface with wave animations]

## 🎮 Key Features

- **Wave-Based Visual System**: Every note creates dynamic wave animations that respond to your gameplay
- **4-Key Gameplay**: Classic VSRG (Vertical Scrolling Rhythm Game) mechanics with D-F-J-K controls
- **Multiple Song Support**: Includes curated tracks like Silhouette (KANA-BOON), Quiet Water (Toby Fox), and more
- **Custom Chart Loading**: Import your own .osz files and custom beatmaps
- **Audio Calibration**: Built-in metronome-based calibration system for perfect timing
- **Comprehensive Settings**: Adjust scroll speed, visual effects, audio levels, and more
- **Oceanic Theme**: Immersive underwater aesthetics with flowing animations
- **Cross-Platform**: Runs in any modern web browser

[GIF showing wave animations during gameplay]

## 🌊 Songs & Content

The game comes with several pre-loaded songs:
- **Silhouette** by KANA-BOON (Multiple difficulties)
- **Quiet Water** by Toby Fox (Multiple difficulties) 
- **Bad Apple** by Masayoshi Minoshima
- **NANO DEATH** by LeaF
- Plus support for custom .osz file imports

## 🚀 Getting Started

### Quick Start
1. Clone or download this repository
2. Start a local web server in the project directory
3. Open `index.html` in your browser
4. Calibrate your audio offset (recommended)
5. Select a song and start playing!

### Using the Built-in Server
The project includes a Python server for easy local hosting:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

### Controls
- **D, F, J, K** - Hit the notes as they reach the judgment line
- **ESC** - Pause/resume game
- **Settings** - Customize your experience before playing

## ⚙️ Features Deep Dive

### Audio Calibration
Tidal Beats includes a sophisticated audio calibration system that helps sync your inputs with the music perfectly. The built-in metronome guides you through measuring your audio latency for optimal gameplay.

### Wave Animation System
The signature feature of Tidal Beats is its dynamic wave generation. Each note creates ripples that flow across the screen, with intensity and patterns matching your performance. Perfect hits create more dramatic wave effects!

### Customization Options
- Scroll speed adjustment
- Note scaling
- Background dimming
- Volume controls for music and effects
- Key binding customization
- Visual effect toggles

[Screenshot of the settings panel]

## 🎵 Adding Your Own Songs

Tidal Beats supports .osz files (osu!mania format). Simply:

1. Click "Custom Chart" on the main menu
2. Upload your .osz file or separate chart/audio files
3. The game will validate and load your content
4. Start playing your custom songs!

**Note**: Only 4-key (4K) osu!mania charts are supported.

## 🛠️ Technical Details

Built with:
- **Vanilla JavaScript** - No frameworks, pure performance
- **HTML5 Canvas** - Smooth 60fps rendering
- **Web Audio API** - Precise audio timing and effects
- **Modern CSS** - Beautiful oceanic styling with animations

### Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

**Requirements**: Modern browser with Web Audio API support

## 🌊 The Ocean Theme

Every aspect of Tidal Beats is designed around the ocean:
- Wave particles that flow with the music
- Aquatic color palettes (blues, teals, seafoam)
- Dolphin mascot animations
- Ripple effects for note hits
- Flowing gradients that mimic water currents

[Animated GIF of the dolphin mascot and particle effects]

## 🎯 Performance & Optimization

Tidal Beats is optimized for smooth gameplay:
- Efficient canvas rendering with hardware acceleration
- Smart particle system management
- Responsive design for different screen sizes
- Background process optimization for consistent framerate

## 🤝 Contributing

This is a personal rhythm game project, but feedback and suggestions are always welcome! If you create cool custom charts or find ways to improve the wave animations, feel free to share.

## 📄 License

This project is for educational and personal use. Song files and charts belong to their respective creators and artists.

---

*Ride the rhythm, flow with the waves* 🌊🎵

**Created with ❤️ for music and ocean lovers**