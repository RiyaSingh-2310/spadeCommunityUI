import { useMemo, useState } from "react";
import AdminDateRangeFilter from "../../../components/admin/AdminDateRangeFilter";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import RewardDetailsModal from "../components/RewardDetailsModal";

const REWARD_TYPES = [
  "Registration Reward",
  "Survey Completion",
  "Referral Bonus",
  "Reward Redemption",
  "Manual Adjustment",
];

const STATUSES = ["Pending", "Completed", "Rejected"];

function buildDemoRow(idx) {
  const rewardType = REWARD_TYPES[idx % REWARD_TYPES.length];
  const points = 100 + idx * 50;
  const isDebit = rewardType === "Reward Redemption";
  const totalRewardCredit = isDebit ? 0 : points;
  const totalRewardDebit = isDebit ? points : 0;

  return {
    id: `rh-${idx + 1}`,
    userName: `user_${idx + 1}`,
    email: `user_${idx + 1}@example.com`,
    rewardType,
    totalRewardCredit: String(totalRewardCredit),
    totalRewardDebit: String(totalRewardDebit),
    totalRewardBalance: String(totalRewardCredit - totalRewardDebit),
    status: STATUSES[idx % STATUSES.length],
    createdAt: `${String(1 + (idx % 28)).padStart(2, "0")}/06/2026`,
    date: `${String(1 + (idx % 28)).padStart(2, "0")}/06/2026`,
  };
}

const DEMO_ROWS = Array.from({ length: 24 }, (_, idx) => buildDemoRow(idx));

function parseDisplayDate(value) {
  if (!value) return null;
  const [day, month, year] = String(value).split("/").map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function RewardHistoryPage({ isDarkMode }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewTarget, setViewTarget] = useState(null);

  const filteredRows = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) {
      to.setHours(23, 59, 59, 999);
    }

    return DEMO_ROWS.filter((row) => {
      const rowDate = parseDisplayDate(row.createdAt);
      if (from && rowDate && rowDate < from) return false;
      if (to && rowDate && rowDate > to) return false;
      return true;
    });
  }, [fromDate, toDate]);

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Reward History"
        searchPlaceholder="Search reward history..."
        columns={[
          "ID",
          "User Name",
          "Reward Type",
          "Total Reward Credit",
          "Total Reward Debit",
          "Total Reward Balance",
          "Status",
          "Created At",
          "Action",
        ]}
        rows={filteredRows}
        rowIdKey="id"
        showStatus
        statusAsText
        permissionModule="reward_history"
        actionVariant="reward-pending"
        nowrapAllCells
        showPagination
        toolbarEnd={
          <AdminDateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
          />
        }
        onView={(row) => setViewTarget(row)}
      />

      <RewardDetailsModal
        isOpen={Boolean(viewTarget)}
        mode="view"
        row={
          viewTarget
            ? {
                ...viewTarget,
                rewardPoints: viewTarget.totalRewardBalance,
                createdDate: viewTarget.createdAt,
              }
            : null
        }
        onCancel={() => setViewTarget(null)}
      />
    </div>
  );
}

export default RewardHistoryPage;
