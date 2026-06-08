import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import NumericInput from "../../../components/admin/NumericInput";
import FormField from "../../../components/admin/FormField";
import FormRadioGroup from "../../../components/admin/FormRadioGroup";
import TableCard from "../../../components/admin/TableCard";
import { useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getRequiredError, isFormValid } from "../../shared/utils/validation";

const REWARD_SETTINGS_FIELDS = ["registrationReward", "minimumPayout"];

function RewardSettingsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    registrationReward: "200",
    minimumPayout: "1000",
    amazon: "Yes",
    flipkart: "Yes",
    paypal: "Yes",
  });
  const { readOnly, showSubmit } = useFormAccess();
  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      registrationReward: getRequiredError(
        form.registrationReward,
        "User Registration Reward Point"
      ),
      minimumPayout: getRequiredError(form.minimumPayout, "Minimum Payout"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: REWARD_SETTINGS_FIELDS,
  });

  const canSubmit = showSubmit && !readOnly && isFormValid(errors);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (readOnly || !showSubmit || !validateSubmit() || !canSubmit) return;
    navigate("/reward-points/pending");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Reward Settings" isDarkMode={isDarkMode} />
      <TableCard title="User Registration Reward Point" isDarkMode={isDarkMode}>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <FormField
            className="max-w-md"
            label="User Registration Reward Point"
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
            />
          </FormField>

          <div className="border-t pt-6 border-[var(--admin-header-search-border)]">
            <h3 className="admin-text mb-4 text-base font-semibold">User Redeem Point Settings</h3>
            <div className="max-w-md flex flex-col gap-4">
              <FormField
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
                />
              </FormField>
              <FormRadioGroup
                label="Amazon"
                name="amazon"
                value={form.amazon}
                onChange={(v) => setField("amazon", v)}
                options={["Yes", "No"]}
                isDarkMode={isDarkMode}
                disabled={readOnly}
              />
              <FormRadioGroup
                label="Flipkart"
                name="flipkart"
                value={form.flipkart}
                onChange={(v) => setField("flipkart", v)}
                options={["Yes", "No"]}
                isDarkMode={isDarkMode}
                disabled={readOnly}
              />
              <FormRadioGroup
                label="PayPal"
                name="paypal"
                value={form.paypal}
                onChange={(v) => setField("paypal", v)}
                options={["Yes", "No"]}
                isDarkMode={isDarkMode}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {showSubmit && !readOnly && (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit
            </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/reward-points/pending")}
              className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default RewardSettingsPage;
