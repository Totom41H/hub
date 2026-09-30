import {
  Wod,
  WodLevelExercise,
  WodUnit,
  saveWods,
  getNextWodNumber,
  incrementNextWodNumber
} from "../data/wods";

import { state } from "../core/state";
import { escapeHtml } from "../core/utils";
import { exercises } from "../data/exercises";
import { notifyHubChange } from "../core/hubRefresh";

let editingWodId: string | null = null;

let selectedWodExercises: string[] = [];

let wodPrescriptions: {
  BEGINNER: WodLevelExercise[];
  INTERMEDIATE: WodLevelExercise[];
  ADVANCED: WodLevelExercise[];
} = {
  BEGINNER: [],
  INTERMEDIATE: [],
  ADVANCED: []
};

/* =========================================================
   UTILITAIRES
========================================================= */

function createEmptyPrescription(
  exerciseId: string
): WodLevelExercise {
  return {
    exerciseId,
    value: "",
    unit: "reps",
    notes: ""
  };
}

function syncWodPrescriptions(): void {
  const levels = [
    "BEGINNER",
    "INTERMEDIATE",
    "ADVANCED"
  ] as const;

  for (const level of levels) {
    const current = wodPrescriptions[level];

    wodPrescriptions[level] =
      selectedWodExercises.map((exerciseId) => {
        const existing = current.find(
          (item) =>
            item.exerciseId === exerciseId
        );

        return existing
          ? { ...existing }
          : createEmptyPrescription(exerciseId);
      });
  }
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

/* =========================================================
   CRÉATION
========================================================= */

function createWod(
  form: HTMLFormElement
) {
  const formData = new FormData(form);

  const levels: string[] = [];

  if (formData.get("beginner")) {
    levels.push("BEGINNER");
  }

  if (formData.get("intermediate")) {
    levels.push("INTERMEDIATE");
  }

  if (formData.get("advanced")) {
    levels.push("ADVANCED");
  }

  const wod: Wod = {
    id: `WOD-${String(getNextWodNumber()).padStart(3, "0")}`,

    name: String(formData.get("name") ?? ""),

    type: String(formData.get("type") ?? ""),

    focal: String(formData.get("focal") ?? ""),

    duration: String(formData.get("duration") ?? ""),

    equipment: String(formData.get("equipment") ?? ""),

    exercises: [...selectedWodExercises],

    prescriptions: {
      BEGINNER:
        wodPrescriptions.BEGINNER.map(
          (item) => ({ ...item })
        ),

      INTERMEDIATE:
        wodPrescriptions.INTERMEDIATE.map(
          (item) => ({ ...item })
        ),

      ADVANCED:
        wodPrescriptions.ADVANCED.map(
          (item) => ({ ...item })
        )
    },

    levels,

    score: String(formData.get("score") ?? ""),

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

    status: String(formData.get("status") ?? "À créer"),

    production: {
      visual: "À faire",
      text: "À faire",
      publication: "À faire"
    },

    texts: {
      caption: "",
      hashtags: "",
      cta: ""
    }
  };

  state.wods.push(wod);

  incrementNextWodNumber();

  saveWods();

  notifyHubChange();
}

/* =========================================================
   MODIFICATION
========================================================= */

function updateWod(
  form: HTMLFormElement
) {
  if (!editingWodId) return;

  const wod = state.wods.find(
    (item) =>
      item.id === editingWodId
  );

  if (!wod) return;

  const formData = new FormData(form);

  const levels: string[] = [];

  if (formData.get("beginner")) {
    levels.push("BEGINNER");
  }

  if (formData.get("intermediate")) {
    levels.push("INTERMEDIATE");
  }

  if (formData.get("advanced")) {
    levels.push("ADVANCED");
  }

  wod.name = String(
    formData.get("name") ?? ""
  );

  wod.type = String(
    formData.get("type") ?? ""
  );

  wod.focal = String(
    formData.get("focal") ?? ""
  );

  wod.duration = String(
    formData.get("duration") ?? ""
  );

  wod.equipment = String(
    formData.get("equipment") ?? ""
  );

  wod.exercises = [
    ...selectedWodExercises
  ];

  wod.prescriptions = {
    BEGINNER:
      wodPrescriptions.BEGINNER.map(
        (item) => ({ ...item })
      ),

    INTERMEDIATE:
      wodPrescriptions.INTERMEDIATE.map(
        (item) => ({ ...item })
      ),

    ADVANCED:
      wodPrescriptions.ADVANCED.map(
        (item) => ({ ...item })
      )
  };

  wod.levels = levels;

  wod.score = String(
    formData.get("score") ?? ""
  );

  const dateValue = String(
    formData.get("date") ?? ""
  );

  const parsedDate = parseDate(
    dateValue
  );

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

    wod.date =
      `${year}-${month}-${day}`;
  } else {
    wod.date = dateValue;
  }

  wod.status = String(
    formData.get("status") ?? "À créer"
  );

  saveWods();

  notifyHubChange();
}

/* =========================================================
   SÉLECTEUR DE STRUCTURE DU WOD
========================================================= */

