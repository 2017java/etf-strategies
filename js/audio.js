class AudioManager {
    constructor() {
        this.audioContext = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.bgmOscillator = null;
        this.bgmPlaying = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.bgmGain = this.audioContext.createGain();
            this.bgmGain.gain.value = 0.15;
            this.bgmGain.connect(this.audioContext.destination);
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.3;
            this.sfxGain.connect(this.audioContext.destination);
            
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported');
        }
    }

    startBGM() {
        if (!this.initialized || this.bgmPlaying) return;
        
        this.bgmPlaying = true;
        this.playBGMLoop();
    }

    playBGMLoop() {
        if (!this.bgmPlaying || !this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 698.46, 659.25, 587.33];
        const noteDuration = 0.3;
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now + i * noteDuration);
            gain.gain.linearRampToValueAtTime(0.3, now + i * noteDuration + 0.05);
            gain.gain.linearRampToValueAtTime(0, now + (i + 1) * noteDuration);
            
            osc.connect(gain);
            gain.connect(this.bgmGain);
            
            osc.start(now + i * noteDuration);
            osc.stop(now + (i + 1) * noteDuration);
        });
        
        const totalDuration = notes.length * noteDuration * 1000;
        setTimeout(() => this.playBGMLoop(), totalDuration);
    }

    stopBGM() {
        this.bgmPlaying = false;
    }

    playDiamondSound() {
        if (!this.initialized) return;
        
        const now = this.audioContext.currentTime;
        
        const frequencies = [523.25, 659.25, 783.99, 1046.50];
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.5, now + i * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.3);
        });
    }

    playEatSound() {
        if (!this.initialized) return;
        
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playGameOverSound() {
        if (!this.initialized) return;
        
        const now = this.audioContext.currentTime;
        const frequencies = [392, 349.23, 329.63, 293.66, 261.63];
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now + i * 0.2);
            gain.gain.linearRampToValueAtTime(0.3, now + i * 0.2 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.4);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(now + i * 0.2);
            osc.stop(now + i * 0.2 + 0.4);
        });
    }

    playLevelUpSound() {
        if (!this.initialized) return;
        
        const now = this.audioContext.currentTime;
        const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.4, now + i * 0.1 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    setBGMVolume(value) {
        if (this.bgmGain) {
            this.bgmGain.gain.value = value;
        }
    }

    setSFXVolume(value) {
        if (this.sfxGain) {
            this.sfxGain.gain.value = value;
        }
    }
}

const audioManager = new AudioManager();
