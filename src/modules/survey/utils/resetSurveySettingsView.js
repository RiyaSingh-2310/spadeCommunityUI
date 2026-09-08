import { scrollPageToTop } from "../../../components/shared/ScrollToTopOnNavigate";

function resetNodeScroll(node) {
  if (!node) return;
  if ("scrollTop" in node) node.scrollTop = 0;
  if ("scrollLeft" in node) node.scrollLeft = 0;
}

function isSurveySettingsEditor(editor) {
  const id = String(editor?.id ?? "");
  return id.includes("survey-settings-");
}

function resetTinyMceEditorScroll(editor) {
  if (!isSurveySettingsEditor(editor)) return;
  try {
    editor.getWin?.()?.scrollTo?.(0, 0);
    resetNodeScroll(editor.getBody?.());
    resetNodeScroll(editor.getDoc?.()?.documentElement);
    resetNodeScroll(editor.getDoc?.()?.body);
  } catch {
    // Ignore editors that are not ready.
  }
}

function resetSurveySettingsIframeScroll() {
  if (typeof document === "undefined") return;

  document
    .querySelectorAll(".survey-settings-redirect-editor iframe")
    .forEach((iframe) => {
      try {
        iframe.contentWindow?.scrollTo?.(0, 0);
        resetNodeScroll(iframe.contentDocument?.documentElement);
        resetNodeScroll(iframe.contentDocument?.body);
      } catch {
        // Ignore inaccessible iframe documents.
      }
    });
}

/**
 * After a successful Survey Settings save: send the admin page and every
 * redirect-content editor back to their starting scroll position.
 */
export function resetSurveySettingsViewAfterSave() {
  if (typeof window === "undefined") return;

  scrollPageToTop("instant");
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });

  const editors = window.tinymce?.editors;
  if (Array.isArray(editors)) {
    editors.forEach((editor) => resetTinyMceEditorScroll(editor));
  }

  resetSurveySettingsIframeScroll();
}
