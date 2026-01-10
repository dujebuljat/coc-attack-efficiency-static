// --- Ranked availability ---
export const MIN_RANKED_TH = 7;

// --- Leagues and number of attacks ---
// NOTE: Legend League is handled as DAILY (8 attacks)
export const LEAGUES = {
  "Skeleton 1": 6,
  "Skeleton 2": 6,
  "Skeleton 3": 6,
  "Barbarian 4": 6,
  "Barbarian 5": 6,
  "Barbarian 6": 6,
  "Archer 7": 8,
  "Archer 8": 8,
  "Archer 9": 8,
  "Wizard 10": 8,
  "Wizard 11": 8,
  "Wizard 12": 8,
  "Valkyrie 13": 8,
  "Valkyrie 14": 8,
  "Valkyrie 15": 8,
  "Witch 16": 10,
  "Witch 17": 10,
  "Witch 18": 10,
  "Golem 19": 12,
  "Golem 20": 12,
  "Golem 21": 12,
  "P.E.K.K.A 22": 12,
  "P.E.K.K.A 23": 12,
  "P.E.K.K.A 24": 14,
  "Titan 25": 14,
  "Titan 26": 18,
  "Titan 27": 18,
  "Dragon 28": 24,
  "Dragon 29": 24,
  "Dragon 30": 24,
  "Electro 31": 30,
  "Electro 32": 30,
  "Electro 33": 30,

  // Daily mode
  "Legend League": 8,
};

// --- Minimum league number by Town Hall ---
export const MIN_LEAGUE_BY_TH = {
  7: 1,
  8: 2,
  9: 3,
  10: 4,
  11: 6,
  12: 8,
  13: 11,
  14: 14,
  15: 17,
  16: 21,
  17: 25,
  18: 25,
};

// --- Grade thresholds ---
export const GRADE_THRESHOLDS = {
  S: 90,
  A: 80,
  B: 70,
  C: 0,
};
