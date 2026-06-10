import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { createTinyMceInit, TINYMCE_API_KEY } from "./richTextEditorConfig";

const TinyMceEditor = lazy(() =>
  import("@tinymce/tinymce-react").then((module) => ({ default: module.Editor }))
);

function RichTextEditor({
  value = "",
  onChange,
  onBlur,
  isDarkMode = false,
  placeholder = "Enter content...",
  disabled = false,
  height = 240,
  id,
}) {
  const onBlurRef = useRef(onBlur);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  const init = useMemo(
    () =>
      createTinyMceInit({
        isDarkMode,
        placeholder,
        height,
        onBlur: () => onBlurRef.current?.(),
      }),
    [isDarkMode, placeholder, height]
  );

  const borderClass = isDarkMode ? "border-[#344662]" : "border-[#d8e3ef]";
  const fallbackHeight = typeof height === "number" ? height : 240;

  return (
    <div className={`overflow-hidden rounded-xl border ${borderClass}`}>
      <Suspense
        fallback={
          <div
            className={`admin-text flex items-center justify-center text-sm ${
              isDarkMode ? "bg-[#101a2a]" : "bg-[var(--admin-header-search-bg)]"
            }`}
            style={{ minHeight: fallbackHeight }}
          >
            Loading editor...
          </div>
        }
      >
        <TinyMceEditor
          key={isDarkMode ? "dark" : "light"}
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
