/**
 * Prediction Engine — heuristic-based confirmation probability estimator.
 *
 * IMPORTANT: This is a deterministic heuristic, NOT a machine learning model.
 * Do not describe it as AI or ML in user-facing text.
 * Probabilities are estimates based on general railway patterns; they are not
 * derived from a validated statistical model.
 *
 * Model version: v0.2 (heuristic)
 * Inputs: WL/RAC position, days to journey, class, quota, historical clearance rate
 * Output: probability 0–100 (rounded to nearest 5), confidence level
 */

import type { Prediction, PredictionFactor } from '@/types';

export interface PredictionInput {
  trainId: string;
  journeyDate: string;
  classCode: string;
  quota: string;
  status: string; // 'WL' | 'RAC' | 'CNF' | 'AVAILABLE' | 'REGRET'
  waitlistNumber?: number;
  racNumber?: number;
  daysToJourney: number;
  /** Historical clearance rate (0–1) from historical_outcomes, if available */
  historicalClearanceRate?: number;
  /** Number of historical samples used to compute clearanceRate */
  historicalSampleCount?: number;
}

/** Round to nearest 5 to avoid fake precision */
function roundToNearest5(n: number): number {
  return Math.round(n / 5) * 5;
}

/** Clamp to 0–100 */
function clamp(n: number): number {
  return Math.min(100, Math.max(0, n));
}

