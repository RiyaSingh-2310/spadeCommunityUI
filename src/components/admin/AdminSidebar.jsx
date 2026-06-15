import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Gift,
  Handshake,
  Home,
  LayoutDashboard,
  Mail,
  ReceiptIndianRupee,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSidebarNavItemsForRole } from "../../config/roleSidebarNav";
import { getLoginRole } from "../../services/auth/loginRole";
import {
  findActiveSidebarGroupKey,
  isSidebarItemActive,
} from "../../config/sidebarNavUtils";
import { usePermissions } from "../../modules/permissions/PermissionsContext";
import heroLogo from "../../assets/SpadeCommunitylogoWhite.png";
import compressedLogo from "../../assets/SpadeCommunitylogocompressed.png";

const COLLAPSED_SIDEBAR_WIDTH = 80;
const FLYOUT_HIDE_DELAY_MS = 150;

function AdminSidebar({
  isDarkMode,
  isCollapsed,
  setIsCollapsed,
  isMobile = false,
  isDrawerOpen = false,
  onCloseDrawer,
}) {
  const [manualOpenSection, setManualOpenSection] = useState(null);
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const hideTimeoutRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { canAccessNavItem } = usePermissions();

  const sidebarItems = useMemo(() => {
    const filterChildren = (children = []) =>
      children.filter((child) => canAccessNavItem(child.permissionKeys));

    const navItems = getSidebarNavItemsForRole(getLoginRole());

    return navItems.map((item) => {
      if (item.type === "group") {
        const children = filterChildren(item.children);
        if (!canAccessNavItem(item.permissionKeys) && children.length === 0) {
          return null;
        }
        return { ...item, children };
      }
      return canAccessNavItem(item.permissionKeys) ? item : null;
    }).filter(Boolean);
  }, [canAccessNavItem]);

  const iconMap = {
    Dashboard: <LayoutDashboard size={21} strokeWidth={2} />,
    Users: <Users size={21} strokeWidth={2} />,
    Clients: <UserCog size={21} strokeWidth={2} />,
    Partners: <Handshake size={21} strokeWidth={2} />,
    "Project Managers": <BriefcaseBusiness size={21} strokeWidth={2} />,
    Sales: <FileSpreadsheet size={21} strokeWidth={2} />,
    RFQ: <FileSpreadsheet size={21} strokeWidth={2} />,
    Projects: <ScrollText size={21} strokeWidth={2} />,
    Prescreen: <ClipboardList size={21} strokeWidth={2} />,
    Survey: <ScrollText size={21} strokeWidth={2} />,
    Invoice: <ReceiptIndianRupee size={21} strokeWidth={2} />,
    Notifications: <Bell size={21} strokeWidth={2} />,
    "Reward Points": <Gift size={21} strokeWidth={2} />,
    "Screening Management": <ShieldCheck size={21} strokeWidth={2} />,
    "Home Page Management": <Home size={21} strokeWidth={2} />,
    "System Email Template": <Mail size={21} strokeWidth={2} />,
    "Log Activity": <ScrollText size={21} strokeWidth={2} />,
  };

  const activeGroupKey = findActiveSidebarGroupKey(
    sidebarItems,
    location.pathname
  );

  const openSection = manualOpenSection ?? activeGroupKey;

  useEffect(() => {
    setManualOpenSection(null);
  }, [location.pathname]);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  useEffect(() => () => clearHideTimeout(), []);

  const openFlyout = (label, event) => {
    if (!isCollapsed || isMobile) return;
    clearHideTimeout();
    const rect = event.currentTarget.getBoundingClientRect();
    setFlyoutTop(rect.top);
    setHoveredLabel(label);
  };

  const scheduleCloseFlyout = () => {
    if (!isCollapsed) return;
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredLabel(null);
      hideTimeoutRef.current = null;
    }, FLYOUT_HIDE_DELAY_MS);
  };

  const closeFlyout = () => {
    clearHideTimeout();
    setHoveredLabel(null);
  };

  const navigateAndClose = (path) => {
    if (location.pathname !== path) {
      navigate(path);
    } else {
      navigate(path, { replace: true });
    }
    closeFlyout();
    if (isMobile) {
      onCloseDrawer?.();
    }
  };

  const handleRowMouseLeave = (event) => {
    if (!isCollapsed) return;
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    if (next instanceof Element && next.closest("[data-sidebar-flyout]")) return;
    scheduleCloseFlyout();
  };

  const renderItemFlyout = (item) => {
    if (isMobile || !isCollapsed || hoveredLabel !== item.label) return null;

    const isGroup = item.type === "group";
    const flyoutHeight = isGroup ? 44 + item.children.length * 36 : 40;

    return (
      <>
        <div
          data-sidebar-flyout
          className="pointer-events-auto fixed z-[9998]"
          style={{
            left: COLLAPSED_SIDEBAR_WIDTH,
            top: flyoutTop,
            width: 10,
            height: flyoutHeight,
          }}
          onMouseEnter={clearHideTimeout}
          aria-hidden
        />
        <div
          data-sidebar-flyout
          className="admin-sidebar-flyout pointer-events-auto fixed z-[9999] min-w-[220px] overflow-hidden rounded-xl border shadow-2xl"
          style={{ left: COLLAPSED_SIDEBAR_WIDTH + 8, top: flyoutTop }}
          onMouseEnter={clearHideTimeout}
          onMouseLeave={scheduleCloseFlyout}
          role="menu"
          aria-label={item.label}
        >
          {isGroup ? (
            <>
              <div className="admin-sidebar-flyout-header border-b px-3 py-2.5 text-sm font-semibold">
                {item.label}
              </div>
              <div className="py-1">
                {item.children.map((child) => {
                  const isChildActive = isSidebarItemActive(
                    child,
                    location.pathname
                  );
                  return (
                    <button
                      type="button"
                      key={child.label}
                      role="menuitem"
                      onClick={() => navigateAndClose(child.root)}
                      className={`admin-sidebar-flyout-item flex h-9 w-full items-center px-3 text-left text-sm transition-colors ${
                        isChildActive ? "admin-sidebar-flyout-item-active" : ""
                      }`}
                    >
                      {child.label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => navigateAndClose(item.root)}
              className={`admin-sidebar-flyout-item flex h-10 w-full items-center px-3 text-left text-sm font-medium transition-colors ${
                isSidebarItemActive(item, location.pathname)
                  ? "admin-sidebar-flyout-item-active"
                  : ""
              }`}
            >
              {item.label}
            </button>
          )}
        </div>
      </>
    );
  };

  const sidebarWidthClass = isMobile ? "w-[min(280px,85vw)]" : isCollapsed ? "w-20" : "w-[270px]";
  const sidebarPositionClass = isMobile
    ? `z-[100] transition-transform duration-300 ease-in-out ${
        isDrawerOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
      }`
    : isCollapsed
      ? "z-[100] overflow-visible translate-x-0"
      : "z-40 overflow-hidden translate-x-0";

  return (
    <>
      <aside
        className={`admin-sidebar fixed left-0 top-0 h-screen max-h-screen select-none border-r ${
          isMobile ? "overflow-hidden" : isCollapsed ? "overflow-visible" : "overflow-hidden"
        } ${sidebarPositionClass} ${
          isDarkMode
            ? "bg-[#111b2c] text-[var(--admin-foreground)] border-[#2a3c56]"
            : "bg-white text-[var(--admin-foreground)] border-[#dce6f1]"
        } ${sidebarWidthClass}`}
        aria-hidden={isMobile && !isDrawerOpen ? true : undefined}
      >
        <div
          className={`flex h-full min-h-0 flex-col ${
            isMobile || !isCollapsed ? "overflow-hidden" : "overflow-visible"
          }`}
        >
          <div
            className={`flex h-[72px] shrink-0 items-center border-b px-4 ${
              isDarkMode ? "border-[#2a3c56]" : "border-[#dce6f1]"
            }`}
          >
            <div
              className={`flex w-full items-center transition-all duration-300 ${
                isCollapsed && !isMobile ? "justify-center" : "justify-start gap-3"
              }`}
            >
              <img
                src={heroLogo}
                alt="Spade logo"
                className={`shrink-0 object-contain transition-all duration-300 ${
                  isCollapsed && !isMobile
                    ? "pointer-events-none absolute h-0 w-0 scale-95 opacity-0"
                    : "h-[46px] w-auto max-w-[190px] opacity-100 scale-100"
                }`}
              />
              <img
                src={compressedLogo}
                alt="Spade compact logo"
                className={`shrink-0 object-contain transition-all duration-300 ${
                  isCollapsed && !isMobile
                    ? "h-9 w-9 opacity-100 scale-100 sm:h-10 sm:w-10"
                    : "pointer-events-none absolute h-0 w-0 scale-95 opacity-0"
                }`}
              />
            </div>
          </div>

          <nav
            className={`mt-4 min-h-0 flex-1 px-3 pb-3 overflow-y-auto ${
              isCollapsed && !isMobile ? "overflow-x-visible" : ""
            }`}
          >
            {sidebarItems.map((item) => {
              const isActive = isSidebarItemActive(item, location.pathname);
              const isExpanded = item.type === "group" && openSection === item.key;

              return (
                <div
                  className="relative mb-0.5 last:mb-0"
                  key={item.label}
                  onMouseEnter={(e) => openFlyout(item.label, e)}
                  onMouseLeave={handleRowMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isCollapsed && item.type === "group") {
                        return;
                      }
                      if (item.type === "group") {
                        setManualOpenSection((prev) =>
                          prev === item.key ? null : item.key
                        );
                      } else {
                        navigateAndClose(item.root);
                      }
                    }}
                    className={`flex h-10 w-full cursor-pointer items-center rounded-2xl px-3.5 text-left transition-all duration-200 ${
                      isActive
                        ? "bg-[#e6f6ee] font-semibold text-[#138842] shadow-[inset_0_0_0_1px_rgba(19,136,66,0.12)]"
                        : isDarkMode
                          ? "text-[var(--admin-muted-foreground)] hover:bg-[#1f3047] hover:text-[var(--admin-foreground)]"
                          : "text-[var(--admin-muted-foreground)] hover:bg-[#f2f7fc] hover:text-[var(--admin-foreground)]"
                    }`}
                    aria-expanded={isCollapsed && hoveredLabel === item.label}
                  >
                    <div
                      className={
                        isCollapsed
                          ? "flex w-full items-center justify-center"
                          : "flex min-w-0 flex-1 items-center gap-3.5"
                      }
                    >
                      <span
                        className={
                          isActive
                            ? "text-[#138842]"
                            : "text-[var(--admin-subtle-foreground)]"
                        }
                      >
                        {iconMap[item.label]}
                      </span>
                      {(!isCollapsed || isMobile) && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </div>

                    {(!isCollapsed || isMobile) && item.type === "group" && (
                      <span className="admin-text-subtle ml-auto">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    )}
                  </button>

                  {renderItemFlyout(item)}

                  {item.type === "group" && isExpanded && (!isCollapsed || isMobile) && (
                    <div className="mt-0.5 space-y-0.5">
                      {item.children.map((child) => {
                        const isChildActive = isSidebarItemActive(
                    child,
                    location.pathname
                  );
                        return (
                          <button
                            type="button"
                            key={child.label}
                            onClick={() => navigateAndClose(child.root)}
                            className={`flex h-9 w-full items-center rounded-xl px-3.5 pl-11 text-left text-xs transition-all ${
                              isChildActive
                                ? "bg-[#e6f6ee] font-semibold text-[#138842]"
                                : isDarkMode
                                  ? "text-[var(--admin-muted-foreground)] hover:bg-[#1f3047]"
                                  : "text-[var(--admin-muted-foreground)] hover:bg-[#f2f7fc]"
                            }`}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {!isMobile && (
            <div
              className={`sticky bottom-0 z-10 shrink-0 border-t ${
                isDarkMode ? "border-[#2a3c56]" : "border-[#dce6f1]"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setIsCollapsed((prev) => {
                    if (prev) {
                      closeFlyout();
                    }
                    return !prev;
                  });
                }}
                className={`flex h-14 w-full items-center gap-3 p-4 text-sm font-medium transition-all duration-200 ${
                  isDarkMode
                    ? "text-[var(--admin-muted-foreground)] hover:bg-[#1f3047] hover:text-[var(--admin-foreground)]"
                    : "text-[var(--admin-muted-foreground)] hover:bg-[#f2f7fc] hover:text-[var(--admin-foreground)]"
                }`}
              >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                {!isCollapsed && <span>Collapse</span>}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
