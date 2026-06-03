import ModuleListingPage from "../../shared/components/ModuleListingPage";

const SOURCES = ["Amazon", "PayPal", "Flipkart"];

const rows = Array.from({ length: 12 }, (_, idx) => ({
  id: `cr-${idx + 1}`,
  username: `user_${idx + 1}`,
  redeemPoints: String(750 + idx * 50),
  redeemFrom: SOURCES[idx % SOURCES.length],
  status: idx % 5 === 0 ? "Rejected" : "Completed",
  requestedDate: `${String(1 + (idx % 20)).padStart(2, "0")}/05/2026`,
  actionTakenOn: `${String(2 + (idx % 20)).padStart(2, "0")}/05/2026`,
}));

function CompletedRewardsPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Completed Rewards"
      searchPlaceholder="Search completed rewards..."
      columns={[
        "S.No",
        "Username",
        "Redeem Points",
        "Redeem From",
        "Status",
        "Requested Date",
        "Action Taken On",
        "Details",
      ]}
      rows={rows}
      rowIdKey="id"
      showStatus
      statusAsText
      nowrapAllCells
      onView={(row) => {
        window.alert(
          `${row.username}: ${row.redeemPoints} points — ${row.status} (${row.redeemFrom})`
        );
      }}
    />
  );
}

export default CompletedRewardsPage;
