import { LEAGUES, MIN_RANKED_TH, MIN_LEAGUE_BY_TH } from "./constants.js";
import {
  calculateOverallEfficiency,
  getGrade,
  starsBreakdown,
  thMatchupStats,
  bestAndWorstAttack,
} from "./logic.js";

// DOM
const playerThInput = document.getElementById("player-th");
const thError = document.getElementById("th-error");
const leagueSelect = document.getElementById("league-select");
const customModeCheckbox = document.getElementById("custom-mode");
const attacksContainer = document.getElementById("attacks-container");
const addAttackWrapper = document.getElementById("add-attack-wrapper");
const addAttackBtn = document.getElementById("add-attack-btn");
const calculateBtn = document.getElementById("calculate-btn");
const resultsSection = document.getElementById("results");
const avgEfficiencyEl = document.getElementById("avg-efficiency");
const gradeEl = document.getElementById("grade");
const statsOutput = document.getElementById("stats-output");
const legendDisclaimer = document.getElementById("legend-disclaimer");

// Helpers
function clearElement(el) {
  el.innerHTML = "";
}

// Create attack row
function createAttackRow(index, isCustomMode) {
  const attackDiv = document.createElement("div");
  attackDiv.className = "card mb-3 p-3 shadow-sm";

  const actionButtonHtml = isCustomMode
    ? `
    <button
      class="btn btn-sm btn-outline-danger remove-attack"
      title="Remove attack"
    >
      <i class="bi bi-trash"></i>
    </button>
  `
    : `
    <button
      class="btn btn-sm btn-outline-secondary clear-attack"
      title="Clear inputs"
    >
      <i class="bi bi-arrow-counterclockwise"></i>
    </button>
  `;

  attackDiv.innerHTML = `
    <h6 class="fw-semibold mb-3">Attack ${index}</h6>

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

      <div class="col-md-12 text-end mt-2">
            ${actionButtonHtml}
      </div>

    </div>
  `;

  const enemyThInput = attackDiv.querySelector(".enemy-th");
  const playerTh = Number(playerThInput.value);
  if (playerTh >= 7 && playerTh <= 18) {
    enemyThInput.value = playerTh;
  }

  const starsInput = attackDiv.querySelector(".stars");
  const destructionInput = attackDiv.querySelector(".destruction");
  const removeBtn = attackDiv.querySelector(".remove-attack");
  const clearBtn = attackDiv.querySelector(".clear-attack");

  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      attackDiv.remove();
      renumberAttacks();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      enemyThInput.value = playerThInput.value || "";
      starsInput.value = "";
      destructionInput.value = "";
      destructionInput.disabled = false;
    });
  }

  enemyThInput.addEventListener("blur", () => {
    const value = Number(enemyThInput.value);

    if (!value) return;

    if (value < 7) {
      enemyThInput.value = 7;
    } else if (value > 18) {
      enemyThInput.value = 18;
    }
  });

  function sync() {
    const stars = Number(starsInput.value);
    const destruction = Number(destructionInput.value);

    if (stars === 3) {
      destructionInput.value = 100;
      destructionInput.disabled = true;
      return;
    }

    destructionInput.disabled = false;

    if (destruction === 100) {
      starsInput.value = 3;
      destructionInput.value = 100;
      destructionInput.disabled = true;
    }
  }

  starsInput.addEventListener("input", sync);
  destructionInput.addEventListener("input", sync);

  return attackDiv;
}

function renumberAttacks() {
  attacksContainer.querySelectorAll(".card").forEach((card, i) => {
    card.querySelector("h6").textContent = `Attack ${i + 1}`;
  });
}

// League logic
function updateLeagues() {
  clearElement(leagueSelect);
  leagueSelect.innerHTML = `<option value="">Select league</option>`;

  const th = Number(playerThInput.value);
  if (!th || th < MIN_RANKED_TH) {
    leagueSelect.disabled = true;
    thError.classList.remove("d-none");
    return;
  }

  thError.classList.add("d-none");
  leagueSelect.disabled = false;

  const minLeague = MIN_LEAGUE_BY_TH[th];

  Object.keys(LEAGUES).forEach((league) => {
    if (league === "Legend League") {
      leagueSelect.append(new Option(league, league));
      return;
    }

    const num = parseInt(league.split(" ").pop(), 10);
    if (num >= minLeague) {
      leagueSelect.append(new Option(league, league));
    }
  });
}

