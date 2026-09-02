import { describe, expect, it } from "vitest";
import { SIDEBAR_NAV_ITEMS } from "../../config/sidebarNavConfig";
import {
  canAccessAnyModule,
  canAccessRewardManagement,
  canOpenMessagesPage,
  canReadModule,
  canWriteModule,
  createDefaultPermissions,
  normalizePermissions,
} from "./permissionsUtils";
import {
  getModuleListingReadMode,
  shouldHideActionColumnWhenReadOnly,
} from "./moduleListingPermissions";
import { getRoutePermissionAccess, hasPathPermissionAccess } from "./routePermissions";
import { PERMISSION_TREE } from "./permissionTree";

function visibleSidebarLabels(permissions) {
  return SIDEBAR_NAV_ITEMS.map((item) => {
    if (item.type === "group") {
      const children = (item.children ?? []).filter((child) =>
        canAccessAnyModule(permissions, child.permissionKeys)
      );
      if (!children.length) return null;
      return {
        label: item.label,
        children: children.map((child) => child.label),
      };
    }
    return canAccessAnyModule(permissions, item.permissionKeys)
      ? { label: item.label }
      : null;
  }).filter(Boolean);
}

describe("frontend permissions are UX controls", () => {
  it("hides write actions for users without write access", () => {
    const permissions = createDefaultPermissions();
    permissions.users = { canRead: true, canWrite: false };

    expect(canReadModule(permissions, "users")).toBe(true);
    expect(canWriteModule(permissions, "users")).toBe(false);
    expect(shouldHideActionColumnWhenReadOnly("users", false)).toBe(true);
  });

  it("does not treat a hidden button as backend authorization", () => {
    const permissions = createDefaultPermissions();
    expect(canWriteModule(permissions, "clients")).toBe(false);
    expect(getModuleListingReadMode("clients")).toBe("hide-action-column");
  });

  it("keeps listing read modes for protected CRUD modules", () => {
    expect(getModuleListingReadMode("partners")).toBe("hide-action-column");
    expect(getModuleListingReadMode("project_managers")).toBe("hide-action-column");
    expect(getModuleListingReadMode("survey")).toBe("survey-read");
    expect(getModuleListingReadMode("user_screening_management")).toBe("hide-action-column");
    expect(getModuleListingReadMode("community_users")).toBe("community-user-read");
    expect(getModuleListingReadMode("prescreen")).toBe("hide-action-column");
  });
});

describe("assigned modules only", () => {
  it("does not grant unassigned modules even when treated as an admin", () => {
    const permissions = normalizePermissions({
      dashboard: { canRead: true, canWrite: true },
      users: { canRead: true, canWrite: true },
      clients: { canRead: true, canWrite: false },
      partners: { canRead: true, canWrite: false },
      rfq: { canRead: true, canWrite: true },
      prescreen: { canRead: true, canWrite: true },
      survey: { canRead: true, canWrite: true },
      notifications: { canRead: true, canWrite: false },
      community_users: { canRead: true, canWrite: true },
      user_email_templates: { canRead: true, canWrite: false },
      log_activity: { canRead: true, canWrite: false },
    });

    expect(canReadModule(permissions, "clients", { isSuperAdmin: true })).toBe(true);
    expect(canReadModule(permissions, "reward_points", { isSuperAdmin: true })).toBe(false);
    expect(canAccessRewardManagement(permissions)).toBe(false);
    expect(hasPathPermissionAccess("/reward-points/history", permissions)).toBe(false);
    expect(hasPathPermissionAccess("/reward-points/pending", permissions)).toBe(false);
    expect(hasPathPermissionAccess("/reward-points/settings", permissions)).toBe(false);
  });
});

