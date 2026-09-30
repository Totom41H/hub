import {
  mkdir,
  readFile,
  writeFile,
  remove,
  exists,
  readDir,
  BaseDirectory
} from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { homeDir, join } from "@tauri-apps/api/path";
import { FileAsset, saveFiles, getNextFileNumber, incrementNextFileNumber } from "../data/assets";
import { state } from "../core/state";
import { escapeHtml } from "../core/utils";
import { FILES_DIRECTORY } from "../core/paths";

let isDroppingFile = false;
let selectedFiles: File[] = [];
let droppedPaths: string[] = [];

async function getFilesDirectoryAbsolute(): Promise<string> {
  return join(await homeDir(), FILES_DIRECTORY);
}

async function renderStrnzExplorer(): Promise<void> {

  const tree =
    document.querySelector<HTMLElement>(
      "#files-explorer-tree"
    );

  if (!tree) return;

  tree.innerHTML = `
    <div class="files-explorer-item file">
      Chargement...
    </div>
  `;

  try {

    const contenu =
      await readExplorerDirectory(
        "Desktop/STRNZ/Contenu"
      );

    const identiteVisuelle =
      await readExplorerDirectory(
        "Desktop/STRNZ/Identité Visuelle"
      );

    const picto =
      await readExplorerDirectory(
        "Desktop/STRNZ/Picto"
      );

    tree.innerHTML = `
      ${renderExplorerNode(
        "CONTENU",
        "folder",
        contenu,
        0,
        "C:\\Users\\tom12\\Desktop\\STRNZ"
      )}

      ${renderExplorerNode(
        "IDENTITÉ VISUELLE",
        "folder",
        identiteVisuelle,
        0,
        "C:\\Users\\tom12\\Desktop\\STRNZ"
      )}

      ${renderExplorerNode(
        "PICTO",
        "folder",
        picto,
        0,
        "C:\\Users\\tom12\\Desktop\\STRNZ"
      )}
    `;

  } catch (error) {

    console.error(
      "Impossible de lire les dossiers STRNZ :",
      error
    );

    tree.innerHTML = `
      <div class="files-explorer-item file">
        Impossible de lire les fichiers STRNZ.
      </div>
    `;
  }
}


interface ExplorerNode {
  name: string;
  isDirectory: boolean;
  children?: ExplorerNode[];
}


async function readExplorerDirectory(
  path: string
): Promise<ExplorerNode[]> {

  const entries =
    await readDir(
      path,
      {
        baseDir: BaseDirectory.Home
      }
    );

  const nodes: ExplorerNode[] = [];

  for (const entry of entries) {

    const isDirectory =
      entry.isDirectory;

    nodes.push({
      name: entry.name,
      isDirectory,
      children: isDirectory
        ? await readExplorerDirectory(
            `${path}/${entry.name}`
          )
        : []
    });
  }

  return nodes.sort((a, b) => {

    if (
      a.isDirectory &&
      !b.isDirectory
    ) {
      return -1;
    }

    if (
      !a.isDirectory &&
      b.isDirectory
    ) {
      return 1;
    }

    return a.name.localeCompare(
      b.name
    );
  });
}


function renderExplorerNode(
  name: string,
  type: "folder" | "file",
  children: ExplorerNode[],
  level: number,
  parentPath = ""
): string {

  const icon =
    type === "folder"
      ? `
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H10l2 2h7.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/>
        </svg>
      `
      : `
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M6 3h8l4 4v14H6z"/>
          <path d="M14 3v5h5"/>
        </svg>
      `;

  const currentPath =
    parentPath
      ? `${parentPath}\\${name}`
      : name;

  const hasChildren =
    type === "folder" &&
    children.length > 0;

  return `
    <div
      class="files-explorer-item ${type}"
      data-explorer-folder="${type === "folder" ? "true" : "false"}"
      data-explorer-path="${type === "file" ? escapeHtml(currentPath) : ""}"
      style="padding-left: ${8 + level * 20}px;"
    >

      ${
        type === "folder"
          ? `
            <span class="files-explorer-toggle">
              ${hasChildren ? "▸" : ""}
            </span>
          `
          : `
            <span class="files-explorer-toggle"></span>
          `
      }

      <span class="files-explorer-icon">
        ${icon}
      </span>

      <span class="files-explorer-name">
        ${escapeHtml(name)}
      </span>

    </div>

    ${
      hasChildren
        ? `
          <div class="files-explorer-children hidden">
            ${children
              .map(
                (child) =>
                  renderExplorerNode(
                    child.name,
                    child.isDirectory
                      ? "folder"
                      : "file",
                    child.children || [],
                    level + 1,
                    currentPath
                  )
              )
              .join("")}
          </div>
        `
        : ""
    }
  `;
}

