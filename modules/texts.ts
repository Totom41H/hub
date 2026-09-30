import { saveWods } from "../data/wods";
import { saveWeeklies } from "../data/weeklies";
import { state } from "../core/state";
import { escapeHtml } from "../core/utils";

let activeTextType: "wod" | "weekly" | null = null;
let activeTextId: string | null = null;

function buildTextContent(
  texts: {
    caption: string;
    hashtags: string;
    cta: string;
  }
): string {

  return [
    texts.caption,
    texts.hashtags,
    texts.cta
  ]
    .filter(Boolean)
    .join("\n\n");
}

function getStatusClass(status: string): string {
  return status
    .toLowerCase()
    .replace("à créer", "a-creer")
    .replace("en cours", "en-cours")
    .replace("prêt", "pret")
    .replace("publié", "publie");
}

export function renderTexts() {

  const textsList =
    document.querySelector<HTMLElement>(
      "#texts-list"
    );

  if (!textsList) return;

  textsList.innerHTML = "";


  /* =========================
     WOD
  ========================= */

  state.wods.forEach((wod) => {

    textsList.innerHTML += `
      <article
        class="production-card texts-card"
        data-text-type="wod"
        data-text-id="${escapeHtml(wod.id)}"
      >

        <div class="production-card-header">

          <div class="production-card-info">

            <div class="production-card-id">
              ${escapeHtml(wod.id)}
            </div>

            <strong class="production-card-title">
              ${escapeHtml(wod.name)}
            </strong>

          </div>

          <div class="texts-header-actions">

            <div
              class="production-card-status status-${getStatusClass(
                wod.status
              )}"
            >
              ${escapeHtml(wod.status)}
            </div>

            <button
              type="button"
              class="texts-copy-button"
              data-copy-wod="${escapeHtml(wod.id)}"
            >
              Copier
            </button>

          </div>

        </div>

      </article>
    `;
  });


  /* =========================
     WEEKLY
  ========================= */

  state.weeklies.forEach((weekly) => {

    textsList.innerHTML += `
      <article
        class="production-card texts-card"
        data-text-type="weekly"
        data-text-id="${escapeHtml(weekly.id)}"
      >

        <div class="production-card-header">

          <div class="production-card-info">

            <div class="production-card-id">
              ${escapeHtml(weekly.id)}
            </div>

            <strong class="production-card-title">
              ${escapeHtml(weekly.name)}
            </strong>

          </div>

          <div class="texts-header-actions">

            <div
              class="production-card-status status-${getStatusClass(
                weekly.status
              )}"
            >
              ${escapeHtml(weekly.status)}
            </div>

            <button
              type="button"
              class="texts-copy-button"
              data-copy-weekly="${escapeHtml(
                weekly.id
              )}"
            >
              Copier
            </button>

          </div>

        </div>

      </article>
    `;
  });
}


/* =========================
   OUVERTURE ÉDITEUR
========================= */

export function openTextEditor(
  type: "wod" | "weekly",
  id: string
) {

  const modal =
    document.querySelector<HTMLElement>(
      "#text-editor-modal"
    );

  const idElement =
    document.querySelector<HTMLElement>(
      "#text-editor-id"
    );

  const titleElement =
    document.querySelector<HTMLElement>(
      "#text-editor-title"
    );

  const statusElement =
    document.querySelector<HTMLElement>(
      "#text-editor-status"
    );

  const input =
    document.querySelector<HTMLTextAreaElement>(
      "#text-editor-input"
    );

  if (
    !modal ||
    !idElement ||
    !titleElement ||
    !statusElement ||
    !input
  ) {
    return;
  }

  let item:
    | typeof state.wods[number]
    | typeof state.weeklies[number]
    | undefined;

  if (type === "wod") {
    item = state.wods.find(
      (wod) => wod.id === id
    );
  } else {
    item = state.weeklies.find(
      (weekly) => weekly.id === id
    );
  }

  if (!item) return;

  activeTextType = type;
  activeTextId = id;

  idElement.textContent = item.id;
  titleElement.textContent = item.name;

  statusElement.textContent = item.status;
  statusElement.className =
    `production-card-status status-${getStatusClass(
      item.status
    )}`;

  input.value =
    buildTextContent(item.texts);

  modal.classList.remove("hidden");

  requestAnimationFrame(() => {
    input.focus();
  });
}


/* =========================
   FERMETURE
========================= */

function closeTextEditor() {

  const modal =
    document.querySelector<HTMLElement>(
      "#text-editor-modal"
    );

  if (!modal) return;

  modal.classList.add("hidden");

  activeTextType = null;
  activeTextId = null;
}


/* =========================
   SAUVEGARDE
========================= */

function saveActiveText(
  value: string
) {

  if (
    !activeTextType ||
    !activeTextId
  ) {
    return;
  }

  /*
   * Le texte complet est conservé
   * dans caption.
   *
   * Les anciens champs hashtags / CTA
   * sont vidés pour éviter les doublons
   * lors de la copie.
   */

  if (activeTextType === "wod") {

    const wod =
      state.wods.find(
        (item) =>
          item.id === activeTextId
      );

    if (!wod) return;

    wod.texts.caption = value;
    wod.texts.hashtags = "";
    wod.texts.cta = "";

    saveWods();

    return;
  }

  const weekly =
    state.weeklies.find(
      (item) =>
        item.id === activeTextId
    );

  if (!weekly) return;

  weekly.texts.caption = value;
  weekly.texts.hashtags = "";
  weekly.texts.cta = "";

  saveWeeklies();
}


