import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminDatePicker from "../../../components/admin/AdminDatePicker";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import DecimalInput from "../../../components/admin/DecimalInput";
import FormField from "../../../components/admin/FormField";
import FormRadioGroup from "../../../components/admin/FormRadioGroup";
import NumericInput from "../../../components/admin/NumericInput";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { useModulePermission } from "../../permissions/useModulePermission";
import { getAdminInputClass, getAdminTextareaClass } from "../../shared/utils/formStyles";
import { formatAppDateValue } from "../../shared/utils/dateTime";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import CopyValueButton from "./CopyValueButton";
import {
  countValidMultiLinkCsvFiles,
} from "../utils/multiLinkCsvCount";
import {
  createEmptyProjectUrlForm,
  createProjectUrl,
  deleteProjectUrl,
  generateProjectUrlCode,
  getProjectUrlFormForEdit,
  getSurveyGroupOptionsForLanguage,
  listProjectUrlsByProject,
  mapApiUrlInfoToForm,
  mapProjectUrlToForm,
  normalizeProjectLinkType,
  PROJECT_URL_COUNTRY_OPTIONS,
  PROJECT_URL_PRESCREEN_LANGUAGES,
  PROJECT_URL_STATUS_OPTIONS,
  updateProjectUrls,
} from "../services/projectUrlsApi";
import { PROJECT_LINK_TYPES } from "../data/surveyFormData";
import ProjectMultiUrlCsvUploadSection from "./ProjectMultiUrlCsvUploadSection";
import {
  areProjectUrlFormsEqual,
  cloneProjectUrlForm,
  getProjectUrlFormErrors,
  isProjectUrlFormValid,
  normalizeProjectUrlFormForState,
  PROJECT_URL_CPI_MAX_DECIMALS,
  PROJECT_URL_FORM_FIELDS,
  PROJECT_URL_NUMERIC_MAX_DIGITS,
  PROJECT_URL_REDIRECT_FIELDS,
  getDefaultProjectUrlRedirects,
  sanitizeProjectUrlDecimal,
  sanitizeProjectUrlInteger,
} from "../utils/projectUrlFormValidation";
import { PROJECT_URL_VIEW_IDS } from "../utils/surveyDetailsNavigation";
import { dedupeSelectOptions } from "../utils/dedupeSelectOptions";
import {
  SectionDivider,
  primaryBtnClass,
  secondaryBtnClass,
} from "./surveyDetailsShared";

const PROJECT_URL_LIST_COLUMNS = [
  "ID",
  "Project URL Code",
  "Description",
  "Country",
  "Language",
  "CPI",
  "LOI",
  "IR",
  "Start Date",
  "End Date",
  // "Updated Date",
  "Project Link Type",
  "Status",
  "Action",
];

function formatListMetric(value) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function formatListDate(value) {
  return formatAppDateValue(value);
}

function InteractiveCheckbox({ label, checked, onChange, disabled }) {
  return (
    <label
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        className="admin-checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="admin-text text-sm font-medium">{label}</span>
    </label>
  );
}

function normalizeUrlRecord(row, projectFk) {
  if (!row) return createEmptyProjectUrlForm(projectFk);
  if (row.Live_Link != null || row.description != null || row["LOI(Minute)"] != null) {
    return mapApiUrlInfoToForm(row, projectFk);
  }
  return mapProjectUrlToForm({
    ...createEmptyProjectUrlForm(projectFk),
    ...row,
    projectId: row.projectId ?? projectFk,
  });
}

function toListRow(record) {
  const id = record?.id != null && record.id !== "" ? String(record.id) : "";
  const projectUrlCode = formatListMetric(record?.projectUrlCode);
  const description = String(record?.discussion ?? "").trim() || "—";
  const country = String(record?.country ?? "").trim() || "—";
  const language = String(record?.language ?? "").trim() || "—";
  const status = String(record?.status ?? "").trim() || "Open";
  const cpiRate = formatListMetric(record?.cpiRate);
  const loi = formatListMetric(record?.loi);
  const ir = formatListMetric(record?.ir);
  const startDate = formatListDate(record?.startDate);
  const endDate = formatListDate(record?.endDate);
  const updatedDate = formatListDate(record?.updatedOn);
  const projectLinkType = normalizeProjectLinkType(record?.projectLinkType);

  return {
    id,
    projectUrlCode,
    description,
    country,
    language,
    cpiRate,
    loi,
    ir,
    startDate,
    endDate,
    updatedDate,
    projectLinkType,
    status,
    record,
  };
}

function trimOnBlur(value) {
  return String(value ?? "").trim();
}

function getListRouteFormState(projectFk) {
  return {
    selectedUrlId: "",
    form: createEmptyProjectUrlForm(projectFk),
    initialSnapshot: null,
    pendingDelete: null,
  };
}

function getAddRouteFormState(projectFk) {
  const nextForm = normalizeProjectUrlFormForState({
    ...createEmptyProjectUrlForm(projectFk),
    ...getDefaultProjectUrlRedirects(),
  });
  return {
    selectedUrlId: "",
    form: nextForm,
    initialSnapshot: cloneProjectUrlForm(nextForm),
    pendingDelete: null,
  };
}

