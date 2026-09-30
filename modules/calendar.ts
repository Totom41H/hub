import { state } from "../core/state";
import { escapeHtml } from "../core/utils";

let currentCalendarDate = new Date();
let configured = false;
let deps = { showPage: (_pageId: string) => {} };

export function configureCalendarModule(next: Partial<typeof deps>) {
  deps = { ...deps, ...next };
}

function getMonthElement(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>("#calendar-month-title") ||
    document.querySelector<HTMLElement>("#calendar-month")
  );
}

export function renderCalendar(): void {
  const grid = document.querySelector<HTMLElement>("#calendar-grid");
  const monthElement = getMonthElement();
  if (!grid || !monthElement) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthName = currentCalendarDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  monthElement.textContent =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const firstDay = new Date(year, month, 1).getDay();
  const mondayFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  let html = dayNames
    .map((day) => `<div class="calendar-day-header">${day}</div>`)
    .join("");

  for (let i = 0; i < mondayFirstDay; i++) {
    html += `<div class="calendar-day empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    const dayWods = state.wods.filter((wod) => wod.date === dateString);
    const dayWeeklies = state.weeklies.filter((weekly) => weekly.date === dateString);

    html += `
      <div class="calendar-day ${isToday ? "today" : ""}" data-calendar-date="${dateString}">
        <div class="calendar-day-number">${day}</div>
        ${dayWods.map((wod) => `
          <div
            class="calendar-event wod ${wod.status === "Publié" ? "published" : ""}"
            data-calendar-wod="${wod.id}"
          >
            <strong>🏋️ ${escapeHtml(wod.id)}</strong> ${escapeHtml(wod.name)}
          </div>
        `).join("")}
        ${dayWeeklies.map((weekly) => `
          <div
            class="calendar-event weekly ${weekly.status === "Publié" ? "published" : ""}"
            data-calendar-weekly="${weekly.id}"
          >
            <strong>🏆 ${escapeHtml(weekly.id)}</strong> ${escapeHtml(weekly.name)}
          </div>
        `).join("")}
      </div>
    `;
  }

  grid.innerHTML = html;
}

export function setupCalendar(): void {
  if (configured) {
    renderCalendar();
    return;
  }

  const grid = document.querySelector<HTMLElement>("#calendar-grid");
  const prevButton = document.querySelector<HTMLButtonElement>("#calendar-prev");
  const todayButton = document.querySelector<HTMLButtonElement>("#calendar-today");
  const nextButton = document.querySelector<HTMLButtonElement>("#calendar-next");

  if (!grid || !prevButton || !todayButton || !nextButton) return;

  configured = true;

  prevButton.onclick = () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
  };

  todayButton.onclick = () => {
    currentCalendarDate = new Date();
    renderCalendar();
  };

  nextButton.onclick = () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
  };

  grid.onclick = (event) => {
    const target = event.target as HTMLElement;

    const wodEvent = target.closest<HTMLElement>("[data-calendar-wod]");
    if (wodEvent) {
      const wodId = wodEvent.dataset.calendarWod;
      if (!wodId) return;
      deps.showPage("wod");
      setTimeout(() => {
        document.querySelector<HTMLButtonElement>(`[data-view-wod="${wodId}"]`)?.click();
      }, 0);
      return;
    }

    const weeklyEvent = target.closest<HTMLElement>("[data-calendar-weekly]");
    if (weeklyEvent) {
      const weeklyId = weeklyEvent.dataset.calendarWeekly;
      if (!weeklyId) return;
      deps.showPage("weekly");
      setTimeout(() => {
        document.querySelector<HTMLButtonElement>(`[data-view-weekly="${weeklyId}"]`)?.click();
      }, 0);
      return;
    }

    const day = target.closest<HTMLElement>("[data-calendar-date]");
    if (!day) return;

    const date = day.dataset.calendarDate;
    if (!date) return;

    deps.showPage("wod");
    setTimeout(() => {
      const newWodButton =
        document.querySelector<HTMLButtonElement>("#new-wod-button") ||
        document.querySelector<HTMLButtonElement>("#open-wod-form");
      newWodButton?.click();

      setTimeout(() => {
        const dateInput = document.querySelector<HTMLInputElement>("#wod-date");
        if (dateInput) dateInput.value = date;
      }, 0);
    }, 0);
  };

  renderCalendar();
}
