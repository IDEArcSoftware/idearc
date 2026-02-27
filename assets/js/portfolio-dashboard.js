const PORTFOLIO_FILE = 'portfoy.html';
const TRANSLATIONS_FILE = 'assets/js/translations.js';
const URL_PATTERN = /^https?:\/\/\S+$/i;

const state = {
  fsSupported: typeof window.showDirectoryPicker === 'function',
  rootHandle: null,
  fileHandles: {
    portfolio: null,
    translations: null
  },
  loadedFileContents: {
    portfolio: '',
    translations: ''
  },
  entries: [],
  selectedEntryId: '',
  isDirty: false
};

const refs = {};

document.addEventListener('DOMContentLoaded', initDashboard);

function initDashboard() {
  cacheRefs();
  bindEvents();
  updateFsCapabilityUi();
  renderEntryList();
  renderEditor(null);
}

function cacheRefs() {
  refs.selectFolderBtn = document.getElementById('selectFolderBtn');
  refs.loadBtn = document.getElementById('loadBtn');
  refs.saveBtn = document.getElementById('saveBtn');
  refs.previewBtn = document.getElementById('previewBtn');
  refs.exportHtmlBtn = document.getElementById('exportHtmlBtn');
  refs.exportTranslationsBtn = document.getElementById('exportTranslationsBtn');
  refs.addEntryBtn = document.getElementById('addEntryBtn');
  refs.entryList = document.getElementById('entryList');
  refs.entryForm = document.getElementById('entryForm');
  refs.statusBanner = document.getElementById('statusBanner');
  refs.imagePreview = document.getElementById('imagePreview');
  refs.imagePlaceholder = document.getElementById('imagePlaceholder');

  refs.entryId = document.getElementById('entryId');
  refs.entryVisible = document.getElementById('entryVisible');
  refs.entryBadgeTr = document.getElementById('entryBadgeTr');
  refs.entryImageSrc = document.getElementById('entryImageSrc');
  refs.entryTitleTr = document.getElementById('entryTitleTr');
  refs.entryDescTr = document.getElementById('entryDescTr');
  refs.entryModalChallengeTr = document.getElementById('entryModalChallengeTr');
  refs.entryModalSolutionTr = document.getElementById('entryModalSolutionTr');
  refs.entryModalOutcomeTr = document.getElementById('entryModalOutcomeTr');
  refs.entryExternalUrl = document.getElementById('entryExternalUrl');
}

