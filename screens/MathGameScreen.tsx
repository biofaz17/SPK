
import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Wand2, Star, Trophy } from 'lucide-react';
import { Button } from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';

interface MathGameScreenProps {
  onBack: () => void;
}

export const MathGameScreen: React.FC<MathGameScreenProps> = ({ onBack }) => {
  const [score, setScore] = useState(0);
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
          setGameState('correct');
          setMonsterHp(prev => prev - 1);
          if (monsterHp <= 1) {
             setTimeout(() => { setGameState('victory'); confetti(); }, 800);
          } else {
             setTimeout(() => { setGameState('playing'); generateQuestion(); }, 1000);
          }
      } else {
          setGameState('wrong');
          setHeroHp(prev => prev - 1);
          setTimeout(() => {
             if (heroHp <= 1) {
                 alert("Sua energia mágica acabou! Tente novamente.");
                 setHeroHp(3); setMonsterHp(3);
             }
             setGameState('playing');
          }, 1000);
      }
  };

  const nextLevel = () => { setLevel(prev => prev + 1); setMonsterHp(3); setGameState('playing'); generateQuestion(); };

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
             <div className="bg-slate-900 px-4 py-1 rounded-full border border-emerald-500/30 text-emerald-400 font-bold hidden sm:block">
                Nível {level}
             </div>
             {/* Logo clicável para voltar ao Hub */}
             <button onClick={onBack} className="bg-white/10 p-1.5 rounded-xl border border-white/20 hover:scale-110 hover:rotate-3 transition-all group relative">
                <SparkyLogo size="sm" showText={false} />
                <span className="absolute -bottom-8 right-0 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">HUB PRINCIPAL</span>
             </button>
          </div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="flex w-full max-w-2xl justify-between items-end mb-12 px-4 relative">
              <AnimatePresence>
                 {gameState === 'correct' && (
                    <motion.div initial={{ left: 50, bottom: 50, scale: 0.5, opacity: 1 }} animate={{ left: "80%", bottom: "50%", scale: 2, opacity: 0 }} className="absolute w-20 h-20 bg-emerald-400 rounded-full blur-xl z-20" />
                 )}
              </AnimatePresence>
              <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1 mb-2">
                     {[...Array(3)].map((_, i) => (<div key={i} className={`w-3 h-3 rounded-full ${i < heroHp ? 'bg-red-500' : 'bg-slate-700'}`} />))}
                  </div>
                  <motion.div animate={gameState === 'correct' ? { y: [0, -20, 0] } : {}} className="text-6xl md:text-8xl filter drop-shadow-2xl">🧙‍♂️</motion.div>
                  <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-300">Você</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1 mb-2">
                     {[...Array(3)].map((_, i) => (<div key={i} className={`w-3 h-3 rounded-full ${i < monsterHp ? 'bg-purple-500' : 'bg-slate-700'}`} />))}
                  </div>
                  <motion.div animate={gameState === 'correct' ? { x: [0, 10, -10, 0], opacity: [1, 0.5, 1] } : {}} className="text-6xl md:text-8xl filter drop-shadow-2xl grayscale-[0.2]">{level === 1 ? '👾' : (level === 2 ? '👹' : '🐉')}</motion.div>
                  <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-300">Monstro</div>
              </div>
          </div>
          {gameState === 'victory' ? (
             <div className="bg-slate-800/90 p-8 rounded-3xl border-4 border-emerald-500 text-center animate-popIn">
                 <Trophy size={64} className="text-yellow-400 mx-auto mb-4" />
                 <h2 className="text-3xl font-heading text-white mb-2">Monstro Derrotado!</h2>
                 <p className="text-slate-300 mb-6">Você usou sua magia matemática.</p>
                 <Button onClick={nextLevel} variant="success" size="lg">Próximo Desafio</Button>
             </div>
          ) : (
             <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-lg p-8 rounded-[2rem] border-2 border-slate-700 shadow-2xl">
                 <div className="text-center mb-8">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Resolva para lançar o feitiço</p>
                    <div className="text-5xl font-black text-white bg-slate-900/50 p-4 rounded-xl border border-slate-600 inline-block min-w-[200px]">{question.q} = ?</div>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    {question.options.map((opt, i) => (
                        <button key={i} onClick={() => handleAnswer(opt)} className={`py-4 rounded-xl text-2xl font-black transition-all transform active:scale-95 ${gameState === 'wrong' ? 'bg-red-900/50 border-red-500' : 'bg-slate-700 hover:bg-emerald-600 border-b-4 border-slate-900 hover:border-emerald-800'}`}>{opt}</button>
                    ))}
                 </div>
             </div>
          )}
       </div>
    </div>
  );
};
