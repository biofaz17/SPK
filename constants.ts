
import { BlockType, LevelConfig, SubscriptionTier, BlockCategory } from './types';

export const PLANS = {
  [SubscriptionTier.STARTER]: {
    id: SubscriptionTier.STARTER,
    title: "Starter",
    price: 19.99,
    priceLabel: "19,99",
    features: ["Mundo da Floresta (+15 Níveis)", "Desafios de Padrões e Pintura", "Sem Anúncios"],
    recommended: false
  },
  [SubscriptionTier.PRO]: {
    id: SubscriptionTier.PRO,
    title: "Pro",
    price: 49.99,
    priceLabel: "49,99",
    features: ["Mundo Hacker (+30 Níveis Totais)", "Oficina de Algoritmos (15 novas fases)", "Observatório do Sparky (15 novas fases)", "Projeto Final · Farol do Sparky (6 fases em Python)", "Modo Criativo Ilimitado", "Certificado de Mestre em Lógica", "Lógica Condicional (IA)"],
    recommended: true
  }
};

// ========================================================================
// MUNDO 1: INICIAL (1-15) - GRÁTIS
// ========================================================================
const WORLD_1: LevelConfig[] = [
  { id: 1, title: "Primeiro Passo", mission: "Ande 2 vezes para a direita.", gridSize: 3, startPos: { x: 0, y: 1 }, goalPos: { x: 2, y: 1 }, obstacles: [], maxBlocks: 2, availableBlocks: [BlockType.MOVE_RIGHT], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 2, title: "Descendo", mission: "Vá para a direita e depois para baixo.", gridSize: 3, startPos: { x: 0, y: 0 }, goalPos: { x: 2, y: 2 }, obstacles: [], maxBlocks: 4, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 3, title: "O Pequeno Desvio", mission: "Desvie do obstáculo no centro.", gridSize: 3, startPos: { x: 0, y: 1 }, goalPos: { x: 2, y: 1 }, obstacles: [{x:1, y:1}], maxBlocks: 4, availableBlocks: [BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.MOVE_RIGHT], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 4, title: "O Poder da Repetição", mission: "Use o bloco de Repetir 3x.", gridSize: 5, startPos: { x: 0, y: 2 }, goalPos: { x: 3, y: 2 }, obstacles: [], maxBlocks: 2, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.REPEAT_3], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 5, title: "Escada Simples", mission: "Suba os degraus até o topo!", gridSize: 4, startPos: { x: 0, y: 3 }, goalPos: { x: 2, y: 1 }, obstacles: [{x:1, y:3}, {x:2, y:2}], maxBlocks: 5, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 6, title: "Volta Completa", mission: "Dê a volta no muro central.", gridSize: 4, startPos: { x: 0, y: 1 }, goalPos: { x: 2, y: 1 }, obstacles: [{x:1, y:1}], maxBlocks: 6, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 7, title: "Repetir é Fácil", mission: "Ande 3 vezes para baixo com um loop.", gridSize: 5, startPos: { x: 2, y: 0 }, goalPos: { x: 2, y: 3 }, obstacles: [], maxBlocks: 2, availableBlocks: [BlockType.MOVE_DOWN, BlockType.REPEAT_3], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 8, title: "Zigue-Zague", mission: "Siga o caminho livre.", gridSize: 5, startPos: { x: 0, y: 0 }, goalPos: { x: 2, y: 2 }, obstacles: [{x:1, y:0}, {x:2, y:1}], maxBlocks: 5, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 9, title: "Caminho Estreito", mission: "Atravesse o corredor.", gridSize: 5, startPos: { x: 0, y: 4 }, goalPos: { x: 4, y: 4 }, obstacles: [{x:0,y:3}, {x:1,y:3}, {x:2,y:3}, {x:3,y:3}, {x:4,y:3}], maxBlocks: 6, availableBlocks: [BlockType.MOVE_RIGHT], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 10, title: "Loop Duplo", mission: "Ande para a direita 3x e depois para baixo 3x.", gridSize: 6, startPos: { x: 0, y: 0 }, goalPos: { x: 3, y: 3 }, obstacles: [], maxBlocks: 4, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.REPEAT_3], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 11, title: "O Quadrado", mission: "Contorne o quadrado central.", gridSize: 4, startPos: { x: 0, y: 0 }, goalPos: { x: 3, y: 0 }, obstacles: [{x:1,y:1}, {x:2,y:1}, {x:1,y:2}], maxBlocks: 8, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT, BlockType.MOVE_UP], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 12, title: "Salto Gigante", mission: "Use o loop para atravessar o mapa.", gridSize: 8, startPos: { x: 0, y: 4 }, goalPos: { x: 6, y: 4 }, obstacles: [], maxBlocks: 4, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.REPEAT_3], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 13, title: "Labirinto Simples", mission: "Encontre a saída.", gridSize: 5, startPos: { x: 0, y: 0 }, goalPos: { x: 4, y: 4 }, obstacles: [{x:1,y:1}, {x:1,y:2}, {x:3,y:2}, {x:3,y:3}], maxBlocks: 10, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 14, title: "Padrão de Ida", mission: "Ande, ande, vire.", gridSize: 5, startPos: { x: 0, y: 4 }, goalPos: { x: 4, y: 0 }, obstacles: [], maxBlocks: 10, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE },
  { id: 15, title: "Final do Mundo 1", mission: "Mostre que você aprendeu a repetir!", gridSize: 5, startPos: { x: 0, y: 4 }, goalPos: { x: 3, y: 1 }, obstacles: [{x:1,y:4}, {x:2,y:3}], maxBlocks: 5, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.REPEAT_3], ageGroup: '5-7', requiredSubscription: SubscriptionTier.FREE }
];

