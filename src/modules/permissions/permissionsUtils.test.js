import { describe, expect, it } from "vitest";
import { canReadModule, canWriteModule, createDefaultPermissions } from "./permissionsUtils";
import { getModuleListingReadMode, shouldHideActionColumnWhenReadOnly } from "./moduleListingPermissions";

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