function renderWodExerciseSelector() {
  const search =
    document.querySelector<HTMLInputElement>(
      "#wod-exercise-search"
    );

  const list =
    document.querySelector<HTMLElement>(
      "#wod-exercise-list"
    );

  const selectedList =
    document.querySelector<HTMLElement>(
      "#wod-selected-exercises"
    );

  if (!list || !selectedList) return;

  const searchValue =
    search?.value
      .toLowerCase()
      .trim() ?? "";

  const availableExercises =
    exercises.filter((exercise) => {
      if (!exercise.active) {
        return false;
      }

      return (
        exercise.name
          .toLowerCase()
          .includes(searchValue) ||
        exercise.bodyParts.some(
          (part) =>
            part
              .toLowerCase()
              .includes(searchValue)
        )
      );
    });

  list.innerHTML =
    availableExercises.length > 0
      ? availableExercises
          .map((exercise) => {
            const selected =
              selectedWodExercises.includes(
                exercise.id
              );

            return `
              <button
                type="button"
                class="wod-exercise-option ${
                  selected
                    ? "selected"
                    : ""
                }"
                data-wod-exercise="${escapeHtml(
                  exercise.id
                )}"
              >
                <span>
                  ${escapeHtml(
                    exercise.name
                  )}
                </span>

                <small>
                  ${exercise.bodyParts
                    .map((part) =>
                      escapeHtml(part)
                    )
                    .join(" · ")}
                </small>
              </button>
            `;
          })
          .join("")
      : `
        <div class="empty-state">
          <strong>
            Aucun exercice trouvé
          </strong>
        </div>
      `;

  selectedList.innerHTML =
    selectedWodExercises.length > 0
      ? selectedWodExercises
          .map(
            (
              exerciseId,
              index
            ) => {
              const exercise =
                exercises.find(
                  (item) =>
                    item.id ===
                    exerciseId
                );

              if (!exercise) {
                return "";
              }

              return `
                <div
                  class="wod-selected-exercise"
                  data-selected-index="${index}"
                >

                  <div class="wod-selected-header">

                    <strong>
                      ${index + 1}.
                      ${escapeHtml(
                        exercise.name
                      )}
                    </strong>

                    <div class="wod-selected-actions">

                        <button
                        type="button"
                        data-remove-wod-exercise="${escapeHtml(
                          exercise.id
                        )}"
                      >
                        ×
                      </button>

                    </div>

                  </div>

                </div>
              `;
            }
          )
          .join("")
      : `
        <span class="wod-selected-empty">
          Aucun exercice sélectionné
        </span>
      `;
}

/* =========================================================
   ÉVÉNEMENTS DU SÉLECTEUR
========================================================= */

function setupWodExerciseSelector() {
  const search =
    document.querySelector<HTMLInputElement>(
      "#wod-exercise-search"
    );

  const list =
    document.querySelector<HTMLElement>(
      "#wod-exercise-list"
    );

  const selectedList =
    document.querySelector<HTMLElement>(
      "#wod-selected-exercises"
    );

  if (!list || !selectedList) {
    return;
  }

  search?.addEventListener(
    "input",
    renderWodExerciseSelector
  );

  /* AJOUT / RETRAIT */

  list.addEventListener(
    "click",
    (event) => {
      const target =
        event.target as HTMLElement;

      const button =
        target.closest<HTMLButtonElement>(
          "[data-wod-exercise]"
        );

      if (!button) return;

      const exerciseId =
        button.dataset.wodExercise;

      if (!exerciseId) return;

      const existingIndex =
        selectedWodExercises.indexOf(
          exerciseId
        );

      if (existingIndex !== -1) {
        selectedWodExercises.splice(
          existingIndex,
          1
        );
      } else {
        selectedWodExercises.push(
          exerciseId
        );
      }

      syncWodPrescriptions();

      renderWodExerciseSelector();
      renderWodPrescriptions();
    }
  );

  /* ORDRE / SUPPRESSION */

  let draggedIndex: number | null = null;
  let draggedElement: HTMLElement | null = null;
  let isDragging = false;

  selectedList.addEventListener(
    "pointerdown",
    (event) => {
      const target =
        event.target as HTMLElement;

      if (
        target.closest(
          "[data-remove-wod-exercise]"
        )
      ) {
        return;
      }

      const item =
        target.closest<HTMLElement>(
          ".wod-selected-exercise"
        );

      if (!item) return;

      draggedIndex = Number(
        item.dataset.selectedIndex
      );

      draggedElement = item;
      isDragging = true;

      item.classList.add("dragging");

      event.preventDefault();
    }
  );

  document.addEventListener(
    "pointermove",
    (event) => {
      if (
        !isDragging ||
        draggedIndex === null ||
        !draggedElement
      ) {
        return;
      }

      const element =
        document.elementFromPoint(
          event.clientX,
          event.clientY
        );

      const target =
        element?.closest<HTMLElement>(
          ".wod-selected-exercise"
        );

      selectedList
        .querySelectorAll(
          ".wod-selected-exercise"
        )
        .forEach((item) => {
          item.classList.remove(
            "drag-over"
          );
        });

      if (
        target &&
        target !== draggedElement
      ) {
        target.classList.add(
          "drag-over"
        );
      }
    }
  );

  document.addEventListener(
    "pointerup",
    (event) => {
      if (
        !isDragging ||
        draggedIndex === null ||
        !draggedElement
      ) {
        return;
      }

      const element =
        document.elementFromPoint(
          event.clientX,
          event.clientY
        );

      const target =
        element?.closest<HTMLElement>(
          ".wod-selected-exercise"
        );

      if (
        target &&
        target !== draggedElement
      ) {
        const targetIndex =
          Number(
            target.dataset.selectedIndex
          );

        const movedExercise =
          selectedWodExercises[
            draggedIndex
          ];

        selectedWodExercises.splice(
          draggedIndex,
          1
        );

        selectedWodExercises.splice(
          targetIndex,
          0,
          movedExercise
        );

        syncWodPrescriptions();

        renderWodExerciseSelector();
        renderWodPrescriptions();
      }

      draggedElement.classList.remove(
        "dragging"
      );

      selectedList
        .querySelectorAll(
          ".wod-selected-exercise"
        )
        .forEach((item) => {
          item.classList.remove(
            "drag-over"
          );
        });

      draggedIndex = null;
      draggedElement = null;
      isDragging = false;
    }
  );

  selectedList.addEventListener(
    "click",
    (event) => {
      const target =
        event.target as HTMLElement;

      const removeButton =
        target.closest<HTMLButtonElement>(
          "[data-remove-wod-exercise]"
        );

      if (!removeButton) return;

      const exerciseId =
        removeButton.dataset
          .removeWodExercise;

      if (!exerciseId) return;

      selectedWodExercises =
        selectedWodExercises.filter(
          (id) =>
            id !== exerciseId
        );

      syncWodPrescriptions();

      renderWodExerciseSelector();
      renderWodPrescriptions();
    }
  );

  renderWodExerciseSelector();
}

