import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import PermissionDenied from "../../../components/admin/PermissionDenied";
import NumericInput from "../../../components/admin/NumericInput";
import FormField from "../../../components/admin/FormField";
import FormRadioGroup from "../../../components/admin/FormRadioGroup";
import TableCard from "../../../components/admin/TableCard";
import { useModulePermission } from "../../permissions/useModulePermission";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getRequiredError,
  isFormValidForFields,
} from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { fetchRewardSettings, updateRewardSettings } from "../services/rewardSettingsApi";

const REWARD_TYPE_OPTIONS = ["Registration Reward", "Survey Completion Reward"];

const REDEMPTION_METHOD_FIELDS = ["amazon", "flipkart", "paypal"];

const YES_NO_OPTIONS = ["Yes", "No"];

const DEFAULT_FORM = {
  rewardType: "Registration Reward",
  registrationReward: "",
  surveyCompletionReward: "",
  minimumPayout: "",
  amazon: "No",
  flipkart: "No",
  paypal: "No",
};

function RewardSettingsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { canRead, canWrite, isReadOnly } = useModulePermission("reward_settings");
  const readOnly = isReadOnly;
  const showSubmit = canWrite;
  const inputClass = getAdminInputClass();

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const settings = await fetchRewardSettings();
        if (cancelled) return;

        setForm(settings);
        setInitialSnapshot(settings);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const isRegistrationType = form.rewardType === "Registration Reward";

  const activeRewardField = isRegistrationType
    ? "registrationReward"
    : "surveyCompletionReward";

  const validationFields = useMemo(
    () => [activeRewardField, "minimumPayout"],
    [activeRewardField]
  );

  const errors = useMemo(
    () => ({
      registrationReward: getRequiredError(
        form.registrationReward,
        "User Registration Reward Points"
      ),
      surveyCompletionReward: getRequiredError(
        form.surveyCompletionReward,
        "Survey Completion Reward Points"
      ),
      minimumPayout: getRequiredError(form.minimumPayout, "Minimum Payout"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: ["registrationReward", "surveyCompletionReward", "minimumPayout"],
  });

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return ["rewardType", "registrationReward", "surveyCompletionReward", "minimumPayout", ...REDEMPTION_METHOD_FIELDS].some(
      (key) =>
        String(form[key] ?? "").trim() !== String(initialSnapshot[key] ?? "").trim()
    );
  }, [form, initialSnapshot]);

  const canSubmit =
    showSubmit &&
    !readOnly &&
    !isSubmitting &&
    isFormValidForFields(errors, validationFields) &&
    isDirty;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (
      readOnly ||
      !showSubmit ||
      !validateSubmit() ||
      !isFormValidForFields(errors, validationFields) ||
      !isDirty ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await updateRewardSettings(form);
      const nextForm = data.form ?? form;
      setForm(nextForm);
      setInitialSnapshot({ ...nextForm });
      toastApiSuccess(data);
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canRead) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Reward Settings" isDarkMode={isDarkMode} />
        <p className="admin-text-muted text-sm">Unable to load reward settings.</p>
        <button
          type="button"
          onClick={() => navigate("/reward-points/history")}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Reward Settings" isDarkMode={isDarkMode} />

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <TableCard title="Reward Configuration">
          <div className="space-y-8">
            <section className="space-y-5">
              {/* <div>
                <h3 className="admin-text text-sm font-semibold">Reward Type</h3>
                <p className="admin-text-muted mt-1 text-xs">
                  Select the reward category to configure its point value.
                </p>
              </div> */}

              <FormRadioGroup
                label="Reward Type"
                name="rewardType"
                value={form.rewardType}
                onChange={(value) => setField("rewardType", value)}
                options={REWARD_TYPE_OPTIONS}
                isDarkMode={isDarkMode}
                disabled={readOnly}
              />

              <div className="max-w-md">
                {isRegistrationType ? (
                  <FormField
                    label="User Registration Reward Points"
                    required
                    error={showError("registrationReward")}
                  >
                    <NumericInput
                      className={inputClass}
                      value={form.registrationReward}
                      onChange={(v) => setField("registrationReward", v)}
                      onBlur={() => touch("registrationReward")}
                      disabled={readOnly}
                      readOnly={readOnly}
                      placeholder="200"
                    />
                  </FormField>
                ) : (
                  <FormField
                    label="Survey Completion Reward Points"
                    required
                    error={showError("surveyCompletionReward")}
                  >
                    <NumericInput
                      className={inputClass}
                      value={form.surveyCompletionReward}
                      onChange={(v) => setField("surveyCompletionReward", v)}
                      onBlur={() => touch("surveyCompletionReward")}
                      disabled={readOnly}
                      readOnly={readOnly}
                      placeholder="100"
                    />
                  </FormField>
                )}
              </div>
            </section>

            <section className="space-y-4 border-t border-[var(--admin-header-search-border)] pt-8">
              <div>
                <h3 className="admin-text text-sm font-semibold">Payout Threshold</h3>
                <p className="admin-text-muted mt-1 text-xs">
                  Minimum redeemable reward amount for panelists.
                </p>
              </div>

              <FormField
                className="max-w-md"
                label="Minimum Payout"
                required
                error={showError("minimumPayout")}
              >
                <NumericInput
                  className={inputClass}
                  value={form.minimumPayout}
                  onChange={(v) => setField("minimumPayout", v)}
                  onBlur={() => touch("minimumPayout")}
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="500"
                />
              </FormField>
            </section>

            <section className="space-y-4 border-t border-[var(--admin-header-search-border)] pt-8">
              <div>
                <h3 className="admin-text text-sm font-semibold">Supported Reward Methods</h3>
                <p className="admin-text-muted mt-1 text-xs">
                  Enable or disable redemption channels for reward payouts.
                </p>
              </div>

              <div className="max-w-md flex flex-col gap-5">
                <FormRadioGroup
                  label="Amazon"
                  name="amazon"
                  value={form.amazon}
                  onChange={(v) => setField("amazon", v)}
                  options={YES_NO_OPTIONS}
                  isDarkMode={isDarkMode}
                  disabled={readOnly}
                />
                <FormRadioGroup
                  label="Flipkart"
                  name="flipkart"
                  value={form.flipkart}
                  onChange={(v) => setField("flipkart", v)}
                  options={YES_NO_OPTIONS}
                  isDarkMode={isDarkMode}
                  disabled={readOnly}
                />
                <FormRadioGroup
                  label="PayPal"
                  name="paypal"
                  value={form.paypal}
                  onChange={(v) => setField("paypal", v)}
                  options={YES_NO_OPTIONS}
                  isDarkMode={isDarkMode}
                  disabled={readOnly}
                />
              </div>
            </section>
          </div>
        </TableCard>

        <div className="flex flex-wrap items-center gap-3">
          {showSubmit && !readOnly && (
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Update
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/reward-points/history")}
            className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default RewardSettingsPage;
