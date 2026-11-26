import { BlockType, type LevelConfig, SubscriptionTier } from '../../../types';

// ========================================================================
// MUNDO 3: HACKER (31-45) - PRO
// ========================================================================
const WORLD_3: LevelConfig[] = [
  { id: 31, title: "Sensores Ativados", mission: "Se houver obstáculo, desvie.", gridSize: 5, startPos: { x: 0, y: 2 }, goalPos: { x: 4, y: 2 }, obstacles: [{x:2, y:2}], maxBlocks: 6, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.IF_OBSTACLE, BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.ELSE], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 32, title: "O Labirinto Lógico", mission: "Use 'Se Obstáculo' dentro de um loop.", gridSize: 5, startPos: { x: 0, y: 0 }, goalPos: { x: 4, y: 0 }, obstacles: [{x:2, y:0}], maxBlocks: 8, availableBlocks: [BlockType.REPEAT_3, BlockType.IF_OBSTACLE, BlockType.MOVE_DOWN, BlockType.MOVE_RIGHT, BlockType.MOVE_UP], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 33, title: "Até a Bandeira", mission: "Use 'Até Chegar' para andar infinitamente.", gridSize: 10, startPos: { x: 0, y: 5 }, goalPos: { x: 9, y: 5 }, obstacles: [], maxBlocks: 2, availableBlocks: [BlockType.REPEAT_UNTIL, BlockType.MOVE_RIGHT], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 34, title: "Desvio Automático", mission: "Crie um robô que desvia de tudo sozinho.", gridSize: 6, startPos: { x: 0, y: 0 }, goalPos: { x: 5, y: 0 }, obstacles: [{x:2, y:0}, {x:4, y:0}], maxBlocks: 6, availableBlocks: [BlockType.REPEAT_UNTIL, BlockType.IF_OBSTACLE, BlockType.MOVE_DOWN, BlockType.MOVE_RIGHT, BlockType.MOVE_UP], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 35, title: "Se Caminho Livre", mission: "Só ande se o caminho estiver livre.", gridSize: 5, startPos: { x: 0, y: 2 }, goalPos: { x: 4, y: 2 }, obstacles: [{x:2,y:1}, {x:2,y:3}], maxBlocks: 6, availableBlocks: [BlockType.IF_PATH, BlockType.MOVE_RIGHT, BlockType.MOVE_UP], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 36, title: "Lógica Binária", mission: "Direita ou Baixo?", gridSize: 5, startPos: { x: 0, y: 0 }, goalPos: { x: 4, y: 4 }, obstacles: [{x:1,y:0}, {x:2,y:1}, {x:3,y:2}], maxBlocks: 10, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.IF_OBSTACLE], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 37, title: "Loop Infinito de Pintura", mission: "Pinte tudo até chegar no fim.", gridSize: 8, startPos: { x: 0, y: 4 }, goalPos: { x: 7, y: 4 }, obstacles: [], maxBlocks: 3, availableBlocks: [BlockType.REPEAT_UNTIL, BlockType.PAINT, BlockType.MOVE_RIGHT], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 38, title: "O Grande Algoritmo", mission: "Contorne um grande bloco.", gridSize: 7, startPos: { x: 0, y: 3 }, goalPos: { x: 6, y: 3 }, obstacles: [{x:2,y:2}, {x:2,y:3}, {x:2,y:4}, {x:3,y:2}, {x:3,y:3}, {x:3,y:4}], maxBlocks: 15, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.IF_OBSTACLE], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 39, title: "Sensores Complexos", mission: "Use 'Senão Se' para múltiplas escolhas.", gridSize: 6, startPos: { x: 0, y: 0 }, goalPos: { x: 5, y: 5 }, obstacles: [], maxBlocks: 12, availableBlocks: [BlockType.IF_OBSTACLE, BlockType.ELSE_IF, BlockType.ELSE, BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 40, title: "Zig-Zag Inteligente", mission: "Desvie de obstáculos alternados.", gridSize: 7, startPos: { x: 0, y: 0 }, goalPos: { x: 6, y: 0 }, obstacles: [{x:1,y:0}, {x:3,y:0}, {x:5,y:0}], maxBlocks: 10, availableBlocks: [BlockType.REPEAT_UNTIL, BlockType.IF_OBSTACLE, BlockType.MOVE_DOWN, BlockType.MOVE_UP, BlockType.MOVE_RIGHT], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 41, title: "Pintura Condicional", mission: "Só pinte onde houver um obstáculo ao lado.", gridSize: 5, startPos: { x: 0, y: 2 }, goalPos: { x: 4, y: 2 }, obstacles: [{x:1,y:1}, {x:3,y:1}], maxBlocks: 10, availableBlocks: [BlockType.IF_OBSTACLE, BlockType.PAINT, BlockType.MOVE_RIGHT], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 42, title: "O Corredor Crítico", mission: "Atravesse o corredor de obstáculos móveis (simulados).", gridSize: 10, startPos: { x: 0, y: 5 }, goalPos: { x: 9, y: 5 }, obstacles: [{x:2,y:5}, {x:5,y:5}, {x:8,y:5}], maxBlocks: 10, availableBlocks: [BlockType.REPEAT_UNTIL, BlockType.IF_OBSTACLE, BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.MOVE_RIGHT], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 43, title: "Busca e Resgate", mission: "Vá até o objetivo em um mapa desconhecido.", gridSize: 8, startPos: { x: 0, y: 0 }, goalPos: { x: 7, y: 7 }, obstacles: [{x:3,y:3}, {x:4,y:4}], maxBlocks: 15, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.REPEAT_UNTIL], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 44, title: "Recursividade Simples", mission: "Repita um padrão dentro de outro padrão.", gridSize: 6, startPos: { x: 0, y: 0 }, goalPos: { x: 5, y: 5 }, obstacles: [], maxBlocks: 6, availableBlocks: [BlockType.REPEAT_3, BlockType.REPEAT_2, BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO },
  { id: 45, title: "Invasão Hacker", mission: "Limpe o sistema pintando as falhas.", gridSize: 10, startPos: { x: 0, y: 0 }, goalPos: { x: 9, y: 9 }, obstacles: [], maxBlocks: 20, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.PAINT, BlockType.REPEAT_UNTIL], ageGroup: '11-14', requiredSubscription: SubscriptionTier.PRO }
];

