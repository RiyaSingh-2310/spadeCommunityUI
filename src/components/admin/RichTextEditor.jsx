import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  createTinyMceInit,
  resolveTinymceScriptSrc,
  TINYMCE_LICENSE_KEY,
  TINYMCE_TOOLBAR_COLLAPSED,
  TINYMCE_TOOLBAR_FULL,
  TINYMCE_TOOLBAR_FULL_WITH_EXPAND,
} from "./richTextEditorConfig";

/** Default visible editor height (includes toolbar). */
export const RICH_TEXT_DEFAULT_HEIGHT = 250;
/** @deprecated Use RICH_TEXT_DEFAULT_HEIGHT */
export const RICH_TEXT_COMPACT_HEIGHT = RICH_TEXT_DEFAULT_HEIGHT;
/** @deprecated Use RICH_TEXT_DEFAULT_HEIGHT */
export const RICH_TEXT_EXPANDED_HEIGHT = RICH_TEXT_DEFAULT_HEIGHT;
/** @deprecated Full-viewport expand is no longer used. */
export const RICH_TEXT_FULL_EXPANDED_MIN_HEIGHT = RICH_TEXT_DEFAULT_HEIGHT;

const TinyMceEditor = lazy(() =>
  import("@tinymce/tinymce-react").then((module) => ({ default: module.Editor }))
);

/**
 * Shared admin rich-text editor.
 * Default height is ~250px. Expanding Tools only reveals extra toolbar items;
 * it does not stretch the editor to full page height. Users can drag to resize.
 */
function RichTextEditor({
  value = "",
  onChange,
  onBlur,
  isDarkMode = false,
  placeholder = "Enter content...",
  disabled = false,
  height = RICH_TEXT_DEFAULT_HEIGHT,
  minHeight = RICH_TEXT_DEFAULT_HEIGHT,
  compactHeight = RICH_TEXT_DEFAULT_HEIGHT,
  initiallyCollapsed = true,
  expandMode: _expandMode = "default",
  id,
  contentKey,
  className = "",
}) {
  void _expandMode;
  const generatedId = useId().replace(/:/g, "");
  const editorId = id || `rich-text-${generatedId}`;
  const onBlurRef = useRef(onBlur);
  const resolvedMinHeight = Math.max(
    RICH_TEXT_DEFAULT_HEIGHT,
    Number(minHeight) || RICH_TEXT_DEFAULT_HEIGHT
  );
  const resolvedHeight = Math.max(
    resolvedMinHeight,
    Number(height) || RICH_TEXT_DEFAULT_HEIGHT
  );
  const heightRef = useRef(resolvedHeight);
  const [expanded, setExpanded] = useState(!initiallyCollapsed);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  const isCompact = initiallyCollapsed && !expanded;
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
        height: heightRef.current,
        minHeight: resolvedMinHeight,
        toolbar,
        menubar: isCompact ? false : "table",
        resize: true,
        onBlur: () => {
          setIsFocused(false);
          onBlurRef.current?.();
        },
        onFocus: () => setIsFocused(true),
        onToggleExpand: initiallyCollapsed
          ? () => setExpanded((prev) => !prev)
          : undefined,
        expandActive: initiallyCollapsed && expanded,
        alignExpandEnd: isCompact,
        onHeightChange: (nextHeight) => {
          heightRef.current = Math.max(resolvedMinHeight, nextHeight);
        },
      }),
    [
      isDarkMode,
      placeholder,
      toolbar,
      isCompact,
      initiallyCollapsed,
      expanded,
      resolvedMinHeight,
    ]
  );

  const fallbackHeight = Math.max(
    resolvedMinHeight,
    Number(heightRef.current) || Number(compactHeight) || resolvedHeight
  );

  return (
    <div
      className={`rich-text-editor${isCompact ? " rich-text-editor--collapsed" : ""}${isFocused ? " rich-text-editor--focused" : ""}${className ? ` ${className}` : ""}`}
    >
      <Suspense
        fallback={
          <div
            className="admin-text flex items-center justify-center rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] text-sm"
            style={{ minHeight: fallbackHeight }}
          >
            Loading editor...
          </div>
        }
      >
        <TinyMceEditor
          key={`${editorId}-${isDarkMode ? "dark" : "light"}-${contentKey ?? "default"}-${isCompact ? "compact" : "expanded"}`}
          id={editorId}
          tinymceScriptSrc={resolveTinymceScriptSrc()}
          licenseKey={TINYMCE_LICENSE_KEY}
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
