
import React, { useState } from 'react';
import { Lock, ArrowLeft, Crown, Zap, Check, Star } from 'lucide-react';
import { LEVELS } from '../constants';
import { SubscriptionTier, LevelConfig } from '../types';

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
  
  // Helper function to check if user has access to a specific tier
  const hasSubscriptionAccess = (requiredTier: SubscriptionTier): boolean => {
    if (requiredTier === SubscriptionTier.FREE) return true;
    if (requiredTier === SubscriptionTier.STARTER) {
      return userSubscription === SubscriptionTier.STARTER || userSubscription === SubscriptionTier.PRO;
    }
    if (requiredTier === SubscriptionTier.PRO) {
      return userSubscription === SubscriptionTier.PRO;
    }
    return false;
  };

  const handleLevelClick = (level: LevelConfig) => {
    if (!hasSubscriptionAccess(level.requiredSubscription)) {
      onRequestUpgrade();
      return;
    }
    onSelectLevel(level.id as number);
  };

  // Group levels by Tier for display
  const freeLevels = LEVELS.filter(l => l.requiredSubscription === SubscriptionTier.FREE);
  const starterLevels = LEVELS.filter(l => l.requiredSubscription === SubscriptionTier.STARTER);
  const proLevels = LEVELS.filter(l => l.requiredSubscription === SubscriptionTier.PRO);

  const renderLevelGrid = (levels: LevelConfig[], title: string, tierColor: string, icon: React.ReactNode, locked: boolean) => (
      <div className={`mb-12 w-full max-w-5xl ${locked ? 'opacity-80' : ''}`}>
          <div className={`flex items-center gap-3 mb-6 p-4 rounded-xl shadow-sm ${locked ? 'bg-slate-200' : 'bg-white/90 backdrop-blur-sm'}`}>
              <div className={`p-2 rounded-full text-white ${tierColor}`}>
                  {icon}
              </div>
              <div>
                  <h3 className="text-xl md:text-2xl font-heading text-slate-800">{title}</h3>
                  {locked && <span className="text-xs font-bold text-red-500 uppercase flex items-center gap-1"><Lock size={12}/> Bloqueado</span>}
              </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-6 px-4">
              {levels.map((level, index) => {
                  const levelId = level.id as number;
                  const isProgressionLocked = (levelId > unlockedLevels) && unlockedLevels > 0;
                  const isCompleted = levelId < unlockedLevels;
                  const isCurrent = levelId === unlockedLevels;
                  
                  // Cannot play if tier is locked OR progression is locked
                  const isPlayable = !locked && !isProgressionLocked;

                  return (
                      <button
                        key={levelId}
                        onClick={() => handleLevelClick(level)}
                        disabled={!isPlayable && !locked} // Allow clicking locked tier to see upgrade modal
                        className={`
                          group relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-300
                          ${locked 
                              ? 'bg-slate-300 cursor-pointer hover:bg-slate-400' 
                              : (isProgressionLocked 
                                  ? 'bg-slate-200 opacity-60 cursor-not-allowed' 
                                  : (isCurrent 
                                      ? `${tierColor.replace('bg-', 'bg-')} ring-4 ring-white ring-offset-2 ring-offset-green-600 scale-110 shadow-xl` 
                                      : 'bg-white hover:scale-105 shadow-md'))
                          }
                        `}
                      >
                          {locked ? (
                              <Lock size={24} className="text-slate-500" />
                          ) : isCompleted ? (
                              <div className="bg-green-500 rounded-full p-1">
                                  <Check size={20} className="text-white" strokeWidth={4} />
                              </div>
                          ) : (
                              <span className={`text-2xl font-heading ${isCurrent ? 'text-white' : 'text-slate-600'}`}>
                                  {levelId}
                              </span>
                          )}

                          {/* Level Title Tooltip */}
                          <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                              {level.title}
                          </div>

                          {/* Connector Line (Visual only, works best in grid) */}
                          {index < levels.length - 1 && (
                              <div className={`hidden md:block absolute -right-8 top-1/2 w-4 h-1 rounded-full ${isPlayable ? 'bg-white/50' : 'bg-black/10'}`} />
                          )}
                      </button>
                  );
              })}
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#65a30d] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex flex-col items-center p-4 relative overflow-y-auto">
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="fixed top-4 left-4 bg-white rounded-full p-3 shadow-lg hover:scale-110 transition z-50 border-4 border-green-700"
      >
        <ArrowLeft size={24} className="text-green-700" />
      </button>

      <div className="w-full max-w-5xl mt-20 pb-20 flex flex-col items-center">
        <h2 className="text-4xl md:text-5xl text-white font-heading text-center mb-4 drop-shadow-md">
           Mapa da Aventura
        </h2>
        <p className="text-green-100 font-bold mb-10 text-center max-w-md">
            Viaje pelos mundos do conhecimento. Desbloqueie novos desafios evoluindo seu plano!
        </p>

        {/* FREE WORLD */}
        {renderLevelGrid(
            freeLevels, 
            "Mundo Inicial (Grátis)", 
            "bg-green-500", 
            <Star fill="currentColor" />, 
            false
        )}

        {/* STARTER WORLD */}
        {renderLevelGrid(
            starterLevels, 
            "Mundo da Floresta (Starter)", 
            "bg-blue-500", 
            <Zap fill="currentColor" />, 
            !hasSubscriptionAccess(SubscriptionTier.STARTER)
        )}

        {/* PRO WORLD */}
        {renderLevelGrid(
            proLevels, 
            "Mundo Hacker (Pro)", 
            "bg-purple-600", 
            <Crown fill="currentColor" />, 
            !hasSubscriptionAccess(SubscriptionTier.PRO)
        )}

      </div>
    </div>
  );
};
