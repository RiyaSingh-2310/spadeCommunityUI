import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, ExternalLink, Link2, Loader2, Pencil } from "lucide-react";
import DecimalInput from "../../../components/admin/DecimalInput";
import FormField from "../../../components/admin/FormField";
import NumericInput from "../../../components/admin/NumericInput";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import StatusToggle from "../../../components/admin/StatusToggle";
import TableCard from "../../../components/admin/TableCard";
import {
  getPartnerPanelSizes,
  getRecord as getPartnerRecord,
  mapPartnerToRow,
} from "../../../services/partners/partnersApi";
import { useModulePermission } from "../../permissions/useModulePermission";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import {
  DEFAULT_DECIMAL_PLACES,
  getDecimalPlacesError,
  sanitizeDecimal,
} from "../../shared/utils/numericInputUtils";
import { isFormValid, getOptionalUrlError } from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { mapPartnersToSelectOptions } from "../services/surveyApi";
import {
  createSupplierMapping,
  getSupplierMappingById,
  listSupplierMappings,
  mapSupplierMappingToForm,
  mapSupplierMappingToRow,
  updateSupplierMappingRecord,
  updateSupplierMappingStatus,
  updateSupplierMappingTestMode,
  appendIsTestToPartnerUrl,
  buildSupplierMappingApiPayload,
} from "../services/supplierMappingApi";
import { getProjectMultiLinkStats } from "../services/projectMultiUrlApi";
import { listProjectUrlsByProject } from "../services/projectUrlsApi";
import {
  formatProjectUrlOptionLabel,
  isProjectUrlEligibleForInvite,
} from "../utils/projectUrlEligibility";
import {
  normalizeProjectUrlStatus,
  PROJECT_URL_REDIRECT_FIELDS,
} from "../utils/projectUrlFormValidation";
import { dedupeSelectOptions } from "../utils/dedupeSelectOptions";
import {
  notePartnerUrlTabOpening,
  registerPartnerUrlWindow,
} from "../utils/partnerUrlTabSync";
import { jumpToSectionAfterRender } from "../../shared/utils/jumpToSection";
import {
  capQuotaToAvailable,
  getAvailablePartnerQuota,
  getPartnerQuotaFieldError,
  parsePartnerQuota,
  readProjectUrlSampleSize,
  sumAssignedPartnerQuota,
} from "../utils/partnerMappingQuota";
import {
  isDefaultPartnerRecord,
  mappingRowsIncludePartner,
  pickDefaultPartnerFromList,
  resolveDefaultPartnerQuota,
  resolvePartnerId,
} from "../utils/defaultPartnerMapping";
import PartnerMappingViewModal from "./PartnerMappingViewModal";
import CopyValueButton from "./CopyValueButton";
import {
  primaryBtnClass,
  secondaryBtnClass,
  SurveyDataTable,
} from "./surveyDetailsShared";

const PARTNER_MAPPING_LIST_SECTION_ID = "partner-mapping-list";
const ADD_PARTNER_SECTION_ID = "add-partner";
const PARTNER_MAPPING_CPI_MAX_LENGTH = 6;

const TABLE_COLUMNS = [
  "#",
  "Partner Code",
  "Partner Quota",
  "CPI",
  "Partner URL",
  "Status",
  "Is Test?",
  "Action",
];

const REDIRECT_FIELDS = [
  {
    key: "complete",
    label: "Complete",
    example: PROJECT_URL_REDIRECT_FIELDS[0].example,
  },
  {
    key: "terminate",
    label: "Terminate",
    example: PROJECT_URL_REDIRECT_FIELDS[1].example,
  },
  {
    key: "overQuota",
    label: "Quota",
    example: PROJECT_URL_REDIRECT_FIELDS[2].example,
  },
  {
    key: "qualityTerm",
    label: "Quality Term",
    example: PROJECT_URL_REDIRECT_FIELDS[3].example,
  },
  {
    key: "surveyClose",
    label: "Survey Closed",
    example: PROJECT_URL_REDIRECT_FIELDS[4].example,
  },
];

const REDIRECT_FIELD_KEYS = REDIRECT_FIELDS.map((field) => field.key);

function createEmptyPartnerForm() {
  return {
    mappingId: "",
    partnerId: "",
    partnerCode: "",
    partnerRedirectUrl: "",
    quota: "",
    cpi: "",
    linksToAssign: "",
    statusActive: true,
    isTest: false,
    redirects: {
      complete: "",
      terminate: "",
      overQuota: "",
      qualityTerm: "",
      surveyClose: "",
      postbackUrl: "",
    },
  };
}

function normalizeRedirectUrlValue(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "—" || text === "-") return "";
  return text;
}

function pickFirstRedirectUrl(source, keys) {
  if (!source || typeof source !== "object") return "";
  for (const key of keys) {
    const text = normalizeRedirectUrlValue(source[key]);
    if (text) return text;
  }
  return "";
}

/** Empty redirect fields — never seeded from Project URL, Grid, or Speed Community defaults. */
function emptyPartnerRedirects() {
  return {
    complete: "",
    terminate: "",
    overQuota: "",
    qualityTerm: "",
    surveyClose: "",
    postbackUrl: "",
  };
}