/* =========================
   ÉDITEUR
========================= */

export function setupTextsEditor() {

  const textsList =
    document.querySelector<HTMLElement>(
      "#texts-list"
    );

  const input =
    document.querySelector<HTMLTextAreaElement>(
      "#text-editor-input"
    );

  const closeButton =
    document.querySelector<HTMLButtonElement>(
      "#text-editor-close"
    );

  const overlay =
    document.querySelector<HTMLElement>(
      "#text-editor-overlay"
    );

  if (
    !textsList ||
    !input ||
    !closeButton ||
    !overlay
  ) {
    return;
  }

  textsList.onclick = (event) => {

    const target =
      event.target as HTMLElement;

    const copyButton =
      target.closest<HTMLButtonElement>(
        "[data-copy-wod], [data-copy-weekly]"
      );

    if (copyButton) return;

    const card =
      target.closest<HTMLElement>(
        ".texts-card"
      );

    if (!card) return;

    const type =
      card.dataset.textType as
        | "wod"
        | "weekly"
        | undefined;

    const id =
      card.dataset.textId;

    if (!type || !id) return;

    openTextEditor(type, id);
  };


  input.oninput = () => {
    saveActiveText(input.value);
  };


  closeButton.onclick =
    closeTextEditor;

  overlay.onclick =
    closeTextEditor;
}


/* =========================
   FILTRES
========================= */

export function setupTextsFilters() {

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#texts-search"
    );

  const typeFilter =
    document.querySelector<HTMLSelectElement>(
      "#texts-type-filter"
    );

  if (
    !searchInput ||
    !typeFilter
  ) {
    return;
  }

  function applyFilters() {

    const search =
      searchInput?.value
        .trim()
        .toLowerCase();

    const type =
      typeFilter?.value;

    document
      .querySelectorAll<HTMLElement>(
        "#texts-list .texts-card"
      )
      .forEach((card) => {

        const text =
          card.textContent
            ?.toLowerCase() || "";

        const cardType =
          card.dataset.textType || "wod";

        const matchesSearch =
          !search ||
          text.includes(search);

        const matchesType =
          type === "all" ||
          type === cardType;

        card.style.display =
          matchesSearch &&
          matchesType
            ? ""
            : "none";
      });
  }

  searchInput.oninput =
    applyFilters;

  typeFilter.onchange =
    applyFilters;
}


/* =========================
   COPIE
========================= */

export function setupTextsCopy() {

  const textsList =
    document.querySelector<HTMLElement>(
      "#texts-list"
    );

  const editorCopyButton =
    document.querySelector<HTMLButtonElement>(
      "#text-editor-copy"
    );

  if (!textsList) return;


  async function copyText(
    type: "wod" | "weekly",
    id: string
  ) {

    let text = "";

    if (type === "wod") {

      const wod =
        state.wods.find(
          (item) => item.id === id
        );

      if (!wod) return;

      text = buildTextContent(
        wod.texts
      );

    } else {

      const weekly =
        state.weeklies.find(
          (item) => item.id === id
        );

      if (!weekly) return;

      text = buildTextContent(
        weekly.texts
      );
    }

    try {

      await navigator.clipboard.writeText(
        text
      );

    } catch (error) {

      console.error(
        "Impossible de copier le texte :",
        error
      );
    }
  }


  textsList.addEventListener(
    "click",
    async (event) => {

      const target =
        event.target as HTMLElement;

      const copyButton =
        target.closest<HTMLButtonElement>(
          "[data-copy-wod], [data-copy-weekly]"
        );

      if (!copyButton) return;

      event.stopPropagation();

      const wodId =
        copyButton.dataset.copyWod;

      const weeklyId =
        copyButton.dataset.copyWeekly;

      if (wodId) {

        await copyText(
          "wod",
          wodId
        );

      } else if (weeklyId) {

        await copyText(
          "weekly",
          weeklyId
        );
      }

      const originalText =
        copyButton.textContent;

      copyButton.textContent =
        "✓ Copié !";

      setTimeout(() => {
        copyButton.textContent =
          originalText || "Copier";
      }, 1500);
    }
  );


  editorCopyButton?.addEventListener(
    "click",
    async () => {

      const input =
        document.querySelector<HTMLTextAreaElement>(
          "#text-editor-input"
        );

      if (!input) return;

      try {

        await navigator.clipboard.writeText(
          input.value
        );

        const originalText =
          editorCopyButton.textContent;

        editorCopyButton.textContent =
          "✓ Copié !";

        setTimeout(() => {
          editorCopyButton.textContent =
            originalText || "Copier";
        }, 1500);

      } catch (error) {

        console.error(
          "Impossible de copier le texte :",
          error
        );
      }
    }
  );
}