
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

      // Tenta inicializar AudioContext
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    if (this.audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn("Web Audio API não suportada.");
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    
    let voices = this.synth.getVoices();
    if (voices.length > 0) {
      this.voicesLoaded = true;
      
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

  // Método assíncrono para garantir que o áudio seja desbloqueado pelo navegador
  public async resumeContext() {
    if (!this.audioCtx) {
      this.initAudioContext();
    }
    
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.error("Erro ao resumir AudioContext:", e);
      }
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // --- ENGINE DE EFEITOS SONOROS ---
  public playSfx(type: 'pop' | 'click' | 'success' | 'error' | 'delete' | 'start') {
    if (this.isMuted) return;
    
    if (this.audioCtx?.state === 'suspended') this.audioCtx.resume();
    
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    switch (type) {
      case 'pop':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, t);
        oscillator.frequency.exponentialRampToValueAtTime(600, t + 0.1);
        gainNode.gain.setValueAtTime(0.5, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        oscillator.start(t);
        oscillator.stop(t + 0.1);
        break;

      case 'click':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, t);
        gainNode.gain.setValueAtTime(0.3, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        oscillator.start(t);
        oscillator.stop(t + 0.05);
        break;

      case 'delete': 
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, t);
        oscillator.frequency.exponentialRampToValueAtTime(50, t + 0.2);
        gainNode.gain.setValueAtTime(0.3, t);
        gainNode.gain.linearRampToValueAtTime(0.01, t + 0.2);
        oscillator.start(t);
        oscillator.stop(t + 0.2);
        break;

      case 'start': 
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, t);
        oscillator.frequency.setValueAtTime(440, t + 0.1);
        oscillator.frequency.setValueAtTime(880, t + 0.2);
        gainNode.gain.setValueAtTime(0.2, t);
        gainNode.gain.linearRampToValueAtTime(0.2, t + 0.3);
        gainNode.gain.linearRampToValueAtTime(0, t + 0.4);
        oscillator.start(t);
        oscillator.stop(t + 0.4);
        break;

      case 'success': 
        this.playTone(523.25, 0.1, 'sine'); // C5
        setTimeout(() => this.playTone(659.25, 0.1, 'sine'), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.4, 'sine'), 200); // G5
        break;

      case 'error': 
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, t);
        oscillator.frequency.linearRampToValueAtTime(100, t + 0.3);
        gainNode.gain.setValueAtTime(0.5, t);
        gainNode.gain.linearRampToValueAtTime(0, t + 0.3);
        oscillator.start(t);
        oscillator.stop(t + 0.3);
        break;
    }
  }

  // Toca uma nota específica (Melhorado para garantir audibilidade)
  public async playTone(frequency: number, duration: number = 0.3, type: OscillatorType = 'square') {
    if (this.isMuted) return;
    
    await this.resumeContext();

    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    // Volume: Square wave é naturalmente mais alta, então usamos 0.2 para não distorcer, mas é bem audível
    const vol = type === 'square' ? 0.2 : 0.5;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02); // Ataque
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration); // Decaimento
    
    osc.start(t);
    osc.stop(t + duration + 0.1);
  }

  // --- TEXT TO SPEECH ---
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
        case 'excited': basePitch = 1.4; baseRate = 1.15; break;
        case 'happy': basePitch = 1.3; baseRate = 1.1; break;
        case 'instruction': basePitch = 1.1; baseRate = 0.95; break;
        case 'neutral': default: basePitch = 1.2; baseRate = 1.05; break;
    }

    if (text.includes('?')) basePitch += 0.1;
    if (text.includes('!')) baseRate += 0.05;

    utterance.pitch = basePitch;
    utterance.rate = baseRate;
    utterance.volume = 1.0; 

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
