import PublicQuestionnaireLayout from "../../public-questionnaire/layout/PublicQuestionnaireLayout";
import "../publicRedirect.css";

/**
 * Shared shell for all survey redirect outcome pages.
 * Reuses the public questionnaire layout (theme tokens, header, responsive container)
 * and adds a full-viewport centered main + subtle footer.
 */
function RedirectLayout({ isDarkMode, onToggleTheme, children }) {
  return (
    <PublicQuestionnaireLayout
      isDarkMode={isDarkMode}
      onToggleTheme={onToggleTheme}
      shellClassName="pq-redirect-shell"
      mainClassName="pq-redirect-main"
      helpDescription="This page confirms the outcome of your survey participation. You can safely close this tab when you are finished. If something looks wrong, please contact support."
      footer={
        <footer className="pq-redirect-footer">
          <div className="pq-page-container pq-redirect-footer-inner">
            <span>© Spade Community</span>
          </div>
        </footer>
      }
    >
      <div className="pq-redirect-main-inner">{children}</div>
    </PublicQuestionnaireLayout>
  );
}

export default RedirectLayout;