describe("notification and messages access", () => {
  it("opens /messages when Notifications or Messages is assigned", () => {
    const notificationsOnly = createDefaultPermissions();
    notificationsOnly.notifications = { canRead: true, canWrite: false };
    expect(canOpenMessagesPage(notificationsOnly)).toBe(true);
    expect(hasPathPermissionAccess("/messages", notificationsOnly)).toBe(true);

    const messagesRead = createDefaultPermissions();
    messagesRead.messages = { canRead: true, canWrite: false };
    expect(canOpenMessagesPage(messagesRead)).toBe(true);
    expect(hasPathPermissionAccess("/messages", messagesRead)).toBe(true);
  });

  it("blocks /messages when Notifications and Messages are unassigned", () => {
    const permissions = createDefaultPermissions();
    expect(canOpenMessagesPage(permissions)).toBe(false);
    expect(hasPathPermissionAccess("/messages", permissions)).toBe(false);
    expect(hasPathPermissionAccess("/messages/12", permissions)).toBe(false);
  });
});

describe("edit routes require write", () => {
  it("requires write for edit paths", () => {
    expect(getRoutePermissionAccess("/clients/edit/1").requiresWrite).toBe(true);
    expect(getRoutePermissionAccess("/users/edit/1").requiresWrite).toBe(true);
    expect(getRoutePermissionAccess("/sales/rfq/edit/1").requiresWrite).toBe(true);
    expect(getRoutePermissionAccess("/clients").requiresWrite).toBe(false);
  });

  it("denies edit URLs for read-only users", () => {
    const permissions = createDefaultPermissions();
    permissions.clients = { canRead: true, canWrite: false };
    expect(hasPathPermissionAccess("/clients", permissions)).toBe(true);
    expect(hasPathPermissionAccess("/clients/edit/1", permissions)).toBe(false);
  });
});

describe("email module permission mapping", () => {
  it("maps common email key aliases and labels", () => {
    const permissions = normalizePermissions({
      system_email: { canRead: true, canWrite: false },
      "User Email Template": { view: true, add: true, edit: true, delete: true },
    });

    expect(canReadModule(permissions, "system_email_templates")).toBe(true);
    expect(canWriteModule(permissions, "system_email_templates")).toBe(false);
    expect(canReadModule(permissions, "user_email_templates")).toBe(true);
    expect(canWriteModule(permissions, "user_email_templates")).toBe(true);
  });

  it("shows Email Templates parent only for permitted children", () => {
    const systemOnly = normalizePermissions({
      system_email_templates: { canRead: true, canWrite: true },
    });
    const visible = visibleSidebarLabels(systemOnly);
    const emailGroup = visible.find((item) => item.label === "Email Templates");

    expect(emailGroup).toBeTruthy();
    expect(emailGroup.children).toEqual(["System Email Template"]);
    expect(hasPathPermissionAccess("/system-email", systemOnly)).toBe(true);
    expect(hasPathPermissionAccess("/user-email-templates", systemOnly)).toBe(false);
  });

  it("hides Email Templates when neither email module is granted", () => {
    const permissions = normalizePermissions({
      dashboard: { canRead: true, canWrite: false },
    });
    const visible = visibleSidebarLabels(permissions);
    expect(visible.some((item) => item.label === "Email Templates")).toBe(false);
  });

  it("includes both email children in the permission assignment tree", () => {
    const emailGroup = PERMISSION_TREE.find(
      (node) => node.type === "group" && node.id === "email-templates"
    );
    expect(emailGroup).toBeTruthy();
    expect(emailGroup.children.map((child) => child.key)).toEqual([
      "system_email_templates",
      "user_email_templates",
    ]);
  });
});

describe("nested parent menus", () => {
  it("hides empty parents and keeps only permitted children", () => {
    const permissions = normalizePermissions({
      dashboard: { canRead: true, canWrite: false },
      survey: { canRead: true, canWrite: false },
    });
    const visible = visibleSidebarLabels(permissions);
    const projectGroup = visible.find((item) => item.label === "Project Management");

    expect(projectGroup?.children).toEqual(["Projects"]);
    expect(visible.some((item) => item.label === "Reward Management")).toBe(false);
    expect(visible.some((item) => item.label === "User Management")).toBe(false);
  });
});
