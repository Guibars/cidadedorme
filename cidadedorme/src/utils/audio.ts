// Procedural Web Audio API Sound Synthesizer
// Generates professional cinematic game audio without external assets

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private isDronePlaying: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initCtx();
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('touchend', unlockAudio);
        window.removeEventListener('click', unlockAudio);
      };
      window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
      window.addEventListener('touchend', unlockAudio, { passive: true, once: true });
      window.addEventListener('click', unlockAudio, { once: true });
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleSound(force?: boolean): boolean {
    this.enabled = force !== undefined ? force : !this.enabled;
    if (!this.enabled && this.isDronePlaying) {
      this.stopDrone();
    }
    return this.enabled;
  }

  // Cinematic Sub-bass Boom (screen transitions, reveals)
  public playBoom() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 1.2);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.4);
  }

  // Iconic Netflix-style "Ta-Dum" Sound (procedural synthesis, 0 KB download)
  public playTaDum() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // First impact: "Ta" (deeper thud with slight high transient)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(95, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.25);
    gain1.gain.setValueAtTime(0.75, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second impact: "DUM" (huge cinematic swell with low frequency rumble)
    const t2 = now + 0.16;
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(130, t2);
    osc2.frequency.exponentialRampToValueAtTime(36, t2 + 1.6);
    gain2.gain.setValueAtTime(0.9, t2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 2.0);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 2.0);

    // Cinematic shimmer harmonic
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(260, t2);
    osc3.frequency.exponentialRampToValueAtTime(110, t2 + 1.2);
    gain3.gain.setValueAtTime(0.25, t2);
    gain3.gain.exponentialRampToValueAtTime(0.001, t2 + 1.4);
    osc3.connect(gain3);
    gain3.connect(this.ctx.destination);
    osc3.start(t2);
    osc3.stop(t2 + 1.5);
  }

  // Tension Drone (Discussion phase background)
  public startDrone() {
    if (!this.enabled || this.isDronePlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();

      this.droneOsc.type = 'sawtooth';
      this.droneOsc.frequency.setValueAtTime(55, now); // A1 note

      // Lowpass filter to make it a dark brooding rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, now);

      this.droneGain.gain.setValueAtTime(0.001, now);
      this.droneGain.gain.linearRampToValueAtTime(0.08, now + 2);

      this.droneOsc.connect(filter);
      filter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);

      this.droneOsc.start(now);
      this.isDronePlaying = true;
    } catch {
      // AudioContext failure recovery
    }
  }

  public stopDrone() {
    if (!this.droneOsc || !this.droneGain || !this.ctx) {
      this.isDronePlaying = false;
      return;
    }
    try {
      const now = this.ctx.currentTime;
      this.droneGain.gain.linearRampToValueAtTime(0.001, now + 0.8);
      this.droneOsc.stop(now + 0.8);
    } catch {
      // Ignore
    } finally {
      this.droneOsc = null;
      this.droneGain = null;
      this.isDronePlaying = false;
    }
  }

  // Clock tick (wood/metal click)
  public playTick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Heartbeat pulse (Lub-dub)
  public playHeartbeat() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(75, now);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.14);

    // Second beat (dub)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(65, now + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(30, now + 0.32);

    gain2.gain.setValueAtTime(0.35, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc2.start(now + 0.18);
    osc2.stop(now + 0.35);
  }

  // Subtle Footsteps sound on wooden mansion floor
  public playFootsteps() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Countdown beep for final 10 seconds (urgency)
  public playCountdownBeep(second: number) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch rises as time runs out
    const freq = second <= 3 ? 880 : 540 + (10 - second) * 25;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(second <= 3 ? 0.35 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Vote reveal drum/card slam
  public playVoteReveal() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Tragic elimination sting (wrong accusation - innocent eliminated)
  public playInnocentEliminated() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [220, 196, 174, 155]; // Downward sad progression

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.18;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.9);
    });
  }

  // Victorious Fanfare (Killer caught)
  public playVictory() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25]; // C major fanfare

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.15;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.2);
    });
  }

  // Dramatic Killer Wins Ominous Chord
  public playKillerWins() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [130.81, 155.56, 185.0]; // Diminished dark chord

    notes.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.5);
    });
  }

  // Button click / UI tap
  public playClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Identity reveal secret sound (vibrato drone)
  public playSecretReveal() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.4);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  // Night Fall Sound: Mysterious haunting wind with deep ambient descending swell
  public playNightFall() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Dark wind sine
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.exponentialRampToValueAtTime(38, now + 2.0);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 2.5);

    // Eerie harmonic
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(220, now + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(110, now + 2.0);
    gain2.gain.setValueAtTime(0.18, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 2.2);
  }

  // Day Break Sound: Morning church bell / resonant ambient wake-up chime
  public playDayBreak() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const startTime = now + i * 0.15;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.0);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 2.0);
    });
  }

  // Kill Stab / Horror Stinger (when victim is struck)
  public playKillStab() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.8);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.0);
  }

  // Sharp metallic knife slash whoosh sound effect
  public playKnifeSlash() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // High-pitched blade hiss
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(2400, now);
      osc1.frequency.exponentialRampToValueAtTime(320, now + 0.22);
      gain1.gain.setValueAtTime(0.45, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.26);

      // Low impact slice
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(450, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(60, now + 0.35);
      gain2.gain.setValueAtTime(0.5, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.42);

      this.triggerVibrate([40, 30, 80]);
    } catch {
      // Ignore
    }
  }

  // Tense heartbeat sound
  public playTenseHeartbeat() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [0, 0.18].forEach((offset) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, now + offset);
        osc.frequency.exponentialRampToValueAtTime(30, now + offset + 0.14);
        gain.gain.setValueAtTime(0.4, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.18);
      });
    } catch {
      // Ignore
    }
  }

  // Acoustic haptic thump (works on iPhone/iPad even when navigator.vibrate is disabled)
  public playHapticPulse(duration = 0.08, frequency = 45) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore
    }
  }

  // Trigger mobile vibration if supported + acoustic haptic
  public triggerVibrate(pattern: number | number[] = 50) {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Fallback
      }
    }
    // Also trigger subtle acoustic pulse for devices like iOS that restrict navigator.vibrate
    this.playHapticPulse(0.06, 50);
  }

  // Night fall vibration: subtle double buzz signaling "close your eyes"
  public triggerNightFallVibrate() {
    this.triggerVibrate([200, 100, 200]);
    this.playHapticPulse(0.2, 38);
  }

  // Heavy ominous buzz when assassinated
  public triggerVictimDeathVibrate() {
    this.triggerVibrate([300, 100, 300, 100, 600]);
    this.playHapticPulse(0.35, 30);
  }

  // Morning arrives: wake-up double pulse
  public triggerMorningVibrate() {
    this.triggerVibrate([150, 100, 150, 100, 300]);
    this.playHapticPulse(0.15, 65);
  }

  // Role reveal vibration
  public triggerRoleRevealVibrate(role?: string) {
    if (role === 'ASSASSINO') {
      this.triggerVibrate([150, 80, 250, 80, 450]);
      this.playHapticPulse(0.25, 35);
    } else if (role === 'DETETIVE') {
      this.triggerVibrate([100, 80, 100, 80, 200]);
      this.playHapticPulse(0.15, 55);
    } else {
      this.triggerVibrate([120, 100, 120]);
      this.playHapticPulse(0.1, 70);
    }
  }

  // Vote cast / tap confirmation
  public triggerVoteCastVibrate() {
    this.triggerVibrate(70);
  }

  // Urgent timer pulse when countdown <= 5s
  public triggerUrgentTimerVibrate() {
    this.triggerVibrate(40);
  }
}

export const sound = new SoundEngine();
