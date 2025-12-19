
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Brain, Sparkles, CheckCircle2, Star, Award, Zap, Compass, ArrowRight, Volume2, Search, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';

interface MemoryGameScreenProps {
  onBack: () => void;
}

interface MemoryItem {
  id: string;
  emoji: string;
  name: string;
  fact: string;
}

const MEMORY_ITEMS: MemoryItem[] = [
  { id: 'sun', emoji: '☀️', name: 'Sol', fact: 'O Sol é uma estrela gigante! Ele é o centro do nosso sistema e nos dá calor e luz.' },
  { id: 'earth', emoji: '🌍', name: 'Terra', fact: 'A Terra é o nosso lar! É o único planeta conhecido que tem água líquida e vida.' },
  { id: 'moon', emoji: '🌙', name: 'Lua', fact: 'A Lua não tem luz própria, ela brilha porque reflete a luz do Sol como um espelho.' },
  { id: 'rocket', emoji: '🚀', name: 'Foguete', fact: 'Foguetes precisam de muita força para vencer a gravidade da Terra e chegar ao espaço.' },
  { id: 'astro', emoji: '👨‍🚀', name: 'Astronauta', fact: 'Astronautas usam roupas especiais que fornecem oxigênio e os protegem do frio extremo.' },
  { id: 'mars', emoji: '🔴', name: 'Marte', fact: 'Marte é conhecido como o planeta vermelho por causa da ferrugem em suas rochas.' },
  { id: 'saturn', emoji: '🪐', name: 'Saturno', fact: 'Saturno tem anéis incríveis feitos de bilhões de pedaços de gelo e poeira.' },
  { id: 'star', emoji: '⭐', name: 'Estrela', fact: 'Estrelas são bolas de gás brilhante. O que vemos à noite aconteceu há muitos anos!' },
];

interface Card {
  instanceId: number;
  data: MemoryItem;
  flipped: boolean;
  matched: boolean;
}

