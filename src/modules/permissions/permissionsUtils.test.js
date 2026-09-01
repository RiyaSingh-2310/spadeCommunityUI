import { describe, expect, it } from "vitest";
import {
  canOpenMessagesPage,
  canReadModule,
  canShowNotificationBell,
  canWriteModule,
  createDefaultPermissions,
} from "./permissionsUtils";
import { getModuleListingReadMode, shouldHideActionColumnWhenReadOnly } from "./moduleListingPermissions";
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

describe("notification and messages access", () => {
  it("hides the header bell when notifications and messages are both denied", () => {
    const permissions = createDefaultPermissions();
    expect(canShowNotificationBell(permissions)).toBe(false);
    expect(canOpenMessagesPage(permissions)).toBe(false);
  });

  it("keeps the bell for notifications read-only and blocks /messages", () => {
    const permissions = createDefaultPermissions();
    permissions.notifications = { canRead: true, canWrite: false };

    expect(canShowNotificationBell(permissions)).toBe(true);
    expect(canOpenMessagesPage(permissions)).toBe(false);
    expect(hasPathPermissionAccess("/messages", permissions)).toBe(false);
    expect(hasPathPermissionAccess("/messages/12", permissions)).toBe(false);
  });

  it("allows /messages only when notifications or messages have write", () => {
    const messagesRead = createDefaultPermissions();
    messagesRead.messages = { canRead: true, canWrite: false };
    expect(canOpenMessagesPage(messagesRead)).toBe(false);
    expect(hasPathPermissionAccess("/messages", messagesRead)).toBe(false);

    const messagesWrite = createDefaultPermissions();
    messagesWrite.messages = { canRead: true, canWrite: true };
    expect(canOpenMessagesPage(messagesWrite)).toBe(true);
    expect(hasPathPermissionAccess("/messages", messagesWrite)).toBe(true);

    const notificationsWrite = createDefaultPermissions();
    notificationsWrite.notifications = { canRead: true, canWrite: true };
    expect(canOpenMessagesPage(notificationsWrite)).toBe(true);
    expect(hasPathPermissionAccess("/messages/9", notificationsWrite)).toBe(true);
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
  });
});
