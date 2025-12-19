
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Puzzle, Zap, CheckCircle2, XCircle, Info, Star, Award, Sparkles, ZapOff, ArrowRight, Atom } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';

interface LogicGameScreenProps {
  onBack: () => void;
}

interface Crystal {
  id: string;
  name: string;
  emoji: string;
  color: string;
  glow: string;
}

const CRYSTALS: Crystal[] = [
  { id: 'red', name: 'Rubi de Marte', emoji: '🔻', color: 'text-red-500', glow: 'shadow-red-500/50' },
  { id: 'blue', name: 'Safira de Netuno', emoji: '🔹', color: 'text-blue-500', glow: 'shadow-blue-500/50' },
  { id: 'yellow', name: 'Topázio Solar', emoji: '🔸', color: 'text-yellow-400', glow: 'shadow-yellow-400/50' },
  { id: 'green', name: 'Esmeralda de Vênus', emoji: '🟩', color: 'text-emerald-500', glow: 'shadow-emerald-500/50' },
  { id: 'purple', name: 'Ametista de Plutão', emoji: '🟣', color: 'text-purple-500', glow: 'shadow-purple-500/50' },
];

interface LogicChallenge {
  type: 'alternância' | 'duplicação' | 'sequência_abc';
  sequence: Crystal[];
  answer: Crystal;
  explanation: string;
  scientificFact: string;
}

