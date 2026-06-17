import { useEffect, useState } from "react";
import { consumeSessionExpiredToast } from "./services/auth/sessionExpiry";
import { Route, Routes, useParams } from "react-router-dom";
import ToastContainer from "./components/shared/ToastContainer";
import GuestOnly from "./components/auth/GuestOnly";
import RequireAuth from "./components/auth/RequireAuth";
import AdminLayout from "./components/admin/AdminLayout";
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ClientFormPage from "./pages/admin/ClientFormPage";
import ClientsPage from "./pages/admin/ClientsPage";
import DashboardPage from "./pages/admin/DashboardPage";
import UserFormPage from "./pages/admin/UserFormPage";
import UserPermissionsPage from "./pages/admin/UserPermissionsPage";
import UsersPage from "./pages/admin/UsersPage";
import InvoiceListPage from "./modules/invoice/pages/InvoiceListPage";
import InvoiceSettingsPage from "./modules/invoice/pages/InvoiceSettingsPage";
import HomePageManagementPage from "./modules/home-page/pages/HomePageManagementPage";
import LogActivityPage from "./modules/log-activity/pages/LogActivityPage";
import MessagesPage from "./modules/notifications/pages/MessagesPage";
import CompletedRewardsPage from "./modules/reward-points/pages/CompletedRewardsPage";
import PendingRewardsPage from "./modules/reward-points/pages/PendingRewardsPage";
import RewardSettingsPage from "./modules/reward-points/pages/RewardSettingsPage";
import EditEmailTemplatePage from "./modules/system-email/pages/EditEmailTemplatePage";
import SystemEmailTemplatePage from "./modules/system-email/pages/SystemEmailTemplatePage";
import ProfilingQuestionFormPage from "./modules/user-screening/pages/ProfilingQuestionFormPage";
import QuestionsListPage from "./modules/user-screening/pages/QuestionsListPage";
import SortProfilingQuestionsPage from "./modules/user-screening/pages/SortProfilingQuestionsPage";
import AddPartnerPage from "./modules/partners/pages/AddPartnerPage";
import PartnersPage from "./modules/partners/pages/PartnersPage";
import AddProjectManagerPage from "./modules/project-managers/pages/AddProjectManagerPage";
import AddPrescreenGroupPage from "./modules/prescreen/pages/AddPrescreenGroupPage";
import AddPrescreenPage from "./modules/prescreen/pages/AddPrescreenPage";
import PrescreenGroupPage from "./modules/prescreen/pages/PrescreenGroupPage";
import PrescreenPage from "./modules/prescreen/pages/PrescreenPage";
import ProjectManagersPage from "./modules/project-managers/pages/ProjectManagersPage";
import AddRfqPage from "./modules/sales/pages/AddRfqPage";
import AddSalesManagerPage from "./modules/sales/pages/AddSalesManagerPage";
import RfqPage from "./modules/sales/pages/RfqPage";
import RfqViewLogListPage from "./modules/sales/pages/RfqViewLogListPage";
import SalesProjectsPage from "./modules/sales/pages/SalesProjectsPage";
import SalesManagerPage from "./modules/sales/pages/SalesManagerPage";
import AddGroupSurveyPage from "./modules/survey/pages/AddGroupSurveyPage";
import EditGroupSurveyPage from "./modules/survey/pages/EditGroupSurveyPage";
import AddGroupSurveyProjectPage from "./modules/survey/pages/AddGroupSurveyProjectPage";
import GroupSurveyProjectsListPage from "./modules/survey/pages/GroupSurveyProjectsListPage";
import AddSurveyPage from "./modules/survey/pages/AddSurveyPage";
import EditSurveyPage from "./modules/survey/pages/EditSurveyPage";
import GroupSurveyDetailsPage from "./modules/survey/pages/GroupSurveyDetailsPage";
import GroupSurveyPage from "./modules/survey/pages/GroupSurveyPage";
import RecontactSurveyPage from "./modules/survey/pages/RecontactSurveyPage";
import FindUserPage from "./modules/survey/find-user/pages/FindUserPage";
import UserSurveyDataPage from "./modules/survey/user-survey-data/pages/UserSurveyDataPage";
import SurveyDetailsPage from "./modules/survey/pages/SurveyDetailsPage";
import SurveyPage from "./modules/survey/pages/SurveyPage";
import SurveySettingsPage from "./modules/survey/pages/SurveySettingsPage";

