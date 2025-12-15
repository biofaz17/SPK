

import { BlockType, LevelConfig, SubscriptionTier, BlockCategory } from './types';

// ========================================================================
// CONFIGURAÇÃO DE PAGAMENTO (MERCADO PAGO)
// ========================================================================
export const MERCADO_PAGO_CONFIG = {
  // Token de Teste (Sandbox)
  ACCESS_TOKEN: "APP_USR-8166086179258406-121408-05022e7e0a81de5650dd39b508fe1fc7-92174155", 
  RECEIVER_NAME: "Sparky Educação Digital Ltda",
  RECEIVER_DOCUMENT: "00.000.000/0001-99", 
  STATEMENT_DESCRIPTOR: "SPARKYAPP", 
  CURRENCY: "BRL"
};

export const PLANS = {
  [SubscriptionTier.STARTER]: {
    id: SubscriptionTier.STARTER,
    title: "Starter",
    price: 19.99,
    priceLabel: "19,99",
    features: [
      "Mundo da Floresta (+15 Níveis)",
      "Desafios de Padrões e Pintura",
      "Sem Anúncios"
    ],
    recommended: false
  },
  [SubscriptionTier.PRO]: {
    id: SubscriptionTier.PRO,
    title: "Pro",
    price: 49.99,
    priceLabel: "49,99",
    features: [
      "Mundo Hacker (+30 Níveis Totais)",
      "Modo Criativo Ilimitado",
      "Certificado de Mestre em Lógica",
      "Lógica Condicional (IA)"
    ],
    recommended: true
  }
};

// ========================================================================
// LISTA DE NÍVEIS COM DIFICULDADE PROGRESSIVA (45 NÍVEIS)
// ========================================================================

