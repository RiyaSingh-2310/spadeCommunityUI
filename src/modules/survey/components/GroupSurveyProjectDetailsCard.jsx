import TableCard from "../../../components/admin/TableCard";
import { formatStatusLabel } from "../../shared/utils/statusLabels";
import { DetailField, DetailGrid } from "./surveyDetailsShared";

function GroupSurveyProjectDetailsCard({ details, isDarkMode }) {
  if (!details) return null;

  return (
    <TableCard title="Group Project Details" isDarkMode={isDarkMode}>
      <DetailGrid>
        <DetailField label="Project Name" value={details.projectName} />
        <DetailField label="Client Name" value={details.clientName} />
        <DetailField label="Status" value={formatStatusLabel(details.status)} />
        <DetailField label="Created Date" value={details.createdAt} />
        <DetailField
          label="Description"
          value={details.description}
          className="sm:col-span-2"
        />
        {details.notes ? (
          <DetailField label="Notes" value={details.notes} className="sm:col-span-2" />
        ) : null}
      </DetailGrid>
    </TableCard>
  );
}

export default GroupSurveyProjectDetailsCard;
