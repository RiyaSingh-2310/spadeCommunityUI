import { describe, expect, it } from "vitest";
import {
  createEmptyDownloadSelections,
  getSelectedDownloadModuleKeys,
  hasAnyDownloadSelection,
  permissionsForPersist,
  setDownloadSelectionsForKeys,
} from "./temporaryDownloadSelections";
import {
  createDefaultPermissions,
  setModulePermission,
} from "./permissionsUtils";

describe("temporary download selections", () => {
  it("starts with every download unchecked", () => {
    const selections = createEmptyDownloadSelections();
    expect(hasAnyDownloadSelection(selections)).toBe(false);
    expect(getSelectedDownloadModuleKeys(selections)).toEqual([]);
  });

  it("tracks selected modules independently from saved permissions", () => {
    let selections = createEmptyDownloadSelections();
    selections = setDownloadSelectionsForKeys(
      selections,
      ["project_managers", "sales_manager"],
      true
    );

    expect(hasAnyDownloadSelection(selections)).toBe(true);
    expect(getSelectedDownloadModuleKeys(selections)).toEqual([
      "project_managers",
      "sales_manager",
    ]);

    selections = setDownloadSelectionsForKeys(selections, ["project_managers"], false);
    expect(getSelectedDownloadModuleKeys(selections)).toEqual(["sales_manager"]);
  });

  it("strips download flags before persisting Read/Write permissions", () => {
    let permissions = createDefaultPermissions();
    permissions = setModulePermission(permissions, "project_managers", "canRead", true);
    permissions = setModulePermission(
      permissions,
      "project_managers",
      "canDownload",
      true
    );

    const persisted = permissionsForPersist(permissions);
    expect(persisted.project_managers.canRead).toBe(true);
    expect(persisted.project_managers.canDownload).toBe(false);
  });
});
