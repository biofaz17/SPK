
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Robot } from './Robot';
import { audioService } from '../services/AudioService';
import { UserProfile, SubscriptionTier } from '../types';
import { X, Shirt, Crown, Sparkles } from 'lucide-react';

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

const SKIN_TIPS = [
  { text: "Sabia que você pode me vestir de Ninja no plano Pro? 🥷", skin: "ninja" },
  { text: "Eu adoro voar como fada! Experimente no plano Pro! 🧚", skin: "fairy" },
  { text: "Roaaar! Eu viro um dinossauro com o plano Pro! 🦖", skin: "dino" }
];

const ANIMATIONS = ['jump', 'spin', 'wave', 'shake'];

export const SparkyAssistant: React.FC<SparkyAssistantProps> = ({ user }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [animType, setAnimType] = useState('idle');
  const [previewSkin, setPreviewSkin] = useState(user.activeSkin || 'default');
  const [isSkinAlert, setIsSkinAlert] = useState(false);

  useEffect(() => {
    const setupTimer = () => {
      // Aparece entre 30 e 60 segundos
      const time = Math.random() * (60000 - 30000) + 30000;
      return setTimeout(triggerAppearance, time);
    };

    let timer = setupTimer();
    return () => clearTimeout(timer);
  }, []);

  const triggerAppearance = () => {
    if (document.hidden) return;

    // 40% de chance de ser um alerta de skin se for usuário gratuito
    const isShowcase = Math.random() > 0.6 && user.subscription === SubscriptionTier.FREE;
    
    if (isShowcase) {
        const skinTip = SKIN_TIPS[Math.floor(Math.random() * SKIN_TIPS.length)];
        setMessage(skinTip.text);
        setPreviewSkin(skinTip.skin);
        setIsSkinAlert(true);
    } else {
        const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
        setMessage(randomTip);
        setPreviewSkin(user.activeSkin || 'default');
        setIsSkinAlert(false);
    }

    const randomAnim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
    setAnimType(randomAnim);
    setIsVisible(true);

    audioService.playSfx('pop');

    setTimeout(() => {
        audioService.speak(message, 'happy');
    }, 500);

    setTimeout(() => {
      setIsVisible(false);
    }, 9000);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    audioService.stop();
  };

  const containerVariants = {
    hidden: { y: 100, opacity: 0, scale: 0.8 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
    },
    exit: { y: 100, opacity: 0, scale: 0.8, transition: { duration: 0.3 } }
  };

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
          className="fixed bottom-4 right-4 z-[150] flex items-end gap-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={`p-4 rounded-3xl rounded-br-none shadow-2xl border-4 mb-8 max-w-[220px] relative animate-popIn origin-bottom-right ${isSkinAlert ? 'bg-indigo-900 text-white border-yellow-400' : 'bg-white text-indigo-900 border-indigo-100'}`}>
             <button 
                onClick={handleDismiss}
                className="absolute -top-3 -left-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:scale-110 transition"
             >
                <X size={12} />
             </button>
             
             {isSkinAlert && (
               <div className="flex items-center gap-1 mb-2 text-yellow-400 font-black text-[10px] uppercase tracking-tighter">
                  <Crown size={12} /> ALERTA DE ESTILO <Sparkles size={10} />
               </div>
             )}

             <p className={`text-xs font-bold leading-snug text-center ${isSkinAlert ? 'text-indigo-50' : 'text-indigo-900'}`}>
               {message}
             </p>
             
             {isSkinAlert && (
               <div className="mt-3 flex justify-center">
                  <div className="bg-yellow-400 text-yellow-950 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 shadow-sm">
                     <Shirt size={10} /> Ver Planos
                  </div>
               </div>
             )}
          </div>

          <motion.div 
            className="w-24 h-24 relative cursor-pointer"
            onClick={() => {
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
               skinId={previewSkin} 
               isHappy={true}
               direction="left"
             />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
