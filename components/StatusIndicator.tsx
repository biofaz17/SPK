
import React from 'react';

interface StatusIndicatorProps {
  className?: string;
  isSaving?: boolean;
  isGuest?: boolean;
}

/**
 * Componente StatusIndicator
 * 
 * Atualização: Retorna null para remover as informações visuais de "Modo Visitante" e "Sincronizado"
 * conforme solicitado. A lógica de sincronização continua operando silenciosamente em background.
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = () => {
  return null;
};
