import { describe, expect, it } from "vitest";
import { API_ROUTES } from "./api";

describe("CRUD API contracts", () => {
  it("users", () => {
    expect(API_ROUTES.admin.all).toBe("/api/admin/all");
    expect(API_ROUTES.admin.create).toBe("/api/admin/add-user");
    expect(API_ROUTES.admin.update(1)).toBe("/api/admin/updateadmin/1");
    expect(API_ROUTES.admin.delete(1)).toBe("/api/admin/delete/1");
  });

  it("clients", () => {
    expect(API_ROUTES.clients.list).toBe("/api/clients/all");
    expect(API_ROUTES.clients.create).toBe("/api/clients/add");
    expect(API_ROUTES.clients.update(2)).toBe("/api/clients/update/2");
    expect(API_ROUTES.clients.delete(2)).toBe("/api/clients/delete/2");
  });

  it("partners", () => {
    expect(API_ROUTES.partners.list).toBe("/api/partner/list");
    expect(API_ROUTES.partners.create).toBe("/api/partner/add");
    expect(API_ROUTES.partners.update(3)).toBe("/api/partner/3");
    expect(API_ROUTES.partners.delete(3)).toBe("/api/partner/3");
  });

  it("project managers", () => {
    expect(API_ROUTES.projectManagers.list).toBe("/api/projectmanager/list");
    expect(API_ROUTES.projectManagers.create).toBe("/api/projectmanager/add");
    expect(API_ROUTES.projectManagers.update(4)).toBe("/api/projectmanager/4");
    expect(API_ROUTES.projectManagers.delete(4)).toBe("/api/projectmanager/4");
  });

  it("projects", () => {
    expect(API_ROUTES.projects.list).toBe("/api/projects/list");
    expect(API_ROUTES.projects.create).toBe("/api/projects/add");
    expect(API_ROUTES.projects.byId(5)).toBe("/api/projects/5");
    expect(API_ROUTES.projects.update(5)).toBe("/api/projects/5");
    expect(API_ROUTES.projects.delete(5)).toBe("/api/projects/5");
  });

  it("project URLs", () => {
    expect(API_ROUTES.projects.urlList(6)).toBe("/api/projects/6/url/list");
    expect(API_ROUTES.projects.createUrl(6)).toBe("/api/projects/6/url");
    expect(API_ROUTES.projects.updateUrl(7)).toBe("/api/projects/url/7");
    expect(API_ROUTES.projects.deleteUrl(7)).toBe("/api/projects/url/7");
  });

  it("surveys", () => {
    expect(API_ROUTES.survey.list).toBe("/api/survey/list");
    expect(API_ROUTES.survey.create).toBe("/api/survey/add");
    expect(API_ROUTES.survey.byId(8)).toBe("/api/survey/8");
    expect(API_ROUTES.survey.delete(8)).toBe("/api/survey/8");
  });

  it("system emails", () => {
    expect(API_ROUTES.emailTemplates.list).toBe("/api/email-templates/list");
    expect(API_ROUTES.emailTemplates.create).toBe("/api/email-templates/add");
    expect(API_ROUTES.emailTemplates.byId(9)).toBe("/api/email-templates/9");
    expect(API_ROUTES.emailTemplates.update(9)).toBe("/api/email-templates/9");
    expect(API_ROUTES.emailTemplates.delete(9)).toBe("/api/email-templates/9");
  });

  it("community users", () => {
    expect(API_ROUTES.panelist.list).toBe("/api/panelist/list");
    expect(API_ROUTES.panelist.byId(10)).toBe("/api/panelist/10");
    expect(API_ROUTES.rewardHistory.list).toBe("/api/reward-history/list");
  });

  it("user screening", () => {
    expect(API_ROUTES.screening.list).toBe("/api/panel-questionnaire/list");
    expect(API_ROUTES.screening.create).toBe("/api/panel-questionnaire/add");
    expect(API_ROUTES.screening.update(11)).toBe("/api/panel-questionnaire/11");
    expect(API_ROUTES.screening.delete(11)).toBe("/api/panel-questionnaire/11");
  });
});
