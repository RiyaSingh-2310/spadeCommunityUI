function DetailField({ label, value }) {
  const display = value != null && String(value).trim() !== "" ? String(value) : "—";

  return (
    <div className="min-w-0">
      <p className="admin-text-subtle text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="admin-text mt-1 break-words text-sm">{display}</p>
    </div>
  );
}

function CommunityUserExpandableDetails({ row }) {
  const fields = [
    { label: "Email Verified", value: row.emailVerified },
    { label: "Questionnaire Completed", value: row.prescreenCompleted },
    { label: "Reward Points", value: row.rewardPoints },
    { label: "Joining Date", value: row.joiningDate },
    { label: "IP Address", value: row.ipAddress },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {fields.map((field) => (
        <DetailField key={field.label} label={field.label} value={field.value} />
      ))}
    </div>
  );
}

export default CommunityUserExpandableDetails;