/**
 * Build redirect URLs from the selected Partner API/detail payload only.
 * Missing values stay blank; no project or community fallbacks.
 */
function redirectsFromPartnerRecord(partner, mappedRow = null) {
  const sources = [mappedRow, partner].filter(Boolean);

  const pick = (keys) => {
    for (const source of sources) {
      const text = pickFirstRedirectUrl(source, keys);
      if (text) return text;
    }
    return "";
  };

  return {
    complete: pick([
      "completeUrl",
      "complete_val",
      "complete",
      "CompleteURL",
      "complete_url",
    ]),
    terminate: pick([
      "terminateUrl",
      "terminate_val",
      "terminate",
      "TerminateURL",
      "terminate_url",
    ]),
    overQuota: pick([
      "overQuotaUrl",
      "over_quota_val",
      "over_quota",
      "overQuota",
      "OverQuotaURL",
      "over_quota_url",
    ]),
    qualityTerm: pick([
      "qualityTermsUrl",
      "quality_term_val",
      "quality_term",
      "qualityTerm",
      "QualityTermURL",
      "quality_term_url",
    ]),
    surveyClose: pick([
      "surveyCloseUrl",
      "survey_close_val",
      "survey_close",
      "surveyClose",
      "SurveyCloseURL",
      "survey_close_url",
    ]),
    postbackUrl: pick([
      "postbackUrl",
      "postback_url",
      "VenderURL",
      "vendor_url",
      "apiBaseUrl",
      "api_base_url",
    ]),
  };
}

