
import React, { useState, useEffect } from 'react';
// Added ArrowRight to imports to fix "Cannot find name 'ArrowRight'" error
import { ArrowLeft, FlaskConical, CheckCircle2, XCircle, Info, Star, Award, Zap, Heart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';

interface ScienceGameScreenProps {
  onBack: () => void;
}

interface FeedingMission {
  id: number;
  animal: string;
  animalEmoji: string;
  food: string;
  foodEmoji: string;
  isCorrect: boolean;
  explanation: string;
  funFact: string;
}

const MISSIONS: FeedingMission[] = [
  {
    id: 1,
    animal: "Panda Gigante",
    animalEmoji: "🐼",
    food: "Bambu fresquinho",
    foodEmoji: "🎋",
    isCorrect: true,
    explanation: "Pandas passam quase 12 horas por dia comendo bambu!",
    funFact: "O bambu é 99% da dieta de um panda. Eles têm um 'polegar' extra só para segurar as hastes!"
  },
  {
    id: 2,
    animal: "Tubarão Branco",
    animalEmoji: "🦈",
    food: "Alface e Cenoura",
    foodEmoji: "🥗",
    isCorrect: false,
    explanation: "Tubarões são carnívoros natos, eles precisam de peixes e focas.",
    funFact: "Tubarões não têm ossos! O corpo deles é feito de cartilagem, o mesmo material da sua orelha."
  },
  {
    id: 3,
    animal: "Girafa",
    animalEmoji: "🦒",
    food: "Folhas de Acácia (árvore alta)",
    foodEmoji: "🌿",
    isCorrect: true,
    explanation: "Com seus pescoços longos, elas alcançam as folhas mais altas que ninguém vê.",
    funFact: "A língua da girafa é azul-escura para não queimar com o sol enquanto ela come o dia todo!"
  },
  {
    id: 4,
    animal: "Leão",
    animalEmoji: "🦁",
    food: "Melancia doce",
    foodEmoji: "🍉",
    isCorrect: false,
    explanation: "Leões são carnívoros 'obrigatórios', seu estômago só digere carne.",
    funFact: "O rugido de um leão pode ser ouvido a até 8 quilômetros de distância!"
  },
  {
    id: 5,
    animal: "Coelho",
    animalEmoji: "🐰",
    food: "Cenoura com casca",
    foodEmoji: "🥕",
    isCorrect: true,
    explanation: "Cenouras e vegetais ajudam a desgastar os dentes que nunca param de crescer.",
    funFact: "Coelhos pulam de alegria! Esse comportamento se chama 'binky' quando eles giram no ar."
  },
  {
    id: 6,
    animal: "Tartaruga Marinha",
    animalEmoji: "🐢",
    food: "Água-viva",
    foodEmoji: "👾",
    isCorrect: true,
    explanation: "Muitas tartarugas amam comer águas-vivas, elas são imunes ao veneno!",
    funFact: "As tartarugas marinhas existem desde a época dos dinossauros, há mais de 100 milhões de anos."
  },
  {
    id: 7,
    animal: "Elefante",
    animalEmoji: "🐘",
    food: "Peixe Frito",
    foodEmoji: "🐟",
    isCorrect: false,
    explanation: "Elefantes são herbívoros gigantes, comem grama, galhos e frutas.",
    funFact: "Um elefante usa sua tromba para sentir o cheiro de água a quilômetros de distância!"
  }
];

export const ScienceGameScreen: React.FC<ScienceGameScreenProps> = ({ onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'feedback'>('playing');
  const [lastResult, setLastResult] = useState<{ success: boolean; mission: FeedingMission } | null>(null);

  const currentMission = MISSIONS[currentIdx % MISSIONS.length];

  const handleDecision = (userSaysCorrect: boolean) => {
    const success = userSaysCorrect === currentMission.isCorrect;
    
    if (success) {
      setScore(s => s + 10);
      setStreak(s => s + 1);
      audioService.playSfx('success');
      if (streak + 1 >= 3) confetti({ particleCount: 100, spread: 70 });
    } else {
      setStreak(0);
      audioService.playSfx('error');
    }

    setLastResult({ success, mission: currentMission });
    setGameState('feedback');
  };

  const nextMission = () => {
    setCurrentIdx(prev => prev + 1);
    setGameState('playing');
  };

  const getRank = () => {
    if (score < 30) return "Estagiário de Zoo";
    if (score < 60) return "Cuidador Sênior";
    return "Doutor em Zoologia";
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-20 left-10 rotate-12"><FlaskConical size={120} /></div>
          <div className="absolute bottom-20 right-10 -rotate-12"><Heart size={120} /></div>
      </div>

      {/* Header */}
      <header className="p-4 bg-emerald-900/50 backdrop-blur-md border-b border-emerald-800 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-emerald-800 p-2 rounded-xl hover:bg-emerald-700 transition shadow-lg">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-heading text-lg text-emerald-400 flex items-center gap-2">
              <FlaskConical size={20} /> Missão Nutri-Dino
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{getRank()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-emerald-800/80 px-4 py-1.5 rounded-full border border-emerald-700 flex items-center gap-2">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="font-black text-sm">{score} XP</span>
           </div>
           <button onClick={onBack} className="bg-white/10 p-1.5 rounded-xl border border-white/20 hover:scale-110 transition-all group">
              <SparkyLogo size="sm" showText={false} />
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <AnimatePresence mode="wait">
          {gameState === 'playing' ? (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full max-w-2xl flex flex-col items-center"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-heading text-emerald-100 mb-2">Hora do Almoço!</h2>
                <p className="text-emerald-400 font-bold uppercase tracking-tighter">O cardápio está correto?</p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 mb-12 w-full">
                 {/* Animal Card */}
                 <div className="flex-1 bg-white rounded-[2.5rem] p-8 shadow-2xl border-b-[12px] border-emerald-200 text-center relative group">
                    <div className="text-8xl mb-4 transform group-hover:scale-110 transition-transform duration-500">{currentMission.animalEmoji}</div>
                    <h3 className="text-slate-800 font-heading text-2xl">{currentMission.animal}</h3>
                    <div className="absolute -top-4 -right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                       <Zap size={20} fill="currentColor" />
                    </div>
                 </div>

                 <div className="text-4xl font-black text-emerald-500 animate-pulse">+</div>

                 {/* Food Card */}
                 <div className="flex-1 bg-white rounded-[2.5rem] p-8 shadow-2xl border-b-[12px] border-orange-200 text-center relative group">
                    <div className="text-8xl mb-4 transform group-hover:scale-110 transition-transform duration-500">{currentMission.foodEmoji}</div>
                    <h3 className="text-slate-800 font-heading text-xl">{currentMission.food}</h3>
                    <div className="absolute -top-4 -right-4 bg-orange-500 text-white p-2 rounded-full shadow-lg">
                       <Heart size={20} fill="currentColor" />
                    </div>
                 </div>
              </div>

              <div className="flex gap-6 w-full max-w-md">
                 <button 
                  onClick={() => handleDecision(true)}
                  className="flex-1 bg-green-500 hover:bg-green-400 text-white rounded-[2rem] py-6 font-black text-xl border-b-8 border-green-700 active:border-b-0 active:translate-y-2 transition-all shadow-xl"
                 >
                    SIM! ✅
                 </button>
                 <button 
                  onClick={() => handleDecision(false)}
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white rounded-[2rem] py-6 font-black text-xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all shadow-xl"
                 >
                    NÃO! ❌
                 </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="feedback"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl text-center border-b-[16px] border-emerald-500 relative overflow-hidden"
            >
               <div className={`absolute top-0 left-0 w-full h-4 ${lastResult?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
               
               <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${lastResult?.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {lastResult?.success ? <CheckCircle2 size={50} strokeWidth={3} /> : <XCircle size={50} strokeWidth={3} />}
               </div>

               <h2 className="text-3xl font-heading text-slate-800 mb-4 uppercase">
                 {lastResult?.success ? 'Você Acertou!' : 'Ops, Quase isso!'}
               </h2>

               <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 mb-8 text-left">
                  <div className="flex items-center gap-2 mb-3 text-indigo-600 font-black text-xs uppercase tracking-widest">
                     <Info size={16} /> Explicação Científica
                  </div>
                  <p className="text-slate-600 font-bold leading-relaxed mb-4 italic">
                    "{lastResult?.mission.explanation}"
                  </p>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-2 text-yellow-600 font-black text-[10px] uppercase">
                       <Award size={14} /> Fato Curioso
                    </div>
                    <p className="text-slate-500 text-sm font-medium">
                       {lastResult?.mission.funFact}
                    </p>
                  </div>
               </div>

               <Button onClick={nextMission} variant="primary" size="lg" className="w-full py-5 text-2xl shadow-indigo-200 group">
                  PRÓXIMO ANIMAL <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Status */}
      <footer className="p-4 bg-emerald-900/30 border-t border-emerald-800 flex justify-center gap-8">
         <div className="flex items-center gap-2 text-emerald-400">
            <Zap size={16} className={streak > 0 ? 'animate-bounce text-yellow-400' : ''} />
            <span className="text-xs font-black uppercase">Combo: {streak}</span>
         </div>
         <div className="flex items-center gap-2 text-emerald-400">
            <Heart size={16} className="text-red-400" />
            <span className="text-xs font-black uppercase">Fase: {currentIdx + 1} / {MISSIONS.length}</span>
         </div>
      </footer>
    </div>
  );
};
