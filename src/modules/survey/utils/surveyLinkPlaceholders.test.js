import { describe, expect, it } from "vitest";
import {
  ADMIN_SPADE_COMMUNITY_URL,
  applyPrefillSingleLinkUrls,
  buildPrefillRedirectUrl,
  buildPrefillSurveyLink,
  DEFAULT_SURVEY_LINK_PLACEHOLDER,
  getSurveyLinkPlaceholderError,
  replaceSurveyLinkPlaceholders,
  rewriteUrlToAdminOrigin,
  rewriteUrlToRedirectOrigin,
  withRedirectUrlPid,
  withSurveyLinkPid,
} from "./surveyLinkPlaceholders";

describe("buildPrefillSurveyLink", () => {
  it("uses the Speed Community admin origin with uid only (no pid)", () => {
    expect(buildPrefillSurveyLink("SFS363")).toBe(
      "https://spadecommunity.com/?uid=XXXX"
    );
  });

  it("keeps a supported identifier UID placeholder", () => {
    expect(buildPrefillSurveyLink("SFS363", "identifier")).toBe(
      "https://spadecommunity.com/?uid=identifier"
    );
  });
});

describe("withSurveyLinkPid", () => {
  it("prefills empty Live/Test links with the admin origin and uid (no pid)", () => {
    expect(withSurveyLinkPid("", "SFS363")).toBe(
      "https://spadecommunity.com/?uid=XXXX"
    );
  });

  it("rewrites localhost while keeping path and existing query", () => {
    expect(
      withSurveyLinkPid(
        "http://localhost:5173/?pid=OLD123&uid=XXXX",
        "SFS363"
      )
    ).toBe("https://spadecommunity.com/?pid=OLD123&uid=XXXX");
  });

  it("does not rewrite a custom user-edited host or path", () => {
    expect(
      withSurveyLinkPid(
        "https://partners.example.com/entry?pid=OLD123&uid=XXXX",
        "SFS363"
      )
    ).toBe("https://partners.example.com/entry?pid=OLD123&uid=XXXX");
  });
});

describe("applyPrefillSingleLinkUrls", () => {
  it("fills empty live and test links for Single Link forms", () => {
    const next = applyPrefillSingleLinkUrls(
      { projectUrlCode: "SFS363", liveLink: "", testLink: "" },
      "SFS363"
    );
    expect(next.liveLink).toBe("https://spadecommunity.com/?uid=XXXX");
    expect(next.testLink).toBe("https://spadecommunity.com/?uid=XXXX");
  });
});

describe("redirect URLs", () => {
  it("keeps the redirect path and uid on the client origin (no pid)", () => {
    const url = buildPrefillRedirectUrl("/redirect/complete", "SFS363");
    expect(url).toBe(
      "https://spadecommunity.com/redirect/complete?uid=identifier"
    );
    expect(url).not.toContain("pid=");
    expect(url).not.toContain("localhost:5173");
    expect(url).not.toContain("samplepolls.com");
    expect(url).not.toContain("admin.spadecommunity.com");
  });

  it("rewrites localhost redirect URLs without dropping path or existing params", () => {
    expect(
      withRedirectUrlPid(
        "http://localhost:5173/redirect/survey-closed?pid=XTQ523&uid=identifier",
        "SFS363",
        "/redirect/survey-closed"
      )
    ).toBe(
      "https://spadecommunity.com/redirect/survey-closed?pid=XTQ523&uid=identifier"
    );
  });

  it("rewrites admin-domain redirect URLs onto the client origin", () => {
    expect(
      withRedirectUrlPid(
        "https://admin.spadecommunity.com/redirect/complete?pid=OLD&uid=identifier",
        "SFS363",
        "/redirect/complete"
      )
    ).toBe(
      "https://spadecommunity.com/redirect/complete?pid=OLD&uid=identifier"
    );
  });

  it("ensures uid on existing custom redirect URLs without changing the path or pid", () => {
    expect(
      withRedirectUrlPid(
        "https://spadecommunity.com/terminate?pid=OLD&uid=identifier",
        "SFS363",
        "/terminate"
      )
    ).toBe("https://spadecommunity.com/terminate?pid=OLD&uid=identifier");
  });
});

describe("rewriteUrlToAdminOrigin", () => {
  it("changes only the domain for Live/Test links", () => {
    expect(
      rewriteUrlToAdminOrigin(
        "http://localhost:5173/?pid=XTQ523&uid=XXXX"
      )
    ).toBe("https://spadecommunity.com/?pid=XTQ523&uid=XXXX");
  });
});

describe("rewriteUrlToRedirectOrigin", () => {
  it("changes only the domain for redirect URLs", () => {
    expect(
      rewriteUrlToRedirectOrigin(
        "http://localhost:5173/redirect/survey-closed?pid=XTQ523&uid=identifier"
      )
    ).toBe(
      "https://spadecommunity.com/redirect/survey-closed?pid=XTQ523&uid=identifier"
    );
  });
});

describe("DEFAULT_SURVEY_LINK_PLACEHOLDER", () => {
  it("uses the admin origin with uid placeholder only (no pid)", () => {
    expect(DEFAULT_SURVEY_LINK_PLACEHOLDER).toBe(
      "https://spadecommunity.com/?uid=XXX"
    );
  });
});

describe("getSurveyLinkPlaceholderError", () => {
  it("does not treat the bare admin origin as a complete live link", () => {
    expect(getSurveyLinkPlaceholderError(ADMIN_SPADE_COMMUNITY_URL, "Live Link")).toMatch(
      /must include a UID/
    );
  });

  it("accepts XXX as a UID query placeholder without requiring PID", () => {
    expect(
      getSurveyLinkPlaceholderError(
        "https://spadecommunity.com/?uid=XXX",
        "Live Link"
      )
    ).toBe("");
  });

  it("accepts UID as a direct path segment", () => {
    expect(
      getSurveyLinkPlaceholderError(
        "https://spadecommunity.com/XXXXX",
        "Live Link"
      )
    ).toBe("");
    expect(
      getSurveyLinkPlaceholderError(
        "https://spadecommunity.com/survey/XXXX",
        "Live Link"
      )
    ).toBe("");
  });

  it("accepts UID as a query parameter on a survey path", () => {
    expect(
      getSurveyLinkPlaceholderError(
        "https://spadecommunity.com/survey?uid=XXXXX",
        "Live Link"
      )
    ).toBe("");
  });

  it("still accepts legacy URLs that also include pid", () => {
    expect(
      getSurveyLinkPlaceholderError(
        "https://spadecommunity.com/?pid=XXX&uid=XXX",
        "Live Link"
      )
    ).toBe("");
  });

  it("does not treat static redirect path segments as UIDs", () => {
    expect(
      getSurveyLinkPlaceholderError(
        "https://spadecommunity.com/redirect/complete",
        "Complete"
      )
    ).toMatch(/must include a UID/);
  });
});

describe("replaceSurveyLinkPlaceholders", () => {
  it("replaces query and path UID placeholders", () => {
    expect(
      replaceSurveyLinkPlaceholders(
        "https://spadecommunity.com/survey?uid=XXXX",
        "resp-1"
      )
    ).toBe("https://spadecommunity.com/survey?uid=resp-1");
    expect(
      replaceSurveyLinkPlaceholders(
        "https://spadecommunity.com/survey/XXXX",
        "resp-1"
      )
    ).toBe("https://spadecommunity.com/survey/resp-1");
  });
});
