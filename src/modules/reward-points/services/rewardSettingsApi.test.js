import { describe, expect, it } from "vitest";
import {
  buildRewardSettingsPayload,
  mapRewardSettingsToForm,
} from "./rewardSettingsApi";

describe("rewardSettingsApi mapping", () => {
  it("maps GET response data into form fields", () => {
    const form = mapRewardSettingsToForm({
      id: 1,
      registration_reward_points: 100,
      minimum_payout: "100.00",
      maximum_redeem_points: "500.00",
      amazon_enabled: true,
      flipkart_enabled: true,
      paypal_enabled: false,
    });

    expect(form).toEqual({
      id: 1,
      registrationReward: "100",
      minimumPayout: "100.00",
      maximumRedeemPoints: "500.00",
      amazon: "Yes",
      flipkart: "Yes",
      paypal: "No",
    });
  });

  it("maps camelCase maximum redeem aliases from GET data", () => {
    const form = mapRewardSettingsToForm({
      maximumRedeemPoints: 250,
    });
    expect(form.maximumRedeemPoints).toBe("250");
  });

  it("builds PUT payload with boolean flags and numbers", () => {
    const payload = buildRewardSettingsPayload({
      registrationReward: "150",
      minimumPayout: "50.00",
      maximumRedeemPoints: "500",
      amazon: "Yes",
      flipkart: "Yes",
      paypal: "Yes",
    });

    expect(payload).toEqual({
      registration_reward_points: 150,
      minimum_payout: 50,
      maximum_redeem_points: 500,
      amazon_enabled: true,
      flipkart_enabled: true,
      paypal_enabled: true,
    });
  });
});
