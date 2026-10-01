import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, SubscriptionTier, Course, CourseLesson, CourseModule } from '../types';
import { COURSES_DATA } from '../coursesData';
import { COURSE_DECKS, CourseSlidesDeck } from '../courseSlidesData';
import { CourseSlideViewer } from '../components/CourseSlideViewer';
import { 
  BookOpen, Lock, CheckCircle2, ArrowLeft, Crown, Zap, 
  ChevronRight, Sparkles, HelpCircle, X, Check, Star, Layers, GraduationCap, ShieldCheck
} from 'lucide-react';
import { Button } from '../components/Button';
import { audioService } from '../services/AudioService';

interface CoursesScreenProps {
  user: UserProfile;
  onBack: () => void;
  onOpenCheckout: (tier: SubscriptionTier) => void;
}

export const CoursesScreen: React.FC<CoursesScreenProps> = ({ user, onBack, onOpenCheckout }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string>('mod-1');
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(['les-1-1']);
  const [activeSliderDeck, setActiveSliderDeck] = useState<CourseSlidesDeck | null>(null);

  // Course IDs in coursesData match deck keys in courseSlidesData directly
  const openSlideViewer = (course: Course) => {
    const deck = COURSE_DECKS[course.id];
    if (deck) {
      audioService.playSfx('pop');
      setActiveSliderDeck(deck);
    }
  };

  // Verifica se o usuário tem permissão para acessar determinado curso
  const hasAccessToCourse = (course: Course): boolean => {
    if (user.subscription === SubscriptionTier.PRO) return true;
    if (user.subscription === SubscriptionTier.STARTER && course.requiredSubscription === SubscriptionTier.STARTER) return true;
    return false;
  };

  const handleOpenLesson = (course: Course, lesson: CourseLesson) => {
    if (!hasAccessToCourse(course) && !lesson.isPreview) {
      audioService.playSfx('click');
      if (course.requiredSubscription === SubscriptionTier.PRO) {
        onOpenCheckout(SubscriptionTier.PRO);
      } else {
        onOpenCheckout(SubscriptionTier.STARTER);
      }
      return;
    }
    audioService.playSfx('pop');
    setSelectedCourse(course);
    setActiveLesson(lesson);
    setQuizAnswer(null);
    setIsQuizSubmitted(false);
  };

  const handleToggleLessonComplete = (lessonId: string) => {
    audioService.playSfx('success');
    if (completedLessonIds.includes(lessonId)) {
      setCompletedLessonIds(completedLessonIds.filter(id => id !== lessonId));
    } else {
      setCompletedLessonIds([...completedLessonIds, lessonId]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Decorativo */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-20 px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white border border-white/10 flex items-center gap-2 font-bold text-sm"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <div>
            <h1 className="font-heading text-xl md:text-2xl text-white flex items-center gap-2">
              <BookOpen className="text-indigo-400" size={24} /> Área de Cursos Sparky
            </h1>
            <p className="text-slate-400 text-xs font-semibold">Conteúdo Interativo Exclusivo para Assinantes</p>
          </div>
        </div>

        {/* Badge do Plano Atual do Usuário */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Seu Plano</span>
            <span className="text-sm font-heading text-indigo-300">
              {user.subscription === SubscriptionTier.PRO && '⚡ Plano Completo (PRO)'}
              {user.subscription === SubscriptionTier.STARTER && '⭐ Plano Básico (Starter)'}
              {user.subscription === SubscriptionTier.FREE && '🌱 Grátis (Explorador)'}
            </span>
          </div>

          {user.subscription === SubscriptionTier.FREE && (
            <Button 
              variant="warning" 
              size="sm" 
              onClick={() => onOpenCheckout(SubscriptionTier.PRO)}
              className="animate-pulse shadow-lg"
            >
              <Crown size={16} className="mr-1.5" /> Adquirir Plano
            </Button>
          )}

          {user.subscription === SubscriptionTier.STARTER && (
            <Button 
              variant="warning" 
              size="sm" 
              onClick={() => onOpenCheckout(SubscriptionTier.PRO)}
            >
              <Crown size={16} className="mr-1.5" /> Upgrade para Completo
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 flex-1 w-full space-y-8">
        
        {/* BANNER DE INCENTIVO DE COMPRA / UPGRADE */}
        {user.subscription === SubscriptionTier.FREE && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-slate-900 rounded-3xl p-6 md:p-8 border-2 border-indigo-500/50 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-bold border border-yellow-500/30">
                  <Sparkles size={14} /> Oferta Especial de Cursos
                </div>
                <h2 className="text-2xl md:text-3xl font-heading text-white">
                  Desbloqueie a Trilha Completa de Aprendizado Sparky!
                </h2>
                <p className="text-slate-300 text-sm md:text-base max-w-3xl">
                  Adquira o <strong>Plano Básico</strong> para liberar o <strong>Curso 1 (Scratch)</strong> ou escolha o <strong>Plano Completo</strong> para garantir os <strong>2 Cursos + Robótica & IA</strong> com acesso ilimitado!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <Button 
                  variant="secondary" 
                  size="md" 
                  onClick={() => onOpenCheckout(SubscriptionTier.STARTER)}
                  className="bg-blue-600 hover:bg-blue-500 text-white border-none"
                >
                  <Zap size={18} className="mr-2" /> Plano Básico (R$ 19,99)
                </Button>
                <Button 
                  variant="success" 
                  size="md" 
                  onClick={() => onOpenCheckout(SubscriptionTier.PRO)}
                  className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 text-white border-none shadow-xl"
                >
                  <Crown size={18} className="mr-2" /> Plano Completo (R$ 49,99)
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {user.subscription === SubscriptionTier.STARTER && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950 rounded-3xl p-6 border-2 border-amber-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <Crown size={14} /> Você possui o Plano Básico
              </div>
              <h3 className="text-xl font-heading text-white">
                Seu Curso 1 (Scratch) está 100% Liberado! 🚀
              </h3>
              <p className="text-slate-300 text-sm max-w-2xl">
                Quer ir além e dominar <strong>Robótica Educacional, Algoritmos Avançados e Inteligência Artificial</strong>? Faça upgrade para o Plano Completo e liberte o Curso 2!
              </p>
            </div>
            <Button 
              variant="warning" 
              size="md" 
              onClick={() => onOpenCheckout(SubscriptionTier.PRO)}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-none shrink-0"
            >
              <Crown size={18} className="mr-2" /> Liberar Curso 2 (Plano Completo)
            </Button>
          </motion.div>
        )}

        {/* LISTAGEM DOS CURSOS */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-heading text-white">Cursos Disponíveis</h2>
              <p className="text-slate-400 text-sm">Selecione um curso para acessar o conteúdo interativo com slides, quiz e XP.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {COURSES_DATA.map((course) => {
              const hasAccess = hasAccessToCourse(course);
              const courseLessonsCount = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
              const completedCount = course.modules
                .flatMap(m => m.lessons)
                .filter(l => completedLessonIds.includes(l.id)).length;
              const progressPercentage = Math.round((completedCount / courseLessonsCount) * 100);

              return (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -4 }}
                  className={`
                    relative rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col justify-between
                    ${hasAccess 
                      ? 'bg-slate-900/90 border-slate-700 shadow-xl shadow-indigo-950/20' 
                      : 'bg-slate-900/60 border-slate-800 opacity-90'}
                  `}
                >
                  {/* Cabeçalho do Card do Curso */}
                  <div className={`p-6 bg-gradient-to-r ${course.colorGradient} relative overflow-hidden`}>
                    <div className="absolute right-[-20px] top-[-20px] opacity-10 text-white pointer-events-none">
                      <BookOpen size={180} />
                    </div>

                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border backdrop-blur-md ${course.badgeColor}`}>
                          Curso 0{course.courseNumber} • {course.planLabel}
                        </span>

                        {hasAccess ? (
                          <span className="flex items-center gap-1 text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/40 px-3 py-1 rounded-full backdrop-blur-md">
                            <CheckCircle2 size={14} /> Acesso Liberado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold bg-slate-900/80 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full backdrop-blur-md">
                            <Lock size={14} /> Bloqueado
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl font-heading text-white drop-shadow-md">
                        {course.title}
                      </h3>
                      <p className="text-white/90 text-sm font-medium leading-relaxed">
                        {course.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {course.description}
                    </p>

                    {/* Meta Infos */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-800/50 p-3 rounded-2xl border border-white/5 text-center text-xs">
                      <div>
                        <span className="text-slate-400 block">Duração</span>
                        <strong className="text-white text-sm">{course.durationHours} Horas</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Aulas</span>
                        <strong className="text-white text-sm">{course.totalLessons} Aulas</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Público</span>
                        <strong className="text-indigo-300 text-xs">{course.targetAudience}</strong>
                      </div>
                    </div>

                    {/* Barra de Progresso caso liberado */}
                    {hasAccess && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-400">Progresso no Curso</span>
                          <span className="text-indigo-400">{progressPercentage}% concluído</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Ações / Botões de Acesso */}
                    <div className="pt-2 space-y-3">
                      {hasAccess ? (
                        <>
                          {/* Botão principal: Leitor Interativo de Slides */}
                          <Button 
                            variant="primary" 
                            size="md" 
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold border-none shadow-xl"
                            onClick={() => openSlideViewer(course)}
                          >
                            <GraduationCap size={18} className="mr-2" /> Abrir Leitor Interativo ({(COURSE_DECKS[course.id]?.slides.length) ?? course.totalLessons} Slides + XP)
                          </Button>
                          {COURSE_DECKS[course.id]?.pdfUrl && (
                            <a
                              href={COURSE_DECKS[course.id].pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition"
                            >
                              <BookOpen size={16} className="mr-1" /> Abrir PDF oficial
                            </a>
                          )}
                          <p className="text-amber-300 text-[11px] leading-relaxed mt-1">
                            Acesse o conteúdo real do curso: slides extraídos do PDF oficial, página a página, para estudar na ordem certa.
                          </p>
                          {/* Botão secundário: acessar por aula */}
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border-white/10 text-xs"
                            onClick={() => {
                              const firstLesson = course.modules[0].lessons[0];
                              handleOpenLesson(course, firstLesson);
                            }}
                          >
                            <Layers size={15} className="mr-2" /> Ver Grade de Aulas por Módulo
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Button 
                            variant="warning" 
                            size="md" 
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white font-bold border-none shadow-lg"
                            onClick={() => onOpenCheckout(course.requiredSubscription)}
                          >
                            <Lock size={18} className="mr-2" /> Destravar Acesso ({course.requiredSubscription === SubscriptionTier.STARTER ? 'Plano Básico' : 'Plano Completo'})
                          </Button>
                          <p className="text-center text-slate-400 text-xs">
                            Você pode visualizar as aulas de prévia antes de adquirir.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista Resumida dos Módulos do Curso */}
                  <div className="px-6 pb-6 pt-0 border-t border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pt-4">
                      Módulos do Curso:
                    </h4>
                    <div className="space-y-2">
                      {course.modules.map((mod) => (
                        <div 
                          key={mod.id}
                          className="bg-slate-800/40 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-200 block">{mod.title}</span>
                            <span className="text-slate-400 text-[11px]">{mod.lessons.length} conteúdos interativos</span>
                          </div>
                          <button 
                            onClick={() => {
                              const firstLes = mod.lessons[0];
                              handleOpenLesson(course, firstLes);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 hover:underline text-xs shrink-0"
                          >
                            Ver <ChevronRight size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </main>

      {/* MODAL / DRAWER DE AULA (PLAYER E APRECIAÇÃO DAS LIÇÕES) */}
      <AnimatePresence>
        {selectedCourse && activeLesson && (
          <div 
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
              onContextMenu={(e) => e.preventDefault()}
              style={{ userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
            >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 w-full max-w-5xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
            >
              {/* Header do Player */}
              <div className="px-6 py-4 bg-slate-800 border-b border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                    {selectedCourse.title}
                  </span>
                  <h3 className="text-lg font-heading text-white">{activeLesson.title}</h3>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCourse(null);
                    setActiveLesson(null);
                  }}
                  className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Layout Dividido: Player + Lista de Aulas */}
              <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto">
                {/* Área do Vídeo / Conteúdo Principal */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-white/5">
                  {/* Simulador de Player de Vídeo */}
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 flex flex-col items-center justify-center text-center p-6 group">
                    {activeLesson.videoUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 relative">
                        <div className="w-20 h-20 bg-indigo-600/90 rounded-full flex items-center justify-center shadow-2xl border-4 border-indigo-400/50">
                          <BookOpen size={36} className="text-white" />
                        </div>
                        <p className="font-heading text-lg text-white mt-4">{activeLesson.title}</p>
                        <p className="text-slate-400 text-xs">Aula disponível exclusivamente nesta plataforma ({activeLesson.duration})</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <BookOpen size={48} className="text-indigo-400 mx-auto" />
                        <h4 className="font-heading text-white text-lg">Aula Prática Interativa</h4>
                        <p className="text-slate-400 text-sm max-w-md">Utilize o leitor interativo de slides para acompanhar o conteúdo completo desta aula com XP e quiz.</p>
                      </div>
                    )}
                  </div>

                  {/* Informações da Aula */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/5">
                      <div>
                        <h4 className="font-heading text-white text-xl">{activeLesson.title}</h4>
                        <span className="text-xs text-slate-400">Duração estimada: {activeLesson.duration}</span>
                      </div>

                      <button 
                        onClick={() => handleToggleLessonComplete(activeLesson.id)}
                        className={`
                          px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition
                          ${completedLessonIds.includes(activeLesson.id)
                            ? 'bg-green-600/20 text-green-300 border-green-500/40'
                            : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'}
                        `}
                      >
                        <Check size={16} /> 
                        {completedLessonIds.includes(activeLesson.id) ? 'Concluída' : 'Marcar como Concluída'}
                      </button>
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed">
                      {activeLesson.description}
                    </p>

                    {/* Aviso de Conteúdo Exclusivo da Plataforma */}
                    <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block">Conteúdo Protegido</span>
                          <span className="text-slate-400 text-xs">Disponível somente nesta plataforma para assinantes</span>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 bg-indigo-950 text-indigo-300 rounded-xl text-xs font-bold border border-indigo-500/30 flex items-center gap-1.5">
                        <Lock size={12} /> Exclusivo
                      </span>
                    </div>

                    {/* Quiz Rápido da Aula (Se Houver) */}
                    {activeLesson.quizQuestions && activeLesson.quizQuestions.length > 0 && (
                      <div className="bg-slate-800/60 p-5 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center gap-2 text-yellow-400 font-heading text-sm">
                          <HelpCircle size={18} /> Teste seu Aprendizado (Quiz)
                        </div>

                        {activeLesson.quizQuestions.map((q, idx) => (
                          <div key={idx} className="space-y-3">
                            <p className="text-sm font-semibold text-white">{q.question}</p>
                            <div className="space-y-2">
                              {q.options.map((opt, oIdx) => {
                                const isSelected = quizAnswer === oIdx;
                                const isCorrect = q.correctIndex === oIdx;
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => {
                                      setQuizAnswer(oIdx);
                                      setIsQuizSubmitted(true);
                                      if (isCorrect) audioService.playSfx('success');
                                      else audioService.playSfx('click');
                                    }}
                                    className={`
                                      w-full p-3 rounded-xl text-left text-xs font-medium transition border flex items-center justify-between
                                      ${isQuizSubmitted && isSelected && isCorrect ? 'bg-green-600/30 border-green-500 text-green-200' : ''}
                                      ${isQuizSubmitted && isSelected && !isCorrect ? 'bg-red-600/30 border-red-500 text-red-200' : ''}
                                      ${!isQuizSubmitted && isSelected ? 'bg-indigo-600/30 border-indigo-400 text-white' : ''}
                                      ${!isSelected ? 'bg-slate-900/50 border-white/5 text-slate-300 hover:bg-slate-800' : ''}
                                    `}
                                  >
                                    <span>{opt}</span>
                                    {isQuizSubmitted && isSelected && isCorrect && <Check size={16} className="text-green-400" />}
                                  </button>
                                );
                              })}
                            </div>
                            {isQuizSubmitted && (
                              <p className={`text-xs font-bold mt-2 ${quizAnswer === q.correctIndex ? 'text-green-400' : 'text-red-400'}`}>
                                {quizAnswer === q.correctIndex ? '✨ Resposta Correta! Mandou muito bem!' : '❌ Tente novamente! Revise a explicação.'}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar com Módulos e Outras Aulas */}
                <div className="w-full lg:w-80 bg-slate-950/80 p-4 border-t lg:border-t-0 border-white/5 overflow-y-auto space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
                    Grade de Aulas
                  </h4>

                  <div className="space-y-4">
                    {selectedCourse.modules.map((mod) => (
                      <div key={mod.id} className="space-y-1.5">
                        <div className="px-2 py-1 bg-white/5 rounded-lg text-xs font-bold text-indigo-300">
                          {mod.title}
                        </div>
                        <div className="space-y-1 pl-1">
                          {mod.lessons.map((les) => {
                            const isCurrent = activeLesson.id === les.id;
                            const isDone = completedLessonIds.includes(les.id);

                            return (
                              <button
                                key={les.id}
                                onClick={() => handleOpenLesson(selectedCourse, les)}
                                className={`
                                  w-full p-2.5 rounded-xl text-left text-xs transition flex items-center justify-between gap-2 border
                                  ${isCurrent 
                                    ? 'bg-indigo-600 text-white font-bold border-indigo-400 shadow-md' 
                                    : 'bg-slate-900/50 text-slate-300 border-transparent hover:bg-slate-800'}
                                `}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {isDone ? (
                                    <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                                  ) : (
                                    <Play size={12} className="text-slate-400 shrink-0" />
                                  )}
                                  <span className="truncate">{les.title}</span>
                                </div>
                                <span className="text-[10px] opacity-70 shrink-0">{les.duration}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LEITOR INTERATIVO DE SLIDES */}
      {activeSliderDeck && (
        <CourseSlideViewer 
          deck={activeSliderDeck} 
          onClose={() => setActiveSliderDeck(null)} 
        />
      )}
    </div>
  );
};
