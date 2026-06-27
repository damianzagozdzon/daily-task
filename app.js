const STORAGE_KEY = "oneDailyGoal.v1";

const goalForm = document.querySelector("#goalForm");
const goalInput = document.querySelector("#goalInput");
const todayGoal = document.querySelector("#todayGoal");
const goalText = document.querySelector("#goalText");
const statusBadge = document.querySelector("#statusBadge");
const doneBtn = document.querySelector("#doneBtn");
const missedBtn = document.querySelector("#missedBtn");
const editBtn = document.querySelector("#editBtn");
const clearBtn = document.querySelector("#clearBtn");
const historyList = document.querySelector("#historyList");
const emptyHistory = document.querySelector("#emptyHistory");
const todayDate = document.querySelector("#todayDate");
const doneCount = document.querySelector("#doneCount");
const missedCount = document.querySelector("#missedCount");
const streakCount = document.querySelector("#streakCount");
const completionRate = document.querySelector("#completionRate");
const progressSummary = document.querySelector("#progressSummary");

const dateKey = new Date().toLocaleDateString("sv-SE");
todayDate.textContent = new Date().toLocaleDateString("pl-PL", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});

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

function statusLabel(status) {
  if (status === "done") return "Zrobione";
  if (status === "missed") return "Niezrobione";
  return "Do rozliczenia wieczorem";
}

function setStatus(date, status) {
  const goals = loadGoals();
  if (!goals[date]) return;
  goals[date].status = status;
  goals[date].settledAt = new Date().toISOString();
  saveGoals(goals);
  render();
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

function progressText(done, missed, saved, streak) {
  const settled = done + missed;

  if (saved === 0) return "Brak danych z ostatnich 7 dni. Zapisz pierwszy cel i wróć wieczorem.";
  if (settled === 0) return "Masz zapisane cele, ale jeszcze żaden dzień nie został rozliczony.";
  if (streak >= 3) return `Świetnie: ${streak} dni z rzędu. Nie przerywaj serii jutro.`;
  if (done > missed) return `Dobry kierunek: ${done} z ${settled} rozliczonych dni zakończone sukcesem.`;
  if (done === 0) return "Na razie brak wykonanych dni. Jutro wybierz mniejszy, konkretny cel.";

  return `Masz ${done} wykonane dni z ${settled}. Cel: podnieść serię do 2 dni.`;
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return date.toLocaleDateString("sv-SE");
  });
}

function renderToday(goals) {
  const current = goals[dateKey];
  if (!current) {
    goalForm.classList.remove("hidden");
    todayGoal.classList.add("hidden");
    goalInput.value = "";
    return;
  }

  goalForm.classList.add("hidden");
  todayGoal.classList.remove("hidden");
  goalText.textContent = current.text;

  statusBadge.textContent = statusLabel(current.status);
  statusBadge.className = `badge ${current.status || "pending"}`;
}

function renderHistory(goals) {
  const days = lastSevenDays();
  historyList.innerHTML = "";

  let done = 0;
  let missed = 0;
  let savedInLastWeek = 0;

  days.forEach((date) => {
    const goal = goals[date];
    if (goal) savedInLastWeek += 1;
    if (goal?.status === "done") done += 1;
    if (goal?.status === "missed") missed += 1;

    const item = document.createElement("li");
    if (!goal) item.classList.add("empty-day");

    const niceDate = new Date(`${date}T12:00:00`).toLocaleDateString("pl-PL", {
      weekday: "short",
      day: "2-digit",
      month: "long"
    });

    item.innerHTML = `
      <time>${niceDate} · ${goal ? statusLabel(goal.status) : "Brak celu"}</time>
      <strong></strong>
    `;
    item.querySelector("strong").textContent = goal ? goal.text : "—";
    historyList.appendChild(item);
  });

  emptyHistory.classList.toggle("hidden", savedInLastWeek > 0);
  const streak = calculateStreak(goals);
  const settled = done + missed;
  const rate = settled === 0 ? 0 : Math.round((done / settled) * 100);

  doneCount.textContent = done;
  missedCount.textContent = missed;
  streakCount.textContent = streak;
  completionRate.textContent = `${rate}%`;
  progressSummary.textContent = progressText(done, missed, savedInLastWeek, streak);
}

function render() {
  const goals = loadGoals();
  renderToday(goals);
  renderHistory(goals);
}

goalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = goalInput.value.trim();
  if (!text) return;

  const goals = loadGoals();
  goals[dateKey] = {
    text,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  saveGoals(goals);
  render();
});

doneBtn.addEventListener("click", () => setStatus(dateKey, "done"));
missedBtn.addEventListener("click", () => setStatus(dateKey, "missed"));

editBtn.addEventListener("click", () => {
  const goals = loadGoals();
  const current = goals[dateKey];
  if (!current) return;
  goalInput.value = current.text;
  goalForm.classList.remove("hidden");
  todayGoal.classList.add("hidden");
  goalInput.focus();
});

clearBtn.addEventListener("click", () => {
  if (!confirm("Usunąć całą historię celów z tego urządzenia?")) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
});

render();
