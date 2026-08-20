import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  createTinyMceInit,
  TINYMCE_API_KEY,
  TINYMCE_TOOLBAR_COMPACT,
  TINYMCE_TOOLBAR_FULL,
} from "./richTextEditorConfig";

const TinyMceEditor = lazy(() =>
  import("@tinymce/tinymce-react").then((module) => ({ default: module.Editor }))
);

/**
 * Shared admin rich-text editor.
 * When `initiallyCollapsed` is true, starts compact with a limited toolbar and
 * an expand control — matching Project Description UX requirements.
 */
function RichTextEditor({
  value = "",
  onChange,
  onBlur,
  isDarkMode = false,
  placeholder = "Enter content...",
  disabled = false,
  height = 240,
  compactHeight = 140,
  initiallyCollapsed = false,
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
  const toolbar = isCompact ? TINYMCE_TOOLBAR_COMPACT : TINYMCE_TOOLBAR_FULL;

  const init = useMemo(
    () =>
      createTinyMceInit({
        isDarkMode,
        placeholder,
        height: editorHeight,
        toolbar,
        resize: !isCompact,
        onBlur: () => onBlurRef.current?.(),
      }),
    [isDarkMode, placeholder, editorHeight, toolbar, isCompact]
  );

  const fallbackHeight = typeof editorHeight === "number" ? editorHeight : 240;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--admin-input-border)]">
      {initiallyCollapsed ? (
        <div className="flex items-center justify-end border-b border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] px-2 py-1">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="admin-text-subtle inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition hover:opacity-90"
            aria-label={expanded ? "Collapse description editor" : "Expand description editor"}
            title={expanded ? "Collapse" : "Expand"}
            disabled={disabled}
          >
            {expanded ? "Collapse" : "Expand"}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      ) : null}
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
