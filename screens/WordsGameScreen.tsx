
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, BookOpen, Feather, Languages, Sparkles, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';
import { Button } from '../components/Button';

interface WordsGameScreenProps {
  onBack: () => void;
}

interface WordItem {
  word: string;
  missingIndex: number;
  options: string[];
  image: string;
}

const WORDS_PT: WordItem[] = [
  { word: 'GATO', missingIndex: 0, options: ['G', 'M', 'P'], image: '🐱' },
  { word: 'BOLA', missingIndex: 2, options: ['L', 'T', 'R'], image: '⚽' },
  { word: 'CASA', missingIndex: 3, options: ['A', 'E', 'O'], image: '🏠' },
  { word: 'SAPO', missingIndex: 1, options: ['A', 'E', 'I'], image: '🐸' },
  { word: 'URSO', missingIndex: 0, options: ['U', 'O', 'A'], image: '🐻' },
  { word: 'PEIXE', missingIndex: 2, options: ['I', 'E', 'Y'], image: '🐟' },
  { word: 'BANANA', missingIndex: 5, options: ['A', 'E', 'O'], image: '🍌' },
  { word: 'ESCOLA', missingIndex: 0, options: ['E', 'I', 'A'], image: '🏫' },
  { word: 'ABELHA', missingIndex: 1, options: ['B', 'P', 'D'], image: '🐝' },
  { word: 'COELHO', missingIndex: 3, options: ['L', 'H', 'R'], image: '🐰' },
  { word: 'FOGUETE', missingIndex: 2, options: ['G', 'J', 'Q'], image: '🚀' },
  { word: 'ESTRELA', missingIndex: 6, options: ['A', 'E', 'O'], image: '⭐' },
  { word: 'CADERNO', missingIndex: 1, options: ['A', 'E', 'O'], image: '📔' },
  { word: 'RELOGIO', missingIndex: 2, options: ['L', 'I', 'R'], image: '⌚' },
  { word: 'ELEFANTE', missingIndex: 4, options: ['A', 'E', 'O'], image: '🐘' },
  { word: 'GIRAFA', missingIndex: 0, options: ['G', 'J', 'C'], image: '🦒' },
  { word: 'MORANGO', missingIndex: 5, options: ['G', 'J', 'Q'], image: '🍓' },
  { word: 'PANTUFA', missingIndex: 4, options: ['U', 'A', 'O'], image: '👣' },
  { word: 'COMPUTADOR', missingIndex: 0, options: ['C', 'K', 'Q'], image: '💻' },
  { word: 'DINOSSAURO', missingIndex: 1, options: ['I', 'E', 'A'], image: '🦖' },
];

const WORDS_EN: WordItem[] = [
  { word: 'DOG', missingIndex: 1, options: ['O', 'U', 'A'], image: '🐶' },
  { word: 'CAT', missingIndex: 0, options: ['C', 'K', 'H'], image: '🐱' },
  { word: 'FISH', missingIndex: 2, options: ['S', 'Z', 'C'], image: '🐟' },
  { word: 'TREE', missingIndex: 3, options: ['E', 'A', 'Y'], image: '🌳' },
  { word: 'BIRD', missingIndex: 1, options: ['I', 'E', 'A'], image: '🐦' },
  { word: 'APPLE', missingIndex: 0, options: ['A', 'E', 'O'], image: '🍎' },
  { word: 'HOUSE', missingIndex: 2, options: ['U', 'O', 'I'], image: '🏠' },
  { word: 'SNAKE', missingIndex: 4, options: ['E', 'A', 'Y'], image: '🐍' },
  { word: 'ROCKET', missingIndex: 1, options: ['O', 'U', 'A'], image: '🚀' },
  { word: 'SCHOOL', missingIndex: 2, options: ['H', 'K', 'G'], image: '🏫' },
  { word: 'ORANGE', missingIndex: 0, options: ['O', 'A', 'U'], image: '🍊' },
  { word: 'FLOWER', missingIndex: 4, options: ['E', 'A', 'I'], image: '🌸' },
  { word: 'MONKEY', missingIndex: 5, options: ['Y', 'I', 'E'], image: '🐒' },
  { word: 'SPACE', missingIndex: 2, options: ['A', 'E', 'O'], image: '🌌' },
  { word: 'ROBOT', missingIndex: 3, options: ['O', 'U', 'E'], image: '🤖' },
  { word: 'PENCIL', missingIndex: 0, options: ['P', 'B', 'D'], image: '✏️' },
  { word: 'BANANA', missingIndex: 3, options: ['A', 'E', 'O'], image: '🍌' },
  { word: 'PLANET', missingIndex: 1, options: ['L', 'R', 'N'], image: '🪐' },
  { word: 'ALGORITHM', missingIndex: 0, options: ['A', 'E', 'O'], image: '⚙️' },
  { word: 'ASTRONAUT', missingIndex: 2, options: ['T', 'D', 'P'], image: '👩‍🚀' },
];

