import { LEAGUES, MIN_RANKED_TH, MIN_LEAGUE_BY_TH } from "./constants.js";

import {
  calculateOverallEfficiency,
  getGrade,
  starsBreakdown,
  thMatchupStats,
  bestAndWorstAttack,
} from "./logic.js";

// --- DOM elements ---
const playerThInput = document.getElementById("player-th");
const thError = document.getElementById("th-error");
const leagueSelect = document.getElementById("league-select");
const attacksContainer = document.getElementById("attacks-container");
const calculateBtn = document.getElementById("calculate-btn");
const resultsSection = document.getElementById("results");

const avgEfficiencyEl = document.getElementById("avg-efficiency");
const gradeEl = document.getElementById("grade");
const statsOutput = document.getElementById("stats-output");
const legendDisclaimer = document.getElementById("legend-disclaimer");

// --- Helpers ---
function clearElement(el) {
  el.innerHTML = "";
}

// --- Populate leagues based on TH ---
function updateLeagues() {
  clearElement(leagueSelect);
  leagueSelect.innerHTML = `<option value="">Select league</option>`;

  const playerTh = Number(playerThInput.value);

  // Invalid or too low TH
  if (!playerTh || playerTh < MIN_RANKED_TH) {
    leagueSelect.disabled = true;
    thError.classList.remove("d-none");
    clearElement(attacksContainer);
    legendDisclaimer.classList.add("d-none");
    return;
  }

  // Valid TH
  leagueSelect.disabled = false;
  thError.classList.add("d-none");

  const minLeagueNumber = MIN_LEAGUE_BY_TH[playerTh];

  Object.keys(LEAGUES).forEach((league) => {
    if (league === "Legend League") {
      addLeagueOption(league);
      return;
    }

    const leagueNumber = parseInt(league.split(" ").pop(), 10);
    if (leagueNumber >= minLeagueNumber) {
      addLeagueOption(league);
    }
  });
}

function addLeagueOption(league) {
  const option = document.createElement("option");
  option.value = league;
  option.textContent = league;
  leagueSelect.appendChild(option);
}

// --- Generate attack inputs ---
function generateAttacks() {
  clearElement(attacksContainer);

  const league = leagueSelect.value;
  if (!league) return;

  const attacksCount = LEAGUES[league];

  // Legend League disclaimer
  if (league === "Legend League") {
    legendDisclaimer.classList.remove("d-none");
  } else {
    legendDisclaimer.classList.add("d-none");
  }

  for (let i = 0; i < attacksCount; i++) {
    const attackDiv = document.createElement("div");
    attackDiv.className = "card mb-3 p-3";

    attackDiv.innerHTML = `
      <h6>Attack ${i + 1}</h6>

      <div class="row g-2">
        <div class="col-md-4">
          <input type="number" class="form-control enemy-th"
                 placeholder="Enemy TH" min="7" max="18">
        </div>

        <div class="col-md-4">
          <input type="number" class="form-control stars"
                 placeholder="Stars (0–3)" min="0" max="3">
        </div>

        <div class="col-md-4">
          <input type="number" class="form-control destruction"
                 placeholder="Destruction %" min="0" max="100">
        </div>
      </div>
    `;

    const starsInput = attackDiv.querySelector(".stars");
    const destructionInput = attackDiv.querySelector(".destruction");

    function syncStarsAndDestruction() {
      const stars = Number(starsInput.value);
      const destruction = Number(destructionInput.value);

      // 3 stars → always 100%
      if (stars === 3) {
        destructionInput.value = 100;
        destructionInput.disabled = true;
        return;
      }

      // Not 3 stars anymore
      destructionInput.disabled = false;

      // 100% → must be 3 stars
      if (destruction === 100) {
        starsInput.value = 3;
        destructionInput.value = 100;
        destructionInput.disabled = true;
      }
    }

    starsInput.addEventListener("input", syncStarsAndDestruction);
    destructionInput.addEventListener("input", syncStarsAndDestruction);

    attacksContainer.appendChild(attackDiv);
  }
}

// --- Collect attack data ---
function collectAttacks() {
  const attackCards = attacksContainer.querySelectorAll(".card");
  const attacks = [];

  for (const card of attackCards) {
    const enemyTh = Number(card.querySelector(".enemy-th").value);
    const stars = Number(card.querySelector(".stars").value);
    let destruction = Number(card.querySelector(".destruction").value);

    if (stars === 3) {
      destruction = 100;
    }

    if (
      enemyTh < 7 ||
      enemyTh > 18 ||
      stars < 0 ||
      stars > 3 ||
      destruction < 0 ||
      destruction > 100
    ) {
      return null;
    }

    attacks.push({
      enemyTh,
      stars,
      destruction,
    });
  }

  return attacks;
}

// --- Calculate results ---
function calculateResults() {
  const playerTh = Number(playerThInput.value);
  const attacks = collectAttacks();

  if (!leagueSelect.value) {
    alert("Please select a league first.");
    return;
  }

  if (!attacks) {
    alert("Please fill in all attack fields correctly.");
    return;
  }

  const efficiency = calculateOverallEfficiency(attacks, playerTh);
  const grade = getGrade(efficiency);

  avgEfficiencyEl.textContent = `${efficiency.toFixed(2)}%`;
  gradeEl.textContent = grade;

  // Stats
  clearElement(statsOutput);

  const starsStats = starsBreakdown(attacks);
  const thStats = thMatchupStats(attacks, playerTh);
  const { best, worst } = bestAndWorstAttack(attacks, playerTh);

  statsOutput.innerHTML = `
    <h5>Stars Breakdown</h5>
    <p>0⭐: ${starsStats[0]} | 1⭐: ${starsStats[1]} |
       2⭐: ${starsStats[2]} | 3⭐: ${starsStats[3]}</p>

    <h5>TH Matchup</h5>
    <p>Lower TH: ${thStats.lower.count} attacks,
       avg ${thStats.lower.average.toFixed(1)}%</p>
    <p>Equal TH: ${thStats.equal.count} attacks,
       avg ${thStats.equal.average.toFixed(1)}%</p>
    <p>Higher TH: ${thStats.higher.count} attacks,
       avg ${thStats.higher.average.toFixed(1)}%</p>

    <h5>Best Attack</h5>
    <p>
      TH ${best.attack.enemyTh},
      ${best.attack.stars}⭐,
      ${best.attack.destruction}% →
      ${best.score.toFixed(1)}
    </p>

    <h5>Worst Attack</h5>
    <p>
      TH ${worst.attack.enemyTh},
      ${worst.attack.stars}⭐,
      ${worst.attack.destruction}% →
      ${worst.score.toFixed(1)}
    </p>
  `;

  resultsSection.classList.remove("hidden");
}

// --- Event listeners ---
playerThInput.addEventListener("input", updateLeagues);
leagueSelect.addEventListener("change", generateAttacks);
calculateBtn.addEventListener("click", calculateResults);