export const LogicGameScreen: React.FC<LogicGameScreenProps> = ({ onBack }) => {
  const [solvedCount, setSolvedCount] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'feedback'>('playing');
  const [challenge, setChallenge] = useState<LogicChallenge | null>(null);
  const [selectedCrystal, setSelectedCrystal] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const generateChallenge = () => {
    const typeRoll = Math.floor(Math.random() * 3);
    const c1 = CRYSTALS[Math.floor(Math.random() * CRYSTALS.length)];
    let c2 = CRYSTALS[Math.floor(Math.random() * CRYSTALS.length)];
    while (c2.id === c1.id) c2 = CRYSTALS[Math.floor(Math.random() * CRYSTALS.length)];
    let c3 = CRYSTALS[Math.floor(Math.random() * CRYSTALS.length)];
    while (c3.id === c1.id || c3.id === c2.id) c3 = CRYSTALS[Math.floor(Math.random() * CRYSTALS.length)];

    let sequence: Crystal[] = [];
    let answer: Crystal;
    let explanation = "";
    let scientificFact = "";

    if (typeRoll === 0) {
      // Alternância Simples (A-B-A-B-A-?)
      sequence = [c1, c2, c1, c2, c1];
      answer = c2;
      explanation = "Este é um padrão de alternância simples, como o bater de um coração!";
      scientificFact = "As cores que vemos são ondas de luz. O vermelho tem a onda mais longa e o roxo a mais curta!";
    } else if (typeRoll === 1) {
      // Duplicação (AA-BB-A-?)
      sequence = [c1, c1, c2, c2, c1];
      answer = c1;
      explanation = "Aqui os cristais gostam de andar em pares. O próximo precisa completar o par do último!";
      scientificFact = "Se você misturar todas as cores de luz (como esses cristais), você cria a luz branca!";
    } else {
      // Sequência ABC (A-B-C-A-B-?)
      sequence = [c1, c2, c3, c1, c2];
      answer = c3;
      explanation = "Este é um ciclo de três energias diferentes. O terceiro cristal fecha o ciclo.";
      scientificFact = "Sabia que alguns animais, como as abelhas, enxergam cores que os humanos não conseguem ver?";
    }

    setChallenge({ type: typeRoll === 0 ? 'alternância' : typeRoll === 1 ? 'duplicação' : 'sequência_abc', sequence, answer, explanation, scientificFact });
    setGameState('playing');
    setSelectedCrystal(null);
    setIsCorrect(null);
  };

  useEffect(() => { generateChallenge(); }, []);

  const handleGuess = (crystal: Crystal) => {
    if (gameState !== 'playing') return;
    const success = crystal.id === challenge?.answer.id;
    setSelectedCrystal(crystal.id);
    setIsCorrect(success);
    
    if (success) {
      setSolvedCount(s => s + 1);
      audioService.playSfx('success');
      if ((solvedCount + 1) % 5 === 0) confetti({ particleCount: 150, spread: 70, colors: ['#8b5cf6', '#3b82f6', '#10b981'] });
    } else {
      audioService.playSfx('error');
    }
    
    setTimeout(() => setGameState('feedback'), 600);
  };

  const getRank = () => {
    if (solvedCount < 5) return "Aprendiz de Alquimia";
    if (solvedCount < 15) return "Mestre dos Cristais";
    return "Grão-Mestre da Lógica";
  };

  const options = useMemo(() => {
    if (!challenge) return [];
    const others = CRYSTALS.filter(c => c.id !== challenge.answer.id).sort(() => Math.random() - 0.5).slice(0, 2);
    return [challenge.answer, ...others].sort(() => Math.random() - 0.5);
  }, [challenge]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Estética de Laboratório Espacial */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 right-10 animate-spin-slow"><Atom size={150} /></div>
          <div className="absolute bottom-10 left-10 animate-pulse"><Zap size={150} /></div>
      </div>

      {/* Header Futurista */}
      <header className="p-4 bg-slate-900/80 backdrop-blur-md border-b border-indigo-500/30 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-slate-800 p-2 rounded-xl hover:bg-indigo-900/50 transition border border-indigo-500/30">
            <ArrowLeft size={24} className="text-indigo-400" />
          </button>
          <div>
            <h1 className="font-heading text-lg text-indigo-300 flex items-center gap-2 tracking-tighter">
              <Zap className="text-yellow-400" size={20} fill="currentColor" /> Reator de Lógica
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">{getRank()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-indigo-950/50 px-4 py-1.5 rounded-full border border-indigo-500/30 flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles size={14} className="text-yellow-400" />
              <span className="font-mono text-sm font-bold">{solvedCount} Energias</span>
           </div>
           <button onClick={onBack} className="bg-white/5 p-1 rounded-xl border border-white/10 hover:scale-110 transition">
              <SparkyLogo size="sm" showText={false} />
           </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <AnimatePresence mode="wait">
          {gameState === 'playing' && challenge ? (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl flex flex-col items-center"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-heading text-white mb-2 uppercase tracking-tight">Fusão em Curso</h2>
                <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest bg-indigo-500/10 px-4 py-1 rounded-full border border-indigo-500/20">Identifique o cristal que falta no núcleo</p>
              </div>

              {/* Sequência de Cristais */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-5 mb-16 bg-slate-900/50 p-8 rounded-[3rem] border-2 border-indigo-500/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {challenge.sequence.map((crystal, i) => (
                  <motion.div 
                    key={i}
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-14 h-14 md:w-20 md:h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl md:text-6xl shadow-xl relative overflow-hidden group"
                  >
                     <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent`}></div>
                     <span className="drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{crystal.emoji}</span>
                  </motion.div>
                ))}
                
                {/* O Slot Vazio */}
                <div className="w-14 h-14 md:w-20 md:h-20 bg-indigo-500/10 rounded-2xl border-4 border-dashed border-indigo-500/40 flex items-center justify-center animate-pulse relative">
                   <div className="absolute inset-0 bg-indigo-500/5"></div>
                   <span className="text-2xl font-black text-indigo-500">?</span>
                </div>
              </div>

              {/* Opções de Escolha */}
              <div className="grid grid-cols-3 gap-6 w-full max-w-md">
                 {options.map((crystal) => (
                   <button 
                    key={crystal.id}
                    onClick={() => handleGuess(crystal)}
                    className={`
                      group relative aspect-square bg-slate-900 rounded-[2rem] border-2 transition-all duration-300
                      hover:scale-110 hover:-translate-y-2 flex flex-col items-center justify-center gap-2
                      ${selectedCrystal === crystal.id 
                        ? (isCorrect ? 'border-green-500 bg-green-500/10 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-red-500 bg-red-500/10 animate-shake') 
                        : 'border-slate-800 hover:border-indigo-400 shadow-lg'}
                    `}
                   >
                      <span className="text-4xl md:text-5xl drop-shadow-lg group-hover:rotate-12 transition-transform">{crystal.emoji}</span>
                      <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-indigo-300 transition-colors">{crystal.name}</span>
                   </button>
                 ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="feedback"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl text-center border-b-[16px] border-indigo-600 relative overflow-hidden border-x border-t border-white/5"
            >
               <div className={`absolute top-0 left-0 w-full h-3 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
               
               <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-8 shadow-inner ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isCorrect ? <CheckCircle2 size={60} strokeWidth={3} /> : <ZapOff size={60} strokeWidth={3} />}
               </div>

               <h2 className="text-3xl font-heading text-white mb-6 uppercase tracking-tight">
                 {isCorrect ? 'Frequência Estabilizada!' : 'Oscilação Detectada!'}
               </h2>

               <div className="bg-black/40 rounded-3xl p-6 border border-white/10 mb-8 text-left space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-indigo-400 font-black text-xs uppercase tracking-widest">
                       <Puzzle size={16} /> Lógica Aplicada
                    </div>
                    <p className="text-slate-300 font-bold leading-relaxed italic text-sm">
                      "{challenge?.explanation}"
                    </p>
                  </div>
                  
                  <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2 text-yellow-400 font-black text-[10px] uppercase tracking-tighter">
                       <Atom size={14} /> Fato de Cientista
                    </div>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                       {challenge?.scientificFact}
                    </p>
                  </div>
               </div>

               <Button onClick={generateChallenge} variant="primary" size="lg" className="w-full py-5 text-xl shadow-indigo-900/50 group bg-indigo-600 hover:bg-indigo-500 border-indigo-700">
                  ESTABILIZAR PRÓXIMO NÚCLEO <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Industrial */}
      <footer className="p-4 bg-slate-900/50 border-t border-white/5 flex justify-center gap-8">
         <div className="flex items-center gap-2 text-indigo-400">
            <Zap size={16} className="text-yellow-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Status: Reator Online</span>
         </div>
         <div className="flex items-center gap-2 text-indigo-400">
            <Info size={16} className="text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">IA: Analisando Padrões</span>
         </div>
      </footer>
    </div>
  );
};
