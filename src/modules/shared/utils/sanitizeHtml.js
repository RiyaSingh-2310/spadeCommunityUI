import DOMPurify from "dompurify";

/**
 * Sanitize untrusted HTML (e.g. TinyMCE / API-stored rich text) before
 * rendering with dangerouslySetInnerHTML.
 * @param {unknown} dirty
 * @returns {string}
 */
export function sanitizeHtml(dirty) {
  return DOMPurify.sanitize(String(dirty ?? ""), {
    USE_PROFILES: { html: true },
  });
}
