import { describe, expect, it } from "vitest";
import {
  buildDownloadPermissionsCsvContent,
  getSavedDownloadPermissionItems,
  hasSavedDownloadPermission,
} from "./downloadPermissionsCsv";
import { createDefaultPermissions, setModulePermission } from "./permissionsUtils";

describe("download permissions CSV", () => {
  it("detects saved download grants only", () => {
    let permissions = createDefaultPermissions();
    expect(hasSavedDownloadPermission(permissions)).toBe(false);

    permissions = setModulePermission(permissions, "clients", "canDownload", true);
    expect(hasSavedDownloadPermission(permissions)).toBe(true);
    expect(getSavedDownloadPermissionItems(permissions).map((item) => item.key)).toEqual([
      "clients",
    ]);
  });

  it("builds CSV rows only for download-enabled modules", () => {
    let permissions = createDefaultPermissions();
    permissions = setModulePermission(permissions, "clients", "canRead", true);
    permissions = setModulePermission(permissions, "clients", "canDownload", true);
    permissions = setModulePermission(permissions, "partners", "canWrite", true);

    const csv = buildDownloadPermissionsCsvContent(permissions);
    expect(csv).toContain("Module,Module Key,Read,Write,Download");
    expect(csv).toContain("clients");
    expect(csv).not.toContain("partners");
  });
});
