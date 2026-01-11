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
const darkModeToggle = document.getElementById("dark-mode-toggle");
let starsChart = null;
let thChart = null;

// Helpers
function clearElement(el) {
  el.innerHTML = "";
}

darkModeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark", darkModeToggle.checked);
  localStorage.setItem("darkMode", darkModeToggle.checked ? "on" : "off");
});

function scrollToFirstError() {
  const firstError = document.querySelector(".attack-error:not(.d-none)");
  if (!firstError) return;

  firstError.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

const errorSummary = document.getElementById("error-summary");

function showErrorSummary(count) {
  errorSummary.textContent =
    count === 1
      ? "⚠️ 1 attack contains an error. Please fix it below."
      : `⚠️ ${count} attacks contain errors. Please fix them below.`;

  errorSummary.classList.remove("d-none");
}

function hideErrorSummary() {
  errorSummary.classList.add("d-none");
  errorSummary.textContent = "";
}

// Create attack row
function createAttackRow(index, isCustomMode) {
  const attackDiv = document.createElement("div");
  attackDiv.className = "card mb-3 p-3 shadow-sm";

  const actionButtonHtml = isCustomMode
    ? `
    <button
      class="btn btn-sm btn-outline-secondary me-2 clear-attack"
      title="Clear inputs"
    >
      <i class="bi bi-arrow-counterclockwise"></i>
    </button>
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

      <div class="attack-error text-danger small mt-2 d-none"></div>

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

  // If custom mode is ON, league must stay disabled no matter what
  if (customModeCheckbox.checked) {
    leagueSelect.disabled = true;
    leagueSelect.value = "";
    legendDisclaimer.classList.add("d-none");
    return;
  }

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
  if (customModeCheckbox.checked) return;
  clearElement(attacksContainer);
  const league = leagueSelect.value;
  if (!league) return;

  legendDisclaimer.classList.toggle("d-none", league !== "Legend League");

  for (let i = 1; i <= LEAGUES[league]; i++) {
    attacksContainer.appendChild(createAttackRow(i, false));
  }
}

function clearAttackErrors() {
  document.querySelectorAll(".attack-error").forEach((el) => {
    el.textContent = "";
    el.classList.add("d-none");
  });
}

function setAttackError(card, message) {
  const errorEl = card.querySelector(".attack-error");
  if (!errorEl) return;

  errorEl.textContent = message;
  errorEl.classList.remove("d-none");
}

// Collect + calculate
function collectAttacks() {
  hideErrorSummary();
  clearAttackErrors();

  const cards = attacksContainer.querySelectorAll(".card");
  if (!cards.length) return null;

  const attacks = [];

  for (const card of cards) {
    const enemyThRaw = card.querySelector(".enemy-th").value;
    const starsRaw = card.querySelector(".stars").value;
    const destructionRaw = card.querySelector(".destruction").value;

    // Missing fields
    if (enemyThRaw === "" || starsRaw === "" || destructionRaw === "") {
      setAttackError(card, "All fields must be filled in.");
      showErrorSummary(1);
      return null;
    }

    const enemyTh = Number(enemyThRaw);
    const stars = Number(starsRaw);
    const destruction = Number(destructionRaw);

    // General range validation
    if (enemyTh < 7 || enemyTh > 18) {
      setAttackError(card, "Enemy Town Hall must be between 7 and 18.");
      showErrorSummary(1);
      return null;
    }

    if (stars < 0 || stars > 3) {
      setAttackError(card, "Stars must be between 0 and 3.");
      showErrorSummary(1);
      return null;
    }

    if (destruction < 0 || destruction > 100) {
      setAttackError(card, "Destruction must be between 0% and 100%.");
      showErrorSummary(1);
      return null;
    }

    // Game rules: stars ↔ destruction
    if (stars === 3 && destruction !== 100) {
      setAttackError(card, "3⭐ attack must be exactly 100% destruction.");
      showErrorSummary(1);
      return null;
    }

    if (stars === 2 && (destruction < 50 || destruction >= 100)) {
      setAttackError(
        card,
        "2⭐ attack must be between 50% and 99% destruction."
      );
      showErrorSummary(1);
      return null;
    }

    if (stars === 1 && destruction >= 100) {
      setAttackError(card, "1⭐ attack cannot have 100% destruction.");
      showErrorSummary(1);
      return null;
    }

    if (stars === 0 && destruction >= 50) {
      setAttackError(card, "0⭐ attack must be below 50% destruction.");
      showErrorSummary(1);
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
    scrollToFirstError();
    return;
  }

  const th = Number(playerThInput.value);
  const efficiency = calculateOverallEfficiency(attacks, th);
  const grade = getGrade(efficiency);

  avgEfficiencyEl.textContent = `${efficiency.toFixed(2)}%`;
  gradeEl.textContent = grade;
  gradeEl.className = "badge fs-4 px-3 py-2"; // reset

  switch (grade) {
    case "S":
      gradeEl.classList.add("bg-success");
      break;
    case "A":
      gradeEl.classList.add("bg-primary");
      break;
    case "B":
      gradeEl.classList.add("bg-warning", "text-dark");
      break;
    default:
      gradeEl.classList.add("bg-danger");
  }

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
  // --- Stars chart ---
  const starsCtx = document.getElementById("stars-chart").getContext("2d");

  if (starsChart) {
    starsChart.destroy();
  }

  starsChart = new Chart(starsCtx, {
    type: "bar",
    data: {
      labels: ["0⭐", "1⭐", "2⭐", "3⭐"],
      datasets: [
        {
          label: "Attacks",
          data: [starsStats[0], starsStats[1], starsStats[2], starsStats[3]],
          backgroundColor: ["#dc3545", "#fd7e14", "#ffc107", "#198754"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  });

  // --- TH Matchup chart ---
  const thCtx = document.getElementById("th-chart").getContext("2d");

  if (thChart) {
    thChart.destroy();
  }

  thChart = new Chart(thCtx, {
    type: "bar",
    data: {
      labels: ["Lower TH", "Equal TH", "Higher TH"],
      datasets: [
        {
          label: "Attacks",
          data: [
            thStats.lower.count,
            thStats.equal.count,
            thStats.higher.count,
          ],
          backgroundColor: ["#0d6efd", "#6c757d", "#20c997"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  });
}

// Events
playerThInput.addEventListener("input", updateLeagues);
leagueSelect.addEventListener("change", generateAttacks);
calculateBtn.addEventListener("click", calculateResults);

customModeCheckbox.addEventListener("change", () => {
  clearElement(attacksContainer);
  resultsSection.classList.add("d-none");

  if (customModeCheckbox.checked) {
    leagueSelect.value = "";
    legendDisclaimer.classList.add("d-none");
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
  const darkMode = localStorage.getItem("darkMode");
  if (darkMode === "on") {
    document.body.classList.add("dark");
    darkModeToggle.checked = true;
  }

  playerThInput.value = "";
  leagueSelect.value = "";
  leagueSelect.disabled = true;

  customModeCheckbox.checked = false;
  addAttackWrapper.classList.add("d-none");

  clearElement(attacksContainer);
  resultsSection.classList.add("d-none");
});
