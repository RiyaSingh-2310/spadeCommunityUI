import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";
import SurveyForm from "../components/SurveyForm";
import { createEmptySurveyForm, SURVEY_GROUP_OPTIONS } from "../data/surveyFormData";
import {
  mergeSelectOption,
  useSurveyFormSelectOptions,
} from "../hooks/useSurveyFormSelectOptions";
import {
  assignPartners,
  createSurvey,
  getAssignedPartners,
  getEligiblePartners,
  getRecord,
  mapAssignedPartnersToForm,
  mapPartnersToSelectOptions,
  mapSurveyToForm,
  resolveSurveyNumericId,
  updatePartnerAllocation,
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

function mergePartnerSelectOptions(eligiblePartners = [], assignedPartners = []) {
  const eligibleOptions = mapPartnersToSelectOptions(eligiblePartners);
  const assignedOptions = mapPartnersToSelectOptions(assignedPartners);
  const merged = [...assignedOptions];

  for (const option of eligibleOptions) {
    if (!merged.some((entry) => String(entry.value) === String(option.value))) {
      merged.push(option);
    }
  }

  return merged;
}

function arePartnerSelectionsEqual(current = [], original = []) {
  const left = (Array.isArray(current) ? current : []).map(String).sort();
  const right = (Array.isArray(original) ? original : []).map(String).sort();
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function getChangedPartnerAllocations(currentAllocations = {}, originalAllocations = {}, partnerIds = []) {
  const updates = [];

  for (const partnerId of partnerIds) {
    const key = String(partnerId);
    const currentValue = String(currentAllocations?.[key] ?? "").trim();
    const originalValue = String(originalAllocations?.[key] ?? "").trim();
    if (!currentValue || currentValue === originalValue) continue;
    updates.push({ partnerId: key, allocatedSize: currentValue });
  }

  return updates;
}

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
  const [partnerOptions, setPartnerOptions] = useState([]);
  const [partnerAllocationSource, setPartnerAllocationSource] = useState({});
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
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
        loadedRecord?.client_name
      ),
    [clientOptions, loadedRecord]
  );

  const mergedProjectManagerOptions = useMemo(
    () =>
      mergeSelectOption(
        projectManagerOptions,
        loadedRecord?.project_manager_id,
        loadedRecord?.project_manager_name
      ),
    [projectManagerOptions, loadedRecord]
  );

  const mergedSalesManagerOptions = useMemo(
    () =>
      mergeSelectOption(
        salesManagerOptions,
        loadedRecord?.sales_manager_id,
        loadedRecord?.sales_manager_name
      ),
    [salesManagerOptions, loadedRecord]
  );

  const mergedSalesProjectOptions = useMemo(
    () =>
      mergeSelectOption(
        salesProjectOptions,
        loadedRecord?.sales_project_id,
        loadedRecord?.sales_project_name
      ),
    [salesProjectOptions, loadedRecord]
  );

  const mergedSurveyGroupOptions = useMemo(
    () =>
      mergeSelectOption(
        SURVEY_GROUP_OPTIONS,
        loadedRecord?.prescreen_survey_id ?? loadedRecord?.survey_group_id,
        loadedRecord?.prescreen_survey_title ??
          loadedRecord?.survey_group_name ??
          loadedRecord?.survey_group_title
      ),
    [loadedRecord]
  );

  const surveyRecordId = useMemo(
    () => resolveSurveyNumericId(loadedRecord) ?? resolveSurveyNumericId(id),
    [loadedRecord, id]
  );

  const partnerSelectionEnabled = Boolean(isEdit && surveyRecordId);

  const loadSurveyPartners = useCallback(
    async (recordId) => {
      if (!recordId) {
        setPartnerOptions([]);
        setPartnerAllocationSource({});
        return;
      }

      setIsLoadingPartners(true);
      try {
        const [eligibleResponse, assignedPartners] = await Promise.all([
          getEligiblePartners(recordId),
          getAssignedPartners(recordId),
        ]);

        const eligiblePartners = Array.isArray(eligibleResponse?.data)
          ? eligibleResponse.data
          : [];
        setPartnerOptions(mergePartnerSelectOptions(eligiblePartners, assignedPartners));

        const assignedForm = mapAssignedPartnersToForm(assignedPartners);
        setPartnerAllocationSource({ ...assignedForm.partnerAllocations });
        setForm((prev) => ({
          ...prev,
          partners: assignedForm.partners,
          partnerAllocations: assignedForm.partnerAllocations,
        }));
        setInitialSnapshot((prev) =>
          prev
            ? {
                ...prev,
                partners: [...assignedForm.partners],
                partnerAllocations: { ...assignedForm.partnerAllocations },
              }
            : prev
        );
      } catch (error) {
        toastApiError(error);
        setPartnerOptions([]);
        setPartnerAllocationSource({});
      } finally {
        setIsLoadingPartners(false);
      }
    },
    []
  );

  const errors = useMemo(() => getSurveyFormErrors(form), [form]);
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
    if (!isEdit || !surveyRecordId || isLoadingRecord || loadFailed) return undefined;

    let cancelled = false;

    const loadPartners = async () => {
      if (cancelled) return;
      await loadSurveyPartners(surveyRecordId);
    };

    loadPartners();
    return () => {
      cancelled = true;
    };
  }, [isEdit, surveyRecordId, isLoadingRecord, loadFailed, loadSurveyPartners]);

  useEffect(() => {
    if (!isEdit || isLoadingOptions || isLoadingRecord || !initialSnapshot || !loadedRecord) {
      return;
    }

    applyResolvedSelectIds(setForm, setInitialSnapshot, {
      client: !form.client
        ? resolveSelectIdByLabel(clientOptions, loadedRecord?.client_name)
        : "",
      projectManager: !form.projectManager
        ? resolveSelectIdByLabel(projectManagerOptions, loadedRecord?.project_manager_name)
        : "",
      salesManager: !form.salesManager
        ? resolveSelectIdByLabel(salesManagerOptions, loadedRecord?.sales_manager_name)
        : "",
      salesProject: !form.salesProject
        ? resolveSelectIdByLabel(
            salesProjectOptions,
            loadedRecord?.sales_project_name ?? loadedRecord?.sales_project_id
          )
        : "",
      surveyGroup: !form.surveyGroup
        ? resolveSelectIdByLabel(
            mergedSurveyGroupOptions,
            loadedRecord?.prescreen_survey_title ??
              loadedRecord?.survey_group_name ??
              loadedRecord?.survey_group_title
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
    salesProjectOptions,
    mergedSurveyGroupOptions,
    form.client,
    form.projectManager,
    form.salesManager,
    form.salesProject,
    form.surveyGroup,
  ]);

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return !areSurveyFormsEqual(form, initialSnapshot);
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isSurveyFormSubmittable(form) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !isLoadingOptions &&
    !isLoadingPartners &&
    !loadFailed &&
    (!isEdit || isDirty);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (
      !validateSubmit() ||
      !isSurveyFormSubmittable(form) ||
      (isEdit && !isDirty)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const data = await updateSurvey(id, form);
        toastApiSuccess(data);

        if (surveyRecordId) {
          const partnersChanged = !arePartnerSelectionsEqual(
            form.partners,
            initialSnapshot?.partners
          );

          if (partnersChanged) {
            const assignData = await assignPartners(surveyRecordId, form.partners);
            toastApiSuccess(assignData);
          }

          const allocationUpdates = getChangedPartnerAllocations(
            form.partnerAllocations,
            initialSnapshot?.partnerAllocations,
            form.partners
          );

          for (const update of allocationUpdates) {
            const allocationData = await updatePartnerAllocation(
              surveyRecordId,
              update.partnerId,
              update.allocatedSize
            );
            toastApiSuccess(allocationData);
          }

          await loadSurveyPartners(surveyRecordId);
        }
      } else {
        const data = await createSurvey(form);
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

  const title = isEdit ? "Edit Survey" : "Create Survey";
  const breadcrumbs = isEdit
    ? [
        { label: "Survey", to: "/survey" },
        { label: "Project Details", to: `/survey/view/${encodeURIComponent(id)}` },
        { label: "Edit Survey" },
      ]
    : [{ label: "Survey", to: "/survey" }, { label: "Create Survey" }];

  if ((isEdit && isLoadingRecord) || isLoadingOptions) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={title}
          subtitle={`Survey ${id}`}
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
          subtitle={`Survey ${id}`}
          breadcrumbs={breadcrumbs}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load survey details.
          <button
            type="button"
            onClick={() => navigate(returnTo ?? "/survey")}
            className="ml-2 font-semibold text-[#10a950] hover:underline"
          >
            Back to Survey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        subtitle={isEdit ? `Survey ${id}` : "Add a new survey project"}
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
          projectManagerOptions={mergedProjectManagerOptions}
          salesManagerOptions={mergedSalesManagerOptions}
          salesProjectOptions={mergedSalesProjectOptions}
          surveyGroupOptions={mergedSurveyGroupOptions}
          partnerOptions={partnerOptions}
          isLoadingPartners={isLoadingPartners}
          partnerSelectionEnabled={partnerSelectionEnabled}
          partnerAllocationSource={partnerAllocationSource}
          descriptionContentKey={isEdit ? `survey-${id}` : "survey-create"}
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
