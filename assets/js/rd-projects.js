import { onLanguageChange, t } from './i18n.js';

const RD_PROJECTS = [
  {
    id: 'rd-01',
    image: './media/uploads/yalova-01.jpg',
    tagKeys: ['navResearch'],
    titleKey: 'rdProject01Title',
    teaserKey: 'rdProject01Teaser',
    challengeKey: 'rdProject01Challenge',
    solutionKey: 'rdProject01Solution',
    outcomeKey: 'rdProject01Outcome',
    externalUrl: ''
  },
  {
    id: 'rd-02',
    image: './media/uploads/askoop-01.png',
    tagKeys: ['navResearch'],
    titleKey: 'rdProject02Title',
    teaserKey: 'rdProject02Teaser',
    challengeKey: 'rdProject02Challenge',
    solutionKey: 'rdProject02Solution',
    outcomeKey: 'rdProject02Outcome',
    externalUrl: ''
  },
  {
    id: 'rd-03',
    image: './media/uploads/elazig-01.jpg',
    tagKeys: ['navResearch'],
    titleKey: 'rdProject03Title',
    teaserKey: 'rdProject03Teaser',
    challengeKey: 'rdProject03Challenge',
    solutionKey: 'rdProject03Solution',
    outcomeKey: 'rdProject03Outcome',
    externalUrl: ''
  },
  {
    id: 'rd-04',
    image: './media/uploads/ibb-01.jpg',
    tagKeys: ['navResearch'],
    titleKey: 'rdProject04Title',
    teaserKey: 'rdProjectGenericTeaser',
    challengeKey: 'rdProjectGenericChallenge',
    solutionKey: 'rdProjectGenericSolution',
    outcomeKey: 'rdProjectGenericOutcome',
    externalUrl: ''
  },
  {
    id: 'rd-05',
    image: './media/uploads/desb-02.jpg',
    tagKeys: ['navResearch'],
    titleKey: 'rdProject05Title',
    teaserKey: 'rdProjectGenericTeaser',
    challengeKey: 'rdProjectGenericChallenge',
    solutionKey: 'rdProjectGenericSolution',
    outcomeKey: 'rdProjectGenericOutcome',
    externalUrl: ''
  },
  {
    id: 'rd-06',
    image: './media/uploads/manisaeah-01.jpg',
    tagKeys: ['navResearch'],
    titleKey: 'rdProject06Title',
    teaserKey: 'rdProject06Teaser',
    challengeKey: 'rdProject06Challenge',
    solutionKey: 'rdProject06Solution',
    outcomeKey: 'rdProject06Outcome',
    externalUrl: ''
  },
  {
    id: 'rd-07',
    image: './media/uploads/igtod-01.jpg',
    tagKeys: ['navResearch'],
    titleKey: 'rdProject07Title',
    teaserKey: 'rdProject07Teaser',
    challengeKey: 'rdProject07Challenge',
    solutionKey: 'rdProject07Solution',
    outcomeKey: 'rdProject07Outcome',
    externalUrl: ''
  },
  {
    id: 'rd-08',
    image: './media/uploads/TERSANEISTANBUL.jpg',
    tagKeys: ['navResearch'],
    titleKey: 'rdProject08Title',
    teaserKey: 'rdProjectGenericTeaser',
    challengeKey: 'rdProjectGenericChallenge',
    solutionKey: 'rdProjectGenericSolution',
    outcomeKey: 'rdProjectGenericOutcome',
    externalUrl: ''
  },
  {
    id: 'rd-09',
    image: './media/uploads/KUCUKCEKMECE.jpg',
    tagKeys: ['navResearch'],
    titleKey: 'rdProject09Title',
    teaserKey: 'rdProjectGenericTeaser',
    challengeKey: 'rdProjectGenericChallenge',
    solutionKey: 'rdProjectGenericSolution',
    outcomeKey: 'rdProjectGenericOutcome',
    externalUrl: ''
  },
  {
    id: 'rd-10',
    image: './media/uploads/UMRANIYE.jpg',
    tagKeys: ['navResearch'],
    titleKey: 'rdProject10Title',
    teaserKey: 'rdProjectGenericTeaser',
    challengeKey: 'rdProjectGenericChallenge',
    solutionKey: 'rdProjectGenericSolution',
    outcomeKey: 'rdProjectGenericOutcome',
    externalUrl: ''
  },
  {
    id: 'rd-11',
    image: './media/uploads/yalova-01.jpg',
    tagKeys: ['navResearch'],
    titleKey: 'rdProject11Title',
    teaserKey: 'rdProject11Teaser',
    challengeKey: 'rdProject11Challenge',
    solutionKey: 'rdProject11Solution',
    outcomeKey: 'rdProject11Outcome',
    externalUrl: ''
  }
];

const VISIBLE_RD_PROJECT_IDS = ['rd-01', 'rd-02', 'rd-07', 'rd-03', 'rd-06', 'rd-11'];
const RD_PROJECT_TITLE_OVERRIDES = {
  'rd-06': 'GIS',
  'rd-07': 'STREAM'
};

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

let gridEl;
let modalRootEl;
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

