/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Contest, StatisticalSummary, Game, OptimizationScenario, PredictiveOutcome } from '../types';
import { LOTTERY_RULES } from '../constants';

export async function fetchQRNG(count: number): Promise<number[]> {
  try {
    const response = await fetch(`https://qrng.anu.edu.au/API/jsonI.php?length=${count}&type=uint8`, {
      signal: AbortSignal.timeout(3000)
    });
    const data = await response.json();
    if (data.success && data.data) {
      // Normalize uint8 (0-255) to 1-25
      return data.data.map((n: number) => (n % 25) + 1);
    }
    throw new Error('API unstable');
  } catch (error) {
    console.warn('QRNG unavailable, using Math.random fallback');
    const fallback: number[] = [];
    for (let i = 0; i < count; i++) {
      fallback.push(Math.floor(Math.random() * 25) + 1);
    }
    return fallback;
  }
}

export function calculateStatistics(history: Contest[]): StatisticalSummary {
  const frequencies: Record<number, number> = {};
  const delays: Record<number, number> = {};
  const avgFrequencies: Record<number, number> = {};
  const avgDelays: Record<number, number> = {};
  const appearanceIndices: Record<number, number[]> = {};
  const multiState: Record<number, any> = {};
  let totalEvens = 0;
  let totalHighs = 0;

  // Initialize
  for (let i = 1; i <= 25; i++) {
    frequencies[i] = 0;
    delays[i] = history.length;
    appearanceIndices[i] = [];
  }

  history.forEach((contest, index) => {
    let evens = 0;
    let highs = 0;
    contest.numbers.forEach(num => {
      frequencies[num]++;
      appearanceIndices[num].push(index);
      if (num % 2 === 0) evens++;
      if (num >= 13) highs++;

      if (delays[num] > index) {
        delays[num] = index;
      }
    });
    totalEvens += evens;
    totalHighs += highs;
  });

  const n = history.length || 1;
  const recentHistory = history.slice(0, 50);
  const rn = recentHistory.length || 1;

  for (let i = 1; i <= 25; i++) {
    avgFrequencies[i] = frequencies[i] / n;
    
    const indices = [...appearanceIndices[i]].sort((a, b) => a - b);
    if (indices.length > 1) {
      let totalInterval = 0;
      for (let j = 0; j < indices.length - 1; j++) {
        totalInterval += Math.abs(indices[j+1] - indices[j]);
      }
      avgDelays[i] = totalInterval / (indices.length - 1);
    } else {
      avgDelays[i] = n;
    }

    // MULTI-STATE CALCULATION
    const recentFreq = recentHistory.filter(c => c.numbers.includes(i)).length / rn;
    const recurrence = appearanceIndices[i].filter(idx => idx < 20).length / 20; // Last 20 contests recurrence
    
    multiState[i] = {
      totalFreq: avgFrequencies[i],
      recentFreq,
      delay: delays[i] / n,
      recurrence,
      entropy: 1 - (Math.abs(0.6 - avgFrequencies[i])), // Normalized entropy around ideal 0.6
      density: frequencies[i] / (avgDelays[i] || 1)
    };
  }

  return {
    frequencies,
    delays,
    avgFrequencies,
    avgDelays,
    avgEvenOdd: { evens: totalEvens / n, odds: 15 - (totalEvens / n) },
    avgHighLow: { high: totalHighs / n, low: 15 - (totalHighs / n) },
    multiState
  };
}

