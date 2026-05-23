/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OptimizationScenario = 
  | 'dominancia_numeros_fortes'
  | 'retorno_atrasados'
  | 'equilibrio_historico'
  | 'alta_repeticao'
  | 'alta_dispersao'
  | 'baixa_entropia_controlada';

export interface Contest {
  id: string;
  numbers: number[];
  timestamp: number;
}

export interface NumberState {
  totalFreq: number;
  recentFreq: number;
  delay: number;
  recurrence: number;
  entropy: number;
  density: number;
}

export interface StatisticalSummary {
  frequencies: Record<number, number>;
  delays: Record<number, number>;
  avgFrequencies: Record<number, number>;
  avgDelays: Record<number, number>;
  avgEvenOdd: { evens: number; odds: number };
  avgHighLow: { high: number; low: number };
  multiState: Record<number, NumberState>;
}

export interface Game {
  id: string;
  numbers: number[];
  createdAt: number;
  isStale: boolean;
  metrics: {
    evens: number;
    odds: number;
    high: number;
    low: number;
    sum: number;
    repeatedLast: number;
    repeatedLast3: number;
    score: number;
    scoreDetails: {
      parImpar: number;
      baixoAlto: number;
      entropy: number;
      totalFreq: number;
      delay: number;
      recentFreq: number;
    };
    entropy: number;
    reasoning: string[];
  };
}

export interface PredictiveOutcome {
  number: number;
  probability: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  strength: 'weak' | 'medium' | 'strong';
  factors: string[];
}

export interface UserAccount {
  email: string;
  hash: string;
  trialStartedAt: number;
  batchesGenerated: number;
  isPremium: boolean;
  isAdmin?: boolean;
}
