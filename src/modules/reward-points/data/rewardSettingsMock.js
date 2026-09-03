/**
 * Frontend-only mock defaults for Reward Settings.
 * Replace with API mapping when backend integration is added.
 */

export const DEFAULT_REWARD_SETTINGS_FORM = {
  registrationReward: "200",
  minimumPayout: "1000",
  amazon: "Yes",
  flipkart: "Yes",
  paypal: "Yes",
};

export function createRewardSettingsForm(overrides = {}) {
  return {
    ...DEFAULT_REWARD_SETTINGS_FORM,
    ...overrides,
  };
}