function setupExplorerFileOpening(): void {

  const explorerTree =
    document.querySelector<HTMLElement>(
      "#files-explorer-tree"
    );

  if (!explorerTree) return;

  explorerTree.addEventListener(
    "dblclick",
    async (event) => {

      const target =
        event.target as HTMLElement;

      const file =
        target.closest<HTMLElement>(
          ".files-explorer-item.file"
        );

      if (!file) return;

      const filePath =
        file.dataset.explorerPath;

      if (!filePath) return;

      try {

        await openPath(filePath);

      } catch (error) {

        console.error(
          "Impossible d'ouvrir le fichier STRNZ :",
          error
        );

      }
    }
  );
}

function splitFileName(name: string): { base: string; extension: string } {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return { base: name, extension: "" };
  return { base: name.slice(0, dot), extension: name.slice(dot) };
}

async function getAvailableFileName(originalName: string): Promise<string> {
  const { base, extension } = splitFileName(originalName);
  const usedNames = new Set(state.files.map((file) => file.name.toLowerCase()));
  const directory = FILES_DIRECTORY;

  let candidate = originalName;
  let index = 2;

  while (
    usedNames.has(candidate.toLowerCase()) ||
    await exists(`${directory}/${candidate}`, { baseDir: BaseDirectory.Home })
  ) {
    candidate = `${base} (${index})${extension}`;
    index++;
  }

  return candidate;
}

function formatFileSize(
  size: number
): string {

  if (size < 1024) {
    return `${size} octets`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} Ko`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} Mo`;
}

export function renderFiles(
  filesToRender: FileAsset[] = state.files
) {

  const filesList =
    document.querySelector<HTMLElement>(
      "#files-list"
    );

  if (!filesList) return;

  if (filesToRender.length === 0) {

    return;
  }

  filesList.innerHTML =
    filesToRender.map((file) => {

      return `
        <article class="wod-card file-card">

          <div class="file-card-info">

            <span class="wod-card-id">
              ${escapeHtml(file.id)}
            </span>

            <h3 class="file-card-name">
              ${escapeHtml(file.name)}
            </h3>

            <div class="file-card-meta">
              ${escapeHtml(file.type)}
              ·
              ${formatFileSize(file.size)}
            </div>

          </div>

          <div class="file-card-actions">

            <button
              class="wod-edit-button"
              type="button"
              data-open-file="${file.id}"
            >
              Ouvrir
            </button>

            <button
              class="wod-delete-button"
              type="button"
              data-delete-file="${file.id}"
            >
              Supprimer
            </button>

          </div>

        </article>
      `;

    }).join("");

  setupFileOpenButtons();
}

export function setupFileOpenButtons() {

  const buttons =
    document.querySelectorAll<HTMLButtonElement>(
      "[data-open-file]"
    );

  buttons.forEach((button) => {

    button.onclick = async () => {

      const fileId =
        button.dataset.openFile;

      if (!fileId) return;

      const file =
        state.files.find(
          (item) => item.id === fileId
        );

      if (!file) return;

      try {

        const filePath = await join(
          await getFilesDirectoryAbsolute(),
          file.name
        );

        await openPath(filePath);

      } catch (error) {

        console.error(
          "Erreur lors de l'ouverture du fichier :",
          error
        );

      }

    };

  });
}

