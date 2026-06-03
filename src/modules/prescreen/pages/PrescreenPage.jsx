import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";

const TITLES = [
  "Are you a human respondent?",
  "Select your country of residence",
  "Confirm age eligibility",
  "Captcha validation question",
  "Industry screening question",
  "Language preference check",
];

const rows = Array.from({ length: 12 }, (_, idx) => ({
  id: `ps-${idx + 1}`,
  title: TITLES[idx % TITLES.length],
  language: ["English", "Arabic", "German", "French"][idx % 4],
  rightAnswer: ["Yes", "UAE", "18+", "Verified", "Tech", "English"][idx % 6],
  status: idx % 5 === 0 ? "Inactive" : "Active",
}));

function PrescreenPage({ isDarkMode }) {
  const navigate = useNavigate();

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Prescreen"
      searchPlaceholder="Search prescreens..."
      actionLabel="Add Prescreen"
      onActionClick={() => navigate("/prescreen/add")}
      columns={["S.No", "Title", "Language", "Right Answer", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      nowrapAllCells
    />
  );
}

export default PrescreenPage;
