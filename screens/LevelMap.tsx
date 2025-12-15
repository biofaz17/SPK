
import React, { useState } from 'react';
import { Star, Lock, MapPin, ArrowLeft, Crown, Zap, PlayCircle } from 'lucide-react';
import { LEVELS } from '../constants';
import { AgeGroup, SubscriptionTier, LevelConfig } from '../types';

interface LevelMapProps {
  unlockedLevels: number;
  userSubscription: SubscriptionTier;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
  onRequestUpgrade: () => void;
}

export const LevelMap: React.FC<LevelMapProps> = ({ 
  unlockedLevels, 
  userSubscription,
  onSelectLevel, 
  onBack,
  onRequestUpgrade
}) => {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>('5-7');

  // Filter levels by age group and Sort them
  const filteredLevels = LEVELS.filter(l => l.ageGroup === selectedAge).sort((a,b) => (a.id as number) - (b.id as number));

  // Group levels by phase
  const phases = {
    free: filteredLevels.filter(l => l.requiredSubscription === SubscriptionTier.FREE),
    starter: filteredLevels.filter(l => l.requiredSubscription === SubscriptionTier.STARTER),
    pro: filteredLevels.filter(l => l.requiredSubscription === SubscriptionTier.PRO),
  };

  // Helper function to check if user has access to a specific tier
  const hasSubscriptionAccess = (requiredTier: SubscriptionTier): boolean => {
    if (requiredTier === SubscriptionTier.FREE) return true;
    
    if (requiredTier === SubscriptionTier.STARTER) {
      // Starter content is accessible by STARTER and PRO users
      return userSubscription === SubscriptionTier.STARTER || userSubscription === SubscriptionTier.PRO;
    }
    
    if (requiredTier === SubscriptionTier.PRO) {
      // Pro content is accessible only by PRO users
      return userSubscription === SubscriptionTier.PRO;
    }

    return false;
  };

  const handleLevelClick = (level: LevelConfig) => {
    // 1. Check Subscription Requirements
    // If the user does not have the required subscription, redirect to upgrade immediately.
    if (!hasSubscriptionAccess(level.requiredSubscription)) {
      onRequestUpgrade();
      return;
    }

    // 2. Progression Check (Optional/Mocked)
    // Here we would typically check if previous levels are completed.
    // For now, we allow playing any level within the owned tier as per instructions.
    onSelectLevel(level.id as number);
  };

  const renderLevelNode = (level: LevelConfig, index: number) => {
      const levelId = level.id as number;
      const isPremiumLocked = !hasSubscriptionAccess(level.requiredSubscription);

      let tierIcon = null;

      if (level.requiredSubscription === SubscriptionTier.PRO) {
          tierIcon = <Crown size={14} className="text-yellow-900" />;
      } else if (level.requiredSubscription === SubscriptionTier.STARTER) {
          tierIcon = <Zap size={14} className="text-blue-900" />;
      }

      return (
        <div key={levelId} className="flex flex-col items-center relative group mx-4 mb-8">
          <button
            onClick={() => handleLevelClick(level)}
            className={`
              w-20 h-20 md:w-24 md:h-24 rounded-full border-b-8 flex items-center justify-center transition-all transform hover:scale-110 relative shadow-lg
              ${isPremiumLocked ? 'bg-slate-200 border-slate-300 cursor-not-allowed' : 'bg-white border-blue-200 cursor-pointer'}
              ${!isPremiumLocked && level.requiredSubscription === SubscriptionTier.FREE ? 'bg-green-400 border-green-600' : ''}
              ${!isPremiumLocked && level.requiredSubscription === SubscriptionTier.STARTER ? 'bg-blue-400 border-blue-600' : ''}
              ${!isPremiumLocked && level.requiredSubscription === SubscriptionTier.PRO ? 'bg-purple-400 border-purple-600' : ''}
            `}
          >
            {isPremiumLocked ? (
                <div className="flex flex-col items-center justify-center text-slate-400 animate-pulse">
                    <Lock size={24} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase">Bloqueado</span>
                </div>
            ) : (
                <span className="text-3xl font-bold text-white font-heading">{index + 1}</span>
            )}
            
            {/* Subscription Badge */}
            {tierIcon && (
              <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 border-2 border-slate-200 shadow-sm z-20">
                  {tierIcon}
              </div>
            )}
          </button>
          
          <div className="mt-3 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
              {level.title}
          </div>
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#65a30d] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex flex-col items-center p-4 relative overflow-y-auto">
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="fixed top-4 left-4 bg-white rounded-full p-3 shadow-lg hover:scale-110 transition z-50 border-4 border-green-700"
      >
        <ArrowLeft size={24} className="text-green-700" />
      </button>

      <div className="w-full max-w-5xl mt-20 pb-20">
        <h2 className="text-4xl md:text-5xl text-white font-heading text-center mb-8 drop-shadow-md">
           Mapa da Aventura
        </h2>

        {/* Age Group Tabs */}
        <div className="flex justify-center gap-2 mb-12 flex-wrap sticky top-4 z-40 bg-[#65a30d]/90 p-2 rounded-full backdrop-blur-sm shadow-xl border border-white/20">
           {(['5-7', '8-10', '11-14'] as AgeGroup[]).map(age => (
             <button
               key={age}
               onClick={() => setSelectedAge(age)}
               className={`
                 px-6 py-2 rounded-full font-bold transition-all
                 ${selectedAge === age 
                    ? 'bg-yellow-400 text-yellow-900 shadow-md scale-105' 
                    : 'text-white hover:bg-white/20'}
               `}
             >
               {age === '5-7' && '👶 5-7 Anos'}
               {age === '8-10' && '👦 8-10 Anos'}
               {age === '11-14' && '🧑‍💻 11-14 Anos'}
             </button>
           ))}
        </div>

        {/* Phase 1: Free */}
        <div className="mb-12">
            <div className="flex items-center gap-4 mb-6 px-8">
               <div className="bg-green-500 text-white p-2 rounded-lg shadow-sm"><PlayCircle size={24} /></div>
               <h3 className="text-2xl font-heading text-white drop-shadow-sm">Início <span className="text-sm font-sans font-bold bg-white/20 px-2 py-0.5 rounded-full ml-2">Grátis</span></h3>
               <div className="h-1 bg-white/30 flex-1 rounded-full ml-4"></div>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
                {phases.free.map((l, i) => renderLevelNode(l, i))}
            </div>
        </div>

        {/* Phase 2: Starter */}
        <div className="mb-12">
            <div className="flex items-center gap-4 mb-6 px-8">
               <div className="bg-blue-500 text-white p-2 rounded-lg shadow-sm"><Zap size={24} /></div>
               <h3 className="text-2xl font-heading text-white drop-shadow-sm">Desafio <span className="text-sm font-sans font-bold bg-blue-900/50 px-2 py-0.5 rounded-full ml-2">Starter</span></h3>
               <div className="h-1 bg-blue-300/30 flex-1 rounded-full ml-4"></div>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
                {phases.starter.map((l, i) => renderLevelNode(l, i + phases.free.length))}
            </div>
        </div>

        {/* Phase 3: Pro */}
        <div className="mb-12">
            <div className="flex items-center gap-4 mb-6 px-8">
               <div className="bg-purple-500 text-white p-2 rounded-lg shadow-sm"><Crown size={24} /></div>
               <h3 className="text-2xl font-heading text-white drop-shadow-sm">Mestre <span className="text-sm font-sans font-bold bg-purple-900/50 px-2 py-0.5 rounded-full ml-2">Pro</span></h3>
               <div className="h-1 bg-purple-300/30 flex-1 rounded-full ml-4"></div>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
                {phases.pro.map((l, i) => renderLevelNode(l, i + phases.free.length + phases.starter.length))}
            </div>
        </div>

      </div>
    </div>
  );
};
