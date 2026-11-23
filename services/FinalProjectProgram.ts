import type { FinalProjectLevel } from '../finalProjectTypes';
import type { GridPosition } from '../types';

const directions = {
  cima: { x: 0, y: -1, facing: 'up' },
  baixo: { x: 0, y: 1, facing: 'down' },
  esquerda: { x: -1, y: 0, facing: 'left' },
  direita: { x: 1, y: 0, facing: 'right' },
} as const;

type Direction = keyof typeof directions;
type Facing = (typeof directions)[Direction]['facing'];
type Step = { position: GridPosition; direction: Facing; painted?: GridPosition; line: number };
type SourceLine = { line: number; indent: number; text: string };
type Command = { line: number } & (
  | { kind: 'move'; direction: Direction }
  | { kind: 'paint' }
  | { kind: 'call'; name: string }
  | { kind: 'define'; name: string; body: Command[] }
  | { kind: 'repeat'; count: number; body: Command[] }
  | { kind: 'untilGoal'; body: Command[] }
  | { kind: 'choose'; direction: Direction; body: Command[]; otherwise: Command[] }
);

export interface ProjectTestResult {
  label: string;
  passed: boolean;
  message: string;
  obstacles: GridPosition[];
  steps: Step[];
  finalPosition: GridPosition;
  paintedCells: GridPosition[];
}

export interface ProjectRunResult {
  code: string;
  passed: boolean;
  tests: ProjectTestResult[];
  error?: { line: number; message: string; gapId?: string };
}

class ProjectError extends Error {
  constructor(public line: number, message: string) {
    super(message);
  }
}

