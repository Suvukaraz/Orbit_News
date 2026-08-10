import { useEffect } from 'react';
import { useFeedStore } from '../stores/feedStore';
import { getTheme } from '../types';

/**
 * Applies the currently selected dark theme preset to the document
 * as CSS custom properties. Tailwind arbitrary values reference these
 * via var(--...), so the whole app re-themes instantly.
 */
export function useTheme() {
  const themeId = useFeedStore((s) => s.themeId);

  useEffect(() => {
    const theme = getTheme(themeId);
    const root = document.documentElement;
    const c = theme.colors;

    root.style.setProperty('--c-bg', c.bg);
    root.style.setProperty('--c-surface', c.surface);
    root.style.setProperty('--c-surface-hover', c.surfaceHover);
    root.style.setProperty('--c-surface-alt', c.surfaceAlt);
    root.style.setProperty('--c-border', c.border);
    root.style.setProperty('--c-text', c.text);
    root.style.setProperty('--c-text-muted', c.textMuted);
    root.style.setProperty('--c-accent', c.accent);
    root.style.setProperty('--c-accent-soft', c.accentSoft);
    root.style.setProperty('--c-hn', c.hn);
    root.style.setProperty('--c-lemmy', c.lemmy);

    document.body.style.backgroundColor = c.bg;
  }, [themeId]);

  return getTheme(themeId);
}
