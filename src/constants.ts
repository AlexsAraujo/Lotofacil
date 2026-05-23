/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const LOTTERY_RULES = {
  TOTAL_NUMBERS: 25,
  GAME_SIZE: 15,
  BLOCKS: {
    LOW: [1, 2, 3, 4, 5, 6, 7, 8],
    MIDDLE: [9, 10, 11, 12, 13, 14, 15, 16, 17],
    HIGH: [18, 19, 20, 21, 22, 23, 24, 25],
  },
  CONSTRAINTS: {
    EVEN_RANGE: [6, 9],
    EVEN_PRIORITY: [7, 8],
    BLOCK_DISTRIBUTION: {
      LOW: [5, 7],
      MIDDLE: [5, 7],
      HIGH: [4, 6],
    },
    MAX_CONSECUTIVE: 3,
    MAX_COMMON: 11,
    REPETITION_LAST_RANGE: [7, 11],
    SUM_RANGE: [170, 220],
  },
  SCORE_WEIGHTS: {
    TOTAL_FREQ: 0.20,
    RECENT_FREQ: 0.20,
    PAR_IMPAR: 0.15,
    BAIXO_ALTO: 0.15,
    ENTROPY: 0.15,
    DELAY: 0.10,
    DISPERSION: 0.05
  },
  SCENARIOS: [
    'dominancia_numeros_fortes',
    'retorno_atrasados',
    'equilibrio_historico',
    'alta_repeticao',
    'alta_dispersao',
    'baixa_entropia_controlada'
  ]
};

export const PRICING_PLANS = [
  { id: 'weekly', name: 'Semanal', price: 'R$ 9,97', duration: '7 dias' },
  { id: 'monthly', name: 'Mensal', price: 'R$ 29,97', duration: '30 dias', popular: true },
  { id: 'quarterly', name: 'Trimestral', price: 'R$ 39,97', duration: '90 dias' },
];

export const TRIAL_LIMITS = {
  DURATION_MS: 24 * 60 * 60 * 1000,
  BATCH_LIMIT: 3,
};
