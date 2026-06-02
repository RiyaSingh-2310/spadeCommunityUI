import AdminPageHeader from "../../components/admin/AdminPageHeader";
import TableCard from "../../components/admin/TableCard";

function ComingSoonPage({ isDarkMode, title }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader title={title} isDarkMode={isDarkMode} />
      <TableCard title={title} isDarkMode={isDarkMode}>
        <p className={`text-sm ${isDarkMode ? "text-[#9fb0c8]" : "text-[#6f8098]"}`}>
          {title} Module Coming Soon
        </p>
      </TableCard>
    </div>
  );
}

export default ComingSoonPage;
