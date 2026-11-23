import { BlockType, LevelConfig, SubscriptionTier } from './types';

type WorkshopLevel = Pick<LevelConfig,
  'id' | 'title' | 'mission' | 'tutorialMessage' | 'explanation' | 'maxBlocks' | 'availableBlocks' | 'workshop'
> & { map: string[] };

const { MOVE_UP, MOVE_DOWN, MOVE_LEFT, MOVE_RIGHT, REPEAT_2, REPEAT_3, PAINT } = BlockType;

// S é a partida, G a bandeira, T uma marca de pintura e # uma parede.
// Os números identificam os pontos que Sparky precisa visitar em ordem.
const defineWorkshopLevel = ({ map, workshop, ...level }: WorkshopLevel): LevelConfig => {
  const cells = map.flatMap((row, y) => Array.from(row, (tile, x) => ({ tile, x, y })));
  const positionsFor = (tile: string) => cells
    .filter(cell => cell.tile === tile)
    .map(({ x, y }) => ({ x, y }));

  const [startPos] = positionsFor('S');
  const [goalPos] = positionsFor('G');
  const paintTargets = positionsFor('T');
  const checkpoints = ['1', '2', '3'].flatMap(positionsFor);
  const objectives = { ...workshop };
  if (checkpoints.length > 0) objectives.checkpoints = checkpoints;

  return {
    ...level,
    gridSize: map.length,
    startPos,
    goalPos,
    obstacles: positionsFor('#'),
    ...(paintTargets.length > 0 ? { paintTargets } : {}),
    ...(Object.keys(objectives).length > 0 ? { workshop: objectives } : {}),
    ageGroup: '11-14',
    requiredSubscription: SubscriptionTier.PRO,
  };
};

