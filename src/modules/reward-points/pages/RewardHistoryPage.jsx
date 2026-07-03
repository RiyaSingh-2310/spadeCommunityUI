import { useMemo, useState } from "react";
import AdminDateRangeFilter from "../../../components/admin/AdminDateRangeFilter";
import ModuleListingPage from "../../shared/components/ModuleListingPage";

const REWARD_TYPES = [
  "Registration Reward",
  "Survey Completion",
  "Referral Bonus",
  "Reward Redemption",
  "Manual Adjustment",
];

const STATUS_OPTIONS = ["Approved", "Rejected"];

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
    status: STATUS_OPTIONS[idx % STATUS_OPTIONS.length],
    createdAt: `${String(1 + (idx % 28)).padStart(2, "0")}/06/2026`,
    date: `${String(1 + (idx % 28)).padStart(2, "0")}/06/2026`,
  };
}

const INITIAL_ROWS = Array.from({ length: 24 }, (_, idx) => buildDemoRow(idx));

function parseDisplayDate(value) {
  if (!value) return null;
  const [day, month, year] = String(value).split("/").map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function RewardHistoryPage({ isDarkMode }) {
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredRows = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) {
      to.setHours(23, 59, 59, 999);
    }

    return rows.filter((row) => {
      const rowDate = parseDisplayDate(row.createdAt);
      if (from && rowDate && rowDate < from) return false;
      if (to && rowDate && rowDate > to) return false;
      return true;
    });
  }, [fromDate, toDate, rows]);

  const handleStatusChange = (row, nextStatus) => {
    if (!row?.id) return;
    setRows((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, status: nextStatus } : item))
    );
  };

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Reward Request"
        searchPlaceholder="Search reward requests..."
        columns={[
          "ID",
          "User Name",
          "Reward Type",
          "Credit",
          "Debit",
          "Balance",
          "Status",
          "Created At",
        ]}
        rows={filteredRows}
        rowIdKey="id"
        showStatus
        statusDropdownOptions={STATUS_OPTIONS}
        onStatusChange={handleStatusChange}
        permissionModule="reward_history"
        nowrapAllCells
        compactTable
        compactStatusColumn
        showPagination
        toolbarEnd={
          <AdminDateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
          />
        }
      />
    </div>
  );
}

export default RewardHistoryPage;
