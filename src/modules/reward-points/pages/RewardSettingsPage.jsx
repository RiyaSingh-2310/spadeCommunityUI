import { useMemo, useState } from "react";
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

const REWARD_TYPE_OPTIONS = ["Registration Reward", "Survey Completion Reward"];

const REDEMPTION_METHOD_FIELDS = ["amazon", "flipkart", "paypal"];

const YES_NO_OPTIONS = ["Yes", "No"];

const DEFAULT_FORM = {
  rewardType: "Registration Reward",
  registrationReward: "200",
  surveyCompletionReward: "100",
  minimumPayout: "500",
  amazon: "Yes",
  flipkart: "Yes",
  paypal: "No",
};

function RewardSettingsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(DEFAULT_FORM);
  const { canRead, canWrite, isReadOnly } = useModulePermission("reward_settings");
  const readOnly = isReadOnly;
  const showSubmit = canWrite;
  const inputClass = getAdminInputClass();

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

  const isDirty = useMemo(
    () =>
      ["rewardType", "registrationReward", "surveyCompletionReward", "minimumPayout", ...REDEMPTION_METHOD_FIELDS].some(
        (key) =>
          String(form[key] ?? "").trim() !== String(initialSnapshot[key] ?? "").trim()
      ),
    [form, initialSnapshot]
  );

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isFormValidForFields(errors, validationFields) &&
    isDirty;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (
      readOnly ||
      !showSubmit ||
      !validateSubmit() ||
      !isFormValidForFields(errors, validationFields) ||
      !isDirty
    ) {
      return;
    }

    setInitialSnapshot({ ...form });
  };

  if (!canRead) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
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
              className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
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
