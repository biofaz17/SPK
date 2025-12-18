
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Music, Play, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '../components/Button';
import { SparkyLogo } from '../components/SparkyLogo';
import { audioService } from '../services/AudioService';

interface RhythmGameScreenProps {
  onBack: () => void;
}

const COLORS = [
  { id: 0, color: 'bg-red-500', active: 'bg-red-300', freq: 261.63, label: 'Dó' },
  { id: 1, color: 'bg-green-500', active: 'bg-green-300', freq: 329.63, label: 'Mi' },
  { id: 2, color: 'bg-blue-500', active: 'bg-blue-300', freq: 392.00, label: 'Sol' },
  { id: 3, color: 'bg-yellow-500', active: 'bg-yellow-300', freq: 493.88, label: 'Si' },
];

export const RhythmGameScreen: React.FC<RhythmGameScreenProps> = ({ onBack }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => { audioService.setMute(false); }, []);

  const startNewGame = async () => {
    await audioService.resumeContext();
    setSequence([]); setUserStep(0); setScore(0); setGameOver(false); setIsPlaying(true);
    audioService.playSfx('start');
    setTimeout(() => addToSequence([]), 1000);
  };

  const addToSequence = (currentSeq: number[]) => {
    setIsUserTurn(false);
    const nextColor = Math.floor(Math.random() * 4);
    const newSeq = [...currentSeq, nextColor];
    setSequence(newSeq); playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    await new Promise(r => setTimeout(r, 800));
    const speed = Math.max(250, 600 - (seq.length * 30));
    for (let i = 0; i < seq.length; i++) {
       await flashColor(seq[i], speed);
       await new Promise(r => setTimeout(r, 100));
    }
    setIsUserTurn(true); setUserStep(0);
  };

  const flashColor = async (id: number, duration: number = 300) => {
    setActiveColor(id); audioService.playTone(COLORS[id].freq, duration / 1000, 'square');
    await new Promise(r => setTimeout(r, duration)); setActiveColor(null);
  };

  const handleColorClick = (id: number) => {
    if (!isUserTurn || gameOver) return;
    flashColor(id, 200);
    if (id === sequence[userStep]) {
       if (userStep === sequence.length - 1) {
           setScore(s => s + 1); setIsUserTurn(false);
           setTimeout(() => addToSequence(sequence), 1000);
       } else setUserStep(s => s + 1);
    } else {
       audioService.playSfx('error'); setGameOver(true); setIsUserTurn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      <div className="p-4 flex justify-between items-center z-10 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-slate-700 p-2 rounded-full hover:bg-slate-600 transition">
             <ArrowLeft />
          </button>
          <h1 className="font-heading text-xl text-pink-400 flex items-center gap-2">
             <Music /> Ritmo Robótico
          </h1>
        </div>

        <div className="flex items-center gap-4">
            <div className="bg-slate-700 px-3 py-1 rounded-full font-bold text-sm hidden sm:block">Pontos: {score}</div>
            {/* Logo clicável para voltar ao Hub */}
            <button onClick={onBack} className="bg-white/10 p-1.5 rounded-xl border border-white/20 hover:scale-110 hover:rotate-3 transition-all group relative">
                <SparkyLogo size="sm" showText={false} />
                <span className="absolute -bottom-8 right-0 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">HUB PRINCIPAL</span>
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
         {gameOver ? (
             <div className="text-center animate-popIn">
                 <h2 className="text-4xl font-bold text-red-500 mb-2">Fim de Jogo!</h2>
                 <p className="text-xl mb-8 text-slate-300">Você decorou {score} sons.</p>
                 <Button onClick={startNewGame} variant="primary" size="lg" className="mx-auto shadow-pink-500/20"><RotateCcw className="mr-2" /> Tentar Novamente</Button>
             </div>
         ) : !isPlaying ? (
             <div className="text-center max-w-sm">
                 <div className="w-24 h-24 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-pink-500 animate-pulse"><Volume2 size={48} className="text-pink-400" /></div>
                 <h2 className="text-3xl font-bold mb-4">Ouça e Repita!</h2>
                 <p className="text-slate-400 mb-8">O computador vai tocar uma sequência. Aumente o volume e repita os sons!</p>
                 <Button onClick={startNewGame} variant="success" size="lg" className="w-full"><Play className="mr-2" fill="currentColor" /> Começar Jogo</Button>
             </div>
         ) : (
             <div className="grid grid-cols-2 gap-6 max-w-sm w-full">
                 {COLORS.map(c => (
                     <button key={c.id} onClick={() => handleColorClick(c.id)} disabled={!isUserTurn} className={`aspect-square rounded-3xl border-b-8 transition-all duration-100 relative overflow-hidden group ${activeColor === c.id ? `${c.active} scale-95 border-b-0 brightness-125 shadow-[0_0_30px_rgba(255,255,255,0.5)]` : `${c.color} border-black/20 hover:brightness-110 active:scale-95`} ${!isUserTurn && activeColor !== c.id ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}>{activeColor === c.id && (<div className="absolute inset-0 bg-white/30 animate-pulse"></div>)}<span className="absolute bottom-4 left-0 right-0 text-center font-bold text-black/30 text-xl pointer-events-none">{c.label}</span></button>
                 ))}
             </div>
         )}
         <div className="mt-12 text-slate-400 text-lg font-bold min-h-[2rem]">{isUserTurn && !gameOver ? "Sua vez! 🎹" : (isPlaying && !gameOver ? "Escute... 👂" : "")}</div>
      </div>
    </div>
  );
};
