/**
 * Temporary in-memory project mock store.
 * Replace with real API calls in surveyApi.js when endpoints are ready.
 */

const MOCK_DELAY_MS = 280;

export const MOCK_SURVEY_CLIENTS = [
  { id: 1, code: "CL-1001", name: "Alpha Corp International" },
  { id: 2, code: "CL-1002", name: "Beta Labs" },
  { id: 3, code: "CL-1003", name: "Gamma Tech" },
  { id: 4, code: "CL-1004", name: "Delta Works" },
  { id: 5, code: "CL-1005", name: "Epsilon Ltd" },
];

export const MOCK_SURVEY_PARTNERS = [
  { partner_id: 101, code: "P1028", name: "Social Media" },
  { partner_id: 102, code: "P1032", name: "Amreendra" },
  { partner_id: 103, code: "P1041", name: "Pulse Insights" },
  { partner_id: 104, code: "P1055", name: "Nordic Sample" },
];

const LIVE_BASE = "https://speed-community.com/survey/live";
const TEST_BASE = "https://speed-community.com/survey/test";

const RFQ_SEED = [
  { id: "PRJ-011", name: "PRJ-011" },
  { id: "PRJ-012", name: "PRJ-012" },
  { id: "PRJ-013", name: "PRJ-013" },
  { id: "PRJ-014", name: "PRJ-014" },
  { id: "PRJ-015", name: "PRJ-015" },
];

function buildRedirects(numId) {
  return {
    complete_url: `${LIVE_BASE}/redirect/complete?id=${numId}`,
    terminate_url: `${LIVE_BASE}/redirect/terminate?id=${numId}`,
    over_quota_url: `${LIVE_BASE}/redirect/over-quota?id=${numId}`,
    quality_term_url: `${LIVE_BASE}/redirect/quality-term?id=${numId}`,
    survey_close_url: `${LIVE_BASE}/redirect/survey-close?id=${numId}`,
  };
}

function createSeedSurvey(index) {
  const id = index + 1;
  const client = MOCK_SURVEY_CLIENTS[index % MOCK_SURVEY_CLIENTS.length];
  const partner = MOCK_SURVEY_PARTNERS[index % MOCK_SURVEY_PARTNERS.length];
  const rfq = RFQ_SEED[index % RFQ_SEED.length];
  const statuses = ["active", "active", "inactive", "active"];
  const projects = [
    "Brand Tracker Q2 2026",
    "CX Pulse Study",
    "Healthcare Awareness Wave",
    "Mobile Banking Habits",
    "Retail Shopper Journey",
    "Automotive Consideration Study",
    "Food & Beverage Preferences",
    "Travel Intent Survey",
  ];

  return {
    id,
    Project_code: `PRJ-${10000 + id}`,
    survey_id: `PRJ-${10000 + id}`,
    Project_Name: projects[index % projects.length],
    project_name: projects[index % projects.length],
    client_id: client.id,
    client_code: client.code,
    Clients: client.name,
    client_name: client.name,
    project_manager_id: 1 + (index % 5),
    Project_Manager: ["Priya Desai", "Arun Kumar", "Meera Shah", "Rohan Verma", "Anita Patel"][
      index % 5
    ],
    project_manager_name: ["Priya Desai", "Arun Kumar", "Meera Shah", "Rohan Verma", "Anita Patel"][
      index % 5
    ],
    sales_manager_id: 1 + (index % 4),
    Sales_Manager: ["Arun Kumar", "Sneha Rao", "Vikram Singh", "Kavya Nair"][index % 4],
    sales_manager_name: ["Arun Kumar", "Sneha Rao", "Vikram Singh", "Kavya Nair"][index % 4],
    rfq_id: rfq.id,
    RFQ: rfq.name,
    sales_project_id: rfq.id,
    sales_project_name: rfq.name,
    Project_Description: `Dummy description for ${projects[index % projects.length]}.`,
    description: `Dummy description for ${projects[index % projects.length]}.`,
    Project_Link_Type: index % 2 === 0 ? "Single Link" : "Multi Link",
    link_type: index % 2 === 0 ? "single" : "multi",
    Notes: "Mock project note — APIs pending. Use this record for UI testing.",
    notes: "Mock project note — APIs pending. Use this record for UI testing.",
    Status: statuses[index % statuses.length],
    status: statuses[index % statuses.length],
    // Legacy URL fields kept for Project URLs mock seeding / group flows
    loi: 10 + (index % 6) * 2,
    ir: 25 + (index % 5) * 5,
    sample_size: 500 + index * 100,
    currency: ["USD", "INR", "EUR", "GBP"][index % 4],
    cpi: Number((1.5 + (index % 5) * 0.35).toFixed(2)),
    start_date: `2026-0${1 + (index % 6)}-01`,
    end_date: `2026-0${2 + (index % 6)}-28`,
    live_url: `${LIVE_BASE}/${id}`,
    test_url: `${TEST_BASE}/${id}`,
    geo_location: index % 2 === 0,
    url_protection: true,
    unique_ip: index % 3 === 0,
    prescreen: index % 2 !== 0,
    ...buildRedirects(id),
    partner_ids: [partner.partner_id],
    partner_names: partner.name,
    partner_allocations: { [String(partner.partner_id)]: String(200 + index * 25) },
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-03-10T12:00:00.000Z",
    deleted_at: null,
    action_by: "Admin User",
  };
}

