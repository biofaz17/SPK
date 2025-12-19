
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Shapes, CheckCircle2, XCircle, Info, Star, Award, Zap, Compass, ArrowRight, Volume2, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';

interface GeometryGameScreenProps {
  onBack: () => void;
}

interface ShapeData {
  id: string;
  name: string;
  sides: number;
  path: string;
  explanation: string;
  spaceFact: string;
}

const SHAPES: ShapeData[] = [
  { 
    id: 'tri', 
    name: 'Triângulo', 
    sides: 3, 
    path: 'M50 15 L90 85 L10 85 Z',
    explanation: "O triângulo é a forma mais forte da engenharia! Ele tem 3 lados e 3 pontas chamadas vértices.",
    spaceFact: "Muitas bases de foguetes usam estruturas triangulares para aguentar o peso do combustível!"
  },
  { 
    id: 'quad', 
    name: 'Quadrado', 
    sides: 4, 
    path: 'M20 20 L80 20 L80 80 L20 80 Z',
    explanation: "O quadrado tem 4 lados exatamente iguais. É perfeito para organizar compartimentos de carga.",
    spaceFact: "Os primeiros satélites tinham o corpo em formato de cubo para proteger os computadores lá dentro."
  },
  { 
    id: 'pent', 
    name: 'Pentágono', 
    sides: 5, 
    path: 'M50 10 L90 40 L75 90 L25 90 L10 40 Z',
    explanation: "Um pentágono tem 5 lados. Se você olhar de cima, uma casa com telhado parece um pentágono!",
    spaceFact: "Alguns cristais encontrados em meteoritos têm padrões que lembram pentágonos perfeitos."
  },
  { 
    id: 'hex', 
    name: 'Hexágono', 
    sides: 6, 
    path: 'M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z',
    explanation: "O hexágono tem 6 lados. É uma das formas mais inteligentes da natureza para preencher espaços.",
    spaceFact: "O espelho do super telescópio James Webb é feito de 18 hexágonos gigantes de ouro!"
  },
  { 
    id: 'circ', 
    name: 'Círculo', 
    sides: 0, 
    path: 'M50 10 A40 40 0 1 1 50 90 A40 40 0 1 1 50 10',
    explanation: "O círculo não tem lados retos nem pontas. Ele é uma linha infinita que se encontra!",
    spaceFact: "A gravidade faz com que os planetas e estrelas fiquem redondos como esferas no espaço."
  },
  { 
    id: 'los', 
    name: 'Losango', 
    sides: 4, 
    path: 'M50 10 L80 50 L50 90 L20 50 Z',
    explanation: "O losango parece um quadrado que se esticou! Ele também tem 4 lados.",
    spaceFact: "Padrões de losangos são usados em escudos de calor para naves que voltam para a Terra."
  },
];

