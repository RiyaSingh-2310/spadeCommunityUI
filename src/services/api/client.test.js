import { describe, expect, it } from "vitest";
import { extractErrorMessage } from "./client";
import { ApiError } from "./ApiError";

describe("API error handling", () => {
  it("prefers the API message", () => {
    expect(extractErrorMessage({ status: 400 }, { message: "Email already exists" })).toBe(
      "Email already exists"
    );
  });

  it("maps 403 to a permission message when the body is empty", () => {
    expect(extractErrorMessage({ status: 403 }, null)).toBe(
      "You do not have permission to perform this action."
    );
  });

  it("maps 401 to the session-expired copy when the body is empty", () => {
    expect(extractErrorMessage({ status: 401 }, {})).toBe(
      "Your session has expired. Please log in again."
    );
  });

  it("preserves ApiError status for callers", () => {
    const error = new ApiError("Forbidden", { message: "Forbidden" }, 403);
    expect(error.status).toBe(403);
    expect(error.message).toBe("Forbidden");
  });
});
