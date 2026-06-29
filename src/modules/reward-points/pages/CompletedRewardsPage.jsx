import { useState } from "react";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import RewardDetailsModal from "../components/RewardDetailsModal";

const REWARD_TYPES = ["Registration Reward", "Survey Completion", "Reward Redemption"];

const DEMO_COMMENTS = [
  "Approved after verification of survey completion.",
  "Rejected due to incomplete profile information.",
  "Approved — reward points credited successfully.",
  "Rejected — duplicate reward request detected.",
];

const initialRows = Array.from({ length: 12 }, (_, idx) => ({
  id: `cr-${idx + 1}`,
  userName: `user_${idx + 1}`,
  email: `user_${idx + 1}@example.com`,
  rewardType: REWARD_TYPES[idx % REWARD_TYPES.length],
  rewardPoints: String(750 + idx * 50),
  createdDate: `${String(1 + (idx % 20)).padStart(2, "0")}/05/2026`,
  completedDate: `${String(2 + (idx % 20)).padStart(2, "0")}/05/2026`,
  status: idx % 5 === 0 ? "Rejected" : "Completed",
  comments: DEMO_COMMENTS[idx % DEMO_COMMENTS.length],
}));

function CompletedRewardsPage({ isDarkMode }) {
  const [viewTarget, setViewTarget] = useState(null);

  return (
    <>
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Completed Rewards"
        searchPlaceholder="Search completed rewards..."
        columns={[
          "S.No",
          "User Name",
          "Reward Type",
          "Reward Points",
          "Status",
          "Created Date",
          "Completed Date",
          "Action",
        ]}
        rows={initialRows}
        rowIdKey="id"
        showStatus
        statusAsText
        permissionModule="completed_rewards"
        actionVariant="reward-pending"
        nowrapAllCells
        onView={(row) => setViewTarget(row)}
      />

      <RewardDetailsModal
        isOpen={Boolean(viewTarget)}
        mode="view"
        row={viewTarget}
        onCancel={() => setViewTarget(null)}
      />
    </>
  );
}

export default CompletedRewardsPage;