export function setupFilesFilters() {

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#files-search"
    );

  const typeFilter =
    document.querySelector<HTMLSelectElement>(
      "#files-type-filter"
    );

  if (!searchInput || !typeFilter) return;

  const applyFilters = () => {

    const search =
      searchInput.value
        .trim()
        .toLowerCase();

    const selectedType =
      typeFilter.value;

    const filteredFiles =
      state.files.filter((file) => {

        const matchesSearch =
          file.name
            .toLowerCase()
            .includes(search) ||
          file.id
            .toLowerCase()
            .includes(search);

        let matchesType = true;

        if (selectedType === "visual") {
          matchesType =
            file.type.startsWith("image/");
        }

        if (selectedType === "video") {
          matchesType =
            file.type.startsWith("video/");
        }

        if (selectedType === "document") {
          matchesType =
            file.type.includes("pdf") ||
            file.type.includes("word") ||
            file.type.includes("document") ||
            file.type.includes("text");
        }

        if (selectedType === "other") {
          matchesType =
            !file.type.startsWith("image/") &&
            !file.type.startsWith("video/") &&
            !file.type.includes("pdf") &&
            !file.type.includes("word") &&
            !file.type.includes("document") &&
            !file.type.includes("text");
        }

        return (
          matchesSearch &&
          matchesType
        );
      });

    renderFiles(filteredFiles);
  };

  searchInput.addEventListener(
    "input",
    applyFilters
  );

  typeFilter.addEventListener(
    "change",
    applyFilters
  );
}

function renderFilePreview() {

  const filePreview =
    document.querySelector<HTMLElement>(
      "#file-preview"
    );

  if (!filePreview) return;

  const totalFiles =
    selectedFiles.length +
    droppedPaths.length;

  if (totalFiles === 0) {

    filePreview.innerHTML = `
      <div class="file-preview-icon">
        📄
      </div>

      <div class="file-preview-info">

        <strong>
          Aucun fichier sélectionné
        </strong>

        <span>
          Les fichiers sélectionnés apparaîtront ici
        </span>

      </div>
    `;

    return;
  }

  const selectedHtml =
    selectedFiles
      .map(
        (file, index) => `
          <div class="file-preview-item">

            <div class="file-preview-icon">
              📄
            </div>

            <div class="file-preview-info">

              <strong>
                ${escapeHtml(file.name)}
              </strong>

              <span>
                ${formatFileSize(file.size)}
              </span>

            </div>

            <button
              type="button"
              class="file-preview-remove"
              data-remove-selected="${index}"
            >
              ×
            </button>

          </div>
        `
      )
      .join("");

  const droppedHtml =
    droppedPaths
      .map(
        (path, index) => {

          const fileName =
            path.split("\\").pop() ||
            path.split("/").pop() ||
            "Fichier";

          return `
            <div class="file-preview-item">

              <div class="file-preview-icon">
                📄
              </div>

              <div class="file-preview-info">

                <strong>
                  ${escapeHtml(fileName)}
                </strong>

                <span>
                  Fichier prêt à être ajouté
                </span>

              </div>

              <button
                type="button"
                class="file-preview-remove"
                data-remove-dropped="${index}"
              >
                ×
              </button>

            </div>
          `;
        }
      )
      .join("");

  filePreview.innerHTML = `
    <div class="file-preview-list">

      ${selectedHtml}
      ${droppedHtml}

    </div>

    <div class="file-preview-count">
      ${totalFiles}
      fichier${totalFiles > 1 ? "s" : ""}
      sélectionné${totalFiles > 1 ? "s" : ""}
    </div>
  `;
}

