import translations from './translations.js';
import { DEFAULT_LANG, LANG_STORAGE_KEY } from './config.js';

let currentLang = DEFAULT_LANG;
const listeners = new Set();
const tokenValues = {
  year: () => String(new Date().getFullYear())
};

function formatTranslation(value) {
  if (typeof value !== 'string') return value;

  return value.replace(/\{(\w+)\}/g, (match, token) => {
    const resolver = tokenValues[token];
    return typeof resolver === 'function' ? resolver() : match;
  });
}

export function getCurrentLang() {
  return currentLang;
}

export function t(key, fallback = '') {
  const dict = translations[currentLang] || {};
  const defaultDict = translations[DEFAULT_LANG] || {};
  return formatTranslation(dict[key] || defaultDict[key] || fallback || key);
}

function updateTextContent() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;
    el.textContent = t(key, el.textContent);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (!key) return;
    el.placeholder = t(key, el.placeholder);
  });

  document.querySelectorAll('[data-i18n-meta]').forEach((el) => {
    const key = el.dataset.i18nMeta;
    if (!key) return;
    el.setAttribute('content', t(key, el.getAttribute('content')));
  });

  const titleEl = document.querySelector('title[data-i18n="metaTitle"]');
  if (titleEl) {
    titleEl.textContent = t('metaTitle', titleEl.textContent);
  }
}

function syncLangButtons(lang) {
  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function notifyLanguageChange(lang) {
  listeners.forEach((listener) => {
    try {
      listener(lang);
    } catch {
      // ignore subscriber errors
    }
  });
}

export function setLanguage(lang) {
  if (!translations[lang]) lang = DEFAULT_LANG;
  currentLang = lang;
  document.documentElement.lang = lang;
  if (document.body) {
    document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore storage errors
  }

  syncLangButtons(lang);
  updateTextContent();
  notifyLanguageChange(lang);
}

function bindLanguageSwitch() {
  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
    });
  });
}

export function onLanguageChange(callback) {
  if (typeof callback === 'function') {
    listeners.add(callback);
  }
}

export function initI18n() {
  bindLanguageSwitch();
  let saved = DEFAULT_LANG;
  try {
    saved = localStorage.getItem(LANG_STORAGE_KEY) || DEFAULT_LANG;
  } catch {
    saved = DEFAULT_LANG;
  }
  setLanguage(saved);
}
