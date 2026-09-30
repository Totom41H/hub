import { loadWods } from "./data/wods";
import { loadWeeklies } from "./data/weeklies";
import { loadFiles } from "./data/assets";
import { loadExercises } from "./data/exercises";
import { loadTexts } from "./data/texts";
import { loadPublications } from "./data/publications";

import {
  configureHubRefresh,
} from "./core/hubRefresh";

import {
  configureWodModule,
  setupWodForm,
  renderWods,
  setupWodViewButtons,
  setupWodFilters,
} from "./modules/wods";

import {
  configureWeeklyModule,
  setupWeeklyForm,
  renderWeeklies,
  setupWeeklyFilters,
} from "./modules/weeklies";

import {
  renderExercises,
  setupExercises,
  setupExerciseFilters,
} from "./modules/exercises";

import {
  renderProduction,
  setupProductionTasks,
  setupProductionFilters,
  setupProductionPublish,
} from "./modules/production";

import {
  configureDashboardModule,
  setupDashboardButton,
  setupDashboardStats,
  renderDashboardPublications,
  renderDashboardTasks,
  renderDashboardStats,
} from "./modules/dashboard";

import {
  configureCalendarModule,
  setupCalendar,
  renderCalendar,
} from "./modules/calendar";

import {
  renderTexts,
  setupTextsEditor,
  setupTextsFilters,
  setupTextsCopy,
} from "./modules/texts";

import {
  renderPublications,
  setupPublicationViewButtons,
} from "./modules/publications";

import {
  renderFiles,
  setupFiles,
  setupFilesFilters,
  setupFileOpenButtons,
  setupTauriFileDragDrop,
} from "./modules/files";

const pages = document.querySelectorAll<HTMLElement>(".page");
const navItems = document.querySelectorAll<HTMLButtonElement>(".nav-item");
const pageTitle = document.querySelector<HTMLElement>("#page-title");

const pageNames: Record<string, string> = {
  dashboard: "Dashboard",
  wod: "WOD",
  weekly: "Weekly",
  exercises: "Exercices",
  calendar: "Calendrier",
  production: "Production",
  publications: "Publications",
  texts: "Textes",
  files: "Fichiers",
  settings: "Paramètres",
};

function showPage(pageId: string) {
  pages.forEach((page) => {
    page.classList.toggle("active", page.id === pageId);
  });

  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });

  if (pageTitle) {
    pageTitle.textContent = pageNames[pageId] ?? "Dashboard";
  }
}

function refreshHubViews() {
  renderWods();
  renderWeeklies();
  renderProduction();
  renderPublications();
  renderCalendar();

  renderDashboardPublications();
  renderDashboardTasks();
  renderDashboardStats();
}

configureHubRefresh(refreshHubViews);

function setupNavigation() {
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const pageId = item.dataset.page;
      if (pageId) showPage(pageId);
    });
  });

  const pageLinks = document.querySelectorAll<HTMLButtonElement>(
    "[data-page-target]"
  );

  pageLinks.forEach((button) => {
    button.addEventListener("click", () => {
      const pageId = button.dataset.pageTarget;
      if (pageId) showPage(pageId);
    });
  });
}

function configureModules() {
  configureDashboardModule({ showPage });
  configureCalendarModule({ showPage });
  configureWodModule({ showPage });
  configureWeeklyModule({ showPage });
}

function setupHubRefresh() {
  const refreshButton = document.querySelector<HTMLButtonElement>(
    "#refresh-hub-button"
  );

  if (!refreshButton) return;

  refreshButton.onclick = () => {
    const activePage = document.querySelector<HTMLElement>(".page.active");
    const currentPageId = activePage?.id || "dashboard";

    loadWods();
    loadWeeklies();
    loadFiles();
    loadExercises();
    loadTexts();
    loadPublications();

    renderExercises();
    renderFiles();
    renderTexts();
    refreshHubViews();

    showPage(currentPageId);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  configureModules();
  setupHubRefresh();

  setupWodForm();
  setupDashboardButton();
  setupDashboardStats();
  setupWodFilters();
  setupProductionTasks();
  setupProductionFilters();
  setupProductionPublish();
  setupWodViewButtons();
  setupWeeklyForm();
  setupWeeklyFilters();
  setupExercises();
  setupExerciseFilters();

  loadWods();
  loadWeeklies();
  loadFiles();
  loadExercises();
  loadTexts();
  loadPublications();

  setupCalendar();

  renderExercises();
  renderFiles();
  renderTexts();

  await setupFiles();
  setupFilesFilters();
  setupFileOpenButtons();
  await setupTauriFileDragDrop();

  setupTextsEditor();
  setupTextsFilters();
  setupTextsCopy();
  setupPublicationViewButtons();

  const publicationsSearch = document.querySelector<HTMLInputElement>(
    "#publications-search"
  );
  const publicationsTypeFilter =
    document.querySelector<HTMLSelectElement>("#publications-type-filter");

  publicationsSearch?.addEventListener("input", renderPublications);
  publicationsTypeFilter?.addEventListener("change", renderPublications);

  refreshHubViews();

  showPage("dashboard");
});
