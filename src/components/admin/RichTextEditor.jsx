import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { toastApiWarning } from "../../services/toast/apiToast";
import {
  buildWordLimitedPasteHtml,
  countRichTextWords,
  getRichTextStats,
} from "../../modules/shared/utils/richTextWordCount";
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

function formatCount(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Shared admin rich-text editor.
 * Default height is ~250px. Expanding Tools only reveals extra toolbar items;
 * it does not stretch the editor to full page height. Users can drag to resize.
 *
 * `maxWords` (opt-in) counts visible text, blocks edits and pastes that would
 * exceed the limit, and shows a live word/character counter.
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
  maxWords,
}) {
  void _expandMode;
  const generatedId = useId().replace(/:/g, "");
  const editorId = id || `rich-text-${generatedId}`;
  const onBlurRef = useRef(onBlur);
  const wordLimit = Number(maxWords) > 0 ? Number(maxWords) : 0;
  const wordLimitRef = useRef(wordLimit);
  const valueRef = useRef(value);
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

  useEffect(() => {
    wordLimitRef.current = wordLimit;
    valueRef.current = value;
  }, [wordLimit, value]);

  const stats = useMemo(
    () => (wordLimit ? getRichTextStats(value) : null),
    [wordLimit, value]
  );

  const handleEditorChange = (content, editor) => {
    const limit = wordLimitRef.current;
    if (limit) {
      const nextWords = countRichTextWords(content);
      const accepted = valueRef.current ?? "";
      if (nextWords > limit && nextWords > countRichTextWords(accepted)) {
        // Not applying the change makes tinymce-react roll the editor back to
        // `value`, except when `value` is empty, which it skips.
        if (!accepted) {
          editor?.undoManager?.ignore?.(() => editor.setContent(""));
        }
        return;
      }
    }
    onChange?.(content);
  };

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
        onPastePreProcess: (event, editor) => {
          const limit = wordLimitRef.current;
          if (!limit) return;
          const pastedWords = countRichTextWords(event.content);
          if (!pastedWords) return;
          const currentWords = countRichTextWords(editor.getContent());
          const replacedWords = countRichTextWords(editor.selection?.getContent?.() ?? "");
          const remaining = limit - Math.max(0, currentWords - replacedWords);
          if (pastedWords <= remaining) return;
          event.content = remaining > 0 ? buildWordLimitedPasteHtml(event.content, remaining) : "";
          toastApiWarning(
            remaining > 0
              ? `Pasted content was trimmed to stay within the ${limit}-word limit.`
              : `The ${limit}-word limit has been reached.`
          );
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

  const isAtWordLimit = Boolean(stats && stats.words >= wordLimit);

  return (
    <>
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
            onEditorChange={handleEditorChange}
            disabled={disabled}
            init={init}
          />
        </Suspense>
      </div>
      {stats ? (
        <p
          className={`mt-1 text-xs ${isAtWordLimit ? "text-[var(--admin-danger-text)]" : "admin-text-muted"}`}
          aria-live="polite"
          data-testid={`${editorId}-word-count`}
        >
          {stats.words} / {wordLimit} words ·{" "}

          {stats.words > wordLimit
            ? " · Word limit exceeded"
            : isAtWordLimit
              ? " · Word limit reached"
              : ""}
        </p>
      ) : null}
    </>
  );
}

export default RichTextEditor;
