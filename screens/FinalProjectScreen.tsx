import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, Code2, Download, Flag, FlaskConical, Lightbulb, Pause, Play, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { Robot } from '../components/Robot';
import type { FinalProjectLevel } from '../finalProjectTypes';
import { audioService } from '../services/AudioService';
import { buildPythonProject, runFinalProject } from '../services/FinalProjectProgram';
import type { GridPosition } from '../types';

interface FinalProjectScreenProps {
  level: FinalProjectLevel;
  onBack: () => void;
  onComplete: () => void;
  soundEnabled?: boolean;
  profileId?: string;
}

type ProjectRunResult = ReturnType<typeof runFinalProject>;
type ProjectTestResult = ProjectRunResult['tests'][number];

const FIRST_STAGE = 77;
const LAST_STAGE = 82;
const MAX_ANSWER_LENGTH = 80;
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-800 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';

const cellKey = ({ x, y }: GridPosition) => `${x},${y}`;
const describeCell = ({ x, y }: GridPosition) => `linha ${y + 1}, coluna ${x + 1}`;

const readDraft = (level: FinalProjectLevel, draftKey?: string): Record<string, string> => {
  if (!draftKey) return {};
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(draftKey) || '{}');
    if (!saved || typeof saved !== 'object') return {};
    const values = saved as Record<string, unknown>;
    const draft: Record<string, string> = {};
    for (const { id } of level.gaps) {
      const value = values[id];
      if (typeof value === 'string') draft[id] = value.slice(0, MAX_ANSWER_LENGTH);
    }
    return draft;
  } catch {
    return {};
  }
};

interface ProjectBoardProps {
  level: FinalProjectLevel;
  obstacles: GridPosition[];
  test?: ProjectTestResult;
  playhead: number | null;
}

