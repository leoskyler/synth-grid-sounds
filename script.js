// --- Web Audio Context Initialization ---
let audioCtx;
let analyser;
let masterGain;

function initAudio() {
    if (audioCtx) return; // Already initialized
    
    // Create audio context (compatible with older safari)
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    // Set up Master Gain (Volume Control)
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.7, audioCtx.currentTime);
    
    // Set up Real-Time Analyser
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128; // Small fft for retro, chunky visualizer bars
    
    // Connect nodes: Synth -> MasterGain -> Analyser -> Output Speakers
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);

    // Hide instruction placeholder once audio kicks off
    document.getElementById("statusText").style.opacity = "0.2";
}

// --- Synthesizer Instruments ---

// 1. Kick Drum (Deep Pitch Sweep)
function playKick() {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
}

// 2. Snare Drum (White Noise + Bandpass Filter)
function playSnare() {
    const bufferSize = audioCtx.sampleRate * 0.2; // 0.2 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;

    // Snare tone shell filter
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1000;

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    noiseNode.start(audioCtx.currentTime);
    noiseNode.stop(audioCtx.currentTime + 0.2);
}

// 3. Hi-Hat (Metallic Ringing High-Pass)
function playHiHat() {
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gainNode = audioCtx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(10000, audioCtx.currentTime);

    filter.type = "highpass";
    filter.frequency.value = 7000;

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.05);
}

// 4. Clap (Multi-Trigger Impulse)
function playClap() {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);

    // Creates rapid volume spikes mimicking handclaps
    const t = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0.5, t);
    gainNode.gain.setValueAtTime(0.01, t + 0.02);
    gainNode.gain.setValueAtTime(0.4, t + 0.04);
    gainNode.gain.setValueAtTime(0.01, t + 0.06);
    gainNode.gain.setValueAtTime(0.5, t + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
}

// 5. Synth Bass Engine (Freq in Hz, Waveform, Duration)
function playBass(freq, wave = "sawtooth", duration = 0.4) {
    const osc = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator(); // Detuned helper oscillator for chorusing
    const filter = audioCtx.createBiquadFilter();
    const gainNode = audioCtx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    osc2.type = wave;
    osc2.frequency.setValueAtTime(freq + 3, audioCtx.currentTime); // detune slightly

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + duration);

    gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    osc.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
    osc2.stop(audioCtx.currentTime + duration);
}

// 6. Lead Melodic Synth Engine
function playLead(freq, wave = "triangle", duration = 0.5) {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Add vibrato LFO
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 6; // 6Hz speed
    lfoGain.gain.value = 8; // Pitch depth
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    lfo.start(audioCtx.currentTime);
    osc.start(audioCtx.currentTime);
    
    lfo.stop(audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
}

// --- Interactive Route Handler ---

function triggerSound(soundName) {
    initAudio(); // Auto-unlock Context if needed
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    switch (soundName) {
        // Beats
        case "kick": playKick(); break;
        case "snare": playSnare(); break;
        case "hihat": playHiHat(); break;
        case "clap": playClap(); break;
        
        // Basslines (C1, Eb1, F1, G1)
        case "sub": playBass(65.41, "sine", 0.5); break;
        case "saw": playBass(77.78, "sawtooth", 0.3); break;
        case "growl": playBass(87.31, "triangle", 0.4); break;
        case "retro": playBass(98.00, "sawtooth", 0.6); break;
        
        // Lead Synths (C4, Eb4, G4, Bb4)
        case "lead1": playLead(261.63, "sawtooth", 0.6); break;
        case "lead2": playLead(311.13, "square", 0.4); break;
        case "pad": playLead(392.00, "sine", 1.2); break;
        case "chime": playLead(466.16, "triangle", 0.5); break;
    }
}

// --- Visualizer Animation Loop ---

const canvas = document.getElementById("visualizerCanvas");
const ctx = canvas.getContext("2d");

// Responsive Scaling for Visualizer
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);

    // Clean background frame
    ctx.fillStyle = "#020205";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!analyser) {
        // Draw idle neon flatline
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = "rgba(157, 0, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const barWidth = (canvas.width / bufferLength) * 1.5;
    let barHeight;
    let x = 0;

    // Draw symmetric audio columns radiating outwards
    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * 0.45;

        // Custom neon-gradient spectrum mapping
        const r = 150 + (i * 2);
        const g = i * 4;
        const b = 255 - (i * 2);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;

        // Draw top half
        ctx.fillRect(x, (canvas.height / 2) - barHeight, barWidth - 2, barHeight);
        // Draw mirrored bottom half
        ctx.fillRect(x, canvas.height / 2, barWidth - 2, barHeight);

        x += barWidth;
    }
    ctx.shadowBlur = 0; // reset
}
drawVisualizer();

// --- Interactive Events Setup ---

// Pad Clicks
const pads = document.querySelectorAll(".pad");
pads.forEach(pad => {
    pad.addEventListener("pointerdown", () => {
        const sound = pad.getAttribute("data-sound");
        triggerSound(sound);
        
        // Add rapid animation pop class
        pad.classList.add("active");
        setTimeout(() => pad.classList.remove("active"), 120);
    });
});

// Sound Board Keyboard Hotkey mapping
const KEY_MAP = {
    "1": "kick", "2": "snare", "3": "hihat", "4": "clap",
    "q": "sub", "w": "saw", "e": "growl", "r": "retro",
    "a": "lead1", "s": "lead2", "d": "pad", "f": "chime",
    "Q": "sub", "W": "saw", "E": "growl", "R": "retro",
    "A": "lead1", "S": "lead2", "D": "pad", "F": "chime"
};

window.addEventListener("keydown", (e) => {
    const sound = KEY_MAP[e.key];
    if (sound) {
        triggerSound(sound);
        
        // Match visual key-pad
        const pad = document.querySelector(`[data-sound="${sound}"]`);
        if (pad) {
            pad.classList.add("active");
            setTimeout(() => pad.classList.remove("active"), 120);
        }
    }
});

// Master Volume Controller
const volSlider = document.getElementById("masterVolume");
volSlider.addEventListener("input", (e) => {
    if (masterGain) {
        masterGain.gain.setValueAtTime(e.target.value, audioCtx.currentTime);
    }
});

// Emergency Audio Reset
document.getElementById("panicBtn").addEventListener("click", () => {
    if (audioCtx) {
        audioCtx.close().then(() => {
            audioCtx = null;
            document.getElementById("statusText").innerText = "AUDIO SHUTDOWN COMPLETE. TAP TO REBOOT.";
            document.getElementById("statusText").style.opacity = "1";
        });
    }
});
