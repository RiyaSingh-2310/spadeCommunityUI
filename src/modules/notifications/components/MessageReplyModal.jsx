import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getAdminCancelButtonClass,
  getAdminTextareaClass,
} from "../../shared/utils/formStyles";

function MessageReplyModal({
  isOpen,
  onCancel,
  onSubmit,
  isSubmitting = false,
  recipientName = "",
}) {
  const [replyBody, setReplyBody] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setReplyBody("");
    setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = replyBody.trim();
    if (!trimmed) {
      setError("Please enter a reply message.");
      return;
    }
    setError("");
    onSubmit?.(trimmed);
  };

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0 cursor-pointer"
        aria-label="Close reply modal"
        onClick={onCancel}
        disabled={isSubmitting}
      />
      <div
        className="admin-header-surface admin-modal-panel relative z-10 w-full max-w-lg rounded-2xl border p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-reply-modal-title"
      >
        <h2
          id="message-reply-modal-title"
          className="admin-text mb-2 text-lg font-semibold"
        >
          Reply to Message
        </h2>
        <p className="admin-text-muted mb-4 text-sm">
          {recipientName
            ? `Send a reply to ${recipientName}.`
            : "Write your reply below."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="message-reply-body"
              className="admin-text-muted mb-1.5 block text-xs font-semibold tracking-[0.02em]"
            >
              Reply
            </label>
            <textarea
              id="message-reply-body"
              className={getAdminTextareaClass(
                error ? "border-[var(--admin-danger-text)]" : ""
              )}
              placeholder="Type your reply..."
              value={replyBody}
              onChange={(event) => {
                setReplyBody(event.target.value);
                if (error) setError("");
              }}
              disabled={isSubmitting}
              rows={5}
              aria-invalid={Boolean(error)}
              autoFocus
            />
            {error ? (
              <p
                className="mt-1.5 text-sm"
                style={{ color: "var(--admin-danger-text)" }}
              >
                {error}
              </p>
            ) : null}
          </div>

          <div className="admin-modal-actions flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className={getAdminCancelButtonClass("modal")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !replyBody.trim()}
              className="admin-btn-primary inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : null}
              {isSubmitting ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MessageReplyModal;
