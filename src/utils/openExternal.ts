import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Opens a URL externally. On native platforms uses an in-app
 * browser (Chrome Custom Tabs / SFSafariViewController);
 * on the web opens a new tab.
 */
export const openExternal = async (url: string): Promise<void> => {
  if (!url) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (e) {
    console.error('Failed to open URL:', e);
    window.open(url, '_blank', 'noopener');
  }
};

/**
 * Click handler for containers rendering sanitized HTML.
 * Intercepts anchor clicks and routes them through openExternal,
 * which is required for links to work inside the Android WebView.
 */
export const handleContentClick = (e: React.MouseEvent): void => {
  const anchor = (e.target as HTMLElement).closest('a');
  if (!anchor) return;
  e.preventDefault();
  e.stopPropagation();
  const href = anchor.getAttribute('href');
  if (href) {
    void openExternal(href);
  }
};
