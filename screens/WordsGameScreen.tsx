
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, BookOpen, Feather, Languages, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';

interface WordsGameScreenProps {
  onBack: () => void;
}

interface WordItem {
  word: string;
  missingIndex: number;
  options: string[];
  image: string;
}

// Vocabulário expandido com posições de letras faltantes variadas
const WORDS_PT: WordItem[] = [
  { word: 'GATO', missingIndex: 0, options: ['G', 'M', 'P'], image: '🐱' },
  { word: 'BOLA', missingIndex: 2, options: ['L', 'T', 'R'], image: '⚽' },
  { word: 'CASA', missingIndex: 3, options: ['A', 'E', 'O'], image: '🏠' },
  { word: 'SAPO', missingIndex: 1, options: ['A', 'E', 'I'], image: '🐸' },
  { word: 'URSO', missingIndex: 0, options: ['U', 'O', 'A'], image: '🐻' },
  { word: 'BANANA', missingIndex: 2, options: ['N', 'M', 'L'], image: '🍌' },
  { word: 'BONECA', missingIndex: 4, options: ['C', 'K', 'S'], image: '🪆' },
  { word: 'JANELA', missingIndex: 5, options: ['A', 'E', 'O'], image: '🪟' },
  { word: 'PIANO', missingIndex: 2, options: ['A', 'E', 'O'], image: '🎹' },
  { word: 'GELO', missingIndex: 1, options: ['E', 'A', 'I'], image: '🧊' },
  { word: 'DADO', missingIndex: 0, options: ['D', 'T', 'B'], image: '🎲' },
  { word: 'MALA', missingIndex: 3, options: ['A', 'E', 'O'], image: '💼' },
  { word: 'PATO', missingIndex: 2, options: ['T', 'D', 'B'], image: '🦆' },
  { word: 'LUA', missingIndex: 0, options: ['L', 'R', 'S'], image: '🌙' },
  { word: 'FLOR', missingIndex: 1, options: ['L', 'O', 'I'], image: '🌸' },
  { word: 'SORVETE', missingIndex: 3, options: ['V', 'F', 'B'], image: '🍦' },
  { word: 'ZEBRA', missingIndex: 0, options: ['Z', 'S', 'X'], image: '🦓' },
  { word: 'NAVIO', missingIndex: 2, options: ['V', 'F', 'S'], image: '🚢' },
  { word: 'BOLO', missingIndex: 3, options: ['O', 'A', 'E'], image: '🎂' },
  { word: 'DENTE', missingIndex: 4, options: ['E', 'A', 'I'], image: '🦷' },
];

const WORDS_EN: WordItem[] = [
  { word: 'DOG', missingIndex: 1, options: ['O', 'U', 'A'], image: '🐶' },
  { word: 'CAT', missingIndex: 0, options: ['C', 'K', 'H'], image: '🐱' },
  { word: 'FISH', missingIndex: 2, options: ['S', 'Z', 'C'], image: '🐟' },
  { word: 'TREE', missingIndex: 3, options: ['E', 'A', 'Y'], image: '🌳' },
  { word: 'BIRD', missingIndex: 1, options: ['I', 'E', 'A'], image: '🐦' },
  { word: 'APPLE', missingIndex: 0, options: ['A', 'E', 'O'], image: '🍎' },
  { word: 'HOUSE', missingIndex: 2, options: ['U', 'O', 'A'], image: '🏠' },
  { word: 'WATER', missingIndex: 1, options: ['A', 'E', 'I'], image: '💧' },
  { word: 'ROBOT', missingIndex: 2, options: ['B', 'P', 'D'], image: '🤖' },
  { word: 'SUN', missingIndex: 2, options: ['N', 'M', 'T'], image: '☀️' },
  { word: 'BOOK', missingIndex: 0, options: ['B', 'P', 'L'], image: '📖' },
  { word: 'STAR', missingIndex: 2, options: ['A', 'E', 'O'], image: '⭐' },
  { word: 'MOON', missingIndex: 1, options: ['O', 'A', 'E'], image: '🌙' },
  { word: 'ORANGE', missingIndex: 5, options: ['E', 'A', 'Y'], image: '🍊' },
  { word: 'MILK', missingIndex: 3, options: ['K', 'C', 'L'], image: '🥛' },
  { word: 'PLANE', missingIndex: 0, options: ['P', 'B', 'T'], image: '✈️' },
  { word: 'ROCKET', missingIndex: 3, options: ['K', 'C', 'G'], image: '🚀' },
  { word: 'KEY', missingIndex: 1, options: ['E', 'A', 'I'], image: '🔑' },
];