function generateAttacks() {
  clearElement(attacksContainer);
  const league = leagueSelect.value;
  if (!league) return;

  legendDisclaimer.classList.toggle("d-none", league !== "Legend League");

  for (let i = 1; i <= LEAGUES[league]; i++) {
    attacksContainer.appendChild(createAttackRow(i, false));
  }
}

// Collect + calculate
function collectAttacks() {
  const cards = attacksContainer.querySelectorAll(".card");
  if (!cards.length) return null;

  const attacks = [];

  for (const card of cards) {
    const enemyThRaw = card.querySelector(".enemy-th").value;
    const starsRaw = card.querySelector(".stars").value;
    const destructionRaw = card.querySelector(".destruction").value;

    // Check missing fields
    if (enemyThRaw === "" || starsRaw === "" || destructionRaw === "") {
      return null;
    }

    const enemyTh = Number(enemyThRaw);
    const stars = Number(starsRaw);
    const destruction = Number(destructionRaw);

    // Range validation
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

function calculateResults() {
  const attacks = collectAttacks();
  if (!attacks) {
    alert("Please fill in all fields for every attack before calculating.");
    return;
  }

  const th = Number(playerThInput.value);
  const efficiency = calculateOverallEfficiency(attacks, th);
  const grade = getGrade(efficiency);

  avgEfficiencyEl.textContent = `${efficiency.toFixed(2)}%`;
  gradeEl.textContent = grade;

  const starsStats = starsBreakdown(attacks);
  const thStats = thMatchupStats(attacks, th);
  const { best, worst } = bestAndWorstAttack(attacks, th);

  statsOutput.innerHTML = `
  <h6 class="mt-3">Stars Breakdown</h6>
  <p>
    ⭐⭐⭐: ${starsStats[3]} |
    ⭐⭐: ${starsStats[2]} |
    ⭐: ${starsStats[1]} |
    0⭐: ${starsStats[0]}
  </p>

  <h6 class="mt-3">TH Matchup</h6>
  <p>
    Lower TH: ${thStats.lower.count} attacks,
    avg ${thStats.lower.average.toFixed(2)}%
  </p>
  <p>
    Equal TH: ${thStats.equal.count} attacks,
    avg ${thStats.equal.average.toFixed(2)}%
  </p>
  <p>
    Higher TH: ${thStats.higher.count} attacks,
    avg ${thStats.higher.average.toFixed(2)}%
  </p>

  <h6 class="mt-3">Best Attack</h6>
  <p>
    Enemy TH ${best.attack.enemyTh},
    ${best.attack.stars}⭐,
    ${best.attack.destruction}% →
    <strong>${best.score.toFixed(2)}</strong>
  </p>

  <h6 class="mt-3">Worst Attack</h6>
  <p>
    Enemy TH ${worst.attack.enemyTh},
    ${worst.attack.stars}⭐,
    ${worst.attack.destruction}% →
    <strong>${worst.score.toFixed(2)}</strong>
  </p>
`;

  resultsSection.classList.remove("d-none");
}

// Events
playerThInput.addEventListener("input", updateLeagues);
leagueSelect.addEventListener("change", generateAttacks);
calculateBtn.addEventListener("click", calculateResults);

customModeCheckbox.addEventListener("change", () => {
  clearElement(attacksContainer);
  resultsSection.classList.add("d-none");

  if (customModeCheckbox.checked) {
    leagueSelect.disabled = true;
    addAttackWrapper.classList.remove("d-none");
    attacksContainer.appendChild(createAttackRow(1, true));
  } else {
    leagueSelect.disabled = false;
    addAttackWrapper.classList.add("d-none");
    generateAttacks();
  }
});

addAttackBtn.addEventListener("click", () => {
  attacksContainer.appendChild(
    createAttackRow(attacksContainer.children.length + 1, true)
  );
});

window.addEventListener("DOMContentLoaded", () => {
  playerThInput.value = "";
  leagueSelect.value = "";
  leagueSelect.disabled = true;

  customModeCheckbox.checked = false;
  addAttackWrapper.classList.add("d-none");

  clearElement(attacksContainer);
  resultsSection.classList.add("d-none");
});
