
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, RotateCcw, Trash2, HelpCircle, Pause, CheckCircle, XCircle, ArrowRight, Repeat, Code, Terminal, Move, Clock, Battery, BatteryWarning, Target, Brush, Volume2, VolumeX, Shirt, Lock, Crown, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LevelConfig, BlockType, BlockCategory, GridPosition, BLOCK_DEFINITIONS, UserProfile, SubscriptionTier } from '../types';
import { LEVELS, CREATIVE_LEVEL } from '../constants';
import { Button } from '../components/Button';
import { Robot } from '../components/Robot';
import { BlockIcon } from '../components/BlockIcon';
import confetti from 'canvas-confetti';
import { audioService } from '../services/AudioService';

interface GameScreenProps {
  levelId: number | string;
  onBack: () => void;
  onNextLevel: (blocksUsed: number) => void;
  user?: UserProfile | null; // Adicionado para checar permissão de skin
  onUpdateSkin?: (skinId: string) => void; // Adicionado
}

// ... (Manter os componentes de tutorial MotionTutorialDemo, ActionTutorialDemo, TutorialDemo inalterados)
const MotionTutorialDemo: React.FC = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => { setStep((prev) => (prev + 1) % 3); }, 1200);
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
       <div className="text-slate-300 hidden md:block"><ArrowRight size={32} /></div>
       <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Resultado</span>
          <div className="bg-white p-2 rounded-lg border border-slate-200 grid grid-cols-2 gap-1 w-32 h-16 items-center relative overflow-hidden shadow-sm">
              <div className="border-2 border-dashed border-slate-200 rounded h-full bg-slate-50/50"></div>
              <div className="border-2 border-dashed border-slate-200 rounded h-full bg-slate-50/50"></div>
              <motion.div 
                className="absolute top-2 left-2 w-12 h-12 z-10"
                animate={{ x: step >= 1 ? 60 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="w-full h-full bg-blue-600 rounded-lg shadow-md border-2 border-blue-800 flex items-center justify-center relative">
                    <div className="w-8 h-4 bg-white rounded-md border border-blue-200"></div>
                    <div className="absolute -top-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                </div>
              </motion.div>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-2 h-4">{step === 0 && "Ler Bloco..."}{step === 1 && "Mover!"}{step === 2 && "Pronto."}</p>
       </div>
    </div>
  );
};
const ActionTutorialDemo: React.FC = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => { setStep((prev) => (prev + 1) % 4); }, 1000);
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
       <div className="text-slate-300 animate-pulse hidden md:block"><ArrowRight size={32} /></div>
       <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">A Mágica</span>
          <div className="bg-white p-2 rounded-lg border border-slate-200 grid grid-cols-2 gap-1 w-32 h-16 items-center relative overflow-hidden shadow-sm">
              <div className={`border-2 border-dashed border-slate-200 rounded h-full transition-colors duration-500 ${step >= 1 ? 'bg-purple-400/50 border-purple-300' : 'bg-slate-50/50'}`}></div>
              <div className="border-2 border-dashed border-slate-200 rounded h-full bg-slate-50/50"></div>
              <motion.div 
                className="absolute top-2 left-2 w-12 h-12 z-10"
                animate={{ x: step >= 2 ? 60 : 0, scale: step === 1 ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="w-full h-full bg-blue-600 rounded-lg shadow-md border-2 border-blue-800 flex items-center justify-center relative">
                    <div className="w-8 h-4 bg-white rounded-md border border-blue-200"></div>
                    <AnimatePresence>
                      {step === 1 && (<motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1.5 }} exit={{ opacity: 0 }} className="absolute -bottom-2 text-purple-600"><Brush size={16} fill="currentColor" /></motion.div>)}
                    </AnimatePresence>
                </div>
              </motion.div>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-2 h-4">{step === 0 && "Preparar..."}{step === 1 && "PINTAR!"}{step === 2 && "Andar..."}{step === 3 && "Olha a cor!"}</p>
       </div>
    </div>
  );
};