/* =========================================================
   TABLEAUX DES NIVEAUX
========================================================= */

function renderWodPrescriptions() {
  const levels = [
    "BEGINNER",
    "INTERMEDIATE",
    "ADVANCED"
  ] as const;

  for (const level of levels) {
    const container =
      document.querySelector<HTMLElement>(
        `#wod-prescription-${level.toLowerCase()}`
      );

    if (!container) continue;

    const prescriptions =
      wodPrescriptions[level];

    if (!prescriptions.length) {
      container.innerHTML = `
        <div class="wod-prescription-empty">
          Sélectionne d'abord des exercices
          dans la structure du WOD.
        </div>
      `;

      continue;
    }

    container.innerHTML = `
      <div class="wod-prescription-table">

        ${prescriptions
          .map(
            (item, index) => {
              const exercise =
                exercises.find(
                  (exercise) =>
                    exercise.id ===
                    item.exerciseId
                );

              if (!exercise) {
                return "";
              }

              return `
                <div
                  class="wod-prescription-row"
                >

                  <div
                    class="wod-prescription-exercise"
                  >
                    ${index + 1}.
                    ${escapeHtml(
                      exercise.name
                    )}
                  </div>

                  <input
                    type="text"
                    class="wod-prescription-value"
                    data-level="${level}"
                    data-index="${index}"
                    value="${escapeHtml(
                      item.value
                    )}"
                    placeholder="10"
                  />

                  <select
                    class="wod-prescription-unit"
                    data-level="${level}"
                    data-index="${index}"
                  >

                    <option
                      value="reps"
                      ${
                        item.unit ===
                        "reps"
                          ? "selected"
                          : ""
                      }
                    >
                      Reps
                    </option>

                    <option
                      value="time"
                      ${
                        item.unit ===
                        "time"
                          ? "selected"
                          : ""
                      }
                    >
                      Temps
                    </option>

                    <option
                      value="distance"
                      ${
                        item.unit ===
                        "distance"
                          ? "selected"
                          : ""
                      }
                    >
                      Distance
                    </option>

                    <option
                      value="weight"
                      ${
                        item.unit ===
                        "weight"
                          ? "selected"
                          : ""
                      }
                    >
                      Poids
                    </option>

                    <option
                      value="calories"
                      ${
                        item.unit ===
                        "calories"
                          ? "selected"
                          : ""
                      }
                    >
                      Calories
                    </option>

                    <option
                      value="custom"
                      ${
                        item.unit ===
                        "custom"
                          ? "selected"
                          : ""
                      }
                    >
                      Personnalisé
                    </option>

                  </select>

                  <input
                    type="text"
                    class="wod-prescription-notes"
                    data-level="${level}"
                    data-index="${index}"
                    value="${escapeHtml(
                      item.notes
                    )}"
                    placeholder="Optionnel"
                  />

                </div>
              `;
            }
          )
          .join("")}

      </div>
    `;
  }
}

/* =========================================================
   ÉVÉNEMENTS DES TABLEAUX
========================================================= */

