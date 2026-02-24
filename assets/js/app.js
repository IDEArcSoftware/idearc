import { initI18n } from './i18n.js';
import { initNavigation } from './navigation.js';
import { initForms } from './forms.js';
import { initProtectedContacts } from './protect.js';
import { initMetrics } from './metrics.js';
import { initWordCloud } from './word-cloud.js';
import { initRdProjects } from './rd-projects.js';
import { initPortfolioModals } from './portfolio-modals.js';

function initApp() {
  initI18n();
  initNavigation();
  initForms();
  initProtectedContacts();
  initMetrics();
  initWordCloud();
  initRdProjects();
  initPortfolioModals();
}

document.addEventListener('DOMContentLoaded', initApp);
