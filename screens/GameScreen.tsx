
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, RotateCcw, Trash2, HelpCircle, Pause, CheckCircle, XCircle, ArrowRight, Repeat, Code, Terminal, Move, Clock, Battery, BatteryWarning, Target, Brush, Volume2, VolumeX, Shirt, Lock, Crown, Waves, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
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
  user?: UserProfile | null;
  onUpdateSkin?: (skinId: string) => void;
}

// SkinSelector component (igual ao anterior)
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
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
       <div className="bg-white rounded-[2rem] p-6 max-w-2xl w-full border-4 border-indigo-200 relative animate-popIn shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><XCircle /></button>
          <div className="text-center mb-6">
             <h2 className="text-3xl font-heading text-indigo-900 mb-2 flex items-center justify-center gap-3"><Shirt className="text-indigo-500" size={32} /> Guarda-Roupa</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {skins.map(skin => (
                <button 
                  key={skin.id}
                  disabled={skin.locked}
                  onClick={() => onSelect(skin.id)}
                  className={`relative group rounded-2xl p-4 border-4 transition-all duration-200 flex flex-col items-center gap-3 ${currentSkin === skin.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 bg-slate-50 hover:bg-white'} ${skin.locked ? 'opacity-80' : ''}`}
                >
                   <div className="w-16 h-16 relative">
                      <Robot x={0} y={0} cellSize={64} skinId={skin.id} direction="right" />
                      {skin.locked && <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-[1px]"><Lock className="text-white" size={24} /></div>}
                      {currentSkin === skin.id && <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm z-20"><CheckCircle size={14} /></div>}
                   </div>
                   <div className="text-center"><h3 className="font-heading text-xs text-slate-800 leading-tight">{skin.name}</h3></div>
                </button>
             ))}
          </div>
          <div className="mt-6 flex justify-center"><Button onClick={onClose} variant="primary" size="md" className="min-w-[150px]">Pronto!</Button></div>
       </div>
    </div>
  );
};

