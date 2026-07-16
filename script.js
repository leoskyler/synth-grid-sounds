let audioCtx = null;
let analyser = null;
let visualActive = false;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.connect(audioCtx.destination);
        startVisualizer();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Master volume node
let masterGain = null;
function getMasterGain() {
    if (!masterGain && audioCtx) {
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
        masterGain.connect(analyser);
    }
    return masterGain;
}

// --- Dynamic Visualizer Engine ---
function startVisualizer() {
    const patchDisplay = document.querySelector('.visualizer-inner') || document.querySelector('.zen-core');
    if (!patchDisplay) return;
    visualActive = true;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        if (!visualActive) return;
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
    }
    draw();
}

// --- The 12-Pad Synthesizer Engines ---
const synths = {
    // PAD 01: Audibility-Enhanced Kick (Sine + Triangle blend for rich upper harmonics)
    1: () => {
        const now = audioCtx.currentTime;
        const oscSine = audioCtx.createOscillator();
        const oscTri = audioCtx.createOscillator();
        const gainSine = audioCtx.createGain();
        const gainTri = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        oscSine.type = 'sine';
        oscTri.type = 'triangle'; // Triangle provides crucial mid-range harmonics for phone speakers!

        // Dynamic rapid pitch drop
        oscSine.frequency.setValueAtTime(150, now);
        oscSine.frequency.exponentialRampToValueAtTime(52, now + 0.12);

        oscTri.frequency.setValueAtTime(300, now); // Double frequency for audible definition on phones
        oscTri.frequency.exponentialRampToValueAtTime(104, now + 0.12);

        // Volume envelopes
        gainSine.gain.setValueAtTime(0.8, now);
        gainSine.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        gainTri.gain.setValueAtTime(0.2, now); // Quiet mix but highly audible
        gainTri.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);

        oscSine.connect(gainSine);
        oscTri.connect(gainTri);
        
        gainSine.connect(filter);
        gainTri.connect(filter);
        filter.connect(getMasterGain());

        oscSine.start(now);
        oscTri.start(now);
        oscSine.stop(now + 0.3);
        oscTri.stop(now + 0.3);
    },

    // PAD 02: Snare Drum
    2: () => {
        const now = audioCtx.currentTime;
        const bufferSize = audioCtx.sampleRate * 0.2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        const snap = audioCtx.createOscillator();
        const snapGain = audioCtx.createGain();
        snap.type = 'triangle';
        snap.frequency.setValueAtTime(180, now);
        snapGain.gain.setValueAtTime(0.4, now);
        snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(getMasterGain());

        snap.connect(snapGain);
        snapGain.connect(getMasterGain());

        noise.start(now);
        snap.start(now);
        noise.stop(now + 0.2);
        snap.stop(now + 0.2);
    },

    // PAD 03: Hi-Hat
    3: () => {
        const now = audioCtx.currentTime;
        const bufferSize = audioCtx.sampleRate * 0.05;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, now);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(getMasterGain());

        noise.start(now);
        noise.stop(now + 0.06);
    },

    // PAD 04: Futuristic Clap
    4: () => {
        const now = audioCtx.currentTime;
        const playClapTrigger = (delay) => {
            const bufferSize = audioCtx.sampleRate * 0.08;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1200, now);

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.25, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.06);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(getMasterGain());

            noise.start(now + delay);
            noise.stop(now + delay + 0.08);
        };

        playClapTrigger(0);
        playClapTrigger(0.015);
        playClapTrigger(0.03);
    },

    // PAD 05: Audibility-Enhanced Sub Deep (Added a low second-harmonic oscillator)
    5: () => {
        const now = audioCtx.currentTime;
        const subOsc = audioCtx.createOscillator();
        const harmonicOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        const harmGain = audioCtx.createGain();

        // 55Hz (Sub A1 - Feel this on headphones)
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(55, now);
        subGain.gain.setValueAtTime(0.8, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        // 110Hz (Harmonic A2 - Triangle wave to bypass phone speaker limits!)
        harmonicOsc.type = 'triangle';
        harmonicOsc.frequency.setValueAtTime(110, now);
        harmGain.gain.setValueAtTime(0.18, now);
        harmGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        subOsc.connect(subGain);
        subGain.connect(getMasterGain());

        harmonicOsc.connect(harmGain);
        harmGain.connect(getMasterGain());

        subOsc.start(now);
        harmonicOsc.start(now);
        subOsc.stop(now + 0.6);
        harmonicOsc.stop(now + 0.6);
    },

    // PAD 06: Saw Bass
    6: () => {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65.41, now); // C2

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(getMasterGain());

        osc.start(now);
        osc.stop(now + 0.42);
    },

    // PAD 07: Dirty Growl Bass
    7: () => {
        const now = audioCtx.currentTime;
        const carrier = audioCtx.createOscillator();
        const modulator = audioCtx.createOscillator();
        const modGain = audioCtx.createGain();
        const gain = audioCtx.createGain();

        carrier.type = 'sawtooth';
        carrier.frequency.setValueAtTime(73.42, now); // D2

        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(110, now);
        modGain.gain.setValueAtTime(150, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(gain);
        gain.connect(getMasterGain());

        carrier.start(now);
        modulator.start(now);
        carrier.stop(now + 0.5);
        modulator.stop(now + 0.5);
    },

    // PAD 08: Classic 80s Chime
    8: () => {
        const now = audioCtx.currentTime;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(587.33, now); // D5

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(590, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(getMasterGain());

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
    },

    // PAD 09: Glass Lead
    9: () => {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(getMasterGain());

        osc.start(now);
        osc.stop(now + 0.5);
    },

    // PAD 10: Pulse Arp
    10: () => {
        const now = audioCtx.currentTime;
        const freqs = [261.63, 329.63, 392.00, 523.25]; // C chord arpeggio
        freqs.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + (idx * 0.07));

            gain.gain.setValueAtTime(0.15, now + (idx * 0.07));
            gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.07) + 0.06);

            osc.connect(gain);
            gain.connect(getMasterGain());

            osc.start(now + (idx * 0.07));
            osc.stop(now + (idx * 0.07) + 0.08);
        });
    },

    // PAD 11: Dream State Chord
    11: () => {
        const now = audioCtx.currentTime;
        const notes = [329.63, 392.00, 493.88, 587.33]; // Em7 chord
        notes.forEach(note => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note, now);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

            osc.connect(gain);
            gain.connect(getMasterGain());

            osc.start(now);
            osc.stop(now + 0.8);
        });
    },

    // PAD 12: Digital Glitch Toy
    12: () => {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800 + Math.random() * 1200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(getMasterGain());

        osc.start(now);
        osc.stop(now + 0.16);
    }
};

// --- DOM Event Bindings & Visual Cues ---
document.querySelectorAll(".grid-pad, .pad").forEach(pad => {
    pad.addEventListener("pointerdown", (e) => {
        initAudio();
        const padIndex = pad.dataset.pad || pad.getAttribute('data-id');
        if (synths[padIndex]) {
            synths[padIndex]();
            pad.classList.add("active");
            setTimeout(() => pad.classList.remove("active"), 120);
        }
    });
});

const keyMap = {
    '1': 1, '2': 2, '3': 3, '4': 4,
    'q': 5, 'w': 6, 'e': 7, 'r': 8,
    'a': 9, 's': 10, 'd': 11, 'f': 12
};

window.addEventListener("keydown", (e) => {
    const padIndex = keyMap[e.key.toLowerCase()];
    if (padIndex) {
        initAudio();
        const padElement = document.querySelector(`[data-pad="${padIndex}"]`) || document.querySelector(`[data-id="${padIndex}"]`);
        if (padElement && synths[padIndex]) {
            synths[padIndex]();
            padElement.classList.add("active");
            setTimeout(() => padElement.classList.remove("active"), 120);
        }
    }
});
