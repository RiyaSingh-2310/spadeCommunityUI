import { useState } from "react";
import { CircleHelp, Moon, Sun, X } from "lucide-react";
import logo from "../../../assets/SpadeCommunitylogoWhite.png";

function PublicQuestionnaireLayout({ isDarkMode, onToggleTheme, children }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div
      className="admin-shell flex min-h-screen flex-col transition-colors duration-300"
      data-theme={isDarkMode ? "dark" : "light"}
      style={{ background: "var(--admin-shell-bg)" }}
    >
      <header
        className="sticky top-0 z-20 border-b px-4 py-3 sm:px-6"
        style={{
          background: "var(--admin-header-surface)",
          borderColor: "var(--admin-header-surface-border)",
        }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <img
            src={logo}
            alt="Spade Community"
            className="h-8 w-auto max-w-[180px] object-contain sm:h-9 sm:max-w-[220px]"
          />

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className="admin-icon-btn admin-text-subtle flex h-10 w-10 items-center justify-center rounded-xl transition"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="admin-icon-btn admin-text-subtle flex h-10 w-10 items-center justify-center rounded-xl transition"
              aria-label="Help"
              title="Help"
            >
              <CircleHelp size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-xl">{children}</div>
      </main>

      {isHelpOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="public-questionnaire-help-title"
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-5 shadow-xl sm:p-6"
            style={{
              background: "var(--admin-surface-bg)",
              borderColor: "var(--admin-surface-border)",
              color: "var(--admin-foreground)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 id="public-questionnaire-help-title" className="text-lg font-semibold">
                Need help?
              </h2>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="admin-icon-btn flex h-8 w-8 items-center justify-center rounded-full"
                aria-label="Close help"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--admin-muted-foreground)" }}>
              Answer each question and use Next to continue. You can go back with Previous at any
              time. Required questions must be answered before moving forward. If you have trouble
              submitting, please try again or contact support.
            </p>
            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="admin-btn-primary mt-5 h-10 w-full sm:w-auto sm:px-6"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PublicQuestionnaireLayout;
