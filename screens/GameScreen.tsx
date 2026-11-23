
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Battery, Code, HelpCircle, MessageSquare, Pause, Play, RotateCcw, Shirt, Sparkles, Star, Target, Terminal, Trash2, Volume2, VolumeX, XCircle, CheckCircle, Lock, Crown } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { BlockIcon } from '../components/BlockIcon';
import { Button } from '../components/Button';
import { Robot } from '../components/Robot';
import { StatusIndicator } from '../components/StatusIndicator';
import { SparkyLogo } from '../components/SparkyLogo';
import { CREATIVE_LEVEL, LEVELS, PRO_EXPANSION_LEVELS } from '../constants';
import { LEGACY_LEVEL_HINTS } from '../legacyLevelHints';
import { SPARKY_OBSERVATORY_LEVELS } from '../sparkyObservatoryLevels';
import { audioService } from '../services/AudioService';
import { simulateProProgram } from '../services/ProLevelProgram';
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

const GRID_CELL_SIZE = 60;
const STANDARD_GRID_SIZE = 5 * GRID_CELL_SIZE;

interface SparkyHintProps {
  text: string;
  onListen: () => void;
  isMuted: boolean;
}

const SparkyHint: React.FC<SparkyHintProps> = ({ text, onListen, isMuted }) => (
  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-left text-slate-800">
    <p className="flex items-center gap-2 text-sm font-black text-amber-900">
      <Sparkles size={16} aria-hidden="true" /> Dica do Sparky
    </p>
    <p className="mt-1 text-sm leading-relaxed">{text}</p>
    {!isMuted && (
      <button type="button" onClick={onListen} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">
        <Volume2 size={16} aria-hidden="true" /> Ouvir dica
      </button>
    )}
  </div>
);

