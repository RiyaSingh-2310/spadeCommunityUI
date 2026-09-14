import { describe, expect, it } from "vitest";
import {
  ADMIN_SPADE_COMMUNITY_URL,
  applyPrefillSingleLinkUrls,
  buildPrefillRedirectUrl,
  buildPrefillSurveyLink,
  DEFAULT_SURVEY_LINK_PLACEHOLDER,
  getSurveyLinkPlaceholderError,
  rewriteUrlToAdminOrigin,
  rewriteUrlToRedirectOrigin,
  withRedirectUrlPid,
  withSurveyLinkPid,
} from "./surveyLinkPlaceholders";

describe("buildPrefillSurveyLink", () => {
  it("uses the Speed Community admin origin and keeps pid/uid", () => {
    expect(buildPrefillSurveyLink("SFS363")).toBe(
      "https://spadecommunity.com/?pid=SFS363&uid=XXXX"
    );
  });

  it("keeps a supported identifier UID placeholder", () => {
    expect(buildPrefillSurveyLink("SFS363", "identifier")).toBe(
      "https://spadecommunity.com/?pid=SFS363&uid=identifier"
    );
  });
});

describe("withSurveyLinkPid", () => {
  it("prefills empty Live/Test links with the admin origin and pid/uid", () => {
    expect(withSurveyLinkPid("", "SFS363")).toBe(
      "https://spadecommunity.com/?pid=SFS363&uid=XXXX"
    );
  });

  it("rewrites localhost while keeping path and query", () => {
    expect(
      withSurveyLinkPid(
        "http://localhost:5173/?pid=OLD123&uid=XXXX",
        "SFS363"
      )
    ).toBe("https://spadecommunity.com/?pid=SFS363&uid=XXXX");
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
      "https://spadecommunity.com/?pid=SFS363&uid=XXXX"
    );
    expect(next.testLink).toBe(
      "https://spadecommunity.com/?pid=SFS363&uid=XXXX"
    );
  });
});

describe("redirect URLs", () => {
  it("keeps the redirect path and parameters on the client origin", () => {
    const url = buildPrefillRedirectUrl("/redirect/complete", "SFS363");
    expect(url).toBe(
      "https://spadecommunity.com/redirect/complete?pid=SFS363&uid=identifier"
    );
    expect(url).not.toContain("localhost:5173");
    expect(url).not.toContain("samplepolls.com");
    expect(url).not.toContain("admin.spadecommunity.com");
  });

  it("rewrites localhost redirect URLs without dropping path or params", () => {
    expect(
      withRedirectUrlPid(
        "http://localhost:5173/redirect/survey-closed?pid=XTQ523&uid=identifier",
        "SFS363",
        "/redirect/survey-closed"
      )
    ).toBe(
      "https://spadecommunity.com/redirect/survey-closed?pid=SFS363&uid=identifier"
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
      "https://spadecommunity.com/redirect/complete?pid=SFS363&uid=identifier"
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
  it("uses the admin origin with pid and uid placeholders", () => {
    expect(DEFAULT_SURVEY_LINK_PLACEHOLDER).toBe(
      "https://spadecommunity.com/?pid=XXX&uid=XXX"
    );
  });
});

describe("getSurveyLinkPlaceholderError", () => {
  it("does not treat the bare admin origin as a complete live link", () => {
    expect(getSurveyLinkPlaceholderError(ADMIN_SPADE_COMMUNITY_URL, "Live Link")).toBe(
      "Live Link must include both PID and a supported UID placeholder (XXX, XXXX, or identifier)."
    );
  });

  it("accepts XXX as a UID placeholder", () => {
    expect(
      getSurveyLinkPlaceholderError(
        "https://spadecommunity.com/?pid=XXX&uid=XXX",
        "Live Link"
      )
    ).toBe("");
  });
});
