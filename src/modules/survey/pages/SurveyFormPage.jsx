import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";
import SurveyForm from "../components/SurveyForm";
import { createEmptySurveyForm } from "../data/surveyFormData";
import {
  ensureSelectOption,
  resolveSelectValue,
  useSurveyFormSelectOptions,
} from "../hooks/useSurveyFormSelectOptions";
import {
  createSurvey,
  getRecord,
  mapSurveyToForm,
  updateSurvey,
} from "../services/surveyApi";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  areSurveyFormsEqual,
  cloneSurveyForm,
  getSurveyFormErrors,
  isSurveyFormSubmittable,
  SURVEY_FORM_FIELDS,
} from "../utils/surveyFormValidation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  getSurveyDetailsPath,
  getSurveyEditBreadcrumbs,
  SURVEY_DETAIL_TAB_IDS,
} from "../utils/surveyDetailsNavigation";

function SurveyFormPage({ isDarkMode, mode = "create" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const returnTo = location.state?.returnTo;
  const { readOnly, showSubmit } = useFormAccess();

  const [form, setForm] = useState(createEmptySurveyForm);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [loadedRecord, setLoadedRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const {
    clientOptions,
    projectManagerOptions,
    salesManagerOptions,
    salesProjectOptions,
    isLoading: isLoadingOptions,
  } = useSurveyFormSelectOptions();

  const clientLabel =
    loadedRecord?.Clients ??
    loadedRecord?.client_name ??
    loadedRecord?.clientName ??
    "";
  const projectManagerLabel =
    loadedRecord?.Project_Manager ??
    loadedRecord?.project_manager_name ??
    loadedRecord?.projectManagerName ??
    "";
  const salesManagerLabel =
    loadedRecord?.Sales_Manager ??
    loadedRecord?.sales_manager_name ??
    loadedRecord?.salesManagerName ??
    "";
  const salesProjectLabel = String(
    loadedRecord?.sales_project_id ??
      loadedRecord?.rfq_id ??
      loadedRecord?.RFQ ??
      loadedRecord?.sales_project_name ??
      ""
  ).trim();

  const mergedClientOptions = useMemo(
    () =>
      ensureSelectOption(
        clientOptions,
        loadedRecord?.client_id ?? loadedRecord?.client_code ?? form.client,
        clientLabel || form.client
      ),
    [clientOptions, loadedRecord, form.client, clientLabel]
  );

  const mergedProjectManagerOptions = useMemo(
    () =>
      ensureSelectOption(
        projectManagerOptions,
        loadedRecord?.project_manager_id ?? form.projectManager,
        projectManagerLabel || form.projectManager
      ),
    [
      projectManagerOptions,
      loadedRecord,
      form.projectManager,
      projectManagerLabel,
    ]
  );

  const mergedSalesManagerOptions = useMemo(
    () =>
      ensureSelectOption(
        salesManagerOptions,
        loadedRecord?.sales_manager_id ?? form.salesManager,
        salesManagerLabel || form.salesManager
      ),
    [salesManagerOptions, loadedRecord, form.salesManager, salesManagerLabel]
  );

  const mergedSalesProjectOptions = useMemo(
    () =>
      ensureSelectOption(
        salesProjectOptions,
        loadedRecord?.sales_project_id ??
          loadedRecord?.rfq_id ??
          loadedRecord?.RFQ ??
          form.salesProject,
        salesProjectLabel || form.salesProject
      ),
    [salesProjectOptions, loadedRecord, form.salesProject, salesProjectLabel]
  );

  const validationOptions = useMemo(
    () => ({ excludeId: isEdit ? id : undefined }),
    [isEdit, id]
  );

  const errors = useMemo(
    () => getSurveyFormErrors(form, validationOptions),
    [form, validationOptions]
  );
  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: SURVEY_FORM_FIELDS,
  });

  useEffect(() => {
    if (!isEdit || !id || isLoadingOptions) return undefined;

    let cancelled = false;

    const loadSurvey = async () => {
      resetValidation();
      setInitialSnapshot(null);
      setLoadedRecord(null);
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const record = await getRecord(id);
        if (cancelled) return;

        const mapped = mapSurveyToForm(record, createEmptySurveyForm());

        // Resolve name-only API values against loaded option lists immediately.
        const resolved = {
          ...mapped,
          client: resolveSelectValue(
            clientOptions,
            mapped.client || record?.client_id,
            record?.Clients ?? record?.client_name ?? mapped.client
          ),
          projectManager: resolveSelectValue(
            projectManagerOptions,
            mapped.projectManager || record?.project_manager_id,
            record?.Project_Manager ??
              record?.project_manager_name ??
              mapped.projectManager
          ),
          salesManager: resolveSelectValue(
            salesManagerOptions,
            mapped.salesManager || record?.sales_manager_id,
            record?.Sales_Manager ??
              record?.sales_manager_name ??
              mapped.salesManager
          ),
          salesProject: resolveSelectValue(
            salesProjectOptions,
            mapped.salesProject ||
              record?.sales_project_id ||
              record?.rfq_id ||
              record?.RFQ,
            record?.RFQ ?? record?.sales_project_name ?? mapped.salesProject
          ),
        };

        setLoadedRecord(record);
        setForm(resolved);
        setInitialSnapshot(cloneSurveyForm(resolved));
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
        setInitialSnapshot(null);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadSurvey();
    return () => {
      cancelled = true;
    };
    // Options are read after `isLoadingOptions` becomes false in the same render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-fetching when option array identities change
  }, [id, isEdit, isLoadingOptions, resetValidation]);

  useEffect(() => {
    if (!isEdit || isLoadingOptions || isLoadingRecord || !initialSnapshot || !loadedRecord) {
      return;
    }

    const nextClient = resolveSelectValue(
      mergedClientOptions,
      form.client || loadedRecord?.client_id,
      clientLabel
    );
    const nextProjectManager = resolveSelectValue(
      mergedProjectManagerOptions,
      form.projectManager || loadedRecord?.project_manager_id,
      projectManagerLabel
    );
    const nextSalesManager = resolveSelectValue(
      mergedSalesManagerOptions,
      form.salesManager || loadedRecord?.sales_manager_id,
      salesManagerLabel
    );
    const nextSalesProject = resolveSelectValue(
      mergedSalesProjectOptions,
      form.salesProject ||
        loadedRecord?.sales_project_id ||
        loadedRecord?.rfq_id ||
        loadedRecord?.RFQ,
      salesProjectLabel
    );

    const patches = {};
    if (nextClient && nextClient !== form.client) patches.client = nextClient;
    if (nextProjectManager && nextProjectManager !== form.projectManager) {
      patches.projectManager = nextProjectManager;
    }
    if (nextSalesManager && nextSalesManager !== form.salesManager) {
      patches.salesManager = nextSalesManager;
    }
    if (nextSalesProject && nextSalesProject !== form.salesProject) {
      patches.salesProject = nextSalesProject;
    }

    if (!Object.keys(patches).length) return;

    setForm((prev) => ({ ...prev, ...patches }));
    setInitialSnapshot((prev) => (prev ? { ...prev, ...patches } : prev));
  }, [
    isEdit,
    isLoadingOptions,
    isLoadingRecord,
    initialSnapshot,
    loadedRecord,
    mergedClientOptions,
    mergedProjectManagerOptions,
    mergedSalesManagerOptions,
    mergedSalesProjectOptions,
    form.client,
    form.projectManager,
    form.salesManager,
    form.salesProject,
    clientLabel,
    projectManagerLabel,
    salesManagerLabel,
    salesProjectLabel,
  ]);

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return !areSurveyFormsEqual(form, initialSnapshot);
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isSurveyFormSubmittable(form, validationOptions) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !isLoadingOptions &&
    !loadFailed &&
    (!isEdit || isDirty);

  const selectOptions = {
    clientOptions: mergedClientOptions,
    projectManagerOptions: mergedProjectManagerOptions,
    salesManagerOptions: mergedSalesManagerOptions,
    salesProjectOptions: mergedSalesProjectOptions,
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (
      !validateSubmit() ||
      !isSurveyFormSubmittable(form, validationOptions) ||
      (isEdit && !isDirty)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const data = await updateSurvey(id, form, selectOptions);
        toastApiSuccess(data);
      } else {
        const data = await createSurvey(form, selectOptions);
        toastApiSuccess(data);
      }

      navigate(returnTo ?? "/survey", {
        replace: true,
        state: { refresh: true },
      });
    } catch (err) {
      toastApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isEdit ? "Edit Project" : "Create Project";
  const editSearchParams = new URLSearchParams(location.search);
  const from = location.state?.from || editSearchParams.get("from") || "";
  const fromTab =
    location.state?.fromTab || editSearchParams.get("fromTab") || "";
  const groupId =
    location.state?.groupId || editSearchParams.get("groupId") || undefined;
  const breadcrumbs = isEdit
    ? getSurveyEditBreadcrumbs({
        id,
        from,
        fromTab,
        groupId,
      })
    : [
        { label: "Projects", to: "/survey" },
        { label: "Create Project" },
      ];

  if ((isEdit && isLoadingRecord) || isLoadingOptions) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={title}
          subtitle={isEdit ? `Project ${id}` : "Add a new project"}
          breadcrumbs={breadcrumbs}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={title}
          subtitle={`Project ${id}`}
          breadcrumbs={breadcrumbs}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load project details.
          <button
            type="button"
            onClick={() => navigate(returnTo ?? "/survey")}
            className="ml-2 font-semibold text-[#10a950] hover:underline"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        subtitle={isEdit ? `Project ${id}` : "Add a new project"}
        breadcrumbs={breadcrumbs}
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <SurveyForm
          form={form}
          setForm={setForm}
          errors={errors}
          showError={showError}
          touch={touch}
          isDarkMode={isDarkMode}
          disabled={fieldDisabled(readOnly, isSubmitting)}
          clientOptions={mergedClientOptions}
          isLoadingClients={isLoadingOptions}
          projectManagerOptions={mergedProjectManagerOptions}
          salesManagerOptions={mergedSalesManagerOptions}
          salesProjectOptions={mergedSalesProjectOptions}
          onOpenProjectUrls={
            isEdit
              ? () =>
                  navigate(
                    getSurveyDetailsPath({
                      id,
                      groupId,
                      tab: SURVEY_DETAIL_TAB_IDS.PROJECT_URLS,
                    })
                  )
              : undefined
          }
        />

        <div className="admin-form-actions flex flex-wrap items-center gap-3">
          {showSubmit && !readOnly && (
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting
                ? isEdit
                  ? "Updating..."
                  : "Submitting..."
                : isEdit
                  ? "Update"
                  : "Submit"}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(returnTo ?? "/survey")}
            disabled={isSubmitting}
            className={getAdminCancelButtonClass()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default SurveyFormPage;