const EndLevelModal: React.FC<{
  status: 'won' | 'lost';
  level: LevelConfig;
  blocksUsed: number;
  onRetry: () => void;
  onNext: () => void;
  explanation?: string | null;
  isAnalyzing?: boolean;
  isProChallenge?: boolean;
  isObservatoryFinal?: boolean;
  hint?: SparkyHintProps;
}> = ({ status, level, blocksUsed, onRetry, onNext, explanation, isAnalyzing, isProChallenge, isObservatoryFinal, hint }) => {
  const isWon = status === 'won';
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => { dialogRef.current?.focus({ preventScroll: true }); }, []);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-indigo-950/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={isWon ? 'Missão cumprida' : 'Vamos revisar o código'}
        tabIndex={-1}
        initial={{ scale: 0.8, y: 50, rotate: -2 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        className={`bg-white rounded-[3.5rem] p-8 md:p-12 text-center max-w-lg w-full shadow-2xl border-b-[16px] ${isWon ? 'border-green-500' : 'border-red-500'} relative ${hint ? 'max-h-[calc(100dvh-2rem)] overflow-y-auto' : 'overflow-hidden'}`}
      >
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${isWon ? 'bg-green-400' : 'bg-red-400'}`} />
        <div className={`absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${isWon ? 'bg-blue-400' : 'bg-orange-400'}`} />

        <div className="relative z-10">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg ${isWon ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600 animate-bounce'}`}>
            {isWon ? <CheckCircle size={60} strokeWidth={3} /> : <XCircle size={60} strokeWidth={3} />}
          </div>

          <h2 className="text-4xl md:text-5xl font-heading mb-2 text-slate-800 uppercase tracking-tighter text-center">
            {isWon ? 'Missão Cumprida!' : isProChallenge || hint ? 'Vamos revisar!' : 'Ops! Bati!'}
          </h2>
          
          <p className="text-slate-500 font-bold text-lg mb-8 text-center">
            {isProChallenge
              ? isWon && (isObservatoryFinal ? 'Você concluiu o Observatório do Sparky!' : `Nível ${level.id} concluído!`)
              : isWon ? (level.id === 'creative' || String(level.id).startsWith('custom') ? 'Você venceu sua própria fase!' : `Nível ${String(level.id)} Desbloqueado!`) : 'Vamos revisar seu código?'}
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
                  {isWon && isAnalyzing ? (
                    <div className="flex items-center gap-2 animate-pulse text-indigo-500">
                       <Sparkles size={16} /> Analisando sua lógica...
                    </div>
                  ) : explanation || (isWon
                    ? level.explanation || 'Você foi incrível! Seu robô seguiu cada comando perfeitamente.'
                    : 'Quase lá! Tente mudar a ordem dos blocos ou remover o que não precisa.')}
               </div>
            </div>
          </div>

          {hint && (
            <div className="-mt-4 mb-5" aria-live="polite">
              <SparkyHint {...hint} />
            </div>
          )}

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
  const isProChallenge = PRO_EXPANSION_LEVELS.some(entry => entry.id === level.id);
  const scenarios = [{ label: 'Cenário inicial', obstacles: level.obstacles }, ...(level.testScenarios ?? [])];
  const isHackerMode = level.id === 45 || level.id === 'creative' || String(level.id).startsWith('custom'); 
  const starterProgram = level.workshop?.starterProgram;
  const checkpoints = level.workshop?.checkpoints;
  const maxMoves = level.workshop?.maxMoves;

  const [program, setProgram] = useState<BlockType[]>(() => [...(starterProgram ?? [])]);
  const [movesTaken, setMovesTaken] = useState(0);
  const [robotState, setRobotState] = useState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' as 'left' | 'right' | 'up' | 'down' });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'running' | 'won' | 'lost'>('idle');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [paintedCells, setPaintedCells] = useState<GridPosition[]>([]);
  const [activeObstacles, setActiveObstacles] = useState<GridPosition[]>(level.obstacles);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [mutedByPlayer, setMutedByPlayer] = useState(false);
  const [showSkinSelector, setShowSkinSelector] = useState(false);
  const [logicExplanation, setLogicExplanation] = useState<string | null>(null);
  const [isAnalyzingLogic, setIsAnalyzingLogic] = useState(false);
  const soundOffInSettings = user?.settings?.soundEnabled === false;
  const isMuted = mutedByPlayer || soundOffInSettings;
  const hintText = failedAttempts >= 2 && typeof level.id === 'number'
    ? level.tutorialMessage || LEGACY_LEVEL_HINTS[level.id]
    : undefined;

  // Responsividade da Grade
  const [availableBoardSize, setAvailableBoardSize] = useState<number>();
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const gridPixels = level.gridSize * GRID_CELL_SIZE;
  const preferredBoardSize = isProChallenge ? gridPixels : Math.max(STANDARD_GRID_SIZE, gridPixels);
  const gridScale = Math.min(preferredBoardSize, availableBoardSize ?? preferredBoardSize) / gridPixels;

  useEffect(() => {
    const area = boardAreaRef.current;
    if (!area) return;

    const measureArea = (width: number, height: number) => {
      const availableSize = Math.min(width, height);
      if (availableSize > 0) setAvailableBoardSize(availableSize);
    };

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(([{ contentRect }]) => measureArea(contentRect.width, contentRect.height));
      observer.observe(area);
      return () => observer.disconnect();
    }

    const padding = isProChallenge ? 24 : 32;
    const onResize = () => measureArea(area.clientWidth - padding, area.clientHeight - padding);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isProChallenge]);

  const abortController = useRef<AbortController | null>(null);
  const programListRef = useRef<HTMLDivElement>(null);
  const speechTimer = useRef<number>();

  const stopSpeech = () => {
    window.clearTimeout(speechTimer.current);
    audioService.stop();
  };

  const queueSpeech = (text: string, mood: 'instruction' | 'happy' | 'neutral') => {
    if (isMuted) return;
    stopSpeech();
    speechTimer.current = window.setTimeout(() => audioService.speak(text, mood), 500);
  };

  const listenToHint = () => {
    if (!hintText || isMuted) return;
    stopSpeech();
    audioService.speak(`Dica do Sparky. ${hintText}`, 'instruction');
  };

  const hint = hintText ? { text: hintText, onListen: listenToHint, isMuted } : undefined;

  useEffect(() => {
    audioService.setMute(isMuted);
    if (isMuted) window.clearTimeout(speechTimer.current);
  }, [isMuted]);

  useEffect(() => {
    setProgram([...(starterProgram ?? [])]);
    setFailedAttempts(0);
    resetGame();
    setActiveObstacles(level.obstacles);
    setScenarioIndex(0);
    if (level.mission && !isMuted) {
      queueSpeech(`${String(level.id).startsWith('custom') ? 'Missão Criada' : 'Missão ' + String(level.id)}: ${level.mission}.`, 'instruction');
    }
    return () => {
      abortController.current?.abort();
      stopSpeech();
    };
  }, [levelId, customConfig, starterProgram]);

  const handleExplainLogic = async () => {
    if (program.length === 0) return;
    setIsAnalyzingLogic(true);
    try {
      const blocksLabels = program.map(b => BLOCK_DEFINITIONS[b].label).join(', ');
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Você é o Sparky, robô tutor. O aluno usou: [${blocksLabels}] para vencer o nível ${String(level.id)}. Explique por que essa lógica é boa para uma criança de 7 anos. Seja muito lúdico e encorajador. Use emojis. Curto (max 2 parágrafos).` }),
      });
      if (!response.ok) throw new Error('Falha ao gerar explicação');
      const { text } = await response.json();
      setLogicExplanation(text || "Uau! Sua lógica funcionou!");
    } catch (e) {
      setLogicExplanation("Sua lógica é única! Você usou os comandos certos na hora certa.");
    } finally { setIsAnalyzingLogic(false); }
  };

  useEffect(() => {
    if (gameStatus === 'won') {
      audioService.playSfx('success');
      queueSpeech('Conseguimos! Você é incrível!', 'happy');
      if (!isProChallenge) handleExplainLogic();
    } else if (gameStatus === 'lost') {
      audioService.playSfx('error');
      if (failedAttempts === 2 && hintText) {
        queueSpeech(`Vamos por partes! ${hintText}`, 'instruction');
      } else {
        queueSpeech(isProChallenge || hintText ? 'Vamos revisar o código e testar outra vez?' : 'Ops, bati! Vamos tentar de novo?', 'neutral');
      }
    }
  }, [gameStatus]);

  const reportFailure = () => {
    setFailedAttempts(attempts => attempts + 1);
    setGameStatus('lost');
  };

  const reportSuccess = () => {
    setFailedAttempts(0);
    setGameStatus('won');
    confetti({ particleCount: 150, spread: 70 });
  };

  const resetGame = () => {
    if (abortController.current) abortController.current.abort();
    setRobotState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' });
    setPaintedCells([]);
    setMovesTaken(0);
    setGameStatus('idle');
    setIsPlaying(false);
    setCurrentBlockIndex(null);
    setLogicExplanation(null);
    stopSpeech();
  };

  const clearWorkspace = () => {
    if (isPlaying) return;
    setProgram([]);
    resetGame();
    audioService.playSfx('delete');
  };

  const restoreStarterProgram = () => {
    if (!starterProgram || isPlaying) return;
    setProgram([...starterProgram]);
    resetGame();
    audioService.playSfx('click');
  };

  const moveBlock = (index: number, offset: -1 | 1) => {
    const destination = index + offset;
    if (isPlaying || destination < 0 || destination >= program.length) return;
    const reordered = [...program];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    setProgram(reordered);
    audioService.playSfx('click');
  };

  const addBlock = (type: BlockType) => {
    if (isProChallenge && (isPlaying || !level.availableBlocks.includes(type))) return;
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

  const selectScenario = (index: number) => {
    resetGame();
    setScenarioIndex(index);
    setActiveObstacles(scenarios[index].obstacles);
  };

  const runProProgram = async () => {
    if (isPlaying) {
      resetGame();
      return;
    }
    if (program.length === 0) return;

    resetGame();
    const controller = new AbortController();
    abortController.current = controller;
    setGameStatus('running');
    setIsPlaying(true);
    audioService.playSfx('start');

    const wait = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms));

    try {
      for (const [index, scenario] of scenarios.entries()) {
        if (controller.signal.aborted) return;
        setScenarioIndex(index);
        setActiveObstacles(scenario.obstacles);
        setRobotState({ ...level.startPos, dir: 'right' });
        setPaintedCells([]);
        setMovesTaken(0);
        setCurrentBlockIndex(null);
        if (scenarios.length > 1) await wait(380);

        const { steps, failure } = simulateProProgram(level, program, scenario.obstacles);
        for (const step of steps) {
          if (controller.signal.aborted) return;
          setCurrentBlockIndex(step.index);
          if (step.kind === 'move') {
            setRobotState({ ...step.position, dir: step.direction });
            if (maxMoves !== undefined) setMovesTaken(count => count + 1);
            audioService.playSfx('click');
          } else if (step.kind === 'paint') {
            setPaintedCells(cells => [...cells, step.position]);
            audioService.playTone(880, 0.1, 'sine');
          }
          await wait(step.kind === 'check' ? 100 : 210);
        }

        if (controller.signal.aborted) return;
        if (failure) {
          const lastStep = steps.at(-1);
          const explanation = starterProgram && lastStep?.kind === 'blocked'
            ? `Bloco ${lastStep.index + 1}. ${failure}`
            : failure;
          setLogicExplanation(scenarios.length > 1 ? `${scenario.label}. ${explanation}` : explanation);
          reportFailure();
          return;
        }
      }

      reportSuccess();
    } finally {
      if (abortController.current === controller && !controller.signal.aborted) {
        setIsPlaying(false);
        setCurrentBlockIndex(null);
      }
    }
  };

  const runProgram = async () => {
    if (isPlaying) {
      resetGame();
      return;
    }
    if (program.length === 0) return;
    
    resetGame();
    setRobotState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' });
    setGameStatus('running');
    setIsPlaying(true);
    audioService.playSfx('start');

    const controller = new AbortController();
    abortController.current = controller;
    const { signal } = controller;

    const STEP_DURATION = isHackerMode ? 350 : 800; 
    const PAINT_DURATION = isHackerMode ? 300 : 700;

    const wait = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms));

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
                if (!signal.aborted) reportFailure();
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
        
        if (!signal.aborted && !hasFailed) {
            await wait(500);
            if (signal.aborted) return;

            const isAtGoal = !level.goalPos || (currentX === level.goalPos.x && currentY === level.goalPos.y);
            if (isAtGoal) {
                reportSuccess();
            } else {
                reportFailure();
            }
        }
    } catch (e) { 
        console.error(e);
    } finally {
        if (abortController.current === controller && !signal.aborted) {
            setIsPlaying(false);
            setCurrentBlockIndex(null);
        }
    }
  };

  const availableBlocks = level.availableBlocks || [];
  const blocksByCategory = Array.from(new Set(availableBlocks.map(b => BLOCK_DEFINITIONS[b].category))) as BlockCategory[];
  const workspaceClass = isHackerMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200';

  return (
    <div className={`flex flex-col md:flex-row ${isProChallenge ? 'min-h-screen md:h-screen md:overflow-hidden' : 'h-screen overflow-hidden'} ${isHackerMode ? 'bg-slate-950 text-emerald-400' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Coluna 1: Paleta de Blocos */}
      <div className="w-full md:w-64 border-r flex flex-col z-10 shadow-lg shrink-0 bg-white h-[25vh] md:h-full overflow-hidden">
         <div className="p-4 border-b flex items-center justify-between bg-white shrink-0">
            <button onClick={onBack} className="flex items-center gap-1 font-bold text-indigo-600 hover:scale-105 transition-transform"><ArrowLeft size={18}/> {String(level.id).startsWith('custom') ? 'Oficina' : 'Mapa'}</button>
            <button
              type="button"
              onClick={() => setMutedByPlayer(muted => !muted)}
              disabled={soundOffInSettings}
              aria-label={soundOffInSettings ? 'Som desativado no Painel dos Pais' : isMuted ? 'Ativar som' : 'Silenciar som'}
              className="hover:scale-110 transition-transform disabled:opacity-60"
            >
              {isMuted ? <VolumeX className="text-red-500" /> : <Volume2 className="text-blue-500" />}
            </button>
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
      <div className={`flex min-w-0 flex-col relative shrink-0 bg-slate-200 border-x border-slate-300 md:h-full overflow-hidden ${isProChallenge ? 'md:flex-1' : 'flex-1 h-[40vh]'}`}>
          <div className="p-3 bg-white/90 border-b flex items-center justify-between backdrop-blur-sm z-20">
             {isProChallenge ? (
               <div className="flex items-start gap-2 pr-3">
                 <Target size={18} className="mt-1 shrink-0 text-indigo-500" aria-hidden="true" />
                 <div>
                   <h2 className="font-heading text-base text-slate-800">{level.id}. {level.title}</h2>
                   <p className="text-xs font-bold text-slate-600">{level.mission}</p>
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-2 text-xs font-bold text-slate-600 truncate max-w-[200px] md:max-w-none"><Target size={16} className="text-indigo-500"/> {String(level.mission)}</div>
             )}
             <StatusIndicator isGuest={user?.isGuest} />
          </div>

          {isProChallenge && (
            <div key={level.id} className="space-y-2 border-b bg-indigo-50 px-4 py-2 text-xs text-slate-700">
              {level.tutorialMessage && (
                <details>
                  <summary className="cursor-pointer font-bold text-indigo-700">Ver dica</summary>
                  <p className="mt-1 leading-relaxed">{level.tutorialMessage}</p>
                </details>
              )}
              {level.paintTargets?.length > 0 && <p>Use Pintar Chão nas casas com contorno roxo.</p>}
              {checkpoints?.length > 0 && <p>Passe pelos pontos azuis na ordem dos números.</p>}
              {maxMoves !== undefined && (
                <p className={movesTaken > maxMoves ? 'font-bold text-red-700' : 'font-bold text-indigo-800'}>
                  Passos {movesTaken} de {maxMoves}. Movimentos repetidos também contam.
                </p>
              )}
              {scenarios.length > 1 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <label className="font-bold">
                    Cenário
                    <select value={scenarioIndex} onChange={event => selectScenario(Number(event.target.value))} disabled={isPlaying} className="ml-2 rounded-md border border-indigo-200 bg-white p-1 text-slate-700">
                      {scenarios.map((scenario, index) => <option key={index} value={index}>{scenario.label}</option>)}
                    </select>
                  </label>
                  <span role="status">{isPlaying ? `Testando ${scenarioIndex + 1} de ${scenarios.length}` : 'O mesmo código será testado em todos os cenários.'}</span>
                </div>
              )}
            </div>
          )}

          <div ref={boardAreaRef} className={`flex-1 relative overflow-hidden flex items-center justify-center ${isProChallenge ? 'min-h-[240px] p-3 md:min-h-0' : 'min-h-0 p-4'}`}>
              <motion.div 
                style={{ 
                    width: gridPixels,
                    height: gridPixels,
                    scale: gridScale,
                    backgroundSize: '60px 60px', 
                    backgroundImage: 'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)' 
                }}
                className={`relative shrink-0 shadow-2xl rounded-2xl overflow-hidden bg-white border-4 border-white transform origin-center ${gameStatus === 'lost' ? 'animate-shake ring-4 ring-red-400' : ''}`}
              >
                  {level.goalPos && <div className="absolute flex items-center justify-center animate-pulse" style={{ left: level.goalPos.x * 60, top: level.goalPos.y * 60, width: 60, height: 60 }}><div className="w-8 h-8 rounded-full border-4 border-green-400 bg-green-100" /></div>}
                  {activeObstacles.map((obs, i) => <div key={i} className="absolute rounded-xl bg-slate-700 border-b-4 border-slate-900" style={{ left: obs.x * 60 + 5, top: obs.y * 60 + 5, width: 50, height: 50 }} />)}
                  {paintedCells.map((cell, i) => <div key={i} className="absolute bg-purple-400/50" style={{ left: cell.x * 60, top: cell.y * 60, width: 60, height: 60 }} />)}
                  {isProChallenge && level.paintTargets?.map(cell => (
                    <div key={`${cell.x},${cell.y}`} className="absolute rounded-xl border-4 border-dashed border-purple-600" style={{ left: cell.x * 60 + 5, top: cell.y * 60 + 5, width: 50, height: 50 }} />
                  ))}
                  {checkpoints?.map((cell, index) => (
                    <div
                      key={index}
                      className="pointer-events-none absolute z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-sky-800 bg-sky-200 text-sm font-black text-sky-950 shadow-sm"
                      style={{ left: cell.x * GRID_CELL_SIZE + 6, top: cell.y * GRID_CELL_SIZE + 6 }}
                    >
                      <span className="sr-only">Ponto </span>{index + 1}
                    </div>
                  ))}
                  
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
                className={`absolute bottom-3 left-3 bg-white p-2 rounded-full shadow-2xl border-4 border-indigo-100 text-indigo-600 hover:scale-110 active:scale-95 transition-all z-30 group ${isProChallenge ? '' : 'md:bottom-6 md:left-6 md:p-4'}`}
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
                explanation={gameStatus === 'won' || isProChallenge ? logicExplanation : null}
                isAnalyzing={isAnalyzingLogic}
                isProChallenge={isProChallenge}
                isObservatoryFinal={level.id === SPARKY_OBSERVATORY_LEVELS.at(-1)?.id}
                hint={gameStatus === 'lost' ? hint : undefined}
              />
            )}
          </AnimatePresence>
      </div>

      {/* Coluna 3: Workspace de Código */}
      <div className={`w-full md:w-80 flex flex-col relative ${workspaceClass} border-l shadow-2xl z-10 md:h-full overflow-hidden ${isProChallenge ? 'h-96' : 'h-[35vh]'}`}>
          <div className="p-4 border-b flex justify-between items-center bg-white/50 backdrop-blur-sm shrink-0">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                 <Terminal size={14} /> Lógica de Comandos
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${program.length >= level.maxBlocks ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                 {String(program.length)}/{String(level.maxBlocks)}
              </span>
          </div>
          {starterProgram && (
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-950">
              <span className="font-bold">Rascunho da missão</span>
              <button
                type="button"
                onClick={restoreStarterProgram}
                disabled={isPlaying}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-bold text-indigo-700 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700 disabled:opacity-50"
              >
                <RotateCcw size={13} aria-hidden="true" /> Restaurar rascunho
              </button>
            </div>
          )}
          
          <div 
            ref={programListRef} 
            className="flex-1 p-4 overflow-y-auto flex flex-col gap-1.5 no-scrollbar bg-white/20" 
            onDragOver={e => e.preventDefault()} 
            onDrop={handleDrop}
          >
              {hint && gameStatus === 'idle' && (
                <details className="mb-2 shrink-0 rounded-xl border border-amber-300 bg-amber-50 p-2 text-amber-900">
                  <summary className="cursor-pointer px-1 py-1 text-sm font-bold">Rever dica do Sparky</summary>
                  <SparkyHint {...hint} />
                </details>
              )}
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
                        {starterProgram && !isPlaying && (
                          <div className="ml-1 flex shrink-0">
                            <button
                              type="button"
                              onClick={() => moveBlock(idx, -1)}
                              disabled={idx === 0}
                              aria-label={`Subir bloco ${idx + 1}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700 disabled:opacity-25"
                            >
                              <ArrowUp size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlock(idx, 1)}
                              disabled={idx === program.length - 1}
                              aria-label={`Descer bloco ${idx + 1}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700 disabled:opacity-25"
                            >
                              <ArrowDown size={16} aria-hidden="true" />
                            </button>
                          </div>
                        )}
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
                    onClick={isProChallenge ? runProProgram : runProgram}
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
