import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CourseSlide, CourseSlidesDeck } from '../courseSlidesData';
import { 
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Award, 
  Sparkles, CheckCircle, BookOpen, Download, X, List, Play, Check 
} from 'lucide-react';
import { audioService } from '../services/AudioService';
import confetti from 'canvas-confetti';

interface CourseSlideViewerProps {
  deck: CourseSlidesDeck;
  onClose: () => void;
  initialSlideNumber?: number;
}

export const CourseSlideViewer: React.FC<CourseSlideViewerProps> = ({ 
  deck, 
  onClose, 
  initialSlideNumber = 1 
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(initialSlideNumber - 1);
  const [totalXpEarned, setTotalXpEarned] = useState<number>(0);
  const [visitedSlideIds, setVisitedSlideIds] = useState<number[]>([deck.slides[0]?.id || 1]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [lastCoverId, setLastCoverId] = useState<number | null>(null);

  const currentSlide: CourseSlide = deck.slides[currentSlideIndex] || deck.slides[0];
  const slideHeading = currentSlide.title || `PDF Oficial do Curso`;
  const slideTagline = currentSlide.subtitle || `Página ${currentSlide.slideNumber} de ${deck.slides.length} — 100% fiel ao material original.`;

  useEffect(() => {
    // Efeito para registrar XP do slide caso não tenha sido visitado ainda
    if (currentSlide && !visitedSlideIds.includes(currentSlide.id)) {
      setVisitedSlideIds(prev => [...prev, currentSlide.id]);
      setTotalXpEarned(prev => prev + currentSlide.xpReward);
      audioService.playSfx('success');
    }
  }, [currentSlideIndex, currentSlide, visitedSlideIds]);

  // Small confetti burst when a module cover appears (once per cover)
  useEffect(() => {
    if (currentSlide && currentSlide.isModuleCover && currentSlide.id !== lastCoverId) {
      setLastCoverId(currentSlide.id);
      try {
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.2 } });
      } catch (e) {
        // ignore in environments without canvas
      }
    }
  }, [currentSlide, lastCoverId]);

  // Suporte para navegação por teclado (Setas Esquerda / Direita)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navegação de slides
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
      }

      // *** PROTEÇÃO ANTI-CÓPIA ***
      // Bloqueia Ctrl+C, Ctrl+A, Ctrl+S, Ctrl+P, PrintScreen
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'a', 's', 'p', 'u', 'i'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault();
      }
    };

    // Bloqueia colar via teclado (captura global)
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
    };
  }, [currentSlideIndex, isFullscreen]);

  const handleNextSlide = () => {
    if (currentSlideIndex < deck.slides.length - 1) {
      audioService.playSfx('pop');
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      audioService.playSfx('pop');
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const progressPercentage = Math.round(((currentSlideIndex + 1) / deck.slides.length) * 100);

  return (
    <div 
      className={`fixed inset-0 z-50 bg-[#090d16] text-white flex flex-col font-sans selection:bg-transparent ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      
      {/* Container Principal */}
      <div className="relative w-full h-full max-w-7xl mx-auto bg-slate-900 rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        
        {/* BARRA SUPERIOR DE CONTROLES */}
        <header className="px-4 py-3 bg-slate-800/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              className="p-2 bg-slate-700/60 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5"
            >
              <X size={18} /> Sair
            </button>

            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                {deck.badge}
              </span>
              <h2 className="text-sm md:text-base font-heading text-white truncate max-w-xs md:max-w-md">
                {deck.courseTitle}
              </h2>
            </div>
          </div>

          {/* XP acumulado & Contador de Slides */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-bold shadow-inner">
              <Sparkles size={14} className="text-yellow-400 fill-yellow-400 animate-pulse" />
              <span>+{totalXpEarned} XP</span>
            </div>

            <div className="text-xs font-mono font-bold px-3 py-1 bg-slate-900/80 rounded-xl border border-white/10 text-slate-300">
              {currentSlide.slideNumber} / {deck.slides.length}
            </div>

            {deck.pdfUrl && (
              <a
                href={deck.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold border border-cyan-400 shadow-lg transition"
              >
                Ver PDF oficial
              </a>
            )}

            <button
              onClick={() => setShowDrawer(!showDrawer)}
              className="p-2 bg-slate-700/60 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white border border-white/10"
              title="Índice de Módulos e Slides"
            >
              <List size={18} />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-slate-700/60 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white border border-white/10 hidden sm:flex"
              title="Modo Apresentação (Tela Cheia)"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </header>

        {/* BARRA DE PROGRESSO DO CURSO */}
        <div className="w-full h-1.5 bg-slate-950">
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 via-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* ÁREA CENTRAL DE EXIBIÇÃO DO SLIDE */}
        <main className="flex-1 relative overflow-y-auto p-4 sm:p-8 md:p-12 flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-4xl space-y-6 my-auto"
            >
              {/* Se for Capa de Módulo */}
              {currentSlide.isModuleCover && (
                <div className="text-center space-y-6 py-8">
                  {currentSlide.imageUrl && (
                    <div className="mx-auto max-w-md">
                      <img src={currentSlide.imageUrl} alt={currentSlide.title} className="w-full rounded-2xl shadow-2xl border border-white/10 object-cover" />
                    </div>
                  )}
                  {currentSlide.moduleTitle && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/40 uppercase tracking-widest">
                      {currentSlide.moduleTitle}
                    </div>
                  )}

                  {currentSlide.title && (
                    <h1 className="text-4xl sm:text-6xl font-heading text-white drop-shadow-xl leading-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-300 to-indigo-400">
                      {currentSlide.title}
                    </h1>
                  )}

                  {currentSlide.subtitle && (
                    <p className="text-slate-100 text-base sm:text-xl font-semibold max-w-2xl mx-auto leading-relaxed">
                      {currentSlide.subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Se for Slide de Conteúdo Normal */}
              {!currentSlide.isModuleCover && (
                <div className="space-y-6">
                  {/* Cabeçalho do Slide */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-heading text-white flex items-center gap-3">
                        {slideHeading}
                      </h2>
                      <p className="text-indigo-200 text-sm font-medium mt-1">
                        {slideTagline}
                      </p>
                    </div>

                    {currentSlide.categoryTag && (
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {currentSlide.categoryTag}
                      </span>
                    )}
                  </div>

                  {currentSlide.imageUrl && (
                    <div className="my-4 mx-auto max-w-2xl">
                      <img
                        src={currentSlide.imageUrl}
                        alt={currentSlide.title || `Página ${currentSlide.slideNumber}`}
                        className="w-full rounded-2xl shadow-xl border border-white/10 object-cover"
                      />
                    </div>
                  )}

                  <div className="bg-slate-900/70 p-5 rounded-3xl border border-indigo-500/20 shadow-inner space-y-3">
                    <div className="text-xs uppercase tracking-widest text-indigo-300 font-bold">Conteúdo do Slide</div>
                    <p className="text-slate-200 text-sm leading-relaxed">
                      Este slide corresponde à página <span className="font-semibold text-white">{currentSlide.slideNumber}</span> do PDF oficial do curso. O material foi preservado exatamente como na fonte original, mantendo o visual e a informação de cada página.
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      A navegação segue a ordem natural do PDF, então você lê o conteúdo na mesma sequência que o autor planejou.
                    </p>
                  </div>

                  {/* Bullet Points */}
                  {currentSlide.bulletPoints && currentSlide.bulletPoints.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {currentSlide.bulletPoints.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-4 bg-gradient-to-r from-slate-800/60 to-slate-900/60 p-4 rounded-3xl border border-white/5 shadow-md">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-400/20 text-amber-300 text-lg">✨</div>
                          <span className="text-slate-100 text-base sm:text-lg leading-relaxed font-semibold">
                            {point}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Caixa de Código (Scratch vs Python ou Código Pro) */}
                  {currentSlide.codeBox && (
                    <div className="bg-[#0f172a] rounded-2xl border border-indigo-500/30 p-5 shadow-xl space-y-4">
                      {currentSlide.codeBox.scratchTitle && (
                        <div className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-2">
                          <span>🧩 {currentSlide.codeBox.scratchTitle}</span>
                        </div>
                      )}
                      
                      {currentSlide.codeBox.scratchCode && (
                        <pre className="bg-indigo-950/60 p-4 rounded-xl text-yellow-200 font-mono text-xs sm:text-sm whitespace-pre-wrap border border-indigo-500/20">
                          {currentSlide.codeBox.scratchCode}
                        </pre>
                      )}

                      {currentSlide.codeBox.pythonTitle && (
                        <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 pt-2">
                          <span>🐍 {currentSlide.codeBox.pythonTitle}</span>
                        </div>
                      )}

                      {currentSlide.codeBox.pythonCode && (
                        <pre className="bg-slate-950 p-4 rounded-xl text-cyan-300 font-mono text-xs sm:text-sm whitespace-pre-wrap border border-cyan-500/20">
                          {currentSlide.codeBox.pythonCode}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Dica Ninja / Truque de Ouro / Fact Check */}
                  {currentSlide.ninjaTip && (
                    <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 p-4 rounded-2xl border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
                      <span className="text-lg">🥷</span>
                      <p className="font-semibold leading-relaxed">{currentSlide.ninjaTip}</p>
                    </div>
                  )}

                  {currentSlide.factCheck && (
                    <div className="bg-gradient-to-r from-indigo-950/80 to-slate-900 p-4 rounded-2xl border border-indigo-500/40 text-indigo-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
                      <span className="text-lg">💡</span>
                      <p className="font-semibold leading-relaxed">{currentSlide.factCheck}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* CONTROLES DE NAVEGAÇÃO INFERIORES */}
        <footer className="px-6 py-4 bg-slate-800/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between z-20">
          <button
            onClick={handlePrevSlide}
            disabled={currentSlideIndex === 0}
            className={`
              px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition border
              ${currentSlideIndex === 0 
                ? 'opacity-40 cursor-not-allowed bg-slate-800 border-transparent text-slate-500' 
                : 'bg-slate-700 hover:bg-slate-600 border-white/10 text-white shadow-lg'}
            `}
          >
            <ChevronLeft size={18} /> Anterior
          </button>

          <div className="text-xs text-slate-400 hidden sm:block">
            Use as <kbd className="px-2 py-1 bg-slate-900 rounded border border-white/10 font-mono text-slate-300">Setas do Teclado</kbd> para navegar
          </div>

          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex === deck.slides.length - 1}
            className={`
              px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition border shadow-lg
              ${currentSlideIndex === deck.slides.length - 1 
                ? 'opacity-40 cursor-not-allowed bg-slate-800 border-transparent text-slate-500' 
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white'}
            `}
          >
            Próximo <ChevronRight size={18} />
          </button>
        </footer>

        {/* DRAWER LATERAL DE ÍNDICE DE SLIDES */}
        <AnimatePresence>
          {showDrawer && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-slate-950/95 backdrop-blur-md border-l border-white/10 z-30 p-4 overflow-y-auto flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="font-heading text-sm text-white flex items-center gap-2">
                    <List size={16} /> Índice dos Slides ({deck.slides.length})
                  </h3>
                  <button onClick={() => setShowDrawer(false)} className="p-1 text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {deck.slides.map((slide, idx) => {
                    const isCurrent = idx === currentSlideIndex;
                    const isVisited = visitedSlideIds.includes(slide.id);

                    return (
                      <button
                        key={slide.id}
                        onClick={() => {
                          setCurrentSlideIndex(idx);
                          setShowDrawer(false);
                          audioService.playSfx('pop');
                        }}
                        className={`
                          w-full p-2.5 rounded-xl text-left text-xs font-medium transition flex items-center justify-between gap-2 border
                          ${isCurrent 
                            ? 'bg-indigo-600 text-white font-bold border-indigo-400' 
                            : 'bg-slate-900/60 text-slate-300 border-transparent hover:bg-slate-800'}
                        `}
                      >
                          <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] opacity-60">#{slide.slideNumber}</span>
                          <span className="truncate">{slide.title || `Página ${slide.slideNumber}`}</span>
                        </div>
                        {isVisited && <Check size={14} className="text-green-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
