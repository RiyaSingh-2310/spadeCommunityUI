import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/admin/AdminLayout";
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ClientFormPage from "./pages/admin/ClientFormPage";
import ClientsPage from "./pages/admin/ClientsPage";
import DashboardPage from "./pages/admin/DashboardPage";
import UserFormPage from "./pages/admin/UserFormPage";
import UsersPage from "./pages/admin/UsersPage";
import InvoiceListPage from "./modules/invoice/pages/InvoiceListPage";
import InvoiceSettingsPage from "./modules/invoice/pages/InvoiceSettingsPage";
import LogActivityPage from "./modules/log-activity/pages/LogActivityPage";
import AddPartnerPage from "./modules/partners/pages/AddPartnerPage";
import PartnersPage from "./modules/partners/pages/PartnersPage";
import AddProjectManagerPage from "./modules/project-managers/pages/AddProjectManagerPage";
import PrescreenGroupPage from "./modules/prescreen/pages/PrescreenGroupPage";
import PrescreenPage from "./modules/prescreen/pages/PrescreenPage";
import ProjectManagersPage from "./modules/project-managers/pages/ProjectManagersPage";
import AddRfqPage from "./modules/sales/pages/AddRfqPage";
import AddSalesManagerPage from "./modules/sales/pages/AddSalesManagerPage";
import RfqPage from "./modules/sales/pages/RfqPage";
import SalesManagerPage from "./modules/sales/pages/SalesManagerPage";
import GroupSurveyPage from "./modules/survey/pages/GroupSurveyPage";
import RecontactSurveyPage from "./modules/survey/pages/RecontactSurveyPage";
import SurveyPage from "./modules/survey/pages/SurveyPage";
import SurveySettingsPage from "./modules/survey/pages/SurveySettingsPage";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <Routes>
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

      <Route
        element={<AdminLayout isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />}
      >
        <Route path="/" element={<DashboardPage isDarkMode={isDarkMode} />} />
        <Route path="/users" element={<UsersPage isDarkMode={isDarkMode} />} />
        <Route path="/users/add" element={<UserFormPage isDarkMode={isDarkMode} mode="add" />} />
        <Route path="/users/edit/:id" element={<UserFormPage isDarkMode={isDarkMode} mode="edit" />} />
        <Route path="/clients" element={<ClientsPage isDarkMode={isDarkMode} />} />
        <Route path="/clients/add" element={<ClientFormPage isDarkMode={isDarkMode} mode="add" />} />
        <Route path="/clients/edit/:id" element={<ClientFormPage isDarkMode={isDarkMode} mode="edit" />} />
        <Route path="/partners" element={<PartnersPage isDarkMode={isDarkMode} />} />
        <Route path="/partners/add" element={<AddPartnerPage isDarkMode={isDarkMode} />} />
        <Route path="/project-managers" element={<ProjectManagersPage isDarkMode={isDarkMode} />} />
        <Route path="/project-managers/add" element={<AddProjectManagerPage isDarkMode={isDarkMode} />} />
        <Route path="/sales/rfq" element={<RfqPage isDarkMode={isDarkMode} />} />
        <Route path="/sales/rfq/add" element={<AddRfqPage isDarkMode={isDarkMode} />} />
        <Route path="/sales/sales-manager" element={<SalesManagerPage isDarkMode={isDarkMode} />} />
        <Route path="/sales/sales-manager/add" element={<AddSalesManagerPage isDarkMode={isDarkMode} />} />
        <Route path="/prescreen/group" element={<PrescreenGroupPage isDarkMode={isDarkMode} />} />
        <Route path="/prescreen" element={<PrescreenPage isDarkMode={isDarkMode} />} />
        <Route path="/survey" element={<SurveyPage isDarkMode={isDarkMode} />} />
        <Route path="/survey/group" element={<GroupSurveyPage isDarkMode={isDarkMode} />} />
        <Route path="/survey/recontact" element={<RecontactSurveyPage isDarkMode={isDarkMode} />} />
        <Route path="/survey/settings" element={<SurveySettingsPage isDarkMode={isDarkMode} />} />
        <Route path="/invoice/list" element={<InvoiceListPage isDarkMode={isDarkMode} />} />
        <Route path="/invoice/settings" element={<InvoiceSettingsPage isDarkMode={isDarkMode} />} />
        <Route path="/log-activity" element={<LogActivityPage isDarkMode={isDarkMode} />} />
      </Route>
    </Routes>
  );
}

export default App;