/**
 * Project listing Info popup — read-only Project URL / survey summary.
 * Uses existing project, Project URL, partner-mapping, and multi-link-stats APIs.
 */
import { formatAppDateValue, parseUtcToIst } from "../../shared/utils/dateTime";
import { formatStatusLabel } from "../../shared/utils/statusLabels";
import { getRecord, mapSurveyToProjectDetails } from "./surveyApi";
import {
  listProjectUrlsByProject,
  mapApiUrlInfoToForm,
  normalizeProjectLinkType,
  resolveProjectUrlRecordId,
} from "./projectUrlsApi";
import { getProjectMultiLinkStats } from "./projectMultiUrlApi";
import { listSupplierMappings } from "./supplierMappingApi";
import { parsePartnerQuota } from "../utils/partnerMappingQuota";

const COMPLETED_KEYS = [
  "completed",
  "Completed",
  "completed_count",
  "completedCount",
  "complete_count",
  "CompleteCount",
  "completed_survey_count",
  "completedSurveyCount",
  "completedSurveys",
  "completes",
  "Completes",
];

const TERMINATED_KEYS = [
  "terminated",
  "Terminated",
  "terminated_count",
  "terminatedCount",
  "terminate_count",
  "TerminateCount",
  "terminate",
  "Terminate",
  "terminations",
];

const QUOTA_ADDED_KEYS = [
  "quotasAdded",
  "quotaAdded",
  "quotas_added",
  "quota_added",
  "samplesAdded",
  "sample_added",
  "sampleAdded",
];

const REMAINING_QUOTA_KEYS = [
  "remainingQuota",
  "remaining_quota",
  "remainingSample",
  "remaining_sample",
];

