import { state } from "../core/state";
import { escapeHtml } from "../core/utils";

let deps = { showPage: (_pageId: string) => {} };
export function configureDashboardModule(next: Partial<typeof deps>) { deps = { ...deps, ...next }; }

export function setupDashboardButton() {
  const button =
    document.querySelector<HTMLButtonElement>(
      "#new-wod-button"
    );

  button?.addEventListener("click", () => {
    deps.showPage("wod");

    setTimeout(() => {
      const wodButton =
        document.querySelector<HTMLButtonElement>(
          "#open-wod-form"
        );

      wodButton?.click();
    }, 100);
  });
}

export function setupDashboardStats() {
  const statsSection =
    document.querySelector<HTMLElement>(
      ".stats-section"
    );

  if (!statsSection) return;

  statsSection.addEventListener("click", (event) => {
    const target =
      event.target as HTMLElement;

    const card =
      target.closest<HTMLElement>(
        ".stat-card"
      );

    if (!card) return;

    const id = card.querySelector("strong")?.id;

    if (!id) return;

    if (id.startsWith("dashboard-wod-")) {
      let status: string | undefined;

      if (id === "dashboard-wod-todo") {
        status = "À créer";
      }

      if (id === "dashboard-wod-progress") {
        status = "En cours";
      }

      if (id === "dashboard-wod-validated") {
        status = "Prêt";
      }

      if (id === "dashboard-wod-published") {
        status = "Publié";
      }

      deps.showPage("wod");

      setTimeout(() => {
        const statusFilter =
          document.querySelector<HTMLSelectElement>(
            "#wod-status-filter"
          );

        if (statusFilter) {
          statusFilter.value =
            status ?? "";

          statusFilter.dispatchEvent(
            new Event("change")
          );
        }
      }, 100);

      return;
    }

    if (id.startsWith("dashboard-weekly-")) {
      let status: string | undefined;

      if (id === "dashboard-weekly-todo") {
        status = "À créer";
      }

      if (id === "dashboard-weekly-progress") {
        status = "En cours";
      }

      if (id === "dashboard-weekly-validated") {
        status = "Prêt";
      }

      if (id === "dashboard-weekly-published") {
        status = "Publié";
      }

      deps.showPage("weekly");

      setTimeout(() => {
        const statusFilter =
          document.querySelector<HTMLSelectElement>(
            "#weekly-status-filter"
          );

        if (statusFilter) {
          statusFilter.value =
            status ?? "";

          statusFilter.dispatchEvent(
            new Event("change")
          );
        }
      }, 100);
    }
  });
}

export function renderDashboardPublications() {
  const container =
    document.querySelector<HTMLElement>("#dashboard-publications");

  if (!container) return;

  const upcomingContents = [
    ...state.wods.map((wod) => ({
      ...wod,
      contentType: "wod"
    })),

    ...state.weeklies.map((weekly) => ({
      ...weekly,
      contentType: "weekly"
    }))
  ]
    .filter(
      (item) =>
        item.date &&
        item.status !== "Publié"
    )
    .sort((a, b) =>
      a.date.localeCompare(b.date)
    )
    .slice(0, 5);

  if (upcomingContents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span>📅</span>
        <strong>Aucune publication prévue</strong>
        <p>Ajoute une date à tes WOD pour les voir apparaître ici.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = upcomingContents
    .map((item) => {
      const date = new Date(`${item.date}T00:00:00`);

      const day = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
      });

      const month = date
        .toLocaleDateString("fr-FR", {
          month: "short",
        })
        .replace(".", "")
        .toUpperCase();

      return `
        <div class="publication-item">
          <div class="publication-date">
            <strong>${day}</strong>
            <span>${month}</span>
          </div>

          <div class="publication-info">
            <strong>${item.name}</strong>
            <span>${item.id}</span>
          </div>

          <div class="publication-status status-${item.status
            .toLowerCase()
            .replace(/ /g, "-")
            .replace(/à/g, "a")
            .replace(/ê/g, "e")
            .replace(/é/g, "e")}"
          >
            ${item.status}
          </div>
        </div>
      `;
    })
    .join("");
}

