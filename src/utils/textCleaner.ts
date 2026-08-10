import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

/**
 * Escapes text so it can be safely embedded in an HTML string.
 */
const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeAttr = (text: string): string =>
  escapeHtml(text).replace(/"/g, '&quot;');

/**
 * Decodes HTML entities in a plain-text fragment without parsing tags.
 * Uses a textarea (RCDATA) so "<b>" stays literal text.
 * Runs iteratively (max 3 passes) to fix double-encoded entities
 * like "&amp;#x27;" that Hacker News sometimes returns.
 */
const decodeTextEntities = (text: string): string => {
  let result = text;
  for (let i = 0; i < 3; i++) {
    if (!result.includes('&')) break;
    const ta = document.createElement('textarea');
    ta.innerHTML = result;
    if (ta.value === result) break;
    result = ta.value;
  }
  return result;
};

const LINK_CLASS =
  'text-accent underline hover:text-accent/80 transition-colors break-all';

const buildLink = (href: string, label: string): string =>
  `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer" class="${LINK_CLASS}">${label}</a>`;

/**
 * Returns the href if it uses a safe protocol, otherwise null.
 */
const safeHref = (href: string | null): string | null => {
  if (!href) return null;
  // Decode any remaining (double-encoded) entities, e.g. HN's "&#x2F;" slashes
  const trimmed = decodeTextEntities(href).trim();
  // Allow relative links, anchors, http(s) and mailto
  if (/^(#|\/|https?:|mailto:)/i.test(trimmed)) return trimmed;
  // Protocol-relative
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  // Bare domain without protocol
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(trimmed)) return `https://${trimmed}`;
  return null;
};

const URL_REGEX = /https?:\/\/[^\s<>"']+/g;
const TRAILING_PUNCT = /[.,;:!?)\]}>'"]+$/;

/**
 * Wraps bare URLs in anchor tags. Expects already-escaped text.
 */
const linkify = (escapedText: string): string =>
  escapedText.replace(URL_REGEX, (match) => {
    // Strip trailing escaped entities that bled into the match (e.g. "&lt;")
    let url = match.replace(/(&(?:lt|gt|quot);)+$/i, '');
    let trailing = match.slice(url.length);

    // Strip trailing punctuation that was likely not meant as part of the URL
    const punctMatch = url.match(TRAILING_PUNCT);
    if (punctMatch) {
      // Keep a closing paren in the URL if parens are balanced (e.g. Wikipedia links)
      const opens = (url.match(/\(/g) || []).length;
      const closes = (url.match(/\)/g) || []).length;
      let cut = punctMatch[0];
      if (opens >= closes && cut.endsWith(')')) {
        cut = cut.slice(0, -1);
      }
      url = url.slice(0, url.length - cut.length);
      trailing = cut + trailing;
    }
    // Un-escape entities for the actual href value
    const href = url.replace(/&amp;/g, '&');
    return `${buildLink(href, url)}${trailing}`;
  });

/**
 * Cleans and sanitizes HTML content for safe rendering.
 * Decodes (double-)encoded entities, re-escapes text nodes,
 * linkifies bare URLs, and allows only a safe subset of tags.
 */
export const cleanHTML = (html: string | undefined | null): string => {
  if (!html) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    const cleanNode = (node: Node, inAnchor: boolean): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        // Decode any remaining (double-encoded) entities, then re-escape
        // so the text can be safely embedded in the output HTML string.
        const decoded = decodeTextEntities(node.textContent || '');
        const escaped = escapeHtml(decoded);
        // Never linkify inside anchors — that would nest <a> tags
        return inAnchor ? escaped : linkify(escaped);
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        const childInAnchor = inAnchor || tag === 'a';
        const children = Array.from(el.childNodes)
          .map(child => cleanNode(child, childInAnchor))
          .join('');

        switch (tag) {
          case 'p':
            return `<p class="mb-3 last:mb-0">${children}</p>`;
          case 'br':
            return '<br />';
          case 'a': {
            const href = safeHref(el.getAttribute('href'));
            if (!href) return children;
            return buildLink(href, children || escapeHtml(href));
          }
          case 'img': {
            // Render images as links to keep comments lightweight
            const src = safeHref(el.getAttribute('src'));
            if (!src) return '';
            const alt = el.getAttribute('alt')?.trim();
            return buildLink(src, `🖼 ${escapeHtml(alt || src)}`);
          }
          case 'code':
            return `<code class="bg-surface-alt px-1.5 py-0.5 rounded border border-theme font-mono text-[0.9em] break-all">${children}</code>`;
          case 'pre':
            return `<pre class="bg-surface-alt p-3 rounded-xl border border-theme font-mono text-[0.85em] my-3 overflow-x-auto whitespace-pre-wrap">${children}</pre>`;
          case 'b':
          case 'strong':
            return `<strong class="font-bold text-theme">${children}</strong>`;
          case 'i':
          case 'em':
            return `<em class="italic">${children}</em>`;
          case 'del':
          case 's':
            return `<del class="line-through opacity-70">${children}</del>`;
          case 'blockquote':
            return `<blockquote class="border-l-2 border-accent/50 pl-3 my-2 opacity-80">${children}</blockquote>`;
          case 'ul':
            return `<ul class="list-disc pl-5 my-2 space-y-1">${children}</ul>`;
          case 'ol':
            return `<ol class="list-decimal pl-5 my-2 space-y-1">${children}</ol>`;
          case 'li':
            return `<li>${children}</li>`;
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            return `<p class="font-bold text-theme mt-3 mb-1">${children}</p>`;
          case 'hr':
            return '<hr class="my-3 border-theme opacity-50" />';
          case 'sup':
            return `<sup class="text-[0.75em]">${children}</sup>`;
          case 'sub':
            return `<sub class="text-[0.75em]">${children}</sub>`;
          default:
            // For unknown tags, just return the cleaned children
            return children;
        }
      }

      return '';
    };

    return Array.from(body.childNodes)
      .map(node => cleanNode(node, false))
      .join('');
  } catch (e) {
    console.error('HTML cleaning failed:', e);
    // Simple fallback if DOMParser fails
    return escapeHtml(decodeTextEntities(html));
  }
};

/**
 * Renders a comment/post body to safe HTML.
 * Lemmy content is Markdown and is converted to HTML first;
 * Hacker News content is already HTML.
 */
export const renderContentHTML = (
  body: string | undefined | null,
  sourceType: 'hn' | 'lemmy'
): string => {
  if (!body) return '';

  if (sourceType === 'lemmy') {
    try {
      const html = marked.parse(body, { async: false });
      return cleanHTML(html);
    } catch (e) {
      console.error('Markdown rendering failed:', e);
      return cleanHTML(body);
    }
  }

  return cleanHTML(body);
};

/**
 * Decodes all HTML entities and returns plain text.
 * Suitable for titles and cases where no HTML tags are desired.
 */
export const decodeEntities = (html: string | undefined | null): string => {
  if (!html) return '';
  try {
    return decodeTextEntities(html).trim();
  } catch (e) {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, '/')
      .trim();
  }
};
