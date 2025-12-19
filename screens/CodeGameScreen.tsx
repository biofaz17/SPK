
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Terminal, Play, CheckCircle2, XCircle, Star, Award, Zap, Settings, Cpu, Wrench, RefreshCcw, ArrowRight, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';

interface CodeGameScreenProps {
  onBack: () => void;
}

interface RepairMission {
  id: number;
  title: string;
  category: "Sequência" | "Loops" | "Condicional";
  machineName: string;
  problemEmoji: string;
  brokenCode: string[];
  options: { label: string; block: string; isCorrect: boolean }[];
  explanation: string;
  programmingConcept: string;
  successAnimation: string;
}

const MISSIONS: RepairMission[] = [
  {
    id: 1,
    title: "A Fábrica de Sanduíches",
    category: "Sequência",
    machineName: "Sanduicheria 3000",
    problemEmoji: "🥪",
    brokenCode: ["1. Pegar o Pão", "2. Colocar o Queijo", "3. ???"],
    options: [
      { label: "Comer o pão", block: "3. Comer o Pão", isCorrect: false },
      { label: "Fechar o pão", block: "3. Fechar o Pão", isCorrect: true },
      { label: "Lavar as mãos", block: "3. Lavar as mãos", isCorrect: false }
    ],
    explanation: "Em programação, a ordem importa muito! Primeiro preparamos, depois fechamos. Se você comer antes, o sanduíche some!",
    programmingConcept: "Algoritmos: Uma lista de passos que devem seguir uma ordem exata para dar certo.",
    successAnimation: "🥪✨"
  },
  {
    id: 2,
    title: "O Robô Dançarino",
    category: "Loops",
    machineName: "Bailarino-Bot",
    problemEmoji: "💃",
    brokenCode: ["1. Braço para cima", "2. Braço para baixo", "3. REPETIR 3 VEZES:"],
    options: [
      { label: "Dê um giro", block: "-> Girar no Lugar", isCorrect: true },
      { label: "Dormir", block: "-> Desligar", isCorrect: false },
      { label: "Pular 1x", block: "-> Pular 1x", isCorrect: false }
    ],
    explanation: "Os Loops são como mágicas que repetem movimentos! O robô agora vai girar três vezes seguidas para o show!",
    programmingConcept: "Loops: Blocos que repetem tarefas sozinhos para a gente não ter que escrever o mesmo comando várias vezes.",
    successAnimation: "💃🌀🔥"
  },
  {
    id: 3,
    title: "O Sensor de Chuva",
    category: "Condicional",
    machineName: "Janela Inteligente",
    problemEmoji: "🏠",
    brokenCode: ["SE (Sensor detectar Chuva 🌧️) ENTÃO:", "1. Fechar a Janela", "SENÃO (Se estiver Sol ☀️):"],
    options: [
      { label: "Abrir guarda-chuva", block: "2. Abrir Guarda-chuva", isCorrect: false },
      { label: "Abrir a Janela", block: "2. Abrir a Janela", isCorrect: true },
      { label: "Ficar triste", block: "2. Chorar", isCorrect: false }
    ],
    explanation: "O computador sabe tomar decisões! Se não está chovendo, ele escolhe abrir a janela para entrar um ventinho.",
    programmingConcept: "Condicionais: Fazem o programa escolher entre dois caminhos diferentes, dependendo da resposta de uma pergunta.",
    successAnimation: "☀️🪟🔓"
  },
  {
    id: 4,
    title: "A Máquina de Sorvete",
    category: "Sequência",
    machineName: "Gelato-Matic",
    problemEmoji: "🍦",
    brokenCode: ["1. Colocar a Casquinha", "2. ???", "3. Por a Calda de Chocolate"],
    options: [
      { label: "Ligar o freezer", block: "2. Ligar o Freezer", isCorrect: false },
      { label: "Por a bola de sorvete", block: "2. Por a Bola de Sorvete", isCorrect: true },
      { label: "Dançar", block: "2. Dançar", isCorrect: false }
    ],
    explanation: "Não dá para colocar calda se não tiver sorvete dentro da casquinha! Todo passo é importante no código.",
    programmingConcept: "Lógica de Fluxo: É entender que cada ação prepara o terreno para a próxima.",
    successAnimation: "🍦🍫😋"
  }
];