export function renderDashboardTasks() {
  const actionContainer =
    document.querySelector<HTMLElement>(
      "#dashboard-action-tasks"
    );

  if (!actionContainer) return;

  const actionTasks = [
    ...state.wods.map((wod) => ({
      ...wod,
      contentType: "wod"
    })),

    ...state.weeklies.map((weekly) => ({
      ...weekly,
      contentType: "weekly"
    }))
  ]
    .filter(
      (item) =>
        item.status === "À créer" ||
        item.status === "En cours" ||
        item.status === "Prêt"
    )
    .slice(0, 5);

  if (actionTasks.length === 0) {
    actionContainer.innerHTML = `
      <div class="empty-state">
        <span>✅</span>
        <strong>Aucune action en attente</strong>
        <p>Tout est à jour.</p>
      </div>
    `;
    return;
  }

  actionContainer.innerHTML = actionTasks
    .map((item) => {
      let label = "";
      let indicator = "";

      if (item.status === "À créer") {
        label = "À préparer";
        indicator = `<span class="status-line status-à-faire"></span>`;
      } else if (item.status === "En cours") {
        label = "En préparation";
        indicator = `<span class="status-line status-en-cours"></span>`;
      } else if (item.status === "Prêt") {
        label = "Prêt à publier";
        indicator = `<span class="status-line status-prêt"></span>`;
      }

      return `
        <div
          class="dashboard-task"
          data-action-${item.contentType}="${item.id}"
        >
          <span class="task-indicator">
            ${indicator}
            <span class="dashboard-task-status">${label}</span>
          </span>

          <strong class="dashboard-task-title">
            ${escapeHtml(item.name)}
          </strong>

          <span class="dashboard-task-id">
            ${item.id}
          </span>

        </div>
      `;
    })
    .join("");

  const actionButtons =
    actionContainer.querySelectorAll<HTMLElement>(
      "[data-action-wod], [data-action-weekly]"
    );

  actionButtons.forEach((task) => {
    task.addEventListener("click", () => {

      const wodId =
        task.dataset.actionWod;

      const weeklyId =
        task.dataset.actionWeekly;

      if (wodId) {

        deps.showPage("wod");

        setTimeout(() => {

          const viewButton =
            document.querySelector<HTMLButtonElement>(
              `[data-view-wod="${wodId}"]`
            );

          viewButton?.click();

        }, 100);

        return;
      }

      if (weeklyId) {

        deps.showPage("weekly");

        setTimeout(() => {

          const viewButton =
            document.querySelector<HTMLButtonElement>(
              `[data-view-weekly="${weeklyId}"]`
            );

          viewButton?.click();

        }, 100);
      }
    });
  });
}

export function renderDashboardStats() {
  const updateStat = (
    id: string,
    value: number
  ) => {
    const element =
      document.querySelector<HTMLElement>(
        `#${id}`
      );

    if (element) {
      element.textContent =
        String(value);
    }
  };

  const wods = state.wods;
  const weeklies = state.weeklies;

  updateStat(
    "dashboard-wod-total",
    wods.length
  );

  updateStat(
    "dashboard-wod-todo",
    wods.filter(
      (item) => item.status === "À créer"
    ).length
  );

  updateStat(
    "dashboard-wod-progress",
    wods.filter(
      (item) => item.status === "En cours"
    ).length
  );

  updateStat(
    "dashboard-wod-validated",
    wods.filter(
      (item) => item.status === "Prêt"
    ).length
  );

  updateStat(
    "dashboard-wod-published",
    wods.filter(
      (item) => item.status === "Publié"
    ).length
  );

  updateStat(
    "dashboard-weekly-total",
    weeklies.length
  );

  updateStat(
    "dashboard-weekly-todo",
    weeklies.filter(
      (item) => item.status === "À créer"
    ).length
  );

  updateStat(
    "dashboard-weekly-progress",
    weeklies.filter(
      (item) => item.status === "En cours"
    ).length
  );

  updateStat(
    "dashboard-weekly-validated",
    weeklies.filter(
      (item) => item.status === "Prêt"
    ).length
  );

  updateStat(
    "dashboard-weekly-published",
    weeklies.filter(
      (item) => item.status === "Publié"
    ).length
  );
}