const MAX_OPERATIONS = 160;
const MAX_REPETITIONS = 20;
const reservedNames = new Set(
  'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield mover pintar caminho_livre chegou range'.split(' '),
);
const gapPattern = /\{\{([a-zA-Z\d_-]+)\}\}/g;
const movePattern = /^mover\s*\(\s*(["'])(cima|baixo|esquerda|direita)\1\s*\)$/;
const conditionPattern = /^if\s+caminho_livre\s*\(\s*(["'])(cima|baixo|esquerda|direita)\1\s*\)\s*:\s*$/;
const sameCell = (first: GridPosition, second: GridPosition) => first.x === second.x && first.y === second.y;
const cellKey = ({ x, y }: GridPosition) => `${x},${y}`;

function parseProject(code: string) {
  const lines: SourceLine[] = code.split('\n').flatMap((row, index) => {
    const text = row.trim();
    return text && !text.startsWith('#') ? [{ line: index + 1, indent: row.length - row.trimStart().length, text }] : [];
  });
  const definedNames = new Set<string>();
  const loopVariables = new Map<string, number>();
  let cursor = 0;

  const readBody = (parent: SourceLine) => {
    if (lines[cursor]?.indent !== parent.indent + 4) {
      throw new ProjectError(parent.line, 'Coloque os comandos desse trecho quatro espaços mais à direita.');
    }
    return readBlock(parent.indent + 4);
  };

  function readBlock(indent: number): Command[] {
    const commands: Command[] = [];
    while (cursor < lines.length && lines[cursor].indent >= indent) {
      const source = lines[cursor++];
      const { line, text } = source;
      if (source.indent !== indent) throw new ProjectError(line, 'Confira o alinhamento dessa linha com os outros comandos do trecho.');

      const move = text.match(movePattern);
      const condition = text.match(conditionPattern);
      const repeat = text.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+range\s*\(\s*(0|[1-9]\d*)\s*\)\s*:\s*$/);
      const definition = text.match(/^def\s+([a-zA-Z_]\w*)\s*\(\s*\)\s*:\s*$/);
      const call = text.match(/^([a-zA-Z_]\w*)\s*\(\s*\)$/);

      if (move) commands.push({ kind: 'move', line, direction: move[2] as Direction });
      else if (call?.[1] === 'pintar') commands.push({ kind: 'paint', line });
      else if (condition) {
        const body = readBody(source);
        const next = lines[cursor];
        let otherwise: Command[] = [];
        if (next?.indent === indent && /^else\s*:$/.test(next.text)) {
          cursor++;
          otherwise = readBody(next);
        }
        commands.push({ kind: 'choose', line, direction: condition[2] as Direction, body, otherwise });
      } else if (repeat) {
        const [, name, amount] = repeat;
        const count = Number(amount);
        if (reservedNames.has(name)) throw new ProjectError(line, 'Use outro nome para contar as repetições, como passo.');
        if (count > MAX_REPETITIONS) throw new ProjectError(line, `Escolha de 0 a ${MAX_REPETITIONS} repetições.`);
        loopVariables.set(name, line);
        commands.push({ kind: 'repeat', line, count, body: readBody(source) });
      } else if (/^while\s+not\s+chegou\s*\(\s*\)\s*:$/.test(text)) {
        commands.push({ kind: 'untilGoal', line, body: readBody(source) });
      } else if (definition) {
        const name = definition[1];
        if (indent !== 0) throw new ProjectError(line, 'Escreva a definição da função no início da linha, fora de outro trecho.');
        if (reservedNames.has(name) || definedNames.has(name)) throw new ProjectError(line, 'Escolha um nome novo para a função.');
        definedNames.add(name);
        commands.push({ kind: 'define', line, name, body: readBody(source) });
      } else if (call && !reservedNames.has(call[1])) {
        commands.push({ kind: 'call', line, name: call[1] });
      } else if (/^(if|else|while|for|def)\b/.test(text) && !text.endsWith(':')) {
        throw new ProjectError(line, 'Confira os dois-pontos no fim da linha que inicia esse trecho.');
      } else if (/^else\s*:$/.test(text)) {
        throw new ProjectError(line, 'Coloque else no mesmo alinhamento do if a que ele responde.');
      } else {
        throw new ProjectError(line, 'Revise a escrita do comando. Compare as aspas, os parênteses e o nome com o exemplo da missão.');
      }
    }
    return commands;
  }

  const commands = readBlock(0);
  for (const [name, line] of loopVariables) {
    if (definedNames.has(name)) throw new ProjectError(line, 'Dê nomes diferentes à função e à contagem das repetições.');
  }
  return commands;
}

const scenariosFor = (level: FinalProjectLevel) => [
  { label: 'Cenário inicial', obstacles: level.obstacles },
  ...(level.testScenarios ?? []),
];

function testScenario(level: FinalProjectLevel, scenario: ReturnType<typeof scenariosFor>[number], program: ReturnType<typeof parseProject>): ProjectTestResult {
  const steps: Step[] = [];
  const walls = new Set(scenario.obstacles.map(cellKey));
  const painted = new Map<string, GridPosition>();
  const functions = new Map<string, Command[]>();
  const activeFunctions = new Set<string>();
  let position = level.startPos;
  let facing: Facing = 'right';
  let operations = 0;

  const atGoal = () => sameCell(position, level.goalPos);
  const destination = ({ x, y }: GridPosition, direction: Direction) => ({ x: x + directions[direction].x, y: y + directions[direction].y });
  const isClear = ({ x, y }: GridPosition) => x >= 0 && y >= 0 && x < level.gridSize && y < level.gridSize && !walls.has(cellKey({ x, y }));

  const execute = (commands: Command[]) => {
    for (const command of commands) {
      const { line } = command;
      operations++;
      if (operations > MAX_OPERATIONS) throw new ProjectError(line, 'O programa continuou por tempo demais. Confira como o laço deve terminar.');

      switch (command.kind) {
        case 'move': {
          const next = destination(position, command.direction);
          if (!isClear(next)) throw new ProjectError(line, `O passo para ${command.direction} encontrou uma parede ou a borda do mapa.`);
          position = next;
          facing = directions[command.direction].facing;
          steps.push({ position, direction: facing, line });
          break;
        }
        case 'paint':
          painted.set(cellKey(position), position);
          steps.push({ position, direction: facing, painted: position, line });
          break;
        case 'choose':
          execute(isClear(destination(position, command.direction)) ? command.body : command.otherwise);
          break;
        case 'repeat':
          for (let count = 0; count < command.count; count++) execute(command.body);
          break;
        case 'untilGoal':
          while (!atGoal()) {
            const previous = position;
            execute(command.body);
            if (sameCell(position, previous)) throw new ProjectError(line, 'Sparky ficou na mesma casa. Confira se o laço tem um movimento para quando o caminho está fechado.');
          }
          break;
        case 'define':
          functions.set(command.name, command.body);
          break;
        case 'call': {
          const body = functions.get(command.name);
          if (!body) throw new ProjectError(line, `Confira se ${command.name} tem o mesmo nome da função definida com def.`);
          if (activeFunctions.has(command.name)) throw new ProjectError(line, 'Uma função voltou a chamar a si mesma. Confira os nomes das chamadas.');
          activeFunctions.add(command.name);
          execute(body);
          activeFunctions.delete(command.name);
          break;
        }
      }
    }
  };

  const result = (passed: boolean, message: string): ProjectTestResult => ({
    ...scenario, passed, message, steps, finalPosition: position, paintedCells: [...painted.values()],
  });

  try {
    execute(program);
    if (!atGoal()) return result(false, 'O programa terminou longe da bandeira. Compare a casa final com a meta.');
    if (level.paintTargets?.some(cell => !painted.has(cellKey(cell)))) {
      return result(false, 'Sparky chegou à bandeira. Ainda falta pintar uma ou mais marcas do mapa.');
    }
    return result(true, 'Sparky chegou à bandeira e cumpriu os objetivos do cenário!');
  } catch (error) {
    if (!(error instanceof ProjectError)) throw error;
    return result(false, `Linha ${error.line}. ${error.message}`);
  }
}

export function runFinalProject(level: FinalProjectLevel, answers: Record<string, string>): ProjectRunResult {
  const template = level.code.split('\n');
  for (const gap of level.gaps) {
    const answer = answers[gap.id] ?? '';
    const line = template.findIndex(row => row.includes(`{{${gap.id}}}`)) + 1;
    if (!answer.trim() || answer.length > 80 || /[^\x20-\x7e]/.test(answer)) {
      return { code: level.code, passed: false, tests: [], error: { line, gapId: gap.id, message: 'Complete a lacuna com um trecho de código em uma única linha.' } };
    }
  }

  const code = level.code.replace(gapPattern, (_, id: string) => answers[id]?.trim() ?? '');
  try {
    const program = parseProject(code);
    const tests = scenariosFor(level).map(scenario => testScenario(level, scenario, program));
    return { code, tests, passed: tests.every(test => test.passed) };
  } catch (error) {
    if (!(error instanceof ProjectError)) throw error;
    const idsOnLine = Array.from(template[error.line - 1]?.matchAll(gapPattern) ?? [], match => match[1]);
    const gapId = idsOnLine.find(id => answers[id]?.trim() !== level.gaps.find(gap => gap.id === id)?.answer) ?? idsOnLine[0];
    return { code, passed: false, tests: [], error: { line: error.line, message: error.message, gapId } };
  }
}

export function buildPythonProject(level: FinalProjectLevel, code: string): string {
  const config = {
    tamanho: level.gridSize,
    inicio: [level.startPos.x, level.startPos.y],
    bandeira: [level.goalPos.x, level.goalPos.y],
    marcas: level.paintTargets?.map(({ x, y }) => [x, y]) ?? [],
    cenarios: scenariosFor(level).map(({ label, obstacles }) => ({
      nome: label,
      paredes: obstacles.map(({ x, y }) => [x, y]),
    })),
    direcoes: Object.fromEntries(Object.entries(directions).map(([name, { x, y }]) => [name, [x, y]])),
  };
  const studentCode = code.split('\n').map(line => line ? `    ${line}` : '').join('\n');

  return `# Projeto final do Sparky — Farol do Sparky
# Execute com Python 3. O arquivo inclui a lógica do tabuleiro e os cenários de teste.

import json

config = json.loads(${JSON.stringify(JSON.stringify(config))})
tamanho = config["tamanho"]
bandeira = tuple(config["bandeira"])
marcas = {tuple(casa) for casa in config["marcas"]}


def conferir_limite():
    global operacoes
    operacoes += 1
    if operacoes > 600:
        raise ValueError("O programa continuou por tempo demais. Confira como o laço termina.")


def proxima_casa(direcao):
    dx, dy = config["direcoes"][direcao]
    return posicao[0] + dx, posicao[1] + dy


def casa_livre(casa):
    x, y = casa
    return 0 <= x < tamanho and 0 <= y < tamanho and casa not in paredes


def caminho_livre(direcao):
    conferir_limite()
    return casa_livre(proxima_casa(direcao))


def mover(direcao):
    global posicao
    conferir_limite()
    destino = proxima_casa(direcao)
    if not casa_livre(destino):
        raise ValueError(f"O passo para {direcao} encontrou uma parede ou a borda do mapa.")
    posicao = destino


def pintar():
    conferir_limite()
    pinturas.add(posicao)


def chegou():
    conferir_limite()
    return posicao == bandeira


# O programa que você montou nas lacunas começa aqui.
def executar_programa():
${studentCode}


def mostrar_tabuleiro():
    # S = Sparky, B = bandeira, # = parede, * = marca pintada.
    simbolos = {casa: "#" for casa in paredes}
    simbolos.update({casa: "*" for casa in pinturas})
    simbolos[bandeira] = "B"
    simbolos[posicao] = "S"
    for y in range(tamanho):
        print(" ".join(simbolos.get((x, y), ".") for x in range(tamanho)))


def testar(cenario):
    global posicao, paredes, pinturas, operacoes
    posicao = tuple(config["inicio"])
    paredes = {tuple(casa) for casa in cenario["paredes"]}
    pinturas = set()
    operacoes = 0
    try:
        executar_programa()
        if posicao != bandeira:
            raise ValueError("Sparky terminou longe da bandeira.")
        if not marcas.issubset(pinturas):
            raise ValueError("Ainda falta pintar uma marca.")
    except ValueError as erro:
        print(f"Revise · {cenario['nome']} · {erro}")
        mostrar_tabuleiro()
        return False

    print(f"Passou · {cenario['nome']}")
    mostrar_tabuleiro()
    return True


if __name__ == "__main__":
    resultados = [testar(cenario) for cenario in config["cenarios"]]
    print(f"\\n{sum(resultados)} de {len(resultados)} cenários aprovados.")
    raise SystemExit(0 if all(resultados) else 1)
`;
}
