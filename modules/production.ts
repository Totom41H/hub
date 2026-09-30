import { saveWods } from "../data/wods";
import { saveWeeklies } from "../data/weeklies";
import { state } from "../core/state";
import { escapeHtml } from "../core/utils";
import { openPath } from "@tauri-apps/plugin-opener";
import { exists } from "@tauri-apps/plugin-fs";
import { notifyHubChange } from "../core/hubRefresh";
import { setupWeeklyViewButtons } from "./weeklies";

async function wodVisualExists(wodId: string): Promise<boolean> {
  const visualPath =
    `C:\\Users\\tom12\\Desktop\\STRNZ\\CONTENU\\WODS\\${wodId}\\${wodId}.png`;

  try {
    return await exists(visualPath);
  } catch (error) {
    console.error(
      `Impossible de vérifier le visuel de ${wodId} :`,
      error
    );

    return false;
  }
}

async function wodTextExists(wodId: string): Promise<boolean> {
  const textPath =
    `C:\\Users\\tom12\\Desktop\\STRNZ\\CONTENU\\WODS\\${wodId}\\${wodId}.txt`;

  try {
    return await exists(textPath);
  } catch (error) {
    console.error(
      `Impossible de vérifier le texte de ${wodId} :`,
      error
    );

    return false;
  }
}

async function weeklyVisualExists(
  weeklyId: string
): Promise<boolean> {
  const path =
    `C:\\Users\\tom12\\Desktop\\STRNZ\\CONTENU\\WEEKLIES\\${weeklyId}\\${weeklyId}.png`;

  return await exists(path);
}

async function weeklyTextExists(
  weeklyId: string
): Promise<boolean> {
  const path =
    `C:\\Users\\tom12\\Desktop\\STRNZ\\CONTENU\\WEEKLIES\\${weeklyId}\\${weeklyId}.txt`;

  return await exists(path);
}

async function updateVisualFileIndicators(): Promise<void> {
  const buttons =
    document.querySelectorAll<HTMLButtonElement>(
      "[data-open-wod-folder], [data-open-weekly-folder]"
    );

  for (const button of buttons) {
    const wodId =
      button.dataset.openWodFolder;

    const weeklyId =
      button.dataset.openWeeklyFolder;

    if (!wodId && !weeklyId) continue;

    const contentId =
      wodId ?? weeklyId!;

    const visualExists =
      wodId
        ? await wodVisualExists(wodId)
        : await weeklyVisualExists(weeklyId!);

    const textExists =
      wodId
        ? await wodTextExists(wodId)
        : await weeklyTextExists(weeklyId!);

    const parent =
      button.parentElement;

    if (!parent) continue;

    parent
      .querySelectorAll(
        `[data-file-indicator="${contentId}"]`
      )
      .forEach((indicator) => {
        indicator.remove();
      });

    const visualIndicator =
      document.createElement("span");

    visualIndicator.dataset.fileIndicator =
      contentId;

    visualIndicator.className =
      `production-file-indicator ${
        visualExists ? "exists" : "missing"
      }`;

    visualIndicator.title = visualExists
      ? `${contentId}.png trouvé`
      : `${contentId}.png absent`;

    const textIndicator =
      document.createElement("span");

    textIndicator.dataset.fileIndicator =
      contentId;

    textIndicator.className =
      `production-file-indicator ${
        textExists ? "exists" : "missing"
      }`;

    textIndicator.title = textExists
      ? `${contentId}.txt trouvé`
      : `${contentId}.txt absent`;

    parent.appendChild(
      visualIndicator
    );

    parent.appendChild(
      textIndicator
    );
  }
}

