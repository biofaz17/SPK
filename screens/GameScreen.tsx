import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, RotateCcw, Trash2, HelpCircle, Pause, CheckCircle, XCircle, ArrowRight, Repeat, Code, Terminal, Move, Clock, Battery, BatteryWarning, Target, Brush } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LevelConfig, BlockType, BlockCategory, GridPosition, BLOCK_DEFINITIONS } from '../types';
import { LEVELS, CREATIVE_LEVEL } from '../constants';
import { Button } from '../components/Button';
import { Robot } from '../components/Robot';
import { BlockIcon } from '../components/BlockIcon';
import confetti from 'canvas-confetti';

interface GameScreenProps {
  levelId: number | string;
  onBack: () => void;
  onNextLevel: (blocksUsed: number) => void;
}

// ... (Manter os componentes de tutorial MotionTutorialDemo, ActionTutorialDemo, TutorialDemo inalterados, pois são apenas visuais)
// --- Componente de Animação do Tutorial de Movimento ---
const MotionTutorialDemo: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3); // 0: Highlight Block, 1: Move Robot, 2: Reset
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-100 rounded-xl p-6 mb-6 flex flex-col md:flex-row items-center justify-center gap-8 border-2 border-slate-200 shadow-inner">
       <div className="flex flex-col gap-2 items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Comando</span>
          <div className={`transform transition-all duration-300 ${step === 0 ? 'scale-110 ring-4 ring-blue-300 rounded-lg' : 'scale-100'}`}>
             <BlockIcon type={BlockType.MOVE_RIGHT} />
          </div>
       </div>

       <div className="text-slate-300 hidden md:block">
          <ArrowRight size={32} />
       </div>

       <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Resultado</span>
          <div className="bg-white p-2 rounded-lg border border-slate-200 grid grid-cols-2 gap-1 w-32 h-16 items-center relative overflow-hidden shadow-sm">
              <div className="border-2 border-dashed border-slate-200 rounded h-full bg-slate-50/50"></div>
              <div className="border-2 border-dashed border-slate-200 rounded h-full bg-slate-50/50"></div>
              
              <motion.div 
                className="absolute top-2 left-2 w-12 h-12 z-10"
                animate={{
                  x: step >= 1 ? 60 : 0, 
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="w-full h-full bg-blue-600 rounded-lg shadow-md border-2 border-blue-800 flex items-center justify-center relative">
                    <div className="w-8 h-4 bg-white rounded-md border border-blue-200"></div>
                    <div className="absolute -top-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                </div>
              </motion.div>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-2 h-4">
            {step === 0 && "Ler Bloco..."}
            {step === 1 && "Mover!"}
            {step === 2 && "Pronto."}
          </p>
       </div>
    </div>
  );
};

// --- Componente de Animação do Tutorial de Ação (Pintura) ---
const ActionTutorialDemo: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4); // 0: Wait, 1: Paint, 2: Move Away, 3: Reset
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-100 rounded-xl p-6 mb-6 flex flex-col md:flex-row items-center justify-center gap-8 border-2 border-slate-200 shadow-inner">
       <div className="flex flex-col gap-2 items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">O Código</span>
          <div className={`transform transition-all duration-300 ${step === 1 ? 'scale-110 ring-4 ring-purple-300 rounded-lg' : 'scale-100'}`}>
             <BlockIcon type={BlockType.PAINT} />
          </div>
       </div>

       <div className="text-slate-300 animate-pulse hidden md:block">
          <ArrowRight size={32} />
       </div>

       <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">A Mágica</span>
          <div className="bg-white p-2 rounded-lg border border-slate-200 grid grid-cols-2 gap-1 w-32 h-16 items-center relative overflow-hidden shadow-sm">
              {/* Célula Pintada */}
              <div className={`border-2 border-dashed border-slate-200 rounded h-full transition-colors duration-500 ${step >= 1 ? 'bg-purple-400/50 border-purple-300' : 'bg-slate-50/50'}`}></div>
              <div className="border-2 border-dashed border-slate-200 rounded h-full bg-slate-50/50"></div>
              
              <motion.div 
                className="absolute top-2 left-2 w-12 h-12 z-10"
                animate={{
                  x: step >= 2 ? 60 : 0, 
                  scale: step === 1 ? 1.1 : 1 // Pulo ao pintar
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="w-full h-full bg-blue-600 rounded-lg shadow-md border-2 border-blue-800 flex items-center justify-center relative">
                    <div className="w-8 h-4 bg-white rounded-md border border-blue-200"></div>
                    {/* Efeito de Pincel */}
                    <AnimatePresence>
                      {step === 1 && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1.5 }}
                          exit={{ opacity: 0 }}
                          className="absolute -bottom-2 text-purple-600"
                        >
                          <Brush size={16} fill="currentColor" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>
              </motion.div>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-2 h-4">
            {step === 0 && "Preparar..."}
            {step === 1 && "PINTAR!"}
            {step === 2 && "Andar..."}
            {step === 3 && "Olha a cor!"}
          </p>
       </div>
    </div>
  );
};

