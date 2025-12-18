
import React from 'react';
import { Cloud, CheckCircle } from 'lucide-react';

interface StatusIndicatorProps {
  className?: string;
  isSaving?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ className = "", isSaving = false }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 transition-all duration-300 ${className}`}>
      <Cloud size={14} className={`${isSaving ? 'animate-bounce text-blue-400' : 'text-indigo-200'}`} />
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-tight text-white/90">
          {isSaving ? 'Salvando...' : 'Sincronizado'}
        </span>
        {!isSaving && <CheckCircle size={12} className="text-green-400 fill-green-400/20" />}
      </div>
    </div>
  );
};
