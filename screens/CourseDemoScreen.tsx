import React, { useState } from 'react';
import { COURSE_DECKS, CourseSlidesDeck } from '../courseSlidesData';
import { CourseSlideViewer } from '../components/CourseSlideViewer';
import { BookOpen, ArrowLeft, Play, Sparkles, CheckCircle2, Crown, Zap, Eye, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { audioService } from '../services/AudioService';

interface CourseDemoScreenProps {
  onBack: () => void;
}

export const CourseDemoScreen: React.FC<CourseDemoScreenProps> = ({ onBack }) => {
  const [selectedDeckKey, setSelectedDeckKey] = useState<string>('curso-1-scratch-ninja');
  const [activeViewerDeck, setActiveViewerDeck] = useState<CourseSlidesDeck | null>(null);

  const currentDeck = COURSE_DECKS[selectedDeckKey] || COURSE_DECKS['curso-1-scratch-ninja'];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Background Decorativo */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Header da Página de Aprovação */}
      <header className="relative z-20 px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white border border-white/10 flex items-center gap-2 font-bold text-sm"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 uppercase tracking-wider">
              <ShieldCheck size={12} /> Demonstração & Aprovação do Sistema
            </div>
            <h1 className="font-heading text-xl md:text-2xl text-white">
              Leitor Interativo de Cursos (Estilo PDF com XP)
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 flex-1 w-full space-y-8">
        
        {/* Banner de Apresentação da Funcionalidade */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-6 md:p-8 rounded-3xl border-2 border-indigo-500/40 shadow-2xl space-y-4">
          <h2 className="text-2xl md:text-3xl font-heading text-white flex items-center gap-3">
            <Sparkles className="text-yellow-400" /> Sistema de Cursos Pago 100% Disponível
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl">
            Implementamos o leitor completo contendo os <strong>{currentDeck.slides.length} slides originais baseados nas páginas do PDF</strong>. O aluno pode navegar slide a slide, ganhar XP a cada lição, visualizar os conteúdos e acompanhar o progresso!
          </p>
        </div>

        {/* Seleção do Curso para Testar */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading text-white">Selecione o Curso para Testar e Aprovar:</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* CARD CURSO 1: SCRATCH */}
            <div 
              onClick={() => {
                setSelectedDeckKey('curso-1-scratch-ninja');
                audioService.playSfx('click');
              }}
              className={`
                p-6 rounded-3xl border-2 cursor-pointer transition flex flex-col justify-between space-y-4
                ${selectedDeckKey === 'curso-1-scratch-ninja'
                  ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 opacity-80 hover:opacity-100'}
              `}
            >
              <div className="space-y-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
                  Plano Básico & Completo
                </span>
                <h4 className="text-xl font-heading text-white">1. Aventura Scratch Ninja</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {COURSE_DECKS['curso-1-scratch-ninja'].slides.length} Slides gamificados, 10 Módulos de animações, física, sons e o jogo "Pegue a Estrela".
                </p>
              </div>

              <Button 
                variant="primary" 
                size="md" 
                onClick={() => {
                  setActiveViewerDeck(COURSE_DECKS['curso-1-scratch-ninja']);
                  audioService.playSfx('pop');
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold border-none w-full"
              >
                <Play size={18} className="mr-2" /> Abrir Leitor ({COURSE_DECKS['curso-1-scratch-ninja'].slides.length} Slides)
              </Button>
            </div>

            {/* CARD CURSO 2: PYTHON PRO */}
            <div 
              onClick={() => {
                setSelectedDeckKey('curso-2-python-pro-mode');
                audioService.playSfx('click');
              }}
              className={`
                p-6 rounded-3xl border-2 cursor-pointer transition flex flex-col justify-between space-y-4
                ${selectedDeckKey === 'curso-2-python-pro-mode'
                  ? 'bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 opacity-80 hover:opacity-100'}
              `}
            >
              <div className="space-y-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 inline-block">
                  Exclusivo Plano Completo (PRO)
                </span>
                <h4 className="text-xl font-heading text-white">2. Python Pro Mode</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {COURSE_DECKS['curso-2-python-pro-mode'].slides.length} Slides profissionais, 10 Módulos com terminal, variáveis, listas, funções e RPG Cyberpunk.
                </p>
              </div>

              <Button 
                variant="primary" 
                size="md" 
                onClick={() => {
                  setActiveViewerDeck(COURSE_DECKS['curso-2-python-pro-mode']);
                  audioService.playSfx('pop');
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold border-none w-full"
              >
                <Play size={18} className="mr-2" /> Abrir Leitor ({COURSE_DECKS['curso-2-python-pro-mode'].slides.length} Slides)
              </Button>
            </div>

          </div>
        </div>

        {/* Pré-visualização Amostra dos Módulos do Curso Selecionado */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-white text-lg">
              Estrutura de Conteúdo: {currentDeck.courseTitle}
            </h3>
            <span className="text-xs text-indigo-400 font-bold">Total: {currentDeck.slides.length} Slides</span>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currentDeck.slides.filter(s => s.isModuleCover).map((mSlide, idx) => (
              <div 
                key={mSlide.id}
                onClick={() => {
                  setActiveViewerDeck(currentDeck);
                }}
                className="bg-slate-800/60 p-3 rounded-2xl border border-white/5 hover:border-indigo-400 cursor-pointer transition space-y-1"
              >
                <span className="text-[10px] text-indigo-400 font-bold uppercase block">Slide #{mSlide.slideNumber}</span>
                <h5 className="font-heading text-xs text-white truncate">{mSlide.title}</h5>
                <span className="text-[10px] text-slate-400 block truncate">{mSlide.subtitle}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Leitor Interativo em Modal quando acionado */}
      {activeViewerDeck && (
        <CourseSlideViewer 
          deck={activeViewerDeck} 
          onClose={() => setActiveViewerDeck(null)} 
        />
      )}

    </div>
  );
};
