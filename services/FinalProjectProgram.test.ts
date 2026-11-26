import assert from 'node:assert/strict';
import test from 'node:test';
import { FINAL_PROJECT_LEVELS } from '../api/_lib/levels/finalProjectLevels';
import { buildPythonProject, runFinalProject } from './FinalProjectProgram';

const answersFor = (level: (typeof FINAL_PROJECT_LEVELS)[number]) =>
  Object.fromEntries(level.gaps.map(({ id, answer }) => [id, answer]));

test('as seis missões têm lacunas declaradas e passam em todos os cenários', () => {
  assert.deepEqual(FINAL_PROJECT_LEVELS.map(level => level.id), [77, 78, 79, 80, 81, 82]);

  for (const level of FINAL_PROJECT_LEVELS) {
    const tokens = Array.from(level.code.matchAll(/\{\{([\w-]+)\}\}/g), match => match[1]);
    assert.deepEqual([...tokens].sort(), level.gaps.map(gap => gap.id).sort(), level.title);
    const result = runFinalProject(level, answersFor(level));
    assert.equal(result.error, undefined, level.title);
    assert.equal(result.passed, true, JSON.stringify(result.tests.map(test => test.message)));
    assert.equal(result.tests.length, (level.testScenarios?.length ?? 0) + 1);
    assert.ok(result.tests.every(test => test.finalPosition.x === level.goalPos.x && test.finalPosition.y === level.goalPos.y));
  }
});

test('uma lacuna vazia ou um comando inválido aponta a linha e o campo editável', () => {
  const level = FINAL_PROJECT_LEVELS[0];
  const empty = runFinalProject(level, {});
  assert.equal(empty.error?.gapId, 'primeiro');
  assert.equal(empty.error?.line, 2);
  assert.deepEqual(empty.tests, []);

  const invalid = runFinalProject(level, { ...answersFor(level), ultimo: 'noroeste' });
  assert.equal(invalid.error?.gapId, 'ultimo');
  assert.equal(invalid.error?.line, 4);
  assert.equal(invalid.passed, false);

  const loopLevel = FINAL_PROJECT_LEVELS[3];
  const wrongKeyword = runFinalProject(loopLevel, { ...answersFor(loopLevel), negacao: 'no' });
  assert.equal(wrongKeyword.error?.line, 2);
  assert.equal(wrongKeyword.error?.gapId, 'negacao');
});

test('o mesmo código pode passar em um cenário e falhar em outro', () => {
  const level = {
    ...FINAL_PROJECT_LEVELS[0],
    testScenarios: [{ label: 'Corredor fechado', obstacles: [{ x: 1, y: 1 }] }],
  };
  const result = runFinalProject(level, answersFor(level));
  assert.equal(result.error, undefined);
  assert.equal(result.passed, false);
  assert.equal(result.tests[0].passed, true);
  assert.match(result.tests[1].message, /Linha 2.*parede ou a borda/);
  assert.deepEqual(result.tests[1].steps, []);
});

test('laços sem progresso terminam com uma explicação', () => {
  const level = { ...FINAL_PROJECT_LEVELS[0], gaps: [], code: 'while not chegou():\n    pintar()' };
  const result = runFinalProject(level, {});
  assert.equal(result.passed, false);
  assert.match(result.tests[0].message, /Linha 1.*ficou na mesma casa/);
});

test('o projeto final exige a marca ao fim da reta e exporta o código completado', () => {
  const level = FINAL_PROJECT_LEVELS.at(-1)!;
  const result = runFinalProject(level, { ...answersFor(level), passos: '1' });
  assert.equal(result.passed, false);
  assert.ok(result.tests.every(test => /falta pintar/.test(test.message)));

  const correct = runFinalProject(level, answersFor(level));
  assert.equal(correct.tests.length, 3);
  const source = buildPythonProject(level, correct.code);
  assert.match(source, /def executar_programa\(\):/);
  assert.match(source, /for passo in range\(2\):/);
  assert.match(source, /resultados = \[testar\(cenario\)/);
  assert.doesNotMatch(source, /\{\{/);
});
