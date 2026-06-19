/**
 * Permission UI hierarchy (aligned with sidebar navigation).
 * `parentKey` is UI-only and must never match a child `key` (API module key).
 *
 * @typedef {{ key: string, label: string }} PermissionChildNode
 * @typedef {{
 *   type: "group",
 *   id: string,
 *   label: string,
 *   parentKey: string,
 *   apiParentKey?: string,
 *   children: PermissionChildNode[],
 * }} PermissionGroupNode
 * @typedef {{
 *   type: "leaf",
 *   key: string,
 *   label: string,
 * }} PermissionLeafNode
 */

/** @type {(PermissionLeafNode | PermissionGroupNode)[]} */
export const PERMISSION_TREE = [
  { type: "leaf", key: "dashboard", label: "Dashboard" },
  { type: "leaf", key: "users", label: "Admin Users" },
  {
    type: "group",
    id: "community_users_module",
    label: "Users",
    parentKey: "community_users_parent",
    children: [
      { key: "community_users", label: "User List" },
      { key: "user_email_templates", label: "User Email Templates" },
    ],
  },
  { type: "leaf", key: "clients", label: "Clients" },
  { type: "leaf", key: "partners", label: "Partners" },
  { type: "leaf", key: "project_managers", label: "Project Managers" },
  {
    type: "group",
    id: "sales",
    label: "Sales",
    parentKey: "sales_parent",
    apiParentKey: "sales",
    children: [
      { key: "rfq", label: "RFQ" },
      { key: "sales_manager", label: "Sales Manager" },
    ],
  },
  {
    type: "group",
    id: "prescreen",
    label: "Prescreen",
    parentKey: "prescreen_parent",
    children: [
      { key: "prescreen", label: "Prescreen" },
      { key: "prescreen_group", label: "Prescreen Group" },
    ],
  },
  {
    type: "group",
    id: "survey",
    label: "Survey",
    parentKey: "survey_parent",
    children: [
      { key: "survey", label: "Survey" },
      { key: "group_survey", label: "Group Survey" },
      { key: "recontact_survey", label: "Recontact Survey" },
      { key: "survey_settings", label: "Survey Settings" },
    ],
  },
  {
    type: "group",
    id: "invoice",
    label: "Invoice",
    parentKey: "invoice_parent",
    apiParentKey: "invoice",
    children: [
      { key: "invoice_settings", label: "Invoice Settings" },
      { key: "invoices", label: "Invoices" },
    ],
  },
  {
    type: "group",
    id: "notifications",
    label: "Notifications",
    parentKey: "notifications_parent",
    apiParentKey: "notifications",
    children: [{ key: "messages", label: "Messages" }],
  },
  {
    type: "group",
    id: "reward_points",
    label: "Reward Points",
    parentKey: "reward_points_parent",
    apiParentKey: "reward_points",
    children: [
      { key: "pending_rewards", label: "Pending Rewards" },
      { key: "completed_rewards", label: "Completed Rewards" },
      { key: "reward_settings", label: "Reward Settings" },
    ],
  },
  {
    type: "group",
    id: "user_screening",
    label: "User Screening Management",
    parentKey: "user_screening_parent",
    children: [
      { key: "user_screening_management", label: "List Of All Questions" },
    ],
  },
  { type: "leaf", key: "homepage_management", label: "Homepage Management" },
  { type: "leaf", key: "system_email_templates", label: "System Email Templates" },
  { type: "leaf", key: "log_activity", label: "Log Activity" },
];

/** UI-only parent keys (stripped from API payloads). */
export const PERMISSION_UI_PARENT_KEYS = PERMISSION_TREE.filter(
  (node) => node.type === "group"
).map((node) => node.parentKey);

/** @param {PermissionGroupNode} group */
export function getGroupChildKeys(group) {
  return group.children.map((child) => child.key);
}

/** @returns {PermissionGroupNode[]} */
export function getPermissionGroups() {
  return PERMISSION_TREE.filter((node) => node.type === "group");
}
