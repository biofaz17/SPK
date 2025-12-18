
import React, { useState } from 'react';
import { ArrowLeft, Puzzle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';

interface LogicGameScreenProps {
  onBack: () => void;
}

const SHAPES = ['🟥', '🟦', '🟨', '🟩', '🟣', '🟧'];

export const LogicGameScreen: React.FC<LogicGameScreenProps> = ({ onBack }) => {
  const [sequence, setSequence] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isWrong, setIsWrong] = useState(false);

  React.useEffect(() => {
     generatePattern();
  }, []);

  const generatePattern = () => {
      setIsWrong(false);
      // Padrões: ABAB, AABB, ABC, AAB
      const patternType = Math.floor(Math.random() * 3); 
      const s1 = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      let s2 = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      while(s1 === s2) s2 = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      let s3 = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      
      let seq: string[] = [];
      let ans = '';

      if (patternType === 0) { // ABAB...
          seq = [s1, s2, s1, s2, s1];
          ans = s2;
      } else if (patternType === 1) { // AABB...
          seq = [s1, s1, s2, s2, s1];
          ans = s1;
      } else { // ABC...
          seq = [s1, s2, s3, s1, s2];
          ans = s3;
      }

      setSequence(seq);
      setAnswer(ans);
      
      // Opções
      const wrong = SHAPES.filter(s => s !== ans).sort(() => Math.random() - 0.5).slice(0, 2);
      setOptions([ans, ...wrong].sort(() => Math.random() - 0.5));
  };

  const handleGuess = (guess: string) => {
      if (guess === answer) {
          audioService.playSfx('success');
          confetti({ particleCount: 30, spread: 50 });
          setScore(s => s + 1);
          setTimeout(generatePattern, 500);
      } else {
          audioService.playSfx('error');
          setIsWrong(true);
          setTimeout(() => setIsWrong(false), 500);
      }
  };

  return (
    <div className="min-h-screen bg-indigo-50 text-slate-800 flex flex-col font-sans">
      <div className="p-4 flex justify-between items-center z-10 bg-white/80 backdrop-blur-md border-b border-indigo-200">
        <button onClick={onBack} className="bg-indigo-100 text-indigo-800 p-2 rounded-full hover:bg-indigo-200 transition">
           <ArrowLeft />
        </button>
        <h1 className="font-heading text-xl text-indigo-800 flex items-center gap-2">
           <Puzzle /> Lógica de Cores
        </h1>
        <div className="bg-indigo-100 px-3 py-1 rounded-full text-indigo-800 font-bold text-sm">
           Pontos: {score}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 gap-10">
          <div className="text-center">
             <h2 className="text-2xl font-bold text-indigo-900 mb-2">Complete a Sequência</h2>
             <p className="text-indigo-600">Qual é a próxima peça?</p>
          </div>

          <div className="flex gap-2 md:gap-4 bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 items-center justify-center flex-wrap">
              {sequence.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-4xl md:text-6xl"
                  >
                      {item}
                  </motion.div>
              ))}
              <div className={`w-12 md:w-16 h-12 md:h-16 bg-slate-100 rounded-lg border-4 border-dashed border-slate-300 flex items-center justify-center ${isWrong ? 'bg-red-100 border-red-300 animate-shake' : 'animate-pulse'}`}>
                  <HelpCircle className={isWrong ? "text-red-400" : "text-slate-400"} />
              </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
              {options.map((opt, i) => (
                  <button 
                     key={i}
                     onClick={() => handleGuess(opt)}
                     className="text-5xl md:text-6xl p-6 bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 active:translate-y-0 border-b-8 active:border-b-0 border-indigo-100 transition-all"
                  >
                      {opt}
                  </button>
              ))}
          </div>
      </div>
    </div>
  );
};
