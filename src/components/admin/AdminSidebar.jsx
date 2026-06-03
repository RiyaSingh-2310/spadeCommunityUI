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
import heroLogo from "../../assets/SpadeCommunitylogoWhite.png";
import compressedLogo from "../../assets/SpadeCommunitylogocompressed.png";

const COLLAPSED_SIDEBAR_WIDTH = 80;
const FLYOUT_HIDE_DELAY_MS = 150;

function AdminSidebar({ isDarkMode, isCollapsed, setIsCollapsed }) {
  const [manualOpenSection, setManualOpenSection] = useState(null);
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const hideTimeoutRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarItems = useMemo(
    () => [
      { type: "link", label: "Dashboard", root: "/", matcher: /^\/($|dashboard)/ },
      { type: "link", label: "Users", root: "/users", matcher: /^\/users(\/|$)/ },
      { type: "link", label: "Clients", root: "/clients", matcher: /^\/clients(\/|$)/ },
      { type: "link", label: "Partners", root: "/partners", matcher: /^\/partners(\/|$)/ },
      {
        type: "link",
        label: "Project Managers",
        root: "/project-managers",
        matcher: /^\/project-managers(\/|$)/,
      },
      {
        type: "group",
        label: "Sales",
        key: "sales",
        matcher: /^\/sales(\/|$)/,
        children: [
          { label: "RFQ", root: "/sales/rfq", matcher: /^\/sales\/rfq(\/|$)/ },
          {
            label: "Sales Manager",
            root: "/sales/sales-manager",
            matcher: /^\/sales\/sales-manager(\/|$)/,
          },
        ],
      },
      {
        type: "group",
        label: "Prescreen",
        key: "prescreen",
        matcher: /^\/prescreen(\/|$)/,
        children: [
          {
            label: "Prescreen Group",
            root: "/prescreen/group",
            matcher: /^\/prescreen\/group(\/|$)/,
          },
          { label: "Prescreen", root: "/prescreen", matcher: /^\/prescreen$/ },
        ],
      },
      {
        type: "group",
        label: "Survey",
        key: "survey",
        matcher: /^\/survey(\/|$)/,
        children: [
          { label: "Survey", root: "/survey", matcher: /^\/survey$/ },
          { label: "Group Survey", root: "/survey/group", matcher: /^\/survey\/group(\/|$)/ },
          {
            label: "Recontact Survey",
            root: "/survey/recontact",
            matcher: /^\/survey\/recontact(\/|$)/,
          },
          {
            label: "Survey Settings",
            root: "/survey/settings",
            matcher: /^\/survey\/settings(\/|$)/,
          },
        ],
      },
      {
        type: "group",
        label: "Invoice",
        key: "invoice",
        matcher: /^\/invoice(\/|$)/,
        children: [
          {
            label: "Invoice Settings",
            root: "/invoice/settings",
            matcher: /^\/invoice\/settings(\/|$)/,
          },
          { label: "Invoices", root: "/invoice/list", matcher: /^\/invoice\/list(\/|$)/ },
        ],
      },
      {
        type: "link",
        label: "Log Activity",
        root: "/log-activity",
        matcher: /^\/log-activity(\/|$)/,
      },
      {
        type: "group",
        label: "Notifications",
        key: "notifications",
        matcher: /^\/notifications(\/|$)/,
        children: [
          {
            label: "Messages",
            root: "/notifications/messages",
            matcher: /^\/notifications\/messages(\/|$)/,
          },
        ],
      },
      {
        type: "group",
        label: "Reward Points",
        key: "reward-points",
        matcher: /^\/reward-points(\/|$)/,
        children: [
          {
            label: "Pending Rewards",
            root: "/reward-points/pending",
            matcher: /^\/reward-points\/pending(\/|$)/,
          },
          {
            label: "Completed Rewards",
            root: "/reward-points/completed",
            matcher: /^\/reward-points\/completed(\/|$)/,
          },
          {
            label: "Reward Settings",
            root: "/reward-points/settings",
            matcher: /^\/reward-points\/settings(\/|$)/,
          },
        ],
      },
      {
        type: "group",
        label: "Screening Management",
        key: "user-screening",
        matcher: /^\/user-screening(\/|$)/,
        children: [
          {
            label: "List of All Questions",
            root: "/user-screening/questions",
            matcher: /^\/user-screening\/questions(\/|$)/,
          },
        ],
      },
      {
        type: "link",
        label: "Home Page Management",
        root: "/home-page",
        matcher: /^\/home-page(\/|$)/,
      },
      {
        type: "link",
        label: "System Email Template",
        root: "/system-email",
        matcher: /^\/system-email(\/|$)/,
      },
    ],
    []
  );

  const iconMap = {
    Dashboard: <LayoutDashboard size={21} strokeWidth={2} />,
    Users: <Users size={21} strokeWidth={2} />,
    Clients: <UserCog size={21} strokeWidth={2} />,
    Partners: <Handshake size={21} strokeWidth={2} />,
    "Project Managers": <BriefcaseBusiness size={21} strokeWidth={2} />,
    Sales: <FileSpreadsheet size={21} strokeWidth={2} />,
    Prescreen: <ClipboardList size={21} strokeWidth={2} />,
    Survey: <ScrollText size={21} strokeWidth={2} />,
    Invoice: <ReceiptIndianRupee size={21} strokeWidth={2} />,
    "Log Activity": <ScrollText size={21} strokeWidth={2} />,
    Notifications: <Bell size={21} strokeWidth={2} />,
    "Reward Points": <Gift size={21} strokeWidth={2} />,
    "Screening Management": <ShieldCheck size={21} strokeWidth={2} />,
    "Home Page Management": <Home size={21} strokeWidth={2} />,
    "System Email Template": <Mail size={21} strokeWidth={2} />,
  };

  const activeGroupKey =
    sidebarItems.find(
      (item) => item.type === "group" && item.matcher.test(location.pathname)
    )?.key ?? null;

  const openSection = manualOpenSection ?? activeGroupKey;

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  useEffect(() => () => clearHideTimeout(), []);

  const openFlyout = (label, event) => {
    if (!isCollapsed) return;
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
    navigate(path);
    closeFlyout();
  };

  const handleRowMouseLeave = (event) => {
    if (!isCollapsed) return;
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    if (next instanceof Element && next.closest("[data-sidebar-flyout]")) return;
    scheduleCloseFlyout();
  };

  const renderItemFlyout = (item) => {
    if (!isCollapsed || hoveredLabel !== item.label) return null;

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
                  const isChildActive = child.matcher.test(location.pathname);
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
                item.matcher.test(location.pathname) ? "admin-sidebar-flyout-item-active" : ""
              }`}
            >
              {item.label}
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen max-h-screen select-none border-r transition-all duration-300 ${
          isCollapsed ? "z-[100] overflow-visible" : "z-40 overflow-hidden"
        } ${
          isDarkMode
            ? "bg-[#111b2c] text-[var(--admin-foreground)] border-[#2a3c56]"
            : "bg-white text-[var(--admin-foreground)] border-[#dce6f1]"
        } ${isCollapsed ? "w-20" : "w-[270px]"}`}
      >
        <div className={`flex h-full min-h-0 flex-col ${isCollapsed ? "overflow-visible" : "overflow-hidden"}`}>
          <div
            className={`flex h-[72px] shrink-0 items-center border-b px-4 ${
              isDarkMode ? "border-[#2a3c56]" : "border-[#dce6f1]"
            }`}
          >
            <div
              className={`flex w-full items-center transition-all duration-300 ${
                isCollapsed ? "justify-center" : "justify-start gap-3"
              }`}
            >
              <img
                src={heroLogo}
                alt="Spade logo"
                className={`shrink-0 object-contain transition-all duration-300 ${
                  isCollapsed
                    ? "pointer-events-none absolute h-0 w-0 scale-95 opacity-0"
                    : "h-[46px] w-auto max-w-[190px] opacity-100 scale-100"
                }`}
              />
              <img
                src={compressedLogo}
                alt="Spade compact logo"
                className={`shrink-0 object-contain transition-all duration-300 ${
                  isCollapsed
                    ? "h-9 w-9 opacity-100 scale-100 sm:h-10 sm:w-10"
                    : "pointer-events-none absolute h-0 w-0 scale-95 opacity-0"
                }`}
              />
            </div>
          </div>

          <nav
            className={`mt-4 min-h-0 flex-1 px-3 pb-3 ${
              isCollapsed ? "overflow-y-auto overflow-x-visible" : "overflow-y-auto"
            }`}
          >
            {sidebarItems.map((item) => {
              const isActive = item.matcher.test(location.pathname);
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
                        navigate(item.root);
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
                      {!isCollapsed && <span className="text-sm">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.type === "group" && (
                      <span className="admin-text-subtle ml-auto">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    )}
                  </button>

                  {renderItemFlyout(item)}

                  {item.type === "group" && isExpanded && !isCollapsed && (
                    <div className="mt-0.5 space-y-0.5">
                      {item.children.map((child) => {
                        const isChildActive = child.matcher.test(location.pathname);
                        return (
                          <button
                            type="button"
                            key={child.label}
                            onClick={() => navigate(child.root)}
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
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