const ProjectBoard: React.FC<ProjectBoardProps> = ({ level, obstacles, test, playhead }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const measure = () => setBoardWidth(board.clientWidth);
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(board);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const steps = test?.steps ?? [];
  const visibleSteps = playhead === null ? steps : steps.slice(0, playhead);
  const currentStep = visibleSteps[visibleSteps.length - 1];
  const position = playhead === null ? test?.finalPosition ?? level.startPos : currentStep?.position ?? level.startPos;
  const painted = playhead === null
    ? test?.paintedCells ?? []
    : visibleSteps.flatMap(step => step.painted ? [step.painted] : []);
  const paintedTiles = new Set(painted.map(cellKey));
  const walls = new Set(obstacles.map(cellKey));
  const visited = new Set(visibleSteps.map(step => cellKey(step.position)));
  const paintTargets = new Set((level.paintTargets ?? []).map(cellKey));
  const goal = cellKey(level.goalPos);

  return (
    <div ref={boardRef} aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[336px] overflow-hidden rounded-2xl bg-sky-50 ring-4 ring-sky-100">
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${level.gridSize}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${level.gridSize}, minmax(0, 1fr))` }}>
        {Array.from({ length: level.gridSize ** 2 }, (_, index) => {
          const key = cellKey({ x: index % level.gridSize, y: Math.floor(index / level.gridSize) });
          const isPainted = paintedTiles.has(key);
          return (
            <div key={key} className={`flex items-center justify-center border-b border-r border-sky-100 ${isPainted ? 'bg-amber-200' : ''}`}>
              {walls.has(key) ? (
                <div className="h-3/4 w-3/4 rounded-lg border-b-4 border-indigo-800 bg-indigo-600" />
              ) : key === goal ? (
                <div className={`flex h-3/5 w-3/5 items-center justify-center rounded-lg ${paintTargets.has(key) ? `border-2 border-dashed ${isPainted ? 'border-amber-700' : 'border-amber-500'}` : ''}`}>
                  <Flag className={`h-2/3 w-2/3 ${isPainted ? 'fill-amber-400 text-amber-900' : 'fill-emerald-200 text-emerald-800'}`} />
                </div>
              ) : paintTargets.has(key) ? (
                <div className={`h-3/5 w-3/5 rounded-lg border-2 border-dashed ${isPainted ? 'border-amber-700' : 'border-amber-500'}`} />
              ) : visited.has(key) ? (
                <span className="h-2 w-2 rounded-full bg-sky-400" />
              ) : null}
            </div>
          );
        })}
      </div>
      {boardWidth > 0 && (
        <Robot
          x={position.x}
          y={position.y}
          direction={currentStep?.direction ?? 'right'}
          cellSize={boardWidth / level.gridSize}
          isHappy={!reduceMotion && playhead === null && test?.passed}
        />
      )}
    </div>
  );
};

const FinalProjectMission: React.FC<FinalProjectScreenProps> = ({ level, onBack, onComplete, soundEnabled, profileId }) => {
  const draftKey = profileId && `sparky:final-project:${profileId}:${level.id}`;
  const [answers, setAnswers] = useState<Record<string, string>>(() => readDraft(level, draftKey));
  const [result, setResult] = useState<ProjectRunResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [caseIndex, setCaseIndex] = useState(0);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const canHear = soundEnabled !== false && !isMuted;
  const stage = level.id - FIRST_STAGE + 1;
  const isFinalStage = level.id === LAST_STAGE;

  const selectedTest = result?.tests[caseIndex];
  const failedTest = result?.tests.find(test => !test.passed);
  const scenarios = result?.tests.length
    ? result.tests
    : [{ label: 'Cenário inicial', obstacles: level.obstacles }, ...(level.testScenarios ?? [])];
  const scenario = scenarios[caseIndex] ?? scenarios[0];
  const shownLine = playhead !== null && playhead > 0 ? selectedTest?.steps[playhead - 1]?.line : undefined;
  const filledCount = level.gaps.filter(gap => answers[gap.id]?.trim()).length;
  const gaps = new Map(level.gaps.map(gap => [gap.id, gap]));
  const errorGapId = result?.error?.gapId;
  const hint = (errorGapId ? gaps.get(errorGapId)?.tip : undefined) ?? level.tutorialMessage;

  useEffect(() => {
    audioService.setMute(!canHear);
    return () => audioService.stop();
  }, [canHear]);

  useEffect(() => {
    if (!draftKey) return;
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(answers));
    } catch {
      // O editor continua funcionando quando o armazenamento local está indisponível.
    }
  }, [answers, draftKey]);

  useEffect(() => {
    if (playhead === null || !selectedTest) return;
    const timeout = window.setTimeout(() => {
      setPlayhead(playhead < selectedTest.steps.length ? playhead + 1 : null);
    }, 360);
    return () => window.clearTimeout(timeout);
  }, [playhead, selectedTest]);

  useEffect(() => {
    if (!result) return;
    const gap = result.error?.gapId;
    const target = gap ? inputs.current[gap] ?? summaryRef.current : summaryRef.current;
    target?.focus();
  }, [result]);

  const updateAnswer = (id: string, value: string) => {
    setAnswers(previous => ({ ...previous, [id]: value }));
    if (result) {
      setResult(null);
      setPlayhead(null);
    }
  };

  const testProgram = (event: React.FormEvent) => {
    event.preventDefault();
    const next = runFinalProject(level, answers);
    const firstFailed = next.tests.findIndex(test => !test.passed);
    const nextCase = Math.max(0, firstFailed);
    setResult(next);
    setCaseIndex(nextCase);
    setPlayhead(!reduceMotion && next.tests[nextCase]?.steps.length ? 0 : null);
    if (next.passed) {
      if (canHear) audioService.playSfx('success');
      return;
    }

    const nextAttempt = attempts + 1;
    setAttempts(nextAttempt);
    if (nextAttempt === 2 && canHear) {
      const gap = next.error?.gapId;
      audioService.speak(gap ? gaps.get(gap)?.tip ?? level.tutorialMessage : level.tutorialMessage, 'instruction');
    }
  };

  const downloadProject = () => {
    if (!isFinalStage || !result?.passed) return;
    const python = buildPythonProject(level, result.code);
    const url = URL.createObjectURL(new Blob([python], { type: 'text/x-python;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'farol-do-sparky.py';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main className="min-h-screen bg-sky-50 px-4 py-5 text-slate-800 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button type="button" className={secondaryButton} onClick={onBack}>
            <ArrowLeft aria-hidden="true" size={18} /> Voltar ao mapa
          </button>
          {soundEnabled !== false && (
            <button type="button" className={secondaryButton} aria-pressed={isMuted} onClick={() => setIsMuted(value => !value)}>
              {isMuted ? <VolumeX aria-hidden="true" size={18} /> : <Volume2 aria-hidden="true" size={18} />}
              Silenciar
            </button>
          )}
        </div>

        <header className="mb-6 rounded-3xl border-2 border-indigo-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-200 text-indigo-900">
              <Flag aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="font-bold text-indigo-700">Projeto Final · Farol do Sparky</p>
              <h1 className="mt-1 font-heading text-2xl text-indigo-950 sm:text-4xl">{level.title}</h1>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {Array.from({ length: LAST_STAGE - FIRST_STAGE + 1 }, (_, index) => (
                <span key={index} className={`h-2 flex-1 rounded-full ${index < stage - 1 ? 'bg-emerald-500' : index === stage - 1 ? 'bg-indigo-600' : 'bg-indigo-100'}`} />
              ))}
            </div>
            <span className="shrink-0 text-sm font-bold text-indigo-800">Etapa {stage} de {LAST_STAGE - FIRST_STAGE + 1}</span>
          </div>
          <p className="mt-4 leading-relaxed">{level.brief}</p>
          {level.mission && (
            <div className="mt-4 rounded-2xl bg-sky-50 px-4 py-3">
              <p className="font-bold text-indigo-800">Sua missão</p>
              <p className="mt-1 leading-relaxed">{level.mission}</p>
            </div>
          )}
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="min-w-0 space-y-5">
            <section aria-labelledby="project-plan" className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
              <h2 id="project-plan" className="flex items-center gap-2 font-heading text-xl text-indigo-950">
                <Lightbulb aria-hidden="true" size={21} className="text-amber-600" /> {level.concept}
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed marker:font-bold marker:text-indigo-600">
                {level.guide.map((instruction, index) => <li key={index}>{instruction}</li>)}
              </ol>
            </section>

            <form onSubmit={testProgram} className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <h2 className="flex items-center gap-2 font-heading text-xl text-indigo-950">
                  <Code2 aria-hidden="true" size={21} /> Complete o código
                </h2>
                <p className="text-sm font-bold text-indigo-700">{filledCount} de {level.gaps.length} lacunas</p>
              </div>

              <div className="select-text overflow-x-auto rounded-2xl bg-slate-950 py-3 font-mono text-base text-sky-50">
                {level.code.split('\n').map((line, index) => {
                  const lineNumber = index + 1;
                  return (
                    <div key={index} className={`flex min-h-10 w-max min-w-full items-center whitespace-pre pr-3 ${result?.error?.line === lineNumber ? 'bg-rose-950/80' : shownLine === lineNumber ? 'bg-indigo-900' : ''}`}>
                      <span aria-hidden="true" className="w-10 shrink-0 select-none pr-3 text-right text-sm text-slate-300">{lineNumber}</span>
                      {line.split(/(\{\{[^}]+\}\})/).map((part, partIndex) => {
                        const gap = part.startsWith('{{') ? gaps.get(part.slice(2, -2)) : undefined;
                        if (!gap) return <span key={partIndex}>{part}</span>;
                        const invalid = errorGapId === gap.id;
                        return (
                          <input
                            key={partIndex}
                            ref={node => { inputs.current[gap.id] = node; }}
                            aria-label={`Linha ${lineNumber}. ${gap.label}`}
                            aria-invalid={invalid || undefined}
                            aria-describedby={invalid ? 'project-error' : undefined}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            maxLength={MAX_ANSWER_LENGTH}
                            placeholder="___"
                            value={answers[gap.id] ?? ''}
                            onChange={event => updateAnswer(gap.id, event.target.value)}
                            className={`mx-0.5 h-9 select-text rounded-md border-2 px-2 font-mono text-base font-bold outline-none placeholder:text-indigo-600 focus-visible:ring-2 focus-visible:ring-sky-300 ${invalid ? 'border-rose-600 bg-rose-100 text-rose-950' : 'border-indigo-300 bg-indigo-50 text-indigo-950'}`}
                            style={{ width: `${Math.max(8, Math.min((answers[gap.id]?.length ?? 0) + 3, 26))}ch` }}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <button type="submit" className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-5 py-3 font-bold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 sm:w-auto">
                <Play aria-hidden="true" size={19} /> Testar programa
              </button>

              <div ref={summaryRef} tabIndex={-1} aria-live="polite" className="mt-3 rounded-xl focus:outline-none">
                {result?.error ? (
                  <p id="project-error" className="rounded-xl bg-rose-50 p-3 font-semibold text-rose-900">
                    {result.error.line > 0 && <strong>Linha {result.error.line}. </strong>}{result.error.message}
                  </p>
                ) : result?.passed ? (
                  <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 font-bold text-emerald-900">
                    <CheckCircle2 aria-hidden="true" size={20} /> O programa passou em todos os testes!
                  </p>
                ) : result ? (
                  <p className="rounded-xl bg-amber-50 p-3 font-semibold text-amber-950">
                    {failedTest ? `${failedTest.label}. ${failedTest.message}` : 'Revise seu programa e teste de novo.'}
                  </p>
                ) : null}
              </div>
              {!!result?.tests.length && (
                <a href="#project-tests" className="mt-2 inline-block font-bold text-indigo-800 underline lg:hidden">Ver os testes</a>
              )}
            </form>

            {attempts >= 2 && !result?.passed && (
              <section aria-labelledby="project-hint" className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-5">
                <h2 id="project-hint" className="flex items-center gap-2 font-heading text-lg text-indigo-950">
                  <Sparkles aria-hidden="true" size={19} className="text-amber-700" /> Dica do Sparky
                </h2>
                <p className="mt-2 leading-relaxed">{hint}</p>
                {canHear && (
                  <button type="button" className={`${secondaryButton} mt-3`} onClick={() => audioService.speak(hint, 'instruction')}>
                    <Volume2 aria-hidden="true" size={17} /> Ouvir dica
                  </button>
                )}
              </section>
            )}
          </div>

          <section aria-labelledby="project-tests" className="min-w-0 rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 id="project-tests" className="flex items-center gap-2 font-heading text-xl text-indigo-950">
              <FlaskConical aria-hidden="true" size={21} /> Testes da missão
            </h2>
            <div className="mb-5 mt-3 grid gap-2">
              {scenarios.map((item, index) => {
                const test = result?.tests[index];
                return (
                  <button
                    type="button"
                    key={index}
                    aria-pressed={index === caseIndex}
                    className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700 ${index === caseIndex ? 'border-indigo-300 bg-indigo-50 text-indigo-950' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    onClick={() => { setCaseIndex(index); setPlayhead(null); }}
                  >
                    <span>{item.label}</span>
                    {test && (
                      <span className={`shrink-0 ${test.passed ? 'text-emerald-800' : 'text-amber-900'}`}>
                        {test.passed ? 'Passou' : 'Revise'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="sr-only">
              Tabuleiro de {level.gridSize} por {level.gridSize}. O Sparky começa na {describeCell(level.startPos)} e a bandeira fica na {describeCell(level.goalPos)}.
              {scenario.obstacles.length > 0 && ` Obstáculos nas casas ${scenario.obstacles.map(describeCell).join(' e ')}.`}
              {!!level.paintTargets?.length && ` Sinalize nas casas ${level.paintTargets.map(describeCell).join(' e ')}.`}
            </p>
            <ProjectBoard level={level} obstacles={scenario.obstacles} test={selectedTest} playhead={playhead} />
            {!!level.paintTargets?.length && (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-700">
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-4 w-4 rounded border-2 border-dashed border-amber-500" />
                  Casa para sinalizar
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-4 w-4 rounded border border-amber-700 bg-amber-200" />
                  Casa sinalizada
                </li>
              </ul>
            )}
            {selectedTest && (
              <div className="mt-4">
                <p className={`leading-relaxed ${selectedTest.passed ? 'text-emerald-900' : 'text-amber-950'}`}>{selectedTest.message}</p>
                {selectedTest.steps.length > 0 && (
                  <button type="button" className={`${secondaryButton} mt-3`} onClick={() => setPlayhead(playhead === null ? 0 : null)}>
                    {playhead === null ? <Play aria-hidden="true" size={16} /> : <Pause aria-hidden="true" size={16} />}
                    {playhead === null ? 'Rever percurso' : 'Parar percurso'}
                  </button>
                )}
                {!!shownLine && <p className="mt-2 text-sm font-semibold text-indigo-800">Executando a linha {shownLine}</p>}
              </div>
            )}
          </section>
        </div>

        {result?.passed && (
          <section aria-labelledby="project-complete" className="mt-6 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-5 sm:p-7">
            <h2 id="project-complete" className="flex items-center gap-2 font-heading text-xl text-emerald-950 sm:text-2xl">
              <CheckCircle2 aria-hidden="true" size={24} /> {isFinalStage ? 'Seu farol está aceso!' : 'Etapa concluída'}
            </h2>
            <p className="mt-3 leading-relaxed text-emerald-950">{level.explanation}</p>
            {isFinalStage && (
              <>
                <details className="mt-4 rounded-2xl border border-emerald-200 bg-white p-3">
                  <summary className="cursor-pointer rounded-lg font-bold text-indigo-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700">Ver código final</summary>
                  <pre className="mt-3 select-text overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-sm text-sky-50"><code>{result.code}</code></pre>
                </details>
                <p className="mt-3 text-sm leading-relaxed text-emerald-950">
                  O arquivo inclui as funções e os testes do tabuleiro. Para rodar no Python 3, use <code className="select-text font-semibold">python farol-do-sparky.py</code>.
                </p>
              </>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              {isFinalStage && (
                <button type="button" className={secondaryButton} onClick={downloadProject}>
                  <Download aria-hidden="true" size={18} /> Baixar projeto .py
                </button>
              )}
              <button type="button" onClick={onComplete} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-5 py-3 font-bold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
                {isFinalStage ? 'Concluir projeto' : 'Próxima etapa'} <ChevronRight aria-hidden="true" size={19} />
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export const FinalProjectScreen: React.FC<FinalProjectScreenProps> = props => (
  <FinalProjectMission key={`${props.profileId ?? ''}:${props.level.id}`} {...props} />
);
