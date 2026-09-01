import { Loader2, X } from "lucide-react";
import { getAdminCancelButtonClass } from "../../modules/shared/utils/formStyles";

const SECTION_BORDER = { borderColor: "var(--admin-header-surface-border)" };

function NotificationMessageModal({
  isOpen,
  onClose,
  isDarkMode,
  isLoading = false,
  message = null,
}) {
  if (!isOpen) return null;

  const displayName = String(message?.name ?? message?.senderName ?? "").trim() || "—";
  const displayEmail = String(message?.email ?? message?.senderEmail ?? "").trim() || "—";
  const displaySubject =
    String(message?.subject ?? message?.title ?? "").trim() || "—";
  const displayDate = String(message?.date ?? "").trim() || "—";
  const displayTime = String(message?.time ?? "").trim() || "—";
  const bodyText =
    typeof message?.body === "string"
      ? message.body
      : String(message?.body ?? message?.description ?? "");
  const replies = Array.isArray(message?.replies) ? message.replies : [];

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0 cursor-pointer"
        aria-label="Close notification"
        onClick={onClose}
      />
      <div
        className="admin-header-surface admin-modal-panel relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-message-title"
      >
        <div
          className="flex items-start justify-between gap-3 border-b px-5 py-4"
          style={SECTION_BORDER}
        >
          <div>
            <h2
              id="notification-message-title"
              className="admin-text text-lg font-semibold"
            >
              Notification
            </h2>
            <p className="admin-text-muted mt-1 text-sm">View only</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-icon-btn admin-text-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex min-h-[160px] items-center justify-center">
              <Loader2 size={28} className="animate-spin text-[#10a950]" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="admin-text text-base font-semibold break-words">
                  {displayName}
                </p>
                <p className="admin-text-muted mt-1 break-all text-sm">{displayEmail}</p>
                <p className="admin-text-subtle mt-2 text-xs">
                  {displayDate}
                  {displayTime !== "—" ? ` · ${displayTime}` : ""}
                </p>
              </div>
              <div className="border-t pt-4" style={SECTION_BORDER}>
                <p className="admin-text-subtle mb-1.5 text-xs font-semibold tracking-[0.02em]">
                  Subject
                </p>
                <p className="admin-text text-sm font-bold break-words">{displaySubject}</p>
              </div>
              <div className="border-t pt-4" style={SECTION_BORDER}>
                <p className="admin-text-subtle mb-1.5 text-xs font-semibold tracking-[0.02em]">
                  Message
                </p>
                <p className="admin-text whitespace-pre-wrap break-words text-sm leading-7">
                  {bodyText.trim() ? bodyText : "—"}
                </p>
              </div>
              {replies.length > 0 ? (
                <div className="border-t pt-4" style={SECTION_BORDER}>
                  <p className="admin-text-subtle mb-3 text-xs font-semibold tracking-[0.02em]">
                    Replies
                  </p>
                  <ul className="space-y-3">
                    {replies.map((reply, index) => (
                      <li
                        key={reply?.id ?? `reply-${index}`}
                        className="rounded-xl border p-3"
                        style={SECTION_BORDER}
                      >
                        <p className="admin-text text-sm font-semibold">
                          {String(reply?.name ?? "").trim() || "—"}
                        </p>
                        <p className="admin-text mt-2 whitespace-pre-wrap break-words text-sm">
                          {String(reply?.body ?? "").trim() || "—"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div
          className="flex justify-end border-t px-5 py-4"
          style={SECTION_BORDER}
        >
          <button
            type="button"
            onClick={onClose}
            className={getAdminCancelButtonClass("modal")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationMessageModal;
