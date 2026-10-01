/** Word limit for the Add RFQ and Add Log comment editors. */
export const RICH_TEXT_COMMENT_WORD_LIMIT = 5000;

const BLOCK_TAGS = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "BR",
  "DD",
  "DIV",
  "DL",
  "DT",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HR",
  "LI",
  "OL",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "TD",
  "TH",
  "TR",
  "UL",
]);

const HIDDEN_TAGS = "script, style, template, noscript";

/** A token counts as a word only if it contains a letter or digit (not bare punctuation). */
const WORD_CHARACTER = /[\p{L}\p{N}]/u;

const BLOCK_BREAK = "\u2029";

function collectVisibleText(node, parts, blockSeparator) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      parts.push(child.nodeValue ?? "");
      return;
    }
    if (child.nodeType !== 1) return;
    const isBlock = BLOCK_TAGS.has(child.nodeName);
    if (isBlock) parts.push(blockSeparator);
    collectVisibleText(child, parts, blockSeparator);
    if (isBlock) parts.push(blockSeparator);
  });
}

/**
 * Visible text of editor HTML. Parsed with DOMParser so markup is inert
 * (no image loads or event handlers), and block boundaries become spaces so
 * `<p>one</p><p>two</p>` is two words.
 * @param {unknown} html
 * @param {{ blockSeparator?: string }} [options]
 */
export function getRichTextVisibleText(html, { blockSeparator = " " } = {}) {
  const source = String(html ?? "");
  if (!source) return "";

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(source, "text/html");
    doc.querySelectorAll(HIDDEN_TAGS).forEach((el) => el.remove());
    const parts = [];
    collectVisibleText(doc.body, parts, blockSeparator);
    return parts.join("");
  }

  return source
    .replace(/<(script|style|template|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/?(p|div|li|h[1-6]|tr|br)\b[^>]*>/gi, blockSeparator)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Plain-text HTML for the first `maxWords` words of pasted content, with
 * paragraph/line breaks kept as `<br>`. Used when a paste would exceed the limit.
 * @param {unknown} html
 * @param {number} maxWords
 */
export function buildWordLimitedPasteHtml(html, maxWords) {
  const lines = getRichTextVisibleText(html, { blockSeparator: BLOCK_BREAK })
    .split(BLOCK_BREAK)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const kept = [];
  let remaining = maxWords;
  for (const line of lines) {
    if (remaining <= 0) break;
    const lineWords = countWords(line);
    kept.push(lineWords <= remaining ? line : truncateTextToWords(line, remaining));
    remaining -= Math.min(lineWords, remaining);
  }

  return kept.map(escapeHtml).join("<br>");
}

/** @param {string} text */
export function countWords(text) {
  return String(text ?? "")
    .split(/\s+/)
    .filter((token) => WORD_CHARACTER.test(token)).length;
}

/** @param {string} text */
export function countVisibleCharacters(text) {
  return [...String(text ?? "").replace(/\s+/g, " ").trim()].length;
}

/**
 * @param {unknown} html
 * @returns {{ words: number, characters: number }}
 */
export function getRichTextStats(html) {
  const text = getRichTextVisibleText(html);
  return { words: countWords(text), characters: countVisibleCharacters(text) };
}

/** @param {unknown} html */
export function countRichTextWords(html) {
  return countWords(getRichTextVisibleText(html));
}

/**
 * First `maxWords` words of plain text, keeping the original spacing between them.
 * @param {string} text
 * @param {number} maxWords
 */
export function truncateTextToWords(text, maxWords) {
  const source = String(text ?? "");
  if (maxWords <= 0) return "";

  let counted = 0;
  for (const match of source.matchAll(/\S+/g)) {
    if (!WORD_CHARACTER.test(match[0])) continue;
    counted += 1;
    if (counted === maxWords) {
      return source.slice(0, match.index + match[0].length);
    }
  }
  return source;
}

/**
 * @param {unknown} html
 * @param {string} label
 * @param {number} [maxWords]
 */
export function getRichTextWordLimitError(
  html,
  label,
  maxWords = RICH_TEXT_COMMENT_WORD_LIMIT
) {
  return countRichTextWords(html) > maxWords
    ? `${label} must not exceed ${maxWords} words`
    : "";
}