export const LEVELS: LevelConfig[] = [
  // ========================================================================
  // MUNDO 1: A BASE LÓGICA (GRÁTIS) - Níveis 1 a 15
  // Foco: Sequência, Orientação Espacial e Loops Simples
  // ========================================================================
  {
    id: 1,
    title: "Olá Mundo",
    mission: "Vamos começar! Leve o Sparky até a bandeira verde.",
    gridSize: 3,
    startPos: { x: 0, y: 1 },
    goalPos: { x: 2, y: 1 },
    obstacles: [],
    maxBlocks: 3,
    availableBlocks: [BlockType.MOVE_RIGHT],
    tutorialMessage: "Arraste 'Andar Dir.' e aperte Executar.",
    explanation: "Perfeito! Todo programa começa com um primeiro passo.",
    ageGroup: '5-7',
    requiredSubscription: SubscriptionTier.FREE,
    introData: { title: "Sequência", description: "O computador segue suas ordens exatamente na ordem.", category: BlockCategory.MOTION }
  },
  {
    id: 2,
    title: "Virando a Esquina",
    mission: "O caminho não é reto. Precisamos descer!",
    gridSize: 4,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 2, y: 2 },
    obstacles: [{x:1, y:0}, {x:2, y:0}, {x:0, y:2}, {x:1, y:2}],
    maxBlocks: 5,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN],
    tutorialMessage: "Combine Direita e Baixo.",
    explanation: "Muito bem! Você já domina o espaço 2D.",
    ageGroup: '5-7',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 3,
    title: "O Muro",
    mission: "Um obstáculo! Dê a volta por cima.",
    gridSize: 4,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 3, y: 2 },
    obstacles: [{ x: 1, y: 2 }, { x: 2, y: 2 }],
    maxBlocks: 6,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.MOVE_DOWN],
    tutorialMessage: "Cima, Direita, Direita, Baixo...",
    explanation: "Isso é 'Desvio Condicional' manual. Ótimo raciocínio!",
    ageGroup: '5-7',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 4,
    title: "Super Poder: Loop",
    mission: "Muitos passos iguais? Use a Repetição!",
    gridSize: 5,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 4, y: 2 },
    obstacles: [],
    maxBlocks: 2,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.REPEAT_3, BlockType.REPEAT_2],
    tutorialMessage: "Coloque 'Andar Dir.' DENTRO do 'Repetir 3x'.",
    explanation: "Loops economizam tempo e energia!",
    ageGroup: '5-7',
    requiredSubscription: SubscriptionTier.FREE,
    introData: { title: "Loops", description: "Repetir tarefas é especialidade dos robôs.", category: BlockCategory.CONTROL }
  },
  {
    id: 5,
    title: "A Escada",
    mission: "Suba os degraus usando um padrão.",
    gridSize: 5,
    startPos: { x: 0, y: 4 },
    goalPos: { x: 3, y: 1 },
    obstacles: [{x:1, y:4}, {x:2, y:4}, {x:0, y:3}, {x:2, y:3}, {x:0, y:2}, {x:1, y:2}],
    maxBlocks: 8,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.REPEAT_2],
    tutorialMessage: "O padrão é: Direita, Cima. Repita isso!",
    explanation: "Identificar padrões é a chave da matemática.",
    ageGroup: '5-7',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 6,
    title: "Labirinto em U",
    mission: "Faça o contorno sem bater nas paredes.",
    gridSize: 5,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 4, y: 0 },
    obstacles: [{x:1,y:0}, {x:2,y:0}, {x:3,y:0}, {x:1,y:1}, {x:2,y:1}, {x:3,y:1}, {x:1,y:2}, {x:2,y:2}, {x:3,y:2}],
    maxBlocks: 8,
    availableBlocks: [BlockType.MOVE_DOWN, BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.REPEAT_3],
    tutorialMessage: "Desça tudo, vá para a direita, suba tudo.",
    explanation: "Sua orientação espacial está ficando afiada!",
    ageGroup: '5-7',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 7,
    title: "Otimização",
    mission: "Chegue lá usando APENAS 3 blocos.",
    gridSize: 6,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 5, y: 2 },
    obstacles: [],
    maxBlocks: 3,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.REPEAT_3, BlockType.REPEAT_2],
    tutorialMessage: "Dica: Você pode colocar um Loop DENTRO de outro? Não, mas pode usar 'Repetir 3' e 'Repetir 2'.",
    explanation: "Eficiência máxima!",
    ageGroup: '5-7',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 8,
    title: "Ziguezague Longo",
    mission: "Atravesse o corredor estreito.",
    gridSize: 6,
    startPos: { x: 0, y: 1 },
    goalPos: { x: 5, y: 4 },
    obstacles: [
       {x:1,y:0}, {x:2,y:0}, {x:3,y:0}, {x:4,y:0}, {x:5,y:0},
       {x:0,y:2}, {x:2,y:2}, {x:3,y:2}, {x:4,y:2}, {x:5,y:2},
       {x:0,y:3}, {x:1,y:3}, {x:2,y:3}, {x:4,y:3}, {x:5,y:3},
       {x:0,y:5}, {x:1,y:5}, {x:2,y:5}, {x:3,y:5}, {x:4,y:5}
    ],
    maxBlocks: 10,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT, BlockType.REPEAT_2],
    explanation: "Cuidado com a cabeça! Passamos raspando.",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 9,
    title: "Ida e Volta",
    mission: "Vá até o ponto azul e volte para o início.",
    gridSize: 5,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 0, y: 2 },
    obstacles: [], // Espaço aberto, mas a missão é lógica
    maxBlocks: 6,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_LEFT, BlockType.REPEAT_3],
    tutorialMessage: "A missão exige voltar para casa. Use a lógica inversa.",
    explanation: "Ir e voltar é um conceito importante em funções!",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 10,
    title: "Caracol Quadrado",
    mission: "Entre no espiral até o centro.",
    gridSize: 5,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 2, y: 2 },
    obstacles: [
       {x:1,y:1}, {x:2,y:1}, {x:3,y:1},
       {x:3,y:2},
       {x:1,y:3}, {x:2,y:3}, {x:3,y:3},
       {x:1,y:2}
    ],
    maxBlocks: 12,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT, BlockType.MOVE_UP],
    explanation: "Que tontura! Mas chegamos ao centro.",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 11,
    title: "O Pulo do Gato",
    mission: "Use loops para pular os buracos.",
    gridSize: 7,
    startPos: { x: 0, y: 3 },
    goalPos: { x: 6, y: 3 },
    obstacles: [{x:1,y:3}, {x:3,y:3}, {x:5,y:3}],
    maxBlocks: 6,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.REPEAT_3],
    tutorialMessage: "Padrão: Cima, Direita, Direita, Baixo. Repita.",
    explanation: "Algoritmo de salto definido com sucesso.",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 12,
    title: "Campo Aberto?",
    mission: "Parece vazio, mas você tem pouca bateria (blocos). Otimize!",
    gridSize: 8,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 7, y: 7 },
    obstacles: [],
    maxBlocks: 4, // Exige 2 loops aninhados ou sequenciais grandes
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.REPEAT_3, BlockType.REPEAT_2],
    tutorialMessage: "Use 'Repetir 3' e 'Repetir 2' de forma inteligente para cobrir grandes distâncias.",
    explanation: "Matemática aplicada! 3 + 2 + 2 = Chegada.",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 13,
    title: "A Cruz",
    mission: "Contorne a cruz central.",
    gridSize: 5,
    startPos: { x: 2, y: 0 },
    goalPos: { x: 2, y: 4 },
    obstacles: [{x:2,y:1}, {x:2,y:2}, {x:2,y:3}, {x:1,y:2}, {x:3,y:2}],
    maxBlocks: 10,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT],
    explanation: "Navegação precisa.",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 14,
    title: "Desafio da Memória",
    mission: "Memorize o caminho: Dir, Baixo, Dir, Cima, Dir.",
    gridSize: 6,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 5, y: 2 },
    obstacles: [{x:1,y:2}, {x:2,y:1}, {x:3,y:2}, {x:4,y:3}],
    maxBlocks: 10,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.MOVE_DOWN],
    explanation: "Memória sequencial é vital para programar.",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.FREE
  },
  {
    id: 15,
    title: "Formatura do Mundo 1",
    mission: "Use tudo o que aprendeu para atravessar o labirinto final.",
    gridSize: 7,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 6, y: 6 },
    obstacles: [
        {x:1,y:0}, {x:2,y:0}, {x:3,y:0},
        {x:5,y:1}, {x:5,y:2}, {x:5,y:3},
        {x:1,y:3}, {x:2,y:3}, {x:3,y:3},
        {x:3,y:5}, {x:4,y:5}, {x:5,y:5}
    ],
    maxBlocks: 15,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT, BlockType.REPEAT_3, BlockType.REPEAT_2],
    explanation: "PARABÉNS! Você completou o treinamento básico. O mundo Starter aguarda!",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.FREE
  },

  // ========================================================================
  // MUNDO 2: A FLORESTA DE CORES (STARTER) - Níveis 16 a 30
  // Foco: Ação (Pintar), Reconhecimento de Padrões e Debugging
  // ========================================================================
  {
    id: 16,
    title: "O Pincel Mágico",
    mission: "Bem-vindo à Floresta! Pinte o chão marcado.",
    gridSize: 4,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 3, y: 2 },
    obstacles: [],
    maxBlocks: 5,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.PAINT],
    tutorialMessage: "Use o bloco Roxo para pintar onde tem um 'X' (ou onde você quiser marcar).",
    explanation: "Agora você interage com o mundo, não apenas anda nele!",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.STARTER,
    introData: { title: "Ação", description: "Programas executam tarefas, como pintar, apagar ou enviar mensagens.", category: BlockCategory.ACTION }
  },
  {
    id: 17,
    title: "Marcando Território",
    mission: "Pinte os dois cantos da sala.",
    gridSize: 5,
    startPos: { x: 2, y: 2 },
    goalPos: { x: 4, y: 2 }, // Apenas chegar a um fim
    obstacles: [],
    maxBlocks: 10,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_LEFT, BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.PAINT],
    tutorialMessage: "Vá para um canto, pinte. Vá para o outro, pinte.",
    explanation: "Multitarefa executada com sucesso.",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 18,
    title: "Linha de Montagem",
    mission: "Pinte 3 blocos em sequência usando um loop.",
    gridSize: 6,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 4, y: 2 },
    obstacles: [],
    maxBlocks: 5,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.PAINT, BlockType.REPEAT_3],
    tutorialMessage: "Dentro do loop: Pintar -> Andar.",
    explanation: "Você criou uma máquina de pintura automática!",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 19,
    title: "Padrão Tracejado",
    mission: "Pinte um, pule um. Repita.",
    gridSize: 7,
    startPos: { x: 0, y: 3 },
    goalPos: { x: 6, y: 3 },
    obstacles: [],
    maxBlocks: 6,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.PAINT, BlockType.REPEAT_3, BlockType.REPEAT_2],
    tutorialMessage: "Pintar -> Andar -> Andar. Repita esse padrão.",
    explanation: "Reconhecer padrões é essencial para criptografia e arte.",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 20,
    title: "O Jardineiro",
    mission: "Plante (pinte) flores em volta da pedra central.",
    gridSize: 5,
    startPos: { x: 1, y: 1 },
    goalPos: { x: 1, y: 1 }, // Volta ao inicio
    obstacles: [{x:2, y:2}], // Pedra no meio
    maxBlocks: 12,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT, BlockType.MOVE_UP, BlockType.PAINT],
    tutorialMessage: "Ande em quadrado em volta da pedra, pintando cada passo.",
    explanation: "Belo jardim digital!",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 21,
    title: "Labirinto Invisível",
    mission: "Pinte o caminho correto para não se perder na volta.",
    gridSize: 6,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 5, y: 5 },
    obstacles: [{x:1,y:0}, {x:2,y:0}, {x:3,y:0}, {x:4,y:1}, {x:4,y:2}, {x:4,y:3}, {x:2,y:4}, {x:2,y:5}],
    maxBlocks: 15,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.PAINT],
    tutorialMessage: "Marque os pontos de virada com tinta.",
    explanation: "Como João e Maria, você deixou migalhas (tinta)!",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 22,
    title: "Padrão Xadrez",
    mission: "Pinte como um tabuleiro de xadrez numa linha.",
    gridSize: 6,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 5, y: 2 },
    obstacles: [],
    maxBlocks: 6,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.PAINT, BlockType.REPEAT_3],
    tutorialMessage: "Pinta, Anda, Anda. Espere, isso é tracejado. Tente: Pinta, Anda. Repita.",
    explanation: "Padrões binários (1, 0, 1, 0) são a linguagem dos computadores.",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 23,
    title: "Contornando o Lago",
    mission: "Dê a volta no lago e pinte os 4 cantos.",
    gridSize: 6,
    startPos: { x: 1, y: 1 },
    goalPos: { x: 1, y: 1 },
    obstacles: [{x:2,y:2}, {x:2,y:3}, {x:3,y:2}, {x:3,y:3}], // Lago central
    maxBlocks: 16,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT, BlockType.MOVE_UP, BlockType.PAINT, BlockType.REPEAT_2],
    explanation: "Geometria aplicada!",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 24,
    title: "A Ponte de Cores",
    mission: "Construa uma ponte (pinte) para atravessar o abismo imaginário.",
    gridSize: 7,
    startPos: { x: 0, y: 3 },
    goalPos: { x: 6, y: 3 },
    obstacles: [],
    maxBlocks: 8,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.PAINT, BlockType.REPEAT_3],
    explanation: "Sua ponte de dados está sólida.",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 25,
    title: "Slalom Gigante",
    mission: "Desvie das árvores e pinte a neve ao passar.",
    gridSize: 8,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 7, y: 7 },
    obstacles: [{x:1,y:1}, {x:3,y:3}, {x:5,y:5}],
    maxBlocks: 15,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.PAINT, BlockType.REPEAT_3],
    explanation: "Estilo e precisão!",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 26,
    title: "Depuração (Debug)",
    mission: "O caminho parece óbvio, mas tem uma pegadinha. Atenção!",
    gridSize: 6,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 5, y: 5 },
    obstacles: [{x:5,y:4}, {x:4,y:5}], // Bloqueiam a chegada direta
    maxBlocks: 10,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT],
    tutorialMessage: "Você terá que fazer um movimento 'estranho' no final.",
    explanation: "Debug é encontrar e corrigir erros de lógica. Você conseguiu!",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 27,
    title: "A Espiral Pintada",
    mission: "Entre na espiral pintando o caminho.",
    gridSize: 7,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 3, y: 3 },
    obstacles: [
        {x:1,y:1}, {x:2,y:1}, {x:3,y:1}, {x:4,y:1}, {x:5,y:1},
        {x:5,y:2}, {x:5,y:3}, {x:5,y:4}, {x:5,y:5},
        {x:4,y:5}, {x:3,y:5}, {x:2,y:5}, {x:1,y:5},
        {x:1,y:4}, {x:1,y:3}, {x:1,y:2}
    ],
    maxBlocks: 20,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT, BlockType.MOVE_UP, BlockType.PAINT],
    explanation: "Arte algorítmica!",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 28,
    title: "Economia de Tinta",
    mission: "Chegue ao fim, mas você só pode usar o bloco 'Pintar' 2 vezes.",
    gridSize: 6,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 5, y: 2 },
    obstacles: [],
    maxBlocks: 8,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.PAINT, BlockType.REPEAT_3],
    tutorialMessage: "Pinte apenas pontos estratégicos (início e fim?).",
    explanation: "Gestão de recursos é crucial em projetos grandes.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 29,
    title: "Labirinto Espelhado",
    mission: "O mapa é simétrico. Use isso a seu favor.",
    gridSize: 7,
    startPos: { x: 3, y: 0 },
    goalPos: { x: 3, y: 6 },
    obstacles: [
       {x:2,y:1}, {x:4,y:1},
       {x:1,y:2}, {x:5,y:2},
       {x:2,y:3}, {x:4,y:3},
       {x:1,y:4}, {x:5,y:4},
       {x:2,y:5}, {x:4,y:5}
    ],
    maxBlocks: 15,
    availableBlocks: [BlockType.MOVE_DOWN, BlockType.MOVE_RIGHT, BlockType.MOVE_LEFT],
    explanation: "Simetria simplifica o código.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.STARTER
  },
  {
    id: 30,
    title: "Desafio Final Starter",
    mission: "Atravesse, pinte o centro, e saia pelo outro lado.",
    gridSize: 9,
    startPos: { x: 0, y: 4 },
    goalPos: { x: 8, y: 4 },
    obstacles: [
       {x:4,y:0}, {x:4,y:1}, {x:4,y:2}, {x:4,y:3}, // Parede vertical cima
       {x:4,y:5}, {x:4,y:6}, {x:4,y:7}, {x:4,y:8}  // Parede vertical baixo
    ],
    maxBlocks: 15,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.PAINT, BlockType.REPEAT_3],
    tutorialMessage: "Só há uma passagem estreita no meio (4,4). Pinte-a ao passar!",
    explanation: "VOCÊ É UM EXPERT! O mundo Pro e seus algoritmos complexos te aguardam.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.STARTER
  },

  // ========================================================================
  // MUNDO 3: O HACKER (PRO) - Níveis 31 a 45
  // Foco: Lógica Condicional (IA), Abstração e Algoritmos Complexos
  // ========================================================================
  {
    id: 31,
    title: "O Sensor Inteligente",
    mission: "Use o 'Se Obstáculo' para não bater na parede invisível.",
    gridSize: 5,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 4, y: 2 },
    obstacles: [{ x: 2, y: 2 }],
    maxBlocks: 6,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.IF_OBSTACLE, BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.ELSE],
    tutorialMessage: "O robô deve 'sentir' a parede e pular.",
    explanation: "Bem-vindo à Lógica Condicional. Seu robô agora toma decisões!",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO,
    introData: { title: "Condicionais", description: "O código se adapta ao mundo: SE algo acontecer, FAÇA isso.", category: BlockCategory.DECISION }
  },
  {
    id: 32,
    title: "Decisão Binária",
    mission: "Se tiver parede, vá para cima. Senão, vá para a direita.",
    gridSize: 6,
    startPos: { x: 0, y: 4 },
    goalPos: { x: 5, y: 0 },
    obstacles: [{x:1,y:4}, {x:3,y:2}],
    maxBlocks: 10,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.IF_OBSTACLE, BlockType.ELSE, BlockType.REPEAT_3],
    tutorialMessage: "Crie um padrão que se repete e se adapta.",
    explanation: "Isso é um algoritmo adaptativo!",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 33,
    title: "Corredor Incerto",
    mission: "O caminho muda toda vez (na lógica). Crie um código genérico.",
    gridSize: 6,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 5, y: 2 },
    obstacles: [{x:2,y:2}, {x:4,y:2}],
    maxBlocks: 8,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.IF_OBSTACLE, BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.REPEAT_3],
    explanation: "Código genérico é melhor que código específico.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 34,
    title: "Patrulha",
    mission: "Ande até achar uma parede, então vire.",
    gridSize: 5,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 0, y: 4 },
    obstacles: [{x:4,y:0}, {x:4,y:4}], // Paredes nos cantos opostos
    maxBlocks: 10,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.IF_OBSTACLE, BlockType.REPEAT_3],
    tutorialMessage: "Use 'Se Obstáculo' para detectar o fim do corredor.",
    explanation: "Sensores são os olhos dos robôs.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 35,
    title: "Ziguezague Inteligente",
    mission: "Suba a escada, mas verifique cada degrau.",
    gridSize: 6,
    startPos: { x: 0, y: 5 },
    goalPos: { x: 5, y: 0 },
    obstacles: [
       {x:1,y:5}, {x:2,y:4}, {x:3,y:3}, {x:4,y:2}, {x:5,y:1} // Degraus
    ],
    maxBlocks: 12,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_UP, BlockType.IF_OBSTACLE, BlockType.ELSE, BlockType.REPEAT_3],
    explanation: "Você está programando como um engenheiro de software.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 36,
    title: "O Buscador",
    mission: "Use 'Se Caminho Livre' para achar a saída.",
    gridSize: 7,
    startPos: { x: 0, y: 3 },
    goalPos: { x: 6, y: 3 },
    obstacles: [{x:1,y:3}, {x:3,y:3}, {x:5,y:3}],
    maxBlocks: 10,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.IF_PATH, BlockType.MOVE_UP, BlockType.ELSE, BlockType.REPEAT_3],
    tutorialMessage: "Se caminho livre: Ande. Senão: Pule.",
    explanation: "Busca de caminho (Pathfinding) básico.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 37,
    title: "Labirinto de Decisão",
    mission: "Esquerda ou Direita? O código deve decidir.",
    gridSize: 5,
    startPos: { x: 2, y: 4 },
    goalPos: { x: 2, y: 0 },
    obstacles: [{x:2,y:3}, {x:2,y:1}],
    maxBlocks: 12,
    availableBlocks: [BlockType.MOVE_UP, BlockType.MOVE_RIGHT, BlockType.MOVE_LEFT, BlockType.IF_OBSTACLE, BlockType.ELSE],
    explanation: "Árvores de decisão são a base da IA.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 38,
    title: "Loop Infinito?",
    mission: "Cuidado para não ficar preso num loop eterno. Chegue ao fim.",
    gridSize: 6,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 5, y: 5 },
    obstacles: [],
    maxBlocks: 5, // Muito restrito, exige loops aninhados perfeitos
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.REPEAT_3, BlockType.REPEAT_2],
    tutorialMessage: "Matemática: 3 x 2 movimentos.",
    explanation: "Loops aninhados multiplicam o poder do código.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 39,
    title: "O Campo Minado Lógico",
    mission: "Desvie das minas usando apenas lógica, sem saber onde elas estão (simulação).",
    gridSize: 8,
    startPos: { x: 0, y: 4 },
    goalPos: { x: 7, y: 4 },
    obstacles: [{x:2,y:4}, {x:4,y:4}, {x:6,y:4}],
    maxBlocks: 8,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.IF_OBSTACLE, BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.REPEAT_3],
    explanation: "Abstração total. Você resolveu o problema sem ver o problema.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 40,
    title: "Hacking da Matrix",
    mission: "O sistema está tentando te bloquear. Use condicionais aninhadas.",
    gridSize: 7,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 6, y: 6 },
    obstacles: [{x:1,y:0}, {x:0,y:1}, {x:1,y:1}, {x:5,y:6}, {x:6,y:5}, {x:5,y:5}],
    maxBlocks: 15,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.IF_OBSTACLE, BlockType.ELSE_IF, BlockType.ELSE],
    tutorialMessage: "Se obstáculo -> Tente outro lado. Senão Se -> Tente outro",
    explanation: "Você hackeou o sistema! A lógica é sua.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 41,
    title: "Algoritmo de Busca",
    mission: "Encontre o caminho livre em um grid denso.",
    gridSize: 6,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 5, y: 5 },
    obstacles: [
       {x:1,y:0}, {x:2,y:1}, {x:3,y:2}, {x:4,y:3}, // Diagonal wall
       {x:0,y:2}, {x:2,y:4}
    ],
    maxBlocks: 12,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.IF_OBSTACLE, BlockType.ELSE, BlockType.REPEAT_3],
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 42,
    title: "Lógica Inversa",
    mission: "Chegue ao fim, mas seus controles estão invertidos! (Simulação mental)",
    gridSize: 6,
    startPos: { x: 5, y: 5 },
    goalPos: { x: 0, y: 0 },
    obstacles: [{x:2,y:2}, {x:3,y:3}],
    maxBlocks: 8,
    availableBlocks: [BlockType.MOVE_LEFT, BlockType.MOVE_UP, BlockType.REPEAT_3],
    explanation: "Pensar ao contrário é útil para desfazer erros.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 43,
    title: "Loop com Condição",
    mission: "Avance enquanto não houver parede. Se houver, vire.",
    gridSize: 7,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 6, y: 6 },
    obstacles: [{x:6,y:0}, {x:6,y:1}, {x:6,y:2}, {x:6,y:3}, {x:6,y:4}, {x:6,y:5}], // Parede final
    maxBlocks: 10,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.IF_OBSTACLE, BlockType.REPEAT_3],
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 44,
    title: "O Labirinto Final",
    mission: "Use todo o seu conhecimento para escapar.",
    gridSize: 9,
    startPos: { x: 4, y: 4 },
    goalPos: { x: 8, y: 8 },
    obstacles: [
       {x:4,y:3}, {x:5,y:4}, {x:4,y:5}, {x:3,y:4}, // Box around start
       {x:6,y:6}, {x:7,y:7}
    ],
    maxBlocks: 20,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.IF_OBSTACLE, BlockType.ELSE, BlockType.REPEAT_3, BlockType.REPEAT_2],
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO
  },
  {
    id: 45,
    title: "Desafio do Mestre Codificador",
    mission: "A prova final. Crie um algoritmo inteligente que navegue pela escada traiçoeira.",
    gridSize: 9,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 8, y: 8 },
    obstacles: [
       // Padrão de escada que exige "Se bloqueado para a direita, vá para baixo, senão direita"
       {x:1,y:0}, {x:2,y:1}, {x:3,y:2}, {x:4,y:3}, {x:5,y:4}, {x:6,y:5}, {x:7,y:6}, {x:8,y:7},
       {x:0,y:2}, {x:2,y:4}, {x:4,y:6}, {x:6,y:8} // Bloqueios extras para forçar lógica
    ],
    maxBlocks: 8, // Exige Loop + Condicional aninhada (Repetir { Se Parede Baixo Senão Dir })
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.IF_OBSTACLE, BlockType.ELSE, BlockType.REPEAT_3],
    tutorialMessage: "Dica de Mestre: Use Repetição envolvendo uma decisão 'Se... Senão'.",
    explanation: "VOCÊ É O MESTRE SUPREMO DO CÓDIGO! 🏆",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO,
    timeLimit: 180
  }
];

export const CREATIVE_LEVEL: LevelConfig = {
  id: 'creative',
  title: "Modo Criativo",
  mission: "Crie o que quiser! O limite é sua imaginação.",
  gridSize: 8,
  startPos: { x: 0, y: 0 },
  obstacles: [],
  maxBlocks: 50,
  availableBlocks: [
    BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT, BlockType.MOVE_RIGHT,
    BlockType.REPEAT_2, BlockType.REPEAT_3,
    BlockType.PAINT,
    BlockType.IF_OBSTACLE, BlockType.IF_PATH, BlockType.ELSE_IF, BlockType.ELSE
  ],
  ageGroup: '8-10',
  requiredSubscription: SubscriptionTier.FREE,
  isCreative: true
};