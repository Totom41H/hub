import { Weekly, saveWeeklies, getNextWeeklyNumber, incrementNextWeeklyNumber } from "../data/weeklies";
import { state } from "../core/state";
import { escapeHtml } from "../core/utils";
import { notifyHubChange } from "../core/hubRefresh";

let editingWeeklyId: string | null = null;

let showPage: ((pageId: string) => void) | null = null;

export function configureWeeklyModule(deps: {
  showPage: (pageId: string) => void;
}) {
  showPage = deps.showPage;
}

function parseDate(
  value: string
): Date | null {
  if (!value) return null;

  // Format interne : YYYY-MM-DD
  const isoMatch =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (isoMatch) {
    const date =
      new Date(
        Number(isoMatch[1]),
        Number(isoMatch[2]) - 1,
        Number(isoMatch[3])
      );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }

  // Format affiché : JJ/MM/AA
  const frenchMatch =
    value.match(
      /^(\d{2})\/(\d{2})\/(\d{2})$/
    );

  if (frenchMatch) {
    const date =
      new Date(
        2000 + Number(frenchMatch[3]),
        Number(frenchMatch[2]) - 1,
        Number(frenchMatch[1])
      );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }

  return null;
}

function createWeekly(form: HTMLFormElement) {
  const formData = new FormData(form);

  const weekly: Weekly = {
    id: `WEEKLY-${String(getNextWeeklyNumber()).padStart(3, "0")}`,
    
    name: String(
      formData.get("name") ?? ""
    ),

    wodId: String(
      formData.get("wodId") ?? ""
    ),

    date: (() => {
      const value = String(
        formData.get("date") ?? ""
      );

      const parsed = parseDate(value);

      if (!parsed) {
        return value;
      }

      const year =
        parsed.getFullYear();

      const month =
        String(
          parsed.getMonth() + 1
        ).padStart(2, "0");

      const day =
        String(
          parsed.getDate()
        ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    })(),

    description: String(
      formData.get("description") ?? ""
    ),

    score: String(
      formData.get("score") ?? ""
    ),

    production: {
      visual: "À faire",
      text: "À faire",
      publication: "À faire"
    },

    texts: {
      caption: "",
      hashtags: "",
      cta: ""
    },

    status: String(
      formData.get("status") ?? "À créer"
    ),
  };

  state.weeklies.push(weekly);

  incrementNextWeeklyNumber();

  saveWeeklies();

  notifyHubChange();
}

function updateWeekly(form: HTMLFormElement) {
  if (!editingWeeklyId) return;

  const weekly = state.weeklies.find(
    (item) => item.id === editingWeeklyId
  );

  if (!weekly) return;

  const formData = new FormData(form);

  weekly.name = String(
    formData.get("name") ?? ""
  );

  weekly.wodId = String(
    formData.get("wodId") ?? ""
  );

  const dateValue = String(
    formData.get("date") ?? ""
  );

  const parsedDate =
    parseDate(dateValue);

  if (parsedDate) {
    const year =
      parsedDate.getFullYear();

    const month =
      String(
        parsedDate.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        parsedDate.getDate()
      ).padStart(2, "0");

    weekly.date =
      `${year}-${month}-${day}`;
  } else {
    weekly.date =
      dateValue;
  }

  weekly.description = String(
    formData.get("description") ?? ""
  );

  weekly.score = String(
    formData.get("score") ?? ""
  );

  weekly.status = String(
    formData.get("status") ?? "À créer"
  );

  saveWeeklies();

  notifyHubChange();
}

export function setupWeeklyForm() {

  const openButton =
    document.querySelector<HTMLButtonElement>(
      "#open-weekly-form"
    );

  const closeButton =
    document.querySelector<HTMLButtonElement>(
      "#close-weekly-form"
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-weekly-form"
    );

  const formPanel =
    document.querySelector<HTMLElement>(
      "#weekly-form-panel"
    );

  const submitButton =
  document.querySelector<HTMLButtonElement>(
    "#weekly-submit-button"
  );

  const form =
    document.querySelector<HTMLFormElement>(
      "#weekly-form"
    );

  const dateInput =
    document.querySelector<HTMLInputElement>(
      "#weekly-date"
    );

  const datePickerButton =
    document.querySelector<HTMLButtonElement>(
      "#weekly-date-picker-button"
    );

  const calendar =
    document.querySelector<HTMLElement>(
      "#weekly-calendar"
    );

  const calendarMonth =
    document.querySelector<HTMLElement>(
      "#weekly-calendar-month"
    );

  const calendarDays =
    document.querySelector<HTMLElement>(
      "#weekly-calendar-days"
    );

  const calendarPrev =
    document.querySelector<HTMLButtonElement>(
      "#weekly-calendar-prev"
    );

  const calendarNext =
    document.querySelector<HTMLButtonElement>(
      "#weekly-calendar-next"
    );

  const calendarToday =
    document.querySelector<HTMLButtonElement>(
      "#weekly-calendar-today"
    );

  let calendarDate = new Date();
  calendarDate.setDate(1);

  let selectedDate: Date | null = null;

  const monthFormatter =
    new Intl.DateTimeFormat(
      "fr-FR",
      {
        month: "long",
        year: "numeric"
      }
    );

  function formatDate(
    date: Date
  ): string {
    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const year =
      String(
        date.getFullYear()
      ).slice(-2);

    return `${day}/${month}/${year}`;
  }

  function renderWeeklyCalendar() {
    if (
      !calendarMonth ||
      !calendarDays
    ) {
      return;
    }

    calendarMonth.textContent =
      monthFormatter.format(
        calendarDate
      );

    const year =
      calendarDate.getFullYear();

    const month =
      calendarDate.getMonth();

    const firstDay =
      new Date(
        year,
        month,
        1
      );

    const lastDay =
      new Date(
        year,
        month + 1,
        0
      );

    const daysInMonth =
      lastDay.getDate();

    let startDay =
      firstDay.getDay();

    // Lundi = 0 ... Dimanche = 6
    startDay =
      startDay === 0
        ? 6
        : startDay - 1;

    const previousMonthLastDay =
      new Date(
        year,
        month,
        0
      ).getDate();

    let html = "";

    for (
      let i = startDay - 1;
      i >= 0;
      i--
    ) {
      const day =
        previousMonthLastDay - i;

      html += `
        <button
          type="button"
          class="wod-calendar-day is-other-month"
          data-calendar-date="${year}-${String(
            month
          ).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}"
        >
          ${day}
        </button>
      `;
    }

    const today =
      new Date();

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      const currentDate =
        new Date(
          year,
          month,
          day
        );

      const isToday =
        currentDate.toDateString() ===
        today.toDateString();

      const isSelected =
        selectedDate &&
        currentDate.toDateString() ===
          selectedDate.toDateString();

      html += `
        <button
          type="button"
          class="wod-calendar-day${
            isToday
              ? " is-today"
              : ""
          }${
            isSelected
              ? " is-selected"
              : ""
          }"
          data-calendar-date="${year}-${String(
            month + 1
          ).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}"
        >
          ${day}
        </button>
      `;
    }

    const totalCells =
      startDay + daysInMonth;

    const remainingCells =
      totalCells % 7 === 0
        ? 0
        : 7 - (totalCells % 7);

    for (
      let day = 1;
      day <= remainingCells;
      day++
    ) {
      html += `
        <button
          type="button"
          class="wod-calendar-day is-other-month"
          data-calendar-date="${year}-${String(
            month + 2
          ).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}"
        >
          ${day}
        </button>
      `;
    }

    calendarDays.innerHTML =
      html;

    calendarDays
      .querySelectorAll<HTMLButtonElement>(
        "[data-calendar-date]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const value =
              button.dataset
                .calendarDate;

            if (!value) return;

            const date =
              parseDate(value);

            if (!date) return;

            selectedDate =
              date;

            calendarDate =
              new Date(
                date.getFullYear(),
                date.getMonth(),
                1
              );

            if (dateInput) {
              dateInput.value =
                formatDate(date);
            }

            calendar?.classList.add(
              "hidden"
            );

            renderWeeklyCalendar();
          }
        );
      });
  }

  function openWeeklyCalendar() {
    const existingDate =
      dateInput
        ? parseDate(
            dateInput.value
          )
        : null;

    if (existingDate) {
      selectedDate =
        existingDate;

      calendarDate =
        new Date(
          existingDate.getFullYear(),
          existingDate.getMonth(),
          1
        );
    }

    calendar?.classList.remove(
      "hidden"
    );

    renderWeeklyCalendar();
  }

  function closeWeeklyCalendar() {
    calendar?.classList.add(
      "hidden"
    );
  }

  datePickerButton?.addEventListener(
    "click",
    openWeeklyCalendar
  );

  calendarPrev?.addEventListener(
    "click",
    () => {
      calendarDate =
        new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth() - 1,
          1
        );

      renderWeeklyCalendar();
    }
  );

  calendarNext?.addEventListener(
    "click",
    () => {
      calendarDate =
        new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth() + 1,
          1
        );

      renderWeeklyCalendar();
    }
  );

  calendarToday?.addEventListener(
    "click",
    () => {
      const today =
        new Date();

      selectedDate =
        today;

      calendarDate =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );

      if (dateInput) {
        dateInput.value =
          formatDate(today);
      }

      closeWeeklyCalendar();
      renderWeeklyCalendar();
    }
  );

  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target as Node;

      if (
        !calendar?.contains(target) &&
        !dateInput?.contains(target) &&
        !datePickerButton?.contains(target)
      ) {
        closeWeeklyCalendar();
      }
    }
  );

  renderWeeklyCalendar();

  function openForm() {

    editingWeeklyId = null;

    form?.reset();

    populateWeeklyWodSelect();

    const statusSelect =
      form?.querySelector<HTMLSelectElement>(
        '[name="status"]'
      );

    if (statusSelect) {
      statusSelect.value = "À créer";
    }

    if (submitButton) {
      submitButton.textContent = "Créer le Weekly";
    }

    formPanel?.classList.add("visible");

    formPanel?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function closeForm() {
    formPanel?.classList.remove("visible");
  }

  openButton?.addEventListener(
    "click",
    openForm
  );

  closeButton?.addEventListener(
    "click",
    closeForm
  );

  cancelButton?.addEventListener(
    "click",
    closeForm
  );

  form?.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      if (editingWeeklyId) {
        updateWeekly(form);
      } else {
        createWeekly(form);
      }

      form.reset();

      editingWeeklyId = null;

      closeForm();

      renderWeeklies();
    }
  );
}

