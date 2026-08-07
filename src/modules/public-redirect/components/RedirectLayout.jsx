import PublicQuestionnaireLayout from "../../public-questionnaire/layout/PublicQuestionnaireLayout";

/**
 * Shared shell for all survey redirect outcome pages.
 * Reuses the public questionnaire layout (theme tokens, header, responsive container).
 */
function RedirectLayout({ isDarkMode, onToggleTheme, children }) {
  return (
    <PublicQuestionnaireLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      {children}
    </PublicQuestionnaireLayout>
  );
}

export default RedirectLayout;