function setupWodPrescriptionEvents() {
  const form =
    document.querySelector<HTMLFormElement>(
      "#wod-form"
    );

  if (!form) return;

  form.addEventListener(
    "input",
    (event) => {
      const target =
        event.target as HTMLElement;

      const element =
        target.closest<HTMLInputElement>(
          ".wod-prescription-value, .wod-prescription-notes"
        );

      if (!element) return;

      const level =
        element.dataset.level as
          | "BEGINNER"
          | "INTERMEDIATE"
          | "ADVANCED"
          | undefined;

      const index = Number(
        element.dataset.index
      );

      if (
        !level ||
        Number.isNaN(index)
      ) {
        return;
      }

      const prescription =
        wodPrescriptions[level][
          index
        ];

      if (!prescription) return;

      if (
        element.classList.contains(
          "wod-prescription-value"
        )
      ) {
        prescription.value =
          element.value;
      }

      if (
        element.classList.contains(
          "wod-prescription-notes"
        )
      ) {
        prescription.notes =
          element.value;
      }
    }
  );

  form.addEventListener(
    "change",
    (event) => {
      const target =
        event.target as HTMLElement;

      const element =
        target.closest<HTMLSelectElement>(
          ".wod-prescription-unit"
        );

      if (!element) return;

      const level =
        element.dataset.level as
          | "BEGINNER"
          | "INTERMEDIATE"
          | "ADVANCED"
          | undefined;

      const index = Number(
        element.dataset.index
      );

      if (
        !level ||
        Number.isNaN(index)
      ) {
        return;
      }

      const prescription =
        wodPrescriptions[level][
          index
        ];

      if (!prescription) return;

      prescription.unit =
        element.value as WodUnit;
    }
  );
}

/* =========================================================
   FORMULAIRE
========================================================= */

export function setupWodForm() {
  const openButton =
    document.querySelector<HTMLButtonElement>(
      "#open-wod-form"
    );

  const closeButton =
    document.querySelector<HTMLButtonElement>(
      "#close-wod-form"
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-wod-form"
    );

  const dateInput =
    document.querySelector<HTMLInputElement>(
      "#wod-date"
    );

  const datePickerButton =
    document.querySelector<HTMLButtonElement>(
      "#wod-date-picker-button"
    );

  const calendar =
    document.querySelector<HTMLElement>(
      "#wod-calendar"
    );

  const calendarMonth =
    document.querySelector<HTMLElement>(
      "#wod-calendar-month"
    );

  const calendarDays =
    document.querySelector<HTMLElement>(
      "#wod-calendar-days"
    );

  const calendarPrev =
    document.querySelector<HTMLButtonElement>(
      "#wod-calendar-prev"
    );

  const calendarNext =
    document.querySelector<HTMLButtonElement>(
      "#wod-calendar-next"
    );

  const calendarToday =
    document.querySelector<HTMLButtonElement>(
      "#wod-calendar-today"
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

  function renderCalendar() {
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

            selectedDate = date;

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

            renderCalendar();
          }
        );
      });
  }

  function openCalendar() {
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

    renderCalendar();
  }

  function closeCalendar() {
    calendar?.classList.add(
      "hidden"
    );
  }

  datePickerButton?.addEventListener(
    "click",
    openCalendar
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

      renderCalendar();
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

      renderCalendar();
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

      closeCalendar();
      renderCalendar();
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
        closeCalendar();
      }
    }
  );

  renderCalendar();

  const formPanel =
    document.querySelector<HTMLElement>(
      "#wod-form-panel"
    );

  const form =
    document.querySelector<HTMLFormElement>(
      "#wod-form"
    );

  if (!form) return;

  setupWodExerciseSelector();
  setupWodPrescriptionEvents();

  function resetWodForm() {
    form?.reset();

    selectedWodExercises = [];

    wodPrescriptions = {
      BEGINNER: [],
      INTERMEDIATE: [],
      ADVANCED: []
    };

    const beginner =
      form?.querySelector<HTMLInputElement>(
        '[name="beginner"]'
      );

    const intermediate =
      form?.querySelector<HTMLInputElement>(
        '[name="intermediate"]'
      );

    const advanced =
      form?.querySelector<HTMLInputElement>(
        '[name="advanced"]'
      );

    if (beginner) {
      beginner.checked = true;
    }

    if (intermediate) {
      intermediate.checked = true;
    }

    if (advanced) {
      advanced.checked = true;
    }

    editingWodId = null;

    renderWodExerciseSelector();
    renderWodPrescriptions();
  }

  function openForm() {
    formPanel?.classList.add(
      "visible"
    );

    formPanel?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function closeForm() {
    formPanel?.classList.remove(
      "visible"
    );
  }

  openButton?.addEventListener(
    "click",
    () => {
      resetWodForm();
      openForm();
    }
  );

  closeButton?.addEventListener(
    "click",
    closeForm
  );

  cancelButton?.addEventListener(
    "click",
    () => {
      resetWodForm();
      closeForm();
    }
  );

  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      syncWodPrescriptions();

      if (editingWodId) {
        updateWod(form);
      } else {
        createWod(form);
      }

      resetWodForm();

      closeForm();
    }
  );
}

/* =========================================================
   AFFICHAGE DES WODS
========================================================= */

