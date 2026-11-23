import { BlockType, GridPosition, LevelConfig } from '../types';

const movements = {
  [BlockType.MOVE_UP]: { x: 0, y: -1, direction: 'up' },
  [BlockType.MOVE_DOWN]: { x: 0, y: 1, direction: 'down' },
  [BlockType.MOVE_LEFT]: { x: -1, y: 0, direction: 'left' },
  [BlockType.MOVE_RIGHT]: { x: 1, y: 0, direction: 'right' },
} as const;

type Movement = (typeof movements)[keyof typeof movements];
type MoveCommand = { kind: 'move'; index: number; movement: Movement };
type Command = MoveCommand
  | { kind: 'paint'; index: number }
  | { kind: 'check'; index: number; whenClear: MoveCommand; otherwise?: MoveCommand }
  | { kind: 'repeat'; index: number; count: 2 | 3; body: Command }
  | { kind: 'untilGoal'; index: number; body: Command };

type Step = { index: number } & (
  | { kind: 'move'; position: GridPosition; direction: Movement['direction'] }
  | { kind: 'paint'; position: GridPosition }
  | { kind: 'check' | 'blocked' }
);

const MAX_COMMANDS = 200;
const sameCell = (a: GridPosition, b: GridPosition) => a.x === b.x && a.y === b.y;
const cellKey = ({ x, y }: GridPosition) => `${x},${y}`;

function readProgram(program: BlockType[]): Command[] {
  let index = 0;

  const readMove = (message: string): MoveCommand => {
    const movement = movements[program[index] as keyof typeof movements];
    if (!movement) throw new Error(message);
    return { kind: 'move', index: index++, movement };
  };

  const readCommand = (): Command => {
    const type = program[index];
    if (type in movements) return readMove('Escolha uma direção para andar.');

    const commandIndex = index++;
    switch (type) {
      case BlockType.PAINT:
        return { kind: 'paint', index: commandIndex };
      case BlockType.IF_PATH: {
        const whenClear = readMove('Coloque um bloco de movimento logo depois de Se Caminho.');
        let otherwise: MoveCommand | undefined;
        if (program[index] === BlockType.ELSE) {
          index++;
          otherwise = readMove('Coloque um bloco de movimento logo depois de Senão.');
        }
        return { kind: 'check', index: commandIndex, whenClear, otherwise };
      }
      case BlockType.REPEAT_2:
      case BlockType.REPEAT_3:
      case BlockType.REPEAT_UNTIL: {
        if (index === program.length) throw new Error('Coloque o comando a repetir logo depois do bloco de repetição.');
        const body = readCommand();
        return type === BlockType.REPEAT_UNTIL
          ? { kind: 'untilGoal', index: commandIndex, body }
          : { kind: 'repeat', index: commandIndex, count: type === BlockType.REPEAT_2 ? 2 : 3, body };
      }
      case BlockType.ELSE:
        throw new Error('Use Senão logo depois do movimento de Se Caminho.');
      default:
        throw new Error('Use os blocos que aparecem na paleta desta missão.');
    }
  };

  const commands: Command[] = [];
  while (index < program.length) commands.push(readCommand());
  return commands;
}

export function simulateProProgram(
  level: LevelConfig,
  program: BlockType[],
  obstacles: GridPosition[],
): { steps: Step[]; failure?: string } {
  const steps: Step[] = [];
  const walls = new Set(obstacles.map(cellKey));
  const painted = new Set<string>();
  const checkpoints = level.workshop?.checkpoints ?? [];
  const maxMoves = level.workshop?.maxMoves;
  let position = level.startPos;
  let executedCommands = 0;
  let moves = 0;
  let nextCheckpoint = 0;

  const atGoal = () => !level.goalPos || sameCell(position, level.goalPos);
  const destination = (movement: Movement) => ({ x: position.x + movement.x, y: position.y + movement.y });
  const outsideBoard = ({ x, y }: GridPosition) => x < 0 || y < 0 || x >= level.gridSize || y >= level.gridSize;
  const isBlocked = (cell: GridPosition) => outsideBoard(cell) || walls.has(cellKey(cell));

  const checkPosition = () => {
    const checkpoint = checkpoints.findIndex(cell => sameCell(position, cell));
    if (checkpoint > nextCheckpoint) {
      throw new Error(`Sparky passou pelo ponto ${checkpoint + 1} antes do ponto ${nextCheckpoint + 1}. Confira a ordem no mapa.`);
    }
    if (checkpoint === nextCheckpoint) nextCheckpoint++;
  };

  const execute = (command: Command): void => {
    executedCommands++;
    if (executedCommands > MAX_COMMANDS) throw new Error('O programa deu passos demais. Procure o trecho que se repete sem chegar à bandeira.');

    switch (command.kind) {
      case 'move': {
        const next = destination(command.movement);
        if (isBlocked(next)) {
          steps.push({ kind: 'blocked', index: command.index });
          throw new Error(outsideBoard(next) ? 'Um movimento tentou sair do tabuleiro.' : 'Um movimento encontrou um obstáculo.');
        }
        position = next;
        steps.push({ kind: 'move', index: command.index, position, direction: command.movement.direction });
        moves++;
        if (maxMoves !== undefined && moves > maxMoves) {
          throw new Error(`Sparky passou do limite de ${maxMoves} passos. Compare os caminhos e procure um percurso mais curto.`);
        }
        checkPosition();
        break;
      }
      case 'paint':
        painted.add(cellKey(position));
        steps.push({ kind: 'paint', index: command.index, position });
        break;
      case 'check': {
        steps.push({ kind: 'check', index: command.index });
        const choice = isBlocked(destination(command.whenClear.movement)) ? command.otherwise : command.whenClear;
        if (choice) execute(choice);
        break;
      }
      case 'repeat':
        for (let count = 0; count < command.count; count++) execute(command.body);
        break;
      case 'untilGoal':
        while (!atGoal()) {
          const previous = position;
          execute(command.body);
          if (sameCell(position, previous)) throw new Error('Até Chegar parou porque o comando escolhido não moveu o Sparky.');
        }
        break;
    }
  };

  try {
    if (program.length === 0) return { steps, failure: 'Adicione pelo menos um comando para começar.' };
    if (program.length > level.maxBlocks || program.some(block => !level.availableBlocks.includes(block))) {
      return { steps, failure: 'Confira o limite de blocos e os comandos disponíveis nesta missão.' };
    }

    const commands = readProgram(program);
    checkPosition();
    commands.forEach(execute);
    if (!atGoal()) return { steps, failure: 'O programa terminou antes de o Sparky parar na bandeira.' };
    if (nextCheckpoint < checkpoints.length) {
      return { steps, failure: `Sparky chegou à bandeira. Ainda falta passar pelo ponto ${nextCheckpoint + 1}.` };
    }
    if (level.paintTargets?.some(cell => !painted.has(cellKey(cell)))) {
      return { steps, failure: 'O Sparky chegou à bandeira. Ainda há casas marcadas que precisam de Pintar Chão.' };
    }
    return { steps };
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    return { steps, failure: error.message };
  }
}
