/**
 * Shared clear-or-close behavior for expandable header search.
 * - Text present → clear text, keep open/focused
 * - Already empty → close/collapse search UI
 */
export function useClearOrCloseSearch({ query, setQuery, setIsOpen, inputRef }) {
  const handleClearOrClose = () => {
    if (String(query ?? "").length > 0) {
      setQuery("");
      // Keep search open; restore focus after clear.
      queueMicrotask(() => {
        inputRef?.current?.focus?.();
      });
      return;
    }
    setIsOpen(false);
    setQuery("");
  };

  return { handleClearOrClose };
}