export async function setupFiles() {
  await renderStrnzExplorer();
  setupExplorerFileOpening();

    const explorerTree =
      document.querySelector<HTMLElement>(
        "#files-explorer-tree"
      );

    explorerTree?.addEventListener(
      "click",
      (event) => {

        const target =
          event.target as HTMLElement;

        const folder =
          target.closest<HTMLElement>(
            '[data-explorer-folder="true"]'
          );

        if (!folder) return;

        const children =
          folder.nextElementSibling;

        if (
          !children ||
          !children.classList.contains(
            "files-explorer-children"
          )
        ) {
          return;
        }

        const toggle =
          folder.querySelector<HTMLElement>(
            ".files-explorer-toggle"
          );

        const isHidden =
          children.classList.contains("hidden");

        children.classList.toggle(
          "hidden",
          !isHidden
        );

        if (toggle) {
          toggle.textContent =
            isHidden ? "▾" : "▸";
        }
      }
    );

  const addButton =
    document.querySelector<HTMLButtonElement>(
      "#files-add-button"
    );

  const formPanel =
    document.querySelector<HTMLElement>(
      "#file-form-panel"
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#file-form-cancel"
    );

  const saveButton =
    document.querySelector<HTMLButtonElement>(
      "#file-form-save"
    );

  const fileInput =
    document.querySelector<HTMLInputElement>(
      "#file-input"
    );

  const uploadZone =
    document.querySelector<HTMLElement>(
      "#file-upload-zone"
    );

  const filesList =
    document.querySelector<HTMLElement>(
      "#files-list"
    );

  const filePreview =
  document.querySelector<HTMLElement>(
    "#file-preview"
  );

  if (
    !addButton ||
    !formPanel ||
    !cancelButton ||
    !saveButton ||
    !fileInput ||
    !filePreview ||
    !uploadZone ||
    !filesList
  ) {
    return;
  }

  /* =========================
     FERMETURE
  ========================= */

  function closeForm() {

    if (!formPanel || !fileInput) {
      return;
    }

    formPanel.style.display =
      "none";

    fileInput.value = "";

    selectedFiles = [];
    droppedPaths = [];

    delete fileInput.dataset.droppedPath;

    renderFilePreview();
  }


  /* =========================
     OUVERTURE
  ========================= */

  addButton.onclick = () => {

    formPanel.style.display =
      "flex";

    selectedFiles = [];
    droppedPaths = [];

    fileInput.value = "";

    renderFilePreview();
  };

  cancelButton.onclick =
    closeForm;

  formPanel.onclick = (event) => {
    if (event.target === formPanel) {
      closeForm();
    }
  };

  /* =========================
     SÉLECTION CLASSIQUE
  ========================= */

  uploadZone.onclick = () => {

    if (isDroppingFile) {
      return;
    }

    fileInput.click();
  };

  fileInput.onchange = () => {

  filePreview?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    const removeSelected =
      target.closest<HTMLButtonElement>(
        "[data-remove-selected]"
      );

    if (removeSelected) {
      const index = Number(
        removeSelected.dataset.removeSelected
      );

      selectedFiles.splice(index, 1);
      renderFilePreview();
      return;
    }

    const removeDropped =
      target.closest<HTMLButtonElement>(
        "[data-remove-dropped]"
      );

    if (removeDropped) {
      const index = Number(
        removeDropped.dataset.removeDropped
      );

      droppedPaths.splice(index, 1);
      renderFilePreview();
    }
  });

    const newFiles =
      Array.from(
        fileInput.files || []
      );

    if (newFiles.length === 0) return;

    selectedFiles.push(
      ...newFiles
    );

    fileInput.value = "";

    renderFilePreview();
  };


  /* =========================
     ENREGISTREMENT
  ========================= */

  saveButton.onclick =
    async () => {

      if (
        selectedFiles.length === 0 &&
        droppedPaths.length === 0
      ) {
        return;
      }

      try {

        const filesDirectory =
          "Desktop/STRNZ/HUB/strnz-hub/assets/files";

        await mkdir(
          filesDirectory,
          {
            baseDir: BaseDirectory.Home,
            recursive: true
          }
        );

        /* =========================
           FICHIERS CLASSIQUES
        ========================= */

        for (
          const selectedFile
          of selectedFiles
        ) {

          const fileBytes =
            new Uint8Array(
              await selectedFile.arrayBuffer()
            );

          const safeFileName =
            await getAvailableFileName(selectedFile.name);

          const filePath =
            `${filesDirectory}/${safeFileName}`;

          await writeFile(
            filePath,
            fileBytes,
            {
              baseDir: BaseDirectory.Home
            }
          );

          const newFile: FileAsset = {

            id:
              `FILE-${String(
                getNextFileNumber()
              ).padStart(3, "0")}`,

            name:
              safeFileName,

            type:
              selectedFile.type ||
              "Autre",

            size:
              selectedFile.size,

            date:
              new Date().toISOString()
          };

          incrementNextFileNumber();

          state.files.push(
            newFile
          );
        }


        /* =========================
           FICHIERS DRAG & DROP
        ========================= */

        for (
          const droppedPath
          of droppedPaths
        ) {

          const fileName =
            droppedPath.split("\\").pop() ||
            droppedPath.split("/").pop() ||
            "Fichier";

          const fileData =
            await readFile(
              droppedPath
            );

          const safeFileName =
            await getAvailableFileName(fileName);

          const filePath =
            `${filesDirectory}/${safeFileName}`;

          await writeFile(
            filePath,
            fileData,
            {
              baseDir: BaseDirectory.Home
            }
          );

          const newFile: FileAsset = {

            id:
              `FILE-${String(
                getNextFileNumber()
              ).padStart(3, "0")}`,

            name:
              safeFileName,

            type:
              "Autre",

            size:
              fileData.length,

            date:
              new Date().toISOString()
          };

          incrementNextFileNumber();

          state.files.push(
            newFile
          );
        }


        /* =========================
           MISE À JOUR
        ========================= */

        saveFiles();
        renderFiles();

        closeForm();

      } catch (error) {

        console.error(
          "Impossible d'enregistrer les fichiers :",
          error
        );

        alert(
          `Erreur : ${String(error)}`
        );
      }
    };


  /* =========================
     SUPPRESSION
  ========================= */

  filesList.onclick =
    async (event: MouseEvent) => {

      const target =
        event.target as HTMLElement;

      const deleteButton =
        target.closest<HTMLButtonElement>(
          "[data-delete-file]"
        );

      if (!deleteButton) return;

      const fileId =
        deleteButton.dataset.deleteFile;

      if (!fileId) return;

      const fileIndex =
        state.files.findIndex(
          (file) => file.id === fileId
        );

      if (fileIndex === -1) return;

      const file = state.files[fileIndex];
      const confirmed = window.confirm(
        `Supprimer ${file.id} "${file.name}" ?\n\nLe fichier sera supprimé du disque.`
      );

      if (!confirmed) return;

      try {
        const relativePath = `${FILES_DIRECTORY}/${file.name}`;
        if (await exists(relativePath, { baseDir: BaseDirectory.Home })) {
          await remove(relativePath, { baseDir: BaseDirectory.Home });
        }
      } catch (error) {
        console.error("Impossible de supprimer le fichier du disque :", error);
        alert(`Le fichier n'a pas pu être supprimé du disque.\n\n${String(error)}`);
        return;
      }

      state.files.splice(fileIndex, 1);

      saveFiles();
      renderFiles();
    };
}

export async function setupTauriFileDragDrop() {
  const appWindow = getCurrentWebviewWindow();
  const uploadZone = document.querySelector<HTMLElement>("#file-upload-zone");
  if (!uploadZone) return;
  await appWindow.onDragDropEvent((event) => {
    if (event.payload.type === "over") {
      const rect = uploadZone.getBoundingClientRect();
      const position = event.payload.position;
      const scale = window.devicePixelRatio || 1;
      const x = position.x / scale;
      const y = position.y / scale;
      uploadZone.classList.toggle("file-upload-dragover", x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
      return;
    }
    if (event.payload.type === "leave") { uploadZone.classList.remove("file-upload-dragover"); return; }
    if (event.payload.type === "drop") {
      uploadZone.classList.remove("file-upload-dragover");
      const rect = uploadZone.getBoundingClientRect();
      const position = event.payload.position;
      const scale = window.devicePixelRatio || 1;
      const x = position.x / scale;
      const y = position.y / scale;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return;
      const paths = event.payload.paths || [];
      if (paths.length === 0) return;
      droppedPaths.push(...paths);
      renderFilePreview();
    }
  });
}
