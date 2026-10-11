import { themes, ThemeKey, readTheme, applyTheme } from './constants/themes';
import experience from './constants/experience.json';
applyTheme(readTheme());
const ready = () => {
  const select = document.querySelector<HTMLSelectElement>('[data-theme-select]');
  if (select) {
    Object.entries(themes).forEach(([key, theme]) => select.add(new Option(theme.name, key)));
    select.value = readTheme();
    select.addEventListener('change', () => {
      applyTheme(select.value as ThemeKey);
      try { localStorage.setItem('currentTheme', select.value); }
      catch { const note = document.querySelector('[data-theme-note]'); if (note) note.textContent = 'Theme applies for this visit; browser storage is unavailable.'; }
    });
  }
  window.addEventListener('storage', event => { if (event.key === 'currentTheme' || event.key === null) { const key = readTheme(); applyTheme(key); if (select) select.value = key; } });
  document.querySelectorAll('[data-benefit]').forEach(node => {
    const item = experience.benefits[Number(node.getAttribute('data-benefit'))];
    if (!item) return;
    const title = node.querySelector('h3'); const body = node.querySelector('p');
    if (title) title.textContent = item.title; if (body) body.textContent = item.body;
  });
  document.querySelectorAll('[data-key-trust]').forEach(node => { node.textContent = experience.keyTrust; });
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
