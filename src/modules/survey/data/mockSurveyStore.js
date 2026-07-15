/**
 * Temporary in-memory survey/project mock store.
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
  const statuses = ["active", "active", "inactive", "active"];
  const countries = [
    "United States",
    "India",
    "United Kingdom",
    "Germany",
    "Japan",
    "Canada",
  ];
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
    survey_id: `SRV-${10000 + id}`,
    project_name: projects[index % projects.length],
    client_id: client.id,
    client_code: client.code,
    client_name: client.name,
    project_manager_id: 1 + (index % 5),
    project_manager_name: ["Priya Desai", "Arun Kumar", "Meera Shah", "Rohan Verma", "Anita Patel"][
      index % 5
    ],
    project_country: countries[index % countries.length],
    description: `Dummy description for ${projects[index % projects.length]}.`,
    sales_manager_id: 1 + (index % 4),
    sales_manager_name: ["Arun Kumar", "Sneha Rao", "Vikram Singh", "Kavya Nair"][index % 4],
    sales_project_id: 14 + index,
    sales_project_name: `SP-2026-${String(14 + index).padStart(3, "0")}`,
    loi: 10 + (index % 6) * 2,
    ir: 25 + (index % 5) * 5,
    sample_size: 500 + index * 100,
    currency: ["USD", "INR", "EUR", "GBP"][index % 4],
    cpi: Number((1.5 + (index % 5) * 0.35).toFixed(2)),
    start_date: `2026-0${1 + (index % 6)}-01`,
    end_date: `2026-0${2 + (index % 6)}-28`,
    link_type: index % 2 === 0 ? "single" : "multi",
    live_url: `${LIVE_BASE}/${id}`,
    test_url: `${TEST_BASE}/${id}`,
    geo_location: index % 2 === 0,
    url_protection: true,
    unique_ip: index % 3 === 0,
    prescreen: index % 2 !== 0,
    ...buildRedirects(id),
    comp_point: String(40 + index * 5),
    term_point: String(5 + (index % 3)),
    notes: "Mock survey note — APIs pending. Use this record for UI testing.",
    status: statuses[index % statuses.length],
    partner_ids: [partner.partner_id],
    partner_names: partner.name,
    partner_allocations: { [String(partner.partner_id)]: String(200 + index * 25) },
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-03-10T12:00:00.000Z",
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
    (survey) => String(survey.id) === target || String(survey.survey_id) === target
  );
  return found ? { ...found } : null;
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
        survey.project_name,
        survey.client_code,
        survey.client_name,
        survey.project_manager_name,
        survey.status,
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

  const record = {
    ...createSeedSurvey(id - 1),
    id,
    survey_id: `SRV-${10000 + id}`,
    project_name: payload.project_name ?? `New Mock Project ${id}`,
    client_id: client.id,
    client_code: client.code,
    client_name: client.name,
    project_manager_id: payload.project_manager_id ?? 1,
    project_manager_name: payload.project_manager_name ?? "Priya Desai",
    project_country: payload.project_country ?? "United States",
    description: payload.description ?? "",
    loi: payload.loi ?? 15,
    ir: payload.ir ?? 35,
    sample_size: payload.sample_size ?? 500,
    currency: payload.currency ?? "USD",
    cpi: payload.cpi ?? 2.5,
    start_date: payload.start_date ?? "2026-04-01",
    end_date: payload.end_date ?? "2026-05-31",
    link_type: payload.link_type ?? "single",
    live_url: payload.live_url ?? `${LIVE_BASE}/${id}`,
    test_url: payload.test_url ?? `${TEST_BASE}/${id}`,
    term_point: payload.term_point ?? "5",
    comp_point: payload.comp_point ?? "50",
    notes: payload.notes ?? "",
    status: payload.status ?? "active",
    ...buildRedirects(id),
  };

  mockSurveys = [record, ...mockSurveys];
  return { ...record };
}

export function updateMockSurvey(id, patch = {}) {
  const target = String(id ?? "").trim();
  const index = mockSurveys.findIndex(
    (survey) => String(survey.id) === target || String(survey.survey_id) === target
  );
  if (index < 0) return null;

  const current = mockSurveys[index];
  const next = {
    ...current,
    ...patch,
    id: current.id,
    survey_id: current.survey_id,
    updated_at: new Date().toISOString(),
  };

  if (patch.client_id != null) {
    const client = MOCK_SURVEY_CLIENTS.find((item) => String(item.id) === String(patch.client_id));
    if (client) {
      next.client_id = client.id;
      next.client_code = client.code;
      next.client_name = client.name;
    }
  }

  mockSurveys[index] = next;
  return { ...next };
}

export function deleteMockSurvey(id) {
  const target = String(id ?? "").trim();
  const before = mockSurveys.length;
  mockSurveys = mockSurveys.filter(
    (survey) => String(survey.id) !== target && String(survey.survey_id) !== target
  );
  return mockSurveys.length < before;
}

export function cloneMockSurvey(id) {
  const source = getMockSurveyById(id);
  if (!source) return null;

  return createMockSurvey({
    ...source,
    project_name: `${source.project_name} (Clone)`,
    status: "active",
  });
}
