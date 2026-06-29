import { Suspense } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import PageLoader from "../components/shared/PageLoader";
import GuestOnly from "../components/auth/GuestOnly";
import RequireAuth from "../components/auth/RequireAuth";
import AdminLayout from "../components/admin/AdminLayout";
import * as Pages from "./lazyPages";

function withSuspense(Component, props = {}) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component {...props} />
    </Suspense>
  );
}

function UserFormEditRoute({ isDarkMode }) {
  const { id } = useParams();
  return withSuspense(Pages.UserFormPage, { key: id, isDarkMode, mode: "edit" });
}

function ClientFormEditRoute({ isDarkMode }) {
  const { id } = useParams();
  return withSuspense(Pages.ClientFormPage, { key: id, isDarkMode, mode: "edit" });
}

function ProfilingQuestionEditRoute({ isDarkMode }) {
  const { id } = useParams();
  return withSuspense(Pages.ProfilingQuestionFormPage, {
    key: id,
    isDarkMode,
    mode: "edit",
  });
}

function CreateSurveyEditRoute({ isDarkMode }) {
  const { id } = useParams();
  return withSuspense(Pages.CreateSurveyFormPage, {
    key: id,
    isDarkMode,
    mode: "edit",
  });
}

function PanelSurveyEditRoute({ isDarkMode }) {
  const { id } = useParams();
  return withSuspense(Pages.PanelSurveyFormPage, {
    key: id,
    isDarkMode,
    mode: "edit",
  });
}

function EditEmailTemplateRoute({ isDarkMode }) {
  const { id } = useParams();
  return withSuspense(Pages.EditEmailTemplatePage, { key: id, isDarkMode });
}

function EditUserEmailTemplateRoute({ isDarkMode }) {
  const { id } = useParams();
  return withSuspense(Pages.EditUserEmailTemplatePage, { key: id, isDarkMode });
}

function EditCommunityUserRoute({ isDarkMode }) {
  const { id } = useParams();
  return withSuspense(Pages.EditCommunityUserPage, { key: id, isDarkMode });
}

