
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, RotateCcw, Trash2, HelpCircle, Pause, CheckCircle, XCircle, ArrowRight, Repeat, Code, Terminal, Move, Clock, Battery, BatteryWarning, Target, Brush, Volume2, VolumeX, Shirt, Lock, Crown, Waves, Sparkles, Wand2, X, Map as MapIcon, LogOut, Maximize2, MessageSquare } from 'lucide-react';
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

const TutorialDemo: React.FC = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => { setStep((prev) => (prev + 1) % 4); }, 1200);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="bg-slate-50 rounded-xl p-6 mb-6 border-2 border-slate-200">
         <div className="flex flex-col md:flex-row items-center justify-around gap-6">
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Seu Código</span>
                <div className="relative transform transition-all duration-300">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white bg-orange-500 border-b-4 border-orange-700 transition-all duration-300 ${step > 0 ? 'scale-105 ring-4 ring-orange-200 shadow-lg' : 'scale-100'}`}>
                        <Repeat size={18} /> <span>Repetir 3x</span>
                    </div>
                    <div className="ml-6 -mt-1 pt-2">
                         <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-white bg-blue-500 border-b-4 border-blue-700 shadow-sm transition-all duration-200 ${step > 0 ? 'translate-x-1 opacity-100' : 'opacity-80'}`}>
                            <ArrowRight size={16} /> <span>Andar</span>
                         </div>
                    </div>
                    {step > 0 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-white text-orange-600 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-orange-500 z-10 shadow">
                            {step}
                        </motion.div>
                    )}
                </div>
             </div>
             <div className="hidden md:block text-slate-300"><ArrowRight size={24} /></div>
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">O que acontece</span>
                <div className="bg-white p-2 rounded-xl border border-slate-200 w-48 h-20 relative overflow-hidden shadow-inner flex items-center">
                    <div className="absolute inset-0 grid grid-cols-4 gap-1 p-2 opacity-20 pointer-events-none">
                        {[1,2,3,4].map(i => <div key={i} className="border border-slate-400 rounded bg-slate-100 h-full"></div>)}
                    </div>
                    <motion.div className="w-10 h-10 bg-blue-500 rounded-lg border-2 border-blue-700 absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center text-white shadow-md" animate={{ left: (step * 35) + 10 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                        <div className="w-6 h-4 bg-white rounded border border-blue-300"></div>
                    </motion.div>
                </div>
                <div className="mt-3 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">{step === 0 ? "Aguardando..." : `Executando vez ${step} de 3`}</div>
             </div>
         </div>
    </div>
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
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
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
                      <h3 className="font-heading text-sm text-slate-800 leading-tight">{skin.name}</h3>
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
  const isWaterLevel = level.id === 16; 

  const [program, setProgram] = useState<BlockType[]>([]);
  const [robotState, setRobotState] = useState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' as 'left' | 'right' | 'up' | 'down' });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'running' | 'won' | 'lost'>('idle');
  const [paintedCells, setPaintedCells] = useState<GridPosition[]>([]);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  
  const [activeObstacles, setActiveObstacles] = useState<GridPosition[]>(level.obstacles);
  const [aiGenCount, setAiGenCount] = useState(0);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSkinSelector, setShowSkinSelector] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [draggingBlock, setDraggingBlock] = useState<BlockType | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(level.timeLimit || null);
  const [showControlGuide, setShowControlGuide] = useState(false);
  const [hasSeenControlGuide, setHasSeenControlGuide] = useState(false);

  // IA Explicação State
  const [logicExplanation, setLogicExplanation] = useState<string | null>(null);
  const [isAnalyzingLogic, setIsAnalyzingLogic] = useState(false);

  const abortController = useRef<AbortController | null>(null);
  const programListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioService.setMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
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

  const handleAiGeneration = async () => {
    if (!process.env.API_KEY) return;
    if (aiGenCount >= 3) return;
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create obstacles for a ${level.gridSize}x${level.gridSize} grid. Request: "${aiPrompt}". Return ONLY a JSON array of objects with x and y. No start position (${level.startPos.x},${level.startPos.y}). Example: [{"x":1,"y":1}]`,
        config: { responseMimeType: 'application/json' }
      });
      const jsonText = response.text || "[]";
      const newObstacles = JSON.parse(jsonText);
      if (Array.isArray(newObstacles)) {
        setActiveObstacles(newObstacles);
        setAiGenCount(prev => prev + 1);
        setShowAiModal(false);
        setAiPrompt('');
        audioService.playSfx('success');
        confetti({ particleCount: 50, spread: 60 });
      }
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const handleExplainLogic = async () => {
    if (!process.env.API_KEY || program.length === 0) return;
    setIsAnalyzingLogic(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const blocksLabels = program.map(b => BLOCK_DEFINITIONS[b].label).join(', ');
      const aiContribution = aiGenCount > 0 ? "O cenário foi criado com ajuda da Inteligência Artificial do Arquiteto." : "O cenário é o padrão do nível.";
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é o Sparky, robô tutor. O aluno usou: [${blocksLabels}]. ${aiContribution}. Explique a LÓGICA por trás desse código para uma criança. Seja encorajador, use emojis. Curto (max 2 parágrafos).`,
      });
      setLogicExplanation(response.text || "Uau! Sua lógica funcionou!");
    } catch (e) {
      setLogicExplanation("Sua lógica é única! Continue explorando.");
    } finally { setIsAnalyzingLogic(false); }
  };

  useEffect(() => {
    if (gameStatus === 'won') {
       audioService.playSfx('success');
       setTimeout(() => {
           audioService.speak("Conseguimos! Você é incrível!", 'happy', () => setIsSpeaking(true), () => setIsSpeaking(false));
       }, 500);
       setTimeout(handleExplainLogic, 1500);
    } else if (gameStatus === 'lost') {
       audioService.playSfx('error');
       setTimeout(() => {
           audioService.speak("Ops, bati! Vamos tentar de novo?", 'neutral', () => setIsSpeaking(true), () => setIsSpeaking(false));
       }, 500);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (!level.timeLimit || gameStatus !== 'running') return;
    if (timeLeft !== null && timeLeft <= 0) {
       setGameStatus('lost');
       setIsPlaying(false);
       if (abortController.current) abortController.current.abort();
       return;
    }
    const timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameStatus]);

  const resetGame = () => {
    if (abortController.current) abortController.current.abort();
    setRobotState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' });
    setPaintedCells([]);
    setGameStatus('idle');
    setIsPlaying(false);
    setCurrentBlockIndex(null);
    setTimeLeft(level.timeLimit || null);
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

  const runProgram = async (skipGuideCheck = false) => {
    if (program.length === 0 || isPlaying) return;
    
    // Mostra guia de controle se for a primeira vez, mas não bloqueia a execução no modo história
    const hasControlBlock = program.some(b => BLOCK_DEFINITIONS[b].category === BlockCategory.CONTROL);
    if (hasControlBlock && !hasSeenControlGuide && !skipGuideCheck && !isHackerMode) {
        setShowControlGuide(true);
        setHasSeenControlGuide(true);
    }

    resetGame();
    setIsPlaying(true);
    setGameStatus('running');
    audioService.playSfx('start');

    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    // VELOCIDADE AJUSTADA: 1000ms para história (antes 400), 1200ms para criativo (antes 800)
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

    const getBlockSize = (idx: number): number => {
      if (idx >= program.length) return 0;
      const type = program[idx];
      if (type === BlockType.REPEAT_2 || type === BlockType.REPEAT_3 || type === BlockType.REPEAT_UNTIL) return 1 + getBlockSize(idx + 1);
      if (type === BlockType.IF_OBSTACLE || type === BlockType.IF_PATH) {
        let size = 1 + getBlockSize(idx + 1); 
        let checkIdx = idx + size;
        while (checkIdx < program.length) {
            const nextType = program[checkIdx];
            if (nextType === BlockType.ELSE || nextType === BlockType.ELSE_IF) {
                const branchSize = 1 + getBlockSize(checkIdx + 1);
                size += branchSize;
                checkIdx += branchSize;
            } else break;
        }
        return size;
      }
      return 1;
    }

    const executeBlock = async (idx: number): Promise<void> => {
        if (idx >= program.length || signal.aborted) return;
        setCurrentBlockIndex(idx);
        const type = program[idx];

        if (type === BlockType.REPEAT_2 || type === BlockType.REPEAT_3) {
            const count = type === BlockType.REPEAT_2 ? 2 : 3;
            for (let i = 0; i < count; i++) {
                if (signal.aborted) return;
                await executeBlock(idx + 1); 
            }
            return;
        }

        if (type === BlockType.PAINT) {
            localPainted = [...localPainted, {x: currentX, y: currentY}];
            setPaintedCells(localPainted);
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
                setRobotState({ x: currentX, y: currentY, dir: currentDir });
                setGameStatus('lost');
                throw new Error('Hit');
            }
            currentX = nx; currentY = ny;
            setRobotState({ x: currentX, y: currentY, dir: currentDir });
            audioService.playSfx('click');
            await wait(STEP_DURATION);
        }
    };

    try {
        let pc = 0;
        while (pc < program.length) {
            if (signal.aborted) break;
            await executeBlock(pc);
            pc += getBlockSize(pc);
        }
        if (!signal.aborted && gameStatus === 'running') {
            if (level.goalPos && (currentX !== level.goalPos.x || currentY !== level.goalPos.y)) {
                setGameStatus('lost');
            } else {
                setGameStatus('won');
                confetti({ particleCount: 150, spread: 70 });
            }
        }
    } catch (e) { setIsPlaying(false); }
    setIsPlaying(false);
    setCurrentBlockIndex(null);
  };

  const availableBlocks = level.availableBlocks || [];
  const blocksByCategory = Array.from(new Set(availableBlocks.map(b => BLOCK_DEFINITIONS[b].category)));
  const workspaceClass = isHackerMode ? 'bg-slate-900' : 'bg-slate-100';

  return (
    <div className={`flex flex-col md:flex-row md:h-screen md:overflow-hidden min-h-screen ${isHackerMode ? 'bg-slate-900 text-green-400' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* 1. PALETA (ESQUERDA) */}
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

      {/* 2. PALCO (CENTRO) */}
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
                  <Robot x={robotState.x} y={robotState.y} cellSize={60} direction={robotState.dir} isHappy={gameStatus === 'won'} isSad={gameStatus === 'lost'} skinId={user?.activeSkin} />
              </div>
          </div>

          <AnimatePresence>
            {(gameStatus === 'won' || gameStatus === 'lost') && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-40">
                    <div className="bg-white rounded-[2rem] p-8 text-center max-w-sm shadow-2xl">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${gameStatus === 'won' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{gameStatus === 'won' ? <CheckCircle size={40}/> : <XCircle size={40}/>}</div>
                        <h2 className="text-2xl font-heading mb-2">{gameStatus === 'won' ? 'Incrível!' : 'Ops, bati!'}</h2>
                        <p className="text-slate-500 text-sm mb-6 font-bold">{gameStatus === 'won' ? level.explanation : 'Vamos revisar seu código?'}</p>
                        <div className="flex gap-2">
                            <Button onClick={resetGame} variant="secondary" size="sm" className="flex-1"><RotateCcw size={16}/> Tentar</Button>
                            {gameStatus === 'won' && <Button onClick={() => onNextLevel(program.length)} variant="primary" size="sm" className="flex-1">Próximo</Button>}
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* 3. WORKSPACE (DIREITA) */}
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
                  <Button onClick={() => runProgram(false)} variant={isPlaying ? 'secondary' : 'success'} size="md" className="flex-1" disabled={program.length === 0 || gameStatus === 'won'}>
                      {isPlaying ? <><Pause size={18}/> Parar</> : <><Play size={18} fill="currentColor"/> Executar</>}
                  </Button>
              </div>
          </div>
      </div>

      {/* MODAL EXPLICAÇÃO IA */}
      <AnimatePresence>
        {logicExplanation && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9 }} className="bg-white rounded-[2rem] p-8 max-w-lg w-full border-4 border-indigo-200 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600"><SparkyLogo size="sm" showText={false} /></div>
                    <h3 className="text-xl font-heading text-indigo-900 mb-2">Análise do Sparky</h3>
                    <div className="bg-indigo-50 p-5 rounded-2xl text-slate-700 font-bold text-sm leading-relaxed mb-6">{logicExplanation}</div>
                    <Button onClick={() => setLogicExplanation(null)} variant="primary" className="w-full">Entendi, Sparky!</Button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {isAnalyzingLogic && (
        <div className="fixed inset-0 z-[80] bg-indigo-900/40 flex items-center justify-center">
            <div className="bg-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3"><div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div><span className="font-bold text-indigo-900">Sparky está pensando...</span></div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-6 max-w-md w-full relative">
               <button onClick={() => setShowAiModal(false)} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
               <h2 className="text-xl font-heading text-purple-900 mb-4">Arquiteto IA</h2>
               <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Ex: Um labirinto gigante" className="w-full border-2 border-slate-200 rounded-xl p-3 mb-4 outline-none focus:border-purple-500" autoFocus />
               <Button onClick={handleAiGeneration} disabled={isGenerating || !aiPrompt.trim()} variant="secondary" className="w-full">Gerar Agora ✨</Button>
           </div>
        </div>
      )}

      {showSkinSelector && user && onUpdateSkin && <SkinSelector currentSkin={user.activeSkin || 'default'} userTier={user.subscription} onClose={() => setShowSkinSelector(false)} onSelect={(id) => { onUpdateSkin(id); setShowSkinSelector(false); }} />}
    </div>
  );
};
