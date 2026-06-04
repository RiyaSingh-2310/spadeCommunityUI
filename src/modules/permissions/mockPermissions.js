import { createDefaultPermissions } from "./permissionsUtils";

/**
 * Temporary mock permissions until API integration.
 * Replace by passing admin.permissions from login / GET user APIs.
 */
export const MOCK_PERMISSIONS = {
  ...createDefaultPermissions(),
  dashboard: { canRead: true, canWrite: true },
  users: { canRead: true, canWrite: true },
  clients: { canRead: true, canWrite: true },
  partners: { canRead: true, canWrite: false },
  project_managers: { canRead: true, canWrite: false },
  sales: { canRead: true, canWrite: false },
  rfq: { canRead: true, canWrite: false },
  sales_manager: { canRead: true, canWrite: false },
  prescreen: { canRead: true, canWrite: false },
  prescreen_group: { canRead: true, canWrite: false },
  survey: { canRead: true, canWrite: false },
  group_survey: { canRead: true, canWrite: false },
  recontact_survey: { canRead: true, canWrite: true },
  survey_settings: { canRead: true, canWrite: false },
  invoice: { canRead: true, canWrite: false },
  invoice_settings: { canRead: true, canWrite: false },
  invoices: { canRead: true, canWrite: false },
  notifications: { canRead: true, canWrite: false },
  messages: { canRead: true, canWrite: false },
  reward_points: { canRead: true, canWrite: false },
  pending_rewards: { canRead: true, canWrite: true },
  completed_rewards: { canRead: true, canWrite: false },
  reward_settings: { canRead: true, canWrite: false },
  user_screening_management: { canRead: true, canWrite: false },
  homepage_management: { canRead: true, canWrite: false },
  system_email_templates: { canRead: true, canWrite: false },
  log_activity: { canRead: true, canWrite: false },
};

/** Set false when API permissions are wired. */
export const USE_MOCK_PERMISSIONS = true;