export function renderProduction() {

  const productionList =
    document.querySelector<HTMLElement>("#production-list");

  const productionTodo =
    document.querySelector<HTMLElement>("#production-todo");

  const productionProgress =
    document.querySelector<HTMLElement>("#production-progress");

  const productionReady =
    document.querySelector<HTMLElement>("#production-ready");

  const productionPublished =
    document.querySelector<HTMLElement>("#production-published");

  if (!productionList) return;


  /* =========================
     COMPTEURS WOD + WEEKLY
  ========================= */

  const allContents = [
    ...state.wods,
    ...state.weeklies
  ];

  const todoContents = allContents.filter(
    (item) => item.status === "À créer"
  );

  const progressContents = allContents.filter(
    (item) => item.status === "En cours"
  );

  const readyContents = allContents.filter(
    (item) => item.status === "Prêt"
  );

  const publishedContents = allContents.filter(
    (item) => item.status === "Publié"
  );

  if (productionTodo) {
    productionTodo.textContent =
      String(todoContents.length);
  }

  if (productionProgress) {
    productionProgress.textContent =
      String(progressContents.length);
  }

  if (productionReady) {
    productionReady.textContent =
      String(readyContents.length);
  }

  if (productionPublished) {
    productionPublished.textContent =
      String(publishedContents.length);
  }


  /* =========================
     FILTRES
  ========================= */

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#production-search"
    );

  const statusFilter =
    document.querySelector<HTMLSelectElement>(
      "#production-status-filter"
    );

  const progressFilter =
    document.querySelector<HTMLSelectElement>(
      "#production-progress-filter"
    );

  const search =
    searchInput?.value.trim().toLowerCase() ?? "";

  const selectedStatus =
    statusFilter?.value ?? "";

  const selectedProgress =
    progressFilter?.value ?? "";


  /* =========================
     WODS
  ========================= */

  const productionWods = state.wods.filter((wod) => {

    if (wod.status === "Publié") {
      return false;
    }

    const matchesSearch =
      wod.name.toLowerCase().includes(search) ||
      wod.id.toLowerCase().includes(search);

    const matchesStatus =
      !selectedStatus ||
      wod.status === selectedStatus;

    const completedTasks = [
      wod.production.visual,
      wod.production.text,
      wod.production.publication
    ].filter(
      (state) => state === "Terminé"
    ).length;

    const matchesProgress =
      !selectedProgress ||
      completedTasks === Number(selectedProgress);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProgress
    );
  });


  /* =========================
     WEEKLY
  ========================= */

  const productionWeeklies = state.weeklies.filter((weekly) => {

    if (weekly.status === "Publié") {
      return false;
    }

    const matchesSearch =
      weekly.name.toLowerCase().includes(search) ||
      weekly.id.toLowerCase().includes(search);

    const matchesStatus =
      !selectedStatus ||
      weekly.status === selectedStatus;

    const completedTasks = [
      weekly.production.visual,
      weekly.production.text,
      weekly.production.publication
    ].filter(
      (state) => state === "Terminé"
    ).length;

    const matchesProgress =
      !selectedProgress ||
      completedTasks === Number(selectedProgress);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProgress
    );
  });


  /* =========================
     AUCUN CONTENU
  ========================= */

  if (
    productionWods.length === 0 &&
    productionWeeklies.length === 0
  ) {

    productionList.innerHTML = `
      <div class="empty-state">
        <span>🎨</span>
        <strong>Aucun contenu à produire</strong>
        <p>Les contenus liés aux WOD et Weekly apparaîtront ici.</p>
      </div>
    `;

    return;
  }


  /* =========================
     HTML WOD
  ========================= */

  const wodHtml = productionWods
    .map((wod) => {

      const completedTasks = [
        wod.production.visual,
        wod.production.text,
        wod.production.publication
      ].filter(
        (state) => state === "Terminé"
      ).length;

      const productionProgressPercent =
        (completedTasks / 3) * 100;

      const levels = wod.levels
        .map((level) => {

          if (level === "BEGINNER") {
            return `<span class="level-dot level-beginner"></span>`;
          }

          if (level === "INTERMEDIATE") {
            return `<span class="level-dot level-intermediate"></span>`;
          }

          if (level === "ADVANCED") {
            return `<span class="level-dot level-advanced"></span>`;
          }

          return "";
        })
        .join("");

      return `
        <div class="production-card">

          <div class="production-card-header">

            <div class="production-card-info">

              <div class="production-card-id">
                ${wod.id}
              </div>

              <strong class="production-card-title">
                ${escapeHtml(wod.name)}
              </strong>

              <div class="production-card-meta">

                <span>${escapeHtml(wod.type)}</span>

                ${
                  wod.duration
                    ? `<span>· ${escapeHtml(wod.duration)}</span>`
                    : ""
                }

                <span class="production-card-levels">
                  ${levels}
                </span>

              </div>

            </div>

            <div class="production-card-status">
              ${escapeHtml(wod.status)}
            </div>

          </div>


          <div class="production-bottom-row">

            <div class="production-card-tasks">

              <button
                class="production-task production-task-${wod.production.visual.toLowerCase().replace(" ", "-")}"
                data-production-task="visual"
                data-production-wod="${wod.id}"
              >
                <span>Visuel</span>
                <small>${escapeHtml(wod.production.visual)}</small>
              </button>

              <button
                class="production-task production-task-${wod.production.text.toLowerCase().replace(" ", "-")}"
                data-production-task="text"
                data-production-wod="${wod.id}"
              >
                <span>Texte</span>
                <small>${escapeHtml(wod.production.text)}</small>
              </button>

              <button
                class="production-task production-task-${wod.production.publication.toLowerCase().replace(" ", "-")}"
                data-production-task="publication"
                data-production-wod="${wod.id}"
              >
                <span>Publication</span>
                <small>${escapeHtml(wod.production.publication)}</small>
              </button>

              <button
                type="button"
                class="production-file-button"
                data-open-wod-folder="${wod.id}"
                title="Ouvrir le dossier du WOD"
                aria-label="Ouvrir le dossier du WOD"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-11Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M4.5 8h15"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>

            </div>


            <div class="production-progress">

              <div class="production-progress-header">
                <span>Production</span>
                <strong>${completedTasks}/3</strong>
              </div>

              <div class="production-progress-bar">
                <div
                  class="production-progress-fill"
                  style="width: ${productionProgressPercent}%"
                ></div>
              </div>

            </div>


            <div class="production-card-actions">

              <button
                class="wod-edit-button wod-view-button"
                data-production-wod="${wod.id}"
              >
                Voir
              </button>

              ${
                wod.status === "Prêt"
                  ? `
                    <button
                      class="wod-edit-button production-publish-button"
                      data-publish-wod="${wod.id}"
                    >
                      Publier
                    </button>
                  `
                  : ""
              }

            </div>

          </div>

        </div>
      `;
    })
    .join("");


  /* =========================
     HTML WEEKLY
  ========================= */

  const weeklyHtml = productionWeeklies
    .map((weekly) => {

      const completedTasks = [
        weekly.production.visual,
        weekly.production.text,
        weekly.production.publication
      ].filter(
        (state) => state === "Terminé"
      ).length;

      const productionProgressPercent =
        (completedTasks / 3) * 100;

      return `
        <div class="production-card">

          <div class="production-card-header">

            <div class="production-card-info">

              <div class="production-card-id">
                ${weekly.id}
              </div>

              <strong class="production-card-title">
                ${escapeHtml(weekly.name)}
              </strong>

              <div class="production-card-meta">

                <span>Weekly</span>

                ${
                  weekly.date
                    ? `<span>· ${escapeHtml(weekly.date)}</span>`
                    : ""
                }

              </div>

            </div>

            <div class="production-card-status">
              ${escapeHtml(weekly.status)}
            </div>

          </div>


          <div class="production-bottom-row">

            <div class="production-card-tasks">

              <button
                class="production-task production-task-${weekly.production.visual.toLowerCase().replace(" ", "-")}"
                data-production-task="visual"
                data-production-weekly="${weekly.id}"
              >
                <span>Visuel</span>
                <small>${escapeHtml(weekly.production.visual)}</small>
              </button>

              <button
                class="production-task production-task-${weekly.production.text.toLowerCase().replace(" ", "-")}"
                data-production-task="text"
                data-production-weekly="${weekly.id}"
              >
                <span>Texte</span>
                <small>${escapeHtml(weekly.production.text)}</small>
              </button>

              <button
                class="production-task production-task-${weekly.production.publication.toLowerCase().replace(" ", "-")}"
                data-production-task="publication"
                data-production-weekly="${weekly.id}"
              >
                <span>Publication</span>
                <small>${escapeHtml(weekly.production.publication)}</small>
              </button>

              <button
                type="button"
                class="production-file-button"
                data-open-weekly-folder="${weekly.id}"
                title="Ouvrir le dossier du Weekly"
                aria-label="Ouvrir le dossier du Weekly"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-11Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M4.5 8h15"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>

            </div>


            <div class="production-progress">

              <div class="production-progress-header">
                <span>Production</span>
                <strong>${completedTasks}/3</strong>
              </div>

              <div class="production-progress-bar">
                <div
                  class="production-progress-fill"
                  style="width: ${productionProgressPercent}%"
                ></div>
              </div>

            </div>


            <div class="production-card-actions">

              <button
                class="wod-edit-button wod-view-button"
                data-view-weekly="${weekly.id}"
              >
                Voir
              </button>

              ${
                weekly.status === "Prêt"
                  ? `
                    <button
                      class="wod-edit-button production-publish-button"
                      data-production-publish-weekly="${weekly.id}"
                    >
                      Publier
                    </button>
                  `
                  : ""
              }

            </div>

          </div>

        </div>
      `;
    })
    .join("");


  /* =========================
     AFFICHAGE
  ========================= */

  productionList.innerHTML = `
    <div class="production-items">
      ${wodHtml}
      ${weeklyHtml}
    </div>
  `;

  setupWeeklyViewButtons();

  void updateVisualFileIndicators();

  console.log(productionList.innerHTML);

}

