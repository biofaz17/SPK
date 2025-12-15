
import { BlockType, LevelConfig, SubscriptionTier, BlockCategory } from './types';

// ========================================================================
// CONFIGURAÇÃO DE PAGAMENTO (MERCADO PAGO)
// ========================================================================
export const MERCADO_PAGO_CONFIG = {
  // Token de Teste (Sandbox) - Substitua pelo seu token de produção para vendas reais
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
      "Libera o Mundo da Floresta (20 Níveis)",
      "Relatório de Aprendizado",
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
      "Libera Tudo (Mundo Espacial +40 Níveis)",
      "Modo Criativo Ilimitado",
      "Certificado Oficial",
      "Aulas de Python Futuras"
    ],
    recommended: true
  }
};

// Gerador de Níveis "Filler" mais inteligente e difícil
const generateSmartLevel = (id: number, ageGroup: any, tier: any, difficulty: number): LevelConfig => {
    const size = Math.min(9, 5 + Math.floor(difficulty / 3)); 
    const obstacles = [];
    const isZigZag = id % 2 === 0;
    
    if (isZigZag) {
        for(let y=0; y<size; y++) {
            if (y % 2 !== 0) obstacles.push({x: 1, y});
            else if (y > 0 && y < size-1) obstacles.push({x: size-2, y});
        }
    } else {
        for(let i=0; i<difficulty * 1.5; i++) {
            obstacles.push({
                x: Math.floor(Math.random() * (size-2)) + 1,
                y: Math.floor(Math.random() * (size-2)) + 1
            });
        }
    }

    const timeLimit = tier !== SubscriptionTier.FREE ? Math.max(30, 90 - (difficulty * 5)) : undefined;
    
    return {
        id,
        title: `Desafio Lógico ${id}`,
        mission: `Ajude-me a atravessar esse labirinto! Tente usar menos de ${10 + Math.floor(difficulty / 2)} blocos.`,
        gridSize: size,
        startPos: { x: 0, y: 0 },
        goalPos: { x: size - 1, y: size - 1 },
        obstacles: obstacles,
        maxBlocks: 10 + Math.floor(difficulty / 2),
        availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_UP, BlockType.REPEAT_3, BlockType.IF_OBSTACLE, BlockType.ELSE],
        tutorialMessage: "Hmm, parece complicado! Use os loops (repetição) para economizar energia.",
        explanation: "Uau! Você é um gênio da lógica! Conseguimos passar!",
        ageGroup,
        requiredSubscription: tier,
        timeLimit: timeLimit
    };
};