export const ALGORITHM_WORKSHOP_LEVELS: LevelConfig[] = [
  defineWorkshopLevel({
    id: 47,
    title: 'A caixa de peças',
    mission: 'Leve a primeira caixa de peças até a bancada.',
    tutorialMessage: 'Olhe a casa ao lado do Sparky. Ela está livre. Depois do primeiro passo, procure por onde descer para contornar a pilha de caixas.',
    explanation: 'Você leu o mapa casa por casa. Separar o caminho em trechos, a cada curva, ajuda a planejar antes de colocar os blocos.',
    maxBlocks: 4,
    availableBlocks: [MOVE_RIGHT, MOVE_DOWN],
    map: [
      '.#..',
      'S.#.',
      '#..G',
      '....',
    ],
  }),
  defineWorkshopLevel({
    id: 48,
    title: 'A primeira instrução trocada',
    mission: 'Conserte o rascunho. Use os mesmos quatro movimentos em uma ordem que funcione.',
    tutorialMessage: 'O primeiro movimento aponta para a parede. Mova a primeira subida para antes do passo à direita e acompanhe o restante com o dedo.',
    explanation: 'Os movimentos já estavam no rascunho. A correção foi mudar a ordem. Observar o primeiro passo que dá errado ajuda a encontrar o menor conserto.',
    maxBlocks: 4,
    availableBlocks: [MOVE_RIGHT, MOVE_UP],
    workshop: { starterProgram: [MOVE_RIGHT, MOVE_UP, MOVE_RIGHT, MOVE_UP] },
    map: [
      '..G.',
      '....',
      'S#..',
      '....',
    ],
  }),
  defineWorkshopLevel({
    id: 49,
    title: 'O carimbo da bancada',
    mission: 'Pinte a casa marcada e depois leve a caixa à bandeira.',
    tutorialMessage: 'O caminho direto chega à bandeira, mas passa longe da marca. Planeje primeiro como chegar à casa tracejada e só então encaixe Pintar Chão.',
    explanation: 'O pincel pinta a casa onde o Sparky está naquele momento. Aqui, chegar à bandeira e carimbar a casa certa eram duas partes da missão.',
    maxBlocks: 6,
    availableBlocks: [MOVE_RIGHT, MOVE_UP, MOVE_DOWN, PAINT],
    map: [
      '....',
      '..T.',
      'S..G',
      '..#.',
    ],
  }),
  defineWorkshopLevel({
    id: 50,
    title: 'Qual volta é mais curta?',
    mission: 'Contorne as caixas e chegue à bandeira em até 6 passos.',
    tutorialMessage: 'Compare a volta por cima com a de baixo. Veja se dá para atravessar a fileira vizinha sem desviar de outra caixa.',
    explanation: 'Duas rotas podiam levar ao destino. Contar os passos antes de executar mostrou qual evitava a volta mais longa.',
    maxBlocks: 8,
    availableBlocks: [MOVE_RIGHT, MOVE_UP, MOVE_DOWN],
    workshop: { maxMoves: 6 },
    map: [
      '.......',
      '.......',
      '.......',
      '.S###G.',
      '...#...',
      '.......',
      '.......',
    ],
  }),
  defineWorkshopLevel({
    id: 51,
    title: 'Três passos com um par de blocos',
    mission: 'Economize espaço no editor para cruzar a reta e fazer a curva.',
    tutorialMessage: 'Conte os passos na fileira de partida. Use Repetir 3x antes do movimento que se repete. Deixe a subida e o último passo fora da repetição.',
    explanation: 'Um movimento com Repetir 3x ocupa menos espaço que três movimentos soltos. A rota tem a mesma distância. Só o jeito de escrever mudou.',
    maxBlocks: 4,
    availableBlocks: [MOVE_RIGHT, MOVE_UP, REPEAT_3],
    map: [
      '.....',
      '.....',
      '....G',
      'S...#',
      '.....',
    ],
  }),
  defineWorkshopLevel({
    id: 52,
    title: 'O bilhete de montagem',
    mission: 'Busque o bilhete no ponto 1, entregue no ponto 2 e vá para a bandeira.',
    tutorialMessage: 'Ignore a bandeira por um instante. Planeje a rota até o ponto 1. Quando chegar lá, procure o caminho livre para o ponto 2.',
    explanation: 'A ordem faz parte da tarefa. Visitar os pontos certos fora da ordem seria como entregar um bilhete antes de buscá-lo.',
    maxBlocks: 8,
    availableBlocks: [MOVE_RIGHT, MOVE_UP, MOVE_DOWN, MOVE_LEFT],
    map: [
      '.....',
      '.1...',
      '..#..',
      '.S.2G',
      '.....',
    ],
  }),
  defineWorkshopLevel({
    id: 53,
    title: 'O pincel adiantado',
    mission: 'Mude a posição de Pintar Chão para acertar a marca do rascunho.',
    tutorialMessage: 'Teste o rascunho e veja qual casa recebeu tinta. Conte quantos passos precisam acontecer antes de abrir o pote de tinta.',
    explanation: 'A rota do rascunho já estava certa. Mudar o momento da pintura resolveu o problema sem refazer a caminhada.',
    maxBlocks: 5,
    availableBlocks: [MOVE_RIGHT, PAINT],
    workshop: { starterProgram: [MOVE_RIGHT, PAINT, MOVE_RIGHT, MOVE_RIGHT, MOVE_RIGHT] },
    map: [
      '.....',
      '..#..',
      'S.T.G',
      '..#..',
      '.....',
    ],
  }),
  defineWorkshopLevel({
    id: 54,
    title: 'Passos e espaço no editor',
    mission: 'Chegue à bandeira em até 6 passos usando no máximo 5 blocos.',
    tutorialMessage: 'Primeiro encontre uma rota de seis passos. Depois procure nela três movimentos seguidos que possam virar um par com Repetir 3x.',
    explanation: 'Passos contam casas percorridas. Blocos contam as instruções escritas. Você usou uma rota curta e, em seguida, escreveu a mesma rota com menos blocos.',
    maxBlocks: 5,
    availableBlocks: [MOVE_RIGHT, MOVE_UP, REPEAT_3],
    workshop: { maxMoves: 6 },
    map: [
      '......',
      '......',
      '....G.',
      '.#..#.',
      'S.....',
      '......',
    ],
  }),
  defineWorkshopLevel({
    id: 55,
    title: 'A bancada do outro lado',
    mission: 'Leve o carrinho para a esquerda, encontre uma descida livre e alcance a bandeira.',
    tutorialMessage: 'O Sparky começa à direita da oficina. Compare as casas debaixo do carrinho e das duas casas vizinhas antes de escolher onde descer.',
    explanation: 'A direção da bandeira ajuda a começar, mas as paredes determinam onde mudar de fileira. Aqui, olhar duas casas à frente ajudou a escolher a descida.',
    maxBlocks: 6,
    availableBlocks: [MOVE_LEFT, MOVE_RIGHT, MOVE_DOWN],
    map: [
      '......',
      '.#..S.',
      '...##.',
      '.G..#.',
      '......',
      '......',
    ],
  }),
  defineWorkshopLevel({
    id: 56,
    title: 'O circuito dos três sensores',
    mission: 'Passe pelos sensores 1, 2 e 3 na ordem e volte para a bandeira ao lado da partida.',
    tutorialMessage: 'A bandeira está pertinho, mas é o último destino. Trace primeiro a ida aos sensores de cima. Depois desça até o terceiro e volte.',
    explanation: 'Você usou os sensores como paradas para dividir o circuito. Assim pôde planejar até o retorno sem tentar resolver todo o mapa de uma vez.',
    maxBlocks: 10,
    availableBlocks: [MOVE_RIGHT, MOVE_UP, MOVE_DOWN, MOVE_LEFT],
    map: [
      '.....',
      '.1.2.',
      '.....',
      'GS3..',
      '.....',
    ],
  }),
  defineWorkshopLevel({
    id: 57,
    title: 'A prateleira sem saída',
    mission: 'Faça um desvio para pintar a marca e volte à passagem para terminar.',
    tutorialMessage: 'Siga pela fileira de baixo até ficar sob a marca. Depois de subir e pintar, veja se existe uma parede no caminho para a direita.',
    explanation: 'A marca fica num beco. Para continuar, você precisou voltar uma casa depois da pintura. Planejar a saída antes de entrar no desvio evita travar na parede.',
    maxBlocks: 8,
    availableBlocks: [MOVE_RIGHT, MOVE_UP, MOVE_DOWN, PAINT],
    map: [
      '.....',
      '.....',
      'S##..',
      '.#T#.',
      '...G.',
    ],
  }),
  defineWorkshopLevel({
    id: 58,
    title: 'O laço que passou do ponto',
    mission: 'Corrija uma repetição no rascunho para entrar na passagem até a bandeira.',
    tutorialMessage: 'Conte as casas livres à direita antes da parede. O primeiro laço deve parar na mesma coluna da bandeira.',
    explanation: 'A primeira repetição pedia uma rodada a mais e atingia a parede. Trocar só esse bloco manteve a descida pronta para funcionar.',
    maxBlocks: 4,
    availableBlocks: [MOVE_RIGHT, MOVE_DOWN, REPEAT_2, REPEAT_3],
    workshop: { starterProgram: [REPEAT_3, MOVE_RIGHT, REPEAT_2, MOVE_DOWN] },
    map: [
      '.....',
      'S..#.',
      '.#...',
      '..G..',
      '.....',
    ],
  }),
  defineWorkshopLevel({
    id: 59,
    title: 'A ponte econômica',
    mission: 'Atravesse a ponte em seis passos e suba para a bandeira usando até quatro blocos.',
    tutorialMessage: 'Imagine dois grupos de três passos. Ponha uma repetição antes da outra para repetir um grupo inteiro. A subida fica por último.',
    explanation: 'O laço de fora repete o grupo de passos criado pelo laço de dentro. Dois grupos de três são os seis passos necessários na ponte.',
    maxBlocks: 4,
    availableBlocks: [MOVE_RIGHT, MOVE_UP, REPEAT_2, REPEAT_3],
    map: [
      '.......',
      '.......',
      '......G',
      'S......',
      '.......',
      '.......',
      '.......',
    ],
  }),
  defineWorkshopLevel({
    id: 60,
    title: 'Qual bancada pintar primeiro?',
    mission: 'Pinte as duas bancadas e chegue à bandeira em até 8 passos. Você escolhe a ordem.',
    tutorialMessage: 'Uma marca fica bem perto da bandeira. Compare quanto falta andar se você deixar essa marca para o final.',
    explanation: 'Você podia visitar as duas bancadas em qualquer ordem. Deixar a que fica ao lado da bandeira por último evitou voltar pelo mesmo caminho depois.',
    maxBlocks: 13,
    availableBlocks: [MOVE_RIGHT, MOVE_UP, MOVE_DOWN, MOVE_LEFT, PAINT],
    workshop: { maxMoves: 8 },
    map: [
      '.G...',
      '.T...',
      '....#',
      '.S.T.',
      '..#..',
    ],
  }),
  defineWorkshopLevel({
    id: 61,
    title: 'Entrega à equipe do Observatório',
    mission: 'Visite os pontos 1 e 2 na ordem, pinte a marca e alcance a bandeira em até 11 passos.',
    tutorialMessage: 'Desenhe a rota do ponto 1 até a marca antes de descer ao ponto 2. Depois da pintura, procure a coluna livre que permite voltar ao segundo ponto.',
    explanation: 'Você combinou paradas em ordem, pintura na casa certa e um limite de passos. No Observatório, vai conferir se um mesmo programa funciona quando o mapa muda.',
    maxBlocks: 12,
    availableBlocks: [MOVE_RIGHT, MOVE_UP, MOVE_DOWN, MOVE_LEFT, REPEAT_2, REPEAT_3, PAINT],
    workshop: { maxMoves: 11 },
    map: [
      '......',
      '.1..T.',
      '.#.#..',
      'S..2.G',
      '..#...',
      '......',
    ],
  }),
];
