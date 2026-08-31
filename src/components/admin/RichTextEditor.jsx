import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  createTinyMceInit,
  TINYMCE_API_KEY,
  TINYMCE_TOOLBAR_COLLAPSED,
  TINYMCE_TOOLBAR_FULL,
  TINYMCE_TOOLBAR_FULL_WITH_EXPAND,
} from "./richTextEditorConfig";

const TinyMceEditor = lazy(() =>
  import("@tinymce/tinymce-react").then((module) => ({ default: module.Editor }))
);

/** One-line collapsed editor height (content area only). */
export const RICH_TEXT_COMPACT_HEIGHT = 42;
/** Comfortable expanded writing area without excessive whitespace. */
export const RICH_TEXT_EXPANDED_HEIGHT = 340;

/**
 * Shared admin rich-text editor.
 * Collapsed by default: compact writing area, formatting hidden, expand control
 * at the end of the existing TinyMCE toolbar.
 * Expanded: full toolbar and a larger typing area; the same toolbar control collapses.
 */
function RichTextEditor({
  value = "",
  onChange,
  onBlur,
  isDarkMode = false,
  placeholder = "Enter content...",
  disabled = false,
  height = RICH_TEXT_EXPANDED_HEIGHT,
  compactHeight = RICH_TEXT_COMPACT_HEIGHT,
  initiallyCollapsed = true,
  id,
  contentKey,
}) {
  const onBlurRef = useRef(onBlur);
  const [expanded, setExpanded] = useState(!initiallyCollapsed);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  const isCompact = initiallyCollapsed && !expanded;
  const editorHeight = isCompact ? compactHeight : height;
  const toolbar = initiallyCollapsed
    ? isCompact
      ? TINYMCE_TOOLBAR_COLLAPSED
      : TINYMCE_TOOLBAR_FULL_WITH_EXPAND
    : TINYMCE_TOOLBAR_FULL;

  const init = useMemo(
    () =>
      createTinyMceInit({
        isDarkMode,
        placeholder,
        height: editorHeight,
        toolbar,
        menubar: isCompact ? false : "table",
        resize: !isCompact,
        onBlur: () => onBlurRef.current?.(),
        onToggleExpand: initiallyCollapsed
          ? () => setExpanded((prev) => !prev)
          : undefined,
        expandActive: initiallyCollapsed && expanded,
      }),
    [
      isDarkMode,
      placeholder,
      editorHeight,
      toolbar,
      isCompact,
      initiallyCollapsed,
      expanded,
    ]
  );

  const fallbackHeight = typeof editorHeight === "number" ? editorHeight : RICH_TEXT_EXPANDED_HEIGHT;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--admin-input-border)]">
      <Suspense
        fallback={
          <div
            className="admin-text flex items-center justify-center bg-[var(--admin-input-bg)] text-sm"
            style={{ minHeight: fallbackHeight }}
          >
            Loading editor...
          </div>
        }
      >
        <TinyMceEditor
          key={`${isDarkMode ? "dark" : "light"}-${contentKey ?? "default"}-${isCompact ? "compact" : "expanded"}`}
          id={id}
          apiKey={TINYMCE_API_KEY}
          value={value}
          onEditorChange={(content) => onChange?.(content)}
          disabled={disabled}
          init={init}
        />
      </Suspense>
    </div>
  );
}

export default RichTextEditor;
