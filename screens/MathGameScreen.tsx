
import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Wand2, Star, Trophy, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';

interface MathGameScreenProps {
  onBack: () => void;
}

export const MathGameScreen: React.FC<MathGameScreenProps> = ({ onBack }) => {
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState({ q: '', a: 0, options: [] as number[] });
  const [gameState, setGameState] = useState<'playing' | 'correct' | 'wrong' | 'victory'>('playing');
  const [heroHp, setHeroHp] = useState(3);
  const [monsterHp, setMonsterHp] = useState(3);

  const generateQuestion = () => {
    const num1 = Math.floor(Math.random() * (5 * level)) + 1;
    const num2 = Math.floor(Math.random() * (5 * level)) + 1;
    const isPlus = Math.random() > 0.5;
    const ans = isPlus ? num1 + num2 : (num1 > num2 ? num1 - num2 : num1 + num2);
    const displayQ = isPlus ? `${num1} + ${num2}` : (num1 > num2 ? `${num1} - ${num2}` : `${num1} + ${num2}`);
    const opts = new Set<number>();
    opts.add(ans);
    while(opts.size < 3) opts.add(ans + Math.floor(Math.random() * 5) - 2);
    setQuestion({ q: displayQ, a: ans, options: Array.from(opts).sort(() => Math.random() - 0.5) });
  };

  useEffect(() => { generateQuestion(); }, [level]);

  const handleAnswer = (ans: number) => {
      if (gameState !== 'playing') return;
      if (ans === question.a) {
          const newMonsterHp = monsterHp - 1;
          setMonsterHp(newMonsterHp);
          setGameState('correct');
          
          if (newMonsterHp <= 0) {
             // Aguarda 1 segundo antes de mostrar a vitória
             setTimeout(() => { 
                 setGameState('victory'); 
                 confetti({ particleCount: 150, spread: 70 }); 
             }, 1000);
          } else {
             setTimeout(() => { 
                 setGameState('playing'); 
                 generateQuestion(); 
             }, 1000);
          }
      } else {
          setGameState('wrong');
          setHeroHp(prev => prev - 1);
          setTimeout(() => {
             if (heroHp <= 1) {
                 setHeroHp(3); 
                 setMonsterHp(3);
             }
             setGameState('playing');
          }, 1000);
      }
  };

  const nextLevel = () => { 
    setLevel(prev => prev + 1); 
    setMonsterHp(3); 
    setHeroHp(3);
    setGameState('playing'); 
    generateQuestion(); 
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col relative overflow-hidden font-sans">
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20"></div>
       
       <div className="p-4 flex justify-between items-center z-10 bg-slate-800/50 backdrop-blur-md border-b border-slate-700">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="bg-slate-700 p-2 rounded-full hover:bg-slate-600 transition">
                <ArrowLeft />
            </button>
            <h1 className="font-heading text-xl text-emerald-400 flex items-center gap-2">
                <Wand2 /> Mago da Matemática
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-slate-900 px-4 py-1 rounded-full border border-emerald-500/30 text-emerald-400 font-bold">
                Nível {level}
             </div>
             <button onClick={onBack} className="bg-white/10 p-1.5 rounded-xl border border-white/20 hover:scale-110 transition-all group relative">
                <SparkyLogo size="sm" showText={false} />
             </button>
          </div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="flex w-full max-w-2xl justify-between items-end mb-12 px-4 relative">
              <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1 mb-2">
                     {[...Array(3)].map((_, i) => (<div key={i} className={`w-3 h-3 rounded-full ${i < heroHp ? 'bg-red-500' : 'bg-slate-700'}`} />))}
                  </div>
                  <motion.div animate={gameState === 'correct' ? { y: [0, -20, 0] } : {}} className="text-6xl md:text-8xl">🧙‍♂️</motion.div>
              </div>
              <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1 mb-2">
                     {[...Array(3)].map((_, i) => (<div key={i} className={`w-3 h-3 rounded-full ${i < monsterHp ? 'bg-purple-500' : 'bg-slate-700'}`} />))}
                  </div>
                  <motion.div animate={gameState === 'correct' ? { x: [0, 10, -10, 0], opacity: [1, 0.5, 1] } : {}} className="text-6xl md:text-8xl grayscale-[0.2]">{level % 3 === 0 ? '🐉' : (level % 2 === 0 ? '👹' : '👾')}</motion.div>
              </div>
          </div>

          <AnimatePresence>
            {gameState === 'victory' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] p-10 text-center max-w-sm w-full border-b-[12px] border-emerald-500">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                    <CheckCircle size={48} />
                  </div>
                  <h2 className="text-3xl font-heading text-slate-800 mb-2">Vitória Mágica!</h2>
                  <p className="text-slate-500 font-bold mb-8">O monstro foi derrotado pela sua inteligência!</p>
                  <Button onClick={nextLevel} variant="success" className="w-full py-4 text-xl">
                    Próximo Desafio <ArrowRight className="ml-2" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-lg p-8 rounded-[2rem] border-2 border-slate-700 shadow-2xl">
              <div className="text-center mb-8">
                 <div className="text-5xl font-black text-white bg-slate-900/50 p-4 rounded-xl border border-slate-600 inline-block min-w-[200px]">{question.q} = ?</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                 {question.options.map((opt, i) => (
                     <button key={i} onClick={() => handleAnswer(opt)} className="py-4 rounded-xl text-2xl font-black bg-slate-700 hover:bg-emerald-600 transition-all active:scale-95 border-b-4 border-slate-900">{opt}</button>
                 ))}
              </div>
          </div>
       </div>
    </div>
  );
};
