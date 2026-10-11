import experience from './experience.json';
export type ThemeKey = keyof typeof experience.themes;
export interface Theme { name: string; bg: string; card: string; primary: string; secondary: string; text: string; accent: string; }
export const themes = Object.fromEntries(Object.entries(experience.themes).map(([key, value]) => [key, {
  name: value.name, bg: 'ic-bg', card: 'ic-card', primary: 'ic-primary', secondary: 'ic-secondary', text: 'ic-text', accent: 'ic-accent'
}])) as Record<ThemeKey, Theme>;
export function readTheme(fallback: ThemeKey = 'home'): ThemeKey {
  try { const saved = localStorage.getItem('currentTheme'); return saved && Object.prototype.hasOwnProperty.call(themes, saved) ? saved as ThemeKey : fallback; } catch { return fallback; }
}
export function applyTheme(key: ThemeKey) {
  const palette = experience.themes[key];
  document.documentElement.dataset.theme = key;
  Object.entries(palette).forEach(([name, value]) => { if (name !== 'name') document.documentElement.style.setProperty('--' + name, value); });
  document.documentElement.style.setProperty('--lime', palette.primary);
  document.documentElement.style.setProperty('--line', palette.ink + '26');
}
export const PLACEHOLDER_TEXT = `• Programming: JavaScript Arrays, React Hooks, Python OOP, C# LINQ
• Competitive Exams: JEE Physics, NEET Biology, UPSC History, GATE CS
• KBC/Quiz: KBC Indian History, KBC Science Hindi, KBC Sports Hinglish
• Any Subject: Data Structures, World Geography, Indian Constitution...`;
