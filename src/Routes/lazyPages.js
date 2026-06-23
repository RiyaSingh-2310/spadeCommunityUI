import { lazy } from "react";

/** Auth */
export const LoginPage = lazy(() => import("../pages/Login"));
export const ForgotPasswordPage = lazy(() => import("../pages/ForgotPassword"));
export const VerifyOtpPage = lazy(() => import("../pages/VerifyOtp"));
export const ResetPasswordPage = lazy(() => import("../pages/ResetPassword"));

/** Admin core */
export const DashboardPage = lazy(() => import("../pages/admin/DashboardPage"));
export const UsersPage = lazy(() => import("../pages/admin/UsersPage"));
export const UserFormPage = lazy(() => import("../pages/admin/UserFormPage"));
export const UserPermissionsPage = lazy(() => import("../pages/admin/UserPermissionsPage"));
export const ClientsPage = lazy(() => import("../pages/admin/ClientsPage"));
export const ClientFormPage = lazy(() => import("../pages/admin/ClientFormPage"));

/** Partners */
export const PartnersPage = lazy(() => import("../modules/partners/pages/PartnersPage"));
export const AddPartnerPage = lazy(() => import("../modules/partners/pages/AddPartnerPage"));

/** Project managers */
export const ProjectManagersPage = lazy(
  () => import("../modules/project-managers/pages/ProjectManagersPage")
);
export const AddProjectManagerPage = lazy(
  () => import("../modules/project-managers/pages/AddProjectManagerPage")
);

/** Sales */
export const RfqPage = lazy(() => import("../modules/sales/pages/RfqPage"));
export const AddRfqPage = lazy(() => import("../modules/sales/pages/AddRfqPage"));
export const RfqViewLogListPage = lazy(
  () => import("../modules/sales/pages/RfqViewLogListPage")
);
export const SalesProjectsPage = lazy(
  () => import("../modules/sales/pages/SalesProjectsPage")
);
export const SalesManagerPage = lazy(
  () => import("../modules/sales/pages/SalesManagerPage")
);
export const AddSalesManagerPage = lazy(
  () => import("../modules/sales/pages/AddSalesManagerPage")
);

/** Prescreen */
export const PrescreenGroupPage = lazy(
  () => import("../modules/prescreen/pages/PrescreenGroupPage")
);
export const AddPrescreenGroupPage = lazy(
  () => import("../modules/prescreen/pages/AddPrescreenGroupPage")
);
export const PrescreenPage = lazy(() => import("../modules/prescreen/pages/PrescreenPage"));
export const AddPrescreenPage = lazy(
  () => import("../modules/prescreen/pages/AddPrescreenPage")
);

/** Survey */
export const SurveyPage = lazy(() => import("../modules/survey/pages/SurveyPage"));
export const AddSurveyPage = lazy(() => import("../modules/survey/pages/AddSurveyPage"));
export const EditSurveyPage = lazy(() => import("../modules/survey/pages/EditSurveyPage"));
export const SurveyDetailsPage = lazy(
  () => import("../modules/survey/pages/SurveyDetailsPage")
);
export const SurveySettingsPage = lazy(
  () => import("../modules/survey/pages/SurveySettingsPage")
);
export const GroupSurveyPage = lazy(() => import("../modules/survey/pages/GroupSurveyPage"));
export const AddGroupSurveyPage = lazy(
  () => import("../modules/survey/pages/AddGroupSurveyPage")
);
export const EditGroupSurveyPage = lazy(
  () => import("../modules/survey/pages/EditGroupSurveyPage")
);
export const GroupSurveyDetailsPage = lazy(
  () => import("../modules/survey/pages/GroupSurveyDetailsPage")
);
export const GroupSurveyProjectsListPage = lazy(
  () => import("../modules/survey/pages/GroupSurveyProjectsListPage")
);
export const AddGroupSurveyProjectPage = lazy(
  () => import("../modules/survey/pages/AddGroupSurveyProjectPage")
);
export const RecontactSurveyPage = lazy(
  () => import("../modules/survey/pages/RecontactSurveyPage")
);
export const FindUserPage = lazy(
  () => import("../modules/survey/find-user/pages/FindUserPage")
);
export const UserSurveyDataPage = lazy(
  () => import("../modules/survey/user-survey-data/pages/UserSurveyDataPage")
);

/** Invoice */
export const InvoiceListPage = lazy(() => import("../modules/invoice/pages/InvoiceListPage"));
export const InvoiceSettingsPage = lazy(
  () => import("../modules/invoice/pages/InvoiceSettingsPage")
);

/** Settings & system */
export const SettingsPage = lazy(() => import("../modules/settings/pages/SettingsPage"));
export const LogActivityPage = lazy(() => import("../modules/log-activity/pages/LogActivityPage"));
export const HomePageManagementPage = lazy(
  () => import("../modules/home-page/pages/HomePageManagementPage")
);
export const SystemEmailTemplatePage = lazy(
  () => import("../modules/system-email/pages/SystemEmailTemplatePage")
);
export const EditEmailTemplatePage = lazy(
  () => import("../modules/system-email/pages/EditEmailTemplatePage")
);

/** Notifications & rewards */
export const MessagesPage = lazy(() => import("../modules/notifications/pages/MessagesPage"));
export const PendingRewardsPage = lazy(
  () => import("../modules/reward-points/pages/PendingRewardsPage")
);
export const CompletedRewardsPage = lazy(
  () => import("../modules/reward-points/pages/CompletedRewardsPage")
);
export const RewardSettingsPage = lazy(
  () => import("../modules/reward-points/pages/RewardSettingsPage")
);

/** User screening */
export const QuestionsListPage = lazy(
  () => import("../modules/user-screening/pages/QuestionsListPage")
);
export const SortProfilingQuestionsPage = lazy(
  () => import("../modules/user-screening/pages/SortProfilingQuestionsPage")
);
export const ProfilingQuestionFormPage = lazy(
  () => import("../modules/user-screening/pages/ProfilingQuestionFormPage")
);

/** Community users */
export const CommunityUsersPage = lazy(
  () => import("../modules/community-users/pages/CommunityUsersPage")
);
export const CommunityUserDetailsPage = lazy(
  () => import("../modules/community-users/pages/CommunityUserDetailsPage")
);
export const CommunityUserRewardLogPage = lazy(
  () => import("../modules/community-users/pages/CommunityUserRewardLogPage")
);
export const EditCommunityUserPage = lazy(
  () => import("../modules/community-users/pages/EditCommunityUserPage")
);

/** User email templates */
export const UserEmailTemplatesPage = lazy(
  () => import("../modules/user-email-templates/pages/UserEmailTemplatesPage")
);
export const AddUserEmailTemplatePage = lazy(
  () => import("../modules/user-email-templates/pages/AddUserEmailTemplatePage")
);
export const EditUserEmailTemplatePage = lazy(
  () => import("../modules/user-email-templates/pages/EditUserEmailTemplatePage")
);