function getProjectById(projectId) {
  return RD_PROJECTS.find((project) => project.id === projectId);
}

function getVisibleProjects() {
  return VISIBLE_RD_PROJECT_IDS
    .map((id) => getProjectById(id))
    .filter(Boolean);
}

function getProjectTitle(project) {
  return RD_PROJECT_TITLE_OVERRIDES[project.id] ?? t(project.titleKey);
}

function createBadge(tagKey) {
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = t(tagKey);
  return badge;
}

function createProjectCard(project) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'project-card rd-project-card';
  button.dataset.projectId = project.id;
  button.setAttribute('aria-haspopup', 'dialog');

  const image = document.createElement('img');
  image.src = project.image;
  image.alt = getProjectTitle(project);

  const body = document.createElement('div');
  body.className = 'project-body';

  const badges = document.createElement('div');
  badges.className = 'badges';
  project.tagKeys.forEach((tagKey) => {
    badges.appendChild(createBadge(tagKey));
  });

  const title = document.createElement('h3');
  title.textContent = getProjectTitle(project);

  const teaser = document.createElement('p');
  teaser.textContent = t(project.teaserKey);

  body.appendChild(badges);
  body.appendChild(title);
  body.appendChild(teaser);

  button.appendChild(image);
  button.appendChild(body);

  button.addEventListener('click', () => {
    openModal(project.id, button);
  });

  return button;
}

function renderProjectGrid() {
  if (!gridEl) return;

  const visibleProjects = getVisibleProjects();
  const fragment = document.createDocumentFragment();
  visibleProjects.forEach((project) => {
    fragment.appendChild(createProjectCard(project));
  });

  gridEl.classList.toggle('research-grid-six', visibleProjects.length === 6);
  gridEl.replaceChildren(fragment);
}

function buildModal() {
  modalOverlayEl = document.createElement('div');
  modalOverlayEl.className = 'rd-modal-overlay';

  modalDialogEl = document.createElement('section');
  modalDialogEl.className = 'rd-modal';
  modalDialogEl.setAttribute('role', 'dialog');
  modalDialogEl.setAttribute('aria-modal', 'true');
  modalDialogEl.setAttribute('aria-labelledby', 'rdModalTitle');
  modalDialogEl.setAttribute('tabindex', '-1');

  const header = document.createElement('header');
  header.className = 'rd-modal-header';

  modalRefs.title = document.createElement('h3');
  modalRefs.title.id = 'rdModalTitle';

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
  modalRefs.title.textContent = getProjectTitle(project);
  modalRefs.teaser.textContent = t(project.teaserKey);
  modalRefs.image.src = project.image;
  modalRefs.image.alt = getProjectTitle(project);

  modalRefs.tags.replaceChildren(
    ...project.tagKeys.map((tagKey) => createBadge(tagKey))
  );

  modalRefs.closeBtn.textContent = t('rdModalClose');
  modalRefs.closeBtn.setAttribute('aria-label', t('rdModalClose'));

  modalRefs.challengeLabel.textContent = t('rdModalChallenge');
  modalRefs.challengeText.textContent = t(project.challengeKey);

  modalRefs.solutionLabel.textContent = t('rdModalSolution');
  modalRefs.solutionText.textContent = t(project.solutionKey);

  modalRefs.outcomeLabel.textContent = t('rdModalOutcome');
  modalRefs.outcomeText.textContent = t(project.outcomeKey);

  if (project.externalUrl) {
    modalRefs.link.hidden = false;
    modalRefs.link.href = project.externalUrl;
    modalRefs.link.textContent = t('rdModalVisitLink');
  } else {
    modalRefs.link.hidden = true;
    modalRefs.link.removeAttribute('href');
    modalRefs.link.textContent = '';
  }
}

function openModal(projectId, triggerEl) {
  const project = getProjectById(projectId);
  if (!project || !modalRootEl) return;

  if (!modalOverlayEl) {
    buildModal();
  }

  activeProjectId = projectId;
  lastTriggerEl = triggerEl;

  renderModal(project);

  if (!modalOverlayEl.parentNode) {
    modalRootEl.appendChild(modalOverlayEl);
  }

  document.body?.classList.add('modal-open');
  requestAnimationFrame(() => {
    modalRefs.closeBtn?.focus();
  });
}

function closeModal() {
  if (modalOverlayEl?.parentNode) {
    modalOverlayEl.parentNode.removeChild(modalOverlayEl);
  }

  document.body?.classList.remove('modal-open');
  activeProjectId = '';

  if (lastTriggerEl && document.contains(lastTriggerEl)) {
    lastTriggerEl.focus();
  }
}

export function initRdProjects() {
  if (document.body?.dataset.page !== 'research') return;

  gridEl = document.getElementById('rdProjectGrid');
  modalRootEl = document.getElementById('rdModalRoot');

  if (!gridEl || !modalRootEl) return;

  renderProjectGrid();

  onLanguageChange(() => {
    renderProjectGrid();

    if (activeProjectId) {
      const activeProject = getProjectById(activeProjectId);
      if (activeProject) {
        renderModal(activeProject);
      }
    }
  });
}