function getRouteFormState(projectFk, urlView) {
  if (urlView === PROJECT_URL_VIEW_IDS.ADD) {
    return getAddRouteFormState(projectFk);
  }
  if (urlView === PROJECT_URL_VIEW_IDS.LIST) {
    return getListRouteFormState(projectFk);
  }
  return {
    selectedUrlId: "",
    form: createEmptyProjectUrlForm(projectFk),
    initialSnapshot: null,
    pendingDelete: null,
  };
}

function ProjectUrlsTab({
  surveyId,
  project,
  isDarkMode,
  onSaved,
  urlView = PROJECT_URL_VIEW_IDS.LIST,
  urlId = "",
  onViewChange,
}) {
  const { canWrite } = useModulePermission("survey");
  const inputClass = getAdminInputClass();
  const textareaClass = getAdminTextareaClass();
  const projectFk = project?.recordId ?? surveyId;
  const projectCode = project?.projectCode || project?.surveyId || "";

  const view =
    urlView === PROJECT_URL_VIEW_IDS.ADD || urlView === PROJECT_URL_VIEW_IDS.EDIT
      ? "form"
      : "list";

  const [urlRecords, setUrlRecords] = useState([]);
  const [form, setForm] = useState(
    () => getRouteFormState(projectFk, urlView).form
  );
  const [initialSnapshot, setInitialSnapshot] = useState(
    () => getRouteFormState(projectFk, urlView).initialSnapshot
  );
  const [selectedUrlId, setSelectedUrlId] = useState(
    () => getRouteFormState(projectFk, urlView).selectedUrlId
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preScreenerOptions, setPreScreenerOptions] = useState([]);
  const [isLoadingPreScreeners, setIsLoadingPreScreeners] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(
    () => getRouteFormState(projectFk, urlView).pendingDelete
  );
  const [multiUrlCsvFiles, setMultiUrlCsvFiles] = useState([]);
  const [csvLinkCount, setCsvLinkCount] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cloneTarget, setCloneTarget] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const [routeState, setRouteState] = useState({ projectFk, urlView });
  const [loadedEditKey, setLoadedEditKey] = useState("");
  const [editFormReady, setEditFormReady] = useState(false);
  const [isGeneratingUrlCode, setIsGeneratingUrlCode] = useState(false);
  const navigateToListRef = useRef(() => {});

  const selectedLinkType = normalizeProjectLinkType(form.projectLinkType);
  const isMultiLink = selectedLinkType === "Multi Link";
  const isEdit = urlView === PROJECT_URL_VIEW_IDS.EDIT;
  const isLoadingEditForm = isEdit && Boolean(urlId) && !editFormReady;

  const errors = useMemo(
    () =>
      getProjectUrlFormErrors(form, {
        isMultiLink,
        csvLinkCount: isMultiLink ? csvLinkCount : null,
      }),
    [form, isMultiLink, csvLinkCount]
  );
  const { showError, touch, validateSubmit, resetValidation, isValid } =
    useFormValidation({
      errors,
      fields: PROJECT_URL_FORM_FIELDS,
    });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const navigateToList = useCallback(() => {
    onViewChange?.({
      urlView: PROJECT_URL_VIEW_IDS.LIST,
      urlId: "",
    });
  }, [onViewChange]);

  useEffect(() => {
    navigateToListRef.current = navigateToList;
  }, [navigateToList]);

  if (routeState.projectFk !== projectFk || routeState.urlView !== urlView) {
    setRouteState({ projectFk, urlView });
    setMultiUrlCsvFiles([]);
    setCsvLinkCount(null);

    if (
      urlView === PROJECT_URL_VIEW_IDS.ADD ||
      urlView === PROJECT_URL_VIEW_IDS.LIST
    ) {
      const nextFormState = getRouteFormState(projectFk, urlView);
      setSelectedUrlId(nextFormState.selectedUrlId);
      setForm(nextFormState.form);
      setInitialSnapshot(nextFormState.initialSnapshot);
      setPendingDelete(nextFormState.pendingDelete);
      setLoadedEditKey("");
      setEditFormReady(false);
      setIsGeneratingUrlCode(false);
      resetValidation();
    } else {
      setLoadedEditKey("");
      setEditFormReady(false);
      setIsGeneratingUrlCode(false);
    }
  }

  useEffect(() => {
    if (!canWrite && urlView === PROJECT_URL_VIEW_IDS.ADD) {
      navigateToList();
    }
  }, [canWrite, urlView, navigateToList]);

  useEffect(() => {
    if (urlView !== PROJECT_URL_VIEW_IDS.ADD) {
      return undefined;
    }

    let cancelled = false;

    const loadGeneratedUrlCode = async () => {
      setIsGeneratingUrlCode(true);
      try {
        const code = await generateProjectUrlCode(projectFk);
        if (cancelled) return;
        setForm((prev) => ({ ...prev, projectUrlCode: code }));
        setInitialSnapshot((prev) =>
          prev ? { ...prev, projectUrlCode: code } : prev
        );
      } catch (error) {
        if (!cancelled) {
          toastApiError(error);
          setForm((prev) => ({ ...prev, projectUrlCode: "" }));
          setInitialSnapshot((prev) =>
            prev ? { ...prev, projectUrlCode: "" } : prev
          );
        }
      } finally {
        if (!cancelled) setIsGeneratingUrlCode(false);
      }
    };

    loadGeneratedUrlCode();
    return () => {
      cancelled = true;
    };
  }, [urlView, projectFk]);

  useEffect(() => {
    if (urlView !== PROJECT_URL_VIEW_IDS.EDIT) {
      return undefined;
    }
    if (!urlId) {
      navigateToListRef.current();
      return undefined;
    }

    const editKey = `${projectFk}:${urlId}`;
    if (loadedEditKey === editKey && editFormReady) {
      return undefined;
    }

    let cancelled = false;

    const loadEditForm = async () => {
      try {
        const cached = urlRecords.find(
          (item) => String(item.id) === String(urlId)
        );
        const nextForm = await getProjectUrlFormForEdit(projectFk, urlId, cached);
        if (cancelled) return;
        if (!nextForm) {
          navigateToListRef.current();
          return;
        }
        const normalized = normalizeProjectUrlFormForState(nextForm);
        const existingCode = String(normalized.projectUrlCode ?? "").trim();
        let formWithCode = normalized;

        if (!existingCode) {
          setIsGeneratingUrlCode(true);
          try {
            const code = await generateProjectUrlCode(projectFk);
            if (cancelled) return;
            formWithCode = { ...normalized, projectUrlCode: code };
          } catch (error) {
            if (!cancelled) toastApiError(error);
          } finally {
            if (!cancelled) setIsGeneratingUrlCode(false);
          }
        }

        if (cancelled) return;

        setSelectedUrlId(formWithCode.id ? String(formWithCode.id) : String(urlId));
        setForm(formWithCode);
        // If a code was just generated, keep the snapshot without it so Save stays enabled.
        setInitialSnapshot(
          cloneProjectUrlForm(
            !existingCode && formWithCode.projectUrlCode
              ? normalized
              : formWithCode
          )
        );
        setLoadedEditKey(editKey);
        setEditFormReady(true);
        resetValidation();
      } catch (error) {
        if (!cancelled) {
          toastApiError(error);
          navigateToListRef.current();
        }
      }
    };

    loadEditForm();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when edit target changes
  }, [urlView, urlId, projectFk]);

  const loadUrlRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listProjectUrlsByProject(projectFk);
      const rows = Array.isArray(response?.data) ? response.data : [];
      const mapped = rows
        .map((row) => normalizeUrlRecord(row, projectFk))
        .filter(
          (row) =>
            Boolean(row.id) ||
            Boolean(String(row.liveLink ?? "").trim()) ||
            Boolean(String(row.testLink ?? "").trim()) ||
            Boolean(String(row.discussion ?? "").trim()) ||
            Boolean(String(row.loi ?? "").trim()) ||
            Boolean(String(row.country ?? "").trim())
        );

      setUrlRecords(mapped);
      return mapped;
    } catch (error) {
      toastApiError(error);
      setUrlRecords([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [projectFk]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;
      await loadUrlRecords();
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [loadUrlRecords]);

  useEffect(() => {
    if (view !== "form" || isLoadingEditForm) return undefined;

    let cancelled = false;

    const loadPreScreeners = async () => {
      if (!form.language) {
        setPreScreenerOptions([]);
        return;
      }

      setIsLoadingPreScreeners(true);
      try {
        const response = await getSurveyGroupOptionsForLanguage(form.language);
        if (cancelled) return;
        const options = response?.data ?? [];
        setPreScreenerOptions(options);

        // Keep previously selected group on edit; only normalize when still present.
        setForm((prev) => {
          if (!prev.preScreenerId && !prev.surveyGroupId) return prev;
          const selectedId = String(prev.preScreenerId || prev.surveyGroupId);
          const stillValid = options.some(
            (option) => String(option.value) === selectedId
          );
          if (!stillValid) return prev;
          return {
            ...prev,
            preScreenerId: selectedId,
            surveyGroupId: selectedId,
            preScreenerName: String(
              options.find((option) => String(option.value) === selectedId)
                ?.label ?? prev.preScreenerName ?? ""
            ).trim(),
          };
        });
      } catch {
        if (!cancelled) setPreScreenerOptions([]);
      } finally {
        if (!cancelled) setIsLoadingPreScreeners(false);
      }
    };

    loadPreScreeners();
    return () => {
      cancelled = true;
    };
  }, [form.language, view, isLoadingEditForm]);

  const listRows = useMemo(
    () => urlRecords.map((record) => toListRow(record)),
    [urlRecords]
  );

  const isLinkTypeDirty =
    isEdit &&
    initialSnapshot != null &&
    normalizeProjectLinkType(form.projectLinkType) !==
      normalizeProjectLinkType(initialSnapshot.projectLinkType);
  const hasPendingMultiUrlCsv = isMultiLink && multiUrlCsvFiles.length > 0;
  // CSV is required whenever Multi Link save defers upload (create, or switch to Multi Link).
  const requiresMultiLinkCsv =
    isMultiLink &&
    (!(selectedUrlId || form.id || urlId) || isLinkTypeDirty);
  const multiLinkCsvError =
    requiresMultiLinkCsv && multiUrlCsvFiles.length === 0
      ? "CSV file is required for Multi Link projects."
      : "";

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return (
      !areProjectUrlFormsEqual(form, initialSnapshot) || hasPendingMultiUrlCsv
    );
  }, [isEdit, initialSnapshot, form, hasPendingMultiUrlCsv]);

  const hasProjectUrlCode = Boolean(String(form.projectUrlCode ?? "").trim());
  const canSubmit =
    canWrite &&
    !isSaving &&
    !isGeneratingUrlCode &&
    hasProjectUrlCode &&
    !multiLinkCsvError &&
    (isEdit ? isDirty : isValid);

  const handleLinkTypeChange = (value) => {
    const nextType = normalizeProjectLinkType(value);
    setForm((prev) => ({ ...prev, projectLinkType: nextType }));
    if (nextType !== "Multi Link" && multiUrlCsvFiles.length > 0) {
      setMultiUrlCsvFiles([]);
      setCsvLinkCount(null);
    }
  };

  // Recount CSV links whenever Multi Link files change (or are cleared).
  useEffect(() => {
    let cancelled = false;

    async function recount() {
      if (!isMultiLink || multiUrlCsvFiles.length === 0) {
        if (!cancelled) setCsvLinkCount(null);
        return;
      }
      try {
        const count = await countValidMultiLinkCsvFiles(multiUrlCsvFiles);
        if (!cancelled) setCsvLinkCount(count);
      } catch {
        if (!cancelled) setCsvLinkCount(null);
      }
    }

    recount();
    return () => {
      cancelled = true;
    };
  }, [isMultiLink, multiUrlCsvFiles]);

  const preScreenerPlaceholder = useMemo(() => {
    if (!form.language) return "Select language in Survey Matrix first";
    if (isLoadingPreScreeners) return "Loading pre-screener groups...";
    if (preScreenerOptions.length === 0) return "No pre-screener groups found";
    return "Select Pre-Screen Group";
  }, [form.language, isLoadingPreScreeners, preScreenerOptions.length]);

  const countryOptions = useMemo(() => {
    const selected = String(form.country ?? "").trim();
    if (!selected) return PROJECT_URL_COUNTRY_OPTIONS;
    const exists = PROJECT_URL_COUNTRY_OPTIONS.some(
      (option) =>
        String(typeof option === "string" ? option : option?.value ?? "")
          .trim()
          .toLowerCase() === selected.toLowerCase()
    );
    return exists ? PROJECT_URL_COUNTRY_OPTIONS : [selected, ...PROJECT_URL_COUNTRY_OPTIONS];
  }, [form.country]);

  const languageOptions = useMemo(() => {
    const selected = String(form.language ?? "").trim();
    if (!selected) return PROJECT_URL_PRESCREEN_LANGUAGES;
    const exists = PROJECT_URL_PRESCREEN_LANGUAGES.some(
      (option) =>
        String(typeof option === "string" ? option : option?.value ?? "")
          .trim()
          .toLowerCase() === selected.toLowerCase()
    );
    return exists
      ? PROJECT_URL_PRESCREEN_LANGUAGES
      : [selected, ...PROJECT_URL_PRESCREEN_LANGUAGES];
  }, [form.language]);

  const mergedPreScreenerOptions = useMemo(() => {
    const selectedId = String(form.preScreenerId || form.surveyGroupId || "").trim();
    if (!selectedId) return preScreenerOptions;
    if (
      preScreenerOptions.some((option) => String(option.value) === selectedId)
    ) {
      return preScreenerOptions;
    }
    const label =
      String(form.preScreenerName ?? form.preScreenName ?? "").trim() ||
      selectedId;
    return dedupeSelectOptions([
      { value: selectedId, label },
      ...preScreenerOptions,
    ]);
  }, [
    preScreenerOptions,
    form.preScreenerId,
    form.surveyGroupId,
    form.preScreenerName,
    form.preScreenName,
  ]);

  const handleLanguageChange = (language) => {
    setForm((prev) => ({
      ...prev,
      language,
      preScreenerId: "",
      surveyGroupId: "",
      preScreenerName: "",
    }));
    touch("preScreenerId");
  };

  const openAddForm = () => {
    onViewChange?.({
      urlView: PROJECT_URL_VIEW_IDS.ADD,
      urlId: "",
    });
  };

  const openEditForm = (row) => {
    const record =
      row?.record ?? urlRecords.find((item) => String(item.id) === String(row?.id));
    const nextForm = normalizeUrlRecord(record ?? row, projectFk);
    const nextId = String(nextForm.id || row?.id || "").trim();
    onViewChange?.({
      urlView: PROJECT_URL_VIEW_IDS.EDIT,
      urlId: nextId,
    });
  };

  const handleCloneRequest = (row) => {
    if (!canWrite || isCloning) return;
    setCloneTarget(row);
  };

  const closeForm = () => {
    navigateToList();
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canWrite || isGeneratingUrlCode) return;
    if (!String(form.projectUrlCode ?? "").trim()) {
      toastApiError("Project URL Code is required.");
      touch("projectUrlCode");
      return;
    }
    if (!validateSubmit() || !isProjectUrlFormValid(form, { isMultiLink, csvLinkCount })) {
      const firstError = Object.values(
        getProjectUrlFormErrors(form, { isMultiLink, csvLinkCount })
      ).find(Boolean);
      toastApiError(firstError || "Please fix the validation errors before saving.");
      return;
    }
    if (multiLinkCsvError) {
      toastApiError(multiLinkCsvError);
      return;
    }
    if (isEdit && !isDirty) return;

    setIsSaving(true);
    try {
      const resolvedUrlId = String(
        selectedUrlId || form.id || urlId || ""
      ).trim();

      const selectedPreScreenId = String(
        form.preScreenerId || form.surveyGroupId || ""
      ).trim();
      const selectedPreScreenOption = mergedPreScreenerOptions.find(
        (option) => String(option.value) === selectedPreScreenId
      );
      const resolvedPreScreenName = form.preScreen
        ? String(
            selectedPreScreenOption?.label ??
              form.preScreenerName ??
              form.preScreenName ??
              ""
          ).trim()
        : "";

      const payloadForm = {
        ...form,
        projectLinkType: selectedLinkType,
        discussion: trimOnBlur(form.discussion),
        liveLink: trimOnBlur(form.liveLink),
        testLink: trimOnBlur(form.testLink),
        redirectComplete: trimOnBlur(form.redirectComplete),
        redirectTerminate: trimOnBlur(form.redirectTerminate),
        redirectOverQuota: trimOnBlur(form.redirectOverQuota),
        redirectQualityTerm: trimOnBlur(form.redirectQualityTerm),
        redirectSurveyClose: trimOnBlur(form.redirectSurveyClose),
        loi: trimOnBlur(form.loi),
        ir: trimOnBlur(form.ir),
        cpiRate: trimOnBlur(form.cpiRate),
        sampleSize: trimOnBlur(form.sampleSize),
        completeRewardPoints: trimOnBlur(form.completeRewardPoints),
        terminationRewardPoints: trimOnBlur(form.terminationRewardPoints),
        id: resolvedUrlId,
        projectId: form.projectId || String(projectFk ?? ""),
        surveyGroupId: form.preScreenerId || form.surveyGroupId,
        preScreenerId: form.preScreenerId || form.surveyGroupId,
        preScreenerName: resolvedPreScreenName,
        ...(isMultiLink ? { liveLink: "", testLink: "" } : {}),
      };

      const isCreate = urlView === PROJECT_URL_VIEW_IDS.ADD;
      const pendingCsvFiles = isMultiLink ? multiUrlCsvFiles : [];
      const data = isCreate
        ? await createProjectUrl(projectFk, payloadForm, {
            isMultiLink,
            csvFiles: pendingCsvFiles,
          })
        : await updateProjectUrls(projectFk, payloadForm, {
            project,
            urlId: resolvedUrlId,
            isMultiLink,
            csvFiles: pendingCsvFiles,
          });

      if (pendingCsvFiles.length > 0) {
        setMultiUrlCsvFiles([]);
      }

      toastApiSuccess(
        data,
        isCreate
          ? "Project URL created successfully."
          : "Project URL updated successfully."
      );

      const savedId =
        data?.data?.id != null
          ? String(data.data.id)
          : resolvedUrlId || selectedUrlId || form.id || "";

      try {
        await loadUrlRecords();
      } catch (refreshError) {
        toastApiError(refreshError);
      }

      try {
        await onSaved?.({
          projectId: projectFk,
          projectUrlId: savedId,
          projectLinkType: selectedLinkType,
          response: data,
        });
      } catch (parentError) {
        toastApiError(parentError);
      }

      navigateToList();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloneConfirm = async () => {
    const record =
      cloneTarget?.record ??
      urlRecords.find((item) => String(item.id) === String(cloneTarget?.id));

    if (!record) {
      setCloneTarget(null);
      return;
    }

    setIsCloning(true);
    setCloneTarget(null);

    try {
      const sourceForm = normalizeUrlRecord(record, projectFk);
      const cloneLinkType = normalizeProjectLinkType(sourceForm.projectLinkType);
      const cloneIsMultiLink = cloneLinkType === "Multi Link";
      const generatedCode = await generateProjectUrlCode(projectFk);

      const payloadForm = {
        ...sourceForm,
        id: "",
        projectUrlCode: generatedCode,
        projectId: String(projectFk ?? ""),
        projectLinkType: cloneLinkType,
      };

      const data = await createProjectUrl(projectFk, payloadForm, {
        isMultiLink: cloneIsMultiLink,
        csvFiles: [],
      });

      toastApiSuccess(data, "Project URL cloned successfully.");
      await loadUrlRecords();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsCloning(false);
    }
  };

  const handleDeleteRequest = (row) => {
    setPendingDelete(row);
  };

  const handleDeleteConfirm = async () => {
    const urlRecordId = String(
      pendingDelete?.id ||
        pendingDelete?.record?.id ||
        pendingDelete?.url_id ||
        pendingDelete?.record?.url_id ||
        ""
    ).trim();

    if (!urlRecordId) {
      toastApiError("Project URL ID is required for delete.");
      return;
    }

    setIsDeleting(true);
    try {
      const data = await deleteProjectUrl(urlRecordId);
      toastApiSuccess(data, "Project URL deleted successfully.");
      setPendingDelete(null);
      await loadUrlRecords();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (view === "form" && isEdit && isLoadingEditForm) {
    return (
      <div className="admin-text flex items-center gap-2 py-8 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Loading Project URL...
      </div>
    );
  }

  if (view === "list") {
    return (
      <>
        <ModuleListingPage
          isDarkMode={isDarkMode}
          hidePageHeader
          title="Project URL"
          searchPlaceholder="Search Project URL..."
          actionLabel={canWrite ? "+ Add Project URL" : undefined}
          onActionClick={canWrite ? openAddForm : undefined}
          columns={PROJECT_URL_LIST_COLUMNS}
          rows={listRows}
          rowIdKey="id"
          actionVariant={canWrite ? "edit-delete" : "view-edit"}
          showDeleteAction={canWrite}
          statusAsText
          onEdit={canWrite ? openEditForm : undefined}
          onClone={canWrite ? handleCloneRequest : undefined}
          onDelete={canWrite ? handleDeleteRequest : undefined}
          onView={!canWrite ? openEditForm : undefined}
          permissionModule="survey"
          isLoading={isLoading}
          emptyMessage="No Project URL records found"
          showPagination
          nowrapAllCells
          descriptionMaxLines={1}
        />
        {canWrite ? (
          <DeleteConfirmModal
            isOpen={Boolean(pendingDelete)}
            onCancel={() => {
              if (isDeleting) return;
              setPendingDelete(null);
            }}
            onConfirm={handleDeleteConfirm}
            isDeleting={isDeleting}
          />
        ) : null}

        {canWrite ? (
          <DeleteConfirmModal
            isOpen={Boolean(cloneTarget)}
            onCancel={() => {
              if (isCloning) return;
              setCloneTarget(null);
            }}
            onConfirm={handleCloneConfirm}
            isDeleting={isCloning}
            title="Clone Project URL"
            message="Are you sure you want to clone this project URL?"
            confirmLabel="Clone"
            confirmingLabel="Cloning..."
            confirmClassName="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          />
        ) : null}
      </>
    );
  }

  return (
    <form className="space-y-0" onSubmit={handleSave} noValidate>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="admin-text text-base font-semibold">
          {isEdit ? "Edit Project URL" : "Add Project URL"}
        </h3>
        <button
          type="button"
          onClick={closeForm}
          className={secondaryBtnClass}
          disabled={isSaving}
        >
          Back to List
        </button>
      </div>

      <TableCard title="Basic Information" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Project ID">
            <input
              className={inputClass}
              value={form.projectId || String(projectFk ?? "")}
              readOnly
              disabled
            />
          </FormField>
          <FormField label="Project Code">
            <div className="flex items-stretch gap-2">
              <input
                className={`${inputClass} flex-1`}
                value={projectCode}
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
            label="Project URL Code"
            required
            error={showError("projectUrlCode")}
          >
            <div className="flex items-stretch gap-2">
              <input
                className={`${inputClass} flex-1`}
                value={
                  isGeneratingUrlCode
                    ? "Generating..."
                    : form.projectUrlCode || ""
                }
                readOnly
                disabled
                aria-busy={isGeneratingUrlCode}
                aria-label="Project URL Code"
              />
              <CopyValueButton
                value={form.projectUrlCode}
                successMessage="Project URL Code copied"
                label="Copy Project URL Code"
              />
            </div>
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <textarea
              className={textareaClass}
              value={form.discussion}
              onChange={(event) => setField("discussion", event.target.value)}
              onBlur={(event) => setField("discussion", trimOnBlur(event.target.value))}
              placeholder="Enter description"
              rows={3}
              disabled={!canWrite}
            />
          </FormField>
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Survey Matrix" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="LOI (Minutes)"
            required
            error={showError("loi") ? errors.loi : ""}
          >
            <DecimalInput
              className={inputClass}
              value={form.loi}
              onChange={(value) =>
                setField("loi", sanitizeProjectUrlDecimal(value))
              }
              onBlur={() => touch("loi")}
              placeholder="e.g. 15"
              decimalPlaces={PROJECT_URL_CPI_MAX_DECIMALS}
              disabled={!canWrite}
              aria-invalid={Boolean(showError("loi") && errors.loi)}
            />
          </FormField>
          <FormField
            label="IR (%)"
            required
            error={showError("ir") ? errors.ir : ""}
          >
            <DecimalInput
              className={inputClass}
              value={form.ir}
              onChange={(value) =>
                setField("ir", sanitizeProjectUrlDecimal(value))
              }
              onBlur={() => touch("ir")}
              placeholder="e.g. 32"
              decimalPlaces={PROJECT_URL_CPI_MAX_DECIMALS}
              disabled={!canWrite}
              aria-invalid={Boolean(showError("ir") && errors.ir)}
            />
          </FormField>
          <FormField
            label="CPI"
            required
            error={showError("cpiRate") ? errors.cpiRate : ""}
          >
            <DecimalInput
              className={inputClass}
              value={form.cpiRate}
              onChange={(value) =>
                setField("cpiRate", sanitizeProjectUrlDecimal(value))
              }
              onBlur={() => touch("cpiRate")}
              placeholder="e.g. 10.25"
              decimalPlaces={PROJECT_URL_CPI_MAX_DECIMALS}
              disabled={!canWrite}
              aria-invalid={Boolean(showError("cpiRate") && errors.cpiRate)}
            />
          </FormField>
          <FormField
            label="Sample Size"
            required
            error={
              showError("sampleSize") ||
              (isMultiLink && csvLinkCount != null && Boolean(errors.sampleSize))
                ? errors.sampleSize
                : ""
            }
            hint={
              isMultiLink && csvLinkCount != null
                ? `CSV links counted: ${csvLinkCount}`
                : undefined
            }
          >
            <NumericInput
              className={inputClass}
              value={form.sampleSize}
              onChange={(value) =>
                setField("sampleSize", sanitizeProjectUrlInteger(value))
              }
              onBlur={() => touch("sampleSize")}
              placeholder="e.g. 500"
              maxLength={PROJECT_URL_NUMERIC_MAX_DIGITS}
              disabled={!canWrite}
              aria-invalid={Boolean(
                (showError("sampleSize") ||
                  (isMultiLink &&
                    csvLinkCount != null &&
                    Boolean(errors.sampleSize))) &&
                  errors.sampleSize
              )}
            />
          </FormField>
          <FormField
            label="Start Date"
            required
            error={showError("startDate") ? errors.startDate : ""}
          >
            <AdminDatePicker
              value={form.startDate}
              onChange={(value) => {
                setField("startDate", value);
                touch("startDate");
              }}
              placeholder="Select start date"
              disabled={!canWrite}
              aria-label="Start date"
            />
          </FormField>
          <FormField
            label="End Date"
            required
            error={showError("endDate") ? errors.endDate : ""}
          >
            <AdminDatePicker
              value={form.endDate}
              onChange={(value) => {
                setField("endDate", value);
                touch("endDate");
              }}
              placeholder="Select end date"
              disabled={!canWrite}
              aria-label="End date"
            />
          </FormField>
          <FormField label="Country">
            <SearchableSelect
              inputClass={inputClass}
              value={form.country}
              onChange={(value) => setField("country", value)}
              options={countryOptions}
              placeholder="Select Country"
              searchPlaceholder="Search country..."
              aria-label="Country"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Language">
            <SearchableSelect
              inputClass={inputClass}
              value={form.language}
              onChange={handleLanguageChange}
              options={languageOptions}
              placeholder="Select Language"
              searchPlaceholder="Search language..."
              aria-label="Language"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Status">
            <SearchableSelect
              inputClass={inputClass}
              value={form.status || "Open"}
              onChange={(value) => setField("status", value || "Open")}
              options={PROJECT_URL_STATUS_OPTIONS}
              searchable={false}
              aria-label="Project status"
              disabled={!canWrite}
            />
          </FormField>
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Survey Links" isDarkMode={isDarkMode}>
        <div className="space-y-4">
          <FormRadioGroup
            name="projectLinkType"
            value={selectedLinkType}
            onChange={handleLinkTypeChange}
            options={PROJECT_LINK_TYPES}
            isDarkMode={isDarkMode}
            disabled={!canWrite || isSaving}
          />

          {!isMultiLink ? (
            <div className="grid gap-4 sm:grid-cols-1">
              <FormField
                label="Live Link"
                required
                hint="Must include XXXX"
                error={showError("liveLink") ? errors.liveLink : ""}
              >
                <div className="flex items-stretch gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    value={form.liveLink}
                    onChange={(event) => setField("liveLink", event.target.value)}
                    onBlur={(event) => {
                      setField("liveLink", trimOnBlur(event.target.value));
                      touch("liveLink");
                    }}
                    placeholder="https://example.com/survey?uid=XXXX"
                    disabled={!canWrite}
                    aria-invalid={Boolean(showError("liveLink") && errors.liveLink)}
                  />
                  <CopyValueButton
                    value={form.liveLink}
                    successMessage="Live URL copied"
                    label="Copy Live URL"
                  />
                </div>
              </FormField>
              <FormField
                label="Test Link"
                hint="Must include XXXX"
                error={showError("testLink") ? errors.testLink : ""}
              >
                <div className="flex items-stretch gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    value={form.testLink}
                    onChange={(event) => setField("testLink", event.target.value)}
                    onBlur={(event) => {
                      setField("testLink", trimOnBlur(event.target.value));
                      touch("testLink");
                    }}
                    placeholder="https://example.com/survey?uid=xxxx"
                    disabled={!canWrite}
                    aria-invalid={Boolean(showError("testLink") && errors.testLink)}
                  />
                  <CopyValueButton
                    value={form.testLink}
                    successMessage="Test URL copied"
                    label="Copy Test URL"
                  />
                </div>
              </FormField>
            </div>
          ) : (
            <ProjectMultiUrlCsvUploadSection
              projectId={projectFk}
              projectUrlId={selectedUrlId || form.id || urlId}
              isDarkMode={isDarkMode}
              canWrite={canWrite && !isSaving}
              showContextFields={false}
              showRecordsTable={false}
              deferUpload={
                !(selectedUrlId || form.id || urlId) || isLinkTypeDirty
              }
              embedded
              selectedFiles={multiUrlCsvFiles}
              onSelectedFilesChange={setMultiUrlCsvFiles}
              sampleSize={form.sampleSize}
              title="Upload Multi URLs"
              required={requiresMultiLinkCsv}
              error={multiLinkCsvError}
            />
          )}
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Project Filters / Security" isDarkMode={isDarkMode}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InteractiveCheckbox
            label="Geo Location"
            checked={form.geoLocation}
            onChange={(checked) => setField("geoLocation", checked)}
            disabled={!canWrite}
          />
          <InteractiveCheckbox
            label="URL Protection"
            checked={form.urlProtection}
            onChange={(checked) => setField("urlProtection", checked)}
            disabled={!canWrite}
          />
          <InteractiveCheckbox
            label="Unique IP Address"
            checked={form.uniqueIp}
            onChange={(checked) => setField("uniqueIp", checked)}
            disabled={!canWrite}
          />
          <InteractiveCheckbox
            label="Fraud Detection"
            checked={form.fraudDetection}
            onChange={(checked) => setField("fraudDetection", checked)}
            disabled={!canWrite}
          />
          <InteractiveCheckbox
            label="Pre-Screen"
            checked={form.preScreen}
            onChange={(checked) =>
              setForm((prev) => ({
                ...prev,
                preScreen: checked,
                ...(checked
                  ? {}
                  : {
                      preScreenerId: "",
                      surveyGroupId: "",
                      preScreenerName: "",
                    }),
              }))
            }
            disabled={!canWrite}
          />
        </div>

        {form.preScreen ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField
              label="Pre-Screen Group"
              required
              error={showError("preScreenerId") ? errors.preScreenerId : ""}
            >
              <SearchableSelect
                inputClass={inputClass}
                value={form.preScreenerId || form.surveyGroupId}
                onChange={(value) => {
                  const selectedId = String(value ?? "").trim();
                  const selectedOption = mergedPreScreenerOptions.find(
                    (option) => String(option.value) === selectedId
                  );
                  setForm((prev) => ({
                    ...prev,
                    preScreenerId: value,
                    surveyGroupId: value,
                    preScreenerName: String(selectedOption?.label ?? "").trim(),
                  }));
                  touch("preScreenerId");
                }}
                options={mergedPreScreenerOptions}
                placeholder={preScreenerPlaceholder}
                searchPlaceholder="Search pre-screen group..."
                aria-label="Pre-Screen Group"
                disabled={!canWrite || !form.language || isLoadingPreScreeners}
              />
            </FormField>
          </div>
        ) : null}
      </TableCard>

      <SectionDivider />

      <TableCard title="Redirect URLs" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-1">
          {PROJECT_URL_REDIRECT_FIELDS.map(({ key, label, example }) => {
            const copyMessage =
              key === "redirectComplete"
                ? "Completed URL copied"
                : key === "redirectTerminate"
                  ? "Terminated URL copied"
                  : key === "redirectOverQuota"
                    ? "Quota Full URL copied"
                    : key === "redirectQualityTerm"
                      ? "Quality Term URL copied"
                      : "Survey Closed URL copied";

            return (
              <FormField
                key={key}
                label={label}
                required
                hint={`Example: ${example}`}
                error={showError(key) ? errors[key] : ""}
              >
                <div className="flex items-stretch gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    value={form[key]}
                    onChange={(event) => setField(key, event.target.value)}
                    onBlur={(event) => {
                      setField(key, trimOnBlur(event.target.value));
                      touch(key);
                    }}
                    placeholder="https://"
                    disabled={!canWrite}
                    aria-invalid={Boolean(showError(key) && errors[key])}
                  />
                  <CopyValueButton
                    value={form[key]}
                    successMessage={copyMessage}
                    label={`Copy ${label}`}
                  />
                </div>
              </FormField>
            );
          })}
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Reward Information" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Completion Point"
            required
            error={
              showError("completeRewardPoints") ? errors.completeRewardPoints : ""
            }
          >
            <DecimalInput
              className={inputClass}
              value={form.completeRewardPoints}
              onChange={(value) =>
                setField("completeRewardPoints", sanitizeProjectUrlDecimal(value))
              }
              onBlur={() => touch("completeRewardPoints")}
              placeholder="e.g. 30"
              decimalPlaces={PROJECT_URL_CPI_MAX_DECIMALS}
              disabled={!canWrite}
              aria-invalid={Boolean(
                showError("completeRewardPoints") && errors.completeRewardPoints
              )}
            />
          </FormField>
          <FormField
            label="Termination Point"
            error={
              showError("terminationRewardPoints")
                ? errors.terminationRewardPoints
                : ""
            }
          >
            <DecimalInput
              className={inputClass}
              value={form.terminationRewardPoints}
              onChange={(value) =>
                setField(
                  "terminationRewardPoints",
                  sanitizeProjectUrlDecimal(value)
                )
              }
              onBlur={() => touch("terminationRewardPoints")}
              placeholder="e.g. 10"
              decimalPlaces={PROJECT_URL_CPI_MAX_DECIMALS}
              disabled={!canWrite}
              aria-invalid={Boolean(
                showError("terminationRewardPoints") &&
                  errors.terminationRewardPoints
              )}
            />
          </FormField>
        </div>
      </TableCard>

      {canWrite && (
        <div className="flex flex-wrap items-center gap-3 pt-6">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`${primaryBtnClass} flex min-w-[120px] items-center justify-center gap-2`}
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save Project"}
          </button>
          <button
            type="button"
            onClick={closeForm}
            disabled={isSaving}
            className={secondaryBtnClass}
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}

export default ProjectUrlsTab;
