import { describe, expect, it } from "vitest";
import { resolveTinymceScriptSrc } from "./richTextEditorConfig";

describe("resolveTinymceScriptSrc", () => {
  it("resolves the self-hosted TinyMCE script under the Vite base path", () => {
    expect(resolveTinymceScriptSrc("/")).toBe("/tinymce/tinymce.min.js");
    expect(resolveTinymceScriptSrc("/admin/")).toBe("/admin/tinymce/tinymce.min.js");
    expect(resolveTinymceScriptSrc("/admin")).toBe("/admin/tinymce/tinymce.min.js");
  });
});