export const WordsGameScreen: React.FC<WordsGameScreenProps> = ({ onBack }) => {
  const [lang, setLang] = useState<'PT' | 'EN'>('PT');
  const [level, setLevel] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const words = lang === 'PT' ? WORDS_PT : WORDS_EN;
  const currentWord = words[level % words.length];

  // Embaralha as opções toda vez que a palavra ou nível muda
  const shuffledOptions = useMemo(() => {
    return [...currentWord.options].sort(() => Math.random() - 0.5);
  }, [currentWord.word, level, lang]);

  const handleSelect = (letter: string) => {
    if (isCorrect !== null) return;
    
    setSelectedLetter(letter);
    const correctLetter = currentWord.word[currentWord.missingIndex];
    
    if (letter === correctLetter) {
      setIsCorrect(true);
      audioService.playSfx('success');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      
      const praise = lang === 'PT' 
        ? "Excelente! Você acertou!" 
        : "Excellent! You got it right!";
      
      audioService.speak(praise, 'happy');

      setTimeout(() => {
        setSelectedLetter(null);
        setIsCorrect(null);
        setLevel(prev => prev + 1);
      }, 2000);
    } else {
      setIsCorrect(false);
      audioService.playSfx('error');
      setTimeout(() => {
        setSelectedLetter(null);
        setIsCorrect(null);
      }, 1000);
    }
  };

  const toggleLanguage = () => {
    audioService.playSfx('pop');
    setLang(prev => prev === 'PT' ? 'EN' : 'PT');
    setLevel(0);
    setSelectedLetter(null);
    setIsCorrect(null);
  };

  return (
    <div className="min-h-screen bg-orange-50 text-slate-800 flex flex-col font-sans overflow-x-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/p6.png')] pointer-events-none"></div>

      {/* Navbar Superior */}
      <div className="p-4 flex justify-between items-center z-10 bg-white/80 backdrop-blur-md border-b border-orange-200">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="bg-orange-100 text-orange-800 p-2 rounded-full hover:bg-orange-200 transition">
            <ArrowLeft />
          </button>
          <h1 className="font-heading text-lg md:text-xl text-orange-800 flex items-center gap-2">
            <BookOpen size={20} /> 
            <span className="hidden sm:inline">Palavras Perdidas</span>
            <span className="sm:hidden">Palavras</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full font-black text-xs hover:bg-indigo-700 transition shadow-lg border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
          >
            <Languages size={16} />
            {lang === 'PT' ? 'PORTUGUÊS' : 'ENGLISH'}
          </button>

          <button 
            onClick={onBack} 
            className="bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border-4 border-blue-500 shadow-lg hover:scale-110 hover:rotate-3 transition-all group relative"
          >
            <SparkyLogo size="sm" showText={false} />
            <span className="absolute -bottom-10 right-0 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-50">
                UNIVERSO
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${lang}-${level}`} 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: -20, opacity: 0 }}
            className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-b-[12px] border-orange-200 max-w-md w-full text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-3 bg-orange-400 opacity-50"></div>
            
            <div className="text-8xl md:text-9xl mb-8 animate-bounce-subtle drop-shadow-sm">
                {currentWord.image}
            </div>

            {/* Layout das Letras - Diversidade de posição */}
            <div className="flex justify-center gap-2 md:gap-3 mb-10 flex-wrap">
              {currentWord.word.split('').map((char, index) => {
                const isMissing = index === currentWord.missingIndex;
                return (
                  <motion.div 
                    key={index}
                    animate={isMissing && isCorrect === true ? { scale: [1, 1.2, 1], backgroundColor: ['#f8fafc', '#dcfce7', '#f0fdf4'] } : {}}
                    className={`
                      w-12 h-16 md:w-16 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-black border-b-4 transition-all
                      ${isMissing 
                        ? (isCorrect === true 
                            ? 'bg-green-50 text-green-600 border-green-400' 
                            : 'bg-orange-50 text-orange-400 border-orange-300 border-dashed animate-pulse') 
                        : 'bg-slate-50 text-slate-700 border-slate-200 shadow-inner'
                      }
                    `}
                  >
                    {isMissing ? (isCorrect === true ? char : '?') : char}
                  </motion.div>
                );
              })}
            </div>

            {/* Opções de Letras - Embaralhadas Dinamicamente */}
            <div className="grid grid-cols-3 gap-4">
              {shuffledOptions.map((opt, i) => (
                <button 
                  key={`${level}-${i}`} 
                  onClick={() => handleSelect(opt)} 
                  disabled={isCorrect === true}
                  className={`
                    h-16 md:h-20 rounded-2xl text-2xl md:text-3xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-md
                    ${selectedLetter === opt 
                      ? (isCorrect === false ? 'bg-red-500 text-white border-red-700' : 'bg-green-500 text-white border-green-700') 
                      : 'bg-white text-orange-600 border-2 border-orange-200 hover:border-orange-500 border-b-8 active:border-b-0 active:translate-y-1'
                    }
                  `}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-center gap-2 text-slate-400 font-bold text-sm bg-slate-50 py-3 rounded-2xl border border-dashed border-slate-200">
              <Feather size={16} className="text-orange-400" />
              {lang === 'PT' ? 'Onde está a letra perdida?' : 'Find the missing letter!'}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Feedback de Progresso */}
        <div className="mt-8 flex items-center gap-3">
            <div className="flex gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-3 h-3 rounded-full transition-all duration-500 ${i < (level % 5) ? 'bg-green-500 scale-125' : 'bg-slate-300'}`}
                    />
                ))}
            </div>
            {level > 0 && level % 5 === 0 && (
                <div className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-full animate-bounce flex items-center gap-1">
                    <Sparkles size={10} /> COMBO!
                </div>
            )}
        </div>
        
        <p className="mt-4 text-orange-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={14} /> {lang === 'PT' ? 'Aventura Alfabética' : 'Alphabet Adventure'}
        </p>
      </div>
    </div>
  );
};
