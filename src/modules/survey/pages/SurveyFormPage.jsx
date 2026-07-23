import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";
import SurveyForm from "../components/SurveyForm";
import { createEmptySurveyForm } from "../data/surveyFormData";
import {
  mergeSelectOption,
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
  applyResolvedSelectIds,
  resolveSelectIdByLabel,
} from "../../shared/utils/formPopulation";
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

  const mergedClientOptions = useMemo(
    () =>
      mergeSelectOption(
        clientOptions,
        loadedRecord?.client_id ?? loadedRecord?.client_code,
        loadedRecord?.Clients ?? loadedRecord?.client_name
      ),
    [clientOptions, loadedRecord]
  );

  const mergedProjectManagerOptions = useMemo(
    () =>
      mergeSelectOption(
        projectManagerOptions,
        loadedRecord?.project_manager_id,
        loadedRecord?.Project_Manager ?? loadedRecord?.project_manager_name
      ),
    [projectManagerOptions, loadedRecord]
  );

  const mergedSalesManagerOptions = useMemo(
    () =>
      mergeSelectOption(
        salesManagerOptions,
        loadedRecord?.sales_manager_id,
        loadedRecord?.Sales_Manager ?? loadedRecord?.sales_manager_name
      ),
    [salesManagerOptions, loadedRecord]
  );

  const mergedSalesProjectOptions = useMemo(() => {
    const salesProjectId =
      loadedRecord?.sales_project_id ??
      loadedRecord?.rfq_id ??
      loadedRecord?.sales_project_name ??
      loadedRecord?.RFQ;
    return mergeSelectOption(
      salesProjectOptions,
      salesProjectId,
      salesProjectId != null ? String(salesProjectId) : ""
    );
  }, [salesProjectOptions, loadedRecord]);

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
        setLoadedRecord(record);
        setForm(mapped);
        setInitialSnapshot(cloneSurveyForm(mapped));
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
  }, [id, isEdit, isLoadingOptions, resetValidation]);

  useEffect(() => {
    if (!isEdit || isLoadingOptions || isLoadingRecord || !initialSnapshot || !loadedRecord) {
      return;
    }

    applyResolvedSelectIds(setForm, setInitialSnapshot, {
      client: !form.client
        ? resolveSelectIdByLabel(
            clientOptions,
            loadedRecord?.Clients ?? loadedRecord?.client_name
          )
        : "",
      projectManager: !form.projectManager
        ? resolveSelectIdByLabel(
            projectManagerOptions,
            loadedRecord?.Project_Manager ?? loadedRecord?.project_manager_name
          )
        : "",
      salesManager: !form.salesManager
        ? resolveSelectIdByLabel(
            salesManagerOptions,
            loadedRecord?.Sales_Manager ?? loadedRecord?.sales_manager_name
          )
        : "",
      salesProject: !form.salesProject
        ? String(
            loadedRecord?.sales_project_id ??
              loadedRecord?.rfq_id ??
              loadedRecord?.sales_project_name ??
              loadedRecord?.RFQ ??
              ""
          )
        : "",
    });
  }, [
    isEdit,
    isLoadingOptions,
    isLoadingRecord,
    initialSnapshot,
    loadedRecord,
    clientOptions,
    projectManagerOptions,
    salesManagerOptions,
    form.client,
    form.projectManager,
    form.salesManager,
    form.salesProject,
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
