
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Feather } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';

interface WordsGameScreenProps {
  onBack: () => void;
}

export const WordsGameScreen: React.FC<WordsGameScreenProps> = ({ onBack }) => {
  const [level, setLevel] = useState(0);
  const words = [
    { word: 'GATO', missingIndex: 0, options: ['G', 'M', 'P'], image: '🐱' },
    { word: 'BOLA', missingIndex: 2, options: ['L', 'T', 'R'], image: '⚽' },
    { word: 'CASA', missingIndex: 3, options: ['A', 'E', 'O'], image: '🏠' },
    { word: 'LUA', missingIndex: 0, options: ['L', 'R', 'S'], image: '🌙' },
    { word: 'FLOR', missingIndex: 1, options: ['L', 'R', 'I'], image: '🌸' },
    { word: 'SOL', missingIndex: 2, options: ['L', 'R', 'M'], image: '☀️' },
    { word: 'PATO', missingIndex: 0, options: ['P', 'G', 'S'], image: '🦆' },
    { word: 'RATO', missingIndex: 1, options: ['A', 'E', 'O'], image: '🐭' },
    { word: 'DADO', missingIndex: 3, options: ['O', 'A', 'U'], image: '🎲' },
    { word: 'VACA', missingIndex: 0, options: ['V', 'F', 'B'], image: '🐮' },
    { word: 'PIPA', missingIndex: 2, options: ['P', 'B', 'T'], image: '🪁' },
    { word: 'MOLA', missingIndex: 0, options: ['M', 'N', 'L'], image: '🌀' },
    { word: 'BOLO', missingIndex: 3, options: ['O', 'A', 'E'], image: '🎂' },
    { word: 'CAJU', missingIndex: 2, options: ['J', 'G', 'L'], image: '🍎' },
    { word: 'FADA', missingIndex: 0, options: ['F', 'V', 'T'], image: '🧚' },
    { word: 'GELO', missingIndex: 1, options: ['E', 'A', 'I'], image: '🧊' },
    { word: 'HOJE', missingIndex: 3, options: ['E', 'A', 'O'], image: '📅' },
    { word: 'IATE', missingIndex: 0, options: ['I', 'E', 'U'], image: '🛥️' },
    { word: 'JIPE', missingIndex: 1, options: ['I', 'E', 'A'], image: '🚙' },
    { word: 'KIWI', missingIndex: 2, options: ['W', 'V', 'M'], image: '🥝' },
    { word: 'LAMA', missingIndex: 3, options: ['A', 'E', 'O'], image: '🟤' },
    { word: 'MAPA', missingIndex: 0, options: ['M', 'N', 'P'], image: '🗺️' },
    { word: 'NAVE', missingIndex: 2, options: ['V', 'F', 'B'], image: '🚀' },
    { word: 'OVO', missingIndex: 0, options: ['O', 'U', 'A'], image: '🥚' },
    { word: 'PEIXE', missingIndex: 4, options: ['E', 'A', 'O'], image: '🐟' },
    { word: 'QUEIJO', missingIndex: 0, options: ['Q', 'K', 'C'], image: '🧀' },
    { word: 'ROBÔ', missingIndex: 3, options: ['Ô', 'Ó', 'O'], image: '🤖' },
  ];

  const currentWord = words[level % words.length];
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSelect = (letter: string) => {
      setSelectedLetter(letter);
      const correctLetter = currentWord.word[currentWord.missingIndex];
      if (letter === correctLetter) {
          setIsCorrect(true);
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          setTimeout(() => { setSelectedLetter(null); setIsCorrect(null); setLevel(prev => prev + 1); }, 1500);
      } else {
          setIsCorrect(false);
          setTimeout(() => { setSelectedLetter(null); setIsCorrect(null); }, 800);
      }
  };

  return (
    <div className="min-h-screen bg-orange-50 text-slate-800 flex flex-col font-sans">
       <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/p6.png')] pointer-events-none"></div>

       <div className="p-4 flex justify-between items-center z-10 bg-white/80 backdrop-blur-md border-b border-orange-200">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="bg-orange-100 text-orange-800 p-2 rounded-full hover:bg-orange-200 transition">
                <ArrowLeft />
            </button>
            <h1 className="font-heading text-xl text-orange-800 flex items-center gap-2">
                <BookOpen /> Palavras Perdidas
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="bg-orange-100 px-3 py-1 rounded-full text-orange-800 font-bold text-sm hidden sm:block">
                {level + 1} / {words.length}
             </div>
             {/* Logo clicável para voltar ao Hub */}
             <button onClick={onBack} className="bg-white/80 p-1.5 rounded-xl border border-orange-200 hover:scale-110 hover:rotate-3 transition-all group relative">
                <SparkyLogo size="sm" showText={false} />
                <span className="absolute -bottom-8 right-0 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">HUB PRINCIPAL</span>
             </button>
          </div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <motion.div key={level} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-10 shadow-2xl border-4 border-orange-200 max-w-md w-full text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-4 bg-orange-300"></div>
              <div className="text-8xl mb-8 animate-bounce-subtle">{currentWord.image}</div>
              <div className="flex justify-center gap-2 mb-12">
                  {currentWord.word.split('').map((char, index) => (
                      <div key={index} className={`w-14 h-20 rounded-xl flex items-center justify-center text-4xl font-black border-b-4 transition-colors ${index === currentWord.missingIndex ? (isCorrect === true ? 'bg-green-100 text-green-600 border-green-300' : 'bg-orange-100 text-orange-400 border-orange-300 border-dashed') : 'bg-slate-100 text-slate-700 border-slate-300'}`}>{index === currentWord.missingIndex ? (isCorrect === true ? char : '?') : char}</div>
                  ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                  {currentWord.options.map((opt, i) => (
                      <button key={i} onClick={() => handleSelect(opt)} disabled={isCorrect === true} className={`h-16 rounded-2xl text-2xl font-bold transition-all transform hover:scale-105 active:scale-95 ${selectedLetter === opt ? (isCorrect === false ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'bg-orange-500 text-white hover:bg-orange-400 border-b-4 border-orange-700'}`}>{opt}</button>
                  ))}
              </div>
              <div className="mt-8 text-slate-400 text-sm font-bold flex items-center justify-center gap-2"><Feather size={14} /> Complete a palavra para avançar</div>
          </motion.div>
       </div>
    </div>
  );
};