function bindEvents() {
  refs.selectFolderBtn?.addEventListener('click', pickProjectFolder);
  refs.loadBtn?.addEventListener('click', loadFiles);
  refs.saveBtn?.addEventListener('click', saveFiles);
  refs.previewBtn?.addEventListener('click', previewPortfolio);
  refs.exportHtmlBtn?.addEventListener('click', exportPortfolioHtml);
  refs.exportTranslationsBtn?.addEventListener('click', exportTranslationsJs);
  refs.addEntryBtn?.addEventListener('click', addEntry);

  refs.entryList?.addEventListener('click', handleEntryListClick);
  refs.entryForm?.addEventListener('input', handleFormInput);

  window.addEventListener('beforeunload', (event) => {
    if (!state.isDirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

function updateFsCapabilityUi() {
  if (state.fsSupported) {
    setStatus('Pick your project folder, then load files.');
    return;
  }

  refs.selectFolderBtn?.setAttribute('disabled', 'disabled');
  setStatus(
    'File System Access API is unavailable in this browser. Load from current folder and export files for manual replacement.',
    'warn'
  );
}

function setStatus(message, type = 'info') {
  if (!refs.statusBanner) return;
  refs.statusBanner.textContent = message;
  refs.statusBanner.dataset.type = type;
}

function markDirty(isDirty) {
  state.isDirty = Boolean(isDirty);
}

function getSelectedEntry() {
  return state.entries.find((entry) => entry.id === state.selectedEntryId) || null;
}

function selectEntry(entryId) {
  const exists = state.entries.some((entry) => entry.id === entryId);
  if (!exists) return;

  state.selectedEntryId = entryId;
  renderEntryList();
  renderEditor(getSelectedEntry());
}

function renderEntryList() {
  if (!refs.entryList) return;

  refs.entryList.replaceChildren();

  if (!state.entries.length) {
    const empty = document.createElement('li');
    empty.className = 'entry-item';
    empty.textContent = 'No entries loaded yet.';
    refs.entryList.appendChild(empty);
    return;
  }

  state.entries.forEach((entry, index) => {
    const li = document.createElement('li');
    li.className = 'entry-item';
    if (entry.id === state.selectedEntryId) {
      li.classList.add('active');
    }
    li.dataset.entryId = entry.id;

    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = 'entry-select';
    selectBtn.dataset.action = 'select';
    selectBtn.dataset.entryId = entry.id;
    selectBtn.textContent = entry.titleTr || '(Untitled)';

    const meta = document.createElement('div');
    meta.className = 'entry-meta';
    meta.innerHTML = `<span>#${index + 1}</span><span>${entry.visible ? 'Visible' : 'Hidden'}</span>`;

    const tools = document.createElement('div');
    tools.className = 'entry-tools';
    tools.appendChild(buildToolButton('Up', 'up', entry.id));
    tools.appendChild(buildToolButton('Down', 'down', entry.id));
    tools.appendChild(buildToolButton('Duplicate', 'duplicate', entry.id));
    tools.appendChild(buildToolButton('Delete', 'delete', entry.id));

    li.appendChild(selectBtn);
    li.appendChild(meta);
    li.appendChild(tools);
    refs.entryList.appendChild(li);
  });
}

function buildToolButton(label, action, entryId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tool-btn';
  button.dataset.action = action;
  button.dataset.entryId = entryId;
  button.textContent = label;
  return button;
}

function renderEditor(entry) {
  const fields = refs.entryForm?.querySelectorAll('input, textarea') || [];
  const disabled = !entry;
  fields.forEach((field) => {
    if (field.id !== 'entryId') {
      field.disabled = disabled;
    }
  });

  refs.entryId.value = entry?.id || '';
  refs.entryVisible.checked = entry?.visible || false;
  refs.entryBadgeTr.value = entry?.badgeTr || '';
  refs.entryImageSrc.value = entry?.imageSrc || '';
  refs.entryTitleTr.value = entry?.titleTr || '';
  refs.entryDescTr.value = entry?.descTr || '';
  refs.entryModalChallengeTr.value = entry?.modalChallengeTr || '';
  refs.entryModalSolutionTr.value = entry?.modalSolutionTr || '';
  refs.entryModalOutcomeTr.value = entry?.modalOutcomeTr || '';
  refs.entryExternalUrl.value = entry?.externalUrl || '';

  updateImagePreview(entry?.imageSrc || '');
}

function updateImagePreview(src) {
  const normalized = String(src || '').trim();
  if (!normalized) {
    refs.imagePreview.hidden = true;
    refs.imagePreview.removeAttribute('src');
    refs.imagePlaceholder.hidden = false;
    return;
  }

  refs.imagePreview.hidden = false;
  refs.imagePreview.src = normalized;
  refs.imagePreview.alt = 'Selected project image preview';
  refs.imagePlaceholder.hidden = true;
}

function handleEntryListClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action || '';
  const entryId = button.dataset.entryId || '';
  if (!entryId) return;

  if (action === 'select') {
    selectEntry(entryId);
    return;
  }

  if (action === 'up' || action === 'down') {
    moveEntry(entryId, action === 'up' ? -1 : 1);
    return;
  }

  if (action === 'duplicate') {
    duplicateEntry(entryId);
    return;
  }

  if (action === 'delete') {
    deleteEntry(entryId);
  }
}

function handleFormInput(event) {
  const entry = getSelectedEntry();
  if (!entry) return;

  const target = event.target;
  switch (target.id) {
    case 'entryVisible':
      entry.visible = target.checked;
      break;
    case 'entryBadgeTr':
      entry.badgeTr = target.value;
      break;
    case 'entryImageSrc':
      entry.imageSrc = target.value;
      break;
    case 'entryTitleTr':
      entry.titleTr = target.value;
      break;
    case 'entryDescTr':
      entry.descTr = target.value;
      break;
    case 'entryModalChallengeTr':
      entry.modalChallengeTr = target.value;
      break;
    case 'entryModalSolutionTr':
      entry.modalSolutionTr = target.value;
      break;
    case 'entryModalOutcomeTr':
      entry.modalOutcomeTr = target.value;
      break;
    case 'entryExternalUrl':
      entry.externalUrl = target.value;
      break;
    default:
      return;
  }

  if (target.id === 'entryImageSrc') {
    updateImagePreview(entry.imageSrc);
  }

  markDirty(true);
  renderEntryList();
}

function addEntry() {
  if (!state.loadedFileContents.portfolio || !state.loadedFileContents.translations) {
    setStatus('Load files before adding entries.', 'warn');
    return;
  }

  const usedIds = new Set(state.entries.map((entry) => entry.id));
  const newId = makeUniqueId('entry', usedIds);

  state.entries.push({
    id: newId,
    order: state.entries.length + 1,
    visible: true,
    imageSrc: '',
    badgeTr: 'Danismanlik',
    titleTr: 'New project',
    descTr: '',
    modalChallengeTr: '',
    modalSolutionTr: '',
    modalOutcomeTr: '',
    externalUrl: ''
  });

  normalizeOrders();
  selectEntry(newId);
  markDirty(true);
}

function moveEntry(entryId, direction) {
  const index = state.entries.findIndex((entry) => entry.id === entryId);
  if (index === -1) return;

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= state.entries.length) return;

  const [entry] = state.entries.splice(index, 1);
  state.entries.splice(targetIndex, 0, entry);
  normalizeOrders();
  selectEntry(entryId);
  markDirty(true);
}

function duplicateEntry(entryId) {
  const source = state.entries.find((entry) => entry.id === entryId);
  if (!source) return;

  const usedIds = new Set(state.entries.map((entry) => entry.id));
  const duplicateId = makeUniqueId(`${source.id}-copy`, usedIds);
  const duplicate = {
    ...source,
    id: duplicateId,
    titleTr: `${source.titleTr || 'Project'} copy`
  };

  const index = state.entries.findIndex((entry) => entry.id === entryId);
  state.entries.splice(index + 1, 0, duplicate);
  normalizeOrders();
  selectEntry(duplicateId);
  markDirty(true);
}

function deleteEntry(entryId) {
  if (state.entries.length === 1) {
    setStatus('At least one entry is required.', 'warn');
    return;
  }

  const target = state.entries.find((entry) => entry.id === entryId);
  if (!target) return;

  const confirmed = window.confirm(`Delete "${target.titleTr || target.id}"?`);
  if (!confirmed) return;

  state.entries = state.entries.filter((entry) => entry.id !== entryId);
  normalizeOrders();
  state.selectedEntryId = state.entries[0]?.id || '';
  renderEntryList();
  renderEditor(getSelectedEntry());
  markDirty(true);
}

function normalizeOrders() {
  state.entries.forEach((entry, index) => {
    entry.order = index + 1;
  });
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeUniqueId(base, usedIds) {
  const safeBase = slugify(base) || 'entry';
  if (!usedIds.has(safeBase)) {
    usedIds.add(safeBase);
    return safeBase;
  }

  let number = 2;
  let candidate = `${safeBase}-${number}`;
  while (usedIds.has(candidate)) {
    number += 1;
    candidate = `${safeBase}-${number}`;
  }

  usedIds.add(candidate);
  return candidate;
}

async function pickProjectFolder() {
  if (!state.fsSupported) return;

  try {
    state.rootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    const permission = await ensurePermission(state.rootHandle, 'readwrite');
    if (!permission) {
      setStatus('Folder permission was not granted.', 'error');
      state.rootHandle = null;
      return;
    }
    setStatus('Folder selected. Click Load to parse portfolio entries.', 'success');
  } catch (error) {
    if (error?.name === 'AbortError') return;
    setStatus(`Folder selection failed: ${error.message}`, 'error');
  }
}

async function ensurePermission(handle, mode) {
  if (!handle) return false;
  if (typeof handle.queryPermission !== 'function' || typeof handle.requestPermission !== 'function') {
    return true;
  }

  const options = { mode };
  const current = await handle.queryPermission(options);
  if (current === 'granted') return true;
  return (await handle.requestPermission(options)) === 'granted';
}

async function loadFiles() {
  try {
    let portfolioText = '';
    let translationsText = '';

    if (state.fsSupported) {
      if (!state.rootHandle) {
        setStatus('Pick a folder first, then click Load.', 'warn');
        return;
      }

      state.fileHandles.portfolio = await getFileHandleFromPath(state.rootHandle, PORTFOLIO_FILE);
      state.fileHandles.translations = await getFileHandleFromPath(state.rootHandle, TRANSLATIONS_FILE);

      portfolioText = await readTextFile(state.fileHandles.portfolio);
      translationsText = await readTextFile(state.fileHandles.translations);
    } else {
      const [portfolioResponse, translationsResponse] = await Promise.all([
        fetch(`./${PORTFOLIO_FILE}`),
        fetch(`./${TRANSLATIONS_FILE}`)
      ]);

      if (!portfolioResponse.ok || !translationsResponse.ok) {
        throw new Error('Could not fetch local files. Use a local web server in the repo root.');
      }

      portfolioText = await portfolioResponse.text();
      translationsText = await translationsResponse.text();
    }

    const trDictionary = parseTurkishTranslations(translationsText);
    const parsedEntries = parsePortfolioEntries(portfolioText, trDictionary);
    if (!parsedEntries.length) {
      throw new Error('No portfolio cards were found in portfoy.html.');
    }

    state.loadedFileContents.portfolio = portfolioText;
    state.loadedFileContents.translations = translationsText;
    state.entries = parsedEntries;
    state.selectedEntryId = parsedEntries[0].id;
    markDirty(false);
    renderEntryList();
    renderEditor(getSelectedEntry());
    setStatus(`Loaded ${parsedEntries.length} entries.`, 'success');
  } catch (error) {
    setStatus(`Load failed: ${error.message}`, 'error');
  }
}

async function getFileHandleFromPath(rootHandle, relativePath) {
  const parts = relativePath.split('/').filter(Boolean);
  const fileName = parts.pop();
  let directory = rootHandle;

  for (const part of parts) {
    directory = await directory.getDirectoryHandle(part, { create: false });
  }

  return directory.getFileHandle(fileName, { create: false });
}

async function readTextFile(fileHandle) {
  const file = await fileHandle.getFile();
  return file.text();
}

function parseTurkishTranslations(translationsText) {
  const executable = translationsText
    .replace(/^\uFEFF/, '')
    .replace(/export\s+default\s+translations;\s*$/m, 'return translations;');

  const translations = new Function(executable)(); // eslint-disable-line no-new-func
  if (!translations || typeof translations !== 'object' || !translations.tr) {
    throw new Error('Could not parse Turkish translation object.');
  }

  return translations.tr;
}

function parsePortfolioEntries(portfolioText, trDictionary) {
  const documentRef = new DOMParser().parseFromString(portfolioText, 'text/html');
  const cards = Array.from(documentRef.querySelectorAll('#portfoy .portfolio-grid .project-card'));
  const usedIds = new Set();

  return cards
    .map((card, index) => {
      const badgeEl = card.querySelector('.badge');
      const titleEl = card.querySelector('h3');
      const descEl = card.querySelector('p');
      const imageEl = card.querySelector('img');
      if (!titleEl || !descEl || !imageEl) return null;

      const titleKey = titleEl.dataset.i18n || '';
      const descKey = descEl.dataset.i18n || '';
      const badgeKey = badgeEl?.dataset.i18n || '';

      const titleTr = String(trDictionary[titleKey] || titleEl.textContent || '').trim();
      const descTr = String(trDictionary[descKey] || descEl.textContent || '').trim();
      const badgeTr = String(trDictionary[badgeKey] || badgeEl?.textContent || '').trim();

      const sourceId = card.dataset.entryId || titleTr || `entry-${index + 1}`;
      const id = makeUniqueId(sourceId, usedIds);

      return {
        id,
        order: index + 1,
        visible: !card.hasAttribute('hidden'),
        imageSrc: imageEl.getAttribute('src') || '',
        badgeTr: badgeTr || 'Danismanlik',
        titleTr: titleTr || `Project ${index + 1}`,
        descTr: descTr || '',
        modalChallengeTr: card.dataset.modalChallenge || '',
        modalSolutionTr: card.dataset.modalSolution || '',
        modalOutcomeTr: card.dataset.modalOutcome || '',
        externalUrl: card.dataset.modalLink || ''
      };
    })
    .filter(Boolean);
}

function sanitizeEntries() {
  const seenIds = new Set();
  const sanitized = state.entries.map((entry, index) => {
    const trimmedId = String(entry.id || '').trim();
    const safeId = makeUniqueId(trimmedId || `entry-${index + 1}`, seenIds);

    return {
      id: safeId,
      order: index + 1,
      visible: Boolean(entry.visible),
      imageSrc: String(entry.imageSrc || '').trim(),
      badgeTr: String(entry.badgeTr || '').trim() || 'Danismanlik',
      titleTr: String(entry.titleTr || '').trim(),
      descTr: String(entry.descTr || '').trim(),
      modalChallengeTr: String(entry.modalChallengeTr || '').trim(),
      modalSolutionTr: String(entry.modalSolutionTr || '').trim(),
      modalOutcomeTr: String(entry.modalOutcomeTr || '').trim(),
      externalUrl: String(entry.externalUrl || '').trim()
    };
  });

  return sanitized;
}

function validateEntries(entries) {
  const errors = [];
  const ids = new Set();

  entries.forEach((entry, index) => {
    const label = `Entry ${index + 1}`;
    if (!entry.id) errors.push(`${label}: id is required.`);
    if (ids.has(entry.id)) errors.push(`${label}: duplicate id "${entry.id}".`);
    ids.add(entry.id);

    if (!entry.titleTr) errors.push(`${label}: title is required.`);
    if (!entry.descTr) errors.push(`${label}: description is required.`);
    if (!entry.imageSrc) errors.push(`${label}: image path is required.`);

    if (entry.externalUrl && !URL_PATTERN.test(entry.externalUrl)) {
      errors.push(`${label}: external link must start with http:// or https://.`);
    }
  });

  return errors;
}

function buildDashKeyMap(entries) {
  const keyMap = new Map();
  let visibleIndex = 1;

  entries.forEach((entry) => {
    if (!entry.visible) {
      keyMap.set(entry.id, null);
      return;
    }

    const suffix = String(visibleIndex).padStart(2, '0');
    keyMap.set(entry.id, {
      badge: `projectDash${suffix}Badge`,
      title: `projectDash${suffix}Title`,
      desc: `projectDash${suffix}Desc`
    });
    visibleIndex += 1;
  });

  return keyMap;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(value) {
  return escapeHtml(value)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\r?\n/g, '&#10;');
}

function escapeJsString(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, '\\n');
}

function buildPortfolioCardMarkup(entry, dashKeys) {
  const hiddenAttr = entry.visible ? '' : ' hidden';
  const badgeI18n = dashKeys ? ` data-i18n="${dashKeys.badge}"` : '';
  const titleI18n = dashKeys ? ` data-i18n="${dashKeys.title}"` : '';
  const descI18n = dashKeys ? ` data-i18n="${dashKeys.desc}"` : '';

  return [
    `          <article class="project-card"${hiddenAttr} data-entry-id="${escapeAttribute(entry.id)}" data-modal-challenge="${escapeAttribute(entry.modalChallengeTr)}" data-modal-solution="${escapeAttribute(entry.modalSolutionTr)}" data-modal-outcome="${escapeAttribute(entry.modalOutcomeTr)}" data-modal-link="${escapeAttribute(entry.externalUrl)}">`,
    `            <img src="${escapeAttribute(entry.imageSrc)}" alt="${escapeAttribute(entry.titleTr)}" />`,
    '            <div class="project-body">',
    '              <div class="badges">',
    `                <span class="badge"${badgeI18n}>${escapeHtml(entry.badgeTr)}</span>`,
    '              </div>',
    `              <h3${titleI18n}>${escapeHtml(entry.titleTr)}</h3>`,
    `              <p${descI18n}>${escapeHtml(entry.descTr)}</p>`,
    '            </div>',
    '          </article>'
  ].join('\n');
}

function replacePortfolioCards(portfolioText, entries, keyMap) {
  const gridStart = portfolioText.indexOf('<div class="portfolio-grid">');
  if (gridStart === -1) {
    throw new Error('Could not find portfolio-grid in portfoy.html.');
  }

  const gridOpenEnd = portfolioText.indexOf('>', gridStart);
  if (gridOpenEnd === -1) {
    throw new Error('portfolio-grid opening tag is malformed.');
  }

  const ctaStart = portfolioText.indexOf('<div class="portfolio-cta">', gridOpenEnd);
  if (ctaStart === -1) {
    throw new Error('Could not find portfolio-cta block.');
  }

  const gridCloseStart = portfolioText.lastIndexOf('</div>', ctaStart);
  if (gridCloseStart === -1 || gridCloseStart < gridOpenEnd) {
    throw new Error('Could not find portfolio-grid closing tag.');
  }

  const cardsMarkup = entries
    .map((entry) => buildPortfolioCardMarkup(entry, keyMap.get(entry.id)))
    .join('\n');

  return `${portfolioText.slice(0, gridOpenEnd + 1)}\n${cardsMarkup}\n        ${portfolioText.slice(gridCloseStart)}`;
}

function syncDashTranslations(translationsText, entries, keyMap) {
  const objectRange = getObjectRange(translationsText, 'tr');
  const bodyBefore = translationsText.slice(objectRange.openBrace + 1, objectRange.closeBrace);
  const eol = detectEol(translationsText);

  let body = bodyBefore.replace(/^\s*projectDash\d{2}(?:Badge|Title|Desc):\s*'(?:\\.|[^'\\])*',\r?\n?/gm, '');

  const lines = [];
  entries.forEach((entry) => {
    if (!entry.visible) return;
    const keys = keyMap.get(entry.id);
    if (!keys) return;

    lines.push(`    ${keys.badge}: '${escapeJsString(entry.badgeTr)}',`);
    lines.push(`    ${keys.title}: '${escapeJsString(entry.titleTr)}',`);
    lines.push(`    ${keys.desc}: '${escapeJsString(entry.descTr)}',`);
  });

  const insertionBlock = lines.length ? `${lines.join(eol)}${eol}` : '';
  if (insertionBlock) {
    const anchorPattern = /^(\s*projectListingDesc:\s*'(?:\\.|[^'\\])*',\r?\n?)/m;
    if (anchorPattern.test(body)) {
      body = body.replace(anchorPattern, `${insertionBlock}$1`);
    } else {
      body = `${body.trimEnd()}${eol}${insertionBlock}`;
    }
  }

  return `${translationsText.slice(0, objectRange.openBrace + 1)}${body}${translationsText.slice(objectRange.closeBrace)}`;
}

