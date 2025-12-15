
import React from 'react';
import { motion } from 'framer-motion';

interface RobotProps {
  x: number;
  y: number;
  cellSize: number;
  gap?: number;
  isHappy?: boolean;
  isSad?: boolean;
  isPainting?: boolean;
  isTalking?: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const Robot: React.FC<RobotProps> = ({ 
  x, 
  y, 
  cellSize, 
  gap = 0,
  isHappy, 
  isSad, 
  isPainting, 
  isTalking,
  direction = 'right'
}) => {
  const stride = cellSize + gap;
  
  // Rotação baseada na direção (Mantendo a correção para não deitar verticalmente)
  let rotation = 0;
  let scaleX = 1;

  switch (direction) {
    case 'up': rotation = 0; break; 
    case 'down': rotation = 0; break;
    case 'left': scaleX = -1; rotation = 0; break; // Espelha para esquerda
    case 'right': scaleX = 1; rotation = 0; break;
    default: rotation = 0;
  }

  return (
    <motion.div
      className="absolute z-20 flex items-center justify-center pointer-events-none"
      initial={false}
      animate={{
        x: x * stride,
        y: y * stride,
      }}
      transition={{ 
        // USANDO SPRING (MOLA) PARA FLUIDEZ
        // Isso permite transições suaves mesmo se o X e Y mudarem rapidamente
        x: { type: "spring", stiffness: 250, damping: 25, mass: 1 },
        y: { type: "spring", stiffness: 250, damping: 25, mass: 1 }
      }}
      style={{ width: cellSize, height: cellSize }}
    >
      <motion.div 
        className={`relative w-4/5 h-4/5 transition-transform ${isHappy ? 'animate-bounce' : ''}`}
        animate={{ rotate: rotation, scaleX: scaleX }}
        transition={{ duration: 0.2 }}
      >
        {/* Efeito de Pintura */}
        {isPainting && (
           <motion.div 
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full h-2 bg-purple-400 rounded-full opacity-50 blur-sm"
           />
        )}

        {/* Antena de Raio (Sparky Signature) */}
        <motion.div 
           className="absolute -top-6 left-1/2 -translate-x-1/2 z-10"
           animate={isHappy || isTalking ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
        >
            <svg width="20" height="30" viewBox="0 0 20 30" fill="none">
               <path d="M10 0L14 12H8L12 24" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />
               <circle cx="10" cy="24" r="2" fill="#FBBF24" />
            </svg>
        </motion.div>

        {/* Corpo do Robô */}
        <motion.div 
            className="absolute inset-0 bg-blue-600 rounded-2xl shadow-[0_4px_0_#1e40af] border-2 border-blue-800 flex flex-col items-center justify-center overflow-hidden"
            animate={isTalking ? { scaleY: [1, 1.05, 0.95, 1], rotate: [0, -1, 1, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.4 }}
        >
           {/* Rosto Branco (Marca Registrada) */}
           <div className="bg-white w-[85%] h-[60%] rounded-xl mb-1 flex flex-col items-center justify-center relative overflow-hidden border-2 border-blue-100 shadow-inner">
              
              {/* Olhos */}
              <div className="flex gap-3 z-10 mt-1">
                <motion.div 
                  animate={isTalking ? { height: ["0.5rem", "0.75rem", "0.5rem"] } : { scaleY: [1, 0.1, 1] }} 
                  transition={isTalking ? { repeat: Infinity, duration: 0.2 } : { repeat: Infinity, duration: 3, delay: 1 }}
                  className="w-3 h-4 bg-blue-900 rounded-full" 
                />
                <motion.div 
                  animate={isTalking ? { height: ["0.5rem", "0.75rem", "0.5rem"] } : { scaleY: [1, 0.1, 1] }} 
                  transition={isTalking ? { repeat: Infinity, duration: 0.2 } : { repeat: Infinity, duration: 3, delay: 1 }}
                  className="w-3 h-4 bg-blue-900 rounded-full" 
                />
              </div>

              {/* Boca/Sorriso */}
              <motion.div 
                 className="mt-1"
                 animate={isTalking ? { scaleX: [1, 0.8, 1] } : {}}
              >
                  {isSad ? (
                      <div className="w-4 h-1 bg-red-500 rounded-full mt-2 rotate-180" />
                  ) : (
                      <div className="w-6 h-3 border-b-4 border-blue-900 rounded-full" />
                  )}
              </motion.div>
           </div>

           {/* Painel no Peito */}
           <div className="w-1/2 h-2 bg-yellow-400 rounded-full mt-1 opacity-80" />
        </motion.div>
        
        {/* Orelhas */}
        <div className={`absolute top-1/3 -left-2 w-3 h-6 rounded-l-full border-l-2 border-y-2 border-orange-600 ${isHappy ? 'bg-yellow-300' : 'bg-yellow-500'}`} />
        <div className={`absolute top-1/3 -right-2 w-3 h-6 rounded-r-full border-r-2 border-y-2 border-orange-600 ${isHappy ? 'bg-yellow-300' : 'bg-yellow-500'}`} />
        
        {/* Rodas/Pés */}
        <div className="absolute -bottom-2 left-1 w-4 h-3 bg-slate-800 rounded-b-lg border-2 border-slate-600" />
        <div className="absolute -bottom-2 right-1 w-4 h-3 bg-slate-800 rounded-b-lg border-2 border-slate-600" />
      </motion.div>
    </motion.div>
  );
};