export function calculatePrediction(input: PredictionInput): Prediction | undefined {
  const {
    status,
    waitlistNumber,
    racNumber,
    daysToJourney,
    classCode,
    quota,
    historicalClearanceRate,
    historicalSampleCount = 0,
  } = input;

  let probability = 0;
  let confidence: 'High' | 'Medium' | 'Low' = 'Low';
  const factors: PredictionFactor[] = [];

  // Enforce real data:
  if (!status || status === 'UNKNOWN') {
    return undefined; // No real live data available
  }

  // ── 1. STATUS BASE ──────────────────────────────────────────────────────────

  if (status === 'CNF' || status === 'AVAILABLE') {
    probability = 100;
    confidence = 'High';
    factors.push({
      label: 'Current Status',
      impact: 'Positive',
      description: 'Ticket is confirmed or available. No waitlist risk at current data snapshot.',
    });
    return buildResult(input, 100, 'High', factors);
  }

  if (status === 'REGRET') {
    probability = 0;
    factors.push({
      label: 'Current Status',
      impact: 'Negative',
      description: 'Booking is currently unavailable (REGRET). No seats or waitlist quota remaining.',
    });
    return buildResult(input, 0, 'High', factors);
  }

  // ── 2. RAC POSITION ─────────────────────────────────────────────────────────

  if (status === 'RAC') {
    const racPos = racNumber ?? 20;
    // RAC within ~30 typically confirms; beyond that, less certain
    if (racPos <= 10) {
      probability = 90;
      factors.push({
        label: 'RAC Position',
        impact: 'Positive',
        description: `RAC ${racPos} — low RAC numbers confirm at a high rate as berths become available before departure.`,
      });
    } else if (racPos <= 25) {
      probability = 72;
      factors.push({
        label: 'RAC Position',
        impact: 'Positive',
        description: `RAC ${racPos} — moderate RAC position. Confirmation likely but not certain.`,
      });
    } else {
      probability = 55;
      factors.push({
        label: 'RAC Position',
        impact: 'Neutral',
        description: `RAC ${racPos} — higher RAC positions have more variable confirmation rates.`,
      });
    }
    confidence = 'Medium';
  }

  // ── 3. WAITLIST POSITION ────────────────────────────────────────────────────

  if (status === 'WL') {
    const wl = waitlistNumber ?? 50;

    if (wl <= 5) {
      probability = 80;
      factors.push({
        label: 'Waitlist Position',
        impact: 'Positive',
        description: `WL ${wl} — very low waitlist. High likelihood of clearing, especially if journey is not during a peak period.`,
      });
    } else if (wl <= 15) {
      probability = 62;
      factors.push({
        label: 'Waitlist Position',
        impact: 'Positive',
        description: `WL ${wl} — moderate waitlist. Good chance of clearing, depending on cancellation volume.`,
      });
    } else if (wl <= 30) {
      probability = 42;
      factors.push({
        label: 'Waitlist Position',
        impact: 'Neutral',
        description: `WL ${wl} — borderline position. Confirmation is possible but depends strongly on demand.`,
      });
    } else if (wl <= 60) {
      probability = 22;
      factors.push({
        label: 'Waitlist Position',
        impact: 'Negative',
        description: `WL ${wl} — high waitlist position. Historical patterns suggest limited clearance at this level.`,
      });
    } else {
      probability = 8;
      factors.push({
        label: 'Waitlist Position',
        impact: 'Negative',
        description: `WL ${wl} — very high waitlist. Confirmation is unlikely based on general patterns.`,
      });
    }
    confidence = 'Low'; // WL always starts at Low confidence
  }

  // ── 4. HISTORICAL CLEARANCE ADJUSTMENT ─────────────────────────────────────

  if (historicalClearanceRate !== undefined && historicalSampleCount >= 10) {
    const historicalProbPct = historicalClearanceRate * 100;
    // Blend: 60% heuristic + 40% historical
    const blended = probability * 0.6 + historicalProbPct * 0.4;
    const delta = blended - probability;
    probability = blended;

    if (delta > 5) {
      factors.push({
        label: 'Historical Clearance Pattern',
        impact: 'Positive',
        description: `${Math.round(historicalClearanceRate * 100)}% of similar tickets cleared in past data (${historicalSampleCount} samples). Better than average.`,
      });
    } else if (delta < -5) {
      factors.push({
        label: 'Historical Clearance Pattern',
        impact: 'Negative',
        description: `Only ${Math.round(historicalClearanceRate * 100)}% of similar tickets cleared in past data (${historicalSampleCount} samples).`,
      });
    } else {
      factors.push({
        label: 'Historical Clearance Pattern',
        impact: 'Neutral',
        description: `Historical clearance rate (~${Math.round(historicalClearanceRate * 100)}%, ${historicalSampleCount} samples) is consistent with the current estimate.`,
      });
    }

    // Better historical data → higher confidence
    confidence = historicalSampleCount >= 30 ? 'High' : 'Medium';
  } else if (historicalClearanceRate !== undefined && historicalSampleCount < 10) {
    factors.push({
      label: 'Historical Clearance Pattern',
      impact: 'Neutral',
      description: `Limited historical data (${historicalSampleCount} samples). Not enough for reliable adjustment.`,
    });
  }

  // ── 5. DAYS TO JOURNEY ──────────────────────────────────────────────────────

  if (status === 'WL' || status === 'RAC') {
    if (daysToJourney > 45) {
      probability += 8;
      factors.push({
        label: 'Booking Window',
        impact: 'Positive',
        description: `${daysToJourney} days until journey. A longer window allows more time for cancellations and quota releases.`,
      });
    } else if (daysToJourney > 15) {
      // Neutral — no adjustment
      factors.push({
        label: 'Booking Window',
        impact: 'Neutral',
        description: `${daysToJourney} days until journey. Moderate window. Cancellation activity varies by route.`,
      });
    } else if (daysToJourney <= 3) {
      probability -= 18;
      confidence = confidence === 'Low' ? 'Medium' : 'High'; // Close to journey = more certainty (it won't clear)
      factors.push({
        label: 'Booking Window',
        impact: 'Negative',
        description: `Only ${daysToJourney} day${daysToJourney === 1 ? '' : 's'} until journey. Cancellation window has nearly closed. Confirmation is unlikely.`,
      });
    } else {
      probability -= 5;
      factors.push({
        label: 'Booking Window',
        impact: 'Negative',
        description: `${daysToJourney} days until journey. Short window reduces the chance of meaningful cancellations.`,
      });
    }
  }

  // ── 6. CLASS ADJUSTMENT ─────────────────────────────────────────────────────

  if (status === 'WL') {
    if (classCode === '1A') {
      probability -= 8;
      factors.push({
        label: 'Class Type',
        impact: 'Negative',
        description: '1A (First AC) has very few berths and low cancellation volume. WL clearance is harder.',
      });
    } else if (classCode === '2A') {
      probability -= 4;
      factors.push({
        label: 'Class Type',
        impact: 'Negative',
        description: '2A (Second AC) has fewer berths and lower cancellation rates than economy classes.',
      });
    } else if (classCode === 'SL') {
      probability += 6;
      factors.push({
        label: 'Class Type',
        impact: 'Positive',
        description: 'SL (Sleeper) has high berth count and higher cancellation volume, which improves WL clearance.',
      });
    } else if (classCode === 'CC' || classCode === '2S') {
      factors.push({
        label: 'Class Type',
        impact: 'Neutral',
        description: `${classCode} class — day travel class with generally moderate cancellation rates.`,
      });
    }
    // 3A: no adjustment — taken as baseline
  }

  // ── 7. QUOTA ADJUSTMENT ─────────────────────────────────────────────────────

  if (quota === 'TQ') {
    // Tatkal WL rarely clears since it's a premium quota
    probability = Math.min(probability, 20);
    factors.push({
      label: 'Quota',
      impact: 'Negative',
      description: 'Tatkal (TQ) waitlists are less likely to clear compared to General quota. Tatkal seats are scarce and held until close to departure.',
    });
  } else if (quota === 'PT') {
    probability = Math.min(probability, 15);
    factors.push({
      label: 'Quota',
      impact: 'Negative',
      description: 'Premium Tatkal (PT) waitlists rarely clear. Consider alternative options.',
    });
  } else if (quota === 'LD') {
    factors.push({
      label: 'Quota',
      impact: 'Neutral',
      description: 'Ladies quota — clearance follows similar patterns to General but with a smaller pool.',
    });
  }
  // GN: no special adjustment — taken as baseline

  // ── FINALIZE ────────────────────────────────────────────────────────────────

  const finalProbability = roundToNearest5(clamp(probability));
  return buildResult(input, finalProbability, confidence, factors);
}

function buildResult(
  input: PredictionInput,
  probability: number,
  confidence: 'High' | 'Medium' | 'Low',
  factors: PredictionFactor[]
): Prediction {
  return {
    train_id: input.trainId,
    journey_date: input.journeyDate,
    class_code: input.classCode,
    quota: input.quota,
    predicted_probability: probability,
    confidence,
    factors,
  };
}
