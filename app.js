const STORAGE_KEY = "oneDailyGoal.v2";
const todayKey = new Date().toLocaleDateString("sv-SE");

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

function loadGoals() {
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

function statusText(status) {
  if (status === "done") return "Zrobione";
  if (status === "missed") return "Niezrobione";
  return "Nie oceniono";
}

function statusClass(status) {
  if (status === "done") return "done";
  if (status === "missed") return "missed";
  return "neutral";
}

function nextStatus(current) {
  if (!current || current === "open") return "done";
  if (current === "done") return "missed";
  return "open";
}

function niceDate(dateKey, index) {
  if (index === 0) return "Dzisiaj";
  if (index === 1) return "Wczoraj";
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function dayShort(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("pl-PL", { weekday: "short" });
}

function calculateStreak(goals) {
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toLocaleDateString("sv-SE");
    const item = goals[key];
    if (!item || item.status !== "done") break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function progressText(done, missed, open, streak) {
  const settled = done + missed;
  if (done + missed + open === 0) return "Zapisz pierwszy cel i wróć wieczorem.";
  if (settled === 0) return "Masz zapisane cele, ale jeszcze żaden dzień nie został rozliczony.";
  if (streak >= 5) return `Bardzo dobrze: ${streak} dni z rzędu. Pilnuj jutra.`;
  if (streak >= 2) return `Dobra passa: ${streak} dni z rzędu. Teraz najważniejsze to jej nie przerwać.`;
  if (done > missed) return `Dobry kierunek: ${done} z ${settled} ocenionych dni zakończone sukcesem.`;
  if (done === 0) return "Na razie brak wykonanych dni. Ustaw jutro mniejszy i konkretny cel.";
  return `Masz ${done} wykonane dni. Następny cel: zbudować serię 2 dni.`;
}

function renderToday(goals) {
  const today = goals[todayKey];
  goalInput.value = today?.text || "";
  todayState.classList.toggle("hidden", !today);
  doneBtn.disabled = !today;
  missedBtn.disabled = !today;

  if (!today) return;

  todayGoalText.textContent = today.text;
  todayBadge.textContent = statusText(today.status);
  todayBadge.className = `badge ${statusClass(today.status)}`;
}

function renderHistory(goals) {
  historyList.innerHTML = "";
  lastSevenDays().forEach((dateKey, index) => {
    const goal = goals[dateKey];
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `
      <time>${niceDate(dateKey, index)}</time>
      <strong>${goal ? "" : "—"}</strong>
      <button class="status-btn" type="button" ${goal ? "" : "disabled"}>
        <span class="badge ${statusClass(goal?.status)}">${statusText(goal?.status)}</span>
      </button>
    `;
    row.querySelector("strong").textContent = goal?.text || "—";
    const statusButton = row.querySelector(".status-btn");
    statusButton.addEventListener("click", () => {
      const fresh = loadGoals();
      if (!fresh[dateKey]) return;
      fresh[dateKey].status = nextStatus(fresh[dateKey].status);
      fresh[dateKey].updatedAt = new Date().toISOString();
      saveGoals(fresh);
      render();
    });
    historyList.appendChild(row);
  });
}

function renderStats(goals) {
  const days = lastSevenDays();
  const entries = days.map((dateKey) => goals[dateKey]).filter(Boolean);
  const done = entries.filter((item) => item.status === "done").length;
  const missed = entries.filter((item) => item.status === "missed").length;
  const open = entries.filter((item) => !item.status || item.status === "open").length;
  const streak = calculateStreak(goals);
  const settled = done + missed;
  const rate = settled === 0 ? 0 : Math.round((done / settled) * 100);
  const donutDegrees = Math.round((done / 7) * 360);

  streakCount.textContent = streak;
  streakMessage.textContent = streak ? `Świetna robota. Masz ${streak} ${streak === 1 ? "dzień" : "dni"} serii.` : "Zacznij od pierwszego wykonanego dnia.";
  doneCount.textContent = `${done} (${Math.round((done / 7) * 100)}%)`;
  missedCount.textContent = `${missed} (${Math.round((missed / 7) * 100)}%)`;
  openCount.textContent = `${open} (${Math.round((open / 7) * 100)}%)`;
  completionRate.textContent = `${rate}%`;
  progressBar.style.width = `${rate}%`;
  progressSummary.textContent = progressText(done, missed, open, streak);
  doneRatio.textContent = `${done}/7`;
  donutChart.style.background = `conic-gradient(var(--green) 0deg, var(--green) ${donutDegrees}deg, #e8edf4 ${donutDegrees}deg)`;

  weekDots.innerHTML = "";
  [...days].reverse().forEach((dateKey) => {
    const item = goals[dateKey];
    const dot = document.createElement("div");
    dot.className = `week-dot ${statusClass(item?.status)}`;
    dot.innerHTML = `<i>${item?.status === "missed" ? "✕" : "🔥"}</i><span>${dayShort(dateKey)}</span>`;
    weekDots.appendChild(dot);
  });
}

function render() {
  const goals = loadGoals();
  renderToday(goals);
  renderHistory(goals);
  renderStats(goals);
}

goalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = goalInput.value.trim();
  if (!text) {
    goalInput.focus();
    return;
  }

  const goals = loadGoals();
  goals[todayKey] = {
    text,
    status: goals[todayKey]?.status || "open",
    createdAt: goals[todayKey]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveGoals(goals);
  render();
});

doneBtn.addEventListener("click", () => {
  const goals = loadGoals();
  if (!goals[todayKey]) return;
  goals[todayKey].status = "done";
  goals[todayKey].updatedAt = new Date().toISOString();
  saveGoals(goals);
  render();
});

missedBtn.addEventListener("click", () => {
  const goals = loadGoals();
  if (!goals[todayKey]) return;
  goals[todayKey].status = "missed";
  goals[todayKey].updatedAt = new Date().toISOString();
  saveGoals(goals);
  render();
});

clearBtn.addEventListener("click", () => {
  if (!confirm("Na pewno wyczyścić wszystkie lokalne dane aplikacji?")) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
});

render();
