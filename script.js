let audioCtx = null;
let analyser = null;
let masterGain = null;

const screenText = document.getElementById("screenText");
const canvas = document.getElementById("audioVisualizer");
const canvasCtx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Safe Init Engine (Fires immediately upon first pad touch/click)
function initAudioEngine() {
    if (audioCtx) return;

    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.6, audioCtx.currentTime);

        analyser.connect(masterGain);
        masterGain.connect(audioCtx.destination);

        screenText.textContent = "ENGINE READY // SYSTEM OK";
        
        document.getElementById("masterVolume").addEventListener("input", (e) => {
            if (masterGain) {
                masterGain.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
            }
        });

        drawVisualizer();
    } catch (err) {
        screenText.textContent = "AUDIO INITIALIZATION FAILED";
    }
}

async function resumeAudioContext() {
    initAudioEngine();
    if (audioCtx && audioCtx.state === "suspended") {
        await audioCtx.resume();
    }
}

// Synthesizer Algorithms
function triggerSynth(noteType) {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const synthGain = audioCtx.createGain();
    synthGain.gain.setValueAtTime(0, audioCtx.currentTime);
    
    let duration = 0.3;

    if (noteType === "kick") {
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        synthGain.gain.linearRampToValueAtTime(1.0, audioCtx.currentTime + 0.01);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
        duration = 0.18;
    } 
    else if (noteType === "snare") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(190, audioCtx.currentTime);
        synthGain.gain.linearRampToValueAtTime(0.7, audioCtx.currentTime + 0.01);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
        duration = 0.22;
    }
    else if (noteType === "hihat") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(9000, audioCtx.currentTime);
        synthGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.005);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
        duration = 0.07;
    }
    else if (noteType === "clap") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(850, audioCtx.currentTime);
        synthGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        duration = 0.15;
    }
    else if (noteType === "sub") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(65.41, audioCtx.currentTime); // C2
        synthGain.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.05);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
        duration = 0.55;
    }
    else if (noteType === "saw") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(130.81, audioCtx.currentTime); // C3
        synthGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.02);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        duration = 0.45;
    }
    else if (noteType === "growl") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(92.0, audioCtx.currentTime); // F#2
        osc.frequency.linearRampToValueAtTime(45.0, audioCtx.currentTime + 0.35);
        synthGain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.02);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        duration = 0.4;
    }
    else if (noteType === "vintage") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(146.83, audioCtx.currentTime); // D3
        synthGain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.05);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        duration = 0.45;
    }
    else if (noteType === "lead1") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        synthGain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.02);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        duration = 0.35;
    }
    else if (noteType === "lead2") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        synthGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        duration = 0.3;
    }
    else if (noteType === "lead3") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        synthGain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.05);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.65);
        duration = 0.65;
    }
    else if (noteType === "lead4") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
        osc.frequency.setValueAtTime(1567.98, audioCtx.currentTime + 0.08); // Arpeggiates octave jump
        synthGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
        synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
        duration = 0.28;
    }

    osc.connect(synthGain);
    synthGain.connect(analyser);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    
    screenText.textContent = `PATCH OUT: [${noteType.toUpperCase()}]`;
}

// Map Touch and Click triggers for instant execution
const pads = document.querySelectorAll(".pad");
pads.forEach(pad => {
    const handleTrigger = async (e) => {
        e.preventDefault();
        await resumeAudioContext();
        
        const note = pad.getAttribute("data-note");
        triggerSynth(note);
        
        pad.classList.add("pressed");
        setTimeout(() => pad.classList.remove("pressed"), 100);
    };

    pad.addEventListener("touchstart", handleTrigger, { passive: false });
    pad.addEventListener("mousedown", handleTrigger);
});

// Map physical keyboard strokes
const keyMap = {
    "1": "kick", "2": "snare", "3": "hihat", "4": "clap",
    "q": "sub", "w": "saw", "e": "growl", "r": "vintage",
    "a": "lead1", "s": "lead2", "d": "lead3", "f": "lead4"
};

window.addEventListener("keydown", async (e) => {
    const key = e.key.toLowerCase();
    if (keyMap[key]) {
        await resumeAudioContext();
        triggerSynth(keyMap[key]);
        const matchedPad = document.querySelector(`[data-key="${key}"]`);
        if (matchedPad) {
            matchedPad.classList.add("pressed");
            setTimeout(() => matchedPad.classList.remove("pressed"), 100);
        }
    }
});

document.getElementById("killAudioBtn").addEventListener("click", () => {
    if (audioCtx) {
        audioCtx.close().then(() => {
            audioCtx = null;
            screenText.textContent = "SIGNAL CLOSED";
        });
    }
});

// High-Definition Oscilloscope Drawing Routine
function drawVisualizer() {
    if (!audioCtx) return;
    requestAnimationFrame(drawVisualizer);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = "#050608";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 3;
    canvasCtx.strokeStyle = "#00ffaa";
    canvasCtx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}