export const MemoryGameScreen: React.FC<MemoryGameScreenProps> = ({ onBack }) => {
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [matchesFound, setMatchesFound] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const [isSparkyTalking, setIsSparkyTalking] = useState(false);

  // Define o número de pares baseado no nível
  const getPairsCount = (lvl: number) => {
    if (lvl === 1) return 3; // 6 cartas
    if (lvl === 2) return 4; // 8 cartas
    if (lvl === 3) return 6; // 12 cartas
    return 8; // 16 cartas (máximo)
  };

  const startLevel = (lvl: number) => {
    const pairsCount = getPairsCount(lvl);
    const selectedItems = [...MEMORY_ITEMS].sort(() => Math.random() - 0.5).slice(0, pairsCount);
    const deck: Card[] = [...selectedItems, ...selectedItems]
      .sort(() => Math.random() - 0.5)
      .map((item, index) => ({
        instanceId: index,
        data: item,
        flipped: false,
        matched: false,
      }));

    setCards(deck);
    setFlippedIds([]);
    setIsLocked(false);
    setMoves(0);
    setMatchesFound(0);
    setShowVictory(false);
    
    audioService.speak(`Scanner de memória ativado. Encontre os pares de dados espaciais no Nível ${lvl}!`, 'instruction', () => setIsSparkyTalking(true), () => setIsSparkyTalking(false));
  };

  useEffect(() => {
    startLevel(level);
    return () => audioService.stop();
  }, [level]);

  const handleCardClick = (instanceId: number) => {
    if (isLocked || flippedIds.includes(instanceId) || cards.find(c => c.instanceId === instanceId)?.matched) return;

    audioService.playSfx('click');
    const newCards = cards.map(c => c.instanceId === instanceId ? { ...c, flipped: true } : c);
    setCards(newCards);
    
    const newFlipped = [...flippedIds, instanceId];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);
      
      const [id1, id2] = newFlipped;
      const card1 = newCards.find(c => c.instanceId === id1)!;
      const card2 = newCards.find(c => c.instanceId === id2)!;

      if (card1.data.id === card2.data.id) {
        // MATCH!
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.instanceId === id1 || c.instanceId === id2) ? { ...c, matched: true } : c));
          setMatchesFound(prev => {
            const next = prev + 1;
            if (next === getPairsCount(level)) handleWin();
            return next;
          });
          setFlippedIds([]);
          setIsLocked(false);
          audioService.playSfx('success');
          audioService.speak(`Identificado: ${card1.data.name}! ${card1.data.fact}`, 'happy', () => setIsSparkyTalking(true), () => setIsSparkyTalking(false));
        }, 500);
      } else {
        // MISS
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.instanceId === id1 || c.instanceId === id2) ? { ...c, flipped: false } : c));
          setFlippedIds([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const handleWin = () => {
    setTimeout(() => {
      setShowVictory(true);
      confetti({ particleCount: 150, spread: 70, colors: ['#3b82f6', '#8b5cf6', '#ffffff'] });
      audioService.speak("Análise do setor completa! Você tem uma memória de computador!", "excited", () => setIsSparkyTalking(true), () => setIsSparkyTalking(false));
    }, 1000);
  };

  const nextLevel = () => {
    setLevel(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Stardust */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>

      {/* Header Observatório */}
      <header className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-blue-500/30 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-slate-800 p-2.5 rounded-xl hover:bg-blue-900/50 transition border border-blue-400/20 group">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="font-heading text-lg text-blue-300 flex items-center gap-2 tracking-tight">
              <Brain className="text-yellow-400" size={20} /> Banco de Dados Galáctico
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">Sincronização de Memória</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-blue-950/50 px-4 py-1.5 rounded-full border border-blue-500/30 flex items-center gap-2">
              <Search size={14} className="text-blue-400" />
              <span className="font-mono text-sm font-bold">{moves} Tentativas</span>
           </div>
           <button 
            onClick={() => audioService.speak("Encontre os pares para desbloquear informações sobre o universo!")}
            className={`bg-white/5 p-1.5 rounded-xl border border-white/10 transition-all ${isSparkyTalking ? 'scale-125 border-yellow-400 ring-4 ring-yellow-500/20' : 'hover:scale-110'}`}
           >
              <SparkyLogo size="sm" showText={false} />
           </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <AnimatePresence mode="wait">
          {!showVictory ? (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`grid gap-4 w-full max-w-4xl place-items-center ${
                  cards.length <= 6 ? 'grid-cols-2 md:grid-cols-3 max-w-xl' : 
                  cards.length <= 8 ? 'grid-cols-2 md:grid-cols-4 max-w-2xl' :
                  cards.length <= 12 ? 'grid-cols-3 md:grid-cols-4 max-w-3xl' :
                  'grid-cols-4 md:grid-cols-4'
              }`}
            >
              {cards.map((card) => (
                <motion.div
                  key={card.instanceId}
                  onClick={() => handleCardClick(card.instanceId)}
                  whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}}
                  whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : {}}
                  className="relative w-full aspect-[3/4] md:aspect-square cursor-pointer perspective"
                >
                  <div className={`
                    absolute inset-0 w-full h-full transition-all duration-500 preserve-3d rounded-2xl border-2
                    ${card.flipped || card.matched ? 'rotate-y-180 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-slate-700 hover:border-blue-500'}
                  `}>
                    {/* Verso da Carta (Mire o Holograma) */}
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-slate-900 flex items-center justify-center rounded-2xl overflow-hidden">
                       <div className="absolute inset-2 border border-blue-500/20 rounded-xl"></div>
                       <Compass size={40} className="text-blue-500/40 animate-pulse" />
                    </div>
                    
                    {/* Frente da Carta (O Objeto) */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white flex flex-col items-center justify-center rounded-2xl text-slate-900 shadow-inner">
                       <span className="text-5xl md:text-6xl mb-2 drop-shadow-md">{card.data.emoji}</span>
                       <span className="text-[10px] font-black uppercase text-blue-600 tracking-tighter">{card.data.name}</span>
                       {card.matched && (
                         <div className="absolute top-2 right-2 text-green-500">
                           <CheckCircle2 size={16} />
                         </div>
                       )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="victory"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl bg-slate-900 rounded-[3rem] p-10 md:p-14 shadow-2xl text-center border-b-[20px] border-blue-600 relative overflow-hidden border-x border-t border-white/5"
            >
               <div className="absolute top-0 left-0 w-full h-4 bg-green-500"></div>
               
               <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-10 shadow-inner bg-green-500/20 text-green-400">
                  <Award size={80} strokeWidth={3} />
               </div>

               <h2 className="text-4xl font-heading text-white mb-8 uppercase tracking-tighter">
                 Memória Sincronizada!
               </h2>

               <div className="bg-black/40 rounded-[2.5rem] p-8 border border-white/10 mb-10 text-left space-y-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-blue-400 font-black text-xs uppercase tracking-widest">
                       <Info size={18} /> Resumo da Expedição
                    </div>
                    <p className="text-slate-200 font-bold leading-relaxed italic text-lg text-center">
                      "Você identificou todos os elementos cósmicos deste setor com apenas {moves} tentativas!"
                    </p>
                  </div>
               </div>

               <Button onClick={nextLevel} variant="primary" size="lg" className="w-full py-6 text-2xl shadow-blue-900/50 group bg-blue-600 hover:bg-blue-500 border-blue-700">
                  PRÓXIMO SETOR <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
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
            <Brain size={20} className="text-blue-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Pares: {matchesFound} / {getPairsCount(level)}</span>
         </div>
      </footer>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .perspective { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
};
