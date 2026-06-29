import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PermissionsProvider, usePermissions } from "../../modules/permissions/PermissionsContext";
import { FormAccessProvider, isFormRoute } from "../../modules/permissions/FormAccessContext";
import { getRoutePermissionAccess } from "../../modules/permissions/routePermissions";
import {
  ADMIN_MOBILE_MEDIA_QUERY,
  useMediaQuery,
} from "../../modules/shared/hooks/useMediaQuery";
import ScrollToTopOnNavigate from "../shared/ScrollToTopOnNavigate";
import PageErrorBoundary from "../shared/PageErrorBoundary";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import PermissionDenied from "./PermissionDenied";

function AdminLayoutContent({ isDarkMode, onToggleTheme }) {
  const location = useLocation();
  const { canRead, canWrite } = usePermissions();
  const isMobile = useMediaQuery(ADMIN_MOBILE_MEDIA_QUERY);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { moduleKey, requiresWrite } = getRoutePermissionAccess(location.pathname);
  const hasAccess =
    !moduleKey || (requiresWrite ? canWrite(moduleKey) : canRead(moduleKey));

  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileDrawerOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !isMobileDrawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, isMobileDrawerOpen]);

  useEffect(() => {
    if (!isMobile || !isMobileDrawerOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobile, isMobileDrawerOpen]);

  const contentMarginClass = isMobile
    ? "ml-0"
    : isSidebarCollapsed
      ? "ml-20"
      : "ml-[270px]";

  return (
    <div
      data-theme={isDarkMode ? "dark" : "light"}
      className="h-screen overflow-hidden transition-colors duration-300 bg-[var(--admin-shell-bg)] admin-shell"
    >
      {isMobile && isMobileDrawerOpen && (
        <button
          type="button"
          className="admin-header-overlay fixed inset-0 z-[90] cursor-default border-0 p-0 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      <AdminSidebar
        isDarkMode={isDarkMode}
        isMobile={isMobile}
        isDrawerOpen={isMobileDrawerOpen}
        onCloseDrawer={() => setIsMobileDrawerOpen(false)}
        isCollapsed={!isMobile && isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className={`min-w-0 transition-[margin] duration-300 ${contentMarginClass}`}>
        <AdminNavbar
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          isMobile={isMobile}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        />
        <main
          id="admin-main-scroll"
          data-admin-scroll-region
          className="admin-scrollbar h-[calc(100vh-72px)] overflow-y-auto overflow-x-hidden p-4 sm:p-6"
        >
          <div className="admin-page-root min-w-0">
            <ScrollToTopOnNavigate />
            {hasAccess ? (
              <PageErrorBoundary isDarkMode={isDarkMode}>
                {isFormRoute(location.pathname) ? (
                  <FormAccessProvider isDarkMode={isDarkMode}>
                    <Outlet />
                  </FormAccessProvider>
                ) : (
                  <Outlet />
                )}
              </PageErrorBoundary>
            ) : (
              <PermissionDenied isDarkMode={isDarkMode} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminLayout(props) {
  return (
    <PermissionsProvider>
      <AdminLayoutContent {...props} />
    </PermissionsProvider>
  );
}

export default AdminLayout;