function UserFormEditRoute({ isDarkMode }) {
  const { id } = useParams();
  return <UserFormPage key={id} isDarkMode={isDarkMode} mode="edit" />;
}

function ClientFormEditRoute({ isDarkMode }) {
  const { id } = useParams();
  return <ClientFormPage key={id} isDarkMode={isDarkMode} mode="edit" />;
}

function ProfilingQuestionEditRoute({ isDarkMode }) {
  const { id } = useParams();
  return <ProfilingQuestionFormPage key={id} isDarkMode={isDarkMode} mode="edit" />;
}

function EditEmailTemplateRoute({ isDarkMode }) {
  const { id } = useParams();
  return <EditEmailTemplatePage key={id} isDarkMode={isDarkMode} />;
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    consumeSessionExpiredToast();
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <>
      <ToastContainer isDarkMode={isDarkMode} />
      <Routes>
      <Route element={<GuestOnly />}>
        <Route
          path="/auth"
          element={<Login isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/auth/forgot-password"
          element={
            <ForgotPassword isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
          }
        />
        <Route
          path="/auth/verify-otp"
          element={<VerifyOtp isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/auth/reset-password"
          element={
            <ResetPassword isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
          }
        />
      </Route>

      <Route element={<RequireAuth />}>
        <Route
          element={<AdminLayout isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
        >
        <Route path="/" element={<DashboardPage isDarkMode={isDarkMode} />} />
        <Route path="/users" element={<UsersPage isDarkMode={isDarkMode} />} />
        <Route path="/users/add" element={<UserFormPage isDarkMode={isDarkMode} mode="add" />} />
        <Route path="/users/edit/:id" element={<UserFormEditRoute isDarkMode={isDarkMode} />} />
        <Route
          path="/users/:id/permissions"
          element={<UserPermissionsPage isDarkMode={isDarkMode} />}
        />
        <Route path="/clients" element={<ClientsPage isDarkMode={isDarkMode} />} />
        <Route path="/clients/add" element={<ClientFormPage isDarkMode={isDarkMode} mode="add" />} />
        <Route path="/clients/edit/:id" element={<ClientFormEditRoute isDarkMode={isDarkMode} />} />
        <Route path="/partners" element={<PartnersPage isDarkMode={isDarkMode} />} />
        <Route path="/partners/add" element={<AddPartnerPage isDarkMode={isDarkMode} />} />
        <Route path="/partners/edit/:id" element={<AddPartnerPage isDarkMode={isDarkMode} />} />
        <Route path="/project-managers" element={<ProjectManagersPage isDarkMode={isDarkMode} />} />
        <Route path="/project-managers/add" element={<AddProjectManagerPage isDarkMode={isDarkMode} />} />
        <Route
          path="/project-managers/edit/:id"
          element={<AddProjectManagerPage isDarkMode={isDarkMode} />}
        />
        <Route path="/sales/rfq" element={<RfqPage isDarkMode={isDarkMode} />} />
        <Route path="/sales/rfq/add" element={<AddRfqPage isDarkMode={isDarkMode} />} />
        <Route
          path="/sales/rfq/logs/:projectId"
          element={<RfqViewLogListPage isDarkMode={isDarkMode} />}
        />
        <Route path="/sales/rfq/edit/:id" element={<AddRfqPage isDarkMode={isDarkMode} />} />
        <Route path="/sales/projects" element={<SalesProjectsPage isDarkMode={isDarkMode} />} />
        <Route
          path="/sales/projects/view/:id"
          element={<SurveyDetailsPage isDarkMode={isDarkMode} salesViewMode />}
        />
        <Route path="/sales/sales-manager" element={<SalesManagerPage isDarkMode={isDarkMode} />} />
        <Route path="/sales/sales-manager/add" element={<AddSalesManagerPage isDarkMode={isDarkMode} />} />
        <Route
          path="/sales/sales-manager/edit/:id"
          element={<AddSalesManagerPage isDarkMode={isDarkMode} />}
        />
        <Route path="/prescreen/group" element={<PrescreenGroupPage isDarkMode={isDarkMode} />} />
        <Route path="/prescreen/group/add" element={<AddPrescreenGroupPage isDarkMode={isDarkMode} />} />
        <Route
          path="/prescreen/group/edit/:id"
          element={<AddPrescreenGroupPage isDarkMode={isDarkMode} />}
        />
        <Route path="/prescreen" element={<PrescreenPage isDarkMode={isDarkMode} />} />
        <Route path="/prescreen/add" element={<AddPrescreenPage isDarkMode={isDarkMode} />} />
        <Route path="/prescreen/edit/:id" element={<AddPrescreenPage isDarkMode={isDarkMode} />} />
        <Route path="/survey" element={<SurveyPage isDarkMode={isDarkMode} />} />
        <Route path="/survey/add" element={<AddSurveyPage isDarkMode={isDarkMode} />} />
        <Route
          path="/survey/:id/find-user"
          element={<FindUserPage isDarkMode={isDarkMode} />}
        />
        <Route
          path="/survey/:id/user-survey-data"
          element={<UserSurveyDataPage isDarkMode={isDarkMode} />}
        />
        <Route path="/survey/view/:id" element={<SurveyDetailsPage isDarkMode={isDarkMode} />} />
        <Route path="/survey/edit/:id" element={<EditSurveyPage isDarkMode={isDarkMode} />} />
        <Route path="/survey/group" element={<GroupSurveyPage isDarkMode={isDarkMode} />} />
        <Route path="/survey/group/add" element={<AddGroupSurveyPage isDarkMode={isDarkMode} />} />
        <Route
          path="/survey/group/:groupId/add-project"
          element={<AddGroupSurveyProjectPage isDarkMode={isDarkMode} />}
        />
        <Route
          path="/survey/group/:groupId/projects"
          element={<GroupSurveyProjectsListPage isDarkMode={isDarkMode} />}
        />
        <Route
          path="/survey/group/view/:id"
          element={<GroupSurveyDetailsPage isDarkMode={isDarkMode} />}
        />
        <Route
          path="/survey/group/edit/:id"
          element={<EditGroupSurveyPage isDarkMode={isDarkMode} />}
        />
        <Route path="/survey/recontact" element={<RecontactSurveyPage isDarkMode={isDarkMode} />} />
        <Route path="/survey/settings" element={<SurveySettingsPage isDarkMode={isDarkMode} />} />
        <Route path="/invoice/list" element={<InvoiceListPage isDarkMode={isDarkMode} />} />
        <Route path="/invoice/settings" element={<InvoiceSettingsPage isDarkMode={isDarkMode} />} />
        <Route path="/log-activity" element={<LogActivityPage isDarkMode={isDarkMode} />} />
        <Route path="/notifications/messages" element={<MessagesPage isDarkMode={isDarkMode} />} />
        <Route path="/reward-points/pending" element={<PendingRewardsPage isDarkMode={isDarkMode} />} />
        <Route path="/reward-points/completed" element={<CompletedRewardsPage isDarkMode={isDarkMode} />} />
        <Route path="/reward-points/settings" element={<RewardSettingsPage isDarkMode={isDarkMode} />} />
        <Route path="/user-screening/questions" element={<QuestionsListPage isDarkMode={isDarkMode} />} />
        <Route
          path="/user-screening/questions/sort"
          element={<SortProfilingQuestionsPage isDarkMode={isDarkMode} />}
        />
        <Route
          path="/user-screening/questions/add"
          element={<ProfilingQuestionFormPage isDarkMode={isDarkMode} mode="add" />}
        />
        <Route
          path="/user-screening/questions/edit/:id"
          element={<ProfilingQuestionEditRoute isDarkMode={isDarkMode} />}
        />
        <Route path="/home-page" element={<HomePageManagementPage isDarkMode={isDarkMode} />} />
        <Route path="/system-email" element={<SystemEmailTemplatePage isDarkMode={isDarkMode} />} />
        <Route
          path="/system-email/edit/:id"
          element={<EditEmailTemplateRoute isDarkMode={isDarkMode} />}
        />
        </Route>
      </Route>
    </Routes>
    </>
  );
}

export default App;