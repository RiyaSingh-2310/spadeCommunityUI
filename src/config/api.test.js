import { describe, expect, it } from "vitest";
import { API_DEBUG, API_ROUTES, buildApiUrl, resolveApiBaseUrl } from "./api";

describe("resolveApiBaseUrl", () => {
  it("uses the configured development URL, including localhost", () => {
    expect(
      resolveApiBaseUrl({
        configuredUrl: "http://localhost:5050",
        isProduction: false,
      })
    ).toBe("http://localhost:5050");
  });

  it("uses the configured production URL", () => {
    expect(
      resolveApiBaseUrl({
        configuredUrl: "https://backhand-spade-community.onrender.com/api",
        isProduction: true,
      })
    ).toBe("https://backhand-spade-community.onrender.com/api");
  });

  it("throws when the environment variable is missing", () => {
    expect(() =>
      resolveApiBaseUrl({ configuredUrl: "", isProduction: true })
    ).toThrow(/VITE_API_BASE_URL is required/);
  });

  it("never allows localhost in production", () => {
    expect(() =>
      resolveApiBaseUrl({
        configuredUrl: "http://localhost:5050",
        isProduction: true,
      })
    ).toThrow(/must not point to localhost/);
  });

  it("never falls back to localhost when the URL is missing", () => {
    expect(() =>
      resolveApiBaseUrl({ configuredUrl: "   ", isProduction: false })
    ).toThrow(/VITE_API_BASE_URL is required/);
  });
});

describe("buildApiUrl", () => {
  it("joins /api routes onto an /api base without duplicating the prefix", () => {
    const url = buildApiUrl(API_ROUTES.projects.list);
    expect(url).toMatch(/\/projects\/list$/);
    expect(url).not.toContain("/api/api/");
  });

  it("builds email-templates routes for System Emails", () => {
    expect(API_ROUTES.systemEmails.list).toBe("/api/email-templates/list");
    expect(API_ROUTES.emailTemplates.list).toBe("/api/email-templates/list");
    expect(API_ROUTES.systemEmails.byId(3)).toBe("/api/email-templates/3");
    expect(API_ROUTES.emailTemplates.create).toBe("/api/email-templates/add");
    expect(API_ROUTES.emailTemplates.update(9)).toBe("/api/email-templates/9");
    expect(API_ROUTES.emailTemplates.delete(9)).toBe("/api/email-templates/9");
  });

  it("keeps the invoice PDF contract on GET /api/invoice/:id/pdf", () => {
    expect(API_ROUTES.invoice.downloadPdf("INV-1")).toBe("/api/invoice/INV-1/pdf");
  });

  it("uses the pre-screen response and report contracts", () => {
    expect(API_ROUTES.survey.prescreenResponse).toBe("/api/survey/prescreenResponse");
    expect(API_ROUTES.survey.prescreenResponseEnd).toBe("/api/survey/prescreenResponseEnd");
    expect(API_ROUTES.projectReports.preScreenReport).toBe(
      "/api/project-reports/pre-screen-report"
    );
    expect(API_ROUTES.projectReports.preScreenReportExportCsv).toBe(
      "/api/project-reports/pre-screen-report/export/csv"
    );
  });
});

describe("API_DEBUG", () => {
  it("is disabled outside development mode", () => {
    expect(API_DEBUG === true || API_DEBUG === false).toBe(true);
    if (import.meta.env.PROD) {
      expect(API_DEBUG).toBe(false);
    }
  });
});