// ========================================================================
// MUNDO 2: FLORESTA (16-30) - STARTER
// ========================================================================
const WORLD_2: LevelConfig[] = [
  { id: 16, title: "A Floresta de Cores", mission: "Pinte o caminho enquanto anda.", gridSize: 5, startPos: { x: 0, y: 2 }, goalPos: { x: 4, y: 2 }, obstacles: [], maxBlocks: 4, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.PAINT, BlockType.REPEAT_3], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 17, title: "Espiral Curta", mission: "Faça um movimento em caracol.", gridSize: 5, startPos: { x: 1, y: 1 }, goalPos: { x: 2, y: 2 }, obstacles: [], maxBlocks: 8, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT, BlockType.MOVE_UP], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 18, title: "Pinte o Quadrado", mission: "Pinte 4 células em volta de você.", gridSize: 5, startPos: { x: 2, y: 2 }, goalPos: { x: 2, y: 2 }, obstacles: [], maxBlocks: 10, availableBlocks: [BlockType.MOVE_UP, BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT, BlockType.PAINT], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 19, title: "O Grande Degrau", mission: "Use loops para subir a montanha.", gridSize: 6, startPos: { x: 0, y: 5 }, goalPos: { x: 3, y: 2 }, obstacles: [{x:1,y:5}, {x:0,y:4}, {x:2,y:4}, {x:1,y:3}], maxBlocks: 6, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.REPEAT_3], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 20, title: "Muro Duplo", mission: "Ande por entre os muros.", gridSize: 6, startPos: { x: 0, y: 0 }, goalPos: { x: 5, y: 0 }, obstacles: [{x:0,y:1}, {x:1,y:1}, {x:2,y:1}, {x:3,y:1}, {x:4,y:1}, {x:1,y:3}, {x:2,y:3}, {x:3,y:3}, {x:4,y:3}, {x:5,y:3}], maxBlocks: 12, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_UP], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 21, title: "Pintor Eficiente", mission: "Pinte 3 blocos à direita usando apenas 2 comandos.", gridSize: 5, startPos: { x: 0, y: 2 }, goalPos: { x: 3, y: 2 }, obstacles: [], maxBlocks: 2, availableBlocks: [BlockType.REPEAT_3, BlockType.PAINT, BlockType.MOVE_RIGHT], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 22, title: "Desvio de Árvores", mission: "Não toque nas árvores (blocos cinzas).", gridSize: 6, startPos: { x: 0, y: 0 }, goalPos: { x: 5, y: 5 }, obstacles: [{x:1,y:1}, {x:2,y:2}, {x:3,y:3}, {x:4,y:4}], maxBlocks: 12, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 23, title: "Oito Passos", mission: "Ande 8 vezes usando loops.", gridSize: 9, startPos: { x: 0, y: 4 }, goalPos: { x: 8, y: 4 }, obstacles: [], maxBlocks: 6, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.REPEAT_3, BlockType.REPEAT_2], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 24, title: "Desenho em L", mission: "Ande e pinte em formato de L.", gridSize: 5, startPos: { x: 1, y: 1 }, goalPos: { x: 3, y: 3 }, obstacles: [], maxBlocks: 8, availableBlocks: [BlockType.MOVE_DOWN, BlockType.MOVE_RIGHT, BlockType.PAINT], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 25, title: "Corredor de Pintura", mission: "Pinte todo o corredor.", gridSize: 6, startPos: { x: 0, y: 2 }, goalPos: { x: 5, y: 2 }, obstacles: [], maxBlocks: 3, availableBlocks: [BlockType.REPEAT_3, BlockType.MOVE_RIGHT, BlockType.PAINT], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 26, title: "Escada Invertida", mission: "Desça os degraus.", gridSize: 5, startPos: { x: 0, y: 0 }, goalPos: { x: 3, y: 3 }, obstacles: [{x:1,y:0}, {x:0,y:1}], maxBlocks: 8, availableBlocks: [BlockType.MOVE_DOWN, BlockType.MOVE_RIGHT], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 27, title: "O Túnel", mission: "Atravesse e pinte a saída.", gridSize: 5, startPos: { x: 2, y: 0 }, goalPos: { x: 2, y: 4 }, obstacles: [{x:1,y:1}, {x:3,y:1}, {x:1,y:2}, {x:3,y:2}, {x:1,y:3}, {x:3,y:3}], maxBlocks: 6, availableBlocks: [BlockType.MOVE_DOWN, BlockType.PAINT, BlockType.REPEAT_3], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 28, title: "Dança do Robô", mission: "Direita, Cima, Direita, Baixo.", gridSize: 5, startPos: { x: 0, y: 2 }, goalPos: { x: 4, y: 2 }, obstacles: [], maxBlocks: 8, availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.MOVE_DOWN], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 29, title: "Padrão 2x2", mission: "Use o loop 2x para um padrão repetido.", gridSize: 5, startPos: { x: 0, y: 0 }, goalPos: { x: 4, y: 4 }, obstacles: [], maxBlocks: 6, availableBlocks: [BlockType.REPEAT_2, BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER },
  { id: 30, title: "Mestre da Floresta", mission: "Pinte o caminho final.", gridSize: 7, startPos: { x: 0, y: 3 }, goalPos: { x: 6, y: 3 }, obstacles: [], maxBlocks: 5, availableBlocks: [BlockType.REPEAT_3, BlockType.MOVE_RIGHT, BlockType.PAINT], ageGroup: '8-10', requiredSubscription: SubscriptionTier.STARTER }
];

export const LEGACY_LEVELS: LevelConfig[] = [...WORLD_1, ...WORLD_2];
export const LEVELS = LEGACY_LEVELS;

export const CREATIVE_LEVEL: LevelConfig = {
  id: 'creative',
  title: "Modo Criativo",
  mission: "Crie sua própria lógica!",
  gridSize: 10,
  startPos: { x: 0, y: 0 },
  goalPos: undefined,
  obstacles: [],
  maxBlocks: 100,
  availableBlocks: Object.values(BlockType),
  ageGroup: '8-10',
  requiredSubscription: SubscriptionTier.PRO,
  isCreative: true
};
