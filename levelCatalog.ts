import { SubscriptionTier } from './types';

const proCatalog = (entries: ReadonlyArray<readonly [number, string]>) =>
  entries.map(([id, title]) => ({ id, title, requiredSubscription: SubscriptionTier.PRO }));

export const PRO_LEGACY_CATALOG = proCatalog([
  [31, "Sensores Ativados"],
  [32, "O Labirinto Lógico"],
  [33, "Até a Bandeira"],
  [34, "Desvio Automático"],
  [35, "Se Caminho Livre"],
  [36, "Lógica Binária"],
  [37, "Loop Infinito de Pintura"],
  [38, "O Grande Algoritmo"],
  [39, "Sensores Complexos"],
  [40, "Zig-Zag Inteligente"],
  [41, "Pintura Condicional"],
  [42, "O Corredor Crítico"],
  [43, "Busca e Resgate"],
  [44, "Recursividade Simples"],
  [45, "Invasão Hacker"],
  [46, "Mestre Codificador"],
]);

export const ALGORITHM_WORKSHOP_CATALOG = proCatalog([
  [47, 'A caixa de peças'],
  [48, 'A primeira instrução trocada'],
  [49, 'O carimbo da bancada'],
  [50, 'Qual volta é mais curta?'],
  [51, 'Três passos com um par de blocos'],
  [52, 'O bilhete de montagem'],
  [53, 'O pincel adiantado'],
  [54, 'Passos e espaço no editor'],
  [55, 'A bancada do outro lado'],
  [56, 'O circuito dos três sensores'],
  [57, 'A prateleira sem saída'],
  [58, 'O laço que passou do ponto'],
  [59, 'A ponte econômica'],
  [60, 'Qual bancada pintar primeiro?'],
  [61, 'Entrega à equipe do Observatório'],
]);

export const SPARKY_OBSERVATORY_CATALOG = proCatalog([
  [62, 'A primeira observação'],
  [63, 'Um passo protegido'],
  [64, 'Uma segunda opção'],
  [65, 'Três decisões'],
  [66, 'A hora de parar'],
  [67, 'Caminhos que mudam'],
  [68, 'De olho na borda'],
  [69, 'Sinal antes da curva'],
  [70, 'Sinal na chegada'],
  [71, 'O beco sem saída'],
  [72, 'Calibração em etapas'],
  [73, 'Uma regra em outra direção'],
  [74, 'Dois sinais, uma travessia'],
  [75, 'Ponto de encontro'],
  [76, 'Observatório em operação'],
]);

export const FINAL_PROJECT_CATALOG = proCatalog([
  [77, 'A primeira entrega'],
  [78, 'O corredor das lâmpadas'],
  [79, 'Duas portas, uma regra'],
  [80, 'A rota da maré'],
  [81, 'Sinal de partida, sinal de chegada'],
  [82, 'Farol em funcionamento'],
]);

export const PRO_EXPANSION_CATALOG = [
  ...ALGORITHM_WORKSHOP_CATALOG, ...SPARKY_OBSERVATORY_CATALOG, ...FINAL_PROJECT_CATALOG,
];
export const FIRST_PRO_EXPANSION_LEVEL_ID = ALGORITHM_WORKSHOP_CATALOG[0].id;
export const LAST_OBSERVATORY_LEVEL_ID = SPARKY_OBSERVATORY_CATALOG.at(-1)?.id;

export function isPremiumLevel(levelId: number | string): levelId is number {
  return typeof levelId === 'number' && levelId >= PRO_LEGACY_CATALOG[0].id
    && levelId <= FINAL_PROJECT_CATALOG[FINAL_PROJECT_CATALOG.length - 1].id && Number.isInteger(levelId);
}