// --- Componente de Animação do Tutorial de Controle ---
const TutorialDemo: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4); // 0: Start, 1: Move 1, 2: Move 2, 3: Pause
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-100 rounded-xl p-6 mb-6 flex flex-col md:flex-row items-center justify-center gap-8 border-2 border-slate-200 shadow-inner">
       <div className="flex flex-col gap-2 items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">O Código</span>
          <div className={`transform transition-all duration-300 flex flex-col items-center ${step === 0 ? 'scale-100 opacity-50' : 'scale-110 opacity-100'}`}>
             <BlockIcon type={BlockType.REPEAT_3} />
             <div className="h-4 w-1 bg-orange-300"></div>
             <div className="transform scale-90 opacity-90">
                <BlockIcon type={BlockType.MOVE_RIGHT} />
             </div>
          </div>
       </div>

       <div className="text-slate-300 animate-pulse hidden md:block">
          <ArrowRight size={32} />
       </div>

       <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">A Ação</span>
          <div className="bg-white p-2 rounded-lg border border-slate-200 grid grid-cols-3 gap-1 w-48 h-16 items-center relative overflow-hidden shadow-sm">
              <div className="border-2 border-dashed border-slate-200 rounded h-full bg-slate-50/50"></div>
              <div className="border-2 border-dashed border-slate-200 rounded h-full bg-slate-50/50"></div>
              <div className="border-2 border-dashed border-slate-200 rounded h-full bg-slate-50/50"></div>
              
              <motion.div 
                className="absolute top-2 left-2 w-12 h-12 z-10"
                animate={{
                  x: step === 0 ? 0 : step * 52, 
                  opacity: step === 3 ? 0 : 1,
                  scale: step === 3 ? 0.8 : 1
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="w-full h-full bg-blue-500 rounded-lg shadow-md border-2 border-blue-700 flex items-center justify-center relative">
                    <div className="w-8 h-4 bg-blue-900 rounded-md"></div>
                    <div className="absolute -top-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                </div>
              </motion.div>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-2">
            {step === 0 && "Prepara..."}
            {step === 1 && "1. Andou"}
            {step === 2 && "2. Andou"}
            {step === 3 && "3. Andou!"}
          </p>
       </div>
    </div>
  );
};

