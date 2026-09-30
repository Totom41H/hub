import {
  Exercise,
  exercises,
  saveExercises,
  getNextExerciseNumber,
  incrementNextExerciseNumber,
} from "../data/exercises";

import { escapeHtml } from "../core/utils";
import { convertFileSrc } from "@tauri-apps/api/core";

let editingExerciseId: string | null = null;

function getExercisePictogramPath(
  pictogrammeId: string
): string {
  if (!pictogrammeId.trim()) {
    return "";
  }

  const filePath =
    `C:/Users/tom12/Desktop/STRNZ/Picto/${pictogrammeId.trim()}.png`;

  return convertFileSrc(filePath);
}

function createExercise(form: HTMLFormElement) {
  const formData = new FormData(form);

  const bodyParts = formData.getAll("bodyParts");

  const exercise: Exercise = {
    id: `EX-${String(getNextExerciseNumber()).padStart(3, "0")}`,

    name: String(
      formData.get("name") ?? ""
    ),

    bodyParts: bodyParts.map(
      (part) => String(part)
    ),

    equipment: String(
      formData.get("equipment") ?? ""
    ),

    description: String(
      formData.get("description") ?? ""
    ),

    pictogrammeId: String(
      formData.get("pictogrammeId") ?? ""
    ),

    active:
      formData.get("active") === "on",
  };

  exercises.push(exercise);

  incrementNextExerciseNumber();

  saveExercises();

  renderExercises();
}

function updateExercise(
  form: HTMLFormElement
) {
  if (!editingExerciseId) return;

  const exercise =
    exercises.find(
      (item) =>
        item.id === editingExerciseId
    );

  if (!exercise) return;

  const formData =
    new FormData(form);

  exercise.name = String(
    formData.get("name") ?? ""
  );

  exercise.bodyParts =
    formData
      .getAll("bodyParts")
      .map((part) => String(part));

  exercise.equipment = String(
    formData.get("equipment") ?? ""
  );

  exercise.description = String(
    formData.get("description") ?? ""
  );

  exercise.pictogrammeId =
    String(
      formData.get("pictogrammeId") ?? ""
    );

  exercise.active =
    formData.get("active") === "on";

  saveExercises();

  renderExercises();
}

export function setupExercises() {
  const openButton =
    document.querySelector<HTMLButtonElement>(
      "#open-exercise-form"
    );

  const closeButton =
    document.querySelector<HTMLButtonElement>(
      "#close-exercise-form"
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-exercise-form"
    );

  const formPanel =
    document.querySelector<HTMLElement>(
      "#exercise-form-panel"
    );

  const form =
    document.querySelector<HTMLFormElement>(
      "#exercise-form"
    );

  function openForm() {
    formPanel?.classList.add(
      "visible"
    );

    formPanel?.scrollIntoView({
      behavior: "smooth",
      block: "start",
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
      editingExerciseId = null;

      form?.reset();

      const active =
        form?.querySelector<HTMLInputElement>(
          '[name="active"]'
        );

      if (active) {
        active.checked = true;
      }

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
      editingExerciseId = null;
      form?.reset();

      const active =
        form?.querySelector<HTMLInputElement>(
          '[name="active"]'
        );

      if (active) {
        active.checked = true;
      }

      closeForm();
    }
  );

  form?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      if (editingExerciseId) {
        updateExercise(form);
      } else {
        createExercise(form);
      }

      form.reset();

      const active =
        form.querySelector<HTMLInputElement>(
          '[name="active"]'
        );

      if (active) {
        active.checked = true;
      }

      editingExerciseId = null;

      closeForm();
    }
  );
}

