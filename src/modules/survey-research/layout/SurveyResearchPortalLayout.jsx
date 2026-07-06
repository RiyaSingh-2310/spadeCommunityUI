import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import ScrollToTopOnNavigate from "../../../components/shared/ScrollToTopOnNavigate";
import PageErrorBoundary from "../../../components/shared/PageErrorBoundary";
import {
  ADMIN_MOBILE_MEDIA_QUERY,
  useMediaQuery,
} from "../../shared/hooks/useMediaQuery";
import SurveyResearchSidebar from "./SurveyResearchSidebar";
import "../styles/portal-theme.css";

function SurveyResearchPortalLayout({ isDarkMode, onToggleTheme }) {
  const location = useLocation();
  const isMobile = useMediaQuery(ADMIN_MOBILE_MEDIA_QUERY);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) setIsDrawerOpen(false);
  }, [isMobile]);

  const contentMargin = isMobile ? "ml-0" : "ml-[270px]";

  return (
    <div
      data-theme={isDarkMode ? "dark" : "light"}
      className={`srp-portal h-screen overflow-hidden ${isDarkMode ? "dark" : ""}`}
    >
      <ScrollToTopOnNavigate />

      {isMobile && isDrawerOpen ? (
        <button
          type="button"
          className="srp-drawer-overlay lg:hidden"
          aria-label="Close navigation"
          onClick={() => setIsDrawerOpen(false)}
        />
      ) : null}

      <SurveyResearchSidebar
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        isMobile={isMobile}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <div className={`flex h-full flex-col transition-[margin] duration-200 ${contentMargin}`}>
        <header
          className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6"
          style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface)" }}
        >
          <div className="flex items-center gap-3">
            {isMobile ? (
              <button
                type="button"
                className="srp-btn-ghost !p-2"
                onClick={() => setIsDrawerOpen((open) => !open)}
                aria-label="Toggle navigation"
              >
                {isDrawerOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            ) : null}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--srp-text-muted)" }}>
                Market Research Platform
              </p>
              <p className="text-sm font-semibold">Survey Management Workflow</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default SurveyResearchPortalLayout;
