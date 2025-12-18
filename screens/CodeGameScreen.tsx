
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Code, Terminal, Play, Zap, CheckCircle, ArrowRight, RotateCcw, AlertCircle, Sparkles, Battery, Box, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { SparkyLogo } from '../components/SparkyLogo';
import { audioService } from '../services/AudioService';
import confetti from 'canvas-confetti';

interface CodeGameScreenProps {
  onBack: () => void;
}

interface CodeChallenge {
  id: number;
  title: string;
  scenario: string;
  codeSequence: string[];
  options: string[];
  correctOption: string;
  grid: number[][]; // 0: empty, 1: start, 2: goal, 3: wall
  startPos: { x: number, y: number };
  currentPos: { x: number, y: number }; // Onde o robô está antes do '?'
  goalPos: { x: number, y: number };
  trail: { x: number, y: number }[]; // Caminho já percorrido pelo código pronto
}

const CHALLENGES: CodeChallenge[] = [
  {
    id: 1,
    title: "Linha Reta",
    scenario: "O robô andou até a casa C2. Qual o último passo para pegar a bateria em D2?",
    codeSequence: ["Passo 1: Ir para B2", "Passo 2: Ir para C2", "Passo 3: ?"],
    options: ["Ir para D2", "Ir para C1", "Ir para B2"],
    correctOption: "Ir para D2",
    grid: [
      [0, 0, 0, 0, 0],
      [1, 0, 0, 2, 0],
      [0, 0, 0, 0, 0]
    ],
    startPos: { x: 0, y: 1 },
    currentPos: { x: 2, y: 1 },
    goalPos: { x: 3, y: 1 },
    trail: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }]
  },
  {
    id: 2,
    title: "Desvio do Muro",
    scenario: "O código já desviou do muro por cima! Agora ele precisa descer para a bateria.",
    codeSequence: ["Ir para A2", "Ir para B2", "Ir para C2", "?"],
    options: ["Ir para C3", "Ir para D2", "Ir para C1"],
    correctOption: "Ir para C3",
    grid: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 3, 0, 0, 0],
      [1, 0, 0, 2, 0]
    ],
    startPos: { x: 0, y: 3 },
    currentPos: { x: 2, y: 1 },
    goalPos: { x: 3, y: 3 },
    trail: [{ x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }]
  },
  {
    id: 3,
    title: "A Escada Lógica",
    scenario: "Estamos subindo! Olhe as coordenadas e escolha o próximo degrau.",
    codeSequence: ["Ir para B4", "Ir para B3", "Ir para C3", "?"],
    options: ["Ir para C2", "Ir para D3", "Ir para B3"],
    correctOption: "Ir para C2",
    grid: [
      [0, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 0, 0, 0]
    ],
    startPos: { x: 0, y: 3 },
    currentPos: { x: 2, y: 2 },
    goalPos: { x: 2, y: 0 },
    trail: [{ x: 0, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 }, { x: 2, y: 2 }]
  },
  {
    id: 4,
    title: "O Túnel Colorido",
    scenario: "Falta só um movimento para sair do túnel em E2.",
    codeSequence: ["Ir para B2", "Ir para C2", "Ir para D2", "?"],
    options: ["Ir para E2", "Ir para D1", "Ir para D3"],
    correctOption: "Ir para E2",
    grid: [
      [3, 3, 3, 3, 3, 3],
      [1, 0, 0, 0, 2, 0],
      [3, 3, 3, 3, 3, 3]
    ],
    startPos: { x: 0, y: 1 },
    currentPos: { x: 3, y: 1 },
    goalPos: { x: 4, y: 1 },
    trail: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }]
  },
  {
    id: 5,
    title: "Grande Final",
    scenario: "A bateria está logo ali na casa D1! Qual o comando?",
    codeSequence: ["Ir para A2", "Ir para B2", "Ir para C2", "Ir para D2", "?"],
    options: ["Ir para D1", "Ir para E2", "Ir para D3"],
    correctOption: "Ir para D1",
    grid: [
      [0, 0, 0, 2],
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    startPos: { x: 0, y: 2 },
    currentPos: { x: 3, y: 1 },
    goalPos: { x: 3, y: 0 },
    trail: [{ x: 0, y: 2 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }]
  }
];

