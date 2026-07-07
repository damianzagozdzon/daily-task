const STORAGE_KEY = "jeden-cel-v2";

const goalForm = document.querySelector("#goalForm");
const goalInput = document.querySelector("#goalInput");
const todayState = document.querySelector("#todayState");
const todayGoalText = document.querySelector("#todayGoalText");
const todayBadge = document.querySelector("#todayBadge");
const doneBtn = document.querySelector("#doneBtn");
const missedBtn = document.querySelector("#missedBtn");
const clearBtn = document.querySelector("#clearBtn");
const historyList = document.querySelector("#historyList");
const streakCount = document.querySelector("#streakCount");
const streakMessage = document.querySelector("#streakMessage");
const weekDots = document.querySelector("#weekDots");
const doneCount = document.querySelector("#doneCount");
const missedCount = document.querySelector("#missedCount");
const openCount = document.querySelector("#openCount");
const completionRate = document.querySelector("#completionRate");
const progressBar = document.querySelector("#progressBar");
const progressSummary = document.querySelector("#progressSummary");
const donutChart = document.querySelector("#donutChart");
const doneRatio = document.querySelector("#doneRatio");

function todayKey() {
  return new Date().toLocaleDateString("sv-SE");
}

function readGoals() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveGoals(goals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return date.toLocaleDateString("sv-SE");
  });
}

function niceDate(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  });
}

function statusLabel(status) {
  if (status === "done") return "Zrobione";
  if (status === "missed") return "Niezrobione";
  return "Nie oceniono";
}

function statusClass(status) {
  if (status === "done") return "done";
  if (status === "missed") return "missed";
  return "open";
}

function setStatus(dateKey, status) {
  const goals = readGoals();
  if (!goals[dateKey]) return;
  goals[dateKey].status = status;
  goals[dateKey].updatedAt = new Date().toISOString();
  saveGoals(goals);
  render();
}

function nextStatus(status) {
  if (!status || status === "open") return "done";
  if (status === "done") return "missed";
  return "open";
}

function calculateStreak(goals) {
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toLocaleDateString("sv-SE");
    if (goals[key]?.status !== "done") break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function renderToday(goals) {
  const goal = goals[todayKey()];
  if (!goal) {
    todayState.classList.add("hidden");
    goalInput.value = "";
    return;
  }

  todayState.classList.remove("hidden");
  todayGoalText.textContent = goal.text;
  todayBadge.textContent = statusLabel(goal.status);
  todayBadge.className = `badge ${statusClass(goal.status) === "open" ? "neutral" : statusClass(goal.status)}`;
  goalInput.value = goal.text;
}

function renderHistory(goals) {
  historyList.innerHTML = "";

  lastSevenDays().forEach((dateKey) => {
    const goal = goals[dateKey];
    const row = document.createElement("div");
    row.className = `history-row ${goal ? "" : "empty"}`;
    row.dataset.date = niceDate(dateKey);

    if (!goal) {
      row.innerHTML = `
        <span class="history-date">${niceDate(dateKey)}</span>
        <span class="history-goal">—</span>
        <span class="status-btn open">Brak celu</span>
      `;
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `status-btn ${statusClass(goal.status)}`;
      button.textContent = statusLabel(goal.status);
      button.addEventListener("click", () => setStatus(dateKey, nextStatus(goal.status)));

      row.innerHTML = `
        <span class="history-date">${niceDate(dateKey)}</span>
        <span class="history-goal"></span>
      `;
      row.querySelector(".history-goal").textContent = goal.text;
      row.appendChild(button);
    }

    historyList.appendChild(row);
  });
}

function renderProgress(goals) {
  const days = lastSevenDays();
  let done = 0;
  let missed = 0;
  let open = 0;

  days.forEach((dateKey) => {
    const goal = goals[dateKey];
    if (goal?.status === "done") done += 1;
    else if (goal?.status === "missed") missed += 1;
    else open += 1;
  });

  const streak = calculateStreak(goals);
  const rate = Math.round((done / 7) * 100);

  doneCount.textContent = done;
  missedCount.textContent = missed;
  openCount.textContent = open;
  streakCount.textContent = streak;
  completionRate.textContent = `${rate}%`;
  progressBar.style.width = `${rate}%`;
  donutChart.style.setProperty("--pct", `${rate}%`);
  doneRatio.textContent = `${done}/7`;

  if (streak >= 3) {
    streakMessage.textContent = `Świetna robota. Masz ${streak} dni z rzędu.`;
  } else if (streak === 1 || streak === 2) {
    streakMessage.textContent = `Dobry start. Utrzymaj serię jutro.`;
  } else {
    streakMessage.textContent = "Zacznij od pierwszego wykonanego dnia.";
  }

  if (done === 0 && missed === 0) progressSummary.textContent = "Zapisz pierwszy cel i wróć wieczorem, żeby ocenić dzień.";
  else if (rate >= 70) progressSummary.textContent = "Bardzo dobry tydzień. Trzymaj tempo i nie komplikuj celu.";
  else if (rate >= 40) progressSummary.textContent = "Jest progres. Wybieraj mniejszy, konkretny cel na jutro.";
  else progressSummary.textContent = "Najważniejsze: wrócić do rytmu. Jeden prosty cel na jutro wystarczy.";

  weekDots.innerHTML = "";
  days.slice().reverse().forEach((dateKey) => {
    const dot = document.createElement("span");
    dot.className = `week-dot ${statusClass(goals[dateKey]?.status)}`;
    dot.textContent = new Date(`${dateKey}T12:00:00`).toLocaleDateString("pl-PL", { weekday: "narrow" });
    dot.title = `${niceDate(dateKey)}: ${goals[dateKey] ? statusLabel(goals[dateKey].status) : "Brak celu"}`;
    weekDots.appendChild(dot);
  });
}

function render() {
  const goals = readGoals();
  renderToday(goals);
  renderHistory(goals);
  renderProgress(goals);
}

goalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = goalInput.value.trim();
  if (!text) return;

  const goals = readGoals();
  const key = todayKey();
  goals[key] = {
    text,
    status: goals[key]?.status || "open",
    createdAt: goals[key]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveGoals(goals);
  render();
});

doneBtn.addEventListener("click", () => setStatus(todayKey(), "done"));
missedBtn.addEventListener("click", () => setStatus(todayKey(), "missed"));
clearBtn.addEventListener("click", () => {
  if (!confirm("Na pewno usunąć wszystkie zapisane cele z tej przeglądarki?")) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
});

render();