export const WordsGameScreen: React.FC<WordsGameScreenProps> = ({ onBack }) => {
  const [lang, setLang] = useState<'PT' | 'EN'>('PT');
  const [level, setLevel] = useState(0);
  const [wordsSolved, setWordsSolved] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showVictory, setShowVictory] = useState(false);

  // Seleciona um subconjunto de palavras aleatório para cada rodada
  const words = lang === 'PT' ? WORDS_PT : WORDS_EN;
  const currentWord = words[level % words.length];

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
      const newSolved = wordsSolved + 1;
      setWordsSolved(newSolved);

      if (newSolved >= 7) { // Aumentado de 5 para 7 para mais desafio
        setTimeout(() => {
          setShowVictory(true);
          confetti({ particleCount: 150, spread: 70 });
        }, 1000);
      } else {
        setTimeout(() => {
          setSelectedLetter(null);
          setIsCorrect(null);
          setLevel(prev => prev + 1);
        }, 1200);
      }
    } else {
      setIsCorrect(false);
      audioService.playSfx('error');
      setTimeout(() => {
        setSelectedLetter(null);
        setIsCorrect(null);
      }, 1000);
    }
  };

  const nextRound = () => {
    setWordsSolved(0);
    setShowVictory(false);
    setSelectedLetter(null);
    setIsCorrect(null);
    setLevel(prev => Math.floor(Math.random() * words.length));
  };

  return (
    <div className="min-h-screen bg-orange-50 text-slate-800 flex flex-col font-sans relative overflow-hidden">
      <div className="p-4 flex justify-between items-center z-10 bg-white/90 backdrop-blur-sm border-b border-orange-200">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="bg-orange-100 text-orange-800 p-2 rounded-full hover:bg-orange-200 transition"><ArrowLeft /></button>
          <h1 className="font-heading text-lg text-orange-800">Dicionário Estelar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang(l => l === 'PT' ? 'EN' : 'PT')} className="bg-indigo-600 text-white px-4 py-2 rounded-full font-black text-xs shadow-lg hover:scale-105 active:scale-95 transition-all">{lang}</button>
          <button onClick={onBack} className="bg-white p-1 rounded-xl border-2 border-orange-200 shadow-md hover:scale-110 transition"><SparkyLogo size="sm" showText={false} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <AnimatePresence>
          {showVictory && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-orange-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] p-10 text-center max-w-sm w-full border-b-[12px] border-orange-500 shadow-2xl">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                  <Star size={56} fill="currentColor" className="animate-pulse" />
                </div>
                <h2 className="text-3xl font-heading text-slate-800 mb-2">Linguista Mestre!</h2>
                <p className="text-slate-500 font-bold mb-8">Sua leitura está excelente em {lang === 'PT' ? 'Português' : 'Inglês'}!</p>
                <Button onClick={nextRound} variant="primary" className="w-full py-4 text-xl">Próxima Rodada <ArrowRight className="ml-2" /></Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-md mb-8">
            <div className="flex justify-between text-xs font-black text-orange-400 uppercase tracking-widest mb-2 px-2">
                <span>Progresso da Rodada</span>
                <span>{wordsSolved}/7</span>
            </div>
            <div className="h-4 bg-orange-100 rounded-full border-2 border-orange-200 overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(wordsSolved/7)*100}%` }} className="h-full bg-orange-500" />
            </div>
        </div>

        <motion.div key={`${level}-${lang}`} initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-b-[12px] border-orange-200 max-w-md w-full text-center relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-[10rem] drop-shadow-xl select-none">{currentWord.image}</div>
            <div className="mt-20 flex flex-wrap justify-center gap-2 mb-10">
              {currentWord.word.split('').map((char, index) => (
                <div key={index} className={`w-12 h-16 rounded-xl flex items-center justify-center text-3xl font-black border-b-4 ${index === currentWord.missingIndex ? 'bg-orange-50 text-orange-500 border-orange-300 ring-2 ring-orange-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  {index === currentWord.missingIndex ? (isCorrect ? char : '?') : char}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {shuffledOptions.map((opt, i) => (
                <button key={i} onClick={() => handleSelect(opt)} className="h-16 rounded-xl text-2xl font-black bg-white text-orange-600 border-2 border-orange-200 border-b-8 active:border-b-0 active:translate-y-1 transition-all hover:bg-orange-50">{opt}</button>
              ))}
            </div>
        </motion.div>
      </div>
    </div>
  );
};