export const GameScreen: React.FC<GameScreenProps> = ({ levelId, onBack, onNextLevel }) => {
  // --- LEVEL SETUP ---
  const level = levelId === 'creative' 
    ? CREATIVE_LEVEL 
    : (LEVELS.find(l => l.id === levelId) || LEVELS[0]);

  const isHackerMode = level.id === 45 || level.id === 'creative'; // 45 is the new Master level

  const [program, setProgram] = useState<BlockType[]>([]);
  const [robotState, setRobotState] = useState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' as 'left' | 'right' | 'up' | 'down' });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'running' | 'won' | 'lost'>('idle');
  const [paintedCells, setPaintedCells] = useState<GridPosition[]>([]);
  const [tutorialOpen, setTutorialOpen] = useState(true);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>(level.timeLimit || null);

  // Tutorials State
  const [showControlGuide, setShowControlGuide] = useState(false);
  const [hasSeenControlGuide, setHasSeenControlGuide] = useState(false);
  const [showMotionGuide, setShowMotionGuide] = useState(false);
  const [hasSeenMotionGuide, setHasSeenMotionGuide] = useState(false);
  const [showActionGuide, setShowActionGuide] = useState(false);
  const [hasSeenActionGuide, setHasSeenActionGuide] = useState(false);

  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    resetGame();
  }, [levelId]);

  // Timer Logic
  useEffect(() => {
    if (!level.timeLimit) return;
    if (gameStatus === 'won' || gameStatus === 'lost') return;

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
  }, [timeLeft, gameStatus, level.timeLimit]);

  const resetGame = () => {
    if (abortController.current) abortController.current.abort();
    setRobotState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' });
    setPaintedCells([]);
    setGameStatus('idle');
    setIsPlaying(false);
    setCurrentBlockIndex(null);
    setTimeLeft(level.timeLimit || null);
  };

  const addBlock = (type: BlockType) => {
    if (program.length < level.maxBlocks) {
      setProgram([...program, type]);
    }
  };

  const removeBlock = (index: number) => {
    if (isPlaying) return;
    const newProgram = [...program];
    newProgram.splice(index, 1);
    setProgram(newProgram);
  };

  const handleDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('blockType', type);
  };

  const handleDrop = (e: React.DragEvent) => {
    const type = e.dataTransfer.getData('blockType') as BlockType;
    if (type) addBlock(type);
  };

  // --- INTERPRETER ENGINE ---
  const runProgram = async (skipGuideCheck = false) => {
    if (program.length === 0) return;
    
    // Tutorial Checks (Skip if hacker mode to flow better)
    const hasMotionBlock = program.some(b => BLOCK_DEFINITIONS[b].category === BlockCategory.MOTION);
    if (hasMotionBlock && !hasSeenMotionGuide && !skipGuideCheck && !isHackerMode) {
        setShowMotionGuide(true);
        return;
    }
    const hasActionBlock = program.some(b => BLOCK_DEFINITIONS[b].category === BlockCategory.ACTION);
    if (hasActionBlock && !hasSeenActionGuide && !skipGuideCheck && !isHackerMode) {
        setShowActionGuide(true);
        return;
    }
    const hasControlBlock = program.some(b => BLOCK_DEFINITIONS[b].category === BlockCategory.CONTROL);
    if (hasControlBlock && !hasSeenControlGuide && !skipGuideCheck && !isHackerMode) {
        setShowControlGuide(true);
        return;
    }

    resetGame();
    setIsPlaying(true);
    setGameStatus('running');
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    // Configurações de Tempo
    const DELAY_MOVE = isHackerMode ? 120 : 300; // Faster in hacker mode
    const DELAY_PAINT = isHackerMode ? 80 : 250;

    const wait = (ms: number) => new Promise(resolve => {
        if (signal.aborted) return;
        setTimeout(resolve, ms);
    });

    // Variáveis de Estado Local
    let currentX = level.startPos.x;
    let currentY = level.startPos.y;
    let currentDir = 'right' as 'left' | 'right' | 'up' | 'down'; 
    let localPainted = [] as GridPosition[];

    // --- HELPER FUNCTIONS ---
    
    // Calcula quantos blocos uma instrução ocupa na lista (para pular corretamente)
    const getBlockSize = (idx: number): number => {
      if (idx >= program.length) return 0;
      const type = program[idx];

      if (type === BlockType.REPEAT_2 || type === BlockType.REPEAT_3) {
        return 1 + getBlockSize(idx + 1);
      }

      if (type === BlockType.IF_OBSTACLE || type === BlockType.IF_PATH) {
        let size = 1 + getBlockSize(idx + 1); // IF + Bloco True
        
        // Verifica cadeias de ELSE / ELSE IF
        let checkIdx = idx + size;
        while (checkIdx < program.length) {
            const nextType = program[checkIdx];
            if (nextType === BlockType.ELSE || nextType === BlockType.ELSE_IF) {
                const branchSize = 1 + getBlockSize(checkIdx + 1);
                size += branchSize;
                checkIdx += branchSize;
            } else {
                break;
            }
        }
        return size;
      }
      
      // Blocos de controle isolados (não deveriam acontecer sozinhos, mas por segurança)
      if (type === BlockType.ELSE || type === BlockType.ELSE_IF) {
         return 1 + getBlockSize(idx + 1);
      }

      // Blocos atômicos (Movimento, Ação)
      return 1;
    }

    const getFrontPosition = (x: number, y: number, dir: string) => {
        if (dir === 'right') return { x: x + 1, y };
        if (dir === 'left') return { x: x - 1, y };
        if (dir === 'up') return { x, y: y - 1 }; 
        if (dir === 'down') return { x, y: y + 1 };
        return { x: x + 1, y }; 
    };

    const processAtomicCommand = async (action: BlockType) => {
        if (signal.aborted) return;

        let deltaX = 0;
        let deltaY = 0;
        let nextDir = currentDir;
        let isMoveAction = false;
        let isPaintAction = false;

        switch (action) {
            case BlockType.MOVE_UP: 
                deltaY = -1; nextDir = 'up'; isMoveAction = true; break;
            case BlockType.MOVE_DOWN: 
                deltaY = 1; nextDir = 'down'; isMoveAction = true; break;
            case BlockType.MOVE_LEFT: 
                deltaX = -1; nextDir = 'left'; isMoveAction = true; break;
            case BlockType.MOVE_RIGHT: 
                deltaX = 1; nextDir = 'right'; isMoveAction = true; break;
            case BlockType.PAINT: 
                isPaintAction = true; break;
        }

        if (isPaintAction) {
            localPainted = [...localPainted, {x: currentX, y: currentY}];
            setPaintedCells(localPainted);
            await wait(DELAY_PAINT);
        }

        if (isMoveAction) {
            const nextX = currentX + deltaX;
            const nextY = currentY + deltaY;

            const isObstacle = level.obstacles.some(o => o.x === nextX && o.y === nextY);
            const isOutOfBounds = nextX < 0 || nextX >= level.gridSize || nextY < 0 || nextY >= level.gridSize;
            
            if (isObstacle || isOutOfBounds) {
                setRobotState({ x: currentX, y: currentY, dir: nextDir });
                setGameStatus('lost');
                throw new Error('Collision');
            } else {
                currentX = nextX;
                currentY = nextY;
                currentDir = nextDir;
                setRobotState({ x: currentX, y: currentY, dir: nextDir });
                await wait(DELAY_MOVE);
            }
        }
    };

    // --- EXECUTION ENGINE (RECURSIVE) ---
    const executeBlock = async (idx: number): Promise<void> => {
        if (idx >= program.length || signal.aborted) return;
        if (timeLeft !== null && timeLeft <= 0) throw new Error('Timeout');

        setCurrentBlockIndex(idx);
        const type = program[idx];

        // --- REPETIÇÃO ---
        if (type === BlockType.REPEAT_2 || type === BlockType.REPEAT_3) {
            const count = type === BlockType.REPEAT_2 ? 2 : 3;
            const bodyIdx = idx + 1;
            
            // Verifica se existe bloco dentro
            if (bodyIdx < program.length) {
                for (let i = 0; i < count; i++) {
                     if (signal.aborted) return;
                     // IMPORTANTE: Recurso para permitir IF dentro de REPEAT
                     await executeBlock(bodyIdx); 
                }
            }
            return; // O loop principal controlará o salto baseado em getBlockSize
        }

        // --- CONDICIONAIS ---
        else if (type === BlockType.IF_OBSTACLE || type === BlockType.IF_PATH) {
            const front = getFrontPosition(currentX, currentY, currentDir);
            const isObstacle = level.obstacles.some(o => o.x === front.x && o.y === front.y) || 
                                front.x < 0 || front.x >= level.gridSize || front.y < 0 || front.y >= level.gridSize;
            
            const conditionMet = type === BlockType.IF_OBSTACLE ? isObstacle : !isObstacle;
            
            if (conditionMet) {
                // Executa bloco True
                await executeBlock(idx + 1);
            } else {
                // Procura cadeia de Else
                let offset = 1 + getBlockSize(idx + 1);
                let currentCheckIdx = idx + offset;
                let executed = false;

                while (currentCheckIdx < program.length) {
                    const nextType = program[currentCheckIdx];
                    if (nextType === BlockType.ELSE) {
                        await executeBlock(currentCheckIdx + 1);
                        executed = true;
                        break;
                    } else if (nextType === BlockType.ELSE_IF) {
                        // Verifica nova condição (igual a IF_OBSTACLE)
                        const frontNow = getFrontPosition(currentX, currentY, currentDir);
                        const isObsNow = level.obstacles.some(o => o.x === frontNow.x && o.y === frontNow.y) || 
                                         frontNow.x < 0 || frontNow.x >= level.gridSize || frontNow.y < 0 || frontNow.y >= level.gridSize;
                        
                        if (isObsNow) {
                            await executeBlock(currentCheckIdx + 1);
                            executed = true;
                            break;
                        }
                    } else {
                        break; // Fim da cadeia
                    }
                    // Pula para o próximo bloco da cadeia Else
                    const branchSize = 1 + getBlockSize(currentCheckIdx + 1);
                    currentCheckIdx += branchSize;
                }
            }
            return;
        }

        // --- AÇÃO SIMPLES ---
        else if (type !== BlockType.ELSE && type !== BlockType.ELSE_IF) {
            await processAtomicCommand(type);
        }
    };

    try {
        let pc = 0;
        while (pc < program.length) {
            if (signal.aborted) return;
            
            await executeBlock(pc);
            
            // Avança o contador baseado no tamanho total da estrutura executada
            pc += getBlockSize(pc);
        }

        // Verificação de Vitória
        if (level.goalPos) {
            if (currentX === level.goalPos.x && currentY === level.goalPos.y) {
                setGameStatus('won');
                confetti({ 
                    particleCount: 150, 
                    spread: 70, 
                    origin: { y: 0.6 },
                    colors: isHackerMode ? ['#22c55e', '#000000'] : undefined 
                });
            } else {
                setGameStatus('lost');
            }
        } else {
            setGameStatus('won');
        }

    } catch (e) {
        if (e instanceof Error) {
            if (e.message !== 'Collision' && e.message !== 'Timeout') {
                console.log("Runtime Error", e);
            }
        }
        setIsPlaying(false);
    }
    
    if (!signal.aborted && gameStatus !== 'lost') {
        setIsPlaying(false);
        setCurrentBlockIndex(null);
    }
  };

  const handleConfirmControlGuide = () => {
    setShowControlGuide(false);
    setHasSeenControlGuide(true);
    runProgram(true);
  };

  const handleConfirmMotionGuide = () => {
    setShowMotionGuide(false);
    setHasSeenMotionGuide(true);
    runProgram(true);
  };

  const handleConfirmActionGuide = () => {
    setShowActionGuide(false);
    setHasSeenActionGuide(true);
    runProgram(true);
  };

  const availableBlocks = level.availableBlocks || [];
  const blocksByCategory = Array.from(new Set(availableBlocks.map(b => BLOCK_DEFINITIONS[b].category)));

  // THEME STYLES
  const bgClass = isHackerMode ? 'bg-slate-900' : 'bg-slate-50';
  const textClass = isHackerMode ? 'text-green-400 font-mono' : 'text-slate-800 font-sans';
  const toolboxClass = isHackerMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const workspaceClass = isHackerMode ? 'bg-slate-900' : 'bg-slate-100';

  // Format Time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft !== null && timeLeft <= 15;
  
  return (
    <div className={`h-screen flex flex-col md:flex-row overflow-hidden ${bgClass} ${textClass}`}>
      
      {/* HEADER (Mobile) */}
      <div className={`md:hidden p-4 flex justify-between items-center z-20 shadow-md ${isHackerMode ? 'bg-green-900 text-green-100' : 'bg-indigo-600 text-white'}`}>
         <button onClick={onBack}><ArrowLeft /></button>
         <span className="font-heading">{level.title}</span>
         <button onClick={() => setTutorialOpen(true)}><HelpCircle /></button>
      </div>

      {/* LEFT: TOOLBOX */}
      <div className={`w-full md:w-64 border-r flex flex-col z-10 shadow-lg ${toolboxClass}`}>
         <div className={`hidden md:flex p-4 border-b items-center gap-3 ${isHackerMode ? 'bg-slate-900 border-slate-700' : 'bg-indigo-50 border-slate-100'}`}>
            <button onClick={onBack} className={`p-2 rounded-full transition ${isHackerMode ? 'hover:bg-slate-800 text-green-500' : 'hover:bg-white text-indigo-900'}`}>
                <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
                <h2 className={`font-bold text-sm truncate ${isHackerMode ? 'text-green-400' : 'text-slate-800'}`}>{level.title}</h2>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isHackerMode ? 'text-green-700' : 'text-slate-400'}`}>Nível {level.id}</div>
            </div>
         </div>
         
         {/* TIMER WIDGET (IF EXISTS) */}
         {timeLeft !== null && (
            <div className={`p-4 border-b ${isLowTime ? 'bg-red-50' : ''} ${isHackerMode ? 'border-green-800' : 'border-slate-100'}`}>
               <div className={`
                 flex items-center justify-between px-4 py-2 rounded-xl font-bold border-2 transition-all
                 ${isLowTime 
                    ? 'bg-red-100 text-red-600 border-red-300 animate-pulse' 
                    : (isHackerMode ? 'bg-green-900/30 text-green-400 border-green-700' : 'bg-slate-100 text-slate-600 border-slate-200')}
               `}>
                  <div className="flex items-center gap-2">
                     {isLowTime ? <BatteryWarning size={18} /> : <Clock size={18} />}
                     <span className="text-xs uppercase tracking-wide">Bateria</span>
                  </div>
                  <div className="font-mono text-xl">{formatTime(timeLeft)}</div>
               </div>
               {isLowTime && <div className="text-center text-[10px] text-red-500 font-bold mt-1 uppercase">Energia Crítica!</div>}
            </div>
         )}
         
         <div className="flex-1 overflow-y-auto p-4">
             <div className="flex flex-col gap-6">
                {blocksByCategory.map(cat => (
                   <div key={cat}>
                       <h3 className={`text-xs font-bold uppercase mb-2 pl-1 ${isHackerMode ? 'text-green-700' : 'text-slate-400'}`}>{cat}</h3>
                       <div className="grid grid-cols-1 gap-2">
                           {availableBlocks.filter(b => BLOCK_DEFINITIONS[b].category === cat).map(type => (
                               <div 
                                  key={type}
                                  draggable={!isPlaying}
                                  onDragStart={(e) => handleDragStart(e, type)}
                                  className="cursor-grab active:cursor-grabbing touch-none"
                               >
                                  <button 
                                      onClick={() => addBlock(type)}
                                      disabled={isPlaying}
                                      className="w-full transition-all duration-200 hover:scale-105"
                                  >
                                      <BlockIcon 
                                        type={type} 
                                        className={`${isHackerMode ? 'font-mono' : ''} active:!scale-110 active:!shadow-2xl active:!-translate-y-2 active:!border-b-4 active:z-10`} 
                                      />
                                  </button>
                               </div>
                           ))}
                       </div>
                   </div>
                ))}
             </div>
         </div>
      </div>

      {/* MIDDLE: WORKSPACE */}
      <div className={`flex-1 flex flex-col relative ${workspaceClass}`}>
          
          {/* MISSION BANNER - FIXED ON TOP */}
          <div className={`
            p-3 border-b shadow-sm z-30 flex items-start gap-3
            ${isHackerMode ? 'bg-slate-800 border-slate-700 text-green-400' : 'bg-yellow-50 border-yellow-100 text-yellow-900'}
          `}>
             <div className={`mt-0.5 ${isHackerMode ? 'text-green-500' : 'text-yellow-600'}`}>
                <Target size={18} />
             </div>
             <div>
                <div className={`text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5 ${isHackerMode ? 'text-green-600' : 'text-yellow-700'}`}>Missão</div>
                <div className="text-sm font-bold leading-tight">
                    {level.mission || level.tutorialMessage || "Chegue ao objetivo!"}
                </div>
             </div>
          </div>

          {/* Program List */}
          <div 
            className="flex-1 p-4 overflow-y-auto content-start flex flex-wrap content-start gap-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
              {program.length === 0 && (
                  <div className={`w-full h-full flex items-center justify-center flex-col border-4 border-dashed rounded-xl ${isHackerMode ? 'border-green-900 text-green-700' : 'border-slate-200 text-slate-400'}`}>
                      {isHackerMode ? <Terminal size={48} className="mb-2 opacity-50" /> : <Code size={48} className="mb-2 opacity-50" />}
                      <p className="font-bold">{isHackerMode ? '> INSERIR_MODULOS' : 'Arraste os blocos aqui'}</p>
                  </div>
              )}
              
              {program.map((block, idx) => (
                  <div 
                    key={idx} 
                    className={`relative group transition-all duration-300 ${currentBlockIndex === idx ? 'scale-110 z-10 ring-4 ring-yellow-400 rounded-lg shadow-xl' : ''}`}
                  >
                      <BlockIcon type={block} showLabel={false} className="w-12 h-12 justify-center" />
                      {!isPlaying && (
                          <button 
                            onClick={() => removeBlock(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm scale-75 hover:scale-100"
                          >
                             <Trash2 size={12} />
                          </button>
                      )}
                      <div className={`absolute -bottom-2 -right-2 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border ${isHackerMode ? 'bg-green-900 text-green-400 border-green-700' : 'bg-slate-200 text-slate-500 border-white'}`}>
                         {idx + 1}
                      </div>
                  </div>
              ))}
          </div>

          {/* Controls */}
          <div className={`p-4 border-t flex items-center justify-between shadow-lg z-20 ${isHackerMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`text-xs font-bold ${isHackerMode ? 'text-green-600' : 'text-slate-400'}`}>
                 {program.length} / {level.maxBlocks} {isHackerMode ? 'CMDS' : 'Blocos'}
              </div>
              <div className="flex gap-2">
                  <Button 
                    onClick={resetGame} 
                    variant="danger" 
                    size="sm" 
                    disabled={program.length === 0 || isPlaying}
                    className="aspect-square p-0 w-12 flex items-center justify-center"
                  >
                     <Trash2 size={20} />
                  </Button>
                  <Button 
                    onClick={() => runProgram(false)} 
                    variant={gameStatus === 'running' ? 'secondary' : 'success'}
                    size="md"
                    className={`min-w-[140px] ${isHackerMode ? 'font-mono tracking-widest' : ''}`}
                    disabled={program.length === 0 || gameStatus === 'won'}
                  >
                      {gameStatus === 'running' ? (
                          <><Pause size={20} /> {isHackerMode ? 'ABORT' : 'Parar'}</>
                      ) : (
                          <><Play size={20} fill="currentColor" /> {isHackerMode ? 'EXEC' : 'Executar'}</>
                      )}
                  </Button>
              </div>
          </div>
      </div>

      {/* RIGHT: PREVIEW */}
      <div className={`w-full md:w-[400px] flex flex-col border-l relative ${isHackerMode ? 'bg-black border-green-900' : 'bg-slate-200 border-slate-300'}`}>
          
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8">
              {/* Grid Container */}
              <div 
                className={`relative shadow-2xl rounded-xl overflow-hidden ${isHackerMode ? 'shadow-green-500/20' : ''}`}
                style={{
                    width: level.gridSize * 60,
                    height: level.gridSize * 60,
                    backgroundColor: isHackerMode ? '#000' : '#fff',
                    backgroundSize: '60px 60px',
                    backgroundImage: isHackerMode 
                      ? 'linear-gradient(to right, #003300 1px, transparent 1px), linear-gradient(to bottom, #003300 1px, transparent 1px)'
                      : 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)'
                }}
              >
                  {/* Goal */}
                  {level.goalPos && (
                      <div 
                        className="absolute flex items-center justify-center animate-pulse"
                        style={{ left: level.goalPos.x * 60, top: level.goalPos.y * 60, width: 60, height: 60 }}
                      >
                          <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center ${isHackerMode ? 'bg-green-900 border-green-500' : 'bg-green-200 border-green-400'}`}>
                              <div className={`w-4 h-4 rounded-full ${isHackerMode ? 'bg-green-400' : 'bg-green-500'}`} />
                          </div>
                      </div>
                  )}

                  {/* Obstacles */}
                  {level.obstacles.map((obs, i) => (
                      <div 
                        key={i}
                        className={`absolute rounded-lg shadow-lg border-b-4 ${isHackerMode ? 'bg-green-950 border-green-800' : 'bg-slate-700 border-slate-900'}`}
                        style={{ left: obs.x * 60 + 5, top: obs.y * 60 + 5, width: 50, height: 50 }}
                      >
                          <div className={`w-full h-full opacity-50 ${isHackerMode ? '' : "bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"}`}>
                             {isHackerMode && <span className="text-[10px] text-green-800 font-mono p-1">ERR</span>}
                          </div>
                      </div>
                  ))}

                  {/* Painted Cells */}
                  {paintedCells.map((cell, i) => (
                       <div 
                         key={`paint-${i}`}
                         className={`absolute ${isHackerMode ? 'bg-green-500/30' : 'bg-purple-400/50'}`}
                         style={{ left: cell.x * 60, top: cell.y * 60, width: 60, height: 60 }}
                       />
                  ))}

                  {/* Robot */}
                  <Robot 
                    x={robotState.x} 
                    y={robotState.y} 
                    cellSize={60} 
                    direction={robotState.dir}
                    isHappy={gameStatus === 'won'}
                    isSad={gameStatus === 'lost'}
                    isTalking={tutorialOpen} // Robot animates when talking
                  />
              </div>
          </div>

          {/* Feedback Overlay */}
          {(gameStatus === 'won' || gameStatus === 'lost') && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-30">
                  <div className={`rounded-3xl p-8 text-center max-w-sm shadow-2xl animate-bounce-subtle ${isHackerMode ? 'bg-slate-900 border border-green-500' : 'bg-white'}`}>
                      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                          gameStatus === 'won' 
                            ? (isHackerMode ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-600')
                            : (isHackerMode ? 'bg-red-900 text-red-500' : 'bg-red-100 text-red-600')
                      }`}>
                          {gameStatus === 'won' ? <CheckCircle size={48} /> : <XCircle size={48} />}
                      </div>
                      <h2 className={`text-2xl font-heading mb-2 ${isHackerMode ? 'text-green-400' : 'text-slate-800'}`}>
                          {gameStatus === 'won' ? (isHackerMode ? 'SISTEMA HACKEADO' : 'Incrível!') : (isHackerMode ? 'FALHA CRÍTICA' : 'Ai, bati!')}
                      </h2>
                      <p className={`font-bold mb-6 ${isHackerMode ? 'text-green-700' : 'text-slate-500'}`}>
                          {gameStatus === 'won' 
                            ? level.explanation 
                            : (timeLeft !== null && timeLeft <= 0 ? 'Minha bateria acabou! 🔋 Precisamos ser mais rápidos!' : 'Ops! Bati no muro. Vamos tentar de novo? 🤕')
                          }
                      </p>
                      
                      <div className="flex gap-3 justify-center">
                          <Button onClick={resetGame} variant="secondary" size="sm">
                             <RotateCcw size={18} className="mr-2" /> Tentar
                          </Button>
                          {gameStatus === 'won' && (
                              <Button onClick={() => onNextLevel(program.length)} variant="primary" size="sm">
                                 Próximo <ArrowLeft className="rotate-180 ml-2" size={18} />
                              </Button>
                          )}
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* Tutorial Modal */}
      {tutorialOpen && level.tutorialMessage && (
         <div className="fixed inset-0 z-50 pointer-events-none flex items-end md:items-center justify-center p-6 md:p-0">
             <div className={`pointer-events-auto p-6 rounded-2xl shadow-2xl border-4 max-w-sm animate-slide-up relative ${isHackerMode ? 'bg-slate-900 border-green-600' : 'bg-white border-yellow-400'}`}>
                 <button onClick={() => setTutorialOpen(false)} className={`absolute top-2 right-2 hover:opacity-75 ${isHackerMode ? 'text-green-500' : 'text-slate-300'}`}><XCircle /></button>
                 <div className="flex gap-4">
                     <div className="text-4xl">{isHackerMode ? '💾' : '💡'}</div>
                     <div>
                         <h4 className={`font-bold uppercase text-xs mb-1 ${isHackerMode ? 'text-green-500' : 'text-yellow-600'}`}>{isHackerMode ? 'LOG DO SISTEMA' : 'Dica do Sparky'}</h4>
                         <p className={`text-lg leading-tight font-bold ${isHackerMode ? 'text-green-100 font-mono' : 'text-slate-800'}`}>{level.tutorialMessage}</p>
                     </div>
                 </div>
                 <Button onClick={() => setTutorialOpen(false)} size="sm" className="w-full mt-4" variant={isHackerMode ? 'success' : 'secondary'}>Entendi</Button>
             </div>
         </div>
      )}

      {/* Control Block Tutorial Overlay (Standard Mode Only) */}
      <AnimatePresence>
        {showControlGuide && !isHackerMode && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
           >
             <motion.div 
               initial={{ scale: 0.8, y: 50 }} 
               animate={{ scale: 1, y: 0 }} 
               className="bg-white rounded-3xl p-8 max-w-lg w-full border-4 border-orange-300 relative overflow-hidden shadow-2xl"
             >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full translate-x-10 -translate-y-10" />

                 <div className="relative z-10 text-center">
                     <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg rotate-12">
                         <Repeat size={32} strokeWidth={3} />
                     </div>
                     
                     <h2 className="text-2xl font-heading text-slate-800 mb-2">Poder da Repetição!</h2>
                     <p className="text-slate-500 mb-6 font-bold">
                        O bloco laranja repete ações. Assim, eu trabalho mais rápido!
                     </p>
                     
                     <TutorialDemo />

                     <Button onClick={handleConfirmControlGuide} variant="primary" size="lg" className="w-full">
                        Entendi, vamos rodar!
                     </Button>
                 </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Motion Block Tutorial Overlay (Standard Mode Only) */}
      <AnimatePresence>
        {showMotionGuide && !isHackerMode && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
           >
             <motion.div 
               initial={{ scale: 0.8, y: 50 }} 
               animate={{ scale: 1, y: 0 }} 
               className="bg-white rounded-3xl p-8 max-w-lg w-full border-4 border-blue-300 relative overflow-hidden shadow-2xl"
             >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full translate-x-10 -translate-y-10" />

                 <div className="relative z-10 text-center">
                     <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg -rotate-12">
                         <Move size={32} strokeWidth={3} />
                     </div>
                     
                     <h2 className="text-2xl font-heading text-slate-800 mb-2">Mova o Sparky!</h2>
                     <p className="text-slate-500 mb-6 font-bold">
                        Os blocos azuis dão vida ao robô. Use-os para me guiar pelo mapa.
                     </p>
                     
                     <MotionTutorialDemo />

                     <Button onClick={handleConfirmMotionGuide} variant="primary" size="lg" className="w-full">
                        Entendi!
                     </Button>
                 </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Action Block Tutorial Overlay (Standard Mode Only) */}
      <AnimatePresence>
        {showActionGuide && !isHackerMode && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
           >
             <motion.div 
               initial={{ scale: 0.8, y: 50 }} 
               animate={{ scale: 1, y: 0 }} 
               className="bg-white rounded-3xl p-8 max-w-lg w-full border-4 border-purple-300 relative overflow-hidden shadow-2xl"
             >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full translate-x-10 -translate-y-10" />

                 <div className="relative z-10 text-center">
                     <div className="w-16 h-16 bg-purple-500 text-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg rotate-6">
                         <Brush size={32} strokeWidth={3} />
                     </div>
                     
                     <h2 className="text-2xl font-heading text-slate-800 mb-2">Pinte o Mundo!</h2>
                     <p className="text-slate-500 mb-6 font-bold">
                        Use o bloco roxo para pintar o chão ou marcar seu caminho.
                     </p>
                     
                     <ActionTutorialDemo />

                     <Button onClick={handleConfirmActionGuide} variant="primary" size="lg" className="w-full">
                        Entendi, vamos pintar!
                     </Button>
                 </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};