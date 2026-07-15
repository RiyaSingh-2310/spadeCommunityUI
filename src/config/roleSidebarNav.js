import { LOGIN_ROLES } from "../services/auth/loginRole";
import { SIDEBAR_NAV_ITEMS } from "./sidebarNavConfig";
import { matchesSurveyMain } from "./sidebarNavUtils";

const SALES_SIDEBAR_NAV_ITEMS = [
  {
    type: "link",
    label: "Dashboard",
    root: "/",
    matcher: /^\/($|dashboard)/,
    permissionKeys: ["dashboard"],
  },
  {
    type: "link",
    label: "RFQ",
    root: "/sales/rfq",
    matcher: /^\/sales\/rfq(\/|$)/,
    permissionKeys: ["rfq"],
  },
  {
    type: "link",
    label: "Projects",
    root: "/sales/projects",
    matcher: /^\/sales\/projects(\/|$)/,
    permissionKeys: ["survey"],
  },
  {
    type: "link",
    label: "Settings",
    root: "/settings",
    matcher: /^\/settings(\/|$)/,
    permissionKeys: [],
  },
];

const MANAGER_SIDEBAR_NAV_ITEMS = [
  {
    type: "link",
    label: "Dashboard",
    root: "/",
    matcher: /^\/($|dashboard)/,
    permissionKeys: ["dashboard"],
  },
  {
    type: "group",
    label: "Project Management",
    key: "survey",
    matcher: /^\/survey(\/|$)/,
    permissionKeys: ["survey", "group_survey"],
    children: [
      {
        label: "Projects",
        root: "/survey",
        isActive: matchesSurveyMain,
        matcher: /^\/survey(\/|$)/,
        permissionKeys: ["survey"],
      },
      {
        label: "Group Survey",
        root: "/survey/group",
        matcher: /^\/survey\/group(\/|$)/,
        permissionKeys: ["group_survey"],
      },
    ],
  },
  {
    type: "link",
    label: "Settings",
    root: "/settings",
    matcher: /^\/settings(\/|$)/,
    permissionKeys: [],
  },
];

/**
 * @param {string} loginRole
 */
export function getSidebarNavItemsForRole(loginRole) {
  if (loginRole === LOGIN_ROLES.SALES) {
    return SALES_SIDEBAR_NAV_ITEMS;
  }
  if (loginRole === LOGIN_ROLES.MANAGER) {
    return MANAGER_SIDEBAR_NAV_ITEMS;
  }
  return SIDEBAR_NAV_ITEMS;
}
