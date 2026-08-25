import { describe, expect, it } from "vitest";
import {
  applyPrefillSingleLinkUrls,
  buildPrefillRedirectUrl,
  buildPrefillSurveyLink,
  DEFAULT_SURVEY_LINK_PLACEHOLDER,
  withRedirectUrlPid,
  withSurveyLinkPid,
} from "./surveyLinkPlaceholders";

describe("buildPrefillSurveyLink", () => {
  it("builds the survey simulator URL with Project URL Code as pid and XXXX as uid", () => {
    expect(buildPrefillSurveyLink("SFS363")).toBe(
      "https://samplepolls.com/survey_simulator.php?pid=SFS363&uid=XXXX"
    );
  });

  it("keeps a supported identifier UID placeholder", () => {
    expect(buildPrefillSurveyLink("SFS363", "identifier")).toBe(
      "https://samplepolls.com/survey_simulator.php?pid=SFS363&uid=identifier"
    );
  });
});

describe("withSurveyLinkPid", () => {
  it("prefills empty Live/Test links with the simulator URL", () => {
    expect(withSurveyLinkPid("", "SFS363")).toBe(
      "https://samplepolls.com/survey_simulator.php?pid=SFS363&uid=XXXX"
    );
  });

  it("upgrades the legacy samplepolls /survey default to survey_simulator.php", () => {
    expect(
      withSurveyLinkPid(
        "https://samplepolls.com/survey?pid=OLD123&uid=XXXX",
        "SFS363"
      )
    ).toBe("https://samplepolls.com/survey_simulator.php?pid=SFS363&uid=XXXX");
  });

  it("keeps a supported UID when upgrading the legacy default", () => {
    expect(
      withSurveyLinkPid(
        "https://samplepolls.com/survey?pid=OLD123&uid=identifier",
        "SFS363"
      )
    ).toBe(
      "https://samplepolls.com/survey_simulator.php?pid=SFS363&uid=identifier"
    );
  });

  it("syncs pid on an already-correct simulator URL", () => {
    expect(
      withSurveyLinkPid(
        "https://samplepolls.com/survey_simulator.php?pid=OLD123&uid=XXXX",
        "SFS363"
      )
    ).toBe("https://samplepolls.com/survey_simulator.php?pid=SFS363&uid=XXXX");
  });

  it("does not rewrite a custom user-edited host or path", () => {
    expect(
      withSurveyLinkPid(
        "https://partners.example.com/entry?pid=OLD123&uid=XXXX",
        "SFS363"
      )
    ).toBe("https://partners.example.com/entry?pid=SFS363&uid=XXXX");
  });
});

describe("applyPrefillSingleLinkUrls", () => {
  it("fills empty live and test links for Single Link forms", () => {
    const next = applyPrefillSingleLinkUrls(
      { projectUrlCode: "SFS363", liveLink: "", testLink: "" },
      "SFS363"
    );
    expect(next.liveLink).toBe(
      "https://samplepolls.com/survey_simulator.php?pid=SFS363&uid=XXXX"
    );
    expect(next.testLink).toBe(
      "https://samplepolls.com/survey_simulator.php?pid=SFS363&uid=XXXX"
    );
  });

  it("preserves a custom live link while upgrading a legacy test link", () => {
    const next = applyPrefillSingleLinkUrls(
      {
        liveLink: "https://custom.example/s?pid=KEEP&uid=XXXX",
        testLink: "https://samplepolls.com/survey?pid=OLD&uid=XXXX",
      },
      "SFS363"
    );
    expect(next.liveLink).toBe("https://custom.example/s?pid=SFS363&uid=XXXX");
    expect(next.testLink).toBe(
      "https://samplepolls.com/survey_simulator.php?pid=SFS363&uid=XXXX"
    );
  });
});

describe("redirect URLs", () => {
  it("does not use the survey simulator path for complete redirects", () => {
    const url = buildPrefillRedirectUrl("/complete", "SFS363");
    expect(url).toBe(
      "https://spade-community.com/complete?pid=SFS363&uid=identifier"
    );
    expect(url).not.toContain("survey_simulator.php");
    expect(url).not.toContain("samplepolls.com");
  });

  it("syncs pid on existing redirect URLs without changing the path", () => {
    expect(
      withRedirectUrlPid(
        "https://spade-community.com/terminate?pid=OLD&uid=identifier",
        "SFS363",
        "/terminate"
      )
    ).toBe("https://spade-community.com/terminate?pid=SFS363&uid=identifier");
  });
});

describe("DEFAULT_SURVEY_LINK_PLACEHOLDER", () => {
  it("documents the survey_simulator.php endpoint", () => {
    expect(DEFAULT_SURVEY_LINK_PLACEHOLDER).toBe(
      "https://samplepolls.com/survey_simulator.php?pid=PROJECT_URL_CODE&uid=XXXX"
    );
  });
});
