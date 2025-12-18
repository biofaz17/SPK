
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Robot } from './Robot';
import { audioService } from '../services/AudioService';
import { UserProfile } from '../types';
import { X } from 'lucide-react';

interface SparkyAssistantProps {
  user: UserProfile;
}

const TIPS = [
  "Não esqueça de beber água! 💧",
  "Você é super inteligente! 🚀",
  "Loops ajudam a economizar blocos! 🔄",
  "Se errar, é só tentar de novo! 🛠️",
  "Adoro ver você programando! 🤖",
  "Vamos conquistar mais estrelas? ⭐",
  "O modo criativo é muito legal! 🎨",
  "Lógica é como um superpoder! 🦸",
  "Bip bop! Olá amigo! 👋",
  "Que tal um desafio novo? 🗺️"
];

const ANIMATIONS = ['jump', 'spin', 'wave', 'shake'];

export const SparkyAssistant: React.FC<SparkyAssistantProps> = ({ user }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [animType, setAnimType] = useState('idle');

  useEffect(() => {
    // Timer para aparecer aleatoriamente (entre 30s e 90s)
    const setupTimer = () => {
      const time = Math.random() * (90000 - 30000) + 30000;
      return setTimeout(triggerAppearance, time);
    };

    let timer = setupTimer();

    return () => clearTimeout(timer);
  }, []);

  const triggerAppearance = () => {
    if (document.hidden) return; // Não aparece se a aba não estiver focada

    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    const randomAnim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];

    setMessage(randomTip);
    setAnimType(randomAnim);
    setIsVisible(true);

    // Som de aparição suave
    audioService.playSfx('pop');

    // Fala a dica (opcional, curto)
    setTimeout(() => {
        audioService.speak(randomTip, 'happy');
    }, 500);

    // Desaparece automaticamente após 6 segundos
    setTimeout(() => {
      setIsVisible(false);
    }, 6000);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    audioService.stop();
  };

  // Variantes de Animação do Container (Entrada/Saída)
  const containerVariants = {
    hidden: { y: 100, opacity: 0, scale: 0.8 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      // Fix: added 'as const' to string literal to match AnimationGeneratorType expectations
      transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
    },
    exit: { y: 100, opacity: 0, scale: 0.8, transition: { duration: 0.3 } }
  };

  // Variantes de Animação do Robô (Ação rápida < 1s)
  const robotMotionVariants = {
    idle: { y: 0 },
    jump: { y: [0, -30, 0], transition: { duration: 0.6, repeat: 1 } },
    spin: { rotate: [0, 360], transition: { duration: 0.8 } },
    wave: { rotate: [0, -20, 20, -20, 0], transition: { duration: 0.8 } },
    shake: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.5 } }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-4 right-4 z-[90] flex items-end gap-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Balão de Fala */}
          <div className="bg-white p-3 rounded-2xl rounded-br-none shadow-xl border-2 border-indigo-100 mb-8 max-w-[200px] relative animate-popIn origin-bottom-right">
             <button 
                onClick={handleDismiss}
                className="absolute -top-2 -left-2 bg-slate-200 rounded-full p-1 text-slate-500 hover:bg-red-100 hover:text-red-500"
             >
                <X size={10} />
             </button>
             <p className="text-xs font-bold text-indigo-900 leading-snug text-center">
               {message}
             </p>
          </div>

          {/* Container do Robô */}
          <motion.div 
            className="w-24 h-24 relative cursor-pointer"
            onClick={() => {
                // Interação ao clicar: Pula e faz som
                setAnimType('jump');
                audioService.playSfx('click');
            }}
            variants={robotMotionVariants}
            animate={animType}
          >
             <Robot 
               x={0} 
               y={0} 
               cellSize={96} 
               skinId={user.activeSkin || 'default'} 
               isHappy={true} // Sempre feliz ao aparecer
               direction="left" // Olhando para o centro da tela
             />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