export function renderWods(
  wodsToDisplay: Wod[] = state.wods
) {

  const dashboardTotal =
    document.querySelector<HTMLElement>(
      "#dashboard-wod-total"
    );

  const dashboardTodo =
    document.querySelector<HTMLElement>(
      "#dashboard-wod-todo"
    );

  const dashboardValidated =
    document.querySelector<HTMLElement>(
      "#dashboard-wod-validated"
    );

  const dashboardPublished =
    document.querySelector<HTMLElement>(
      "#dashboard-wod-published"
    );

  if (dashboardTotal) {
    dashboardTotal.textContent =
      String(state.wods.length);
  }

  if (dashboardTodo) {
    dashboardTodo.textContent =
      String(
        state.wods.filter(
          (wod) =>
            wod.status === "À créer"
        ).length
      );
  }

  if (dashboardValidated) {
    dashboardValidated.textContent =
      String(
        state.wods.filter(
          (wod) =>
            wod.status === "Prêt"
        ).length
      );
  }

  if (dashboardPublished) {
    dashboardPublished.textContent =
      String(
        state.wods.filter(
          (wod) =>
            wod.status === "Publié"
        ).length
      );
  }

  const list =
    document.querySelector<HTMLElement>(
      "#wod-list"
    );

  const counter =
    document.querySelector<HTMLElement>(
      "#wod-counter"
    );

  if (!list) return;

  if (counter) {
    counter.textContent =
      `${state.wods.length} WOD${
        state.wods.length > 1
          ? "s"
          : ""
      }`;
  }

  if (
    wodsToDisplay.length === 0
  ) {
    list.innerHTML = `
      <div class="empty-state">
        <span>🏋️</span>

        <strong>
          Aucun WOD pour le moment
        </strong>

        <p>
          Commence par créer ton premier WOD.
        </p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    wodsToDisplay
      .map((wod) => {
        const levels =
          wod.levels
            .map((level) => {
              if (
                level ===
                "BEGINNER"
              ) {
                return `
                  <span
                    class="level-dot level-beginner"
                  ></span>
                `;
              }

              if (
                level ===
                "INTERMEDIATE"
              ) {
                return `
                  <span
                    class="level-dot level-intermediate"
                  ></span>
                `;
              }

              if (
                level ===
                "ADVANCED"
              ) {
                return `
                  <span
                    class="level-dot level-advanced"
                  ></span>
                `;
              }

              return "";
            })
            .join("");

        return `
          <div class="wod-card">

            <div class="wod-card-id">
              ${escapeHtml(wod.id)}
            </div>

            <div class="wod-card-main">

              <div class="wod-card-title">

                <strong>
                  ${escapeHtml(
                    wod.name
                  )}
                </strong>

                ${
                  wod.focal
                    ? `
                      <span
                        class="wod-focal-badge"
                      >
                        ${escapeHtml(
                          wod.focal
                        )}
                      </span>
                    `
                    : ""
                }

              </div>

              <span>
                ${escapeHtml(
                  wod.type
                )}

                ${
                  wod.duration
                    ? ` · ${escapeHtml(
                        wod.duration
                      )}`
                    : ""
                }
              </span>

            </div>

            <div class="wod-card-levels">
              ${levels}
            </div>

            <div class="wod-card-status">
              ${escapeHtml(
                wod.status
              )}
            </div>

            <div class="wod-card-actions">

              <button
                class="wod-edit-button wod-view-button"
                data-view-wod="${escapeHtml(
                  wod.id
                )}"
              >
                Voir
              </button>

              <button
                class="wod-edit-button"
                data-edit-wod="${escapeHtml(
                  wod.id
                )}"
              >
                Modifier
              </button>

              <button
                class="wod-delete-button"
                data-delete-wod="${escapeHtml(
                  wod.id
                )}"
              >
                Supprimer
              </button>

            </div>

          </div>
        `;
      })
      .join("");

  setupWodEditButtons();
  setupWodDeleteButtons();
}

/* =========================================================
   DÉTAIL D'UN WOD
========================================================= */

let showPage: ((pageId: string) => void) | null = null;

export function configureWodModule(deps: {
  showPage: (pageId: string) => void;
}) {
  showPage = deps.showPage;
}

export function setupWodViewButtons() {
  const modal =
    document.querySelector<HTMLElement>(
      "#wod-detail-modal"
    );

  const overlay =
    document.querySelector<HTMLElement>(
      "#wod-detail-overlay"
    );

  const title =
    document.querySelector<HTMLElement>(
      "#wod-detail-title"
    );

  const detailId =
    document.querySelector<HTMLElement>(
      "#wod-detail-id"
    );

  const detailStatus =
    document.querySelector<HTMLElement>(
      "#wod-detail-status"
    );

  const content =
    document.querySelector<HTMLElement>(
      "#wod-detail-content"
    );

  if (
    !modal ||
    !overlay ||
    !title ||
    !detailId ||
    !detailStatus ||
    !content
  ) {
    return;
  }

  function closeModal() {
    modal?.classList.add("hidden");
  }

  function getProductionStatusClass(
    status: string
  ) {
    if (
      status === "Terminé"
    ) {
      return "production-status-done";
    }

    if (
      status === "En cours"
    ) {
      return "production-status-progress";
    }

    return "production-status-todo";
  }

  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target as HTMLElement;

      if (
        target.closest(
          "[data-production-task]"
        )
      ) {
        return;
      }

      const viewButton =
        target.closest<HTMLButtonElement>(
          "[data-view-wod], [data-production-wod]"
        );

      if (!viewButton) return;

      if (
        target.closest(
          "[data-production-task]"
        ) ||
        target.closest(
          "[data-detail-production-task]"
        )
      ) {
        return;
      }

      const wodId =
        viewButton.dataset.viewWod ||
        viewButton.dataset
          .productionWod;

      if (!wodId) return;

      const wod =
        state.wods.find(
          (item) =>
            item.id === wodId
        );

      if (!wod) return;

      /*
       * HEADER
       */

      detailId.textContent =
        wod.id;

      title.textContent =
        wod.name;

      detailStatus.textContent =
        wod.status;

      detailStatus.className =
        `wod-detail-status ${
          getProductionStatusClass(
            wod.status === "Prêt"
              ? "Terminé"
              : wod.status === "En cours"
                ? "En cours"
                : "À faire"
          )
        }`;

      /*
       * UNITÉS
       */

      const unitLabels: Record<
        WodUnit,
        string
      > = {
        reps: "reps",
        time: "sec",
        distance: "m",
        weight: "kg",
        calories: "cal",
        custom: ""
      };

      /*
       * NIVEAUX ACTIFS
       */

      const levelLabels = [
        "BEGINNER",
        "INTERMEDIATE",
        "ADVANCED"
      ] as const;

      const activeLevels =
        levelLabels.filter(
          (level) =>
            wod.levels.includes(
              level
            )
        );

      /*
       * PRESCRIPTIONS
       *
       * Une ligne = un exercice.
       * Chaque niveau possède sa propre
       * prescription.
       */

      const maxExerciseCount =
        activeLevels.reduce(
          (max, level) =>
            Math.max(
              max,
              wod.prescriptions?.[
                level
              ]?.length ?? 0
            ),
          0
        );

      const prescriptionRows =
        Array.from(
          {
            length:
              maxExerciseCount
          },
          (_, index) => {

            return `
              <div
                class="wod-detail-prescription-row"
              >

                ${activeLevels
                  .map(
                    (level) => {

                      const item =
                        wod.prescriptions?.[
                          level
                        ]?.[index];

                      if (!item) {
                        return `
                          <div
                            class="wod-detail-prescription-cell"
                          >
                            —
                          </div>
                        `;
                      }

                      const exercise =
                        exercises.find(
                          (
                            exercise
                          ) =>
                            exercise.id ===
                            item.exerciseId
                        );

                      if (!exercise) {
                        return `
                          <div
                            class="wod-detail-prescription-cell"
                          >
                            —
                          </div>
                        `;
                      }

                      const unit =
                        unitLabels[
                          item.unit
                        ];

                      const value =
                        item.value
                          ? `${item.value}${
                              unit
                                ? ` ${unit}`
                                : ""
                            }`
                          : "";

                      const exerciseName =
                        exercise.name;

                      const prescriptionValue =
                        value;

                      return `
                        <div
                          class="wod-detail-prescription-cell"
                        >

                          <strong>
                            ${escapeHtml(
                              exerciseName
                            )}
                          </strong>

                          ${
                            prescriptionValue
                              ? `
                                <span class="wod-detail-prescription-value">
                                  ${escapeHtml(
                                    prescriptionValue
                                  )}
                                </span>
                              `
                              : ""
                          }

                          ${
                            item.notes
                              ? `
                                <small>
                                  ${escapeHtml(
                                    item.notes
                                  )}
                                </small>
                              `
                              : ""
                          }

                        </div>
                      `;
                    }
                  )
                  .join("")}

              </div>
            `;
          }
        ).join("");

      const prescriptionHeader =
        activeLevels
          .map(
            (level) => `
              <div
                class="wod-prescription-header-cell"
              >
                ${level}
              </div>
            `
          )
          .join("");

      /*
       * INFORMATIONS
       */

      /*
       * PRODUCTION
       *
       * On conserve exactement les
       * données et le système de clic
       * existants.
       */

      content.innerHTML = `

        <div class="wod-detail-subheader">

          <div class="wod-detail-type">
            ${escapeHtml(
              wod.type
            )}

            ${
              wod.duration
                ? ` · ${escapeHtml(
                    wod.duration
                  )}`
                : ""
            }
          </div>

          <div class="wod-detail-focal">
            ${escapeHtml(
              wod.focal || "-"
            )}
          </div>

        </div>

        <div class="wod-detail-section">

          <span class="wod-detail-section-title">
            PRESCRIPTIONS
          </span>

          ${
            activeLevels.length
              ? `
                <div
                  class="wod-detail-prescription-table"
                  style="--wod-level-count: ${activeLevels.length};"
                >

                  <div
                    class="wod-detail-prescription-header"
                  >
                    ${prescriptionHeader}
                  </div>

                  ${
                    prescriptionRows ||
                    `
                      <div
                        class="wod-prescription-empty"
                      >
                        Aucune prescription.
                      </div>
                    `
                  }

                </div>
              `
              : `
                <p class="wod-prescription-empty">
                  Aucune prescription.
                </p>
              `
          }

        </div>

        <div class="wod-detail-section">

          <span class="wod-detail-section-title">
            INFORMATIONS
          </span>

          <div class="wod-detail-info-grid">

            <div class="wod-detail-info-item">
              <span>TYPE</span>
              <strong>
                ${escapeHtml(
                  wod.type || "-"
                )}
              </strong>
            </div>

            <div class="wod-detail-info-item">
              <span>FOCALE</span>
              <strong>
                ${escapeHtml(
                  wod.focal || "-"
                )}
              </strong>
            </div>

            <div class="wod-detail-info-item">
              <span>DURÉE</span>
              <strong>
                ${escapeHtml(
                  wod.duration || "-"
                )}
              </strong>
            </div>

            <div class="wod-detail-info-item">
              <span>SCORE</span>
              <strong>
                ${escapeHtml(
                  wod.score || "-"
                )}
              </strong>
            </div>

            <div class="wod-detail-info-item">
              <span>MATÉRIEL</span>
              <strong>
                ${escapeHtml(
                  wod.equipment || "-"
                )}
              </strong>
            </div>

            <div class="wod-detail-info-item">
              <span>DATE</span>
              <strong>
                ${escapeHtml(
                  wod.date || "-"
                )}
              </strong>
            </div>

          </div>

        </div>

        <div class="wod-detail-section">

          <span class="wod-detail-section-title">
            PRODUCTION
          </span>

          <div class="wod-detail-production-list">

            <div
              class="wod-detail-production-item"
              data-detail-production-task="visual"
              data-detail-production-wod="${escapeHtml(
                wod.id
              )}"
            >
              <span>
                VISUEL
              </span>

              <strong
                class="${getProductionStatusClass(
                  wod.production.visual
                )}"
              >
                ${escapeHtml(
                  wod.production.visual
                )}
              </strong>
            </div>

            <div
              class="wod-detail-production-item"
              data-detail-production-task="text"
              data-detail-production-wod="${escapeHtml(
                wod.id
              )}"
            >
              <span>
                TEXTE
              </span>

              <strong
                class="${getProductionStatusClass(
                  wod.production.text
                )}"
              >
                ${escapeHtml(
                  wod.production.text
                )}
              </strong>

              <button
                type="button"
                class="wod-detail-text-edit"
                data-open-wod-text="${escapeHtml(wod.id)}"
                title="Modifier le texte"
                aria-label="Modifier le texte"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            </div>

            <div
              class="wod-detail-production-item"
              data-detail-production-task="publication"
              data-detail-production-wod="${escapeHtml(
                wod.id
              )}"
            >
              <span>
                PUBLICATION
              </span>

              <strong
                class="${getProductionStatusClass(
                  wod.production
                    .publication
                )}"
              >
                ${escapeHtml(
                  wod.production
                    .publication
                )}
              </strong>
            </div>

          </div>

        </div>
      `;

      modal.classList.remove(
        "hidden"
      );

      const textEditButton =
        content.querySelector<HTMLButtonElement>(
          "[data-open-wod-text]"
        );

      if (textEditButton) {
        textEditButton.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();

            const wodId =
              textEditButton.dataset
                .openWodText;

            if (!wodId || !showPage) return;
            modal.classList.add("hidden");
            showPage("texts");

            setTimeout(() => {
              const textCard =
                document.querySelector<HTMLElement>(
                  `[data-text-type="wod"][data-text-id="${wodId}"]`
                );

              textCard?.click();
            }, 100);
          }
        );
      }

    }
  );

  /*
   * PRODUCTION : clic sur un statut
   */

  content.addEventListener(
    "click",
    (event) => {
      const target =
        event.target as HTMLElement;

      const taskItem =
        target.closest<HTMLElement>(
          "[data-detail-production-task]"
        );

      if (!taskItem) return;

      const wodId =
        taskItem.dataset
          .detailProductionWod;

      const task =
        taskItem.dataset
          .detailProductionTask as
          | "visual"
          | "text"
          | "publication"
          | undefined;

      if (!wodId || !task) {
        return;
      }

      const wod =
        state.wods.find(
          (item) =>
            item.id === wodId
        );

      if (!wod) return;

      const currentState =
        wod.production[task];

      let nextState =
        "À faire";

      if (
        currentState ===
        "À faire"
      ) {
        nextState = "En cours";
      } else if (
        currentState ===
        "En cours"
      ) {
        nextState = "Terminé";
      }

      wod.production[task] =
        nextState;

      const productionStates = [
        wod.production.visual,
        wod.production.text,
        wod.production.publication
      ];

      const allDone =
        productionStates.every(
          (value) =>
            value === "Terminé"
        );

      const anyStarted =
        productionStates.some(
          (value) =>
            value === "En cours" ||
            value === "Terminé"
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
    }
  );

  /*
   * Fermeture par clic sur l'overlay.
   */

  overlay.addEventListener(
    "click",
    closeModal
  );
}

/* =========================================================
   SUPPRESSION
========================================================= */

function setupWodDeleteButtons() {
  const buttons =
    document.querySelectorAll<HTMLButtonElement>(
      "[data-delete-wod]"
    );

  buttons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const wodId =
          button.dataset.deleteWod;

        if (!wodId) return;

        const wod =
          state.wods.find(
            (item) =>
              item.id === wodId
          );

        if (!wod) return;

        const linkedWeeklies =
          state.weeklies.filter(
            (weekly) =>
              weekly.wodId ===
              wodId
          );

        const linkedPublications =
          state.publications.filter(
            (publication) =>
              publication.wodId ===
              wodId
          );

        if (
          linkedWeeklies.length >
            0 ||
          linkedPublications.length >
            0
        ) {
          const relations = [
            linkedWeeklies.length >
            0
              ? `${linkedWeeklies.length} Weekly`
              : "",

            linkedPublications.length >
            0
              ? `${linkedPublications.length} publication(s)`
              : ""
          ]
            .filter(Boolean)
            .join(" et ");

          window.alert(
            `Impossible de supprimer ${wod.id} : il est encore lié à ${relations}.\n\nSupprime ou détache d'abord ces éléments.`
          );

          return;
        }

        const confirmed =
          window.confirm(
            `Supprimer le ${wod.id} "${wod.name}" ?\n\nCette action est irréversible.`
          );

        if (!confirmed) return;

        const index =
          state.wods.findIndex(
            (item) =>
              item.id === wodId
          );

        if (index === -1) return;

        state.wods.splice(
          index,
          1
        );

        saveWods();

        notifyHubChange();
      }
    );
  });
}

