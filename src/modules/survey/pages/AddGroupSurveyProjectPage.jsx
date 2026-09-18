import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";
import SurveyForm from "../components/SurveyForm";
import { createEmptySurveyForm } from "../data/surveyFormData";
import { useSurveyFormSelectOptions } from "../hooks/useSurveyFormSelectOptions";
import {
  createGroupSurveyProject,
  getRecord,
  resolveGroupClientNames,
  resolveGroupPrimaryClientId,
} from "../services/groupSurveyApi";
import { projectCodeExists, projectNameExists } from "../services/surveyApi";
import { generateProjectUrlCode } from "../services/projectUrlsApi";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getSurveyFormErrors,
  isProjectCodeDuplicateError,
  isProjectNameDuplicateError,
  isSurveyFormSubmittable,
  PROJECT_CODE_DUPLICATE_MESSAGE,
  PROJECT_NAME_DUPLICATE_MESSAGE,
  SURVEY_FORM_FIELDS,
} from "../utils/surveyFormValidation";
import toast from "../../../services/toast/toast";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function AddGroupSurveyProjectPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { readOnly, showSubmit } = useFormAccess();
  const [groupRecord, setGroupRecord] = useState(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [form, setForm] = useState(createEmptySurveyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectNameTaken, setProjectNameTaken] = useState(false);
  const [projectCodeTaken, setProjectCodeTaken] = useState(false);
  const [isGeneratingProjectCode, setIsGeneratingProjectCode] = useState(true);
  const {
    clientOptions,
    projectManagerOptions,
    salesManagerOptions,
    salesProjectOptions,
    isLoading: isLoadingOptions,
  } = useSurveyFormSelectOptions();

  useEffect(() => {
    if (!groupId) return undefined;

    let cancelled = false;

    const loadGroup = async () => {
      setIsLoadingGroup(true);
      setLoadFailed(false);

      try {
        const project = await getRecord(groupId);
        if (cancelled) return;

        setGroupRecord(project);
        setForm({
          ...createEmptySurveyForm(),
          client: resolveGroupPrimaryClientId(project),
          groupProjectId: groupId,
        });
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingGroup(false);
      }
    };

    loadGroup();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const lockedClientLabel = useMemo(
    () => resolveGroupClientNames(groupRecord),
    [groupRecord]
  );

  const errors = useMemo(
    () => getSurveyFormErrors(form, { projectNameTaken, projectCodeTaken }),
    [form, projectNameTaken, projectCodeTaken]
  );
  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: SURVEY_FORM_FIELDS,
  });

  useEffect(() => {
    setProjectNameTaken(false);
  }, [form.projectName]);

  useEffect(() => {
    setProjectCodeTaken(false);
  }, [form.projectCode]);

  useEffect(() => {
    if (!groupId || isLoadingGroup || loadFailed || !groupRecord) {
      if (!groupId || loadFailed) setIsGeneratingProjectCode(false);
      return undefined;
    }

    let cancelled = false;

    const loadGeneratedProjectCode = async () => {
      setIsGeneratingProjectCode(true);
      try {
        const code = await generateProjectUrlCode(groupId);
        if (cancelled) return;
        setForm((prev) => {
          if (String(prev.projectCode ?? "").trim()) return prev;
          return { ...prev, projectCode: code };
        });
      } catch (error) {
        if (!cancelled) toastApiError(error);
      } finally {
        if (!cancelled) setIsGeneratingProjectCode(false);
      }
    };

    loadGeneratedProjectCode();
    return () => {
      cancelled = true;
    };
  }, [groupId, isLoadingGroup, loadFailed, groupRecord]);

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isSurveyFormSubmittable(form, { projectNameTaken, projectCodeTaken }) &&
    !isSubmitting &&
    !isLoadingGroup &&
    !isLoadingOptions &&
    !isGeneratingProjectCode &&
    !loadFailed;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isSurveyFormSubmittable(form, { projectNameTaken, projectCodeTaken })) return;

    setIsSubmitting(true);
    try {
      const nameTaken = await projectNameExists(form.projectName);
      if (nameTaken) {
        setProjectNameTaken(true);
        toast.error(PROJECT_NAME_DUPLICATE_MESSAGE);
        return;
      }

      const codeTaken = await projectCodeExists(form.projectCode);
      if (codeTaken) {
        setProjectCodeTaken(true);
        toast.error(PROJECT_CODE_DUPLICATE_MESSAGE);
        return;
      }

      const data = await createGroupSurveyProject(groupId, form);
      toastApiSuccess(data);
      navigate(`/survey/group/${encodeURIComponent(groupId)}/projects`, {
        replace: true,
        state: { refresh: true },
      });
    } catch (err) {
      if (isProjectNameDuplicateError(err)) {
        setProjectNameTaken(true);
        toast.error(PROJECT_NAME_DUPLICATE_MESSAGE);
      } else if (isProjectCodeDuplicateError(err)) {
        setProjectCodeTaken(true);
        toast.error(PROJECT_CODE_DUPLICATE_MESSAGE);
      } else {
        toastApiError(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingGroup || isLoadingOptions) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (loadFailed || !groupRecord) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Add Survey Project"
          breadcrumbs={[
            { label: "Group Survey", to: "/survey/group" },
            { label: "Add Survey Project" },
          ]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load group survey details.
          <button
            type="button"
            onClick={() => navigate("/survey/group")}
            className="ml-2 font-semibold text-[#10a950] hover:underline"
          >
            Back to Group Survey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Add Survey Project"
        subtitle={groupRecord.project_name}
        breadcrumbs={[
          { label: "Group Survey", to: "/survey/group" },
          {
            label: "View Projects",
            to: `/survey/group/${encodeURIComponent(groupId)}/projects`,
          },
          { label: "Add Survey Project" },
        ]}
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
          isGeneratingProjectCode={isGeneratingProjectCode}
          groupProject={groupRecord.project_name}
          lockedClientLabel={lockedClientLabel}
          clientOptions={clientOptions}
          projectManagerOptions={projectManagerOptions}
          salesManagerOptions={salesManagerOptions}
          salesProjectOptions={salesProjectOptions}
        />

        <div className="admin-form-actions flex flex-wrap items-center gap-3">
          {showSubmit && !readOnly && (
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              navigate(`/survey/group/${encodeURIComponent(groupId)}/projects`)
            }
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

export default AddGroupSurveyProjectPage;