export const CodeGameScreen: React.FC<CodeGameScreenProps> = ({ onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'feedback'>('playing');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isSparkyTalking, setIsSparkyTalking] = useState(false);

  const mission = MISSIONS[currentIdx % MISSIONS.length];

  useEffect(() => {
    const text = `Oi engenheiro! Vamos consertar a ${mission.machineName}! Missão: ${mission.title}. O que falta nesse código?`;
    const timer = setTimeout(() => {
        audioService.speak(text, 'instruction', () => setIsSparkyTalking(true), () => setIsSparkyTalking(false));
    }, 500);
    return () => {
        clearTimeout(timer);
        audioService.stop();
    };
  }, [currentIdx]);

  const handleSelect = (idx: number, correct: boolean) => {
    if (gameState !== 'playing') return;
    setSelectedOption(idx);
    setIsCorrect(correct);
    
    if (correct) {
      setScore(s => s + 20);
      audioService.playSfx('success');
      confetti({ particleCount: 150, spread: 80, colors: ['#10b981', '#3b82f6', '#fbbf24'] });
    } else {
      audioService.playSfx('error');
    }
    
    setTimeout(() => {
      setGameState('feedback');
      if (correct) {
        audioService.speak(`Incrível! ${mission.explanation}`, 'happy', () => setIsSparkyTalking(true), () => setIsSparkyTalking(false));
      } else {
        audioService.speak(`Puxa, quase lá! Esse comando não encaixa bem aí. Vamos tentar outro?`, 'neutral', () => setIsSparkyTalking(true), () => setIsSparkyTalking(false));
      }
    }, 600);
  };

  const nextMission = () => {
    setCurrentIdx(prev => prev + 1);
    setGameState('playing');
    setSelectedOption(null);
    setIsCorrect(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Decoração Tech */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-20 left-20"><Wrench size={160} /></div>
          <div className="absolute bottom-20 right-20"><Settings size={200} className="animate-spin-slow" /></div>
      </div>

      {/* Header Estilo Terminal */}
      <header className="p-4 bg-slate-800/90 backdrop-blur-md border-b-4 border-indigo-500/30 flex justify-between items-center z-20 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-slate-700 p-2.5 rounded-2xl hover:bg-indigo-600 transition border border-white/10 shadow-lg group">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="font-heading text-xl text-indigo-300 flex items-center gap-2">
              <Terminal size={22} className="text-emerald-400" /> Sparky-Conserta
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Oficina de Bugs</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-slate-950 px-5 py-2 rounded-full border border-indigo-500/40 flex items-center gap-2 shadow-inner">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="font-mono text-lg font-black">{score}</span>
           </div>
           <button 
            onClick={() => audioService.speak(mission.explanation)}
            className={`p-1.5 rounded-2xl bg-white/5 border border-white/10 transition-all ${isSparkyTalking ? 'scale-125 border-emerald-400 ring-4 ring-emerald-500/30' : 'hover:scale-110'}`}
           >
              <SparkyLogo size="sm" showText={false} />
           </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <AnimatePresence mode="wait">
          {gameState === 'playing' ? (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center"
            >
              {/* Lado da Máquina */}
              <div className="flex flex-col items-center">
                 <div className="relative mb-10">
                    <div className="absolute inset-0 bg-indigo-500/30 blur-[100px] rounded-full"></div>
                    <div className="relative bg-slate-800/80 backdrop-blur-md p-12 rounded-[4rem] border-4 border-slate-700 shadow-2xl overflow-hidden group">
                       <div className="text-[10rem] mb-4 animate-bounce-subtle drop-shadow-2xl filter group-hover:brightness-110 transition-all">{mission.problemEmoji}</div>
                       <div className="bg-red-500/20 text-red-400 px-6 py-2 rounded-full text-xs font-black uppercase text-center border border-red-500/30 shadow-sm">
                          Sistema Bugado! 👾
                       </div>
                    </div>
                 </div>
                 <h2 className="text-3xl font-heading text-center text-white mb-2">{mission.machineName}</h2>
                 <p className="text-indigo-300 font-bold text-center bg-indigo-500/10 px-6 py-2 rounded-2xl border border-indigo-500/20 flex items-center gap-2">
                    <Cpu size={18} className={isSparkyTalking ? 'animate-pulse' : ''} /> {mission.title}
                 </p>
              </div>

              {/* Lado do Código */}
              <div className="bg-slate-950 rounded-[3rem] border-4 border-slate-800 overflow-hidden shadow-2xl flex flex-col h-full border-b-[16px] border-b-slate-800">
                 <div className="bg-slate-800/80 p-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex gap-2">
                       <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-lg shadow-red-500/20"></div>
                       <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/20"></div>
                       <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-lg shadow-green-500/20"></div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">REPAIR_SCRIPT_V2.0</span>
                 </div>

                 <div className="p-10 space-y-6 flex-1">
                    <div className="space-y-4 font-mono">
                       {mission.brokenCode.map((line, i) => (
                          <div key={i} className={`p-5 rounded-2xl text-base md:text-lg font-bold transition-all ${line.includes('???') ? 'bg-indigo-500/10 border-2 border-dashed border-indigo-500/50 text-indigo-400 animate-pulse' : 'bg-slate-900/50 border border-white/5 text-slate-400 opacity-60'}`}>
                             {line}
                          </div>
                       ))}
                    </div>

                    <div className="pt-8 space-y-4">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                         <Volume2 size={12}/> Escolha a peça que falta:
                       </p>
                       <div className="grid gap-3">
                          {mission.options.map((opt, i) => (
                              <button 
                                key={i}
                                onClick={() => handleSelect(i, opt.isCorrect)}
                                className={`w-full p-5 rounded-3xl border-2 font-black text-left transition-all hover:scale-[1.02] active:scale-95 shadow-lg
                                  ${selectedOption === i 
                                    ? (opt.isCorrect ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'bg-red-500 border-red-400 text-white animate-shake') 
                                    : 'bg-slate-800 border-white/5 text-slate-200 hover:border-indigo-500/50 hover:bg-slate-700'}
                                `}
                              >
                                {opt.block}
                              </button>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="feedback"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl bg-white rounded-[4rem] p-10 md:p-14 shadow-[0_0_100px_rgba(0,0,0,0.5)] text-center border-b-[20px] border-indigo-600 relative overflow-hidden"
            >
               <div className={`absolute top-0 left-0 w-full h-4 ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
               
               <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-10 shadow-inner ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600 animate-shake'}`}>
                  {isCorrect ? <CheckCircle2 size={70} strokeWidth={3} /> : <XCircle size={70} strokeWidth={3} />}
               </div>

               <h2 className="text-4xl font-heading text-slate-800 mb-8 uppercase tracking-tighter">
                 {isCorrect ? 'Conserto Perfeito!' : 'Iih, deu erro!'}
               </h2>

               <div className="bg-slate-50 rounded-[2.5rem] p-8 border-2 border-slate-100 mb-10 text-left">
                  <div className="flex items-center gap-2 mb-4 text-indigo-600 font-black text-xs uppercase tracking-widest">
                     <Volume2 size={18} className={isSparkyTalking ? 'animate-pulse' : ''} /> Conversa do Sparky
                  </div>
                  <p className="text-slate-600 font-bold leading-relaxed mb-8 italic text-lg">
                    "{isCorrect ? mission.explanation : 'Ah não! Se usarmos isso, o motor vai engasgar. Vamos ver se a ordem dos passos está certinha?'}"
                  </p>
                  
                  {isCorrect && (
                    <div className="pt-8 border-t-2 border-slate-100">
                      <div className="flex items-center gap-2 mb-3 text-emerald-600 font-black text-[11px] uppercase tracking-widest">
                         <Zap size={16} fill="currentColor" /> Lição do Engenheiro
                      </div>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">
                         {mission.programmingConcept}
                      </p>
                    </div>
                  )}
               </div>

               <Button onClick={isCorrect ? nextMission : () => setGameState('playing')} variant={isCorrect ? "success" : "primary"} size="lg" className="w-full py-6 text-2xl shadow-indigo-200 group">
                  {isCorrect ? (
                    <>PRÓXIMO TRABALHO <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" /></>
                  ) : (
                    <>TENTAR DE NOVO <RefreshCcw className="ml-2 group-hover:rotate-180 transition-transform duration-500" /></>
                  )}
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Estilizado */}
      <footer className="p-5 bg-slate-950/80 border-t border-white/5 flex justify-center gap-12 backdrop-blur-md">
         <div className="flex items-center gap-3 text-indigo-400">
            <Cpu size={18} className="animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Cérebro: Conectado</span>
         </div>
         <div className="flex items-center gap-3 text-indigo-400">
            <Award size={18} className="text-yellow-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Peças de Ouro: {Math.floor(score/40)}</span>
         </div>
      </footer>
    </div>
  );
};