/* =========================================================
   FILTRES
========================================================= */

export function setupWodFilters() {
  const search =
    document.querySelector<HTMLInputElement>(
      "#wod-search"
    );

  const typeFilter =
    document.querySelector<HTMLSelectElement>(
      "#wod-type-filter"
    );

  const focalFilter =
    document.querySelector<HTMLSelectElement>(
      "#wod-focal-filter"
    );

  const levelFilter =
    document.querySelector<HTMLSelectElement>(
      "#wod-level-filter"
    );

  const statusFilter =
    document.querySelector<HTMLSelectElement>(
      "#wod-status-filter"
    );

  function applyFilters() {
    const searchValue =
      search?.value
        .toLowerCase()
        .trim() ?? "";

    const typeValue =
      typeFilter?.value ?? "";

    const focalValue =
      focalFilter?.value ?? "";

    const levelValue =
      levelFilter?.value ?? "";

    const statusValue =
      statusFilter?.value ?? "";

    const filteredWods =
      state.wods.filter(
        (wod) => {
          const matchesSearch =
            wod.name
              .toLowerCase()
              .includes(
                searchValue
              ) ||
            wod.id
              .toLowerCase()
              .includes(
                searchValue
              );

          const matchesType =
            !typeValue ||
            wod.type
              .trim()
              .toUpperCase() ===
              typeValue
                .trim()
                .toUpperCase();

          const matchesFocal =
            !focalValue ||
            wod.focal
              .trim()
              .toUpperCase() ===
            focalValue
              .trim()
              .toUpperCase();

          const matchesLevel =
            !levelValue ||
            wod.levels.includes(
              levelValue
            );

          const matchesStatus =
            !statusValue ||
            wod.status
              .trim()
              .toUpperCase() ===
              statusValue
                .trim()
                .toUpperCase();

          return (
            matchesSearch &&
            matchesType &&
            matchesFocal &&
            matchesLevel &&
            matchesStatus
          );
        }
      );

    renderWods(
      filteredWods
    );
  }

  search?.addEventListener(
    "input",
    applyFilters
  );

  typeFilter?.addEventListener(
    "change",
    applyFilters
  );

  focalFilter?.addEventListener(
    "change",
    applyFilters
  );

  levelFilter?.addEventListener(
    "change",
    applyFilters
  );

  statusFilter?.addEventListener(
    "change",
    applyFilters
  );
}