function AppRoutes({ isDarkMode, onToggleTheme }) {
  const themeProps = { isDarkMode, onToggleTheme };

  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/auth" element={withSuspense(Pages.LoginPage, themeProps)} />
        <Route
          path="/auth/forgot-password"
          element={withSuspense(Pages.ForgotPasswordPage, themeProps)}
        />
        <Route path="/auth/verify-otp" element={withSuspense(Pages.VerifyOtpPage, themeProps)} />
        <Route
          path="/auth/reset-password"
          element={withSuspense(Pages.ResetPasswordPage, themeProps)}
        />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />}>
          <Route path="/" element={withSuspense(Pages.DashboardPage, { isDarkMode })} />
          <Route path="/users" element={withSuspense(Pages.UsersPage, { isDarkMode })} />
          <Route
            path="/users/add"
            element={withSuspense(Pages.UserFormPage, { isDarkMode, mode: "add" })}
          />
          <Route
            path="/users/edit/:id"
            element={<UserFormEditRoute isDarkMode={isDarkMode} />}
          />
          <Route
            path="/users/:id/permissions"
            element={withSuspense(Pages.UserPermissionsPage, { isDarkMode })}
          />
          <Route path="/clients" element={withSuspense(Pages.ClientsPage, { isDarkMode })} />
          <Route
            path="/clients/add"
            element={withSuspense(Pages.ClientFormPage, { isDarkMode, mode: "add" })}
          />
          <Route
            path="/clients/edit/:id"
            element={<ClientFormEditRoute isDarkMode={isDarkMode} />}
          />
          <Route path="/partners" element={withSuspense(Pages.PartnersPage, { isDarkMode })} />
          <Route
            path="/partners/add"
            element={withSuspense(Pages.AddPartnerPage, { isDarkMode })}
          />
          <Route
            path="/partners/edit/:id"
            element={withSuspense(Pages.AddPartnerPage, { isDarkMode })}
          />
          <Route
            path="/project-managers"
            element={withSuspense(Pages.ProjectManagersPage, { isDarkMode })}
          />
          <Route
            path="/project-managers/add"
            element={withSuspense(Pages.AddProjectManagerPage, { isDarkMode })}
          />
          <Route
            path="/project-managers/edit/:id"
            element={withSuspense(Pages.AddProjectManagerPage, { isDarkMode })}
          />
          <Route path="/sales/rfq" element={withSuspense(Pages.RfqPage, { isDarkMode })} />
          <Route path="/sales/rfq/add" element={withSuspense(Pages.AddRfqPage, { isDarkMode })} />
          <Route
            path="/sales/rfq/logs/:projectId"
            element={withSuspense(Pages.RfqViewLogListPage, { isDarkMode })}
          />
          <Route
            path="/sales/rfq/edit/:id"
            element={withSuspense(Pages.AddRfqPage, { isDarkMode })}
          />
          <Route
            path="/sales/projects"
            element={withSuspense(Pages.SalesProjectsPage, { isDarkMode })}
          />
          <Route
            path="/sales/projects/view/:id"
            element={withSuspense(Pages.SurveyDetailsPage, { isDarkMode, salesViewMode: true })}
          />
          <Route
            path="/sales/sales-manager"
            element={withSuspense(Pages.SalesManagerPage, { isDarkMode })}
          />
          <Route
            path="/sales/sales-manager/add"
            element={withSuspense(Pages.AddSalesManagerPage, { isDarkMode })}
          />
          <Route
            path="/sales/sales-manager/edit/:id"
            element={withSuspense(Pages.AddSalesManagerPage, { isDarkMode })}
          />
          <Route
            path="/prescreen/group"
            element={withSuspense(Pages.PrescreenGroupPage, { isDarkMode })}
          />
          <Route
            path="/prescreen/group/add"
            element={withSuspense(Pages.AddPrescreenGroupPage, { isDarkMode })}
          />
          <Route
            path="/prescreen/group/edit/:id"
            element={withSuspense(Pages.AddPrescreenGroupPage, { isDarkMode })}
          />
          <Route path="/prescreen" element={withSuspense(Pages.PrescreenPage, { isDarkMode })} />
          <Route
            path="/prescreen/add"
            element={withSuspense(Pages.AddPrescreenPage, { isDarkMode })}
          />
          <Route
            path="/prescreen/edit/:id"
            element={withSuspense(Pages.AddPrescreenPage, { isDarkMode })}
          />
          <Route path="/survey" element={withSuspense(Pages.SurveyPage, { isDarkMode })} />
          <Route path="/survey/add" element={withSuspense(Pages.AddSurveyPage, { isDarkMode })} />
          <Route
            path="/survey/:id/find-user"
            element={withSuspense(Pages.FindUserPage, { isDarkMode })}
          />
          <Route
            path="/survey/group/:groupId/projects/:id/find-user"
            element={withSuspense(Pages.FindUserPage, { isDarkMode })}
          />
          <Route
            path="/survey/:id/user-survey-data"
            element={withSuspense(Pages.UserSurveyDataPage, { isDarkMode })}
          />
          <Route
            path="/survey/group/:groupId/projects/:id/user-survey-data"
            element={withSuspense(Pages.UserSurveyDataPage, { isDarkMode })}
          />
          <Route
            path="/survey/view/:id"
            element={withSuspense(Pages.SurveyDetailsPage, { isDarkMode })}
          />
          <Route
            path="/survey/group/:groupId/projects/view/:id"
            element={withSuspense(Pages.SurveyDetailsPage, { isDarkMode })}
          />
          <Route
            path="/survey/edit/:id"
            element={withSuspense(Pages.EditSurveyPage, { isDarkMode })}
          />
          <Route path="/survey/group" element={withSuspense(Pages.GroupSurveyPage, { isDarkMode })} />
          <Route
            path="/survey/group/add"
            element={withSuspense(Pages.AddGroupSurveyPage, { isDarkMode })}
          />
          <Route
            path="/survey/group/:groupId/add-project"
            element={withSuspense(Pages.AddGroupSurveyProjectPage, { isDarkMode })}
          />
          <Route
            path="/survey/group/:groupId/projects"
            element={withSuspense(Pages.GroupSurveyProjectsListPage, { isDarkMode })}
          />
          <Route
            path="/survey/group/view/:id"
            element={withSuspense(Pages.GroupSurveyDetailsPage, { isDarkMode })}
          />
          <Route
            path="/survey/group/edit/:id"
            element={withSuspense(Pages.EditGroupSurveyPage, { isDarkMode })}
          />
          <Route
            path="/survey/recontact"
            element={withSuspense(Pages.RecontactSurveyPage, { isDarkMode })}
          />
          <Route
            path="/survey/settings"
            element={withSuspense(Pages.SurveySettingsPage, { isDarkMode })}
          />
          <Route path="/invoice/list" element={withSuspense(Pages.InvoiceListPage, { isDarkMode })} />
          <Route
            path="/invoice/settings"
            element={withSuspense(Pages.InvoiceSettingsPage, { isDarkMode })}
          />
          <Route path="/settings" element={withSuspense(Pages.SettingsPage, { isDarkMode })} />
          <Route path="/log-activity" element={withSuspense(Pages.LogActivityPage, { isDarkMode })} />
          <Route
            path="/community-users"
            element={withSuspense(Pages.CommunityUsersPage, { isDarkMode })}
          />
          <Route
            path="/community-users/edit/:id"
            element={<EditCommunityUserRoute isDarkMode={isDarkMode} />}
          />
          <Route
            path="/community-users/:id/reward-log"
            element={withSuspense(Pages.CommunityUserRewardLogPage, { isDarkMode })}
          />
          <Route
            path="/community-users/:id"
            element={withSuspense(Pages.CommunityUserDetailsPage, { isDarkMode })}
          />
          <Route
            path="/user-email-templates/add"
            element={withSuspense(Pages.AddUserEmailTemplatePage, { isDarkMode })}
          />
          <Route
            path="/user-email-templates/edit/:id"
            element={<EditUserEmailTemplateRoute isDarkMode={isDarkMode} />}
          />
          <Route
            path="/user-email-templates"
            element={withSuspense(Pages.UserEmailTemplatesPage, { isDarkMode })}
          />
          <Route
            path="/notifications/messages"
            element={withSuspense(Pages.MessagesPage, { isDarkMode })}
          />
          <Route
            path="/reward-points/history"
            element={withSuspense(Pages.RewardHistoryPage, { isDarkMode })}
          />
          <Route
            path="/reward-points/pending"
            element={withSuspense(Pages.PendingRewardsPage, { isDarkMode })}
          />
          <Route
            path="/reward-points/completed"
            element={withSuspense(Pages.CompletedRewardsPage, { isDarkMode })}
          />
          <Route
            path="/reward-points/settings"
            element={withSuspense(Pages.RewardSettingsPage, { isDarkMode })}
          />
          <Route
            path="/user-screening/questions"
            element={withSuspense(Pages.QuestionsListPage, { isDarkMode })}
          />
          <Route
            path="/user-screening/questions/sort"
            element={withSuspense(Pages.SortProfilingQuestionsPage, { isDarkMode })}
          />
          <Route
            path="/user-screening/questions/add"
            element={withSuspense(Pages.ProfilingQuestionFormPage, { isDarkMode, mode: "add" })}
          />
          <Route
            path="/user-screening/questions/edit/:id"
            element={<ProfilingQuestionEditRoute isDarkMode={isDarkMode} />}
          />
          <Route
            path="/user-screening/create-survey"
            element={withSuspense(Pages.CreateSurveyListPage, { isDarkMode })}
          />
          <Route
            path="/user-screening/create-survey/add"
            element={withSuspense(Pages.CreateSurveyFormPage, { isDarkMode, mode: "add" })}
          />
          <Route
            path="/user-screening/create-survey/edit/:id"
            element={<CreateSurveyEditRoute isDarkMode={isDarkMode} />}
          />
          <Route
            path="/user-screening/panel-survey"
            element={withSuspense(Pages.PanelSurveyListPage, { isDarkMode })}
          />
          <Route
            path="/user-screening/panel-survey/add"
            element={withSuspense(Pages.PanelSurveyFormPage, { isDarkMode, mode: "add" })}
          />
          <Route
            path="/user-screening/panel-survey/edit/:id"
            element={<PanelSurveyEditRoute isDarkMode={isDarkMode} />}
          />
          <Route
            path="/home-page"
            element={withSuspense(Pages.HomePageManagementPage, { isDarkMode })}
          />
          <Route
            path="/system-email"
            element={withSuspense(Pages.SystemEmailTemplatePage, { isDarkMode })}
          />
          <Route
            path="/system-email/edit/:id"
            element={<EditEmailTemplateRoute isDarkMode={isDarkMode} />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