function detectEol(text) {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

function getObjectRange(source, keyName) {
  const keyPattern = new RegExp(`^\\s*${keyName}:\\s*\\{`, 'm');
  const match = keyPattern.exec(source);
  if (!match) {
    throw new Error(`Could not locate "${keyName}" object in ${TRANSLATIONS_FILE}.`);
  }

  const braceOffset = match[0].lastIndexOf('{');
  const openBrace = match.index + braceOffset;
  const closeBrace = findMatchingBrace(source, openBrace);

  return { openBrace, closeBrace };
}

function findMatchingBrace(source, openBraceIndex) {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escapeNext = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inSingleQuote) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '\'') inSingleQuote = false;
      continue;
    }

    if (inDoubleQuote) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') inDoubleQuote = false;
      continue;
    }

    if (inTemplate) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '`') inTemplate = false;
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === '\'') {
      inSingleQuote = true;
      continue;
    }

    if (char === '"') {
      inDoubleQuote = true;
      continue;
    }

    if (char === '`') {
      inTemplate = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error('Could not parse translation object block.');
}

function buildFileOutputs() {
  if (!state.loadedFileContents.portfolio || !state.loadedFileContents.translations) {
    throw new Error('Load files before saving or exporting.');
  }

  const entries = sanitizeEntries();
  const errors = validateEntries(entries);
  if (errors.length) {
    throw new Error(errors.join('\n'));
  }

  const keyMap = buildDashKeyMap(entries);
  const nextPortfolioText = replacePortfolioCards(state.loadedFileContents.portfolio, entries, keyMap);
  const nextTranslationsText = syncDashTranslations(state.loadedFileContents.translations, entries, keyMap);

  return {
    entries,
    nextPortfolioText,
    nextTranslationsText
  };
}

