import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Handshake,
  LayoutDashboard,
  ReceiptIndianRupee,
  ScrollText,
  UserCog,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import heroLogo from "../../assets/SpadeCommunitylogoWhite.png";
import compressedLogo from "../../assets/SpadeCommunitylogocompressed.png";

function AdminSidebar({ isDarkMode, isCollapsed, setIsCollapsed }) {
  const [manualOpenSection, setManualOpenSection] = useState(null);
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
          { label: "Invoices", root: "/invoice/list", matcher: /^\/invoice\/list(\/|$)/ },
          {
            label: "Invoice Settings",
            root: "/invoice/settings",
            matcher: /^\/invoice\/settings(\/|$)/,
          },
        ],
      },
      {
        type: "link",
        label: "Log Activity",
        root: "/log-activity",
        matcher: /^\/log-activity(\/|$)/,
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
  };

  const activeGroupKey =
    sidebarItems.find(
      (item) => item.type === "group" && item.matcher.test(location.pathname)
    )?.key ?? null;

  const openSection = manualOpenSection ?? activeGroupKey;

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen max-h-screen overflow-hidden select-none border-r transition-all duration-300 ${
        isDarkMode
          ? "bg-[#111b2c] text-[var(--admin-foreground)] border-[#2a3c56]"
          : "bg-white text-[var(--admin-foreground)] border-[#dce6f1]"
      } ${isCollapsed ? "w-20" : "w-[270px]"}`}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div
          className={`flex items-center border-b px-4 h-[72px] shrink-0 ${
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
                  ? "pointer-events-none absolute opacity-0 scale-95 h-0 w-0"
                  : "opacity-100 scale-100 h-[46px] w-auto max-w-[190px]"
              }`}
            />
            <img
              src={compressedLogo}
              alt="Spade compact logo"
              className={`shrink-0 object-contain transition-all duration-300 ${
                isCollapsed
                  ? "opacity-100 scale-100 h-9 w-9 sm:h-10 sm:w-10"
                  : "pointer-events-none absolute opacity-0 scale-95 h-0 w-0"
              }`}
            />
          </div>
        </div>

        <nav className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {sidebarItems.map((item) => {
            const isActive = item.matcher.test(location.pathname);
            const isExpanded = item.type === "group" && openSection === item.key;
            return (
              <div className="group relative mb-0.5 last:mb-0" key={item.label}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.type === "group") {
                      setManualOpenSection((prev) =>
                        prev === item.key ? null : item.key
                      );
                    } else {
                      navigate(item.root);
                    }
                  }}
                  className={`flex h-10 w-full items-center rounded-2xl px-3.5 text-left cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-[#e6f6ee] text-[#138842] font-semibold shadow-[inset_0_0_0_1px_rgba(19,136,66,0.12)]"
                      : isDarkMode
                        ? "text-[var(--admin-muted-foreground)] hover:bg-[#1f3047] hover:text-[var(--admin-foreground)]"
                        : "text-[var(--admin-muted-foreground)] hover:bg-[#f2f7fc] hover:text-[var(--admin-foreground)]"
                  }`}
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
                          : isDarkMode
                            ? "text-[var(--admin-subtle-foreground)]"
                            : "text-[var(--admin-subtle-foreground)]"
                      }
                    >
                      {iconMap[item.label]}
                    </span>
                    {!isCollapsed && <span className="text-sm">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.type === "group" && (
                    <span className="ml-auto">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  )}
                </button>

                {isCollapsed && (
                  <div
                    className={`pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-0 shadow-md transition-all duration-200 group-hover:opacity-100 ${
                      isDarkMode
                        ? "bg-[#1f3047] text-[var(--admin-foreground)] border border-[#344662]"
                        : "bg-white text-[var(--admin-foreground)] border border-[#d9e2ee]"
                    }`}
                  >
                    {item.label}
                  </div>
                )}

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
                              ? "bg-[#e6f6ee] text-[#138842] font-semibold"
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
            onClick={() => setIsCollapsed((prev) => !prev)}
            className={`w-full h-14 p-4 flex items-center gap-3 text-sm font-medium transition-all duration-200 ${
              isDarkMode
                ? "hover:bg-[#1f3047] text-[var(--admin-muted-foreground)] hover:text-[var(--admin-foreground)]"
                : "hover:bg-[#f2f7fc] text-[var(--admin-muted-foreground)] hover:text-[var(--admin-foreground)]"
            }`}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