export function calculatePredictions(history: Contest[]): PredictiveOutcome[] {
  if (history.length < 5) return [];
  
  const stats = calculateStatistics(history);
  const recentHistory = history.slice(0, 10);
  const recentStats = calculateStatistics(recentHistory);
  const n = history.length;

  return Array.from({ length: 25 }, (_, i) => {
    const num = i + 1;
    const freq = stats.avgFrequencies[num];
    const recentFreq = recentStats.avgFrequencies[num];
    const delay = stats.delays[num];
    
    // Scoring logic based on Multi-State Analysis
    let score = 50; // Base probability center
    const factors: string[] = [];

    // Delay factor
    if (delay === 1 || delay === 2) { 
      score += 15; 
      factors.push("Maturação Cinética");
    } else if (delay === 0) {
      score += 5;
      factors.push("Inércia de Repetição");
    } else if (delay > 4) {
      score -= 10;
      factors.push("Baixa Atratividade (Atraso)");
    }

    // Momentum factor
    if (recentFreq > freq) {
      score += 20;
      factors.push("Ascensão de Momentum");
    } else if (recentFreq < freq) {
      score -= 15;
      factors.push("Decaimento de Freq");
    }

    // Cyclic position
    if (delay === 0 && recentFreq > 0.8) {
      score -= 15; // Probable drop after too many repetitions
      factors.push("Resistência de Saturação");
    }

    const finalProb = Math.max(5, Math.min(95, score));
    
    return {
      number: num,
      probability: Math.round(finalProb),
      trend: recentFreq > freq ? 'up' : recentFreq < freq ? 'down' : 'stable',
      strength: finalProb > 70 ? 'strong' : finalProb > 40 ? 'medium' : 'weak',
      factors: factors.length > 0 ? factors : ["Estado de Equilíbrio"]
    } as PredictiveOutcome;
  }).sort((a, b) => b.probability - a.probability);
}

export function calculateMetrics(numbers: number[], history: Contest[]): Game['metrics'] {
  const evens = numbers.filter(n => n % 2 === 0).length;
  const high = numbers.filter(n => n >= 13).length;
  const sum = numbers.reduce((a, b) => a + b, 0);
  
  const lastContest = history[0]?.numbers || [];
  const repeatedLast = numbers.filter(n => lastContest.includes(n)).length;
  
  const last3Contests = Array.from(new Set(history.slice(0, 3).flatMap(c => c.numbers)));
  const repeatedLast3 = numbers.filter(n => last3Contests.includes(n)).length;

  const reasoning: string[] = [];

  // 1. Entropy (Dispersion)
  const sorted = [...numbers].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) gaps.push(sorted[i+1] - sorted[i]);
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((a, b) => a + Math.pow(b - avgGap, 2), 0) / gaps.length;
  const entropy = Math.max(0, 100 - (variance * 10));

  // 2. Statistics based scores
  const stats = calculateStatistics(history);
  let totalFreqScore = 0;
  let recentFreqScore = 0;
  let delayScore = 0;

  numbers.forEach(num => {
    const ms = stats.multiState[num];
    totalFreqScore += ms.totalFreq;
    recentFreqScore += ms.recentFreq;
    delayScore += (1 - ms.delay);
  });

  const w = LOTTERY_RULES.SCORE_WEIGHTS;
  
  // Par/Impar PRIORITY
  let piScore = 0;
  if (evens === 7 || evens === 8) {
    piScore = 100;
    reasoning.push("Superposição Par/Ímpar Ideal (Quantum)");
  } else if (evens === 6 || evens === 9) {
    piScore = 60;
    reasoning.push("Equilíbrio de Estado Par/Ímpar");
  } else {
    piScore = 20;
  }

  // Baixo/Alto PRIORITY
  let hlScore = 0;
  if (high === 7 || high === 8) {
    hlScore = 100;
    reasoning.push("Simetria Baixo/Alto Colapsada");
  } else if (high === 6 || high === 9) {
    hlScore = 60;
    reasoning.push("Distribuição Baixo/Alto Estável");
  } else {
    hlScore = 20;
  }

  if (sum >= 170 && sum <= 220) reasoning.push("Colapso de Soma em Faixa Áurea");
  if (repeatedLast >= 7 && repeatedLast <= 11) reasoning.push("Aderência ao Histórico (Interferência)");
  if (entropy > 70) reasoning.push("Máxima Entropia de Dispersão");

  const scoreDetails = {
    parImpar: Math.round(piScore * w.PAR_IMPAR),
    baixoAlto: Math.round(hlScore * w.BAIXO_ALTO),
    entropy: Math.round(entropy * (w.ENTROPY + w.DISPERSION)),
    totalFreq: Math.round((totalFreqScore / 15) * 100 * w.TOTAL_FREQ),
    delay: Math.round((delayScore / 15) * 100 * w.DELAY),
    recentFreq: Math.round((recentFreqScore / 15) * 100 * w.RECENT_FREQ),
  };

  const normalizedScore = Math.round(
    scoreDetails.parImpar +
    scoreDetails.baixoAlto +
    scoreDetails.entropy +
    scoreDetails.totalFreq +
    scoreDetails.delay +
    scoreDetails.recentFreq
  );

  return {
    evens,
    odds: 15 - evens,
    high,
    low: 15 - high,
    sum,
    repeatedLast,
    repeatedLast3,
    score: normalizedScore,
    scoreDetails,
    entropy,
    reasoning
  };
}