async function saveFiles() {
  try {
    const outputs = buildFileOutputs();

    if (state.fileHandles.portfolio && state.fileHandles.translations) {
      await writeFilesAtomically(outputs.nextPortfolioText, outputs.nextTranslationsText);
      setStatus('Saved portfoy.html and translations.js.', 'success');
    } else {
      downloadTextFile('portfoy.html', outputs.nextPortfolioText);
      downloadTextFile('translations.js', outputs.nextTranslationsText);
      setStatus('Direct write is unavailable. Exported both files for manual replacement.', 'warn');
    }

    state.entries = outputs.entries;
    state.loadedFileContents.portfolio = outputs.nextPortfolioText;
    state.loadedFileContents.translations = outputs.nextTranslationsText;
    if (!state.entries.some((entry) => entry.id === state.selectedEntryId)) {
      state.selectedEntryId = state.entries[0]?.id || '';
    }
    renderEntryList();
    renderEditor(getSelectedEntry());
    markDirty(false);
  } catch (error) {
    setStatus(`Save failed: ${error.message}`, 'error');
  }
}

async function writeFilesAtomically(nextPortfolioText, nextTranslationsText) {
  const previousPortfolio = state.loadedFileContents.portfolio;

  try {
    await writeTextFile(state.fileHandles.portfolio, nextPortfolioText);
  } catch (error) {
    throw new Error(`Failed to write ${PORTFOLIO_FILE}: ${error.message}`);
  }

  try {
    await writeTextFile(state.fileHandles.translations, nextTranslationsText);
  } catch (error) {
    try {
      await writeTextFile(state.fileHandles.portfolio, previousPortfolio);
    } catch {
      // Best effort rollback.
    }
    throw new Error(`Failed to write ${TRANSLATIONS_FILE}: ${error.message}`);
  }
}

async function writeTextFile(fileHandle, text) {
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

function exportPortfolioHtml() {
  try {
    const outputs = buildFileOutputs();
    downloadTextFile('portfoy.html', outputs.nextPortfolioText);
    setStatus('Exported updated portfoy.html.', 'success');
  } catch (error) {
    setStatus(`Export failed: ${error.message}`, 'error');
  }
}

function exportTranslationsJs() {
  try {
    const outputs = buildFileOutputs();
    downloadTextFile('translations.js', outputs.nextTranslationsText);
    setStatus('Exported updated translations.js.', 'success');
  } catch (error) {
    setStatus(`Export failed: ${error.message}`, 'error');
  }
}

function downloadTextFile(fileName, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function previewPortfolio() {
  window.open('./portfoy.html', '_blank', 'noopener');
}