const TutorialDemo: React.FC = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    // Ciclo: 0 (Idle) -> 1 (Exec 1) -> 2 (Exec 2) -> 3 (Exec 3)
    const interval = setInterval(() => { setStep((prev) => (prev + 1) % 4); }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-50 rounded-xl p-6 mb-6 border-2 border-slate-200">
         <div className="flex flex-col md:flex-row items-center justify-around gap-6">
             {/* Lado do Código */}
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Seu Código</span>
                <div className="relative transform transition-all duration-300">
                    {/* Bloco Loop */}
                    <div className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white bg-orange-500 border-b-4 border-orange-700
                        transition-all duration-300 ${step > 0 ? 'scale-105 ring-4 ring-orange-200 shadow-lg' : 'scale-100'}
                    `}>
                        <Repeat size={18} />
                        <span>Repetir 3x</span>
                    </div>
                    {/* Bloco Interno */}
                    <div className="ml-6 -mt-1 pt-2">
                         <div className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-white bg-blue-500 border-b-4 border-blue-700 shadow-sm
                            transition-all duration-200 ${step > 0 ? 'translate-x-1 opacity-100' : 'opacity-80'}
                         `}>
                            <ArrowRight size={16} />
                            <span>Andar</span>
                         </div>
                    </div>
                    
                    {/* Badge de Contador */}
                    {step > 0 && (
                        <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 bg-white text-orange-600 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-orange-500 z-10 shadow"
                        >
                            {step}
                        </motion.div>
                    )}
                </div>
             </div>

             {/* Seta */}
             <div className="hidden md:block text-slate-300">
                 <ArrowRight size={24} />
             </div>

             {/* Lado da Execução */}
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">O que acontece</span>
                <div className="bg-white p-2 rounded-xl border border-slate-200 w-48 h-20 relative overflow-hidden shadow-inner flex items-center">
                    {/* Grid */}
                    <div className="absolute inset-0 grid grid-cols-4 gap-1 p-2 opacity-20 pointer-events-none">
                        {[1,2,3,4].map(i => <div key={i} className="border border-slate-400 rounded bg-slate-100 h-full"></div>)}
                    </div>
                    
                    {/* Robot */}
                    <motion.div
                        className="w-10 h-10 bg-blue-500 rounded-lg border-2 border-blue-700 absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center text-white shadow-md"
                        animate={{ left: (step * 35) + 10 }} // Posição baseada no passo
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        <div className="w-6 h-4 bg-white rounded border border-blue-300"></div>
                    </motion.div>

                    {/* Rastros (Ghosts) */}
                    {[1, 2, 3].map(i => (
                         <div 
                            key={i} 
                            className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 border-2 border-dashed border-blue-200 rounded-lg transition-opacity duration-500 flex items-center justify-center ${step >= i ? 'opacity-100' : 'opacity-0'}`} 
                            style={{ left: (i * 35) + 10 }}
                         >
                            <span className="text-[10px] text-blue-300 font-bold">{i}</span>
                         </div>
                    ))}
                </div>
                <div className="mt-3 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    {step === 0 ? "Aguardando..." : `Executando vez ${step} de 3`}
                </div>
             </div>
         </div>
    </div>
  );
};

// --- SKIN SELECTOR MODAL ---
const SkinSelector: React.FC<{ 
  currentSkin: string, 
  onSelect: (id: string) => void, 
  onClose: () => void,
  userTier: SubscriptionTier
}> = ({ currentSkin, onSelect, onClose, userTier }) => {
  
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
                <button 
                  key={skin.id}
                  disabled={skin.locked}
                  onClick={() => onSelect(skin.id)}
                  className={`
                    relative group rounded-2xl p-4 border-4 transition-all duration-200 flex flex-col items-center gap-3
                    ${currentSkin === skin.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg'}
                    ${skin.locked ? 'opacity-80' : ''}
                  `}
                >
                   {/* Preview Container */}
                   <div className="w-20 h-20 relative">
                      <Robot x={0} y={0} cellSize={80} skinId={skin.id} direction="right" />
                      
                      {skin.locked && (
                         <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                            <Lock className="text-white drop-shadow-md" size={32} />
                         </div>
                      )}
                      {currentSkin === skin.id && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm z-20">
                           <CheckCircle size={16} />
                        </div>
                      )}
                   </div>

                   <div className="text-center">
                      <h3 className="font-heading text-sm text-slate-800 leading-tight">{skin.name}</h3>
                      {skin.locked ? (
                         <div className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1">
                            <Crown size={10} /> VIP
                         </div>
                      ) : (
                         <span className="text-[10px] text-slate-400">{skin.desc}</span>
                      )}
                   </div>
                </button>
             ))}
          </div>

          {userTier === SubscriptionTier.FREE && (
             <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                   <Crown size={24} />
                </div>
                <div>
                   <h4 className="font-bold text-yellow-900">Desbloqueie todas as skins!</h4>
                   <p className="text-xs text-yellow-800">O plano Starter libera Ninja, Fada e Dino para você usar.</p>
                </div>
                {/* Nota: O botão de compra seria complexo aqui, então apenas informamos */}
             </div>
          )}

          <div className="mt-6 flex justify-center">
             <Button onClick={onClose} variant="primary" size="md" className="min-w-[150px]">
                Pronto!
             </Button>
          </div>
       </div>
    </div>
  );
};


export const GameScreen: React.FC<GameScreenProps> = ({ levelId, onBack, onNextLevel, user, onUpdateSkin }) => {
  // --- LEVEL SETUP ---
  const level = levelId === 'creative' 
    ? CREATIVE_LEVEL 
    : (LEVELS.find(l => l.id === levelId) || LEVELS[0]);

  const isHackerMode = level.id === 45 || level.id === 'creative'; // 45 is the new Master level
  const isWaterLevel = level.id === 16; // Nível "Pontes Divertidas"

  const [program, setProgram] = useState<BlockType[]>([]);
  const [robotState, setRobotState] = useState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' as 'left' | 'right' | 'up' | 'down' });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'running' | 'won' | 'lost'>('idle');
  const [paintedCells, setPaintedCells] = useState<GridPosition[]>([]);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  
  // Skin Selector State
  const [showSkinSelector, setShowSkinSelector] = useState(false);
  
  // Audio State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Drag State for Visual Feedback
  const [draggingBlock, setDraggingBlock] = useState<BlockType | null>(null);

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
  const programListRef = useRef<HTMLDivElement>(null);

  // Initialize Audio
  useEffect(() => {
    audioService.setMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    resetGame();
    // Speak Mission on Entry with better instruction mood
    if (level.mission && !isMuted) {
      setTimeout(() => {
        audioService.speak(
          `Missão ${level.id === 'creative' ? 'Criativa' : level.id}: ${level.mission}. ${level.tutorialMessage || ''}`,
          'instruction',
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }, 500); // Small delay to allow fade in
    }
    
    return () => {
      audioService.stop();
    };
  }, [levelId]);

  // Handle Level Success/Failure Audio
  useEffect(() => {
    if (gameStatus === 'won') {
       audioService.playSfx('success');
       const winPhrases = ["Conseguimos! Você é incrível!", "Vitória! Próximo nível, lá vamos nós!", "Uau, seu código funcionou perfeitamente!", "Nós somos uma ótima equipe!"];
       const phrase = winPhrases[Math.floor(Math.random() * winPhrases.length)];
       // Delay speech slightly to let SFX play
       setTimeout(() => {
           audioService.speak(phrase, 'happy', () => setIsSpeaking(true), () => setIsSpeaking(false));
       }, 500);
    } else if (gameStatus === 'lost') {
       audioService.playSfx('error');
       const failPhrases = ["Ops, batemos! Tente novamente.", "Quase lá. Vamos revisar o código?", "Minha bateria acabou ou bati. Preciso da sua ajuda!"];
       const phrase = failPhrases[Math.floor(Math.random() * failPhrases.length)];
       setTimeout(() => {
           audioService.speak(phrase, 'neutral', () => setIsSpeaking(true), () => setIsSpeaking(false));
       }, 500);
    }
  }, [gameStatus]);

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

  // Auto-scroll program list
  useEffect(() => {
    if (programListRef.current) {
        programListRef.current.scrollTo({ top: programListRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [program.length]);

  const resetGame = () => {
    if (abortController.current) abortController.current.abort();
    setRobotState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' });
    setPaintedCells([]);
    setGameStatus('idle');
    setIsPlaying(false);
    setCurrentBlockIndex(null);
    setTimeLeft(level.timeLimit || null);
    audioService.stop();
  };

  const addBlock = (type: BlockType) => {
    if (program.length < level.maxBlocks) {
      setProgram(prev => [...prev, type]);
      // Play POP sound
      audioService.playSfx('pop');
      // Speak block explanation lightly
      const def = BLOCK_DEFINITIONS[type];
      if (!isPlaying && !isMuted) {
          // Curto delay para não sobrepor o POP
          setTimeout(() => {
              audioService.speak(def.label, 'neutral', () => setIsSpeaking(true), () => setIsSpeaking(false));
          }, 150);
      }
    } else {
        audioService.playSfx('error');
        if (!isMuted) audioService.speak("Limite de blocos atingido!", 'neutral', () => setIsSpeaking(true), () => setIsSpeaking(false));
    }
  };

  const removeBlock = (index: number) => {
    if (isPlaying) return;
    const newProgram = [...program];
    newProgram.splice(index, 1);
    setProgram(newProgram);
    audioService.playSfx('delete');
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('blockType', type);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingBlock(type);
    audioService.playSfx('click');
  };
  
  const handleDragEnd = () => {
    setDraggingBlock(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); // Necessário para permitir o drop
    const type = e.dataTransfer.getData('blockType') as BlockType;
    if (type) addBlock(type);
    setDraggingBlock(null);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // --- INTERPRETER ENGINE ---
  const runProgram = async (skipGuideCheck = false) => {
    if (program.length === 0) return;
    
    // Tutorial Checks
    const hasMotionBlock = program.some(b => BLOCK_DEFINITIONS[b].category === BlockCategory.MOTION);
    if (hasMotionBlock && !hasSeenMotionGuide && !skipGuideCheck && !isHackerMode) {
        setShowMotionGuide(true);
        audioService.speak("Veja como me mover com os blocos azuis!", 'excited', () => setIsSpeaking(true), () => setIsSpeaking(false));
        return;
    }
    const hasActionBlock = program.some(b => BLOCK_DEFINITIONS[b].category === BlockCategory.ACTION);
    if (hasActionBlock && !hasSeenActionGuide && !skipGuideCheck && !isHackerMode) {
        setShowActionGuide(true);
        audioService.speak("Hora de pintar o mundo com o bloco roxo!", 'excited', () => setIsSpeaking(true), () => setIsSpeaking(false));
        return;
    }
    const hasControlBlock = program.some(b => BLOCK_DEFINITIONS[b].category === BlockCategory.CONTROL);
    if (hasControlBlock && !hasSeenControlGuide && !skipGuideCheck && !isHackerMode) {
        setShowControlGuide(true);
        audioService.speak("Vamos repetir ações para ir mais longe!", 'excited', () => setIsSpeaking(true), () => setIsSpeaking(false));
        return;
    }

    resetGame();
    setIsPlaying(true);
    setGameStatus('running');
    
    // SFX de Start + Fala
    audioService.playSfx('start');
    if (!isMuted) {
        setTimeout(() => {
            audioService.speak("Executando código!", 'excited', () => setIsSpeaking(true), () => setIsSpeaking(false));
        }, 300);
    }

    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    // Configurações de Tempo (Refatorado para fluidez)
    // Hacker mode: 120ms (zip)
    // Normal: 400ms (tempo para a mola do robô assentar levemente, permitindo movimento contínuo)
    const STEP_DURATION = isHackerMode ? 120 : 400; 
    const PAINT_DURATION = isHackerMode ? 80 : 250;

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

      if (type === BlockType.REPEAT_2 || type === BlockType.REPEAT_3 || type === BlockType.REPEAT_UNTIL) {
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

    // Refatorado para movimento atômico fluido
    const processAtomicCommand = async (action: BlockType) => {
        if (signal.aborted) return;

        let dx = 0;
        let dy = 0;
        let nextDir = currentDir;
        let isPaint = false;

        switch (action) {
            case BlockType.MOVE_UP:    dy = -1; nextDir = 'up'; break;
            case BlockType.MOVE_DOWN:  dy = 1;  nextDir = 'down'; break;
            case BlockType.MOVE_LEFT:  dx = -1; nextDir = 'left'; break;
            case BlockType.MOVE_RIGHT: dx = 1;  nextDir = 'right'; break;
            case BlockType.PAINT:      isPaint = true; break;
        }

        if (isPaint) {
            localPainted = [...localPainted, {x: currentX, y: currentY}];
            setPaintedCells(localPainted);
            await wait(PAINT_DURATION);
            return;
        }

        if (dx !== 0 || dy !== 0) {
            const nextX = currentX + dx;
            const nextY = currentY + dy;

            const isObstacle = level.obstacles.some(o => o.x === nextX && o.y === nextY);
            const isOutOfBounds = nextX < 0 || nextX >= level.gridSize || nextY < 0 || nextY >= level.gridSize;
            
            if (isObstacle || isOutOfBounds) {
                // Rotaciona para a direção da colisão antes de falhar
                setRobotState({ x: currentX, y: currentY, dir: nextDir });
                audioService.playSfx('error');
                await wait(500); 
                setGameStatus('lost');
                throw new Error('Collision');
            } else {
                currentX = nextX;
                currentY = nextY;
                currentDir = nextDir;
                
                // Atualiza visualmente
                setRobotState({ x: currentX, y: currentY, dir: nextDir });
                
                // Som de passo sutil para feedback tátil
                if (!isHackerMode) audioService.playSfx('click'); 

                // Aguarda a animação. O tempo é ajustado para permitir que o próximo bloco
                // inicie assim que a animação anterior estiver "quase" acabando, criando fluidez.
                await wait(STEP_DURATION);
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

        // --- REPETIÇÃO ATÉ CHEGAR (WHILE NOT GOAL) ---
        else if (type === BlockType.REPEAT_UNTIL) {
             const bodyIdx = idx + 1;
             let safety = 0;
             const MAX_SAFETY = 200; // Evita loop infinito travando o browser
             
             // Loop enquanto não atingir o objetivo
             while (
                 (level.goalPos && (currentX !== level.goalPos.x || currentY !== level.goalPos.y)) && 
                 safety < MAX_SAFETY &&
                 !signal.aborted
             ) {
                 if (timeLeft !== null && timeLeft <= 0) throw new Error('Timeout');

                 if (bodyIdx < program.length) {
                     await executeBlock(bodyIdx);
                 } else {
                     break; // Loop vazio
                 }
                 safety++;
             }

             if (safety >= MAX_SAFETY) console.warn("Safety break: Infinite loop detected.");
             return;
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
                await wait(800); // Delay antes da vitória
                setGameStatus('won');
                confetti({ 
                    particleCount: 150, 
                    spread: 70, 
                    origin: { y: 0.6 },
                    colors: isHackerMode ? ['#22c55e', '#000000'] : undefined 
                });
            } else {
                await wait(1000); // Delay antes da derrota (posição final errada)
                setGameStatus('lost');
            }
        } else {
            await wait(1000); // Delay antes da vitória (modo sem goalPos fixo)
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
    <div className={`flex flex-col md:flex-row md:h-screen md:overflow-hidden min-h-screen ${bgClass} ${textClass}`}>
      
      {/* HEADER (Mobile) */}
      <div className={`md:hidden p-4 flex justify-between items-center z-20 shadow-md shrink-0 sticky top-0 ${isHackerMode ? 'bg-green-900 text-green-100' : 'bg-indigo-600 text-white'}`}>
         <button onClick={onBack}><ArrowLeft /></button>
         <span className="font-heading">{level.title}</span>
         <button onClick={() => setTutorialOpen(true)}><HelpCircle /></button>
      </div>

      {/* 
         LAYOUT ALTERADO PARA MOBILE:
         Order 1: Preview (Palco) - Topo
         Order 2: Toolbox (Ferramentas) - Meio (Horizontal)
         Order 3: Workspace (Código) - Fundo
      */}

      {/* RIGHT: PREVIEW (PALCO DO JOGO) - Agora no Topo em Mobile */}
      <div className={`
          w-full md:w-[400px] flex flex-col border-l relative shrink-0 
          ${isHackerMode ? 'bg-black border-green-900' : 'bg-slate-200 border-slate-300'} 
          h-[40vh] md:h-auto min-h-[300px] md:min-h-0 order-1 md:order-3
      `}>
          
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4 md:p-8">
              {/* Grid Container */}
              <div 
                className={`
                    relative shadow-2xl rounded-xl overflow-hidden transition-all duration-300 origin-center
                    ${isHackerMode ? 'shadow-green-500/20' : ''}
                    ${gameStatus === 'lost' ? 'ring-4 ring-red-400 border-red-500 animate-shake' : ''}
                    scale-[0.6] md:scale-100 lg:scale-100  /* Scale down on mobile to fit top view */
                `}
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
                        className={`absolute rounded-lg shadow-lg border-b-4 
                          ${isWaterLevel 
                             ? 'bg-blue-400 border-blue-600' 
                             : (isHackerMode ? 'bg-green-950 border-green-800' : 'bg-slate-700 border-slate-900')
                          }
                        `}
                        style={{ left: obs.x * 60 + 5, top: obs.y * 60 + 5, width: 50, height: 50 }}
                      >
                          <div className={`w-full h-full opacity-50 flex items-center justify-center ${isHackerMode ? '' : (isWaterLevel ? '' : "bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]")}`}>
                             {isHackerMode && <span className="text-[10px] text-green-800 font-mono p-1">ERR</span>}
                             {isWaterLevel && <Waves size={24} className="text-blue-100 animate-pulse" />}
                          </div>
                      </div>
                  ))}

                  {/* Painted Cells */}
                  {paintedCells.map((cell, i) => (
                       <div 
                         key={`paint-${i}`}
                         className={`absolute 
                            ${isWaterLevel 
                                ? 'bg-amber-600/90 border-2 border-amber-800 bg-[url("https://www.transparenttextures.com/patterns/wood-pattern.png")]' 
                                : (isHackerMode ? 'bg-green-500/30' : 'bg-purple-400/50')
                            }
                         `}
                         style={{ left: cell.x * 60, top: cell.y * 60, width: 60, height: 60 }}
                       />
                  ))}

                  {/* Robot - Agora com SKIN ID */}
                  <Robot 
                    x={robotState.x} 
                    y={robotState.y} 
                    cellSize={60} 
                    direction={robotState.dir}
                    isHappy={gameStatus === 'won'}
                    isSad={gameStatus === 'lost'}
                    isTalking={isSpeaking || tutorialOpen}
                    skinId={user?.activeSkin} // Passando a skin do usuário
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

      {/* LEFT: TOOLBOX (Em Mobile, vira faixa horizontal) */}
      <div className={`
          w-full md:w-64 border-r flex flex-col z-10 shadow-lg shrink-0 ${toolboxClass} 
          h-auto md:h-full order-2 md:order-1
      `}>
         <div className={`hidden md:flex p-4 border-b items-center gap-3 ${isHackerMode ? 'bg-slate-900 border-slate-700' : 'bg-indigo-50 border-slate-100'}`}>
            <button onClick={onBack} className={`p-2 rounded-full transition ${isHackerMode ? 'hover:bg-slate-800 text-green-500' : 'hover:bg-white text-indigo-900'}`}>
                <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
                <h2 className={`font-bold text-sm truncate ${isHackerMode ? 'text-green-400' : 'text-slate-800'}`}>{level.title}</h2>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isHackerMode ? 'text-green-700' : 'text-slate-400'}`}>Nível {level.id}</div>
            </div>
            
            {/* Skin Selector Button */}
            {!isHackerMode && (
              <button onClick={() => setShowSkinSelector(true)} className="p-2 rounded-full hover:bg-black/5 mr-1 text-purple-500 relative group">
                  <Shirt size={18} />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Mudar Roupa</span>
              </button>
            )}

            {/* Mute Button */}
            <button onClick={toggleMute} className="p-2 rounded-full hover:bg-black/5">
                {isMuted ? <VolumeX size={18} className="text-red-500" /> : <Volume2 size={18} className="text-blue-500" />}
            </button>
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
         
         {/* LISTA DE BLOCOS (HORIZONTAL EM MOBILE) */}
         <div className="flex-1 overflow-y-auto p-4 md:overflow-x-hidden overflow-x-auto">
             <div className="flex flex-row md:flex-col gap-4 md:gap-6">
                {blocksByCategory.map(cat => (
                   <div key={cat} className="min-w-max">
                       <h3 className={`text-xs font-bold uppercase mb-2 pl-1 hidden md:block ${isHackerMode ? 'text-green-700' : 'text-slate-400'}`}>{cat}</h3>
                       <div className="flex md:grid md:grid-cols-1 gap-2">
                           {availableBlocks.filter(b => BLOCK_DEFINITIONS[b].category === cat).map(type => (
                               <div 
                                  key={type}
                                  draggable={!isPlaying}
                                  onDragStart={(e) => handleDragStart(e, type)}
                                  onDragEnd={handleDragEnd}
                                  className={`
                                     touch-none relative transition-all duration-200 
                                     ${draggingBlock === type ? 'z-50' : 'cursor-grab active:cursor-grabbing'}
                                  `}
                               >
                                  <button 
                                      onClick={() => addBlock(type)}
                                      disabled={isPlaying}
                                      className={`
                                        w-full transition-all duration-300 ease-out
                                        ${draggingBlock === type 
                                            ? 'scale-105 shadow-xl -translate-y-2 opacity-90 rotate-3 ring-2 ring-indigo-300 rounded-lg' 
                                            : 'hover:scale-105 hover:shadow-md active:scale-95 active:bg-blue-50'
                                        }
                                      `}
                                      aria-label={`Adicionar bloco ${BLOCK_DEFINITIONS[type].label}`}
                                  >
                                      <BlockIcon 
                                        type={type} 
                                        className={`${isHackerMode ? 'font-mono' : ''} ${draggingBlock === type ? 'border-yellow-400 ring-2 ring-yellow-400/50' : ''}`}
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

      {/* MIDDLE: WORKSPACE (CÓDIGO) - Fica por último em mobile */}
      <div className={`flex-1 flex flex-col relative ${workspaceClass} min-h-[300px] md:min-h-0 order-3 md:order-2`}>
          
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
            ref={programListRef}
            className="flex-1 p-4 overflow-y-auto content-start flex flex-wrap content-start gap-2 scroll-smooth"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
              {program.length === 0 && (
                  <div className={`w-full h-full flex items-center justify-center flex-col border-4 border-dashed rounded-xl ${isHackerMode ? 'border-green-900 text-green-700' : 'border-slate-200 text-slate-400'}`}>
                      {isHackerMode ? <Terminal size={48} className="mb-2 opacity-50" /> : <Code size={48} className="mb-2 opacity-50" />}
                      <p className="font-bold">{isHackerMode ? '> INSERIR_MODULOS' : 'Arraste os blocos aqui'}</p>
                  </div>
              )}
              
              <AnimatePresence mode="popLayout">
                {program.map((block, idx) => (
                    <motion.div 
                      key={`${idx}-${block}`} // Use index combined with type for basic stability
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className={`relative group transition-all duration-300 ${currentBlockIndex === idx ? 'scale-110 z-10 ring-4 ring-yellow-400 rounded-lg shadow-xl' : ''}`}
                    >
                        <BlockIcon type={block} showLabel={false} className="w-12 h-12 justify-center" />
                        {!isPlaying && (
                            <button 
                              onClick={() => removeBlock(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm scale-75 hover:scale-100"
                              aria-label="Remover bloco"
                            >
                              <Trash2 size={12} />
                            </button>
                        )}
                        <div className={`absolute -bottom-2 -right-2 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border ${isHackerMode ? 'bg-green-900 text-green-400 border-green-700' : 'bg-slate-200 text-slate-500 border-white'}`}>
                          {idx + 1}
                        </div>
                    </motion.div>
                ))}
              </AnimatePresence>
          </div>

          {/* Controls */}
          <div className={`p-4 border-t flex items-center justify-between shadow-lg z-20 sticky bottom-0 md:static ${isHackerMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
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

      {/* Skin Selector Modal */}
      {showSkinSelector && user && onUpdateSkin && (
        <SkinSelector 
          currentSkin={user.activeSkin || 'default'} 
          userTier={user.subscription}
          onClose={() => setShowSkinSelector(false)}
          onSelect={(id) => {
             onUpdateSkin(id);
             setShowSkinSelector(false);
          }}
        />
      )}

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
                        Loops (Repetição) são mágicos! Em vez de usar 3 blocos de andar, usamos apenas 1 bloco de repetição. É assim que os programadores economizam tempo.
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
