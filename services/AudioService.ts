
class SparkyAudioService {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private voicesLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Configuração TTS
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
      }

      // Configuração AudioContext para SFX (Lazy load para evitar bloqueio de autoplay)
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      } catch (e) {
        console.warn("Web Audio API não suportada.");
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    
    let voices = this.synth.getVoices();
    if (voices.length > 0) {
      this.voicesLoaded = true;
      
      // Algoritmo de Prioridade de Voz para Português
      this.voice = voices.find(v => v.lang === 'pt-BR' && v.name.includes('Google')) 
                || voices.find(v => v.lang === 'pt-BR' && v.name.includes('Natural'))
                || voices.find(v => v.lang === 'pt-BR') 
                || voices.find(v => v.lang.includes('pt'))
                || voices[0];
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
      if (this.audioCtx && this.audioCtx.state === 'running') {
        this.audioCtx.suspend();
      }
    } else {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // --- ENGINE DE EFEITOS SONOROS (OSCILLATORS) ---
  // Cria sons lúdicos sem precisar de arquivos externos
  public playSfx(type: 'pop' | 'click' | 'success' | 'error' | 'delete' | 'start' | 'hover' | 'tap') {
    if (this.isMuted || !this.audioCtx) return;

    // Resume context if needed (browsers block audio until interaction)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const t = this.audioCtx.currentTime;
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    switch (type) {
      case 'hover': // Som muito sutil ao passar o mouse (UI Feedback)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, t);
        gainNode.gain.setValueAtTime(0.02, t); // Volume bem baixo
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        oscillator.start(t);
        oscillator.stop(t + 0.05);
        break;

      case 'tap': // Som de clique seco (mobile tap)
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, t);
        gainNode.gain.setValueAtTime(0.05, t);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        oscillator.start(t);
        oscillator.stop(t + 0.03);
        break;

      case 'pop': // Ao soltar um bloco (som de bolha suave)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, t);
        oscillator.frequency.exponentialRampToValueAtTime(500, t + 0.1);
        gainNode.gain.setValueAtTime(0.1, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        oscillator.start(t);
        oscillator.stop(t + 0.1);
        break;

      case 'click': // Movimento do robô (passo)
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, t);
        gainNode.gain.setValueAtTime(0.1, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        oscillator.start(t);
        oscillator.stop(t + 0.05);
        break;

      case 'delete': // Ao remover (som de "fiuu" caindo)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, t);
        oscillator.frequency.exponentialRampToValueAtTime(50, t + 0.15);
        gainNode.gain.setValueAtTime(0.1, t);
        gainNode.gain.linearRampToValueAtTime(0.01, t + 0.15);
        oscillator.start(t);
        oscillator.stop(t + 0.15);
        break;

      case 'start': // Executar programa (som computacional)
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, t);
        oscillator.frequency.setValueAtTime(440, t + 0.1);
        oscillator.frequency.setValueAtTime(880, t + 0.2);
        gainNode.gain.setValueAtTime(0.05, t);
        gainNode.gain.linearRampToValueAtTime(0.05, t + 0.3);
        gainNode.gain.linearRampToValueAtTime(0, t + 0.4);
        oscillator.start(t);
        oscillator.stop(t + 0.4);
        break;

      case 'success': // Vitória (Acorde Maior)
        this.playNote(523.25, t, 0.1, 'sine'); // C5
        this.playNote(659.25, t + 0.1, 0.1, 'sine'); // E5
        this.playNote(783.99, t + 0.2, 0.4, 'sine'); // G5
        break;

      case 'error': // Erro (Tom grave dissonante)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, t);
        oscillator.frequency.linearRampToValueAtTime(100, t + 0.3);
        gainNode.gain.setValueAtTime(0.2, t);
        gainNode.gain.linearRampToValueAtTime(0, t + 0.3);
        oscillator.start(t);
        oscillator.stop(t + 0.3);
        break;
    }
  }

  private playNote(freq: number, time: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    osc.start(time);
    osc.stop(time + duration);
  }

  // --- TEXT TO SPEECH HUMANIZADO ---
  public speak(text: string, mood: 'happy' | 'neutral' | 'excited' | 'instruction' = 'neutral', onStart?: () => void, onEnd?: () => void) {
    if (this.isMuted || !this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.stop();

    if (!this.voicesLoaded) this.loadVoices();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;

    let basePitch = 1.2; 
    let baseRate = 1.05; 

    switch (mood) {
        case 'excited':
            basePitch = 1.4;
            baseRate = 1.15;
            break;
        case 'happy':
            basePitch = 1.3;
            baseRate = 1.1;
            break;
        case 'instruction':
            basePitch = 1.1;
            baseRate = 0.95; 
            break;
        case 'neutral':
        default:
            basePitch = 1.2;
            baseRate = 1.05;
            break;
    }

    if (text.includes('?')) basePitch += 0.1; 
    if (text.includes('!')) baseRate += 0.05;

    utterance.pitch = basePitch;
    utterance.rate = baseRate;
    utterance.volume = 0.9; 

    utterance.onstart = () => { if (onStart) onStart(); };
    utterance.onend = () => { if (onEnd) onEnd(); };
    utterance.onerror = (e) => { 
        console.error("Erro TTS:", e); 
        if (onEnd) onEnd(); 
    };

    this.synth.speak(utterance);
  }
}

export const audioService = new SparkyAudioService();
