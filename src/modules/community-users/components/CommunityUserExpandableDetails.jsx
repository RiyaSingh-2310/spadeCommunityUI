import CopyValueButton from "../../survey/components/CopyValueButton";

function DetailField({
  label,
  value,
  copyable = false,
  copySuccessMessage,
  ellipsis = false,
}) {
  const display = value != null && String(value).trim() !== "" ? String(value) : "—";
  const canCopy = copyable && display !== "—";
  const showTitle = ellipsis && display !== "—";

  return (
    <div className="min-w-0">
      <p className="admin-text-subtle text-xs font-semibold uppercase tracking-wide">{label}</p>
      <div className="mt-1 flex min-w-0 items-center gap-2">
        <p
          className={`admin-text min-w-0 flex-1 text-sm ${
            ellipsis ? "truncate" : "break-words"
          }`}
          title={showTitle ? display : undefined}
        >
          {display}
        </p>
        {canCopy ? (
          <CopyValueButton
            value={display}
            successMessage={copySuccessMessage || `${label} copied`}
            label={`Copy ${label}`}
            size="inline"
          />
        ) : null}
      </div>
    </div>
  );
}

function CommunityUserExpandableDetails({ row, variant = "listing" }) {
  const listingFields = [
    { label: "Email Verified", value: row.emailVerified },
    { label: "Questionnaire Completed", value: row.prescreenCompleted ?? row.questionnaire },
    { label: "Reward Points", value: row.rewardPoints ?? row.balancePoint },
    { label: "Joining Date", value: row.joiningDate },
    { label: "IP Address", value: row.ipAddress },
  ];

  const detailFields = [
    { label: "ID", value: row.id },
    { label: "Phone", value: row.phone ?? row.mobileNumber },
    { label: "Status", value: row.status },
    { label: "Email Verified", value: row.emailVerified ?? row.isVerified },
    { label: "Reward Points", value: row.rewardPoints ?? row.balancePoint },
    { label: "Joining Date", value: row.joiningDate },
    { label: "Updated At", value: row.updatedDate },
    { label: "Questionnaire Completed", value: row.prescreenCompleted ?? row.questionnaire },
    {
      label: "Questionnaire URL",
      value: row.questionnaireUrl,
      copyable: true,
      copySuccessMessage: "Questionnaire URL copied",
      ellipsis: true,
    },
  ];

  const fields = variant === "detail" ? detailFields : listingFields;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {fields.map((field) => (
        <DetailField
          key={field.label}
          label={field.label}
          value={field.value}
          copyable={field.copyable}
          copySuccessMessage={field.copySuccessMessage}
          ellipsis={field.ellipsis}
        />
      ))}
    </div>
  );
}

export default CommunityUserExpandableDetails;