function pickField(source, keys) {
  if (!source || typeof source !== "object") return undefined;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function displayText(value) {
  const text = String(value ?? "").trim();
  return text && text !== "—" && text !== "-" ? text : "";
}

function toOptionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function hasNumericStat(source, keys) {
  return toOptionalNumber(pickField(source, keys)) != null;
}

function uniqueJoin(values, separator = ", ") {
  const seen = new Set();
  const parts = [];
  for (const value of values) {
    const text = displayText(value);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(text);
  }
  return parts.length ? parts.join(separator) : "";
}

function formatDisplayValue(value) {
  const text = displayText(value);
  return text || "—";
}

function formatOptionalCount(value) {
  if (value == null) return "—";
  const num = Number(value);
  return Number.isFinite(num) ? String(num) : "—";
}

function sumOptional(values) {
  const nums = values
    .map((value) => toOptionalNumber(value))
    .filter((value) => value != null);
  if (!nums.length) return null;
  return nums.reduce((sum, value) => sum + value, 0);
}

function pickEarliestDate(values) {
  const moments = values.map((value) => parseUtcToIst(value)).filter(Boolean);
  if (!moments.length) return "";
  return moments
    .reduce((earliest, current) =>
      current.isBefore(earliest) ? current : earliest
    )
    .toISOString();
}

function pickLatestDate(values) {
  const moments = values.map((value) => parseUtcToIst(value)).filter(Boolean);
  if (!moments.length) return "";
  return moments
    .reduce((latest, current) => (current.isAfter(latest) ? current : latest))
    .toISOString();
}

function mappingProjectUrlId(record) {
  return String(
    pickField(record, [
      "projectUrlId",
      "project_url_id",
      "projecturlid",
      "ProjectUrlId",
    ]) ?? ""
  ).trim();
}

function buildQuotaByUrlId(mappings) {
  const quotaByUrlId = new Map();
  if (!Array.isArray(mappings)) return quotaByUrlId;

  for (const mapping of mappings) {
    const urlId = mappingProjectUrlId(mapping);
    if (!urlId) continue;
    const next =
      (quotaByUrlId.get(urlId) ?? 0) +
      parsePartnerQuota(pickField(mapping, ["quota", "Quota"]));
    quotaByUrlId.set(urlId, next);
  }
  return quotaByUrlId;
}

function resolveUrlCount(form, raw, stats) {
  const isMultiLink =
    normalizeProjectLinkType(form?.projectLinkType ?? raw?.Project_Link_Type) ===
    "Multi Link";
  if (!isMultiLink) return 1;

  const multiCount = toOptionalNumber(
    form?.multiLinkCount ??
      pickField(raw, [
        "multi_link_count",
        "multiLinkCount",
        "Multi_Link_Count",
        "multiple_url_count",
        "multipleUrlCount",
      ]) ??
      stats?.totalMultiLinks
  );
  return multiCount != null && multiCount > 0 ? multiCount : 1;
}

function mapUrlStatRow({ form, raw, stats, mappingQuota }) {
  const completed = toOptionalNumber(
    pickField(raw, COMPLETED_KEYS) ?? stats?.completedSurveyCount
  );
  const terminated = toOptionalNumber(pickField(raw, TERMINATED_KEYS));
  const sampleSize = toOptionalNumber(
    form?.sampleSize ??
      pickField(raw, ["SampleSize", "sample_size", "sampleSize"]) ??
      stats?.sampleSize
  );

  const quotaAdded = hasNumericStat(raw, QUOTA_ADDED_KEYS)
    ? toOptionalNumber(pickField(raw, QUOTA_ADDED_KEYS))
    : stats?.quotasAdded != null
      ? toOptionalNumber(stats.quotasAdded)
      : mappingQuota != null && mappingQuota > 0
        ? mappingQuota
        : null;

  let remainingQuota = hasNumericStat(raw, REMAINING_QUOTA_KEYS)
    ? toOptionalNumber(pickField(raw, REMAINING_QUOTA_KEYS))
    : stats?.remainingQuota != null
      ? toOptionalNumber(stats.remainingQuota)
      : null;
  if (remainingQuota == null && sampleSize != null && quotaAdded != null) {
    remainingQuota = Math.max(0, sampleSize - quotaAdded);
  }

  return {
    country: displayText(form?.country ?? pickField(raw, ["country", "Country"])),
    language: displayText(
      form?.language ?? pickField(raw, ["Language", "language"])
    ),
    cpi: displayText(
      pickField(form, ["cpiRate", "cpi"]) ??
        pickField(raw, ["CPI", "cpi", "cpiRate"])
    ),
    loi: displayText(
      form?.loi ?? pickField(raw, ["LOI(Minute)", "LOI", "loi"])
    ),
    projectLinkType: displayText(
      form?.projectLinkType ??
        pickField(raw, ["Project_Link_Type", "project_link_type", "projectLinkType"])
    )
      ? normalizeProjectLinkType(
          form?.projectLinkType ?? raw?.Project_Link_Type
        )
      : "",
    urlCount: resolveUrlCount(form, raw, stats),
    sampleSize,
    completed,
    terminated,
    remainingQuota,
    startDate:
      form?.startDate ||
      pickField(raw, ["Start_Date", "start_date", "Start Date", "startDate"]) ||
      "",
    endDate:
      form?.endDate ||
      pickField(raw, ["End_Date", "end_date", "End Date", "endDate"]) ||
      "",
    updatedDate:
      form?.updatedOn ||
      pickField(raw, ["updated_at", "updatedOn", "Updated_At", "updated_on"]) ||
      "",
  };
}

function needsMultiLinkStats(raw, form) {
  const isMultiLink =
    normalizeProjectLinkType(form?.projectLinkType ?? raw?.Project_Link_Type) ===
    "Multi Link";
  if (!isMultiLink) return false;
  return !(
    hasNumericStat(raw, COMPLETED_KEYS) &&
    hasNumericStat(raw, QUOTA_ADDED_KEYS) &&
    hasNumericStat(raw, REMAINING_QUOTA_KEYS)
  );
}

function buildInfoFields({ details, project, urlRows }) {
  const urlCount = urlRows.length
    ? urlRows.reduce((sum, row) => sum + (toOptionalNumber(row.urlCount) || 0), 0)
    : null;

  return {
    projectName: formatDisplayValue(details?.projectName),
    clientName: formatDisplayValue(details?.clientName),
    status: formatDisplayValue(
      formatStatusLabel(details?.projectStatus || details?.status)
    ),
    salesManager: formatDisplayValue(details?.salesManager),
    projectManagerName: formatDisplayValue(details?.projectManager),
    country: formatDisplayValue(
      uniqueJoin(urlRows.map((row) => row.country)) || details?.projectCountry
    ),
    language: formatDisplayValue(uniqueJoin(urlRows.map((row) => row.language))),
    cpi: formatDisplayValue(
      uniqueJoin(urlRows.map((row) => row.cpi), " / ") || details?.cpiUsd
    ),
    loi: formatDisplayValue(
      uniqueJoin(urlRows.map((row) => row.loi), " / ") || details?.loiMinutes
    ),
    projectLinkType: formatDisplayValue(
      uniqueJoin(urlRows.map((row) => row.projectLinkType)) ||
        details?.projectLinkType
    ),
    sampleSize: formatOptionalCount(
      sumOptional(urlRows.map((row) => row.sampleSize)) ??
        toOptionalNumber(details?.sampleSize)
    ),
    urlCount: formatOptionalCount(urlCount),
    completed: formatOptionalCount(sumOptional(urlRows.map((row) => row.completed))),
    terminated: formatOptionalCount(
      sumOptional(urlRows.map((row) => row.terminated))
    ),
    remainingQuota: formatOptionalCount(
      sumOptional(urlRows.map((row) => row.remainingQuota))
    ),
    startDate: formatAppDateValue(
      pickEarliestDate([
        ...urlRows.map((row) => row.startDate),
        pickField(project, ["Start_Date", "start_date", "startDate"]),
      ])
    ),
    endDate: formatAppDateValue(
      pickLatestDate([
        ...urlRows.map((row) => row.endDate),
        pickField(project, ["End_Date", "end_date", "endDate"]),
      ])
    ),
    updatedDate: formatAppDateValue(
      pickLatestDate([
        ...urlRows.map((row) => row.updatedDate),
        pickField(project, ["updated_at", "Updated_At", "updatedOn"]),
      ])
    ),
  };
}

/**
 * Loads a read-only Project URL Info summary for the listing popup.
 * @param {string|number} projectId
 */
export async function getProjectUrlInfoSummary(projectId) {
  const normalizedId = String(projectId ?? "").trim();
  const [project, urlList, mappings] = await Promise.all([
    getRecord(normalizedId),
    listProjectUrlsByProject(normalizedId).catch(() => ({ data: [], records: [] })),
    listSupplierMappings({ projectId: normalizedId }).catch(() => []),
  ]);

  const details = mapSurveyToProjectDetails(project);
  const projectUrlInfo = Array.isArray(details?.urlInfo) ? details.urlInfo : [];
  const mappedRows =
    Array.isArray(urlList?.data) && urlList.data.length
      ? urlList.data
      : projectUrlInfo.map((row) =>
          mapApiUrlInfoToForm(row, normalizedId, project)
        );
  const rawRows =
    Array.isArray(urlList?.records) && urlList.records.length
      ? urlList.records
      : projectUrlInfo;

  const rawById = new Map();
  rawRows.forEach((raw) => {
    const id = resolveProjectUrlRecordId(raw);
    if (id) rawById.set(id, raw);
  });

  const quotaByUrlId = buildQuotaByUrlId(mappings);
  const paired = mappedRows.map((form, index) => {
    const id = String(form?.id ?? "").trim();
    const raw = (id && rawById.get(id)) || rawRows[index] || form;
    return { form, raw, id };
  });

  const statsByUrlId = new Map();
  await Promise.all(
    paired.map(async ({ form, raw, id }) => {
      if (!id || !needsMultiLinkStats(raw, form)) return;
      try {
        const stats = await getProjectMultiLinkStats(normalizedId, id);
        statsByUrlId.set(id, stats);
      } catch {
        statsByUrlId.set(id, null);
      }
    })
  );

  const urlRows = paired.map(({ form, raw, id }) =>
    mapUrlStatRow({
      form,
      raw,
      stats: statsByUrlId.get(id) ?? null,
      mappingQuota: quotaByUrlId.get(id) ?? 0,
    })
  );

  return buildInfoFields({ details, project, urlRows });
}