function populateWeeklyWodSelect(
  selectedWodId: string = ""
) {

  const select =
    document.querySelector<HTMLSelectElement>(
      "#weekly-wod"
    );

  if (!select) return;

  select.innerHTML = `
    <option value="">
      Sélectionner un WOD
    </option>
  `;

  state.wods.forEach((wod) => {

    const option =
      document.createElement("option");

    option.value = wod.id;

    option.textContent =
      `${wod.id} — ${wod.name}`;

    if (wod.id === selectedWodId) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}

export function renderWeeklies(
  weekliesToDisplay: Weekly[] = state.weeklies
) {

  const list =
    document.querySelector<HTMLElement>(
      "#weekly-list"
    );

  const counter =
    document.querySelector<HTMLElement>(
      "#weekly-counter"
    );

  if (!list) return;

  if (counter) {
    counter.textContent =
      `${state.weeklies.length} Weekly${
        state.weeklies.length > 1 ? "s" : ""
      }`;
  }

  if (weekliesToDisplay.length === 0) {

    list.innerHTML = `
      <div class="empty-state">
        <span>🏆</span>
        <strong>Aucun Weekly pour le moment</strong>
        <p>
          Commence par créer ton premier Weekly Challenge.
        </p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    weekliesToDisplay
      .map((weekly) => {

        const wod =
          state.wods.find(
            (item) => item.id === weekly.wodId
          );

        return `
          <div class="wod-card">

            <div class="wod-card-id">
              ${weekly.id}
            </div>

            <div class="wod-card-main">

              <strong>
                ${escapeHtml(weekly.name)}
              </strong>

              <span>
               ${
                  wod
                    ? `${wod.id} — ${escapeHtml(wod.name)}`
                    : "WOD non trouvé"
                }
              </span>

            </div>

            <div
              class="wod-card-status"
              data-weekly-status="${weekly.id}"
            >
              ${escapeHtml(weekly.status)}
            </div>

            <div class="wod-card-actions">

              <button
                class="wod-edit-button wod-view-button"
                data-view-weekly="${weekly.id}"
              >
                Voir
              </button>

              <button
                class="wod-edit-button"
                data-edit-weekly="${weekly.id}"
              >
                Modifier
              </button>

              <button
                class="wod-delete-button"
                data-delete-weekly="${weekly.id}"
              >
                Supprimer
              </button>

            </div>

          </div>
        `;
      })
      .join("");

  setupWeeklyViewButtons();
  setupWeeklyEditButtons();
  setupWeeklyDeleteButtons();
}

export function setupWeeklyViewButtons() {

  const buttons =
    document.querySelectorAll<HTMLButtonElement>(
      "[data-view-weekly]"
    );

  const modal =
    document.querySelector<HTMLElement>(
      "#weekly-detail-modal"
    );

  const overlay =
    document.querySelector<HTMLElement>(
      "#weekly-detail-overlay"
    );

  const title =
    document.querySelector<HTMLElement>(
      "#weekly-detail-title"
    );
  
  const detailId =
    document.querySelector<HTMLElement>(
      "#weekly-detail-id"
    );

  const detailStatus =
    document.querySelector<HTMLElement>(
      "#weekly-detail-status"
    );

  const content =
    document.querySelector<HTMLElement>(
      "#weekly-detail-content"
    );

  if (
    !modal ||
    !overlay ||
    !title ||
    !content ||
    !detailId ||
    !detailStatus
  ) {
    return;
  }

  function closeModal() {
    modal?.classList.add("hidden");
  }

  function getProductionStatusClass(
    status: string
  ) {

    if (status === "Terminé") {
      return "production-status-done";
    }

    if (status === "En cours") {
      return "production-status-progress";
    }

    return "production-status-todo";
  }

  function updateWeeklyProduction(
    weekly: Weekly,
    task: "visual" | "text" | "publication"
  ) {

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

    return nextState;
  }

  function openWeekly(weeklyId: string) {

    const weekly =
      state.weeklies.find(
        (item) => item.id === weeklyId
      );

    if (!weekly) return;

    const wod =
      state.wods.find(
        (item) => item.id === weekly.wodId
      );

    const formattedDate =
      weekly.date
        ? new Date(
            `${weekly.date}T00:00:00`
          ).toLocaleDateString(
            "fr-FR"
          )
        : "-";

    detailId!.textContent =
      weekly.id;

    title!.textContent =
      weekly.name;

    detailStatus!.textContent =
      weekly.status;

    detailStatus!.className =
      `weekly-detail-status ${
        getProductionStatusClass(
          weekly.status === "Prêt"
            ? "Terminé"
            : weekly.status === "En cours"
            ? "En cours"
            : "À faire"
        )
      }`;

    content!.innerHTML = `

      <div class="weekly-detail-section">

        <span class="weekly-detail-section-title">
          INFORMATIONS
        </span>

        <div class="weekly-detail-info-grid">

          <div class="weekly-detail-info-item">
            <span>WOD ASSOCIÉ</span>
            <strong>
              ${
                wod
                  ? `${wod.id} — ${escapeHtml(wod.name)}`
                  : "WOD non trouvé"
              }
            </strong>
          </div>

          <div class="weekly-detail-info-item">
            <span>DATE</span>
            <strong>
              ${formattedDate}
            </strong>
          </div>

          <div class="weekly-detail-info-item">
            <span>SCORE</span>
            <strong>
              ${escapeHtml(
                weekly.score || "-"
              )}
            </strong>
          </div>

        </div>

      </div>

      <div class="weekly-detail-section">

        <span class="weekly-detail-section-title">
          RÈGLES / DESCRIPTION
        </span>

        <p class="weekly-detail-description">
          ${
            escapeHtml(
              weekly.description ||
              "Aucune description renseignée."
            )
          }
        </p>

      </div>

      <div class="weekly-detail-section">

        <span class="weekly-detail-section-title">
          PRODUCTION
        </span>

        <div class="weekly-detail-production-list">

          <div
            class="weekly-detail-production-item"
            data-detail-weekly-production-task="visual"
            data-detail-weekly-id="${escapeHtml(
              weekly.id
            )}"
          >
            <span>
              VISUEL
            </span>

            <strong
              class="${getProductionStatusClass(
                weekly.production.visual
              )}"
            >
              ${escapeHtml(
                weekly.production.visual
              )}
            </strong>
          </div>

          <div
            class="weekly-detail-production-item"
            data-detail-weekly-production-task="text"
            data-detail-weekly-id="${escapeHtml(
              weekly.id
            )}"
          >
            <span>
              TEXTE
            </span>

            <strong
              class="${getProductionStatusClass(
                weekly.production.text
              )}"
            >
              ${escapeHtml(
                weekly.production.text
              )}
            </strong>

            <button
              type="button"
              class="weekly-detail-text-edit"
              data-open-weekly-text="${escapeHtml(
                weekly.id
              )}"
              title="Modifier le texte"
              aria-label="Modifier le texte"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          </div>

          <div
            class="weekly-detail-production-item"
            data-detail-weekly-production-task="publication"
            data-detail-weekly-id="${escapeHtml(
              weekly.id
            )}"
          >
            <span>
              PUBLICATION
            </span>

            <strong
              class="${getProductionStatusClass(
                weekly.production.publication
              )}"
            >
              ${escapeHtml(
                weekly.production.publication
              )}
            </strong>
          </div>

        </div>

      </div>

    `;

    modal?.classList.remove("hidden");
  }

  /* =========================
     BOUTONS VOIR
  ========================= */

  buttons.forEach((button) => {

    button.onclick = () => {

      const weeklyId =
        button.dataset.viewWeekly;

      if (!weeklyId) return;

      openWeekly(weeklyId);
    };

  });

/* =========================
   MODIFICATION DU TEXTE
========================= */

const textEditButton =
  content.querySelector<HTMLButtonElement>(
    "[data-open-weekly-text]"
  );

if (textEditButton) {

  textEditButton.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      const weeklyId =
        textEditButton.dataset
          .openWeeklyText;

      if (!weeklyId || !showPage) return;

      modal.classList.add("hidden");

      showPage("texts");

      setTimeout(() => {

        const textCard =
          document.querySelector<HTMLElement>(
            `[data-text-type="weekly"][data-text-id="${weeklyId}"]`
          );

        textCard?.click();

      }, 100);

    }
  );

}

  /* =========================
     PRODUCTION DANS LA FICHE
  ========================= */

  content.onclick = (event) => {

    const target =
      event.target as HTMLElement;

    const taskItem =
      target.closest<HTMLElement>(
        "[data-detail-weekly-production-task]"
      );

    if (!taskItem) return;

    const weeklyId =
      taskItem.dataset.detailWeeklyId;

    const task =
      taskItem.dataset
        .detailWeeklyProductionTask as
        | "visual"
        | "text"
        | "publication"
        | undefined;

    if (!weeklyId || !task) return;

    const weekly =
      state.weeklies.find(
        (item) => item.id === weeklyId
      );

    if (!weekly) return;

    const nextState =
      updateWeeklyProduction(
        weekly,
        task
      );

    const taskStatusElement =
      taskItem.querySelector<HTMLElement>(
        "strong"
      );

    if (taskStatusElement) {

      taskStatusElement.textContent =
        nextState;

      taskStatusElement.className =
        getProductionStatusClass(
          nextState
        );
    }

    detailStatus!.textContent =
      weekly.status;

    const weeklyCardStatus =
      document.querySelector<HTMLElement>(
        `[data-weekly-status="${weekly.id}"]`
      );

    if (weeklyCardStatus) {

      weeklyCardStatus.textContent =
        weekly.status;
    }

  };

  /* =========================
     FERMETURE
  ========================= */

  overlay.onclick =
    closeModal;
}

function setupWeeklyEditButtons() {

  const buttons =
    document.querySelectorAll<HTMLButtonElement>(
      "[data-edit-weekly]"
    );

  buttons.forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const weeklyId =
          button.dataset.editWeekly;

        if (!weeklyId) return;

        const weekly =
          state.weeklies.find(
            (item) => item.id === weeklyId
          );

        if (!weekly) return;

        editingWeeklyId = weekly.id;

        const form =
          document.querySelector<HTMLFormElement>(
            "#weekly-form"
          );

        const formPanel =
          document.querySelector<HTMLElement>(
            "#weekly-form-panel"
          );

        if (!form) return;

        populateWeeklyWodSelect(
          weekly.wodId
        );

        const setValue = (
          name: string,
          value: string
        ) => {

          const input =
            form.querySelector<
              HTMLInputElement |
              HTMLTextAreaElement |
              HTMLSelectElement
            >(
              `[name="${name}"]`
            );

          if (input) {
            input.value = value;
          }
        };

        setValue(
          "name",
          weekly.name
        );

        setValue(
          "wodId",
          weekly.wodId
        );

        const parsedDate = parseDate(
          weekly.date
        );

        const formattedDate = parsedDate
          ? `${String(
              parsedDate.getDate()
            ).padStart(2, "0")}/${String(
              parsedDate.getMonth() + 1
            ).padStart(2, "0")}/${String(
              parsedDate.getFullYear()
            ).slice(-2)}`
          : weekly.date;

        setValue(
          "date",
          formattedDate
        );

        setValue(
          "description",
          weekly.description
        );

        setValue(
          "score",
          weekly.score
        );

        setValue(
          "status",
          weekly.status
        );

        formPanel?.classList.add(
          "visible"
        );

        formPanel?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    );
  });
}

function setupWeeklyDeleteButtons() {

  const buttons =
    document.querySelectorAll<HTMLButtonElement>(
      "[data-delete-weekly]"
    );

  buttons.forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const weeklyId =
          button.dataset.deleteWeekly;

        if (!weeklyId) return;

        const weekly =
          state.weeklies.find(
            (item) => item.id === weeklyId
          );

        if (!weekly) return;

        const confirmed =
          window.confirm(
            `Supprimer le ${weekly.id} "${weekly.name}" ?\n\nCette action est irréversible.`
          );

        if (!confirmed) return;

        const index =
          state.weeklies.findIndex(
            (item) => item.id === weeklyId
          );

        if (index === -1) return;

        state.weeklies.splice(index, 1);

        saveWeeklies();

        notifyHubChange();
      }
    );
  });
}

export function setupWeeklyFilters() {

  const search =
    document.querySelector<HTMLInputElement>(
      "#weekly-search"
    );

  const statusFilter =
    document.querySelector<HTMLSelectElement>(
      "#weekly-status-filter"
    );

  function applyFilters() {

    const searchValue =
      search?.value
        .toLowerCase()
        .trim() ?? "";

    const statusValue =
      statusFilter?.value ?? "";

    const filteredWeeklies =
      state.weeklies.filter((weekly) => {

        const matchesSearch =
          weekly.name
            .toLowerCase()
            .includes(searchValue) ||
          weekly.id
            .toLowerCase()
            .includes(searchValue) ||
          weekly.wodId
            .toLowerCase()
            .includes(searchValue);

        const matchesStatus =
          !statusValue ||
          weekly.status === statusValue;

        return (
          matchesSearch &&
          matchesStatus
        );
      });

    renderWeeklies(
      filteredWeeklies
    );
  }

  search?.addEventListener(
    "input",
    applyFilters
  );

  statusFilter?.addEventListener(
    "change",
    applyFilters
  );
}