export const LEVELS: LevelConfig[] = [
  // ========================================================================
  // FAIXA ETÁRIA: 5-7 ANOS (Lógica Sequencial e Loops Básicos)
  // ========================================================================
  {
    id: 101,
    title: "Primeiros Passos",
    mission: "Oi, eu sou o Sparky! 🤖 Preciso chegar na bandeira verde. Me ajuda?",
    gridSize: 4,
    startPos: { x: 0, y: 2 },
    goalPos: { x: 3, y: 2 },
    obstacles: [{ x: 1, y: 1 }, { x: 1, y: 3 }, {x: 2, y: 1}, {x:2, y:3}],
    maxBlocks: 6,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.PAINT],
    tutorialMessage: "É fácil! Arraste a setinha 'Direita' para a área branca e aperte Executar. Se quiser, use o Pincel para colorir!",
    explanation: "Ebaaa! 🎉 Você me ensinou a andar! Somos uma ótima dupla!",
    ageGroup: '5-7',
    requiredSubscription: SubscriptionTier.FREE,
    bnccCode: 'EF01MA11',
    introData: {
      title: "Sequência",
      description: "Programar é como dar uma receita de bolo para o robô: um passo depois do outro!",
      category: BlockCategory.MOTION
    }
  },
  {
    id: 102,
    title: "O Desvio",
    mission: "Ops! Tem pedras no caminho. Precisamos dar a volta por baixo.",
    gridSize: 4,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 3, y: 0 },
    obstacles: [{ x: 1, y: 0 }, { x: 2, y: 0 }],
    maxBlocks: 6,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_UP],
    tutorialMessage: "Não consigo passar pelas pedras! Use as setas para Baixo e para Cima para desviar.",
    explanation: "Muito bem! 🚀 Quando um caminho fecha, a gente cria outro!",
    ageGroup: '5-7',
    requiredSubscription: SubscriptionTier.FREE,
    bnccCode: 'EF01MA12'
  },
  {
    id: 103,
    title: "Escadinha",
    mission: "Vamos subir essa escada? Cima, Direita, Cima, Direita...",
    gridSize: 5,
    startPos: { x: 0, y: 4 },
    goalPos: { x: 3, y: 1 },
    obstacles: [{x:1,y:4}, {x:2,y:3}, {x:3,y:2}],
    maxBlocks: 6,
    availableBlocks: [BlockType.MOVE_UP, BlockType.MOVE_RIGHT, BlockType.REPEAT_3],
    tutorialMessage: "Você percebeu que a gente repete os movimentos? Tente usar o bloco Laranja de Repetição!",
    explanation: "Isso é mágica! ✨ Com o bloco de repetição, eu faço várias coisas com um comando só!",
    ageGroup: '5-7',
    requiredSubscription: SubscriptionTier.FREE,
    bnccCode: 'EF15AR26',
    introData: {
      title: "Padrões",
      description: "Quando você faz a mesma coisa várias vezes, chamamos de Padrão. O computador adora padrões!",
      category: BlockCategory.CONTROL
    }
  },
  {
    id: 104,
    title: "A Curva do S",
    mission: "Segure firme! Vamos fazer um caminho em forma de 'S' sem bater nas paredes.",
    gridSize: 5,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 4, y: 4 },
    obstacles: [
        {x:1,y:0}, {x:2,y:0}, {x:3,y:0},
        {x:1,y:2}, {x:2,y:2}, {x:3,y:2},
        {x:1,y:4}, {x:2,y:4}, {x:3,y:4}
    ],
    maxBlocks: 10,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_LEFT],
    tutorialMessage: "Olho vivo! Siga o caminho livre com cuidado. Direita, Baixo, Esquerda...",
    explanation: "Que piloto incrível! 🏎️ Fizemos as curvas com perfeição!",
    ageGroup: '5-7',
    requiredSubscription: SubscriptionTier.STARTER,
    timeLimit: 60 
  },
  { 
      id: 105, 
      title: "Volta na Ilha", 
      mission: "Vamos dar uma volta completa na ilha e pintar os cantinhos!",
      gridSize: 6, 
      startPos: {x:1, y:1}, 
      goalPos: {x:4, y:4}, 
      obstacles: [
          {x:2,y:1}, {x:3,y:1}, 
          {x:4,y:1}, {x:4,y:2}, {x:4,y:3},
          {x:1,y:2}, {x:1,y:3}, {x:1,y:4}, 
          {x:2,y:4}, {x:3,y:4}
      ], 
      maxBlocks: 12, 
      availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.PAINT], 
      ageGroup: '5-7', 
      requiredSubscription: SubscriptionTier.STARTER, 
      tutorialMessage: "Lembre-se de usar o Pincel em cada canto para marcar nosso território!",
      explanation: "Ficou lindo! 🎨 Você programa e ainda é artista!",
      timeLimit: 90 
  },
  ...Array.from({length: 10}, (_, i) => generateSmartLevel(110 + i, '5-7', SubscriptionTier.STARTER, i + 2)),

  // ========================================================================
  // FAIXA ETÁRIA: 8-10 ANOS (Lógica Condicional e Planejamento)
  // ========================================================================
  { 
      id: 201, 
      title: "O Robô Pensante", 
      mission: "Ensine o Sparky a tomar decisões! Se tiver pedra, desvie. Se não, siga em frente.",
      gridSize: 6, 
      startPos: { x: 0, y: 2 }, 
      goalPos: { x: 5, y: 2 }, 
      obstacles: [{ x: 3, y: 2 }],
      maxBlocks: 5, 
      availableBlocks: [BlockType.MOVE_RIGHT, BlockType.IF_OBSTACLE, BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.ELSE], 
      tutorialMessage: "Use o bloco 'SE OBSTÁCULO'. É como dizer: 'Sparky, se ver uma parede, pule!'", 
      explanation: "Genial! 🧠 Agora eu sei pensar sozinho antes de andar!", 
      ageGroup: '8-10', 
      requiredSubscription: SubscriptionTier.FREE,
      introData: {
        title: "Condicionais",
        description: "O bloco TEAL (Verde-azulado) faz o Sparky 'pensar'. É como dizer 'SE chover, levo guarda-chuva'.",
        category: BlockCategory.DECISION
      }
  },
  { 
      id: 202, 
      title: "Campo Minado", 
      mission: "Cuidado onde pisa! Planeje cada passo para desviar das minas.",
      gridSize: 7, 
      startPos: { x: 0, y: 0 }, 
      goalPos: { x: 6, y: 6 }, 
      obstacles: [{x:2,y:2}, {x:4,y:4}, {x:1,y:5}, {x:5,y:1}], 
      maxBlocks: 10, 
      availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.REPEAT_3], 
      tutorialMessage: "Olhe bem o mapa antes de começar. Qual é o caminho mais seguro?", 
      explanation: "Ufa! Passamos sãos e salvos. Ótimo planejamento!", 
      ageGroup: '8-10', 
      requiredSubscription: SubscriptionTier.FREE 
  },
  {
    id: 203,
    title: "Desafio dos 2 Blocos",
    mission: "Você consegue chegar na bandeira usando APENAS 2 blocos? Duvido!",
    gridSize: 6,
    startPos: { x: 0, y: 0 },
    goalPos: { x: 3, y: 0 },
    obstacles: [], 
    maxBlocks: 2, 
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.REPEAT_3, BlockType.REPEAT_2], 
    tutorialMessage: "Pense grande! Como fazer muito com pouco código?",
    explanation: "Inacreditável! ⚡ Com repetição, a gente faz mágica com pouco esforço.",
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.FREE,
  },
  {
    id: 204,
    title: "Sala de Espelhos",
    mission: "Não se deixe enganar pelos reflexos. Encontre a saída verdadeira!",
    gridSize: 8,
    startPos: {x:0, y:0},
    goalPos: {x:7, y:7},
    obstacles: [
        {x:2,y:0}, {x:2,y:1}, {x:2,y:2}, 
        {x:5,y:7}, {x:5,y:6}, {x:5,y:5},
        {x:0,y:4}, {x:1,y:4}, {x:2,y:4}, {x:3,y:4}, {x:4,y:4}
    ],
    maxBlocks: 15,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.IF_OBSTACLE, BlockType.ELSE, BlockType.REPEAT_3],
    ageGroup: '8-10',
    requiredSubscription: SubscriptionTier.STARTER,
    timeLimit: 120
  },
  ...Array.from({length: 12}, (_, i) => generateSmartLevel(210 + i, '8-10', SubscriptionTier.STARTER, i + 4)),

  // ========================================================================
  // FAIXA ETÁRIA: 11-14 ANOS (Algoritmos, Abstração e Hacking)
  // ========================================================================
  { 
      id: 301, 
      title: "Algoritmo Inteligente", 
      mission: "Crie um código 'universal'. Ele deve funcionar para desviar de qualquer barreira!",
      gridSize: 8, 
      startPos: { x: 0, y: 0 }, 
      goalPos: { x: 7, y: 0 }, 
      obstacles: [
          { x: 2, y: 0 }, { x: 2, y: 1 }, 
          { x: 5, y: 0 }, { x: 5, y: 1 }
      ], 
      maxBlocks: 6,
      availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_UP, BlockType.REPEAT_3, BlockType.IF_OBSTACLE, BlockType.ELSE], 
      tutorialMessage: "Não programe passo-a-passo. Crie uma REGRA que o Sparky possa seguir sempre.", 
      explanation: "Isso é programação de verdade! Você criou um algoritmo que se adapta! 🤓", 
      ageGroup: '11-14', 
      requiredSubscription: SubscriptionTier.FREE 
  },
  {
    id: 302,
    title: "Quebrando o Firewall",
    mission: "Precisamos atravessar a parede de segurança. Só existe uma brecha minúscula!",
    gridSize: 9,
    startPos: { x: 0, y: 4 },
    goalPos: { x: 8, y: 4 },
    obstacles: [
        {x:4, y:0}, {x:4, y:1}, {x:4, y:2}, {x:4, y:3}, 
        {x:4, y:5}, {x:4, y:6}, {x:4, y:7}, {x:4, y:8} 
    ],
    maxBlocks: 8,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.REPEAT_3, BlockType.REPEAT_2],
    tutorialMessage: "Calcule com precisão. Um passo em falso e o alarme dispara!",
    explanation: "Acesso autorizado! 🔓 Você tem a precisão de um cirurgião digital.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.FREE,
    bnccCode: 'EF09MA06',
    introData: {
        title: "Precisão",
        description: "Em sistemas reais, um simples erro de digitação pode travar todo o programa.",
        category: BlockCategory.DECISION
    }
  },
  {
    id: 303,
    title: "Invasão da Matrix",
    mission: "O núcleo está protegido. Use condicionais avançadas para contornar a defesa.",
    gridSize: 9,
    startPos: { x: 1, y: 1 },
    goalPos: { x: 7, y: 7 },
    obstacles: [
        {x:3,y:3}, {x:4,y:3}, {x:5,y:3},
        {x:3,y:4},           {x:5,y:4},
        {x:3,y:5}, {x:4,y:5}, {x:5,y:5}
    ],
    maxBlocks: 15,
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.REPEAT_3, BlockType.IF_OBSTACLE, BlockType.ELSE],
    tutorialMessage: "O núcleo tem um escudo quadrado. Desenvolva uma rota para contorná-lo.",
    explanation: "Hackeamos o sistema! 😎 Você domina a Matrix.",
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.STARTER,
    timeLimit: 60
  },
  { 
    id: 320, 
    title: "O Chefão Final", 
    mission: "ALERTA DE VÍRUS! 🦠 O sistema está um caos. Sobreviva e chegue ao fim!",
    gridSize: 9, 
    startPos: {x:0,y:0}, 
    goalPos: {x:8,y:8}, 
    obstacles: [
        {x:1,y:0}, {x:3,y:0}, {x:5,y:0}, {x:7,y:0},
        {x:0,y:1}, {x:2,y:1}, {x:4,y:1}, {x:6,y:1}, {x:8,y:1},
        {x:1,y:2}, {x:3,y:2}, {x:5,y:2}, {x:7,y:2},
        {x:0,y:3}, {x:2,y:3}, {x:4,y:3}, {x:6,y:3}, {x:8,y:3},
        {x:1,y:4}, {x:3,y:4}, {x:5,y:4}, {x:7,y:4},
        {x:5,y:6}, {x:6,y:5}, {x:7,y:8} 
    ], 
    maxBlocks: 10, 
    availableBlocks: [BlockType.MOVE_RIGHT, BlockType.MOVE_DOWN, BlockType.MOVE_UP, BlockType.IF_OBSTACLE, BlockType.ELSE, BlockType.REPEAT_3, BlockType.REPEAT_2], 
    ageGroup: '11-14', 
    requiredSubscription: SubscriptionTier.PRO,
    tutorialMessage: "O mapa é um tabuleiro de xadrez louco. Use 'Se Obstáculo' para sobreviver.",
    explanation: "VOCÊ ZEROU O JOGO! 🏆 Você é oficialmente um Mestre da Programação!",
    timeLimit: 120
  },
  ...Array.from({length: 15}, (_, i) => generateSmartLevel(321 + i, '11-14', SubscriptionTier.PRO, i + 8)),
];

export const CREATIVE_LEVEL: LevelConfig = {
  id: 'creative',
  title: "Mundo da Imaginação",
  mission: "Aqui quem manda é você! Crie seu próprio caminho e teste tudo.",
  gridSize: 9,
  startPos: { x: 4, y: 4 },
  obstacles: [],
  maxBlocks: 100,
  availableBlocks: [
    BlockType.MOVE_UP, BlockType.MOVE_DOWN, BlockType.MOVE_RIGHT, BlockType.MOVE_LEFT,
    BlockType.REPEAT_2, BlockType.REPEAT_3, BlockType.PAINT,
    BlockType.IF_OBSTACLE, BlockType.IF_PATH, BlockType.ELSE, BlockType.ELSE_IF
  ],
  tutorialMessage: "Solte a sua criatividade! O céu é o limite! 🌈",
  explanation: "Que criação fantástica! Você tem o dom!",
  isCreative: true,
  ageGroup: '8-10', 
  requiredSubscription: SubscriptionTier.FREE,
  introData: {
    title: "Modo Criativo",
    description: "Aqui você é o criador! Todos os blocos (Movimento, Ação, Controle e Decisão) estão liberados.",
    category: BlockCategory.EVENT
  }
};
