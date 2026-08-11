import { useState } from "react";
import { CircleHelp, Moon, Sun, X } from "lucide-react";
import logo from "../../../assets/SpadeCommunitylogoWhite.png";
import "../publicQuestionnaire.css";

function PublicQuestionnaireLayout({
  isDarkMode,
  onToggleTheme,
  children,
  footer = null,
  shellClassName = "",
  mainClassName = "",
  helpDescription = "",
}) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpBody =
    String(helpDescription ?? "").trim() ||
    "Answer each question and use Next to continue. You can go back with Previous at any time. Required questions must be answered before moving forward. If you have trouble submitting, please try again or contact support.";

  return (
    <div
      className={`public-questionnaire-shell admin-shell flex min-h-screen flex-col transition-colors duration-300 ${shellClassName}`.trim()}
      data-theme={isDarkMode ? "dark" : "light"}
      style={{ background: "var(--admin-shell-bg)" }}
    >
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-sm"
        style={{
          background: "color-mix(in srgb, var(--admin-header-surface) 92%, transparent)",
          borderColor: "var(--admin-header-surface-border)",
        }}
      >
        <div className="pq-page-container flex items-center justify-between gap-6 py-4 sm:py-5">
          <img
            src={logo}
            alt="Spade Community"
            className="h-9 w-auto max-w-[200px] object-contain sm:h-10 sm:max-w-[240px]"
          />

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className="pq-icon-btn admin-icon-btn admin-text-subtle"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="pq-icon-btn admin-icon-btn admin-text-subtle"
              aria-label="Help"
              title="Help"
            >
              <CircleHelp size={18} />
            </button>
          </div>
        </div>
      </header>

      <main
        className={`flex flex-1 flex-col ${mainClassName || "py-8 sm:py-10 lg:py-14"}`.trim()}
      >
        <div className="pq-page-container flex w-full flex-1 flex-col">{children}</div>
      </main>

      {footer}

      {isHelpOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="public-questionnaire-help-title"
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            className="pq-card w-full max-w-md p-6 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id="public-questionnaire-help-title" className="text-xl font-semibold">
                Need help?
              </h2>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="pq-icon-btn admin-icon-btn flex h-9 w-9 items-center justify-center rounded-full"
                aria-label="Close help"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--admin-muted-foreground)" }}>
              {helpBody}
            </p>
            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="admin-btn-primary pq-nav-btn mt-6 w-full sm:w-auto"
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
