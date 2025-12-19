
import { GoogleGenAI } from "@google/genai";
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Battery, Code, HelpCircle, MessageSquare, Pause, Play, RotateCcw, Shirt, Sparkles, Star, Target, Terminal, Trash2, Volume2, VolumeX, XCircle, CheckCircle, Lock, Crown } from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { BlockIcon } from '../components/BlockIcon';
import { Button } from '../components/Button';
import { Robot } from '../components/Robot';
import { StatusIndicator } from '../components/StatusIndicator';
import { SparkyLogo } from '../components/SparkyLogo';
import { CREATIVE_LEVEL, LEVELS } from '../constants';
import { audioService } from '../services/AudioService';
import { BlockCategory, BlockType, GridPosition, BLOCK_DEFINITIONS, UserProfile, SubscriptionTier, LevelConfig } from '../types';

interface GameScreenProps {
  levelId: number | string;
  customConfig?: LevelConfig | null;
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

          <h2 className="text-4xl md:text-5xl font-heading mb-2 text-slate-800 uppercase tracking-tighter text-center">
            {isWon ? 'Missão Cumprida!' : 'Ops! Bati!'}
          </h2>
          
          <p className="text-slate-500 font-bold text-lg mb-8 text-center">
            {isWon ? (level.id === 'creative' || String(level.id).startsWith('custom') ? 'Você venceu sua própria fase!' : `Nível ${String(level.id)} Desbloqueado!`) : 'Vamos revisar seu código?'}
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
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">{String(blocksUsed)} blocos usados</span>
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
                  ) : String(explanation || level.explanation || (isWon ? 'Você foi incrível! Seu robô seguiu cada comando perfeitamente.' : 'Quase lá! Tente mudar a ordem dos blocos ou remover o que não precisa.'))}
               </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={onRetry} className="flex-1 py-4 text-xl font-heading bg-slate-100 text-slate-600 rounded-3xl border-b-4 border-slate-300 active:border-b-0 flex items-center justify-center gap-2 transition-all">
               <RotateCcw size={24} /> {isWon ? 'Tentar de Novo' : 'Revisar Código'}
            </button>
            {isWon && (
              <button onClick={onNext} className="flex-1 py-4 text-xl font-heading bg-green-500 text-white rounded-3xl border-b-4 border-green-700 active:border-b-0 flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all">
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
       <div className="bg-white rounded-[2rem] p-6 max-w-2xl w-full border-4 border-indigo-200 relative animate-popIn shadow-2xl overflow-y-auto max-h-[90vh]">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><XCircle /></button>
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
                      <h3 className="font-heading text-[10px] text-slate-800 leading-tight uppercase tracking-tighter">{skin.name}</h3>
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

export const GameScreen: React.FC<GameScreenProps> = ({ levelId, customConfig, onBack, onHome, onNextLevel, user, onUpdateSkin }) => {
  const level = customConfig || (levelId === 'creative' ? CREATIVE_LEVEL : (LEVELS.find(l => l.id === levelId) || LEVELS[0]));
  const isHackerMode = level.id === 45 || level.id === 'creative' || String(level.id).startsWith('custom'); 

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

  // Responsividade da Grade
  const [gridScale, setGridScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (stageRef.current) {
        const containerWidth = stageRef.current.offsetWidth - 40;
        const containerHeight = stageRef.current.offsetHeight - 40;
        const gridPixelSize = level.gridSize * 60;
        const scaleW = containerWidth / gridPixelSize;
        const scaleH = containerHeight / gridPixelSize;
        setGridScale(Math.min(1, scaleW, scaleH));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [level.gridSize]);

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
          `${String(level.id).startsWith('custom') ? 'Missão Criada' : 'Missão ' + String(level.id)}: ${level.mission}.`,
          'instruction',
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }, 500); 
    }
    return () => {
      audioService.stop();
    };
  }, [levelId, customConfig]);

  const handleExplainLogic = async () => {
    if (!process.env.API_KEY || program.length === 0) return;
    setIsAnalyzingLogic(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const blocksLabels = program.map(b => BLOCK_DEFINITIONS[b].label).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é o Sparky, robô tutor. O aluno usou: [${blocksLabels}] para vencer o nível ${String(level.id)}. Explique por que essa lógica é boa para uma criança de 7 anos. Seja muito lúdico e encorajador. Use emojis. Curto (max 2 parágrafos).`,
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
      setTimeout(() => {
          if (programListRef.current) {
              programListRef.current.scrollTop = programListRef.current.scrollHeight;
          }
      }, 100);
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
    
    resetGame();
    setRobotState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' });
    setGameStatus('running');
    setIsPlaying(true);
    audioService.playSfx('start');

    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    const STEP_DURATION = isHackerMode ? 350 : 800; 
    const PAINT_DURATION = isHackerMode ? 300 : 700;

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
            audioService.playTone(880, 0.1, 'sine');
            await wait(PAINT_DURATION);
            return;
        }

        let dx = 0, dy = 0;
        let nextDir = currentDir;
        if (type === BlockType.MOVE_UP) { dy = -1; nextDir = 'up'; }
        else if (type === BlockType.MOVE_DOWN) { dy = 1; nextDir = 'down'; }
        else if (type === BlockType.MOVE_LEFT) { dx = -1; nextDir = 'left'; }
        else if (type === BlockType.MOVE_RIGHT) { dx = 1; nextDir = 'right'; }

        if (dx !== 0 || dy !== 0) {
            const nx = currentX + dx, ny = currentY + dy;
            const isObs = activeObstacles.some(o => o.x === nx && o.y === ny) || nx < 0 || nx >= level.gridSize || ny < 0 || ny >= level.gridSize;
            
            currentDir = nextDir;
            setRobotState(prev => ({ ...prev, dir: currentDir }));
            
            if (isObs) {
                hasFailed = true;
                await wait(100);
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
            await wait(500);
            if (signal.aborted) return;

            if (hasFailed) {
                setGameStatus('lost');
            } else {
                const isAtGoal = level.goalPos ? (currentX === level.goalPos.x && currentY === level.goalPos.y) : true;
                const hasActuallyExecuted = program.length > 0;

                if (isAtGoal && hasActuallyExecuted) {
                    setGameStatus('won');
                    confetti({ particleCount: 150, spread: 70 });
                } else if (level.goalPos && !isAtGoal) {
                    setGameStatus('lost');
                } else {
                    setGameStatus('idle');
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
  const workspaceClass = isHackerMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200';

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden ${isHackerMode ? 'bg-slate-950 text-emerald-400' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Coluna 1: Paleta de Blocos */}
      <div className="w-full md:w-64 border-r flex flex-col z-10 shadow-lg shrink-0 bg-white h-[25vh] md:h-full overflow-hidden">
         <div className="p-4 border-b flex items-center justify-between bg-white shrink-0">
            <button onClick={onBack} className="flex items-center gap-1 font-bold text-indigo-600 hover:scale-105 transition-transform"><ArrowLeft size={18}/> {String(level.id).startsWith('custom') ? 'Oficina' : 'Mapa'}</button>
            <button onClick={() => setIsMuted(!isMuted)} className="hover:scale-110 transition-transform">{isMuted ? <VolumeX className="text-red-500" /> : <Volume2 className="text-blue-500" />}</button>
         </div>
         <div className="flex-1 overflow-y-auto p-4 no-scrollbar bg-slate-50">
            {blocksByCategory.map(cat => (
                <div key={cat} className="mb-6">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{String(cat)}</h3>
                    <div className="flex flex-col gap-2">
                        {availableBlocks.filter(b => BLOCK_DEFINITIONS[b].category === cat).map(type => (
                            <button key={type} draggable onDragStart={(e) => handleDragStart(e, type)} onClick={() => addBlock(type)} className="text-left group transform hover:translate-x-1 transition-transform">
                                <BlockIcon type={type} className="py-2 shadow-sm" />
                            </button>
                        ))}
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* Coluna 2: Palco do Robô (Grid Central) */}
      <div ref={stageRef} className="flex-1 flex flex-col relative shrink-0 bg-slate-200 border-x border-slate-300 h-[40vh] md:h-full overflow-hidden">
          <div className="p-3 bg-white/90 border-b flex items-center justify-between backdrop-blur-sm z-20">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-600 truncate max-w-[200px] md:max-w-none"><Target size={16} className="text-indigo-500"/> {String(level.mission)}</div>
             <StatusIndicator isGuest={user?.isGuest} />
          </div>

          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
              <motion.div 
                style={{ 
                    width: level.gridSize * 60, 
                    height: level.gridSize * 60, 
                    scale: gridScale,
                    backgroundSize: '60px 60px', 
                    backgroundImage: 'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)' 
                }}
                className={`relative shadow-2xl rounded-2xl overflow-hidden bg-white border-4 border-white transform origin-center ${gameStatus === 'lost' ? 'animate-shake ring-4 ring-red-400' : ''}`}
              >
                  {level.goalPos && <div className="absolute flex items-center justify-center animate-pulse" style={{ left: level.goalPos.x * 60, top: level.goalPos.y * 60, width: 60, height: 60 }}><div className="w-8 h-8 rounded-full border-4 border-green-400 bg-green-100" /></div>}
                  {activeObstacles.map((obs, i) => <div key={i} className="absolute rounded-xl bg-slate-700 border-b-4 border-slate-900" style={{ left: obs.x * 60 + 5, top: obs.y * 60 + 5, width: 50, height: 50 }} />)}
                  {paintedCells.map((cell, i) => <div key={i} className="absolute bg-purple-400/50" style={{ left: cell.x * 60, top: cell.y * 60, width: 60, height: 60 }} />)}
                  
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
              </motion.div>

              <button 
                onClick={() => setShowSkinSelector(true)}
                className="absolute bottom-6 left-6 p-4 bg-white rounded-full shadow-2xl border-4 border-indigo-100 text-indigo-600 hover:scale-110 active:scale-95 transition-all z-30 group"
                title="Trocar de Roupa"
              >
                <Shirt size={32} />
                <div className="absolute -top-1 -right-1 bg-yellow-400 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm"><Sparkles size={14} className="text-yellow-800" /></div>
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

      {/* Coluna 3: Workspace de Código */}
      <div className={`w-full md:w-80 flex flex-col relative ${workspaceClass} border-l shadow-2xl z-10 h-[35vh] md:h-full overflow-hidden`}>
          <div className="p-4 border-b flex justify-between items-center bg-white/50 backdrop-blur-sm shrink-0">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                 <Terminal size={14} /> Lógica de Comandos
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${program.length >= level.maxBlocks ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                 {String(program.length)}/{String(level.maxBlocks)}
              </span>
          </div>
          
          <div 
            ref={programListRef} 
            className="flex-1 p-4 overflow-y-auto flex flex-col gap-1.5 no-scrollbar bg-white/20" 
            onDragOver={e => e.preventDefault()} 
            onDrop={handleDrop}
          >
              {program.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center pointer-events-none mt-10">
                    <div className="p-4 bg-slate-200 rounded-full mb-4 animate-float">
                        <Code size={40} className="text-slate-400" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Arraste ou clique nos blocos<br/>para começar sua lógica</p>
                </div>
              )}
              
              <AnimatePresence>
                {program.map((block, idx) => (
                    <motion.div 
                        key={idx} 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        layout
                        className={`flex items-center group relative ${currentBlockIndex === idx ? 'scale-105 brightness-110 z-20' : ''}`}
                    >
                        <div className="bg-slate-200 text-slate-500 text-[8px] w-6 h-8 flex items-center justify-center rounded-l-lg font-black border-y border-l shrink-0">
                           {String(idx + 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <BlockIcon type={block} className="rounded-l-none border-b-2 text-[10px] py-2 shadow-sm" />
                        </div>
                        {!isPlaying && (
                           <button 
                             onClick={() => removeBlock(idx)} 
                             className="ml-1 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                             title="Remover Bloco"
                           >
                             <Trash2 size={16}/>
                           </button>
                        )}
                        {currentBlockIndex === idx && (
                           <motion.div 
                             layoutId="indicator" 
                             className="absolute -left-2 top-0 bottom-0 w-1 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]" 
                           />
                        )}
                    </motion.div>
                ))}
              </AnimatePresence>
          </div>

          {/* Área de Controle Inferior */}
          <div className="p-4 bg-white border-t flex flex-col gap-3 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <div className="flex gap-2">
                  <button 
                    onClick={clearWorkspace} 
                    disabled={isPlaying || program.length === 0} 
                    className="bg-red-50 text-red-500 p-3.5 rounded-2xl disabled:opacity-20 hover:bg-red-100 active:scale-95 transition-all shadow-sm border border-red-100"
                  >
                    <Trash2 size={24}/>
                  </button>
                  <Button 
                    onClick={runProgram} 
                    variant={isPlaying ? 'secondary' : 'success'} 
                    size="md" 
                    className="flex-1 h-14 text-xl shadow-lg active:scale-95 transition-transform" 
                    disabled={program.length === 0 || gameStatus === 'won'}
                  >
                      {isPlaying ? <><Pause size={24}/> Parar</> : <><Play size={24} fill="currentColor"/> Executar</>}
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
