import { describe, expect, it, vi, afterEach } from "vitest";
import { resetSurveySettingsViewAfterSave } from "./resetSurveySettingsView";

describe("resetSurveySettingsViewAfterSave", () => {
  afterEach(() => {
    delete window.tinymce;
  });

  it("scrolls TinyMCE survey-settings editors back to the top", () => {
    const scrollTo = vi.fn();
    const body = { scrollTop: 80, scrollLeft: 12 };
    window.tinymce = {
      editors: [
        {
          id: "survey-settings-completeRedirect",
          getWin: () => ({ scrollTo }),
          getBody: () => body,
          getDoc: () => ({ documentElement: { scrollTop: 40 }, body }),
        },
        {
          id: "other-page-editor",
          getWin: () => ({ scrollTo: vi.fn() }),
          getBody: () => ({ scrollTop: 99 }),
        },
      ],
    };

    resetSurveySettingsViewAfterSave();

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(body.scrollTop).toBe(0);
    expect(body.scrollLeft).toBe(0);
    expect(window.tinymce.editors[1].getBody().scrollTop).toBe(99);
  });
});
