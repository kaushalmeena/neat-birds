// Chiptune-style sound effects synthesized with WebAudio - no audio assets.
// The AudioContext is created lazily on the first sound, which happens in
// response to a user gesture (click/key), satisfying autoplay policies.
let audioContext;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

// Plays a single square-wave tone with a quick fade-out envelope
function playTone({ frequency, endFrequency, duration, delay = 0 }) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      endFrequency,
      start + duration
    );
  }
  gain.gain.setValueAtTime(0.03, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

// Short rising blip when the player flaps
export function playFlapSound() {
  playTone({ frequency: 320, endFrequency: 520, duration: 0.08 });
}

// Two-tone coin-like chime when a pipe is passed
export function playScoreSound() {
  playTone({ frequency: 660, duration: 0.07 });
  playTone({ frequency: 990, duration: 0.1, delay: 0.07 });
}

// Falling sweep when the player dies
export function playDeathSound() {
  playTone({ frequency: 400, endFrequency: 90, duration: 0.45 });
}