export function calculateBase18(history: Contest[]): number[] {
  if (history.length < 10) return Array.from({length: 18}, (_, i) => i + 1);

  const stats = calculateStatistics(history);
  const sortedByFreq = Object.entries(stats.frequencies)
    .sort((a, b) => b[1] - a[1])
    .map(e => Number(e[0]));

  const sortedByDelay = Object.entries(stats.delays)
    .sort((a, b) => b[1] - a[1]) // Higher delay first
    .map(e => Number(e[0]));

  const strong = sortedByFreq.slice(0, 6);
  const neutral = sortedByFreq.slice(6, 12);
  const delayed = sortedByDelay.slice(0, 6);

  return Array.from(new Set([...strong, ...neutral, ...delayed])).slice(0, 18);
}

export function isValidGame(numbers: number[], history: Contest[], existingBatch: number[][] = [], maxCommonOverride?: number): boolean {
  const sorted = [...numbers].sort((a, b) => a - b);
  
  let consecutive = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] + 1 === sorted[i + 1]) {
      consecutive++;
      if (consecutive > LOTTERY_RULES.CONSTRAINTS.MAX_CONSECUTIVE) return false;
    } else {
      consecutive = 1;
    }
  }

  const metrics = calculateMetrics(numbers, history);

  if (metrics.evens < LOTTERY_RULES.CONSTRAINTS.EVEN_RANGE[0] || metrics.evens > LOTTERY_RULES.CONSTRAINTS.EVEN_RANGE[1]) return false;
  if (metrics.sum < LOTTERY_RULES.CONSTRAINTS.SUM_RANGE[0] || metrics.sum > LOTTERY_RULES.CONSTRAINTS.SUM_RANGE[1]) return false;

  if (history.length > 0) {
    if (metrics.repeatedLast < LOTTERY_RULES.CONSTRAINTS.REPETITION_LAST_RANGE[0] || metrics.repeatedLast > LOTTERY_RULES.CONSTRAINTS.REPETITION_LAST_RANGE[1]) return false;
  }

  const lowCount = numbers.filter(n => LOTTERY_RULES.BLOCKS.LOW.includes(n)).length;
  const midCount = numbers.filter(n => LOTTERY_RULES.BLOCKS.MIDDLE.includes(n)).length;
  const highCount = numbers.filter(n => LOTTERY_RULES.BLOCKS.HIGH.includes(n)).length;

  if (lowCount < LOTTERY_RULES.CONSTRAINTS.BLOCK_DISTRIBUTION.LOW[0] || lowCount > LOTTERY_RULES.CONSTRAINTS.BLOCK_DISTRIBUTION.LOW[1]) return false;
  if (midCount < LOTTERY_RULES.CONSTRAINTS.BLOCK_DISTRIBUTION.MIDDLE[0] || midCount > LOTTERY_RULES.CONSTRAINTS.BLOCK_DISTRIBUTION.MIDDLE[1]) return false;
  if (highCount < LOTTERY_RULES.CONSTRAINTS.BLOCK_DISTRIBUTION.HIGH[0] || highCount > LOTTERY_RULES.CONSTRAINTS.BLOCK_DISTRIBUTION.HIGH[1]) return false;

  for (const other of existingBatch) {
    const common = numbers.filter(n => other.includes(n)).length;
    if (common > (maxCommonOverride ?? LOTTERY_RULES.CONSTRAINTS.MAX_COMMON)) return false;
  }

  return true;
}

async function getPoolForScenario(scenario: OptimizationScenario, stats: StatisticalSummary, base18: number[]): Promise<number[]> {
  const pool: number[] = [];
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);

  numbers.forEach(num => {
    let weight = 1.0;
    const ms = stats.multiState[num];

    switch (scenario) {
      case 'dominancia_numeros_fortes':
        if (ms.totalFreq > 0.6) weight *= 2.5;
        break;
      case 'retorno_atrasados':
        if (ms.delay > 0.6) weight *= 2.5;
        break;
      case 'equilibrio_historico':
        if (ms.totalFreq > 0.55 && ms.totalFreq < 0.65) weight *= 2.0;
        break;
      case 'alta_repeticao':
        if (stats.delays[num] === 0) weight *= 2.0;
        break;
      case 'alta_dispersao':
        if (ms.entropy > 0.8) weight *= 2.0;
        break;
      case 'baixa_entropia_controlada':
        if (ms.entropy < 0.5) weight *= 1.5;
        break;
    }

    if (base18.includes(num)) weight *= 1.3;

    const entries = Math.round(10 * weight);
    for (let j = 0; j < entries; j++) pool.push(num);
  });

  return pool;
}