/* =========================================================
   MODIFICATION D'UN WOD
========================================================= */

function setupWodEditButtons() {
  const buttons =
    document.querySelectorAll<HTMLButtonElement>(
      "[data-edit-wod]"
    );

  buttons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const wodId =
          button.dataset.editWod;

        if (!wodId) return;

        const wod =
          state.wods.find(
            (item) =>
              item.id === wodId
          );

        if (!wod) return;

        editingWodId = wod.id;

        const form =
          document.querySelector<HTMLFormElement>(
            "#wod-form"
          );

        const formPanel =
          document.querySelector<HTMLElement>(
            "#wod-form-panel"
          );

        if (!form) return;

        const setValue = (
          name: string,
          value: string
        ) => {
          const input =
            form.querySelector<HTMLInputElement>(
              `[name="${name}"]`
            );

          if (input) {
            input.value =
              value;
          }
        };

        setValue(
          "name",
          wod.name
        );

        setValue(
          "type",
          wod.type
        );

        setValue(
          "focal",
          wod.focal ?? ""
        );

        setValue(
          "duration",
          wod.duration
        );

        setValue(
          "equipment",
          wod.equipment
        );

        setValue(
          "score",
          wod.score
        );

        setValue(
          "date",
          wod.date
        );

        setValue(
          "status",
          wod.status
        );

        selectedWodExercises =
          [...wod.exercises];

        wodPrescriptions = {
          BEGINNER:
            wod.prescriptions
              ?.BEGINNER
              ?.map(
                (item) => ({
                  ...item
                })
              ) ?? [],

          INTERMEDIATE:
            wod.prescriptions
              ?.INTERMEDIATE
              ?.map(
                (item) => ({
                  ...item
                })
              ) ?? [],

          ADVANCED:
            wod.prescriptions
              ?.ADVANCED
              ?.map(
                (item) => ({
                  ...item
                })
              ) ?? []
        };

        syncWodPrescriptions();

        renderWodExerciseSelector();
        renderWodPrescriptions();

        const beginner =
          form.querySelector<HTMLInputElement>(
            '[name="beginner"]'
          );

        const intermediate =
          form.querySelector<HTMLInputElement>(
            '[name="intermediate"]'
          );

        const advanced =
          form.querySelector<HTMLInputElement>(
            '[name="advanced"]'
          );

        if (beginner) {
          beginner.checked =
            wod.levels.includes(
              "BEGINNER"
            );
        }

        if (intermediate) {
          intermediate.checked =
            wod.levels.includes(
              "INTERMEDIATE"
            );
        }

        if (advanced) {
          advanced.checked =
            wod.levels.includes(
              "ADVANCED"
            );
        }

        formPanel?.classList.add(
          "visible"
        );

        formPanel?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    );
  });
}