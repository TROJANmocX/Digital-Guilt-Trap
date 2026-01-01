
import { AudioEngine } from './audio.js';

/**
 * Heat Map Visualization
 * Tracks cursor movement and leaves fading "heat" marks.
 */
export const HeatMap = {
    canvas: null,
    ctx: null,
    points: [],

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'heat-canvas';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.loop();
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    addPoint(x, y) {
        // Add a "bruise" point
        this.points.push({
            x, y,
            age: 0,
            life: 200 // Frames to live
        });
    },

    loop() {
        if (!this.ctx) return;

        // Fade out entire canvas slightly for trails
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.globalCompositeOperation = 'source-over';

        // Draw points
        for (let i = this.points.length - 1; i >= 0; i--) {
            const p = this.points[i];
            p.age++;

            if (p.age > p.life) {
                this.points.splice(i, 1);
                continue;
            }

            const alpha = 1 - (p.age / p.life);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(200, 50, 50, ${alpha * 0.05})`; // Faint red
            this.ctx.fill();
        }

        requestAnimationFrame(() => this.loop());
    }
};

/**
 * Interrogation System
 * Invasively asks questions.
 */
export const Interrogation = {
    active: false,
    questions: [
        "Are you alone right now?",
        "Do you like being watched?",
        "Have you been bad today?",
        "Are you afraid of silence?",
        "Does this feel personal?"
    ],

    trigger() {
        if (this.active) return;
        this.active = true;

        const q = this.questions[Math.floor(Math.random() * this.questions.length)];

        const overlay = document.createElement('div');
        overlay.className = 'interrogation-overlay';

        const box = document.createElement('div');
        box.className = 'interrogation-box';

        const text = document.createElement('div');
        text.className = 'interrogation-question';
        text.textContent = q;

        const opts = document.createElement('div');
        opts.className = 'interrogation-options';

        const yes = document.createElement('button');
        yes.className = 'interrogation-btn';
        yes.textContent = "YES";

        const no = document.createElement('button');
        no.className = 'interrogation-btn';
        no.textContent = "NO";

        // Handlers
        const close = (reaction) => {
            overlay.remove();
            this.active = false;
            // Callback to main? Or just return?
            return reaction;
        };

        yes.onclick = () => close(true);
        no.onclick = () => close(false);

        opts.appendChild(yes);
        opts.appendChild(no);
        box.appendChild(text);
        box.appendChild(opts);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        AudioEngine.noise(); // Alert sound
    }
};

/**
 * Breath Synchronization Mode
 * Fullscreen breathing exercise. Controls audio and visual.
 */
export const BreathSync = {
    active: false,
    overlay: null,
    circle: null,
    text: null,
    timer: null,
    phase: 0, // 0: In, 1: Hold, 2: Out, 3: Hold

    start() {
        if (this.active) return;
        this.active = true;

        this.overlay = document.createElement('div');
        this.overlay.className = 'breath-overlay';

        this.circle = document.createElement('div');
        this.circle.className = 'breath-circle';

        this.text = document.createElement('div');
        this.text.className = 'breath-instruction';
        this.text.textContent = "BREATHE IN";

        this.overlay.appendChild(this.circle);
        this.overlay.appendChild(this.text);
        document.body.appendChild(this.overlay);

        // Loop
        this.cycle();
    },

    cycle() {
        if (!this.active) return;

        // Simple extensive 4-7-8 rhythm or just 4-4-4-4 box breathing
        // Let's do Box: In(4), Hold(4), Out(4), Hold(4)

        const step = (msg, scale, duration, next) => {
            this.text.textContent = msg;
            this.circle.style.transition = `transform ${duration}s ease-in-out, opacity ${duration}s`;
            this.circle.style.transform = `scale(${scale})`;

            // Audio Cue (could add to AudioEngine)
            if (msg.includes("IN")) AudioEngine.sigh();

            this.timer = setTimeout(next, duration * 1000);
        };

        // Sequence
        const p1 = () => step("BREATHE IN", 3.0, 4, p2);
        const p2 = () => step("HOLD", 3.0, 4, p3);
        const p3 = () => step("BREATHE OUT", 1.0, 4, p4);
        const p4 = () => step("WAIT", 1.0, 4, p1);

        p1();

        // Exit condition: Click to escape
        this.overlay.onclick = () => this.stop();
    },

    stop() {
        this.active = false;
        clearTimeout(this.timer);
        if (this.overlay) this.overlay.remove();
    }
};