export const GameScreen: React.FC<GameScreenProps> = ({ levelId, onBack, onNextLevel, user, onUpdateSkin }) => {
  const level = levelId === 'creative' ? CREATIVE_LEVEL : (LEVELS.find(l => l.id === levelId) || LEVELS[0]);
  const isHackerMode = (typeof level.id === 'number' && level.id >= 32) || level.id === 'creative';

  const [program, setProgram] = useState<BlockType[]>([]);
  const [robotState, setRobotState] = useState({ x: level.startPos.x, y: level.startPos.y, dir: 'right' as 'left' | 'right' | 'up' | 'down' });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'running' | 'won' | 'lost'>('idle');
  const [paintedCells, setPaintedCells] = useState<GridPosition[]>([]);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const [showSkinSelector, setShowSkinSelector] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(level.timeLimit || null);
  const [isStageExpanded, setIsStageExpanded] = useState(false);

  const abortController = useRef<AbortController | null>(null);
  const programListRef = useRef<HTMLDivElement>(null);

  useEffect(() => { audioService.setMute(isMuted); }, [isMuted]);

  useEffect(() => {
    setProgram([]);
    resetGame();
    if (level.mission && !isMuted) {
      setTimeout(() => {
        audioService.speak(
          `Missão ${level.id === 'creative' ? 'Criativa' : level.id}: ${level.mission}`,
          'instruction',
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }, 500);
    }
    return () => { audioService.stop(); };
  }, [levelId]);

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
    if (isPlaying || program.length >= level.maxBlocks) return;
    setProgram(prev => [...prev, type]);
    audioService.playSfx('pop');
  };

  const removeBlock = (index: number) => {
    if (isPlaying) return;
    const newProgram = [...program];
    newProgram.splice(index, 1);
    setProgram(newProgram);
    audioService.playSfx('delete');
  };

  // --- LÓGICA DO SENSOR ---
  const checkObstacleInFront = (x: number, y: number, dir: string) => {
    let nx = x, ny = y;
    if (dir === 'up') ny--;
    if (dir === 'down') ny++;
    if (dir === 'left') nx--;
    if (dir === 'right') nx++;
    
    const isOut = nx < 0 || nx >= level.gridSize || ny < 0 || ny >= level.gridSize;
    const isObs = level.obstacles.some(o => o.x === nx && o.y === ny);
    return isOut || isObs;
  };

  // --- INTERPRETADOR ---
  const runProgram = async () => {
    if (program.length === 0) return;
    
    resetGame();
    setIsPlaying(true);
    setGameStatus('running');
    audioService.playSfx('start');

    abortController.current = new AbortController();
    const signal = abortController.current.signal;
    const STEP_DURATION = isHackerMode ? 180 : 400;

    const wait = (ms: number) => new Promise(resolve => {
        if (signal.aborted) return;
        setTimeout(resolve, ms);
    });

    let currentX = level.startPos.x;
    let currentY = level.startPos.y;
    let currentDir = 'right' as 'left' | 'right' | 'up' | 'down';
    let lastConditionResult = true;

    const executeMove = async (action: BlockType) => {
        if (signal.aborted || gameStatus === 'lost') return;
        
        let dx = 0, dy = 0, nextDir = currentDir;
        
        if (action === BlockType.MOVE_UP) { dy = -1; nextDir = 'up'; }
        else if (action === BlockType.MOVE_DOWN) { dy = 1; nextDir = 'down'; }
        else if (action === BlockType.MOVE_LEFT) { dx = -1; nextDir = 'left'; }
        else if (action === BlockType.MOVE_RIGHT) { dx = 1; nextDir = 'right'; }
        else if (action === BlockType.PAINT) {
            setPaintedCells(prev => [...prev, {x: currentX, y: currentY}]);
            await wait(200);
            return;
        } else {
            return; // Outros blocos não são atômicos de movimento
        }

        const nextX = currentX + dx;
        const nextY = currentY + dy;
        const isOut = nextX < 0 || nextX >= level.gridSize || nextY < 0 || nextY >= level.gridSize;
        const isObs = level.obstacles.some(o => o.x === nextX && o.y === nextY);

        if (isOut || isObs) {
            setRobotState({ x: nextX, y: nextY, dir: nextDir });
            audioService.playSfx('error');
            await wait(200);
            setRobotState({ x: currentX, y: currentY, dir: nextDir });
            setGameStatus('lost');
            throw new Error('Collision');
        } else {
            currentX = nextX; currentY = nextY; currentDir = nextDir;
            setRobotState({ x: currentX, y: currentY, dir: nextDir });
            audioService.playSfx('click');
            await wait(STEP_DURATION);
        }
    };

    try {
        for (let i = 0; i < program.length; i++) {
            if (signal.aborted || gameStatus === 'lost') break;
            setCurrentBlockIndex(i);
            const block = program[i];

            // 1. Lógica Condicional: Se Obstáculo
            if (block === BlockType.IF_OBSTACLE) {
                lastConditionResult = checkObstacleInFront(currentX, currentY, currentDir);
                if (!lastConditionResult && i + 1 < program.length) {
                    i++; // Pula o próximo bloco se a condição for falsa
                }
                await wait(100);
            } 
            // 2. Lógica Condicional: Senão
            else if (block === BlockType.ELSE) {
                if (lastConditionResult && i + 1 < program.length) {
                    i++; // Pula o próximo bloco se o 'IF' anterior foi verdadeiro
                }
            }
            // 3. Lógica de Repetição
            else if (block === BlockType.REPEAT_2 || block === BlockType.REPEAT_3 || block === BlockType.REPEAT_UNTIL) {
                if (i + 1 < program.length) {
                    const nextBlock = program[i+1];
                    let count = (block === BlockType.REPEAT_2) ? 2 : (block === BlockType.REPEAT_3 ? 3 : 100);
                    
                    for (let k = 0; k < count; k++) {
                        if (signal.aborted || gameStatus === 'lost') break;
                        if (block === BlockType.REPEAT_UNTIL && level.goalPos) {
                            if (currentX === level.goalPos.x && currentY === level.goalPos.y) break;
                        }
                        await executeMove(nextBlock);
                    }
                    i++; // Avança o ponteiro pois o próximo bloco já foi processado no loop
                }
            } 
            // 4. Comandos de Movimento Simples
            else {
                await executeMove(block);
            }
        }

        if (gameStatus !== 'lost' && !signal.aborted) {
            if (level.goalPos && currentX === level.goalPos.x && currentY === level.goalPos.y) {
                setGameStatus('won');
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            } else if (level.goalPos) {
                setGameStatus('lost');
            } else if (level.isCreative) {
                setGameStatus('won'); // No modo criativo, terminar a lista é vitória
            }
        }
    } catch(e) { /* Colisão tratada no executeMove */ }
    
    setIsPlaying(false);
  };

  return (
    <div className={`fixed inset-0 flex flex-col md:flex-row w-full h-full overflow-hidden ${isHackerMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* ÁREA DO PALCO (VISUALIZAÇÃO) */}
      <div className={`
          w-full md:w-[45%] flex flex-col relative shrink-0 transition-[height] duration-500
          ${isStageExpanded ? 'h-[60%]' : 'h-[40%]'} md:h-full border-b md:border-b-0 md:border-r border-slate-300
      `}>
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-40">
              <button onClick={onBack} className="p-2 bg-white/80 rounded-full shadow-md hover:scale-110 transition"><ArrowLeft size={20}/></button>
              <div className="bg-white/80 px-4 py-1 rounded-full shadow-md"><span className="font-heading text-xs">{level.title}</span></div>
              <button onClick={() => setTutorialOpen(true)} className="p-2 bg-white/80 rounded-full shadow-md"><HelpCircle size={20}/></button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
              <div 
                className={`relative shadow-2xl rounded-xl overflow-hidden ${gameStatus === 'lost' ? 'animate-shake' : ''} scale-[0.6] sm:scale-90 md:scale-100`}
                style={{
                    width: level.gridSize * 60, height: level.gridSize * 60,
                    backgroundColor: isHackerMode ? '#0a0f1a' : '#fff',
                    backgroundImage: `linear-gradient(to right, ${isHackerMode ? '#1e293b' : '#f1f5f9'} 1px, transparent 1px), linear-gradient(to bottom, ${isHackerMode ? '#1e293b' : '#f1f5f9'} 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
              >
                  {level.goalPos && (
                      <div className="absolute flex items-center justify-center animate-pulse" style={{ left: level.goalPos.x * 60, top: level.goalPos.y * 60, width: 60, height: 60 }}>
                          <div className="w-10 h-10 rounded-full bg-green-500 border-4 border-white" />
                      </div>
                  )}
                  {level.obstacles.map((obs, i) => (
                      <div key={i} className={`absolute rounded-lg ${isHackerMode ? 'bg-slate-800' : 'bg-slate-400'}`} style={{ left: obs.x * 60 + 5, top: obs.y * 60 + 5, width: 50, height: 50 }} />
                  ))}
                  {paintedCells.map((cell, i) => (
                       <div key={i} className="absolute bg-purple-500/30" style={{ left: cell.x * 60, top: cell.y * 60, width: 60, height: 60 }} />
                  ))}
                  <Robot x={robotState.x} y={robotState.y} cellSize={60} direction={robotState.dir} isHappy={gameStatus === 'won'} isSad={gameStatus === 'lost'} isTalking={isSpeaking} skinId={user?.activeSkin} />
              </div>
          </div>

          {/* Overlay de Resultado */}
          {gameStatus !== 'running' && gameStatus !== 'idle' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-3xl p-8 text-center max-w-xs w-full animate-popIn">
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${gameStatus === 'won' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {gameStatus === 'won' ? <CheckCircle size={32} /> : <XCircle size={32} />}
                      </div>
                      <h2 className="text-2xl font-heading mb-2">{gameStatus === 'won' ? 'Excelente!' : 'Ops!'}</h2>
                      <p className="text-sm text-slate-500 mb-6 font-bold">{gameStatus === 'won' ? level.explanation : 'O Sparky bateu ou não chegou lá. Tente ajustar o código!'}</p>
                      <div className="flex gap-2">
                          <Button onClick={resetGame} variant="secondary" className="flex-1">Tentar</Button>
                          {gameStatus === 'won' && <Button onClick={() => onNextLevel(program.length)} variant="primary" className="flex-1">Próximo</Button>}
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* ÁREA DO CÓDIGO (WORKSPACE) */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="p-2 border-b flex gap-2 overflow-x-auto no-scrollbar bg-slate-50">
              {level.availableBlocks.map(type => (
                  <button key={type} onClick={() => addBlock(type)} className="shrink-0 active:scale-95 transition">
                      <BlockIcon type={type} showLabel={false} className="w-12 h-12 p-0 justify-center" />
                  </button>
              ))}
          </div>

          <div ref={programListRef} className="flex-1 p-4 overflow-y-auto scrollable-y flex flex-wrap content-start gap-2">
              {program.length === 0 && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 border-4 border-dashed rounded-3xl">
                      <Code size={48} className="mb-2" />
                      <p className="font-bold">Toque nos blocos acima</p>
                  </div>
              )}
              <AnimatePresence>
                  {program.map((block, idx) => (
                      <motion.button
                        key={`${idx}-${block}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => removeBlock(idx)}
                        className={`relative ${currentBlockIndex === idx ? 'ring-4 ring-yellow-400 scale-110 z-10' : ''}`}
                      >
                          <BlockIcon type={block} showLabel={false} className="w-12 h-12 p-0 justify-center" />
                      </motion.button>
                  ))}
              </AnimatePresence>
          </div>

          <div className="p-4 border-t flex gap-3 bg-white">
              <Button onClick={() => setProgram([])} variant="danger" size="sm" className="w-14 p-0"><Trash2/></Button>
              <Button onClick={runProgram} variant={isPlaying ? 'secondary' : 'success'} className="flex-1">
                  {isPlaying ? <Pause/> : <Play/>} {isPlaying ? 'PARAR' : 'EXECUTAR'}
              </Button>
          </div>
      </div>

      {tutorialOpen && level.tutorialMessage && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border-4 border-yellow-400">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-3xl">💡</div>
                      <h3 className="text-xl font-heading mb-2 text-slate-800">Dica do Mestre</h3>
                      <p className="text-slate-600 font-bold mb-6 leading-relaxed">{level.tutorialMessage}</p>
                      <Button onClick={() => setTutorialOpen(false)} variant="primary" className="w-full">Entendi!</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
