function DetailField({ label, value }) {
  const display = value != null && String(value).trim() !== "" ? String(value) : "—";

  return (
    <div className="min-w-0">
      <p className="admin-text-subtle text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="admin-text mt-1 break-words text-sm">{display}</p>
    </div>
  );
}

function PartnerExpandableDetails({ row }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <DetailField label="Contact Person" value={row.contactPerson} />
      <DetailField label="Panel Size" value={row.panelSize} />
      <DetailField label="Complete URL" value={row.completeUrl} />
      <DetailField label="Terminate URL" value={row.terminateUrl} />
      <DetailField label="Over Quota URL" value={row.overQuotaUrl} />
      <DetailField label="Quality Terms URL" value={row.qualityTermsUrl} />
      <DetailField label="Survey Close URL" value={row.surveyCloseUrl} />
      <DetailField label="API Based URL" value={row.apiBaseUrl} />
      <DetailField label="API Secret Key" value={row.apiSecretKey} />
      <DetailField label="API Body" value={row.apiBody} />
      <div className="min-w-0 sm:col-span-2 lg:col-span-3 xl:col-span-4">
        <DetailField label="About Partner" value={row.aboutPartner} />
      </div>
    </div>
  );
}

export default PartnerExpandableDetails;
