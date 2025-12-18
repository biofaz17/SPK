
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Brain, Sparkles, CheckCircle, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';

interface MemoryGameScreenProps {
  onBack: () => void;
}

const ICONS = ['🚀', '👽', '🪐', '⭐', '👨‍🚀', '🛸', '🛰️', '☄️', '🔭', '🌍', '🌞', '🌌'];

export const MemoryGameScreen: React.FC<MemoryGameScreenProps> = ({ onBack }) => {
  const [cards, setCards] = useState<{ id: number; icon: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);

  useEffect(() => {
    startLevel(level);
  }, [level]);

  const startLevel = (currentLevel: number) => {
    let numPairs = 2;
    if (currentLevel === 2) numPairs = 3;
    else if (currentLevel === 3) numPairs = 4;
    else if (currentLevel === 4) numPairs = 6;
    else if (currentLevel >= 5) numPairs = 8;

    const selectedIcons = ICONS.slice(0, numPairs);
    const deck = [...selectedIcons, ...selectedIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({ id: index, icon, flipped: false, matched: false }));
    
    setCards(deck);
    setFlippedCards([]);
    setMoves(0);
    setIsLocked(false);
    setLevelComplete(false);
  };

  const handleCardClick = (id: number) => {
    if (isLocked || levelComplete) return;
    if (flippedCards.length === 2) return;
    if (cards.find(c => c.id === id)?.flipped || cards.find(c => c.id === id)?.matched) return;

    audioService.playSfx('click');

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = newCards.find(c => c.id === firstId);
      const secondCard = newCards.find(c => c.id === secondId);

      if (firstCard?.icon === secondCard?.icon) {
        // Match Found
        audioService.playSfx('success');
        
        setTimeout(() => {
          setCards(prev => {
            const updated = prev.map(c => (c.id === firstId || c.id === secondId) ? { ...c, matched: true } : c);
            
            // Check Win Condition Immediately
            const allMatched = updated.every(c => c.matched);
            if (allMatched) {
                handleWin();
            }
            
            return updated;
          });
          setFlippedCards([]);
          setIsLocked(false);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === firstId || c.id === secondId) ? { ...c, flipped: false } : c));
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const handleWin = () => {
      setLevelComplete(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      audioService.playSfx('success');
  };

  const handleNextLevel = () => {
      if (level < 6) {
          setLevel(l => l + 1);
      } else {
          // Reset Game
          setLevel(1);
      }
  };

  const getGridClass = () => {
      const count = cards.length;
      if (count <= 4) return "grid-cols-2 max-w-xs";
      if (count <= 6) return "grid-cols-2 md:grid-cols-3 max-w-sm";
      if (count <= 8) return "grid-cols-4 max-w-md";
      if (count <= 12) return "grid-cols-3 md:grid-cols-4 max-w-lg";
      return "grid-cols-4 max-w-xl";
  };

  return (
    <div className="min-h-screen bg-cyan-50 text-slate-800 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>

      <div className="p-4 flex justify-between items-center z-10 bg-white/80 backdrop-blur-md border-b border-cyan-200">
        <button onClick={onBack} className="bg-cyan-100 text-cyan-800 p-2 rounded-full hover:bg-cyan-200 transition">
           <ArrowLeft />
        </button>
        <h1 className="font-heading text-xl text-cyan-800 flex items-center gap-2">
           <Brain /> Memória Estelar
        </h1>
        <div className="flex gap-4">
            <div className="bg-cyan-100 px-3 py-1 rounded-full text-cyan-800 font-bold text-sm">
                Nível: {level}
            </div>
            <div className="bg-white px-3 py-1 rounded-full text-cyan-600 font-bold text-sm border border-cyan-100">
                Moves: {moves}
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        
        {levelComplete ? (
            <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-cyan-300 text-center animate-popIn">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown size={40} className="text-yellow-500" fill="currentColor" />
                </div>
                <h2 className="text-2xl font-heading text-cyan-900 mb-2">
                    {level < 6 ? "Nível Completado!" : "Mestre da Memória!"}
                </h2>
                <p className="text-slate-500 mb-6 font-bold">
                    {level < 6 ? "Prepare-se para mais cartas." : "Você venceu todos os desafios!"}
                </p>
                <Button onClick={handleNextLevel} variant="primary" size="lg" className="w-full">
                    {level < 6 ? "Próximo Nível" : "Jogar Novamente"}
                </Button>
            </div>
        ) : (
            <div className={`grid gap-4 w-full ${getGridClass()}`}>
            {cards.map(card => (
                <motion.div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="aspect-[3/4] cursor-pointer perspective relative group"
                >
                    <div className={`
                    absolute inset-0 w-full h-full rounded-2xl border-4 shadow-lg flex items-center justify-center text-4xl transition-all duration-300 backface-hidden
                    ${card.flipped || card.matched 
                        ? 'bg-white border-cyan-400 rotate-180' 
                        : 'bg-gradient-to-br from-cyan-500 to-blue-600 border-blue-800 group-hover:scale-[1.02]'}
                    `}>
                    {(card.flipped || card.matched) 
                        ? (
                            <div className="transform rotate-180">{card.icon}</div>
                            ) 
                        : <Sparkles className="text-white/30" />
                    }
                    
                    {card.matched && (
                        <div className="absolute top-1 right-1 text-green-500 bg-white rounded-full p-0.5 shadow-sm">
                            <CheckCircle size={14} />
                        </div>
                    )}
                    </div>
                </motion.div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};
