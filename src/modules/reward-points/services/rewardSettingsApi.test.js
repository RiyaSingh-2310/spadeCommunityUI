import { describe, expect, it } from "vitest";
import {
  buildRewardSettingsPayload,
  mapRewardSettingsToForm,
} from "./rewardSettingsApi";

describe("rewardSettingsApi mapping", () => {
  it("maps GET response data into form fields", () => {
    const form = mapRewardSettingsToForm({
      id: 1,
      registration_reward_points: 50,
      questionnaire_reward_points: 25,
      minimum_payout: "100.00",
      amazon_enabled: true,
      flipkart_enabled: true,
      paypal_enabled: false,
      max_redeem_points: 500,
    });

    expect(form).toEqual({
      id: 1,
      registrationReward: "50",
      questionnaireReward: "25",
      minimumPayout: "100.00",
      maximumRedeemPoints: "500",
      amazon: "Yes",
      flipkart: "Yes",
      paypal: "No",
      tremendous: "No",
    });
  });

  it("maps camelCase maximum redeem aliases from GET data", () => {
    const form = mapRewardSettingsToForm({
      maxRedeemPoints: 250,
    });
    expect(form.maximumRedeemPoints).toBe("250");
  });

  it("builds PUT payload with max_redeem_points", () => {
    const payload = buildRewardSettingsPayload({
      registrationReward: "50",
      questionnaireReward: "25",
      minimumPayout: "100.00",
      maximumRedeemPoints: "500",
      amazon: "Yes",
      flipkart: "Yes",
      paypal: "No",
      tremendous: "Yes",
    });

    expect(payload).toEqual({
      registration_reward_points: 50,
      questionnaire_reward_points: 25,
      minimum_payout: 100,
      max_redeem_points: 500,
      amazon_enabled: true,
      flipkart_enabled: true,
      paypal_enabled: false,
      tremendous_enabled: true,
    });
  });
});