export const CodeGameScreen: React.FC<CodeGameScreenProps> = ({ onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'victory'>('idle');
  const [solvedCount, setSolvedCount] = useState(0);

  const challenge = CHALLENGES[currentIdx % CHALLENGES.length];

  const handleSelect = (opt: string) => {
    if (status !== 'idle') return;
    setSelectedOption(opt);
    
    if (opt === challenge.correctOption) {
        setStatus('success');
        audioService.playSfx('success');
        setSolvedCount(s => s + 1);
        if (solvedCount + 1 >= 5) {
            setTimeout(() => {
                setStatus('victory');
                confetti({ particleCount: 150, spread: 70 });
            }, 1000);
        } else {
            setTimeout(() => {
                setStatus('idle');
                setSelectedOption(null);
                setCurrentIdx(c => c + 1);
            }, 1500);
        }
    } else {
        setStatus('error');
        audioService.playSfx('error');
        setTimeout(() => {
            setStatus('idle');
            setSelectedOption(null);
        }, 1200);
    }
  };

  const reset = () => {
    setSolvedCount(0);
    setStatus('idle');
    setSelectedOption(null);
    setCurrentIdx(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-400 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* Header Estilo Gamer */}
      <div className="p-4 flex justify-between items-center z-10 bg-slate-900 border-b-4 border-emerald-900/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="bg-slate-800 text-emerald-400 p-2 rounded-xl hover:bg-emerald-900/30 transition border-2 border-emerald-500/30 shadow-lg"><ArrowLeft /></button>
          <h1 className="font-heading text-xl flex items-center gap-2 tracking-wider">
             <Terminal size={24} className="text-emerald-500" /> Mestre do Código
          </h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="bg-emerald-500 text-slate-950 px-4 py-1 rounded-full font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                FASE {solvedCount + 1} / 5
            </div>
            <button onClick={onBack} className="bg-white/10 p-1 rounded-xl hover:scale-110 transition"><SparkyLogo size="sm" showText={false} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 gap-8">
        
        {/* GRID VISUAL COM COORDENADAS COLORIDAS */}
        <div className="w-full max-w-4xl flex flex-col items-center gap-4">
           <div className="bg-slate-900 p-6 md:p-8 rounded-[3rem] border-4 border-emerald-500/20 shadow-2xl relative overflow-hidden">
              
              {/* Coordenadas das Colunas */}
              <div className="flex gap-2 mb-2 ml-10">
                 {challenge.grid[0].map((_, i) => (
                    <div key={i} className="w-12 md:w-16 text-center text-sm font-black text-emerald-500/40 uppercase">
                       {String.fromCharCode(65 + i)}
                    </div>
                 ))}
              </div>

              <div className="flex flex-col gap-2">
                {challenge.grid.map((row, y) => (
                  <div key={y} className="flex gap-2 items-center">
                    
                    {/* Coordenadas das Linhas */}
                    <div className="w-8 text-sm font-black text-emerald-500/40 text-right mr-2">
                       {y + 1}
                    </div>

                    {row.map((cell, x) => {
                      const isTrail = challenge.trail.some(t => t.x === x && t.y === y);
                      const isGoal = x === challenge.goalPos.x && y === challenge.goalPos.y;
                      const isRobot = x === challenge.currentPos.x && y === challenge.currentPos.y;
                      
                      return (
                        <div 
                          key={`${x}-${y}`} 
                          className={`
                            w-12 h-12 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 relative
                            ${cell === 3 ? 'bg-slate-800 border-slate-700' : 'bg-slate-950/50 border-emerald-900/10'}
                            ${isTrail ? 'bg-emerald-500/5 border-emerald-500/20' : ''}
                          `}
                        >
                          {/* Trilha do Código */}
                          {isTrail && !isRobot && (
                            <div className="w-2 h-2 bg-emerald-500/30 rounded-full animate-pulse" />
                          )}

                          {/* O Robô na posição ATUAL do código */}
                          {isRobot && (
                            <motion.div 
                              layoutId="robot"
                              animate={{ scale: [1, 1.1, 1] }} 
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="text-3xl md:text-4xl drop-shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10"
                            >
                              🤖
                            </motion.div>
                          )}

                          {/* O Objetivo */}
                          {isGoal && (
                            <motion.div 
                              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }} 
                              transition={{ repeat: Infinity, duration: 2 }} 
                              className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] z-10"
                            >
                              <Battery size={36} fill="currentColor" />
                            </motion.div>
                          )}

                          {cell === 3 && <Box size={24} className="text-slate-700" />}
                          
                          {/* Texto de Coordenada sutil */}
                          <span className="absolute top-1 left-1 text-[8px] font-black text-slate-800 select-none">
                             {String.fromCharCode(65 + x)}{y + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* INTERFACE DE CÓDIGO E OPÇÕES */}
        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-stretch">
          
          {/* Editor de Código Visual */}
          <div className="flex-1 bg-slate-900 rounded-[2.5rem] border-4 border-emerald-900/30 overflow-hidden shadow-2xl">
            <div className="bg-slate-800 p-4 border-b-2 border-emerald-900/20 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs font-black uppercase text-slate-500 tracking-widest">LogicInterpreter.bot</span>
            </div>
            
            <div className="p-6 md:p-8 font-mono space-y-4">
                <div className="space-y-3">
                  {challenge.codeSequence.map((line, i) => (
                      <div key={i} className="flex items-center gap-4 group">
                        <span className="text-emerald-900 text-sm w-4 font-black">{i + 1}</span>
                        <div className={`
                          flex-1 p-4 rounded-2xl border-2 transition-all text-sm md:text-base font-bold
                          ${line === '?' 
                              ? (status === 'success' ? 'bg-emerald-500 border-emerald-400 text-slate-950 scale-[1.02]' : 'bg-slate-800 border-dashed border-emerald-500/30 text-emerald-500 animate-pulse')
                              : 'bg-slate-950 border-emerald-900/20 text-emerald-300/80'
                          }
                        `}>
                            {line === '?' ? (status === 'success' ? selectedOption : 'ESCOLHA O COMANDO...') : line}
                        </div>
                      </div>
                  ))}
                </div>

                <AnimatePresence>
                  {status === 'error' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 text-red-400 bg-red-400/10 p-4 rounded-2xl border-2 border-red-400/30 text-sm font-black mt-4">
                        <AlertCircle size={20} /> OPS! Esse comando não leva à bateria. Tente outro!
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </div>

          {/* Botões de Decisão */}
          <div className="w-full lg:w-96 flex flex-col gap-4">
            <div className="bg-emerald-900/20 p-6 rounded-[2rem] border-2 border-emerald-500/20 shadow-xl">
                <h2 className="text-lg font-black mb-2 text-white flex items-center gap-2">
                   <Zap size={20} className="text-yellow-400" /> Sua Missão
                </h2>
                <p className="text-emerald-100/70 text-sm leading-relaxed font-bold">{challenge.scenario}</p>
            </div>

            <div className="flex flex-col gap-3">
                {challenge.options.map((opt, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSelect(opt)}
                    disabled={status !== 'idle'}
                    className={`
                      p-5 rounded-[1.5rem] text-left font-black transition-all border-4 flex justify-between items-center group
                      ${selectedOption === opt 
                          ? (status === 'success' ? 'bg-emerald-500 border-emerald-400 text-slate-950 scale-105' : 'bg-red-500 border-red-400 text-white animate-shake')
                          : 'bg-slate-900 border-emerald-900/30 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-400/10 active:scale-95'
                      }
                      disabled:cursor-not-allowed
                    `}
                  >
                      <span className="truncate">{opt}</span>
                      <Terminal size={20} className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
            </div>
          </div>

        </div>
      </div>

      <AnimatePresence>
         {status === 'victory' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-slate-900 rounded-[3.5rem] p-10 text-center max-w-sm w-full border-4 border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.4)]">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 border-4 border-emerald-500">
                  <Sparkles size={56} className="animate-spin-slow" />
                </div>
                <h2 className="text-3xl font-heading text-white mb-2">Mestre do Debug!</h2>
                <p className="text-emerald-500/70 font-bold mb-8 italic">Você consertou o código e salvou o robô Sparky!</p>
                <div className="flex flex-col gap-3">
                  <Button onClick={onBack} variant="primary" className="w-full py-4 text-xl">Continuar Aventura</Button>
                  <button onClick={reset} className="text-slate-600 hover:text-emerald-400 font-bold flex items-center justify-center gap-2 transition-colors py-2">
                    <RotateCcw size={16} /> Reiniciar Teste
                  </button>
                </div>
              </motion.div>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};