export function setupProductionFilters() {

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#production-search"
    );

  const statusFilter =
    document.querySelector<HTMLSelectElement>(
      "#production-status-filter"
    );

  const progressFilter =
    document.querySelector<HTMLSelectElement>(
      "#production-progress-filter"
    );

  searchInput?.addEventListener(
    "input",
    renderProduction
  );

  statusFilter?.addEventListener(
    "change",
    renderProduction
  );

  progressFilter?.addEventListener(
    "change",
    renderProduction
  );
}

export function setupProductionTasks() {

  const productionList =
    document.querySelector<HTMLElement>("#production-list");

  if (!productionList) return;

  productionList.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    const button =
      target.closest<HTMLButtonElement>(
        "[data-open-wod-folder], [data-open-weekly-folder]"
      );

    if (!button) return;

    const wodId =
      button.dataset.openWodFolder;

    const weeklyId =
      button.dataset.openWeeklyFolder;

    if (!wodId && !weeklyId) return;

    const folderPath = wodId
      ? `C:\\Users\\tom12\\Desktop\\STRNZ\\CONTENU\\WODS\\${wodId}`
      : `C:\\Users\\tom12\\Desktop\\STRNZ\\CONTENU\\WEEKLIES\\${weeklyId}`;

    try {
      await openPath(folderPath);
    } catch (error) {
      console.error(
        wodId
          ? "Impossible d'ouvrir le dossier du WOD :"
          : "Impossible d'ouvrir le dossier du Weekly :",
        error
      );
    }
  });

  productionList.onclick = (event) => {

    const target = event.target as HTMLElement;

    const taskButton =
      target.closest<HTMLButtonElement>(
        "[data-production-task]"
      );

    if (!taskButton) return;

    const task =
      taskButton.dataset.productionTask as
        | "visual"
        | "text"
        | "publication"
        | undefined;

    if (!task) return;

    const wodId =
      taskButton.dataset.productionWod;

    const weeklyId =
      taskButton.dataset.productionWeekly;


    /* =========================
       WOD
    ========================= */

    if (wodId) {

      const wod =
        state.wods.find(
          (item) => item.id === wodId
        );

      if (!wod) return;

      const currentState =
        wod.production[task];

      let nextState = "À faire";

      if (currentState === "À faire") {
        nextState = "En cours";
      } else if (currentState === "En cours") {
        nextState = "Terminé";
      }

      wod.production[task] = nextState;

      const productionStates = [
        wod.production.visual,
        wod.production.text,
        wod.production.publication
      ];

      const allDone =
        productionStates.every(
          (state) => state === "Terminé"
        );

      const anyStarted =
        productionStates.some(
          (state) =>
            state === "En cours" ||
            state === "Terminé"
        );

      if (allDone) {
        wod.status = "Prêt";
      } else if (anyStarted) {
        wod.status = "En cours";
      } else {
        wod.status = "À créer";
      }

      saveWods();
      notifyHubChange();

      return;
    }


    /* =========================
       WEEKLY
    ========================= */

    if (weeklyId) {

      const weekly =
        state.weeklies.find(
          (item) => item.id === weeklyId
        );

      if (!weekly) return;

      const currentState =
        weekly.production[task];

      let nextState = "À faire";

      if (currentState === "À faire") {
        nextState = "En cours";
      } else if (currentState === "En cours") {
        nextState = "Terminé";
      }

      weekly.production[task] = nextState;

      const productionStates = [
        weekly.production.visual,
        weekly.production.text,
        weekly.production.publication
      ];

      const allDone =
        productionStates.every(
          (state) => state === "Terminé"
        );

      const anyStarted =
        productionStates.some(
          (state) =>
            state === "En cours" ||
            state === "Terminé"
        );

      if (allDone) {
        weekly.status = "Prêt";
      } else if (anyStarted) {
        weekly.status = "En cours";
      } else {
        weekly.status = "À créer";
      }

      saveWeeklies();
      notifyHubChange();
    }
  };
}

export function setupProductionPublish() {

  const productionList =
    document.querySelector<HTMLElement>(
      "#production-list"
    );

  if (!productionList) return;

  productionList.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    const publishButton =
      target.closest<HTMLButtonElement>(
        "[data-publish-wod], [data-production-publish-weekly]"
      );

    if (!publishButton) return;


    /* =========================
       WOD
    ========================= */

    const wodId =
      publishButton.dataset.publishWod;

    if (wodId) {

      const wod =
        state.wods.find(
          (item) => item.id === wodId
        );

      if (!wod) return;

      wod.status = "Publié";

      saveWods();
      notifyHubChange();

      return;
    }


    /* =========================
       WEEKLY
    ========================= */

    const weeklyId =
      publishButton.dataset.productionPublishWeekly;

    if (weeklyId) {

      const weekly =
        state.weeklies.find(
          (item) => item.id === weeklyId
        );

      if (!weekly) return;

      weekly.status = "Publié";

      console.log("WEEKLY APRÈS PUBLICATION :", weekly.id, weekly.status);

      saveWeeklies();
      notifyHubChange();

    }
  });
}
