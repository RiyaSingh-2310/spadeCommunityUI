import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "../../../services/api/ApiError";

vi.mock("../services/surveySettingsApi", async (importOriginal) => ({
  ...(await importOriginal()),
  getSurveySettingsByLanguage: vi.fn(),
  updateSurveySettingsByLanguage: vi.fn(),
}));

vi.mock("../../../services/toast/apiToast", async (importOriginal) => ({
  ...(await importOriginal()),
  toastApiError: vi.fn(),
  toastApiSuccess: vi.fn(),
  toastApiWarning: vi.fn(),
}));

vi.mock("../utils/resetSurveySettingsView", () => ({
  resetSurveySettingsViewAfterSave: vi.fn(),
}));

vi.mock("../../../components/admin/RichTextEditor", () => ({
  default: ({ id, value, onChange, disabled }) => (
    <textarea
      data-testid={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("../../../components/admin/LanguageSelect", () => ({
  default: ({ value, onChange, disabled }) => (
    <select
      aria-label="Select language"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {["English", "Spanish", "Hindi", "Italian"].map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  ),
}));

import {
  getSurveySettingsByLanguage,
  updateSurveySettingsByLanguage,
} from "../services/surveySettingsApi";
import {
  toastApiError,
  toastApiSuccess,
  toastApiWarning,
} from "../../../services/toast/apiToast";
import SurveySettingsPage from "./SurveySettingsPage";

function settingsFor(language, text = language) {
  return {
    id: { English: 1, Spanish: 2, Hindi: 7 }[language],
    language,
    createdAt: "",
    updatedAt: "",
    completeRedirect: `<p>${text} complete</p>`,
    terminateRedirect: `<p>${text} terminate</p>`,
    qualityTermRedirect: `<p>${text} quality</p>`,
    surveyCloseRedirect: `<p>${text} closed</p>`,
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const editor = (key) => screen.getByTestId(`survey-settings-${key}`);
const submitButton = () => screen.getByRole("button", { name: /submit|saving/i });

function renderPage() {
  return render(
    <MemoryRouter>
      <SurveySettingsPage />
    </MemoryRouter>
  );
}

async function selectLanguage(language) {
  await act(async () => {
    fireEvent.change(screen.getByLabelText("Select language"), {
      target: { value: language },
    });
  });
}

describe("SurveySettingsPage", () => {
  beforeEach(() => {
    vi.mocked(getSurveySettingsByLanguage).mockReset();
    vi.mocked(updateSurveySettingsByLanguage).mockReset();
    vi.mocked(toastApiError).mockReset();
    vi.mocked(toastApiSuccess).mockReset();
    vi.mocked(toastApiWarning).mockReset();
    vi.mocked(getSurveySettingsByLanguage).mockImplementation(async (language) =>
      settingsFor(language)
    );
  });

  it("loads English by default and renders only the four backend redirect statuses", async () => {
    renderPage();

    await waitFor(() => expect(editor("completeRedirect")).toHaveValue("<p>English complete</p>"));
    expect(getSurveySettingsByLanguage).toHaveBeenCalledWith("English");
    expect(editor("terminateRedirect")).toHaveValue("<p>English terminate</p>");
    expect(editor("qualityTermRedirect")).toHaveValue("<p>English quality</p>");
    expect(editor("surveyCloseRedirect")).toHaveValue("<p>English closed</p>");
    expect(screen.queryByTestId("survey-settings-overQuotaRedirect")).toBeNull();
  });

  it("clears the previous language while loading and ignores stale responses", async () => {
    renderPage();
    await waitFor(() => expect(editor("completeRedirect")).toHaveValue("<p>English complete</p>"));

    const hindi = deferred();
    const spanish = deferred();
    vi.mocked(getSurveySettingsByLanguage).mockImplementation((language) =>
      language === "Hindi" ? hindi.promise : spanish.promise
    );

    await selectLanguage("Hindi");
    expect(editor("completeRedirect")).toHaveValue("");
    expect(editor("completeRedirect")).toBeDisabled();
    expect(screen.getByText("Loading Hindi survey settings...")).toBeInTheDocument();

    await selectLanguage("Spanish");
    await act(async () => spanish.resolve(settingsFor("Spanish")));
    await act(async () => hindi.resolve(settingsFor("Hindi")));

    expect(editor("completeRedirect")).toHaveValue("<p>Spanish complete</p>");
    expect(editor("surveyCloseRedirect")).toHaveValue("<p>Spanish closed</p>");
  });

  it("PUTs the selected language, re-fetches it, and shows the persisted content", async () => {
    renderPage();
    await selectLanguage("Hindi");
    await waitFor(() => expect(editor("completeRedirect")).toHaveValue("<p>Hindi complete</p>"));

    const edited = "<p>यह सर्वेक्षण सफलतापूर्वक पूरा हो गया है।</p>";
    fireEvent.change(editor("completeRedirect"), { target: { value: edited } });

    vi.mocked(updateSurveySettingsByLanguage).mockResolvedValue({
      success: true,
      message: "Survey setting updated successfully!",
    });
    vi.mocked(getSurveySettingsByLanguage).mockResolvedValue({
      ...settingsFor("Hindi"),
      completeRedirect: edited,
    });

    await act(async () => fireEvent.click(submitButton()));

    expect(updateSurveySettingsByLanguage).toHaveBeenCalledWith(
      "Hindi",
      expect.objectContaining({ language: "Hindi", completeRedirect: edited })
    );
    await waitFor(() => expect(toastApiSuccess).toHaveBeenCalled());
    expect(getSurveySettingsByLanguage).toHaveBeenLastCalledWith("Hindi");
    expect(editor("completeRedirect")).toHaveValue(edited);
    expect(toastApiWarning).not.toHaveBeenCalled();
    expect(submitButton()).toBeDisabled();
  });

  it("warns when the re-fetched content does not match what was saved", async () => {
    renderPage();
    await waitFor(() => expect(editor("completeRedirect")).toHaveValue("<p>English complete</p>"));

    fireEvent.change(editor("terminateRedirect"), { target: { value: "<p>New</p>" } });
    vi.mocked(updateSurveySettingsByLanguage).mockResolvedValue({ success: true, message: "ok" });

    await act(async () => fireEvent.click(submitButton()));

    await waitFor(() => expect(toastApiWarning).toHaveBeenCalled());
    expect(String(vi.mocked(toastApiWarning).mock.calls[0][0])).toContain(
      "Terminate Redirect Content"
    );
  });

  it("keeps unsaved content and shows no success when the PUT fails", async () => {
    renderPage();
    await waitFor(() => expect(editor("completeRedirect")).toHaveValue("<p>English complete</p>"));

    fireEvent.change(editor("qualityTermRedirect"), { target: { value: "<p>Draft</p>" } });
    vi.mocked(updateSurveySettingsByLanguage).mockRejectedValue(
      new ApiError("Internal server error.", null, 500)
    );
    const getCallsBeforeSave = vi.mocked(getSurveySettingsByLanguage).mock.calls.length;

    await act(async () => fireEvent.click(submitButton()));

    expect(toastApiError).toHaveBeenCalled();
    expect(toastApiSuccess).not.toHaveBeenCalled();
    expect(getSurveySettingsByLanguage).toHaveBeenCalledTimes(getCallsBeforeSave);
    expect(editor("qualityTermRedirect")).toHaveValue("<p>Draft</p>");
    expect(submitButton()).toBeEnabled();
  });

  it("shows the GET error without leaking another language's content and allows retry", async () => {
    renderPage();
    await waitFor(() => expect(editor("completeRedirect")).toHaveValue("<p>English complete</p>"));

    vi.mocked(getSurveySettingsByLanguage).mockRejectedValueOnce(
      new ApiError("Unable to reach the server. Please try again.")
    );
    await selectLanguage("Hindi");

    await waitFor(() =>
      expect(screen.getByText("Unable to reach the server. Please try again.")).toBeInTheDocument()
    );
    expect(editor("completeRedirect")).toHaveValue("");
    expect(editor("completeRedirect")).toBeDisabled();
    expect(submitButton()).toBeDisabled();

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Retry" })));
    await waitFor(() => expect(editor("completeRedirect")).toHaveValue("<p>Hindi complete</p>"));
    expect(screen.queryByText("Unable to reach the server. Please try again.")).toBeNull();
  });

  it("blocks saving for a language without survey settings", async () => {
    renderPage();
    await waitFor(() => expect(editor("completeRedirect")).toHaveValue("<p>English complete</p>"));

    vi.mocked(getSurveySettingsByLanguage).mockRejectedValueOnce(
      new ApiError('Survey settings are not available for "Italian".', null, 400)
    );
    await selectLanguage("Italian");

    await waitFor(() =>
      expect(screen.getByText(/not available for "Italian"/)).toBeInTheDocument()
    );
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    expect(submitButton()).toBeDisabled();
  });
});
