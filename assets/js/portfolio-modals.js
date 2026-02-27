import { onLanguageChange, t } from './i18n.js';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Project-specific modal content is intentionally left empty until updated details are provided.
const PORTFOLIO_MODAL_CONTENT = {};

let projects = [];
let modalOverlayEl;
let modalDialogEl;
let activeProjectId = '';
let lastTriggerEl = null;

const modalRefs = {
  closeBtn: null,
  title: null,
  teaser: null,
  tags: null,
  image: null,
  challengeLabel: null,
  challengeText: null,
  solutionLabel: null,
  solutionText: null,
  outcomeLabel: null,
  outcomeText: null,
  link: null
};

function resolveText(key, fallback = '') {
  if (!key) return fallback;
  return t(key, fallback);
}

function createBadge(label) {
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = label;
  return badge;
}

function getProjectById(projectId) {
  return projects.find((project) => project.id === projectId);
}

function buildModal() {
  modalOverlayEl = document.createElement('div');
  modalOverlayEl.className = 'rd-modal-overlay';

  modalDialogEl = document.createElement('section');
  modalDialogEl.className = 'rd-modal';
  modalDialogEl.setAttribute('role', 'dialog');
  modalDialogEl.setAttribute('aria-modal', 'true');
  modalDialogEl.setAttribute('aria-labelledby', 'portfolioModalTitle');
  modalDialogEl.setAttribute('tabindex', '-1');

  const header = document.createElement('header');
  header.className = 'rd-modal-header';

  modalRefs.title = document.createElement('h3');
  modalRefs.title.id = 'portfolioModalTitle';

  modalRefs.closeBtn = document.createElement('button');
  modalRefs.closeBtn.type = 'button';
  modalRefs.closeBtn.className = 'rd-modal-close';

  header.appendChild(modalRefs.title);
  header.appendChild(modalRefs.closeBtn);

  modalRefs.teaser = document.createElement('p');
  modalRefs.teaser.className = 'rd-modal-teaser';

  modalRefs.tags = document.createElement('div');
  modalRefs.tags.className = 'badges rd-modal-tags';

  const media = document.createElement('div');
  media.className = 'rd-modal-media';

  modalRefs.image = document.createElement('img');
  modalRefs.image.loading = 'lazy';
  media.appendChild(modalRefs.image);

  const content = document.createElement('div');
  content.className = 'rd-modal-content';

  const challenge = document.createElement('article');
  challenge.className = 'rd-modal-block';
  modalRefs.challengeLabel = document.createElement('h4');
  modalRefs.challengeText = document.createElement('p');
  challenge.appendChild(modalRefs.challengeLabel);
  challenge.appendChild(modalRefs.challengeText);

  const solution = document.createElement('article');
  solution.className = 'rd-modal-block';
  modalRefs.solutionLabel = document.createElement('h4');
  modalRefs.solutionText = document.createElement('p');
  solution.appendChild(modalRefs.solutionLabel);
  solution.appendChild(modalRefs.solutionText);

  const outcome = document.createElement('article');
  outcome.className = 'rd-modal-block';
  modalRefs.outcomeLabel = document.createElement('h4');
  modalRefs.outcomeText = document.createElement('p');
  outcome.appendChild(modalRefs.outcomeLabel);
  outcome.appendChild(modalRefs.outcomeText);

  content.appendChild(challenge);
  content.appendChild(solution);
  content.appendChild(outcome);

  modalRefs.link = document.createElement('a');
  modalRefs.link.className = 'btn primary rd-modal-link';
  modalRefs.link.target = '_blank';
  modalRefs.link.rel = 'noopener noreferrer';

  modalDialogEl.appendChild(header);
  modalDialogEl.appendChild(modalRefs.teaser);
  modalDialogEl.appendChild(modalRefs.tags);
  modalDialogEl.appendChild(media);
  modalDialogEl.appendChild(content);
  modalDialogEl.appendChild(modalRefs.link);

  modalOverlayEl.appendChild(modalDialogEl);

  modalRefs.closeBtn.addEventListener('click', closeModal);
  modalOverlayEl.addEventListener('click', (event) => {
    if (event.target === modalOverlayEl) {
      closeModal();
    }
  });

  modalDialogEl.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = Array.from(modalDialogEl.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute('hidden') && el.offsetParent !== null
    );

    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function renderModal(project) {
  const title = resolveText(project.titleKey, project.titleFallback);
  const teaser = resolveText(project.descKey, project.descFallback);
  const detailsFallback = teaser || t('portfolioDetailsSoon', teaser);
  const challenge = project.modalChallenge || resolveText(project.challengeKey, detailsFallback);
  const solution = project.modalSolution || resolveText(project.solutionKey, detailsFallback);
  const outcome = project.modalOutcome || resolveText(project.outcomeKey, detailsFallback);

  modalRefs.title.textContent = title;
  modalRefs.teaser.textContent = teaser;
  modalRefs.image.src = project.imageSrc;
  modalRefs.image.alt = title;

  modalRefs.closeBtn.textContent = t('rdModalClose', 'Close');
  modalRefs.closeBtn.setAttribute('aria-label', t('rdModalClose', 'Close'));

  modalRefs.challengeLabel.textContent = t('rdModalChallenge', 'Challenge');
  modalRefs.challengeText.textContent = challenge;

  modalRefs.solutionLabel.textContent = t('rdModalSolution', 'Solution approach');
  modalRefs.solutionText.textContent = solution;

  modalRefs.outcomeLabel.textContent = t('rdModalOutcome', 'Outcome');
  modalRefs.outcomeText.textContent = outcome;

  const badges = project.badges.map((badge) => createBadge(resolveText(badge.key, badge.fallback)));
  modalRefs.tags.replaceChildren(...badges);

  if (project.externalUrl) {
    modalRefs.link.hidden = false;
    modalRefs.link.href = project.externalUrl;
    modalRefs.link.textContent = t('rdModalVisitLink', 'Visit source');
  } else {
    modalRefs.link.hidden = true;
    modalRefs.link.removeAttribute('href');
    modalRefs.link.textContent = '';
  }
}

function openModal(projectId, triggerEl) {
  const project = getProjectById(projectId);
  if (!project) return;

  if (!modalOverlayEl) {
    buildModal();
  }

  activeProjectId = projectId;
  lastTriggerEl = triggerEl;

  renderModal(project);

  if (!modalOverlayEl.parentNode) {
    document.body.appendChild(modalOverlayEl);
  }

  document.body.classList.add('modal-open');

  requestAnimationFrame(() => {
    modalRefs.closeBtn?.focus();
  });
}

function closeModal() {
  if (modalOverlayEl?.parentNode) {
    modalOverlayEl.parentNode.removeChild(modalOverlayEl);
  }

  document.body.classList.remove('modal-open');
  activeProjectId = '';

  if (lastTriggerEl && document.contains(lastTriggerEl)) {
    lastTriggerEl.focus();
  }
}

function extractProject(card, index) {
  const titleEl = card.querySelector('h3[data-i18n]');
  const descEl = card.querySelector('p[data-i18n]');
  const imageEl = card.querySelector('img');

  if (!titleEl || !descEl || !imageEl) {
    return null;
  }

  const titleKey = titleEl.dataset.i18n || '';
  const detailConfig = PORTFOLIO_MODAL_CONTENT[titleKey] || {};
  const modalChallenge = card.dataset.modalChallenge?.trim() || '';
  const modalSolution = card.dataset.modalSolution?.trim() || '';
  const modalOutcome = card.dataset.modalOutcome?.trim() || '';
  const modalLink = card.dataset.modalLink?.trim() || '';

  const badges = Array.from(card.querySelectorAll('.badge')).map((badgeEl) => ({
    key: badgeEl.dataset.i18n || '',
    fallback: badgeEl.textContent?.trim() || ''
  }));

  const project = {
    id: `portfolio-${index + 1}`,
    element: card,
    titleKey,
    titleFallback: titleEl.textContent?.trim() || '',
    descKey: descEl.dataset.i18n || '',
    descFallback: descEl.textContent?.trim() || '',
    imageSrc: imageEl.getAttribute('src') || '',
    badges,
    modalChallenge,
    modalSolution,
    modalOutcome,
    challengeKey: detailConfig.challengeKey || '',
    solutionKey: detailConfig.solutionKey || '',
    outcomeKey: detailConfig.outcomeKey || '',
    externalUrl: modalLink || detailConfig.externalUrl || ''
  };

  return project;
}

function updateTriggerLabels() {
  projects.forEach((project) => {
    const label = resolveText(project.titleKey, project.titleFallback);
    project.element.setAttribute('aria-label', label);
  });
}

function makeCardInteractive(project) {
  const card = project.element;
  card.classList.add('portfolio-modal-trigger');
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-haspopup', 'dialog');

  card.addEventListener('click', () => {
    openModal(project.id, card);
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(project.id, card);
    }
  });
}

export function initPortfolioModals() {
  if (document.body?.dataset.page !== 'portfolio') return;

  const cards = Array.from(document.querySelectorAll('#portfoy .project-card'));
  if (!cards.length) return;

  projects = cards
    .map((card, index) => extractProject(card, index))
    .filter(Boolean);

  if (!projects.length) return;

  projects.forEach((project) => {
    makeCardInteractive(project);
  });

  updateTriggerLabels();

  onLanguageChange(() => {
    updateTriggerLabels();

    if (activeProjectId) {
      const activeProject = getProjectById(activeProjectId);
      if (activeProject) {
        renderModal(activeProject);
      }
    }
  });
}
