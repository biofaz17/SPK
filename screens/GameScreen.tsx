
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, RotateCcw, Trash2, HelpCircle, Pause, CheckCircle, XCircle, ArrowRight, Repeat, Code, Terminal, Move, Clock, Battery, BatteryWarning, Target, Brush, Volume2, VolumeX, Shirt, Lock, Crown, Waves, Sparkles, Wand2, X, Map as MapIcon, LogOut, Maximize2, MessageSquare, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LevelConfig, BlockType, BlockCategory, GridPosition, BLOCK_DEFINITIONS, UserProfile, SubscriptionTier } from '../types';
import { LEVELS, CREATIVE_LEVEL } from '../constants';
import { Button } from '../components/Button';
import { Robot } from '../components/Robot';
import { BlockIcon } from '../components/BlockIcon';
import { StatusIndicator } from '../components/StatusIndicator';
import { SparkyLogo } from '../components/SparkyLogo';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';
import { GoogleGenAI } from "@google/genai";

interface GameScreenProps {
  levelId: number | string;
  onBack: () => void;
  onHome?: () => void;
  onNextLevel: (blocksUsed: number) => void;
  user?: UserProfile | null;
  onUpdateSkin?: (skinId: string) => void;
}

const EndLevelModal: React.FC<{
  status: 'won' | 'lost';
  level: LevelConfig;
  blocksUsed: number;
  onRetry: () => void;
  onNext: () => void;
  explanation?: string | null;
  isAnalyzing?: boolean;
}> = ({ status, level, blocksUsed, onRetry, onNext, explanation, isAnalyzing }) => {
  const isWon = status === 'won';
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-indigo-950/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.8, y: 50, rotate: -2 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        className={`bg-white rounded-[3.5rem] p-8 md:p-12 text-center max-w-lg w-full shadow-2xl border-b-[16px] ${isWon ? 'border-green-500' : 'border-red-500'} relative overflow-hidden`}
      >
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${isWon ? 'bg-green-400' : 'bg-red-400'}`} />
        <div className={`absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${isWon ? 'bg-blue-400' : 'bg-orange-400'}`} />

        <div className="relative z-10">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg ${isWon ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600 animate-bounce'}`}>
            {isWon ? <CheckCircle size={60} strokeWidth={3} /> : <XCircle size={60} strokeWidth={3} />}
          </div>

          <h2 className="text-4xl md:text-5xl font-heading mb-2 text-slate-800 uppercase tracking-tighter">
            {isWon ? 'Missão Cumprida!' : 'Ops! Bati!'}
          </h2>
          
          <p className="text-slate-500 font-bold text-lg mb-8">
            {isWon ? `Nível ${level.id} Desbloqueado!` : 'Vamos revisar seu código?'}
          </p>

          {isWon && (
            <div className="flex justify-center gap-4 mb-8">
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}><Star size={48} className="text-yellow-400 fill-yellow-400 drop-shadow-md" /></motion.div>
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }}><Star size={56} className="text-yellow-400 fill-yellow-400 drop-shadow-md -mt-2" /></motion.div>
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }}><Star size={48} className="text-yellow-400 fill-yellow-400 drop-shadow-md" /></motion.div>
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 mb-8 text-left">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Estatísticas</span>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">{blocksUsed} blocos usados</span>
            </div>
            
            <div className="flex items-start gap-4">
               <div className="bg-indigo-500 p-2 rounded-xl text-white shrink-0">
                  <MessageSquare size={20} />
               </div>
               <div className="text-sm text-slate-700 font-bold leading-relaxed min-h-[60px]">
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2 animate-pulse text-indigo-500">
                       <Sparkles size={16} /> Analisando sua lógica...
                    </div>
                  ) : explanation || level.explanation || (isWon ? 'Você foi incrível! Seu robô seguiu cada comando perfeitamente.' : 'Quase lá! Tente mudar a ordem dos blocos ou remover o que não precisa.')}
               </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={onRetry} className="flex-1 py-4 text-xl font-heading bg-slate-100 text-slate-600 rounded-3xl border-b-4 border-slate-300 active:border-b-0 flex items-center justify-center gap-2">
               <RotateCcw size={24} /> {isWon ? 'Tentar de Novo' : 'Revisar Código'}
            </button>
            {isWon && (
              <button onClick={onNext} className="flex-1 py-4 text-xl font-heading bg-green-500 text-white rounded-3xl border-b-4 border-green-700 active:border-b-0 flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                 Próxima Missão <ArrowRight size={24} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SkinSelector: React.FC<{ currentSkin: string, onSelect: (id: string) => void, onClose: () => void, userTier: SubscriptionTier }> = ({ currentSkin, onSelect, onClose, userTier }) => {
  const skins = [
    { id: 'default', name: 'Sparky Clássico', desc: 'O original.', locked: false },
    { id: 'ninja', name: 'Ninja do Código', desc: 'Rápido e silencioso.', locked: userTier === SubscriptionTier.FREE },
    { id: 'fairy', name: 'Fada da Lógica', desc: 'Voando pelos bugs.', locked: userTier === SubscriptionTier.FREE },
    { id: 'dino', name: 'Dino Dados', desc: 'Forte e destemido.', locked: userTier === SubscriptionTier.FREE },
  ];
  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
       <div className="bg-white rounded-[2rem] p-6 max-w-2xl w-full border-4 border-indigo-200 relative animate-popIn shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><XCircle /></button>
          <div className="text-center mb-6">
             <h2 className="text-3xl font-heading text-indigo-900 mb-2 flex items-center justify-center gap-3">
               <Shirt className="text-indigo-500" size={32} /> Guarda-Roupa do Robô
             </h2>
             <p className="text-slate-500 font-bold">Escolha o visual do seu personagem!</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {skins.map(skin => (
                <button key={skin.id} disabled={skin.locked} onClick={() => onSelect(skin.id)} className={`relative group rounded-2xl p-4 border-4 transition-all duration-200 flex flex-col items-center gap-3 ${currentSkin === skin.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg'} ${skin.locked ? 'opacity-80' : ''}`}>
                   <div className="w-20 h-20 relative">
                      <Robot x={0} y={0} cellSize={80} skinId={skin.id} direction="right" />
                      {skin.locked && (
                         <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-[1px]"><Lock className="text-white drop-shadow-md" size={32} /></div>
                      )}
                      {currentSkin === skin.id && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm z-20"><CheckCircle size={16} /></div>
                      )}
                   </div>
                   <div className="text-center">
                      <h3 className="font-heading text-xs text-slate-800 leading-tight">{skin.name}</h3>
                      {skin.locked ? <div className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1"><Crown size={10} /> VIP</div> : <span className="text-[10px] text-slate-400">{skin.desc}</span>}
                   </div>
                </button>
             ))}
          </div>
          <div className="mt-6 flex justify-center"><Button onClick={onClose} variant="primary" size="md" className="min-w-[150px]">Pronto!</Button></div>
       </div>
    </div>
  );
};