function MappingStat({ label, value, emphasize = false, align = "left" }) {
  return (
    <div className={align === "right" ? "sm:text-right" : undefined}>
      <p className="admin-text-muted text-xs font-medium tracking-[0.02em]">
        {label}
      </p>
      <p
        className={`mt-1 font-semibold ${
          emphasize ? "text-[var(--admin-danger-text)]" : "admin-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function sanitizePartnerMappingCpi(raw) {
  return sanitizeDecimal(raw, DEFAULT_DECIMAL_PLACES).slice(
    0,
    PARTNER_MAPPING_CPI_MAX_LENGTH
  );
}

function getPartnerMappingCpiError(value) {
  const decimalError = getDecimalPlacesError(value, "CPI", {
    required: true,
    maxDecimals: DEFAULT_DECIMAL_PLACES,
  });
  if (decimalError) return decimalError;

  const trimmed = String(value ?? "").trim();
  if (trimmed.length > PARTNER_MAPPING_CPI_MAX_LENGTH) {
    return `CPI must be at most ${PARTNER_MAPPING_CPI_MAX_LENGTH} characters`;
  }

  return "";
}

function PartnerMappingTab({
  projectId,
  projectCode = "",
  projectLinkType = "",
  isDarkMode,
  readOnly = false,
  restrictToPartnerId = "",
}) {
  const { canWrite } = useModulePermission("survey");
  const scopedPartnerId = String(restrictToPartnerId ?? "").trim();
  const allowWrite = canWrite && !readOnly && !scopedPartnerId;
  const inputClass = getAdminInputClass();

  const [projectUrls, setProjectUrls] = useState([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(true);
  /** Explicit selection only — never auto-pick the first URL. */
  const [selectedProjectUrlId, setSelectedProjectUrlId] = useState("");
  const [rows, setRows] = useState([]);
  const [multiLinkStats, setMultiLinkStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [form, setForm] = useState(createEmptyPartnerForm);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partnerOptionsSource, setPartnerOptionsSource] = useState([]);
  const [viewTarget, setViewTarget] = useState(null);
  const [togglingRowId, setTogglingRowId] = useState("");
  const scrollToMappingIdRef = useRef("");
  const mappingTableRef = useRef(null);
  const pendingJumpToFormRef = useRef(false);
  const pendingJumpToMappingRef = useRef(false);
  const statsRequestIdRef = useRef(0);
  const ensuringDefaultPartnerRef = useRef(false);
  const ensuredDefaultPartnerKeysRef = useRef(new Set());

  const selectedProjectUrl = useMemo(
    () =>
      projectUrls.find(
        (url) => String(url.id) === String(selectedProjectUrlId)
      ) ?? null,
    [projectUrls, selectedProjectUrlId]
  );

  const resolvedProjectUrlId = String(
    selectedProjectUrl?.id ?? selectedProjectUrlId ?? ""
  ).trim();
  const selectedUrlEligible = selectedProjectUrl
    ? isProjectUrlEligibleForInvite(selectedProjectUrl.status)
    : false;
  const isMultiLink = String(
    selectedProjectUrl?.projectLinkType ?? projectLinkType ?? ""
  )
    .toLowerCase()
    .includes("multi");
  const sampleSize = readProjectUrlSampleSize(selectedProjectUrl);
  const assignedQuota = useMemo(() => sumAssignedPartnerQuota(rows), [rows]);
  const editingQuota = useMemo(() => {
    if (formMode !== "edit" || !form.mappingId) return 0;
    const currentRow = rows.find(
      (row) => String(row.id) === String(form.mappingId)
    );
    return parsePartnerQuota(currentRow?.quota);
  }, [formMode, form.mappingId, rows]);
  const availableQuota = getAvailablePartnerQuota({
    sampleSize,
    assignedQuota,
    excludedQuota: editingQuota,
  });

  const openPartnerUrl = useCallback(({ partnerUrl, isTest = false }) => {
    const rawPartnerUrl = String(partnerUrl ?? "").trim();
    if (!rawPartnerUrl) {
      toastApiError({ message: "Partner URL is not available for this mapping." });
      return;
    }

    const destinationUrl = appendIsTestToPartnerUrl(rawPartnerUrl, isTest);
    setViewTarget(null);

    notePartnerUrlTabOpening(destinationUrl);
    const partnerTab = window.open(destinationUrl, "_blank", "noopener,noreferrer");
    registerPartnerUrlWindow(partnerTab);
  }, []);

  const loadProjectUrls = useCallback(async () => {
    if (!projectId) {
      setProjectUrls([]);
      setIsLoadingUrls(false);
      return [];
    }

    setIsLoadingUrls(true);
    try {
      const response = await listProjectUrlsByProject(projectId);
      const next = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setProjectUrls(next);
      return next;
    } catch (error) {
      toastApiError(error);
      setProjectUrls([]);
      return [];
    } finally {
      setIsLoadingUrls(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectUrls();
  }, [loadProjectUrls]);

  useEffect(() => {
    if (!selectedProjectUrlId) return;
    const stillExists = projectUrls.some(
      (url) => String(url.id) === String(selectedProjectUrlId)
    );
    if (!stillExists) {
      setSelectedProjectUrlId("");
    }
  }, [projectUrls, selectedProjectUrlId]);

  const loadMultiLinkStats = useCallback(async () => {
    const requestId = statsRequestIdRef.current + 1;
    statsRequestIdRef.current = requestId;

    if (!projectId || !resolvedProjectUrlId) {
      setMultiLinkStats(null);
      setIsLoadingStats(false);
      return null;
    }

    setIsLoadingStats(true);
    setMultiLinkStats(null);
    try {
      const stats = await getProjectMultiLinkStats(
        projectId,
        resolvedProjectUrlId
      );
      if (statsRequestIdRef.current !== requestId) return stats;
      setMultiLinkStats(stats);
      return stats;
    } catch (error) {
      if (statsRequestIdRef.current !== requestId) return null;
      toastApiError(error);
      setMultiLinkStats(null);
      return null;
    } finally {
      if (statsRequestIdRef.current === requestId) {
        setIsLoadingStats(false);
      }
    }
  }, [projectId, resolvedProjectUrlId]);

  /**
   * When mappings are empty and the backend flags a default partner, create a
   * mapping at full project-URL sample size. Never hard-codes a partner ID.
   */
  const ensureDefaultPartnerMapping = useCallback(
    async ({ existingRows, projectUrlSampleSize }) => {
      if (!allowWrite || !projectId || !resolvedProjectUrlId) return false;
      if (!selectedUrlEligible) return false;
      if (Array.isArray(existingRows) && existingRows.length > 0) return false;

      const quota = resolveDefaultPartnerQuota(projectUrlSampleSize);
      if (!quota) return false;

      const ensureKey = `${projectId}:${resolvedProjectUrlId}`;
      if (
        ensuringDefaultPartnerRef.current ||
        ensuredDefaultPartnerKeysRef.current.has(ensureKey)
      ) {
        return false;
      }

      ensuringDefaultPartnerRef.current = true;
      try {
        const partners = await getPartnerPanelSizes();
        const defaultPartner = pickDefaultPartnerFromList(partners);
        if (!defaultPartner || !isDefaultPartnerRecord(defaultPartner)) {
          return false;
        }

        const partnerId = resolvePartnerId(defaultPartner);
        if (!partnerId) return false;
        if (mappingRowsIncludePartner(existingRows, partnerId)) return false;

        let detail = defaultPartner;
        let mapped = mapPartnerToRow(defaultPartner);
        try {
          detail = await getPartnerRecord(partnerId);
          mapped = mapPartnerToRow(detail);
        } catch {
          // Fall back to panel-size list fields when detail fetch fails.
        }

        const redirects = redirectsFromPartnerRecord(detail, mapped);
        const payload = buildSupplierMappingApiPayload({
          partnerId,
          projectId,
          projectUrlId: resolvedProjectUrlId,
          quota,
          cpi: "0",
          redirects,
          statusActive: true,
          isTest: false,
        });

        if (
          payload.partnerid == null ||
          payload.projectid == null ||
          payload.projectUrlId == null ||
          payload.quota == null
        ) {
          return false;
        }

        await createSupplierMapping(payload);
        ensuredDefaultPartnerKeysRef.current.add(ensureKey);
        return true;
      } catch (error) {
        toastApiError(error);
        return false;
      } finally {
        ensuringDefaultPartnerRef.current = false;
      }
    },
    [allowWrite, projectId, resolvedProjectUrlId, selectedUrlEligible]
  );

  const loadMappings = useCallback(async () => {
    if (!projectId || (!readOnly && !resolvedProjectUrlId)) {
      setRows([]);
      setMultiLinkStats(null);
      setIsLoadingStats(false);
      return;
    }

    setIsLoading(true);
    setMultiLinkStats(null);
    try {
      const records = await listSupplierMappings({
        projectId,
        projectUrlId: resolvedProjectUrlId || undefined,
        partnerId: scopedPartnerId,
      });
      if (!readOnly) {
        await loadMultiLinkStats();
      }
      let nextRows = Array.isArray(records)
        ? records
            .map((record, index) => mapSupplierMappingToRow(record, index))
            .filter((row) => {
              if (!scopedPartnerId) return true;
              if (!row.partnerId) return true;
              return String(row.partnerId) === String(scopedPartnerId);
            })
        : [];

      nextRows = nextRows.map((row) => ({
        ...row,
        isDefault:
          Boolean(row.isDefault) || isDefaultPartnerRecord(row.record),
      }));

      const createdDefault = await ensureDefaultPartnerMapping({
        existingRows: nextRows,
        projectUrlSampleSize: readProjectUrlSampleSize(
          projectUrls.find(
            (url) => String(url.id) === String(resolvedProjectUrlId)
          ) ?? selectedProjectUrl
        ),
      });

      if (createdDefault) {
        const refreshed = await listSupplierMappings({
          projectId,
          projectUrlId: resolvedProjectUrlId || undefined,
          partnerId: scopedPartnerId,
        });
        nextRows = Array.isArray(refreshed)
          ? refreshed
              .map((record, index) => mapSupplierMappingToRow(record, index))
              .filter((row) => {
                if (!scopedPartnerId) return true;
                if (!row.partnerId) return true;
                return String(row.partnerId) === String(scopedPartnerId);
              })
              .map((row) => ({
                ...row,
                isDefault:
                  Boolean(row.isDefault) || isDefaultPartnerRecord(row.record),
              }))
          : nextRows;
        if (!readOnly) {
          await loadMultiLinkStats();
        }
      }

      setRows(nextRows);
    } catch (error) {
      toastApiError(error);
      setRows([]);
      setMultiLinkStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    projectId,
    resolvedProjectUrlId,
    loadMultiLinkStats,
    scopedPartnerId,
    readOnly,
    ensureDefaultPartnerMapping,
    projectUrls,
    selectedProjectUrl,
  ]);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  // Jump to the mapping section as soon as a Project URL is selected.
  useEffect(() => {
    if (!resolvedProjectUrlId || !pendingJumpToMappingRef.current) return;
    pendingJumpToMappingRef.current = false;
    jumpToSectionAfterRender(PARTNER_MAPPING_LIST_SECTION_ID, {
      behavior: "auto",
      block: "start",
      delayMs: 0,
    });
  }, [resolvedProjectUrlId]);

  // Scroll to newly added mapping / list after the table has re-rendered.
  useEffect(() => {
    const targetId = scrollToMappingIdRef.current;
    if (!targetId || isLoading) return;

    jumpToSectionAfterRender(
      () => {
        if (scrollToMappingIdRef.current !== targetId) return null;
        scrollToMappingIdRef.current = "";

        if (targetId !== "__latest__") {
          const rowEl = document.querySelector(
            `[data-partner-mapping-id="${CSS.escape(targetId)}"]`
          );
          if (rowEl) return rowEl;
        }

        const listEl = document.getElementById(PARTNER_MAPPING_LIST_SECTION_ID);
        if (listEl) {
          const rowsEls = listEl.querySelectorAll("[data-partner-mapping-id]");
          if (rowsEls.length) return rowsEls[rowsEls.length - 1];
          return listEl;
        }
        return mappingTableRef.current;
      },
      { behavior: "auto", block: "start", delayMs: 0 }
    );
  }, [rows, isLoading]);

  const projectUrlOptions = useMemo(
    () =>
      dedupeSelectOptions(
        projectUrls
          .filter((url) => isProjectUrlEligibleForInvite(url.status))
          .map((url) => ({
            value: String(url.id),
            label: formatProjectUrlOptionLabel(url, {
              includeLinkType: true,
              includeStatus: false,
            }),
          }))
          .filter((option) => option.value && option.value !== "undefined")
      ),
    [projectUrls]
  );

  const assignedPartnerIds = useMemo(
    () =>
      new Set(
        rows.map((row) => String(row.partnerId ?? "").trim()).filter(Boolean)
      ),
    [rows]
  );

  const loadPartnerOptions = useCallback(async () => {
    try {
      const items = await getPartnerPanelSizes();
      const partners = Array.isArray(items) ? items : [];
      setPartnerOptionsSource(
        partners.map((partner) => ({
          partner_id: partner.id,
          code: partner.code,
          name: partner.name,
          panel_size: partner.panel_size,
          is_default: partner.is_default,
          partner_type: partner.partner_type,
        }))
      );
      return partners;
    } catch (error) {
      toastApiError(error);
      setPartnerOptionsSource([]);
      return [];
    }
  }, []);

  const partnerOptions = useMemo(() => {
    const options = mapPartnersToSelectOptions(partnerOptionsSource);
    if (formMode === "edit" && form.partnerId) {
      const exists = options.some((option) => option.value === form.partnerId);
      if (!exists) {
        const label = [
          form.partnerCode,
          rows.find((r) => r.partnerId === form.partnerId)?.partnerName,
        ]
          .filter(Boolean)
          .join(" — ");
        return [
          { value: form.partnerId, label: label || form.partnerCode },
          ...options,
        ];
      }
    }
    return options;
  }, [partnerOptionsSource, formMode, form.partnerId, form.partnerCode, rows]);

  const addPartnerOptions = useMemo(
    () =>
      partnerOptions.filter(
        (option) => !assignedPartnerIds.has(String(option.value))
      ),
    [partnerOptions, assignedPartnerIds]
  );

  const editPartnerOptions = useMemo(
    () =>
      partnerOptions.filter(
        (option) =>
          String(option.value) === String(form.partnerId) ||
          !assignedPartnerIds.has(String(option.value))
      ),
    [partnerOptions, assignedPartnerIds, form.partnerId]
  );

  const tableColumns = useMemo(() => {
    const columns = [...TABLE_COLUMNS];
    if (isMultiLink) {
      const cpiIndex = columns.indexOf("CPI");
      if (cpiIndex >= 0) {
        columns.splice(cpiIndex + 1, 0, "Links Assigned");
      }
    }
    return columns;
  }, [isMultiLink]);

  const errors = useMemo(() => {
    const next = {};
    if (!resolvedProjectUrlId) {
      next.projectUrlId = "Project URL is required";
    } else if (!selectedUrlEligible) {
      next.projectUrlId =
        "Selected Project URL is not eligible for a new mapping";
    }
    if (!form.partnerId) next.partnerId = "Partner is required";
    next.quota = getPartnerQuotaFieldError(form.quota, {
      sampleSize,
      availableQuota,
    });
    {
      const cpiError = getPartnerMappingCpiError(form.cpi);
      if (cpiError) next.cpi = cpiError;
    }

    REDIRECT_FIELDS.forEach((field) => {
      next[field.key] = getOptionalUrlError(
        form.redirects?.[field.key] ?? "",
        field.label
      );
    });

    return next;
  }, [form, resolvedProjectUrlId, selectedUrlEligible, sampleSize, availableQuota]);

  const validationFields = useMemo(
    () => ["projectUrlId", "partnerId", "quota", "cpi", ...REDIRECT_FIELD_KEYS],
    []
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: validationFields,
  });

  const resetForm = () => {
    setForm(createEmptyPartnerForm());
    setFormMode("add");
    setShowForm(false);
    setIsFormLoading(false);
  };

  const openAddForm = async () => {
    if (!allowWrite || !resolvedProjectUrlId || !selectedUrlEligible) return;
    if (!multiLinkStats?.addPartner) return;
    pendingJumpToFormRef.current = true;
    setShowForm(true);
    setFormMode("add");
    setForm({
      ...createEmptyPartnerForm(),
      redirects: emptyPartnerRedirects(),
    });
    setIsFormLoading(true);
    await loadPartnerOptions();
    setIsFormLoading(false);
  };

  // After Add/Edit Partner form is rendered, jump to the form section.
  useEffect(() => {
    if (!showForm || isFormLoading || !pendingJumpToFormRef.current) return;
    pendingJumpToFormRef.current = false;
    jumpToSectionAfterRender(ADD_PARTNER_SECTION_ID, {
      behavior: "auto",
      block: "start",
      delayMs: 0,
    });
  }, [showForm, isFormLoading, formMode]);

  const openEditForm = async (row) => {
    if (!row?.id) return;

    pendingJumpToFormRef.current = true;
    setShowForm(true);
    setFormMode("edit");
    setIsFormLoading(true);

    try {
      await loadPartnerOptions();
      const listRecord = row.record ?? row;
      let record = listRecord;
      try {
        const fetched = await getSupplierMappingById(row.id);
        const fetchedRecord = Array.isArray(fetched) ? fetched[0] : fetched;
        if (fetchedRecord && typeof fetchedRecord === "object") {
          record = { ...listRecord, ...fetchedRecord };
        }
      } catch {
        // Use the list row when the mapping detail request is unavailable.
      }
      const mapped = mapSupplierMappingToForm(record);
      if (!mapped) {
        throw new Error("Partner mapping not found.");
      }
      setForm({
        ...mapped,
        partnerRedirectUrl: String(
          row.partnerUrl ?? mapped.partnerRedirectUrl ?? ""
        ).trim(),
        redirects: {
          ...emptyPartnerRedirects(),
          ...(mapped.redirects ?? {}),
        },
      });
    } catch (error) {
      toastApiError(error);
      resetForm();
    } finally {
      setIsFormLoading(false);
    }
  };

  const handlePartnerChange = async (partnerId) => {
    const partner = partnerOptionsSource.find(
      (item) => String(item.partner_id ?? item.id) === String(partnerId)
    );
    const panelSize = partner?.panel_size ?? partner?.panelSize;
    const emptyRedirects = emptyPartnerRedirects();

    setForm((prev) => ({
      ...prev,
      partnerId: String(partnerId),
      partnerCode: String(partner?.code ?? "").trim(),
      partnerRedirectUrl: "",
      quota:
        panelSize != null && String(panelSize).trim() !== ""
          ? capQuotaToAvailable(panelSize, availableQuota)
          : prev.quota,
      redirects: { ...emptyRedirects },
    }));
    touch("partnerId");
    touch("quota");

    const normalizedId = String(partnerId ?? "").trim();
    if (!normalizedId) return;

    try {
      const detail = await getPartnerRecord(normalizedId);
      const mapped = mapPartnerToRow(detail);
      const partnerRedirects = redirectsFromPartnerRecord(detail, mapped);

      setForm((prev) => ({
        ...prev,
        partnerCode: String(mapped.partnerCode || prev.partnerCode || "").trim(),
        partnerRedirectUrl: "",
        redirects: {
          ...emptyPartnerRedirects(),
          ...partnerRedirects,
        },
        quota:
          mapped.panelSize && mapped.panelSize !== "—"
            ? capQuotaToAvailable(mapped.panelSize, availableQuota)
            : prev.quota,
      }));
    } catch {
      // Keep empty redirect fields when partner detail is unavailable.
    }
  };

  const buildPayloadFromForm = () =>
    buildSupplierMappingApiPayload({
      partnerId: form.partnerId,
      projectId,
      projectUrlId: resolvedProjectUrlId,
      quota: form.quota,
      cpi: form.cpi,
      linksToAssign: isMultiLink ? form.linksToAssign : undefined,
      redirects: form.redirects,
      statusActive: form.statusActive,
      isTest: form.isTest,
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!allowWrite || !resolvedProjectUrlId || !selectedUrlEligible) return;
    if (!validateSubmit() || !isFormValid(errors)) return;
    if (sampleSize == null || availableQuota == null) return;
    if (formMode !== "edit" && availableQuota <= 0) return;

    const payload = buildPayloadFromForm();
    if (
      payload.partnerid == null ||
      payload.projectid == null ||
      payload.projectUrlId == null
    ) {
      toastApiError({
        message: "partnerid, projectid and projectUrlId are required!",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const wasCreate = formMode !== "edit" || !form.mappingId;
      const data =
        formMode === "edit" && form.mappingId
          ? await updateSupplierMappingRecord(form.mappingId, payload)
          : await createSupplierMapping(payload);

      const createdId = String(
        data?.data?.id ?? data?.id ?? data?.data?.mapping_id ?? ""
      ).trim();

      toastApiSuccess(
        data,
        wasCreate ? "Partner added successfully." : "Partner updated successfully."
      );
      resetForm();
      await loadMappings();
      await loadProjectUrls();

      if (wasCreate) {
        // Notify first, then jump to the rendered Partner Mapping list/row.
        scrollToMappingIdRef.current = createdId || "__latest__";
      }
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowToggle = async (row, field) => {
    if (!allowWrite || togglingRowId || !row?.id) return;

    const nextStatusActive =
      field === "status" ? !row.statusActive : row.statusActive;
    const nextIsTest = field === "isTest" ? !row.isTest : row.isTest;
    const rowId = String(row.id);

    setTogglingRowId(rowId);
    setRows((prev) =>
      prev.map((item) =>
        String(item.id) === rowId
          ? {
              ...item,
              statusActive: nextStatusActive,
              isTest: nextIsTest,
            }
          : item
      )
    );

    try {
      if (field === "status") {
        const data = await updateSupplierMappingStatus(rowId, nextStatusActive);
        toastApiSuccess(data, "Partner status updated successfully.");
        await loadMappings();
        return;
      }

      const data = await updateSupplierMappingTestMode(rowId, nextIsTest);
      toastApiSuccess(data, "Partner test mode updated successfully.");
      await loadMappings();
    } catch (error) {
      toastApiError(error);
      await loadMappings();
    } finally {
      setTogglingRowId("");
    }
  };

  const renderCell = (row, col) => {
    if (col === "#") return row.sno;
    if (col === "Partner URL") {
      const url = String(row.partnerUrl ?? "").trim();
      if (!url) return "—";
      return (
        <div className="flex max-w-[260px] min-w-0 items-center gap-1 overflow-hidden">
          <button
            type="button"
            onClick={() =>
              openPartnerUrl({
                partnerUrl: url,
                isTest: row.isTest,
              })
            }
            className="admin-text inline-flex min-w-0 flex-1 items-center gap-1 truncate text-left text-sm font-medium text-[var(--admin-success-text)] hover:underline"
            title={url}
          >
            <ExternalLink size={14} className="shrink-0" aria-hidden />
            <span className="truncate">{url}</span>
          </button>
          <CopyValueButton
            value={url}
            successMessage="Partner URL copied"
            label="Copy Partner URL"
            size="inline"
          />
        </div>
      );
    }
    if (col === "Status") {
      const rowId = String(row.id);
      return (
        <StatusToggle
          checked={row.statusActive}
          readOnly={!allowWrite || togglingRowId === rowId}
          compact
          onChange={() => handleRowToggle(row, "status")}
        />
      );
    }
    if (col === "Is Test?") {
      const rowId = String(row.id);
      return (
        <StatusToggle
          checked={row.isTest}
          labelOn="Test"
          labelOff="Live"
          readOnly={!allowWrite || togglingRowId === rowId}
          compact
          onChange={() => handleRowToggle(row, "isTest")}
        />
      );
    }
    if (col === "Action") {
      return (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() =>
              setViewTarget({
                mappingId: row.id,
                partnerName: row.partnerName,
              })
            }
            className="admin-icon-btn admin-text-subtle inline-flex h-8 w-8 items-center justify-center rounded-lg"
            aria-label={`View ${row.partnerName}`}
            title="View"
          >
            <Eye size={16} />
          </button>
          {allowWrite ? (
            <button
              type="button"
              onClick={() => openEditForm(row)}
              className="admin-icon-btn admin-text-subtle inline-flex h-8 w-8 items-center justify-center rounded-lg"
              aria-label={`Edit ${row.partnerName}`}
              title="Edit"
            >
              <Pencil size={16} />
            </button>
          ) : null}
        </div>
      );
    }

    const map = {
      "Partner Code": row.partnerCode,
      "Partner Quota": row.quota,
      CPI: row.cpi,
      "Links Assigned": row.linksToAssign ?? "—",
    };
    return map[col] ?? "—";
  };

  const canSubmit =
    isFormValid(errors) && !isSubmitting && !isFormLoading && selectedUrlEligible;
  const showAddPartner =
    allowWrite &&
    resolvedProjectUrlId &&
    selectedUrlEligible &&
    !isLoadingStats &&
    Boolean(multiLinkStats?.addPartner);

  if (isLoadingUrls) {
    return (
      <div className="admin-text flex min-h-[200px] items-center justify-center gap-2 text-sm">
        <Loader2 size={18} className="animate-spin" />
        Loading project URLs...
      </div>
    );
  }

  if (projectUrls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-header-search-bg)] px-6 py-14 text-center sm:px-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input-bg)] admin-text-subtle">
          <Link2 size={22} strokeWidth={1.75} aria-hidden />
        </div>
        <h3 className="admin-text text-base font-semibold tracking-tight">
          Partner Mapping unavailable
        </h3>
        <p className="admin-text-muted mt-2 max-w-md text-sm leading-relaxed">
          Save a Project URL first to enable Partner Mapping for this project.
        </p>
      </div>
    );
  }

  return (
    <>
      <TableCard title="Project URL Selection" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Project ID">
            <input
              className={inputClass}
              value={projectId || "—"}
              readOnly
              disabled
            />
          </FormField>
          <FormField label="Project Code">
            <div className="flex items-stretch gap-2">
              <input
                className={`${inputClass} min-w-0 flex-1`}
                value={projectCode || "—"}
                readOnly
                disabled
                aria-label="Project Code"
              />
              <CopyValueButton
                value={projectCode}
                successMessage="Project Code copied"
                label="Copy Project Code"
              />
            </div>
          </FormField>
          <FormField
            label="Project URL"
            required
            error={showError("projectUrlId") ? errors.projectUrlId : ""}
            hint="Select an eligible Project URL."
          >
            <SearchableSelect
              inputClass={inputClass}
              value={selectedProjectUrlId}
              onChange={(value) => {
                const nextId = String(value ?? "").trim();
                setSelectedProjectUrlId(nextId);
                resetForm();
                touch("projectUrlId");
                pendingJumpToMappingRef.current = Boolean(nextId);
              }}
              options={projectUrlOptions}
              placeholder="Select Project URL"
              searchPlaceholder="Search Project URL..."
              aria-label="Project URL"
            />
          </FormField>
          {selectedProjectUrl ? (
            <>
              <FormField label="Project URL ID">
                <input
                  className={inputClass}
                  value={selectedProjectUrl.id || "—"}
                  readOnly
                  disabled
                />
              </FormField>
              <FormField label="Project URL Code">
                <div className="flex items-stretch gap-2">
                  <input
                    className={`${inputClass} min-w-0 flex-1`}
                    value={selectedProjectUrl.projectUrlCode || "—"}
                    readOnly
                    disabled
                    aria-label="Project URL Code"
                  />
                  <CopyValueButton
                    value={selectedProjectUrl.projectUrlCode}
                    successMessage="Project URL Code copied"
                    label="Copy Project URL Code"
                  />
                </div>
              </FormField>
              <FormField label="URL Status">
                <input
                  className={inputClass}
                  value={normalizeProjectUrlStatus(selectedProjectUrl.status)}
                  readOnly
                  disabled
                />
              </FormField>
            </>
          ) : null}
        </div>
      </TableCard>

      {!resolvedProjectUrlId ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--admin-border)] px-6 py-10 text-center">
          <p className="admin-text-muted text-sm">
            Select a Project URL above to view and manage partner mappings.
          </p>
        </div>
      ) : (
        <div
          id={PARTNER_MAPPING_LIST_SECTION_ID}
          className="mt-6"
          ref={mappingTableRef}
        >
          {isLoading ? (
            <div className="admin-text flex min-h-[200px] items-center justify-center gap-2 text-sm">
              <Loader2 size={18} className="animate-spin" />
              Loading partner mappings...
            </div>
          ) : (
            <SurveyDataTable
              title="Partner Mapping"
              columns={tableColumns}
              rows={rows}
              renderCell={renderCell}
              isDarkMode={isDarkMode}
              emptyMessage="No partner mappings for this Project URL yet."
              headerAction={
                showAddPartner ? (
                  <button
                    type="button"
                    onClick={openAddForm}
                    className="h-10 cursor-pointer rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,169,80,0.28)] transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
                  >
                    + Add Partner
                  </button>
                ) : null
              }
              footer={
                isLoadingStats ? (
                  <div className="admin-text flex items-center gap-2 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Loading project URL stats...
                  </div>
                ) : !multiLinkStats ? (
                  <p className="admin-text-muted text-sm">
                    Unable to load Project URL stats.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 text-sm">
                    <MappingStat
                      label="Sample Size"
                      value={multiLinkStats.sampleSize}
                    />
                    <MappingStat
                      label="Quota Added"
                      value={multiLinkStats.quotasAdded}
                    />
                    <MappingStat
                      label="Remaining Quota"
                      value={multiLinkStats.remainingQuota}
                      emphasize={Number(multiLinkStats.remainingQuota) <= 0}
                    />
                    <MappingStat
                      label="Remaining Multi Links"
                      value={multiLinkStats.remainingMultiLinks}
                      emphasize
                    />
                    <MappingStat
                      label="Completed Surveys"
                      value={multiLinkStats.completedSurveyCount}
                      // align="right"
                    />
                  </div>
                )
              }
            />
          )}
        </div>
      )}

      {showForm ? (
        <form
          id={ADD_PARTNER_SECTION_ID}
          onSubmit={handleSubmit}
          className="mt-6 space-y-0"
          noValidate
        >
          <TableCard
            title={formMode === "edit" ? "Edit Partner" : "Add Partner"}
            isDarkMode={isDarkMode}
          >
            {isFormLoading ? (
              <div className="admin-text flex items-center gap-2 py-8 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Loading partner details...
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    label="Partner"
                    required
                    error={showError("partnerId") ? errors.partnerId : ""}
                  >
                    <SearchableSelect
                      inputClass={inputClass}
                      value={form.partnerId}
                      onChange={handlePartnerChange}
                      options={
                        formMode === "add" ? addPartnerOptions : editPartnerOptions
                      }
                      placeholder="Select partner"
                      searchPlaceholder="Search partner..."
                      disabled={isSubmitting}
                      aria-label="Partner"
                    />
                  </FormField>
                  <FormField
                    label="Partner Quota"
                    required
                    error={
                      showError("quota") || sampleSize == null
                        ? errors.quota
                        : ""
                    }
                  >
                    <NumericInput
                      className={inputClass}
                      value={form.quota}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, quota: value }))
                      }
                      onBlur={() => touch("quota")}
                      disabled={isSubmitting}
                      aria-invalid={Boolean(
                        (showError("quota") || sampleSize == null) && errors.quota
                      )}
                    />
                  </FormField>
                  <FormField
                    label="CPI"
                    required
                    error={showError("cpi") ? errors.cpi : ""}
                  >
                    <DecimalInput
                      className={inputClass}
                      value={form.cpi}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          cpi: sanitizePartnerMappingCpi(value),
                        }))
                      }
                      onBlur={() => touch("cpi")}
                      decimalPlaces={DEFAULT_DECIMAL_PLACES}
                      maxLength={PARTNER_MAPPING_CPI_MAX_LENGTH}
                      disabled={isSubmitting}
                      aria-invalid={Boolean(showError("cpi") && errors.cpi)}
                    />
                  </FormField>
                </div>

                <div>
                  <h3 className="admin-text mb-3 text-sm font-bold">
                    Redirect Links
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {REDIRECT_FIELDS.map((field) => (
                      <FormField
                        key={field.key}
                        label={field.label}
                        hint={`Example: ${field.example}`}
                        error={showError(field.key) ? errors[field.key] : ""}
                      >
                        <div className="flex items-stretch gap-2">
                          <input
                            className={`${inputClass} min-w-0 flex-1`}
                            value={form.redirects?.[field.key] ?? ""}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                redirects: {
                                  ...(prev.redirects ?? emptyPartnerRedirects()),
                                  [field.key]: event.target.value,
                                },
                              }))
                            }
                            onBlur={() => touch(field.key)}
                            placeholder={field.example}
                            disabled={isSubmitting}
                            aria-label={field.label}
                            aria-invalid={Boolean(
                              showError(field.key) && errors[field.key]
                            )}
                          />
                          <CopyValueButton
                            value={form.redirects?.[field.key] ?? ""}
                            successMessage={`${field.label} URL copied`}
                            label={`Copy ${field.label} URL`}
                          />
                        </div>
                      </FormField>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`${primaryBtnClass} flex min-w-[120px] items-center justify-center gap-2`}
                  >
                    {isSubmitting && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {isSubmitting
                      ? "Saving..."
                      : formMode === "edit"
                        ? "Update Partner"
                        : "Save Partner"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    className={secondaryBtnClass}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </TableCard>
        </form>
      ) : null}

      <PartnerMappingViewModal
        isOpen={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        mappingId={viewTarget?.mappingId}
        partnerName={viewTarget?.partnerName}
        isMultiLink={isMultiLink}
        projectId={projectId}
        projectCode={projectCode}
        projectUrlId={selectedProjectUrl?.id}
        projectUrlCode={selectedProjectUrl?.projectUrlCode}
        onPartnerUrlClick={openPartnerUrl}
      />
    </>
  );
}

export default PartnerMappingTab;
