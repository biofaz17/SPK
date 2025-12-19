
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Box, Flag, Play, RotateCcw, Sparkles, Wand2, Hammer, Trash2, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { SparkyLogo } from '../components/SparkyLogo';
import { LevelConfig, GridPosition, BlockType, SubscriptionTier } from '../types';
import { audioService } from '../services/AudioService';
import { GoogleGenAI } from "@google/genai";

interface CreativeWorkshopScreenProps {
  onBack: () => void;
  onPlayLevel: (config: LevelConfig) => void;
}

type Tool = 'obstacle' | 'start' | 'goal' | 'eraser';

export const CreativeWorkshopScreen: React.FC<CreativeWorkshopScreenProps> = ({ onBack, onPlayLevel }) => {
  const GRID_SIZE = 8;
  const [activeTool, setActiveTool] = useState<Tool>('obstacle');
  const [obstacles, setObstacles] = useState<GridPosition[]>([]);
  const [startPos, setStartPos] = useState<GridPosition>({ x: 0, y: 7 });
  const [goalPos, setGoalPos] = useState<GridPosition>({ x: 7, y: 0 });
  const [missionText, setMissionText] = useState<string>("");
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  useEffect(() => {
    audioService.speak("Bem-vindo à Oficina Criativa! Desenhe o mapa e eu inventarei uma missão para você!", "excited");
  }, []);

  const handleCellClick = (x: number, y: number) => {
    audioService.playSfx('click');
    
    if (activeTool === 'eraser') {
      setObstacles(prev => prev.filter(o => o.x !== x || o.y !== y));
      if (startPos.x === x && startPos.y === y) setStartPos({ x: -1, y: -1 });
      if (goalPos.x === x && goalPos.y === y) setGoalPos({ x: -1, y: -1 });
      return;
    }

    if (activeTool === 'start') {
      setStartPos({ x, y });
      setObstacles(prev => prev.filter(o => o.x !== x || o.y !== y));
      if (goalPos.x === x && goalPos.y === y) setGoalPos({ x: -1, y: -1 });
      return;
    }

    if (activeTool === 'goal') {
      setGoalPos({ x, y });
      setObstacles(prev => prev.filter(o => o.x !== x || o.y !== y));
      if (startPos.x === x && startPos.y === y) setStartPos({ x: -1, y: -1 });
      return;
    }

    if (activeTool === 'obstacle') {
      const exists = obstacles.some(o => o.x === x && o.y === y);
      if (exists) {
        setObstacles(prev => prev.filter(o => o.x !== x || o.y !== y));
      } else {
        if ((startPos.x === x && startPos.y === y) || (goalPos.x === x && goalPos.y === y)) return;
        setObstacles(prev => [...prev, { x, y }]);
      }
    }
  };

  const generateMission = async () => {
    if (!process.env.API_KEY) {
      setMissionText("Seu objetivo é guiar o Sparky até a bandeira desviando de todos os obstáculos!");
      return;
    }

    setIsGeneratingMission(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Crie uma missão lúdica e curta para uma criança de 7 anos em um jogo de robô. 
      O robô começa em (${startPos.x}, ${startPos.y}) e deve chegar em (${goalPos.x}, ${goalPos.y}). 
      Há ${obstacles.length} obstáculos no caminho. Invente um contexto divertido (espaço, floresta, oceano). 
      Máximo 2 frases. Use emojis.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setMissionText(response.text || "Ajude o Sparky a chegar ao objetivo final!");
      audioService.speak(response.text || "Objetivo definido!", "instruction");
    } catch (e) {
      setMissionText("Uma falha no sistema! Mas seu objetivo continua sendo chegar à bandeira!");
    } finally {
      setIsGeneratingMission(false);
    }
  };

  const startPlaying = () => {
    if (startPos.x === -1 || goalPos.x === -1) {
      alert("Coloque o Sparky e a Bandeira no mapa primeiro!");
      return;
    }
    
    const config: LevelConfig = {
      id: 'custom_' + Date.now(),
      title: "Nível Personalizado",
      mission: missionText || "Chegue até a bandeira!",
      gridSize: GRID_SIZE,
      startPos,
      goalPos,
      obstacles,
      maxBlocks: 20,
      availableBlocks: Object.values(BlockType).filter(t => t !== BlockType.START),
      ageGroup: '8-10',
      requiredSubscription: SubscriptionTier.PRO,
      isCreative: true
    };
    
    onPlayLevel(config);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Background Blueprint */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
        backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', 
        backgroundSize: '30px 30px' 
      }}></div>

      {/* Header */}
      <header className="p-4 bg-slate-800/80 backdrop-blur-md border-b border-blue-500/30 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-slate-700 p-2 rounded-xl hover:bg-red-600 transition">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-heading text-lg text-blue-300 flex items-center gap-2">
              <Hammer size={20} className="text-yellow-400" /> Oficina de Projetos
            </h1>
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Modo Engenheiro Sênior</p>
          </div>
        </div>

        <button onClick={() => setShowTutorial(true)} className="bg-white/5 p-2 rounded-xl border border-white/10 hover:bg-white/10 transition">
          <Info size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 overflow-y-auto">
        {/* Lado Esquerdo: Ferramentas */}
        <div className="w-full md:w-64 flex flex-col gap-4 shrink-0">
          <div className="bg-slate-800 p-4 rounded-3xl border-2 border-slate-700 shadow-xl">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-4 tracking-tighter">Peças do Cenário</h3>
            <div className="grid grid-cols-2 gap-3">
              <ToolButton 
                active={activeTool === 'start'} 
                onClick={() => setActiveTool('start')} 
                icon={<SparkyLogo size="sm" showText={false} />} 
                label="Sparky" 
                color="bg-blue-600" 
              />
              <ToolButton 
                active={activeTool === 'goal'} 
                onClick={() => setActiveTool('goal')} 
                icon={<Flag size={24} />} 
                label="Objetivo" 
                color="bg-green-600" 
              />
              <ToolButton 
                active={activeTool === 'obstacle'} 
                onClick={() => setActiveTool('obstacle')} 
                icon={<Box size={24} />} 
                label="Bloco" 
                color="bg-slate-600" 
              />
              <ToolButton 
                active={activeTool === 'eraser'} 
                onClick={() => setActiveTool('eraser')} 
                icon={<Trash2 size={24} />} 
                label="Borracha" 
                color="bg-red-600" 
              />
            </div>
          </div>

          <div className="bg-indigo-900/40 p-5 rounded-3xl border-2 border-indigo-500/30 flex flex-col gap-4">
             <div className="flex items-center gap-2 text-indigo-300">
                <Sparkles size={18} />
                <span className="font-bold text-sm">Objetivo da IA</span>
             </div>
             <div className="bg-black/20 p-4 rounded-2xl min-h-[80px] text-xs font-medium text-indigo-100 leading-relaxed italic">
                {isGeneratingMission ? (
                  <div className="flex items-center gap-2 animate-pulse">
                    <Wand2 size={14} /> Pensando...
                  </div>
                ) : (
                  missionText || "Desenhe seu mapa e clique em 'Gerar Objetivo' para uma história!"
                )}
             </div>
             <Button onClick={generateMission} size="sm" variant="secondary" disabled={isGeneratingMission} className="w-full">
                <Wand2 size={16} /> GERAR OBJETIVO
             </Button>
          </div>
        </div>

        {/* Centro: Grid de Construção */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
           <div className="relative">
              <div 
                className="grid gap-1 p-2 bg-slate-800 rounded-[2.5rem] border-4 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  width: 'fit-content'
                }}
              >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  const isObstacle = obstacles.some(o => o.x === x && o.y === y);
                  const isStart = startPos.x === x && startPos.y === y;
                  const isGoal = goalPos.x === x && goalPos.y === y;

                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 0.95 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCellClick(x, y)}
                      className={`
                        w-10 h-10 md:w-14 md:h-14 rounded-xl transition-all border-2 flex items-center justify-center
                        ${isObstacle ? 'bg-slate-600 border-slate-500 shadow-inner' : 
                          isStart ? 'bg-blue-500 border-blue-400' :
                          isGoal ? 'bg-green-500 border-green-400' :
                          'bg-slate-900 border-slate-800 hover:border-slate-600'}
                      `}
                    >
                      {isStart && <SparkyLogo size="sm" showText={false} />}
                      {isGoal && <Flag size={24} className="text-white fill-current" />}
                      {isObstacle && <Box size={20} className="text-slate-400" />}
                    </motion.button>
                  );
                })}
              </div>
              
              {/* Overlay Decorativo */}
              <div className="absolute -top-6 -right-6 w-24 h-24 border-t-4 border-r-4 border-blue-500/20 rounded-tr-3xl pointer-events-none"></div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 border-b-4 border-l-4 border-blue-500/20 rounded-bl-3xl pointer-events-none"></div>
           </div>
        </div>

        {/* Lado Direito: Ação */}
        <div className="w-full md:w-64 flex flex-col justify-end p-2">
           <Button onClick={startPlaying} variant="success" size="lg" className="w-full py-6 text-xl shadow-xl shadow-green-900/40">
              <Play className="mr-2" fill="currentColor" /> JOGAR NÍVEL
           </Button>
           <button 
            onClick={() => { setObstacles([]); setMissionText(""); }}
            className="mt-4 flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-red-400 transition"
           >
              <RotateCcw size={16} /> Limpar Tudo
           </button>
        </div>
      </main>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6"
          >
             <div className="max-w-md w-full bg-white rounded-[3rem] p-10 text-center text-slate-800 border-b-[16px] border-blue-600 shadow-2xl">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Hammer size={40} className="text-blue-600" />
                </div>
                <h2 className="text-3xl font-heading mb-4">Mestre das Fases</h2>
                <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                   Crie seus próprios labirintos! Escolha onde o Sparky começa, onde está a bandeira e os obstáculos no caminho. 
                   Depois, use a IA para criar um objetivo mágico!
                </p>
                <Button onClick={() => setShowTutorial(false)} variant="primary" className="w-full py-4">
                   ENTENDI! VAMOS CRIAR
                </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolButton = ({ active, onClick, icon, label, color }: any) => (
  <button 
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border-b-4 transition-all
      ${active ? `${color} border-white shadow-lg scale-105` : 'bg-slate-700 border-slate-900 opacity-60 hover:opacity-100'}
    `}
  >
    <div className="h-8 flex items-center justify-center">{icon}</div>
    <span className="text-[10px] font-black uppercase">{label}</span>
  </button>
);