export const GameScreen: React.FC<GameScreenProps> = ({ levelId, onBack, onHome, onNextLevel, user, onUpdateSkin }) => {
  const level = levelId === 'creative' ? CREATIVE_LEVEL : (LEVELS.find(l => l.id === levelId) || LEVELS[0]);
  const isHackerMode = level.id === 45 || level.id === 'creative'; 

  const [program, setProgram] = useState<BlockType[]>([]);
  const [robotState, setRobotState] = useState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' as 'left' | 'right' | 'up' | 'down' });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'running' | 'won' | 'lost'>('idle');
  const [paintedCells, setPaintedCells] = useState<GridPosition[]>([]);
  
  const [activeObstacles, setActiveObstacles] = useState<GridPosition[]>(level.obstacles);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSkinSelector, setShowSkinSelector] = useState(false);

  const [logicExplanation, setLogicExplanation] = useState<string | null>(null);
  const [isAnalyzingLogic, setIsAnalyzingLogic] = useState(false);

  const abortController = useRef<AbortController | null>(null);
  const programListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioService.setMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    setProgram([]);
    resetGame();
    setActiveObstacles(level.obstacles);
    if (level.mission && !isMuted) {
      setTimeout(() => {
        audioService.speak(
          `Missão ${level.id === 'creative' ? 'Criativa' : level.id}: ${level.mission}.`,
          'instruction',
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }, 500); 
    }
    return () => {
      audioService.stop();
    };
  }, [levelId]);

  const handleExplainLogic = async () => {
    if (!process.env.API_KEY || program.length === 0) return;
    setIsAnalyzingLogic(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const blocksLabels = program.map(b => BLOCK_DEFINITIONS[b].label).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é o Sparky, robô tutor. O aluno usou: [${blocksLabels}] para vencer o nível ${level.id}. Explique por que essa lógica é boa para uma criança de 7 anos. Seja muito lúdico e encorajador. Use emojis. Curto (max 2 parágrafos).`,
      });
      setLogicExplanation(response.text || "Uau! Sua lógica funcionou!");
    } catch (e) {
      setLogicExplanation("Sua lógica é única! Você usou os comandos certos na hora certa.");
    } finally { setIsAnalyzingLogic(false); }
  };

  useEffect(() => {
    if (gameStatus === 'won') {
       audioService.playSfx('success');
       setTimeout(() => {
           audioService.speak("Conseguimos! Você é incrível!", 'happy', () => setIsSpeaking(true), () => setIsSpeaking(false));
       }, 500);
       handleExplainLogic();
    } else if (gameStatus === 'lost') {
       audioService.playSfx('error');
       setTimeout(() => {
           audioService.speak("Ops, bati! Vamos tentar de novo?", 'neutral', () => setIsSpeaking(true), () => setIsSpeaking(false));
       }, 500);
    }
  }, [gameStatus]);

  const resetGame = () => {
    if (abortController.current) abortController.current.abort();
    setRobotState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' });
    setPaintedCells([]);
    setGameStatus('idle');
    setIsPlaying(false);
    setCurrentBlockIndex(null);
    setLogicExplanation(null);
    audioService.stop();
  };

  const clearWorkspace = () => {
    if (isPlaying) return;
    setProgram([]);
    resetGame();
    audioService.playSfx('delete');
  };

  const addBlock = (type: BlockType) => {
    if (program.length < level.maxBlocks) {
      setProgram(prev => [...prev, type]);
      audioService.playSfx('pop');
    }
  };

  const removeBlock = (index: number) => {
    if (isPlaying) return;
    const newProgram = [...program];
    newProgram.splice(index, 1);
    setProgram(newProgram);
    audioService.playSfx('delete');
  };

  const handleDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('blockType', type);
    audioService.playSfx('click');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('blockType') as BlockType;
    if (type) addBlock(type);
  };

  const runProgram = async () => {
    if (program.length === 0 || isPlaying) return;
    
    // Forçar reset para o início antes de começar
    resetGame();
    setRobotState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' });
    setGameStatus('running');
    setIsPlaying(true);
    audioService.playSfx('start');

    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    const STEP_DURATION = level.isCreative ? 1200 : (isHackerMode ? 150 : 1000); 
    const PAINT_DURATION = level.isCreative ? 1000 : (isHackerMode ? 100 : 800);

    const wait = (ms: number) => new Promise(resolve => {
        if (signal.aborted) return;
        setTimeout(resolve, ms);
    });

    let currentX = level.startPos.x;
    let currentY = level.startPos.y;
    let currentDir = 'right' as any;
    let localPainted = [] as GridPosition[];
    let hasFailed = false;

    const getBlockSize = (idx: number): number => {
      if (idx >= program.length) return 0;
      const type = program[idx];
      if (type === BlockType.REPEAT_2 || type === BlockType.REPEAT_3 || type === BlockType.REPEAT_UNTIL) return 1 + getBlockSize(idx + 1);
      return 1;
    }

    const executeBlock = async (idx: number): Promise<void> => {
        if (idx >= program.length || signal.aborted || hasFailed) return;
        setCurrentBlockIndex(idx);
        const type = program[idx];

        if (type === BlockType.REPEAT_2 || type === BlockType.REPEAT_3) {
            const count = type === BlockType.REPEAT_2 ? 2 : 3;
            for (let i = 0; i < count; i++) {
                if (signal.aborted || hasFailed) return;
                await executeBlock(idx + 1); 
            }
            return;
        }

        if (type === BlockType.PAINT) {
            localPainted = [...localPainted, {x: currentX, y: currentY}];
            setPaintedCells([...localPainted]);
            await wait(PAINT_DURATION);
            return;
        }

        let dx = 0, dy = 0;
        if (type === BlockType.MOVE_UP) { dy = -1; currentDir = 'up'; }
        else if (type === BlockType.MOVE_DOWN) { dy = 1; currentDir = 'down'; }
        else if (type === BlockType.MOVE_LEFT) { dx = -1; currentDir = 'left'; }
        else if (type === BlockType.MOVE_RIGHT) { dx = 1; currentDir = 'right'; }

        if (dx !== 0 || dy !== 0) {
            const nx = currentX + dx, ny = currentY + dy;
            const isObs = activeObstacles.some(o => o.x === nx && o.y === ny) || nx < 0 || nx >= level.gridSize || ny < 0 || ny >= level.gridSize;
            
            if (isObs) {
                hasFailed = true;
                setRobotState({ x: currentX, y: currentY, dir: currentDir });
                await wait(800);
                if (!signal.aborted) setGameStatus('lost');
                return;
            }
            
            currentX = nx; currentY = ny;
            setRobotState({ x: currentX, y: currentY, dir: currentDir });
            audioService.playSfx('click');
            await wait(STEP_DURATION);
        }
    };

    try {
        let pc = 0;
        while (pc < program.length && !hasFailed) {
            if (signal.aborted) break;
            await executeBlock(pc);
            pc += getBlockSize(pc);
        }
        
        if (!signal.aborted) {
            // Aguardar exatamente 1 segundo após o último comando para confirmar sucesso/erro
            await wait(1000);
            if (signal.aborted) return;

            if (hasFailed) {
                setGameStatus('lost');
            } else {
                const isAtGoal = level.goalPos ? (currentX === level.goalPos.x && currentY === level.goalPos.y) : true;
                const hasActuallyExecuted = program.length > 0;

                if (isAtGoal && hasActuallyExecuted) {
                    setGameStatus('won');
                    confetti({ particleCount: 150, spread: 70 });
                } else {
                    setGameStatus('lost');
                }
            }
        }
    } catch (e) { 
        console.error(e);
    } finally {
        setIsPlaying(false);
        setCurrentBlockIndex(null);
    }
  };

  const availableBlocks = level.availableBlocks || [];
  const blocksByCategory = Array.from(new Set(availableBlocks.map(b => BLOCK_DEFINITIONS[b].category))) as BlockCategory[];
  const workspaceClass = isHackerMode ? 'bg-slate-900' : 'bg-slate-100';

  return (
    <div className={`flex flex-col md:flex-row md:h-screen md:overflow-hidden min-h-screen ${isHackerMode ? 'bg-slate-900 text-green-400' : 'bg-slate-50 text-slate-800'}`}>
      
      <div className="w-full md:w-64 border-r flex flex-col z-10 shadow-lg shrink-0 bg-white">
         <div className="p-4 border-b flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-1 font-bold text-indigo-600"><ArrowLeft size={18}/> Mapa</button>
            <button onClick={() => setIsMuted(!isMuted)}>{isMuted ? <VolumeX className="text-red-500" /> : <Volume2 className="text-blue-500" />}</button>
         </div>
         <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            {blocksByCategory.map(cat => (
                <div key={cat} className="mb-6">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2">{cat}</h3>
                    <div className="flex flex-col gap-2">
                        {availableBlocks.filter(b => BLOCK_DEFINITIONS[b].category === cat).map(type => (
                            <button key={type} draggable onDragStart={(e) => handleDragStart(e, type)} onClick={() => addBlock(type)} className="text-left">
                                <BlockIcon type={type} className="py-2" />
                            </button>
                        ))}
                    </div>
                </div>
            ))}
         </div>
      </div>

      <div className="flex-1 flex flex-col relative shrink-0 bg-slate-200 h-[45vh] md:h-auto border-x border-slate-300">
          <div className="p-3 bg-white/80 border-b flex items-center justify-between">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><Target size={16}/> {level.mission}</div>
             <StatusIndicator isGuest={user?.isGuest} />
          </div>

          <div className="flex-1 relative overflow-auto flex items-center justify-center p-4">
              <div 
                className={`relative shadow-2xl rounded-2xl overflow-hidden bg-white border-4 border-white ${gameStatus === 'lost' ? 'animate-shake ring-4 ring-red-400' : ''}`}
                style={{ width: level.gridSize * 60, height: level.gridSize * 60, backgroundSize: '60px 60px', backgroundImage: 'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)' }}
              >
                  {level.goalPos && <div className="absolute flex items-center justify-center animate-pulse" style={{ left: level.goalPos.x * 60, top: level.goalPos.y * 60, width: 60, height: 60 }}><div className="w-8 h-8 rounded-full border-4 border-green-400 bg-green-100" /></div>}
                  {activeObstacles.map((obs, i) => <div key={i} className="absolute rounded-xl bg-slate-700 border-b-4 border-slate-900" style={{ left: obs.x * 60 + 5, top: obs.y * 60 + 5, width: 50, height: 50 }} />)}
                  {paintedCells.map((cell, i) => <div key={i} className="absolute bg-purple-400/50" style={{ left: cell.x * 60, top: cell.y * 60, width: 60, height: 60 }} />)}
                  
                  {/* Alerta de Colisão Visual (Shockwave) */}
                  <AnimatePresence>
                      {gameStatus === 'lost' && (
                        <motion.div 
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 3, opacity: 0.2 }}
                          exit={{ opacity: 0 }}
                          className="absolute bg-red-500 rounded-full z-10"
                          style={{ left: robotState.x * 60 - 60, top: robotState.y * 60 - 60, width: 180, height: 180 }}
                        />
                      )}
                  </AnimatePresence>

                  <Robot x={robotState.x} y={robotState.y} cellSize={60} direction={robotState.dir} isHappy={gameStatus === 'won'} isSad={gameStatus === 'lost'} skinId={user?.activeSkin} />
              </div>

              {/* Botão de Skins - Ícone de Camiseta */}
              <button 
                onClick={() => setShowSkinSelector(true)}
                className="absolute bottom-6 left-6 p-4 bg-white rounded-full shadow-2xl border-4 border-indigo-100 text-indigo-600 hover:scale-110 active:scale-95 transition-all z-30 group"
                title="Trocar de Roupa"
              >
                <Shirt size={32} />
                <div className="absolute -top-1 -right-1 bg-yellow-400 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"><Sparkles size={12} className="text-yellow-800" /></div>
              </button>
          </div>

          <AnimatePresence>
            {(gameStatus === 'won' || gameStatus === 'lost') && (
              <EndLevelModal 
                status={gameStatus === 'won' ? 'won' : 'lost'}
                level={level}
                blocksUsed={program.length}
                onRetry={resetGame}
                onNext={() => onNextLevel(program.length)}
                explanation={logicExplanation}
                isAnalyzing={isAnalyzingLogic}
              />
            )}
          </AnimatePresence>
      </div>

      <div className={`w-full md:w-72 flex flex-col relative ${workspaceClass} shadow-2xl z-10`}>
          <div className="p-4 border-b flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
              <span>Lógica de Comandos</span>
              <span>{program.length}/{level.maxBlocks}</span>
          </div>
          <div ref={programListRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-1 no-scrollbar" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
              {program.length === 0 && <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center"><Code size={32}/><p className="text-[10px] font-bold mt-2">Arraste blocos aqui</p></div>}
              {program.map((block, idx) => (
                  <motion.div key={idx} layout className={`flex items-center group ${currentBlockIndex === idx ? 'scale-105 brightness-110 shadow-lg' : ''}`}>
                      <div className="bg-slate-200 text-slate-500 text-[9px] w-6 h-8 flex items-center justify-center rounded-l-lg font-black border-y-2 border-l-2">{idx+1}</div>
                      <div className="flex-1"><BlockIcon type={block} className="rounded-l-none border-b-2 text-[11px] py-1.5" /></div>
                      {!isPlaying && <button onClick={() => removeBlock(idx)} className="ml-1 p-1 text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>}
                  </motion.div>
              ))}
          </div>
          <div className="p-4 bg-white border-t flex flex-col gap-2">
              <div className="flex gap-2">
                  <button onClick={clearWorkspace} disabled={isPlaying} className="bg-red-100 text-red-600 p-3 rounded-xl disabled:opacity-50"><Trash2 size={20}/></button>
                  <Button onClick={runProgram} variant={isPlaying ? 'secondary' : 'success'} size="md" className="flex-1" disabled={program.length === 0 || gameStatus === 'won'}>
                      {isPlaying ? <><Pause size={18}/> Parar</> : <><Play size={18} fill="currentColor"/> Executar</>}
                  </Button>
              </div>
          </div>
      </div>

      {showSkinSelector && user && onUpdateSkin && (
        <SkinSelector 
          currentSkin={user.activeSkin || 'default'} 
          userTier={user.subscription} 
          onClose={() => setShowSkinSelector(false)} 
          onSelect={(id) => { onUpdateSkin(id); setShowSkinSelector(false); }} 
        />
      )}
    </div>
  );
};
