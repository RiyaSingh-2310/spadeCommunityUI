import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "../../../services/toast";

/**
 * Copy a displayed URL/code value with a clear success toast.
 * @param {string} value
 * @param {string} successMessage e.g. "Live URL copied"
 */
export async function copyValueWithToast(value, successMessage) {
  const text = String(value ?? "").trim();
  if (!text || text === "—") {
    toast.warning("Nothing to copy");
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage || "Copied");
    return true;
  } catch {
    toast.error("Unable to copy");
    return false;
  }
}

/**
 * Compact copy button for read-only / adjacent URL fields.
 * @param {"field"|"inline"} [size] field = form-adjacent; inline = table/detail compact
 */
export function CopyValueButton({
  value,
  successMessage,
  label = "Copy",
  className = "",
  disabled = false,
  size = "field",
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(
    async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;
      const ok = await copyValueWithToast(value, successMessage);
      if (!ok) return;
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    },
    [value, successMessage, disabled]
  );

  const canCopy = Boolean(String(value ?? "").trim()) && String(value).trim() !== "—";

  const defaultClass =
    size === "inline"
      ? "admin-icon-btn admin-text-subtle inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
      : "admin-icon-btn admin-text-subtle inline-flex h-10 min-w-[40px] items-center justify-center rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] px-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !canCopy}
      className={className || defaultClass}
      title={label}
      aria-label={label}
    >
      {copied ? <Check size={size === "inline" ? 14 : 16} /> : <Copy size={size === "inline" ? 14 : 16} />}
    </button>
  );
}

export default CopyValueButton;
