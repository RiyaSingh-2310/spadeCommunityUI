function DetailField({ label, value }) {
  const display = value != null && String(value).trim() !== "" ? String(value) : "—";

  return (
    <div className="min-w-0">
      <p className="admin-text-subtle text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="admin-text mt-1 break-words text-sm">{display}</p>
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
    { label: "Questionnaire Completed", value: row.prescreenCompleted ?? row.questionnaire },
    { label: "Reward Points", value: row.rewardPoints ?? row.balancePoint },
    { label: "Joining Date", value: row.joiningDate },
    { label: "Updated At", value: row.updatedDate },
    { label: "Questionnaire URL", value: row.questionnaireUrl },
    { label: "IP Address", value: row.ipAddress },
    { label: "Photo", value: row.photo },
  ];

  const fields = variant === "detail" ? detailFields : listingFields;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {fields.map((field) => (
        <DetailField key={field.label} label={field.label} value={field.value} />
      ))}
    </div>
  );
}

export default CommunityUserExpandableDetails;
