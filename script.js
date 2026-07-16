let audioCtx = null;
let analyser = null;
let visualActive = false;

// Grab screen text display
const screenText = document.getElementById("screenText");

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
    const volumeSlider = document.getElementById("masterVolume");
    const vol = volumeSlider ? parseFloat(volumeSlider.value) : 0.6;
    
    if (!masterGain && audioCtx) {
        masterGain = audioCtx.createGain();
        masterGain.connect(analyser);
    }
    if (masterGain) {
        masterGain.gain.setValueAtTime(vol, audioCtx.currentTime);
    }
    return masterGain;
}

// Dynamic Visualizer Engine
function startVisualizer() {
    const visualizerCanvas = document.getElementById("audioVisualizer");
    if (!visualizerCanvas) return;
    const canvasCtx = visualizerCanvas.getContext("2d");
    visualActive = true;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        if (!visualActive) return;
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        // Match high-DPI scaling
        const rect = visualizerCanvas.getBoundingClientRect();
        visualizerCanvas.width = rect.width;
        visualizerCanvas.height = rect.height;
        
        canvasCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        
        // Simple CRT neon wave line
        canvasCtx.lineWidth = 3;
        canvasCtx.strokeStyle = "#00f0ff";
        canvasCtx.shadowBlur = 8;
        canvasCtx.shadowColor = "#00f0ff";
        canvasCtx.beginPath();
        
        const sliceWidth = visualizerCanvas.width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * visualizerCanvas.height) / 2;
            
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        canvasCtx.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2);
        canvasCtx.stroke();
    }
    draw();
}

// Update Screen Label
function updateScreenText(patchName) {
    if (screenText) {
        screenText.innerText = `PATCH OUT: [${patchName.toUpperCase()}]`;
    }
}

// --- The 12-Pad Synthesizer Engines ---
const synths = {
    // PAD 01: Audibility-Enhanced Kick
    "kick": () => {
        const now = audioCtx.currentTime;
        const oscSine = audioCtx.createOscillator();
        const oscTri = audioCtx.createOscillator();
        const gainSine = audioCtx.createGain();
        const gainTri = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        oscSine.type = 'sine';
        oscTri.type = 'triangle'; // Generates upper-mids so phone speakers can hear it!

        oscSine.frequency.setValueAtTime(150, now);
        oscSine.frequency.exponentialRampToValueAtTime(52, now + 0.12);

        oscTri.frequency.setValueAtTime(300, now);
        oscTri.frequency.exponentialRampToValueAtTime(104, now + 0.12);

        gainSine.gain.setValueAtTime(0.8, now);
        gainSine.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        gainTri.gain.setValueAtTime(0.2, now);
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
        updateScreenText("kick");
    },

    // PAD 02: Snare Drum
    "snare": () => {
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
        updateScreenText("snare");
    },

    // PAD 03: Hi-Hat
    "hihat": () => {
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
        updateScreenText("hi-hat");
    },

    // PAD 04: Clap
    "clap": () => {
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
        updateScreenText("clap");
    },

    // PAD 05: Audibility-Enhanced Sub Deep
    "sub": () => {
        const now = audioCtx.currentTime;
        const subOsc = audioCtx.createOscillator();
        const harmonicOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        const harmGain = audioCtx.createGain();

        // 55Hz Sub (pure pressure)
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(55, now);
        subGain.gain.setValueAtTime(0.8, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        // 110Hz Harmonic (adds audible tone structure on phone speakers)
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
        updateScreenText("sub deep");
    },

    // PAD 06: Saw Bass
    "saw": () => {
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
        updateScreenText("saw bass");
    },

    // PAD 07: Dirty Growl
    "growl": () => {
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
        updateScreenText("dirty growl");
    },

    // PAD 08: Classic 80s
    "vintage": () => {
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
        updateScreenText("classic 80s");
    },

    // PAD 09: Glass Lead
    "lead1": () => {
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
        updateScreenText("glass lead");
    },

    // PAD 10: Pulse Arp
    "lead2": () => {
        const now = audioCtx.currentTime;
        const freqs = [261.63, 329.63, 392.00, 523.25]; // C Chord Arp
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
        updateScreenText("pulse arp");
    },

    // PAD 11: Dream State
    "lead3": () => {
        const now = audioCtx.currentTime;
        const notes = [329.63, 392.00, 493.88, 587.33]; // Em7 Chord
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
        updateScreenText("dream state");
    },

    // PAD 12: Glitch Toy
    "lead4": () => {
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
        updateScreenText("glitch toy");
    }
};

// --- DOM Event Bindings & Visual Cues ---
document.querySelectorAll(".pad").forEach(pad => {
    // Standard touch / click listener
    pad.addEventListener("pointerdown", (e) => {
        initAudio();
        const note = pad.dataset.note;
        if (synths[note]) {
            synths[note]();
            pad.classList.add("active");
            setTimeout(() => pad.classList.remove("active"), 120);
        }
    });
});

// Real-Time Master Volume Updates
const volumeInput = document.getElementById("masterVolume");
if (volumeInput) {
    volumeInput.addEventListener("input", () => {
        getMasterGain(); // Dynamically updates active slider node value
    });
}

// Kill Signal Button
const killBtn = document.getElementById("killAudioBtn");
if (killBtn) {
    killBtn.addEventListener("click", () => {
        if (audioCtx) {
            audioCtx.close().then(() => {
                audioCtx = null;
                masterGain = null;
                analyser = null;
                visualActive = false;
                if (screenText) screenText.innerText = "SIGNAL TERMINATED";
            });
        }
    });
}

// Keyboard Hotkey Mapping
window.addEventListener("keydown", (e) => {
    const activeKey = e.key.toLowerCase();
    const targetPad = document.querySelector(`[data-key="${activeKey}"]`);
    
    if (targetPad) {
        initAudio();
        const note = targetPad.dataset.note;
        if (synths[note]) {
            synths[note]();
            targetPad.classList.add("active");
            setTimeout(() => targetPad.classList.remove("active"), 120);
        }
    }
});
