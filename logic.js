import { GRADE_THRESHOLDS } from "./constants.js";

// --- Star base scores (max 60) ---
const STAR_SCORES = {
  0: 0,
  1: 20,
  2: 40,
  3: 60
};

/**
 * Calculate score for a single attack (0–100)
 */
export function calculateAttackScore(attack, playerTh) {
  const starsScore = STAR_SCORES[attack.stars];
  const destructionScore = attack.destruction * 0.4;
  const baseScore = starsScore + destructionScore;

  const thDiff = attack.enemyTh - playerTh;

  let multiplier = 1.0;

  if (thDiff >= 3) {
    multiplier = 1.3;
  } else if (thDiff === 2) {
    multiplier = 1.2;
  } else if (thDiff === 1) {
    multiplier = 1.1;
  } else if (thDiff < 0) {
    // penalty for attacking lower TH
    multiplier = 0.9;
  }

  const finalScore = baseScore * multiplier;
  return Math.min(finalScore, 100);
}

/**
 * Calculate average efficiency across all attacks
 */
export function calculateOverallEfficiency(attacks, playerTh) {
  if (!attacks || attacks.length === 0) return 0;

  let total = 0;
  for (const attack of attacks) {
    total += calculateAttackScore(attack, playerTh);
  }

  return total / attacks.length;
}

/**
 * Get grade (S / A / B / C)
 */
export function getGrade(efficiency) {
  for (const grade in GRADE_THRESHOLDS) {
    if (efficiency >= GRADE_THRESHOLDS[grade]) {
      return grade;
    }
  }
  return "C";
}

/**
 * Breakdown of stars
 */
export function starsBreakdown(attacks) {
  const breakdown = { 0: 0, 1: 0, 2: 0, 3: 0 };

  for (const attack of attacks) {
    breakdown[attack.stars]++;
  }

  return breakdown;
}

/**
 * TH matchup statistics
 */
export function thMatchupStats(attacks, playerTh) {
  const stats = {
    lower: { count: 0, total: 0, average: 0 },
    equal: { count: 0, total: 0, average: 0 },
    higher: { count: 0, total: 0, average: 0 }
  };

  for (const attack of attacks) {
    const score = calculateAttackScore(attack, playerTh);

    let key = "equal";
    if (attack.enemyTh < playerTh) key = "lower";
    else if (attack.enemyTh > playerTh) key = "higher";

    stats[key].count++;
    stats[key].total += score;
  }

  for (const key in stats) {
    if (stats[key].count > 0) {
      stats[key].average = stats[key].total / stats[key].count;
    }
  }

  return stats;
}

/**
 * Best and worst attack
 */
export function bestAndWorstAttack(attacks, playerTh) {
  if (!attacks || attacks.length === 0) {
    return { best: null, worst: null };
  }

  let best = null;
  let worst = null;

  for (const attack of attacks) {
    const score = calculateAttackScore(attack, playerTh);

    if (!best || score > best.score) {
      best = { attack, score };
    }

    if (!worst || score < worst.score) {
      worst = { attack, score };
    }
  }

  return { best, worst };
}
