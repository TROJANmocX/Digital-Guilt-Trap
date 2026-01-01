/**
 * Generative Audio Engine
 * Uses Web Audio API to create an eerie, generative drone.
 */

let audioCtx;
let oscillator;
let gainNode;
let filterNode;
let isInitialized = false;

export const AudioEngine = {
    init() {
        if (isInitialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            // Create implementation
            // 1. Oscillator (Low Sine/Triangle for drone)
            oscillator = audioCtx.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = 55; // A1 - Low drone

            // 2. Filter (Lowpass to make it dark)
            filterNode = audioCtx.createBiquadFilter();
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 200; // Start muffled

            // 3. Gain (Volume)
            gainNode = audioCtx.createGain();
            gainNode.gain.value = 0; // Start silent, fade in

            // Connect
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            isInitialized = true;

            // Fade in to background level
            gainNode.gain.setTargetAtTime(0.05, audioCtx.currentTime, 2);

        } catch (e) {
            console.warn("Audio init failed", e);
        }
    },

    /**
     * Modulates sound based on intensity (0.0 to 1.0)
     * intensity comes from mouse velocity
     */
    setIntensity(intensity) {
        if (!audioCtx || !isInitialized) return;

        const now = audioCtx.currentTime;

        // Map intensity to frequency (55Hz -> 110Hz nice harmonic drift)
        const targetFreq = 55 + (intensity * 55);
        oscillator.frequency.setTargetAtTime(targetFreq, now, 0.5);

        // Map intensity to filter open (200Hz -> 800Hz)
        const targetFilter = 200 + (intensity * 1000);
        filterNode.frequency.setTargetAtTime(targetFilter, now, 0.5);

        // Slight volume bump on movement
        const targetGain = 0.05 + (intensity * 0.1);
        gainNode.gain.setTargetAtTime(targetGain, now, 0.1);
    },

    resume() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    },

    noise() {
        if (!audioCtx || !isInitialized) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = 50; // Low rumble

        // Quick harsh envelope
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    },

    /**
     * Synthesized breathy sigh
     */
    sigh() {
        if (!audioCtx || !isInitialized) return;

        const t = audioCtx.currentTime;

        // 1. Tonal Component (Voice)
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.6); // Pitch drop

        oscGain.gain.setValueAtTime(0, t);
        oscGain.gain.linearRampToValueAtTime(0.1, t + 0.1);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.6);

        // 2. Breathy Component (Pink Noise-ish simulation)
        const breath = audioCtx.createOscillator();
        const breathGain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        breath.type = 'triangle';
        breath.frequency.value = 50; // Textural

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);

        breathGain.gain.setValueAtTime(0, t);
        breathGain.gain.linearRampToValueAtTime(0.05, t + 0.1);
        breathGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        breath.connect(filter);
        filter.connect(breathGain);
        breathGain.connect(audioCtx.destination);

        breath.start(t);
        breath.stop(t + 0.6);
    },

    /**
     * Audio-Reactive Respiratory System
     */
    breathNode: null,
    breathGain: null,
    breathFilter: null,
    breathState: null,

    initBreath() {
        if (!audioCtx || this.breathNode) return;

        // Pink Noise Buffer Generation
        const bufferSize = 2 * audioCtx.sampleRate;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        this.breathNode = audioCtx.createBufferSource();
        this.breathNode.buffer = buffer;
        this.breathNode.loop = true;

        this.breathFilter = audioCtx.createBiquadFilter();
        this.breathFilter.type = 'lowpass';
        this.breathFilter.frequency.value = 400;

        this.breathGain = audioCtx.createGain();
        this.breathGain.gain.value = 0.05;

        this.breathNode.connect(this.breathFilter);
        this.breathFilter.connect(this.breathGain);
        this.breathGain.connect(audioCtx.destination);

        this.breathNode.start();

        this.breathState = {
            rate: 4,
            depth: 0.1
        };

        this.breathLoop();
    },

    breathLoop() {
        if (!this.breathNode) return;
        const t = audioCtx.currentTime;
        const rate = this.breathState.rate;

        // Inhale
        this.breathGain.gain.cancelScheduledValues(t);
        this.breathGain.gain.linearRampToValueAtTime(this.breathState.depth, t + (rate / 2));
        this.breathGain.gain.linearRampToValueAtTime(0.02, t + rate);

        // Filter
        this.breathFilter.frequency.cancelScheduledValues(t);
        this.breathFilter.frequency.linearRampToValueAtTime(800 + (1000 * (1 - (rate / 4))), t + (rate / 2));
        this.breathFilter.frequency.linearRampToValueAtTime(400, t + rate);

        setTimeout(() => this.breathLoop(), rate * 1000);
    },

    simulateBreath(velocity) {
        if (!this.breathNode) this.initBreath();
        const targetRate = Math.max(0.5, 4 - (velocity * 0.1));
        const targetDepth = Math.min(0.5, 0.05 + (velocity * 0.01));
        this.breathState.rate = this.breathState.rate * 0.9 + targetRate * 0.1;
        this.breathState.depth = targetDepth;
    }
};