export async function generateSpecificGame(
  userNumbers: number[],
  history: Contest[]
): Promise<Game | null> {
  if (userNumbers.length === 15 && isValidGame(userNumbers, history)) {
    return {
      id: "q_spec_" + Math.random().toString(36).substr(2, 9),
      numbers: [...userNumbers].sort((a, b) => a - b),
      createdAt: Date.now(),
      isStale: false,
      metrics: calculateMetrics(userNumbers, history)
    };
  }

  const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
  const maxAttempts = 5000;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const subsetSize = 12 + Math.floor(Math.random() * 3); 
    const shuffledUser = [...userNumbers].sort(() => Math.random() - 0.5);
    const subset = shuffledUser.slice(0, subsetSize);
    
    const pool = allNumbers.filter(n => !subset.includes(n)).sort(() => Math.random() - 0.5);
    const candidate = [...subset, ...pool.slice(0, 15 - subset.length)];
    
    if (isValidGame(candidate, history)) {
      return {
        id: "q_spec_adj_" + Math.random().toString(36).substr(2, 9),
        numbers: candidate.sort((a, b) => a - b),
        createdAt: Date.now(),
        isStale: false,
        metrics: calculateMetrics(candidate, history)
      };
    }
  }

  return null;
}

export async function generateBatch(
  count: number, 
  history: Contest[], 
  useQRNG: boolean,
  selectedScenario?: OptimizationScenario,
  avoidRepetition?: boolean
): Promise<Game[]> {
  const stats = calculateStatistics(history);
  const base18 = calculateBase18(history);
  const batchIndices: number[][] = [];
  const maxAttempts = 30000;
  let attempts = 0;

  // Quantum-Inspired scenario selection
  const scenarios = LOTTERY_RULES.SCENARIOS as OptimizationScenario[];

  while (batchIndices.length < count && attempts < maxAttempts) {
    attempts++;
    const scenario = selectedScenario || scenarios[batchIndices.length % scenarios.length];
    let pool = await getPoolForScenario(scenario, stats, base18);
    
    if (avoidRepetition && batchIndices.length > 0) {
      const numberCounts: Record<number, number> = {};
      for (let i = 1; i <= 25; i++) numberCounts[i] = 0;
      batchIndices.forEach(game => {
        game.forEach(num => {
          numberCounts[num]++;
        });
      });

      const copies: Record<number, number> = {};
      pool.forEach(n => {
        copies[n] = (copies[n] || 0) + 1;
      });

      const newPool: number[] = [];
      Object.entries(copies).forEach(([numStr, countCopies]) => {
        const num = Number(numStr);
        const timesSelected = numberCounts[num] || 0;
        const remainingCopies = Math.max(1, Math.round(countCopies / Math.pow(2.2, timesSelected)));
        for (let j = 0; j < remainingCopies; j++) {
          newPool.push(num);
        }
      });
      pool = newPool;
    }
    
    let candidate: number[] = [];
    if (useQRNG) {
      const qDigits = await fetchQRNG(40);
      const unique = Array.from(new Set(qDigits)).slice(0, 15);
      if (unique.length === 15) candidate = unique;
    } 

    if (candidate.length < 15) {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      candidate = Array.from(new Set(shuffled)).slice(0, 15);
    }

    const maxCommonAllowed = avoidRepetition ? 8 : LOTTERY_RULES.CONSTRAINTS.MAX_COMMON;

    if (candidate.length === 15 && isValidGame(candidate, history, batchIndices, maxCommonAllowed)) {
      batchIndices.push(candidate.sort((a, b) => a - b));
    }
  }

  return batchIndices.map(numbers => ({
    id: "qnt_" + Math.random().toString(36).substr(2, 9),
    numbers,
    createdAt: Date.now(),
    isStale: false,
    metrics: calculateMetrics(numbers, history)
  }));
}
