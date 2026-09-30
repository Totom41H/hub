import { state } from "../core/state";
import { escapeHtml } from "../core/utils";
import { saveWods } from "../data/wods";
import { saveWeeklies } from "../data/weeklies";
import { notifyHubChange } from "../core/hubRefresh";

export function renderPublications() {

  const publicationsList =
    document.querySelector<HTMLElement>(
      "#publications-list"
    );

  if (!publicationsList) return;

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#publications-search"
    );

  const typeFilter =
    document.querySelector<HTMLSelectElement>(
      "#publications-type-filter"
    );

  const search =
    searchInput?.value
      .trim()
      .toLowerCase() || "";

  const type =
    typeFilter?.value || "all";


  /* =========================
     CONTENUS
  ========================= */

  const contents = [
    ...state.wods.map((wod) => ({
      ...wod,
      contentType: "wod"
    })),

    ...state.weeklies.map((weekly) => ({
      ...weekly,
      contentType: "weekly"
    }))
  ];


  /* =========================
     FILTRES
  ========================= */

  const filteredContents =
    contents
      .filter(
        (item) =>
          type === "all" ||
          item.contentType === type
      )
      .filter(
        (item) =>
          !search ||
          item.name
            .toLowerCase()
            .includes(search) ||
          item.id
            .toLowerCase()
            .includes(search)
      );


  /* =========================
     À PUBLIER
  ========================= */

  const toPublish =
    filteredContents
      .filter(
        (item) =>
          item.status === "Prêt"
      )
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );


  /* =========================
     PUBLIÉ
  ========================= */

  const published =
    filteredContents
      .filter(
        (item) =>
          item.status === "Publié"
      )
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );


  /* =========================
     CARTE
  ========================= */

  const renderCard =
    (
      item: (typeof contents)[number],
      publishedCard: boolean
    ) => {

      return `
        <article
          class="wod-card publication-card"
        >

          <div class="publication-card-info">

            <span class="wod-card-id">
              ${escapeHtml(item.id)}
            </span>

            <h3 class="publication-card-name">
              ${escapeHtml(item.name)}
            </h3>

          </div>

          <div class="publication-card-actions">

            ${
              !publishedCard
                ? `
                  <button
                    class="wod-view-button"
                    type="button"
                    data-publish-publication="${escapeHtml(item.id)}"
                    data-publication-type="${item.contentType}"
                  >
                    Publier
                  </button>
                `
                : ""
            }

            <button
              class="wod-view-button"
              type="button"
              data-view-publication="${escapeHtml(item.id)}"
              data-publication-type="${item.contentType}"
            >
              Voir
            </button>

          </div>

        </article>
      `;
    };


  /* =========================
     COLONNES
  ========================= */

  publicationsList.innerHTML = `

    <div class="publications-columns">

      <section class="publications-column">

        <div class="publications-column-header">

          <div>
            <span class="eyebrow">
              PUBLICATION
            </span>

            <h3>
              À publier
            </h3>
          </div>

          <span class="publications-column-count">
            ${toPublish.length}
          </span>

        </div>

        <div class="publications-column-list">

          ${
            toPublish.length > 0
              ? toPublish
                  .map(
                    (item) =>
                      renderCard(
                        item,
                        false
                      )
                  )
                  .join("")
              : `
                <div class="empty-state">
                  Aucune publication à publier.
                </div>
              `
          }

        </div>

      </section>


      <section class="publications-column">

        <div class="publications-column-header">

          <div>
            <span class="eyebrow">
              HISTORIQUE
            </span>

            <h3>
              Publié
            </h3>
          </div>

          <span class="publications-column-count">
            ${published.length}
          </span>

        </div>

        <div class="publications-column-list">

          ${
            published.length > 0
              ? published
                  .map(
                    (item) =>
                      renderCard(
                        item,
                        true
                      )
                  )
                  .join("")
              : `
                <div class="empty-state">
                  Aucune publication.
                </div>
              `
          }

        </div>

      </section>

    </div>
  `;
}

export function setupPublicationViewButtons() {

  const publicationsList =
    document.querySelector<HTMLElement>(
      "#publications-list"
    );

  if (!publicationsList) return;

  publicationsList.addEventListener(
    "click",
    (event: MouseEvent) => {

      const target =
        event.target as HTMLElement;

      const publishButton =
        target.closest<HTMLButtonElement>(
          "[data-publish-publication]"
        );

      if (!publishButton) return;

      const id =
        publishButton.dataset.publishPublication;

      const type =
        publishButton.dataset.publicationType;

      if (!id || !type) return;

      if (type === "wod") {

        const wod =
          state.wods.find(
            (item) => item.id === id
          );

        if (!wod) return;

        wod.status = "Publié";
      }

      if (type === "weekly") {

        const weekly =
          state.weeklies.find(
            (item) => item.id === id
          );

        if (!weekly) return;

        weekly.status = "Publié";
      }

      if (type === "wod") {
        saveWods();
      }

      if (type === "weekly") {
        saveWeeklies();
      }

      notifyHubChange();
    }
  );

  publicationsList.onclick =
    (event: MouseEvent) => {

      const target =
        event.target as HTMLElement;

      const viewButton =
        target.closest<HTMLButtonElement>(
          "[data-view-publication]"
        );

      if (!viewButton) return;

      const id =
        viewButton.dataset.viewPublication;

      const type =
        viewButton.dataset.publicationType;

      if (!id || !type) return;

      if (type === "wod") {

        const wod =
          state.wods.find(
            (item) => item.id === id
          );

        if (!wod) return;

        const wodButton =
          document.querySelector<HTMLButtonElement>(
            `[data-view-wod="${id}"]`
          );

        if (wodButton) {

          wodButton.click();

          return;
        }
      }

      if (type === "weekly") {

        const weekly =
          state.weeklies.find(
            (item) => item.id === id
          );

        if (!weekly) return;

        const weeklyButton =
          document.querySelector<HTMLButtonElement>(
            `[data-view-weekly="${id}"]`
          );

        if (weeklyButton) {

          weeklyButton.click();

          return;
        }
      }
    };
}
