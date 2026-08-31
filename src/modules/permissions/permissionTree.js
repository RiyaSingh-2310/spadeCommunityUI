import { SIDEBAR_NAV_ITEMS } from "../../config/sidebarNavConfig";

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

/** @type {Record<string, string>} */
const GROUP_API_PARENT_KEYS = {
  notifications: "notifications",
  "reward-points": "reward_points",
};

function toParentKey(groupKey) {
  return `${String(groupKey).replace(/-/g, "_")}_parent`;
}

/**
 * @param {{ type: string, label: string, key?: string, permissionKeys?: string[], children?: { label: string, permissionKeys?: string[] }[] }} item
 * @returns {PermissionLeafNode | PermissionGroupNode | null}
 */
function sidebarItemToPermissionNode(item) {
  if (item.type === "link") {
    const key = item.permissionKeys?.[0];
    if (!key) return null;
    return { type: "leaf", key, label: item.label };
  }

  if (item.type === "group") {
    const children = (item.children ?? [])
      .map((child) => ({
        key: child.permissionKeys?.[0],
        label: child.label,
      }))
      .filter((child) => Boolean(child.key));

    if (!children.length) return null;

    const node = {
      type: "group",
      id: item.key,
      label: item.label,
      parentKey: toParentKey(item.key),
      children,
    };

    const apiParentKey = GROUP_API_PARENT_KEYS[item.key];
    if (apiParentKey) {
      node.apiParentKey = apiParentKey;
    }

    return node;
  }

  return null;
}

/** @type {(PermissionLeafNode | PermissionGroupNode)[]} */
export const PERMISSION_TREE = SIDEBAR_NAV_ITEMS.flatMap((item) => {
  const node = sidebarItemToPermissionNode(item);
  return node ? [node] : [];
});

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
