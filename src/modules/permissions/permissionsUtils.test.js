import { describe, expect, it } from "vitest";
import {
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
