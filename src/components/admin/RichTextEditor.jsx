import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";

function RichTextEditor({
  value,
  onChange,
  onBlur,
  isDarkMode,
  placeholder = "Enter content...",
  disabled = false,
}) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (command, arg) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    onChange(editorRef.current?.innerHTML || "");
  };

  const toolbarBtn = (active) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
      active
        ? "bg-[#e6f6ee] text-[#138842]"
        : isDarkMode
          ? "text-[var(--admin-muted-foreground)] hover:bg-[#1f3047] hover:text-[var(--admin-foreground)]"
          : "text-[var(--admin-muted-foreground)] hover:bg-[#eef4fb] hover:text-[var(--admin-foreground)]"
    }`;

  const borderClass = isDarkMode ? "border-[#344662]" : "border-[#d8e3ef]";

  return (
    <div className={`overflow-hidden rounded-xl border ${borderClass}`}>
      <div
        className={`flex flex-wrap gap-1 border-b px-2 py-2 ${
          isDarkMode ? "border-[#344662] bg-[#101a2a]" : "border-[#d8e3ef] bg-[#f8fafc]"
        }`}
      >
        <button type="button" className={toolbarBtn()} onClick={() => exec("bold")} aria-label="Bold" disabled={disabled}>
          <Bold size={15} />
        </button>
        <button type="button" className={toolbarBtn()} onClick={() => exec("italic")} aria-label="Italic" disabled={disabled}>
          <Italic size={15} />
        </button>
        <button type="button" className={toolbarBtn()} onClick={() => exec("underline")} aria-label="Underline" disabled={disabled}>
          <Underline size={15} />
        </button>
        <button type="button" className={toolbarBtn()} onClick={() => exec("insertUnorderedList")} aria-label="Bullet list" disabled={disabled}>
          <List size={15} />
        </button>
        <button type="button" className={toolbarBtn()} onClick={() => exec("insertOrderedList")} aria-label="Numbered list" disabled={disabled}>
          <ListOrdered size={15} />
        </button>
      </div>
      <div
        ref={editorRef}
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        onInput={() => !disabled && onChange(editorRef.current?.innerHTML || "")}
        onBlur={onBlur}
        contentEditable={!disabled}
        className={`admin-rich-editor admin-text min-h-[140px] px-3 py-3 text-sm outline-none ${
          isDarkMode ? "bg-[#101a2a]" : "bg-[var(--admin-header-search-bg)]"
        } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
        suppressContentEditableWarning
      />
    </div>
  );
}

export default RichTextEditor;
