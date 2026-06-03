import { useState } from "react";
import ModuleListingPage from "../../shared/components/ModuleListingPage";

const SOURCES = ["Amazon", "PayPal", "Flipkart"];

const initialRows = Array.from({ length: 12 }, (_, idx) => ({
  id: `pr-${idx + 1}`,
  username: `user_${idx + 1}`,
  redeemPoints: String(500 + idx * 100),
  redeemFrom: SOURCES[idx % SOURCES.length],
  requestedDate: `${String(1 + (idx % 28)).padStart(2, "0")}/06/2026`,
}));

function PendingRewardsPage({ isDarkMode }) {
  const [rows, setRows] = useState(initialRows);

  const removeRow = (row) => {
    setRows((prev) => prev.filter((item) => item.id !== row.id));
  };

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Pending Rewards"
      searchPlaceholder="Search pending rewards..."
      columns={["S.No", "Username", "Redeem Points", "Redeem From", "Requested Date", "Action"]}
      rows={rows}
      rowIdKey="id"
      showStatus={false}
      actionVariant="reward-pending"
      nowrapAllCells
      onView={(row) => {
        window.alert(
          `${row.username}: ${row.redeemPoints} points via ${row.redeemFrom} (requested ${row.requestedDate})`
        );
      }}
      onApprove={removeRow}
      onReject={removeRow}
    />
  );
}

export default PendingRewardsPage;