export function renderExercises(
  exercisesToDisplay: Exercise[] =
    exercises
) {
  const list =
    document.querySelector<HTMLElement>(
      "#exercise-list"
    );

  const counter =
    document.querySelector<HTMLElement>(
      "#exercise-counter"
    );

  if (!list) return;

  if (counter) {
    counter.textContent =
      `${exercises.length} exercice${
        exercises.length > 1
          ? "s"
          : ""
      }`;
  }

  if (
    exercisesToDisplay.length === 0
  ) {
    list.innerHTML = `
      <div class="empty-state">
        <span>🏋️</span>
        <strong>Aucun exercice</strong>
        <p>
          Ajoute ton premier exercice
          à la bibliothèque.
        </p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    exercisesToDisplay
      .map((exercise) => {
        const status =
          exercise.active
            ? "Actif"
            : "Inactif";

        const bodyParts =
          exercise.bodyParts
            .map(
              (part) =>
                `<span class="exercise-tag">${escapeHtml(
                  part
                )}</span>`
            )
            .join("");

        const pictogrammeSrc =
          getExercisePictogramPath(
            exercise.pictogrammeId
          );

        return `
          <div class="exercise-card">

            <div class="exercise-card-header">

              <div class="exercise-card-main">

                <span class="exercise-card-id">
                  ${escapeHtml(exercise.id)}
                </span>

                ${
                  pictogrammeSrc
                    ? `
                      <img
                        class="exercise-card-pictogram"
                        src="${pictogrammeSrc}"
                        alt=""
                      />
                    `
                    : ""
                }

                <strong class="exercise-card-name">
                  ${escapeHtml(exercise.name)}
                </strong>

                <span class="exercise-tags">
                  ${bodyParts || "Aucune zone"}
                </span>

              </div>

            </div>

            <div class="exercise-card-actions">

              <div class="exercise-card-status ${exercise.active ? "is-active" : "is-inactive"}">
                ${status}
              </div>

              <button
                class="exercise-edit-button"
                data-edit-exercise="${escapeHtml(
                  exercise.id
                )}"
              >
                Modifier
              </button>

              <button
                class="exercise-edit-button"
                data-toggle-exercise="${escapeHtml(
                  exercise.id
                )}"
              >
                ${
                  exercise.active
                    ? "Désactiver"
                    : "Activer"
                }
              </button>

              <button
                class="exercise-delete-button"
                data-delete-exercise="${escapeHtml(
                  exercise.id
                )}"
              >
                Supprimer
              </button>

            </div>

          </div>
        `;
      })
      .join("");

  setupExerciseEditButtons();
  setupExerciseToggleButtons();
  setupExerciseDeleteButtons();
}

function setupExerciseEditButtons() {
  const buttons =
    document.querySelectorAll<HTMLButtonElement>(
      "[data-edit-exercise]"
    );

  buttons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const exerciseId =
          button.dataset.editExercise;

        if (!exerciseId) return;

        const exercise =
          exercises.find(
            (item) =>
              item.id === exerciseId
          );

        if (!exercise) return;

        editingExerciseId =
          exercise.id;

        const form =
          document.querySelector<HTMLFormElement>(
            "#exercise-form"
          );

        const formPanel =
          document.querySelector<HTMLElement>(
            "#exercise-form-panel"
          );

        if (!form) return;

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
          exercise.name
        );

        setValue(
          "equipment",
          exercise.equipment
        );

        setValue(
          "description",
          exercise.description
        );

        setValue(
          "pictogrammeId",
          exercise.pictogrammeId
        );

        const bodyPartCheckboxes =
          form.querySelectorAll<HTMLInputElement>(
            '[name="bodyParts"]'
          );

        bodyPartCheckboxes.forEach(
          (checkbox) => {
            checkbox.checked =
              exercise.bodyParts.includes(
                checkbox.value
              );
          }
        );

        const active =
          form.querySelector<HTMLInputElement>(
            '[name="active"]'
          );

        if (active) {
          active.checked =
            exercise.active;
        }

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

function setupExerciseToggleButtons() {
  const buttons =
    document.querySelectorAll<HTMLButtonElement>(
      "[data-toggle-exercise]"
    );

  buttons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const exerciseId =
          button.dataset.toggleExercise;

        if (!exerciseId) return;

        const exercise =
          exercises.find(
            (item) =>
              item.id === exerciseId
          );

        if (!exercise) return;

        exercise.active =
          !exercise.active;

        saveExercises();

        renderExercises();
      }
    );
  });
}

function setupExerciseDeleteButtons() {
  const buttons =
    document.querySelectorAll<HTMLButtonElement>(
      "[data-delete-exercise]"
    );

  buttons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const exerciseId =
          button.dataset.deleteExercise;

        if (!exerciseId) return;

        const exercise =
          exercises.find(
            (item) =>
              item.id === exerciseId
          );

        if (!exercise) return;

        const confirmed =
          window.confirm(
            `Supprimer l'exercice ${exercise.id} "${exercise.name}" ?\n\nCette action est irréversible.`
          );

        if (!confirmed) return;

        const index =
          exercises.findIndex(
            (item) =>
              item.id === exerciseId
          );

        if (index === -1) return;

        exercises.splice(index, 1);

        saveExercises();

        renderExercises();
      }
    );
  });
}

export function setupExerciseFilters() {
  const search =
    document.querySelector<HTMLInputElement>(
      "#exercise-search"
    );

  const bodyPartFilter =
    document.querySelector<HTMLSelectElement>(
      "#exercise-body-part-filter"
    );

  function applyFilters() {
    const searchValue =
      search?.value.toLowerCase().trim() ?? "";

    const bodyPartValue =
      bodyPartFilter?.value ?? "";

    const filteredExercises =
      exercises.filter((exercise) => {
        const matchesSearch =
          exercise.name
            .toLowerCase()
            .includes(searchValue) ||
          exercise.id
            .toLowerCase()
            .includes(searchValue) ||
          exercise.bodyParts.some((part) =>
            part
              .toLowerCase()
              .includes(searchValue)
          );

        const matchesBodyPart =
          !bodyPartValue ||
          exercise.bodyParts.includes(
            bodyPartValue
          );

        return (
          matchesSearch &&
          matchesBodyPart
        );
      });

    renderExercises(filteredExercises);
  }

  search?.addEventListener(
    "input",
    applyFilters
  );

  bodyPartFilter?.addEventListener(
    "change",
    applyFilters
  );
}