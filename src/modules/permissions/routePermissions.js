/**
 * Maps URL paths to permission module keys for route guards.
 * First matching rule wins.
 */
const ROUTE_RULES = [
  { matcher: /^\/$/, module: "dashboard" },
  { matcher: /^\/users\/[^/]+\/permissions/, module: "users", requiresWrite: true },
  { matcher: /^\/users\/add/, module: "users", requiresWrite: true },
  { matcher: /^\/users(\/|$)/, module: "users" },
  { matcher: /^\/clients\/add/, module: "clients", requiresWrite: true },
  { matcher: /^\/clients(\/|$)/, module: "clients" },
  { matcher: /^\/partners\/add/, module: "partners", requiresWrite: true },
  { matcher: /^\/partners(\/|$)/, module: "partners" },
  { matcher: /^\/project-managers\/add/, module: "project_managers", requiresWrite: true },
  { matcher: /^\/project-managers(\/|$)/, module: "project_managers" },
  { matcher: /^\/sales\/rfq\/add/, module: "rfq", requiresWrite: true },
  { matcher: /^\/sales\/rfq(\/|$)/, module: "rfq" },
  { matcher: /^\/sales\/sales-manager\/add/, module: "sales_manager", requiresWrite: true },
  { matcher: /^\/sales\/sales-manager(\/|$)/, module: "sales_manager" },
  { matcher: /^\/sales(\/|$)/, module: "sales" },
  { matcher: /^\/prescreen\/group\/add/, module: "prescreen_group", requiresWrite: true },
  { matcher: /^\/prescreen\/group(\/|$)/, module: "prescreen_group" },
  { matcher: /^\/prescreen\/add/, module: "prescreen", requiresWrite: true },
  { matcher: /^\/prescreen(\/|$)/, module: "prescreen" },
  { matcher: /^\/survey\/group\/edit/, module: "group_survey", requiresWrite: true },
  { matcher: /^\/survey\/group\/view/, module: "group_survey" },
  { matcher: /^\/survey\/group(\/|$)/, module: "group_survey" },
  { matcher: /^\/survey\/recontact(\/|$)/, module: "recontact_survey" },
  { matcher: /^\/survey\/settings(\/|$)/, module: "survey_settings" },
  { matcher: /^\/survey\/add/, module: "survey", requiresWrite: true },
  { matcher: /^\/survey\/edit/, module: "survey", requiresWrite: true },
  { matcher: /^\/survey\/view/, module: "survey" },
  { matcher: /^\/survey(\/|$)/, module: "survey" },
  { matcher: /^\/invoice\/settings(\/|$)/, module: "invoice_settings" },
  { matcher: /^\/invoice\/list(\/|$)/, module: "invoices" },
  { matcher: /^\/invoice(\/|$)/, module: "invoices" },
  { matcher: /^\/log-activity(\/|$)/, module: "log_activity" },
  { matcher: /^\/notifications\/messages(\/|$)/, module: "messages" },
  { matcher: /^\/notifications(\/|$)/, module: "notifications" },
  { matcher: /^\/reward-points\/pending(\/|$)/, module: "pending_rewards" },
  { matcher: /^\/reward-points\/completed(\/|$)/, module: "completed_rewards" },
  { matcher: /^\/reward-points\/settings(\/|$)/, module: "reward_settings" },
  { matcher: /^\/reward-points(\/|$)/, module: "reward_points" },
  { matcher: /^\/user-screening\/questions\/add/, module: "user_screening_management", requiresWrite: true },
  { matcher: /^\/user-screening(\/|$)/, module: "user_screening_management" },
  { matcher: /^\/home-page(\/|$)/, module: "homepage_management" },
  { matcher: /^\/system-email\/edit/, module: "system_email_templates", requiresWrite: true },
  { matcher: /^\/system-email(\/|$)/, module: "system_email_templates" },
];

const WRITE_PATH_PATTERNS = [
  /\/add\/?$/,
  /\/permissions\/?$/,
];

/**
 * @param {string} pathname
 * @returns {string | null}
 */
export function getModuleKeyForPath(pathname) {
  return getRoutePermissionAccess(pathname).moduleKey;
}

/**
 * @param {string} pathname
 * @returns {{ moduleKey: string | null, requiresWrite: boolean }}
 */
export function getRoutePermissionAccess(pathname) {
  const rule = ROUTE_RULES.find((r) => r.matcher.test(pathname));
  if (!rule) {
    return { moduleKey: null, requiresWrite: false };
  }

  const requiresWrite =
    Boolean(rule.requiresWrite) ||
    WRITE_PATH_PATTERNS.some((pattern) => pattern.test(pathname));

  return {
    moduleKey: rule.module,
    requiresWrite,
  };
}