export const GeometryGameScreen: React.FC<GeometryGameScreenProps> = ({ onBack }) => {
  const [solvedCount, setSolvedCount] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'feedback'>('playing');
  const [currentShape, setCurrentShape] = useState<ShapeData>(SHAPES[0]);
  const [options, setOptions] = useState<ShapeData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSparkyTalking, setIsSparkyTalking] = useState(false);

  const generateChallenge = () => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    setCurrentShape(shape);
    const others = SHAPES.filter(s => s.id !== shape.id).sort(() => Math.random() - 0.5).slice(0, 2);
    setOptions([shape, ...others].sort(() => Math.random() - 0.5));
    
    setGameState('playing');
    setSelectedId(null);
    setIsCorrect(null);

    // Instrução por voz
    const introText = `Telescópio ativado! Qual é o nome dessa forma geométrica?`;
    audioService.speak(introText, 'instruction', () => setIsSparkyTalking(true), () => setIsSparkyTalking(false));
  };

  useEffect(() => {
    generateChallenge();
    return () => audioService.stop();
  }, []);

  const handleGuess = (shape: ShapeData) => {
    if (gameState !== 'playing') return;
    const success = shape.id === currentShape.id;
    setSelectedId(shape.id);
    setIsCorrect(success);
    
    if (success) {
      setSolvedCount(s => s + 1);
      audioService.playSfx('success');
      if ((solvedCount + 1) % 5 === 0) confetti({ particleCount: 150, spread: 70, colors: ['#fbbf24', '#f59e0b', '#ffffff'] });
    } else {
      audioService.playSfx('error');
    }
    
    setTimeout(() => {
      setGameState('feedback');
      if (success) {
        audioService.speak(`Correto! ${currentShape.explanation}`, 'happy', () => setIsSparkyTalking(true), () => setIsSparkyTalking(false));
      } else {
        audioService.speak(`Quase lá, astrônomo! Vamos observar melhor os lados dessa forma?`, 'neutral', () => setIsSparkyTalking(true), () => setIsSparkyTalking(false));
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background de Estrelas e Grades */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Header Estilo NASA */}
      <header className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-blue-500/30 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-slate-800 p-2.5 rounded-xl hover:bg-blue-900/50 transition border border-blue-400/20 group">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="font-heading text-lg text-blue-300 flex items-center gap-2 tracking-tight">
              <Compass className="text-yellow-400" size={20} /> Observatório de Formas
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">Mapeamento Galáctico</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-blue-950/50 px-4 py-1.5 rounded-full border border-blue-500/30 flex items-center gap-2">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="font-mono text-sm font-bold">{solvedCount} Constelações</span>
           </div>
           <button 
            onClick={() => audioService.speak(currentShape.explanation)}
            className={`bg-white/5 p-1.5 rounded-xl border border-white/10 transition-all ${isSparkyTalking ? 'scale-125 border-yellow-400 ring-4 ring-yellow-500/20' : 'hover:scale-110'}`}
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
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl flex flex-col items-center"
            >
              {/* Visualizador do Telescópio */}
              <div className="relative mb-12 group">
                  {/* Moldura Holográfica */}
                  <div className="absolute -inset-8 border border-blue-500/20 rounded-full animate-spin-slow pointer-events-none"></div>
                  <div className="absolute -inset-4 border-2 border-blue-400/10 rounded-full animate-reverse-spin pointer-events-none"></div>
                  
                  <motion.div 
                    className="w-64 h-64 md:w-80 md:h-80 bg-slate-900/80 backdrop-blur-xl rounded-[3rem] border-4 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)] flex items-center justify-center p-12 relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                  >
                     {/* Linhas de Mira */}
                     <div className="absolute top-0 left-1/2 w-[1px] h-full bg-blue-500/10"></div>
                     <div className="absolute top-1/2 left-0 w-full h-[1px] bg-blue-500/10"></div>
                     
                     <motion.svg 
                        key={currentShape.id}
                        viewBox="0 0 100 100" 
                        className="w-full h-full drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 100 }}
                     >
                        <defs>
                           <linearGradient id="shapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#fbbf24" />
                              <stop offset="100%" stopColor="#f59e0b" />
                           </linearGradient>
                        </defs>
                        <path 
                          d={currentShape.path} 
                          fill="url(#shapeGrad)" 
                          stroke="#ffffff" 
                          strokeWidth="2" 
                          strokeLinejoin="round" 
                        />
                     </motion.svg>
                  </motion.div>
                  
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border border-blue-400">
                     Objeto Identificado
                  </div>
              </div>

              {/* Botões de Opções */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
                 {options.map((shape) => (
                   <button 
                    key={shape.id}
                    onClick={() => handleGuess(shape)}
                    className={`
                      group relative py-5 rounded-2xl border-2 transition-all duration-300 font-black text-lg
                      ${selectedId === shape.id 
                        ? (isCorrect ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-red-500 bg-red-500/10 text-red-400 animate-shake') 
                        : 'border-slate-800 bg-slate-900/50 hover:border-blue-400 hover:bg-slate-800 text-slate-300 hover:text-white'}
                    `}
                   >
                      {shape.name}
                      <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
                         <Shapes size={12} />
                      </div>
                   </button>
                 ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="feedback"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl bg-slate-900 rounded-[3rem] p-10 md:p-14 shadow-2xl text-center border-b-[20px] border-blue-600 relative overflow-hidden border-x border-t border-white/5"
            >
               <div className={`absolute top-0 left-0 w-full h-4 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
               
               <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-10 shadow-inner ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400 animate-shake'}`}>
                  {isCorrect ? <CheckCircle2 size={80} strokeWidth={3} /> : <XCircle size={80} strokeWidth={3} />}
               </div>

               <h2 className="text-4xl font-heading text-white mb-8 uppercase tracking-tighter">
                 {isCorrect ? 'Análise Completa!' : 'Sinal Instável!'}
               </h2>

               <div className="bg-black/40 rounded-[2.5rem] p-8 border border-white/10 mb-10 text-left space-y-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-blue-400 font-black text-xs uppercase tracking-widest">
                       <Info size={18} /> Propriedades do Objeto
                    </div>
                    <p className="text-slate-200 font-bold leading-relaxed italic text-lg">
                      "{isCorrect ? currentShape.explanation : 'Essa forma tem um número diferente de lados. Vamos tentar de novo para calibrar o telescópio?'}"
                    </p>
                  </div>
                  
                  {isCorrect && (
                    <div className="pt-8 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-3 text-yellow-400 font-black text-[11px] uppercase tracking-[0.2em]">
                         <Rocket size={16} /> Diário do Astronauta
                      </div>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed">
                         {currentShape.spaceFact}
                      </p>
                    </div>
                  )}
               </div>

               <Button onClick={generateChallenge} variant="primary" size="lg" className="w-full py-6 text-2xl shadow-blue-900/50 group bg-blue-600 hover:bg-blue-500 border-blue-700">
                  {isCorrect ? (
                    <>PRÓXIMA COORDENADA <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" /></>
                  ) : (
                    <>REESCANEAR OBJETO <ArrowLeft className="mr-2 group-hover:-translate-x-2 transition-transform" /></>
                  )}
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Industrial */}
      <footer className="p-5 bg-slate-900/80 border-t border-white/5 flex justify-center gap-12 backdrop-blur-md">
         <div className="flex items-center gap-3 text-blue-400">
            <Compass size={20} className="animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Scanner: Ativo</span>
         </div>
         <div className="flex items-center gap-3 text-blue-400">
            <Shapes size={20} className="text-blue-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">IA: Calculando Vértices</span>
         </div>
      </footer>
    </div>
  );
};
