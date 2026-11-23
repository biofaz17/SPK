import assert from 'node:assert/strict';
import test from 'node:test';
import { ALGORITHM_WORKSHOP_LEVELS } from '../algorithmWorkshopLevels';
import { BlockType, LevelConfig, SubscriptionTier } from '../types';
import { simulateProProgram } from './ProLevelProgram';

const { MOVE_UP, MOVE_DOWN, MOVE_RIGHT, REPEAT_3, PAINT } = BlockType;

const board: LevelConfig = {
  id: 'workshop-test',
  title: 'Tabuleiro de teste',
  startPos: { x: 0, y: 1 },
  goalPos: { x: 2, y: 1 },
  gridSize: 4,
  obstacles: [],
  maxBlocks: 6,
  availableBlocks: [MOVE_UP, MOVE_DOWN, MOVE_RIGHT, REPEAT_3, PAINT],
  ageGroup: '11-14',
  requiredSubscription: SubscriptionTier.PRO,
};

test('a marcação da Oficina exige passar pelos pontos na ordem indicada', () => {
  const level = { ...board, workshop: { checkpoints: [{ x: 1, y: 0 }, { x: 1, y: 1 }] } };

  const planned = simulateProProgram(level, [MOVE_UP, MOVE_RIGHT, MOVE_DOWN, MOVE_RIGHT], []);
  assert.equal(planned.failure, undefined);

  const reversed = simulateProProgram(level, [MOVE_RIGHT, MOVE_UP, MOVE_DOWN, MOVE_RIGHT], []);
  assert.match(reversed.failure ?? '', /ponto 2 antes do ponto 1/);
  assert.equal(reversed.steps.length, 1);
});

test('chegar à bandeira mantém o objetivo de passar por um ponto', () => {
  const level = { ...board, workshop: { checkpoints: [{ x: 1, y: 0 }] } };
  const directRoute = [MOVE_RIGHT, MOVE_RIGHT];

  assert.match(simulateProProgram(level, directRoute, []).failure ?? '', /falta passar pelo ponto 1/);
  assert.equal(simulateProProgram(board, directRoute, []).failure, undefined);
});

test('o limite de passos conta os movimentos do laço e deixa a pintura fora da contagem', () => {
  const goalPos = { x: 3, y: 1 };
  const level = { ...board, goalPos, paintTargets: [goalPos], workshop: { maxMoves: 3 } };
  const program = [REPEAT_3, MOVE_RIGHT, PAINT];

  const withinLimit = simulateProProgram(level, program, []);
  assert.equal(withinLimit.failure, undefined);
  assert.equal(withinLimit.steps.filter(step => step.kind === 'move').length, 3);
  assert.equal(withinLimit.steps.at(-1)?.kind, 'paint');

  const overLimit = simulateProProgram({ ...level, workshop: { maxMoves: 2 } }, program, []);
  assert.match(overLimit.failure ?? '', /limite de 2 passos/);
  assert.equal(overLimit.steps.at(-1)?.kind, 'move');
});

test('cada missão da Oficina tem uma solução que cumpre todos os seus objetivos', () => {
  const blocks: Record<string, BlockType> = {
    U: MOVE_UP, D: MOVE_DOWN, L: BlockType.MOVE_LEFT, R: MOVE_RIGHT,
    P: PAINT, 2: BlockType.REPEAT_2, 3: REPEAT_3,
  };
  const solutions = [
    'RDRR', 'URRU', 'RRUPRD', 'URRRRD', '3RUR',
    'UURRDDR', 'RRPRR', 'UU3RR', 'LLDDL', 'UURRLDDLL',
    'DDRRUPDR', '2R2D', '23RU', 'RRPLLUUPU', '2UR3RP2DL2R',
  ];

  assert.deepEqual(ALGORITHM_WORKSHOP_LEVELS.map(level => level.id), solutions.map((_, index) => 47 + index));
  for (const [index, level] of ALGORITHM_WORKSHOP_LEVELS.entries()) {
    const program = Array.from(solutions[index], symbol => blocks[symbol]);
    assert.equal(simulateProProgram(level, program, level.obstacles).failure, undefined, level.title);

    const starterProgram = level.workshop?.starterProgram;
    if (starterProgram) assert.ok(simulateProProgram(level, starterProgram, level.obstacles).failure, level.title);
  }
});

test('a ordem de pintura pode mudar o percurso mesmo com espaço para o programa', () => {
  const level = ALGORITHM_WORKSHOP_LEVELS.find(entry => entry.id === 60)!;
  const longerRoute = [MOVE_UP, MOVE_UP, PAINT, MOVE_DOWN, MOVE_DOWN, MOVE_RIGHT, MOVE_RIGHT,
    PAINT, BlockType.MOVE_LEFT, BlockType.MOVE_LEFT, MOVE_UP, MOVE_UP, MOVE_UP];

  const withoutStepLimit = { ...level, workshop: undefined };
  assert.equal(simulateProProgram(withoutStepLimit, longerRoute, level.obstacles).failure, undefined);
  assert.match(simulateProProgram(level, longerRoute, level.obstacles).failure ?? '', /limite de 8 passos/);
});
