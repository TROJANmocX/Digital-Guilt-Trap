
import { AudioEngine } from './audio.js';

/**
 * Click Particles
 */
export const ClickFX = {
    words: [
        "Yes", "Harder", "Mmm", "More", "Good",
        "Obey", "Quiet", "Touch", "Don't", "Stop",
        "Again", "Faster", "Slow", "No", "Please"
    ],

    spawn(x, y) {
        const word = this.words[Math.floor(Math.random() * this.words.length)];
        const el = document.createElement('div');
        el.className = 'click-burst';
        el.textContent = word;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        // Random tilt
        const rot = Math.random() * 40 - 20;
        el.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;

        document.body.appendChild(el);

        // Remove after animation
        setTimeout(() => el.remove(), 800);
    }
};

/**
 * Ghost Typing Mirror
 */
export const GhostTyper = {
    container: null,
    textEl: null,
    currentText: "",
    timeout: null,

    init() {
        this.container = document.createElement('div');
        this.container.className = 'ghost-container';

        this.textEl = document.createElement('div');
        this.textEl.className = 'ghost-text';

        this.container.appendChild(this.textEl);
        document.body.appendChild(this.container);
    },

    type(char) {
        if (!this.container) this.init();

        // Handle backspace
        if (char === 'Backspace') {
            this.currentText = this.currentText.slice(0, -1);
        } else if (char.length === 1) {
            this.currentText += char;
        }

        // Cap length
        if (this.currentText.length > 20) {
            this.currentText = this.currentText.substring(10);
        }

        this.update();

        // Fade out buffer
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.currentText = "";
            this.update();
        }, 5000);
    },

    update() {
        this.textEl.textContent = this.currentText;
        this.textEl.style.opacity = 1;
    },

    shake() {
        this.textEl.classList.add('shake');
        setTimeout(() => this.textEl.classList.remove('shake'), 400);
    },

    clear() {
        this.currentText = "";
        this.update();
    }
};

/**
 * The Bait Button
 */
export const BaitSystem = {
    btn: null,

    init() {
        const container = document.createElement('div');
        container.className = 'bait-container';

        this.btn = document.createElement('button');
        this.btn.className = 'bait-button';
        this.btn.textContent = "DO NOT PRESS";

        container.appendChild(this.btn);
        document.body.appendChild(container); // Add to body, not app, to be separate

        this.btn.addEventListener('mouseenter', () => this.hover());
        this.btn.addEventListener('click', () => this.click());
    },

    hover() {
        AudioEngine.sigh(); // Trigger sigh/breath sound

        if (Math.random() > 0.7) {
            this.btn.textContent = "I WARNED YOU";
            setTimeout(() => this.btn.textContent = "DO NOT PRESS", 1000);
        }
    },

    click() {
        AudioEngine.noise(); // Reuse noise
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 500);

        this.btn.textContent = "ERROR";

        // Return signal to main script to trigger punishment text
        return true;
    }
};
