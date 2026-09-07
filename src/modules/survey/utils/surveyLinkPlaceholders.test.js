import { describe, expect, it } from "vitest";
import {
  ADMIN_SPADE_COMMUNITY_URL,
  applyPrefillSingleLinkUrls,
  buildPrefillRedirectUrl,
  buildPrefillSurveyLink,
  DEFAULT_SURVEY_LINK_PLACEHOLDER,
  getSurveyLinkPlaceholderError,
  rewriteUrlToAdminOrigin,
  withRedirectUrlPid,
  withSurveyLinkPid,
} from "./surveyLinkPlaceholders";

describe("buildPrefillSurveyLink", () => {
  it("uses the Speed Community admin origin and keeps pid/uid", () => {
    expect(buildPrefillSurveyLink("SFS363")).toBe(
      "https://admin.spadecommunity.com/?pid=SFS363&uid=XXXX"
    );
  });

  it("keeps a supported identifier UID placeholder", () => {
    expect(buildPrefillSurveyLink("SFS363", "identifier")).toBe(
      "https://admin.spadecommunity.com/?pid=SFS363&uid=identifier"
    );
  });
});

describe("withSurveyLinkPid", () => {
  it("prefills empty Live/Test links with the admin origin and pid/uid", () => {
    expect(withSurveyLinkPid("", "SFS363")).toBe(
      "https://admin.spadecommunity.com/?pid=SFS363&uid=XXXX"
    );
  });

  it("rewrites localhost while keeping path and query", () => {
    expect(
      withSurveyLinkPid(
        "http://localhost:5173/?pid=OLD123&uid=XXXX",
        "SFS363"
      )
    ).toBe("https://admin.spadecommunity.com/?pid=SFS363&uid=XXXX");
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
      "https://admin.spadecommunity.com/?pid=SFS363&uid=XXXX"
    );
    expect(next.testLink).toBe(
      "https://admin.spadecommunity.com/?pid=SFS363&uid=XXXX"
    );
  });
});

describe("redirect URLs", () => {
  it("keeps the redirect path and parameters on the admin origin", () => {
    const url = buildPrefillRedirectUrl("/redirect/complete", "SFS363");
    expect(url).toBe(
      "https://admin.spadecommunity.com/redirect/complete?pid=SFS363&uid=identifier"
    );
    expect(url).not.toContain("localhost:5173");
    expect(url).not.toContain("samplepolls.com");
  });

  it("rewrites localhost redirect URLs without dropping path or params", () => {
    expect(
      withRedirectUrlPid(
        "http://localhost:5173/redirect/surveyclose?pid=XTQ523&uid=identifier",
        "SFS363",
        "/redirect/surveyclose"
      )
    ).toBe(
      "https://admin.spadecommunity.com/redirect/surveyclose?pid=SFS363&uid=identifier"
    );
  });

  it("syncs pid on existing custom redirect URLs without changing the path", () => {
    expect(
      withRedirectUrlPid(
        "https://spadecommunity.com/terminate?pid=OLD&uid=identifier",
        "SFS363",
        "/terminate"
      )
    ).toBe("https://spadecommunity.com/terminate?pid=SFS363&uid=identifier");
  });
});

describe("rewriteUrlToAdminOrigin", () => {
  it("changes only the domain", () => {
    expect(
      rewriteUrlToAdminOrigin(
        "http://localhost:5173/redirect/surveyclose?pid=XTQ523&uid=identifier"
      )
    ).toBe(
      "https://admin.spadecommunity.com/redirect/surveyclose?pid=XTQ523&uid=identifier"
    );
  });
});

describe("DEFAULT_SURVEY_LINK_PLACEHOLDER", () => {
  it("uses the admin origin with pid and uid placeholders", () => {
    expect(DEFAULT_SURVEY_LINK_PLACEHOLDER).toBe(
      "https://admin.spadecommunity.com/?pid=PROJECT_URL_CODE&uid=XXXX"
    );
  });
});

describe("getSurveyLinkPlaceholderError", () => {
  it("does not treat the bare admin origin as a complete live link", () => {
    expect(getSurveyLinkPlaceholderError(ADMIN_SPADE_COMMUNITY_URL, "Live Link")).toBe(
      "Live Link must include both PID and a supported UID placeholder (identifier or XXXX)."
    );
  });
});
