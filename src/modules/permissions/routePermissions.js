/**
 * Maps URL paths to permission module keys for route guards.
 * First matching rule wins.
 */
const ROUTE_RULES = [
  { matcher: /^\/$/, module: "dashboard" },
  { matcher: /^\/users\/[^/]+\/permissions/, module: "users", requiresWrite: true },
  { matcher: /^\/users\/add/, module: "users", requiresWrite: true },
  { matcher: /^\/users\/edit\//, module: "users" },
  { matcher: /^\/users(\/|$)/, module: "users" },
  { matcher: /^\/clients\/add/, module: "clients", requiresWrite: true },
  { matcher: /^\/clients\/edit\//, module: "clients" },
  { matcher: /^\/clients(\/|$)/, module: "clients" },
  { matcher: /^\/partners\/add/, module: "partners", requiresWrite: true },
  { matcher: /^\/partners\/edit\//, module: "partners" },
  { matcher: /^\/partners(\/|$)/, module: "partners" },
  { matcher: /^\/project-managers\/add/, module: "project_managers", requiresWrite: true },
  { matcher: /^\/project-managers(\/|$)/, module: "project_managers" },
  { matcher: /^\/sales\/rfq\/logs\//, module: "rfq" },
  { matcher: /^\/sales\/rfq\/add/, module: "rfq", requiresWrite: true },
  { matcher: /^\/sales\/rfq\/edit\//, module: "rfq" },
  { matcher: /^\/sales\/rfq(\/|$)/, module: "rfq" },
  { matcher: /^\/sales\/projects\/view/, module: "survey" },
  { matcher: /^\/sales\/projects(\/|$)/, module: "survey" },
  { matcher: /^\/sales\/sales-manager\/add/, module: "sales_manager", requiresWrite: true },
  { matcher: /^\/sales\/sales-manager(\/|$)/, module: "sales_manager" },
  { matcher: /^\/sales(\/|$)/, module: "sales" },
  { matcher: /^\/prescreen\/group\/add/, module: "prescreen_group", requiresWrite: true },
  { matcher: /^\/prescreen\/group\/edit\//, module: "prescreen_group" },
  { matcher: /^\/prescreen\/group(\/|$)/, module: "prescreen_group" },
  { matcher: /^\/prescreen\/add/, module: "prescreen", requiresWrite: true },
  { matcher: /^\/prescreen(\/|$)/, module: "prescreen" },
  { matcher: /^\/survey\/group\/add/, module: "group_survey", requiresWrite: true },
  { matcher: /^\/survey\/group\/[^/]+\/add-project/, module: "group_survey", requiresWrite: true },
  { matcher: /^\/survey\/group\/[^/]+\/projects/, module: "group_survey" },
  { matcher: /^\/survey\/group\/edit/, module: "group_survey", requiresWrite: true },
  { matcher: /^\/survey\/group\/view/, module: "group_survey" },
  { matcher: /^\/survey\/group(\/|$)/, module: "group_survey" },
  { matcher: /^\/survey\/recontact(\/|$)/, module: "recontact_survey" },
  { matcher: /^\/survey\/settings(\/|$)/, module: "survey_settings" },
  { matcher: /^\/survey\/add/, module: "survey", requiresWrite: true },
  { matcher: /^\/survey\/edit/, module: "survey", requiresWrite: true },
  { matcher: /^\/survey\/[^/]+\/find-user/, module: "survey" },
  { matcher: /^\/survey\/[^/]+\/user-survey-data/, module: "survey" },
  { matcher: /^\/survey\/report\/view\//, module: "survey" },
  { matcher: /^\/survey\/view/, module: "survey" },
  { matcher: /^\/survey(\/|$)/, module: "survey" },
  { matcher: /^\/invoice\/settings(\/|$)/, module: "invoice_settings" },
  { matcher: /^\/invoice\/list(\/|$)/, module: "invoices" },
  { matcher: /^\/invoice(\/|$)/, module: "invoices" },
  { matcher: /^\/log-activity(\/|$)/, module: "log_activity" },
  { matcher: /^\/community-users\/edit\//, module: "community_users", requiresWrite: true },
  { matcher: /^\/community-users\/[^/]+\/reward-log/, module: "community_users" },
  { matcher: /^\/community-users\/[^/]+$/, module: "community_users" },
  { matcher: /^\/community-users(\/|$)/, module: "community_users" },
  { matcher: /^\/user-email-templates\/add/, module: "user_email_templates", requiresWrite: true },
  { matcher: /^\/user-email-templates\/edit\//, module: "user_email_templates", requiresWrite: true },
  { matcher: /^\/user-email-templates(\/|$)/, module: "user_email_templates" },
  { matcher: /^\/notifications\/messages\/[^/]+$/, module: "messages" },
  { matcher: /^\/notifications\/messages(\/|$)/, module: "messages" },
  { matcher: /^\/notifications(\/|$)/, module: "notifications" },
  { matcher: /^\/reward-points\/history(\/|$)/, module: "reward_history" },
  { matcher: /^\/reward-points\/pending(\/|$)/, module: "pending_rewards" },
  { matcher: /^\/reward-points\/completed(\/|$)/, module: "completed_rewards" },
  { matcher: /^\/reward-points\/settings(\/|$)/, module: "reward_settings" },
  { matcher: /^\/reward-points(\/|$)/, module: "reward_points" },
  { matcher: /^\/user-screening\/questions\/add/, module: "user_screening_management", requiresWrite: true },
  { matcher: /^\/user-screening\/questions\/sort/, module: "user_screening_management", requiresWrite: true },
  { matcher: /^\/user-screening\/questions\/edit\//, module: "user_screening_management", requiresWrite: true },
  { matcher: /^\/user-screening\/create-survey\/add/, module: "user_screening_management", requiresWrite: true },
  { matcher: /^\/user-screening\/create-survey\/edit\//, module: "user_screening_management", requiresWrite: true },
  { matcher: /^\/user-screening\/create-survey(\/|$)/, module: "user_screening_management" },
  { matcher: /^\/user-screening\/questions(\/|$)/, module: "user_screening_management" },
  { matcher: /^\/home-page(\/|$)/, module: "homepage_management" },
  { matcher: /^\/system-email\/edit/, module: "system_email_templates", requiresWrite: true },
  { matcher: /^\/system-email(\/|$)/, module: "system_email_templates" },
];

const WRITE_PATH_PATTERNS = [
  /\/add\/?$/,
  /\/permissions\/?$/,
  /\/sort\/?$/,
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
