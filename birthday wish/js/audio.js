/**
 * Web Audio API procedural synthesizer for Shivani's Birthday Page
 * Generates soothing music-box background melody & high quality sound effects
 * Zero external audio files required — 100% reliable and instantaneous!
 */

class BirthdayAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isPlayingBGM = false;
        this.bgmTimer = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.currentNoteIndex = 0;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
    }

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Synthesize a chime / music-box note
     */
    playMusicBoxNote(freq, time, duration = 1.2, gainNode = this.bgmGain) {
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        // Music box timbre: sine with subtle harmonic
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        // Overtone oscillator for metallic bell sheen
        const overtone = this.ctx.createOscillator();
        const overtoneGain = this.ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2.01, time);

        // Envelopes
        noteGain.gain.setValueAtTime(0.001, time);
        noteGain.gain.exponentialRampToValueAtTime(0.4, time + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        overtoneGain.gain.setValueAtTime(0.001, time);
        overtoneGain.gain.exponentialRampToValueAtTime(0.12, time + 0.015);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + (duration * 0.5));

        osc.connect(noteGain);
        overtone.connect(overtoneGain);
        noteGain.connect(gainNode);
        overtoneGain.connect(gainNode);

        osc.start(time);
        overtone.start(time);
        osc.stop(time + duration);
        overtone.stop(time + duration);
    }

    /**
     * Happy Birthday melody notes (Frequencies in Hz)
     * Key of G Major / C Major adapted for high music box sweetness
     */
    getHappyBirthdaySequence() {
        // C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00, B5 = 987.77, C6 = 1046.50
        const notes = [
            { f: 523.25, d: 0.35, pause: 0.4 },  // Hap-
            { f: 523.25, d: 0.25, pause: 0.3 },  // py
            { f: 587.33, d: 0.6,  pause: 0.7 },  // birth-
            { f: 523.25, d: 0.6,  pause: 0.7 },  // day
            { f: 698.46, d: 0.6,  pause: 0.7 },  // to
            { f: 659.25, d: 1.2,  pause: 1.3 },  // you~

            { f: 523.25, d: 0.35, pause: 0.4 },  // Hap-
            { f: 523.25, d: 0.25, pause: 0.3 },  // py
            { f: 587.33, d: 0.6,  pause: 0.7 },  // birth-
            { f: 523.25, d: 0.6,  pause: 0.7 },  // day
            { f: 783.99, d: 0.6,  pause: 0.7 },  // to
            { f: 698.46, d: 1.2,  pause: 1.3 },  // you~

            { f: 523.25, d: 0.35, pause: 0.4 },  // Hap-
            { f: 523.25, d: 0.25, pause: 0.3 },  // py
            { f: 1046.50, d: 0.6, pause: 0.7 },  // birth-
            { f: 880.00, d: 0.6,  pause: 0.7 },  // day
            { f: 698.46, d: 0.6,  pause: 0.7 },  // dear
            { f: 659.25, d: 0.6,  pause: 0.7 },  // Shi-
            { f: 587.33, d: 1.2,  pause: 1.3 },  // va-ni~

            { f: 932.33, d: 0.35, pause: 0.4 },  // Hap-
            { f: 932.33, d: 0.25, pause: 0.3 },  // py
            { f: 880.00, d: 0.6,  pause: 0.7 },  // birth-
            { f: 698.46, d: 0.6,  pause: 0.7 },  // day
            { f: 783.99, d: 0.6,  pause: 0.7 },  // to
            { f: 698.46, d: 1.5,  pause: 2.0 }   // you~~~
        ];
        return notes;
    }

    startBGM() {
        this.ensureContext();
        if (this.isPlayingBGM) return;
        this.isPlayingBGM = true;
        this.scheduleNextBGMNote();
    }

    scheduleNextBGMNote() {
        if (!this.isPlayingBGM) return;
        const notes = this.getHappyBirthdaySequence();
        const note = notes[this.currentNoteIndex];

        const now = this.ctx.currentTime;
        this.playMusicBoxNote(note.f, now, note.d * 1.5, this.bgmGain);

        // Also add warm root harmony on downbeats
        if (this.currentNoteIndex === 0 || this.currentNoteIndex === 6 || this.currentNoteIndex === 12 || this.currentNoteIndex === 19) {
            this.playMusicBoxNote(note.f * 0.5, now, 2.0, this.bgmGain);
        }

        this.currentNoteIndex = (this.currentNoteIndex + 1) % notes.length;
        this.bgmTimer = setTimeout(() => {
            this.scheduleNextBGMNote();
        }, note.pause * 1000);
    }

    stopBGM() {
        this.isPlayingBGM = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    toggleBGM() {
        this.ensureContext();
        if (this.isPlayingBGM) {
            this.stopBGM();
            return false;
        } else {
            this.startBGM();
            return true;
        }
    }

    setMute(muted) {
        this.isMuted = muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
        }
    }

    // --- Sound Effects ---

    /**
     * Candle blowout sound: Soft wind puff followed by magical chime
     */
    sfxCandleBlow() {
        this.ensureContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;

        // White noise puff
        const bufferSize = this.ctx.sampleRate * 0.6;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noise.start(now);

        // Immediate celebration fanfare
        setTimeout(() => {
            this.sfxCheerFanfare();
        }, 300);
    }

    /**
     * Balloon pop sound: crisp snappy pop with cute pitch fall
     */
    sfxBalloonPop() {
        this.ensureContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.09);

        // Accompanying tiny sparkle
        setTimeout(() => {
            this.sfxSparkle(784);
        }, 40);
    }

    /**
     * Gift box open: Ascending magical arpeggio
     */
    sfxGiftOpen() {
        this.ensureContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C - E - G - C - E - G
        chord.forEach((freq, idx) => {
            this.playMusicBoxNote(freq, now + (idx * 0.08), 1.0, this.sfxGain);
        });
    }

    /**
     * Sky lantern release: warm rising ambient harmonic
     */
    sfxLanternRelease() {
        this.ensureContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(261.63, now); // C4
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 1.2); // C5

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 1.5);

        // Chimes along the way
        setTimeout(() => this.sfxSparkle(880), 300);
        setTimeout(() => this.sfxSparkle(1046), 600);
    }

    /**
     * Sparkle chime
     */
    sfxSparkle(baseFreq = 880) {
        this.ensureContext();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        this.playMusicBoxNote(baseFreq, now, 0.8, this.sfxGain);
        this.playMusicBoxNote(baseFreq * 1.5, now + 0.06, 0.8, this.sfxGain);
    }

    /**
     * Joyous celebration fanfare chords
     */
    sfxCheerFanfare() {
        this.ensureContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        // G Major -> C Major triumphant resolution
        const chord1 = [392, 493.88, 587.33, 783.99];
        const chord2 = [523.25, 659.25, 783.99, 1046.50];

        chord1.forEach(f => this.playMusicBoxNote(f, now, 0.7, this.sfxGain));
        chord2.forEach(f => this.playMusicBoxNote(f, now + 0.45, 1.8, this.sfxGain));
    }
}

// Global singleton instance
window.soundEngine = new BirthdayAudioEngine();