// Nível Final Especial
const MASTER_LEVEL: LevelConfig = {
  id: 46,
  title: "Mestre Codificador",
  mission: "Navegue pela escada traiçoeira usando lógica pura.",
  gridSize: 9,
  startPos: { x: 0, y: 0 },
  goalPos: { x: 8, y: 8 },
  obstacles: [{x:1,y:0}, {x:2,y:1}, {x:3,y:2}, {x:4,y:3}, {x:5,y:4}, {x:6,y:5}, {x:7,y:6}, {x:8,y:7}],
  maxBlocks: 8,
  availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.IF_OBSTACLE, BlockType.ELSE, BlockType.REPEAT_UNTIL],
  ageGroup: '11-14',
  requiredSubscription: SubscriptionTier.PRO,
  explanation: "VOCÊ É O MESTRE SUPREMO!"
};

const hints: Readonly<Partial<Record<number, string>>> = {
  31: 'A pedra bloqueia a fileira da bandeira. Passe pela fileira de cima e volte para baixo quando chegar à coluna da bandeira.',
  32: 'A segunda fileira é uma passagem livre. Desça uma casa, atravesse para a direita e suba só quando estiver debaixo da bandeira.',
  33: 'Conte as casas do corredor até a bandeira. Um laço com meta representa a ideia de repetir um passo até alcançar o destino. Um laço com número conta quantas vezes agir.',
  34: 'Trace um desvio pela fileira de baixo. A rota inteira pede cinco passos à direita e dois verticais. Compare esses sete passos com o limite de seis blocos.',
  35: 'Observe a fileira do meio. As pedras estão acima e abaixo dela. Conte os passos livres para a direita até a bandeira.',
  36: 'O primeiro degrau começa para baixo. Depois procure uma casa livre à direita. Repita esse par de passos com o dedo para conferir a escada inteira.',
  37: 'Em uma travessia com pintura, o Sparky pode pintar a casa onde está e então andar para a próxima. Planeje também a pincelada da casa da bandeira.',
  38: 'O bloco de pedras ocupa três fileiras. Suba duas casas, passe acima das pedras e desça na coluna da bandeira.',
  39: 'Trace um caminho livre até a bandeira. Depois imagine uma pedra no primeiro passo. Qual direção seria sua segunda escolha?',
  40: 'Pense em um desvio para contornar todas as pedras de uma vez. Desça para a fileira livre, atravesse e suba de volta na última coluna.',
  41: 'As pedras ficam na fileira de cima. Ande para a direita e use Pintar Chão nas duas casas que ficam logo abaixo delas.',
  42: 'Um desvio pela fileira de cima pede nove passos para a direita, uma subida e uma descida. Confira como esses onze movimentos se comparam ao limite de dez blocos.',
  43: 'As pedras ficam no centro. Procure uma rota pelas bordas e divida o percurso em duas retas, uma para a direita e outra para baixo.',
  44: 'São cinco passos em cada direção. Cinco é três mais dois. Cada grupo gasta um bloco para repetir e outro para andar. Conte quantos blocos as duas direções pediriam.',
  45: 'Trace duas retas de nove passos pela borda. Quando o Sparky estiver em uma casa que quer marcar, use Pintar Chão antes de continuar.',
  46: 'Trace a escada com um passo para baixo e outro para a direita. Esse par aparece oito vezes. Perceber o padrão ajuda a planejar a rota.',
};

export const PRO_LEGACY_LEVELS = [...WORLD_3, MASTER_LEVEL].map(level => ({
  ...level,
  tutorialMessage: hints[Number(level.id)],
}));
