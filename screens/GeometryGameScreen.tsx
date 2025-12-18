
import React, { useState } from 'react';
import { ArrowLeft, Shapes, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';

interface GeometryGameScreenProps {
  onBack: () => void;
}

const SHAPES = [
    { name: 'Triângulo', sides: 3, path: 'M50 15 L90 85 L10 85 Z' },
    { name: 'Quadrado', sides: 4, path: 'M20 20 L80 20 L80 80 L20 80 Z' },
    { name: 'Pentágono', sides: 5, path: 'M50 10 L90 40 L75 90 L25 90 L10 40 Z' },
    { name: 'Hexágono', sides: 6, path: 'M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z' },
    { name: 'Círculo', sides: 0, path: 'M50 10 A40 40 0 1 1 50 90 A40 40 0 1 1 50 10' },
    { name: 'Losango', sides: 4, path: 'M50 10 L80 50 L50 90 L20 50 Z' },
];

export const GeometryGameScreen: React.FC<GeometryGameScreenProps> = ({ onBack }) => {
  const [currentShape, setCurrentShape] = useState(SHAPES[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [shake, setShake] = useState(false);

  React.useEffect(() => { nextShape(); }, []);

  const nextShape = () => {
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      setCurrentShape(shape);
      const wrongOptions = SHAPES.filter(s => s.name !== shape.name).sort(() => Math.random() - 0.5).slice(0, 2).map(s => s.name);
      setOptions([shape.name, ...wrongOptions].sort(() => Math.random() - 0.5));
  };

  const handleGuess = (guess: string) => {
      if (guess === currentShape.name) {
          audioService.playSfx('success'); confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } }); setScore(s => s + 1); setTimeout(nextShape, 500);
      } else {
          audioService.playSfx('error'); setShake(true); setTimeout(() => setShake(false), 500);
      }
  };

  return (
    <div className="min-h-screen bg-yellow-50 text-slate-800 flex flex-col font-sans">
      <div className="p-4 flex justify-between items-center z-10 bg-white/80 backdrop-blur-md border-b border-yellow-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-yellow-100 text-yellow-800 p-2 rounded-full hover:bg-yellow-200 transition">
             <ArrowLeft />
          </button>
          <h1 className="font-heading text-xl text-yellow-800 flex items-center gap-2">
             <Shapes /> Geometria Espacial
          </h1>
        </div>

        <div className="flex items-center gap-4">
            <div className="bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 font-bold text-sm hidden sm:block">Acertos: {score}</div>
            {/* Logo clicável para voltar ao Hub */}
            <button onClick={onBack} className="bg-white/80 p-1.5 rounded-xl border border-yellow-200 hover:scale-110 hover:rotate-3 transition-all group relative">
                <SparkyLogo size="sm" showText={false} />
                <span className="absolute -bottom-8 right-0 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">HUB PRINCIPAL</span>
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 gap-8">
          <motion.div className={`w-64 h-64 bg-white rounded-3xl shadow-xl flex items-center justify-center p-8 border-4 border-yellow-300 ${shake ? 'animate-shake border-red-400' : ''}`}>
              <motion.svg key={currentShape.name} viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                  <path d={currentShape.path} fill="#FACC15" stroke="#CA8A04" strokeWidth="3" />
              </motion.svg>
          </motion.div>
          <h2 className="text-xl font-bold text-slate-600">Qual é esta forma?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
              {options.map((opt, i) => (<button key={i} onClick={() => handleGuess(opt)} className="bg-white border-b-4 border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50 active:border-b-0 active:translate-y-1 text-slate-700 font-bold py-4 rounded-xl shadow-sm transition-all text-lg">{opt}</button>))}
          </div>
      </div>
    </div>
  );
};