/** Mutable mock store (session lifetime). */
let mockSurveys = Array.from({ length: 12 }, (_, index) => createSeedSurvey(index));
let nextSurveyId = mockSurveys.length + 1;

export function delay(ms = MOCK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function listMockSurveys() {
  return mockSurveys.map((survey) => ({ ...survey }));
}

export function getMockSurveyById(id) {
  const target = String(id ?? "").trim();
  if (!target) return null;
  const found = mockSurveys.find(
    (survey) =>
      String(survey.id) === target ||
      String(survey.survey_id) === target ||
      String(survey.Project_code) === target
  );
  return found ? { ...found } : null;
}

/**
 * @param {string} projectCode
 * @param {string|number} [excludeId]
 */
export function isProjectCodeTaken(projectCode, excludeId) {
  const code = String(projectCode ?? "")
    .trim()
    .toLowerCase();
  if (!code) return false;
  const exclude = excludeId != null ? String(excludeId).trim() : "";

  return mockSurveys.some((survey) => {
    const surveyId = String(survey.id);
    const surveyCode = String(survey.survey_id ?? "");
    if (exclude && (surveyId === exclude || surveyCode === exclude)) {
      return false;
    }
    const existing = String(survey.Project_code ?? survey.survey_id ?? "")
      .trim()
      .toLowerCase();
    return existing === code;
  });
}

export function filterMockSurveys({ page = 1, limit = 10, search = "", groupProjectId } = {}) {
  void groupProjectId;
  const query = String(search ?? "")
    .trim()
    .toLowerCase();

  let rows = listMockSurveys();
  if (query) {
    rows = rows.filter((survey) => {
      const haystack = [
        survey.survey_id,
        survey.Project_code,
        survey.project_name,
        survey.Project_Name,
        survey.client_code,
        survey.client_name,
        survey.Clients,
        survey.project_manager_name,
        survey.status,
        survey.Status,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  const total = rows.length;
  const safeLimit = Number(limit) || 10;
  const safePage = Math.max(1, Number(page) || 1);
  const start = (safePage - 1) * safeLimit;
  const data = rows.slice(start, start + safeLimit);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit) || 1);

  return { data, total, page: safePage, limit: safeLimit, totalPages };
}

export function createMockSurvey(payload = {}) {
  const id = nextSurveyId;
  nextSurveyId += 1;
  const client =
    MOCK_SURVEY_CLIENTS.find((item) => String(item.id) === String(payload.client_id)) ??
    MOCK_SURVEY_CLIENTS[0];
  const projectCode = payload.Project_code || payload.project_code || `PRJ-${10000 + id}`;
  const projectName = payload.Project_Name || payload.project_name || `New Mock Project ${id}`;
  const status = String(payload.Status ?? payload.status ?? "active").toLowerCase();

  const record = {
    ...createSeedSurvey(id - 1),
    id,
    Project_code: projectCode,
    survey_id: projectCode,
    Project_Name: projectName,
    project_name: projectName,
    client_id: client.id,
    client_code: client.code,
    Clients: payload.Clients || client.name,
    client_name: payload.Clients || client.name,
    project_manager_id: payload.project_manager_id ?? 1,
    Project_Manager: payload.Project_Manager ?? "Priya Desai",
    project_manager_name: payload.Project_Manager ?? "Priya Desai",
    sales_manager_id: payload.sales_manager_id ?? 1,
    Sales_Manager: payload.Sales_Manager ?? "Arun Kumar",
    sales_manager_name: payload.Sales_Manager ?? "Arun Kumar",
    rfq_id: payload.rfq_id ?? payload.sales_project_id ?? "",
    RFQ: payload.RFQ ?? payload.sales_project_name ?? "",
    sales_project_id: payload.rfq_id ?? payload.sales_project_id ?? "",
    sales_project_name: payload.RFQ ?? payload.sales_project_name ?? "",
    Project_Description: payload.Project_Description ?? payload.description ?? "",
    description: payload.Project_Description ?? payload.description ?? "",
    Project_Link_Type: payload.Project_Link_Type ?? "Single Link",
    link_type:
      payload.Project_Link_Type === "Multi Link" || payload.link_type === "multi"
        ? "multi"
        : "single",
    Notes: payload.Notes ?? payload.notes ?? "",
    notes: payload.Notes ?? payload.notes ?? "",
    Status: status === "inactive" ? "inactive" : "active",
    status: status === "inactive" ? "inactive" : "active",
    ...buildRedirects(id),
  };

  mockSurveys = [record, ...mockSurveys];
  return { ...record };
}

export function updateMockSurvey(id, patch = {}) {
  const target = String(id ?? "").trim();
  const index = mockSurveys.findIndex(
    (survey) =>
      String(survey.id) === target ||
      String(survey.survey_id) === target ||
      String(survey.Project_code) === target
  );
  if (index < 0) return null;

  const current = mockSurveys[index];
  const next = {
    ...current,
    ...patch,
    id: current.id,
    updated_at: new Date().toISOString(),
  };

  if (patch.Project_code || patch.project_code) {
    const code = patch.Project_code || patch.project_code;
    next.Project_code = code;
    next.survey_id = code;
  }

  if (patch.Project_Name || patch.project_name) {
    const name = patch.Project_Name || patch.project_name;
    next.Project_Name = name;
    next.project_name = name;
  }

  if (patch.Project_Description != null || patch.description != null) {
    const description = patch.Project_Description ?? patch.description;
    next.Project_Description = description;
    next.description = description;
  }

  if (patch.Notes != null || patch.notes != null) {
    const notes = patch.Notes ?? patch.notes;
    next.Notes = notes;
    next.notes = notes;
  }

  if (patch.Status != null || patch.status != null) {
    const status = String(patch.Status ?? patch.status).toLowerCase();
    next.Status = status === "inactive" ? "inactive" : "active";
    next.status = next.Status;
  }

  if (patch.RFQ != null || patch.rfq_id != null) {
    next.RFQ = patch.RFQ ?? next.RFQ;
    next.rfq_id = patch.rfq_id ?? next.rfq_id;
    next.sales_project_name = next.RFQ;
    next.sales_project_id = next.rfq_id;
  }

  if (patch.client_id != null) {
    const client = MOCK_SURVEY_CLIENTS.find((item) => String(item.id) === String(patch.client_id));
    if (client) {
      next.client_id = client.id;
      next.client_code = client.code;
      next.client_name = patch.Clients || client.name;
      next.Clients = patch.Clients || client.name;
    }
  }

  mockSurveys[index] = next;
  return { ...next };
}

export function deleteMockSurvey(id) {
  const target = String(id ?? "").trim();
  const before = mockSurveys.length;
  mockSurveys = mockSurveys.filter(
    (survey) =>
      String(survey.id) !== target &&
      String(survey.survey_id) !== target &&
      String(survey.Project_code) !== target
  );
  return mockSurveys.length < before;
}

export function cloneMockSurvey(id) {
  const source = getMockSurveyById(id);
  if (!source) return null;

  return createMockSurvey({
    ...source,
    Project_Name: `${source.Project_Name || source.project_name} (Clone)`,
    Project_code: `${source.Project_code || source.survey_id}-CLONE`,
    Status: "active",
  });
}
