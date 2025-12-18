
import React, { useState } from 'react';
import { ArrowLeft, FlaskConical, Leaf, Drumstick, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import confetti from 'canvas-confetti';

interface ScienceGameScreenProps {
  onBack: () => void;
}

type Diet = 'herbivore' | 'carnivore';

export const ScienceGameScreen: React.FC<ScienceGameScreenProps> = ({ onBack }) => {
  const [score, setScore] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Lista expandida para 25+ itens
  const items = [
      { id: 1, name: 'Folha', icon: '🌿', type: 'herbivore' },
      { id: 2, name: 'Carne', icon: '🥩', type: 'carnivore' },
      { id: 3, name: 'Maçã', icon: '🍎', type: 'herbivore' },
      { id: 4, name: 'Peixe', icon: '🐟', type: 'carnivore' },
      { id: 5, name: 'Cenoura', icon: '🥕', type: 'herbivore' },
      { id: 6, name: 'Osso', icon: '🦴', type: 'carnivore' },
      { id: 7, name: 'Banana', icon: '🍌', type: 'herbivore' },
      { id: 8, name: 'Leão', icon: '🦁', type: 'carnivore' },
      { id: 9, name: 'Girafa', icon: '🦒', type: 'herbivore' },
      { id: 10, name: 'Tubarão', icon: '🦈', type: 'carnivore' },
      { id: 11, name: 'Coelho', icon: '🐇', type: 'herbivore' },
      { id: 12, name: 'Tigre', icon: '🐅', type: 'carnivore' },
      { id: 13, name: 'Vaca', icon: '🐄', type: 'herbivore' },
      { id: 14, name: 'Lobo', icon: '🐺', type: 'carnivore' },
      { id: 15, name: 'Brócolis', icon: '🥦', type: 'herbivore' },
      { id: 16, name: 'Águia', icon: '🦅', type: 'carnivore' },
      { id: 17, name: 'Ovelha', icon: '🐑', type: 'herbivore' },
      { id: 18, name: 'Jacaré', icon: '🐊', type: 'carnivore' },
      { id: 19, name: 'Elefante', icon: '🐘', type: 'herbivore' },
      { id: 20, name: 'Coruja', icon: '🦉', type: 'carnivore' },
      { id: 21, name: 'Milho', icon: '🌽', type: 'herbivore' },
      { id: 22, name: 'Sapo', icon: '🐸', type: 'carnivore' },
      { id: 23, name: 'Panda', icon: '🐼', type: 'herbivore' },
      { id: 24, name: 'Gato', icon: '🐱', type: 'carnivore' },
      { id: 25, name: 'Uva', icon: '🍇', type: 'herbivore' },
  ];

  const currentItem = items[currentItemIndex % items.length];

  const handleClassify = (choice: Diet) => {
      if (choice === currentItem.type) {
          setScore(s => s + 1);
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
          setTimeout(() => {
              setCurrentItemIndex(p => p + 1);
          }, 300);
      } else {
          // Shake effect or sound could go here
          alert("Ops! Esse dino não come isso. Tente de novo!");
      }
  };

  return (
    <div className="min-h-screen bg-teal-50 text-slate-800 flex flex-col font-sans">
       {/* Background */}
       <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/biology.png')] pointer-events-none"></div>

       {/* Header */}
       <div className="p-4 flex justify-between items-center z-10 bg-white/80 backdrop-blur-md border-b border-teal-200">
          <button onClick={onBack} className="bg-teal-100 text-teal-800 p-2 rounded-full hover:bg-teal-200 transition">
             <ArrowLeft />
          </button>
          <h1 className="font-heading text-xl text-teal-800 flex items-center gap-2">
             <FlaskConical /> Laboratório Dino
          </h1>
          <div className="bg-teal-100 px-3 py-1 rounded-full text-teal-800 font-bold text-sm">
             Pontos: {score}
          </div>
       </div>

       {/* Main Lab */}
       <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 gap-8">
           
           <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-teal-900">Hora do Lanche!</h2>
              <p className="text-teal-600">O que esse alimento ou animal é?</p>
           </div>

           {/* Conveyor Belt Item */}
           <div className="relative w-64 h-64 bg-white rounded-full border-8 border-teal-100 shadow-2xl flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-teal-50 opacity-50 rounded-full animate-spin-slow"></div>
               <motion.div 
                 key={currentItem.id}
                 initial={{ scale: 0, y: 50 }}
                 animate={{ scale: 1, y: 0 }}
                 exit={{ scale: 0 }}
                 className="text-9xl z-10 drop-shadow-lg"
               >
                  {currentItem.icon}
               </motion.div>
           </div>

           <div className="font-heading text-3xl text-slate-700">{currentItem.name}</div>

           {/* Buttons */}
           <div className="flex gap-6 w-full max-w-md mt-4">
               <button 
                 onClick={() => handleClassify('herbivore')}
                 className="flex-1 bg-green-500 hover:bg-green-400 text-white rounded-2xl p-6 flex flex-col items-center gap-2 border-b-8 border-green-700 active:border-b-0 active:translate-y-2 transition-all group"
               >
                  <Leaf size={40} className="group-hover:rotate-12 transition" />
                  <span className="font-bold text-lg">Planta / Herbívoro</span>
               </button>

               <button 
                 onClick={() => handleClassify('carnivore')}
                 className="flex-1 bg-red-500 hover:bg-red-400 text-white rounded-2xl p-6 flex flex-col items-center gap-2 border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all group"
               >
                  <Drumstick size={40} className="group-hover:-rotate-12 transition" />
                  <span className="font-bold text-lg">Carne / Carnívoro</span>
               </button>
           </div>

       </div>
    </div>
  );
};
