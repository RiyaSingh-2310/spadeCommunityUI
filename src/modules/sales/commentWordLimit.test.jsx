import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const tinyMce = vi.hoisted(() => ({ byId: {} }));

vi.mock("@tinymce/tinymce-react", () => ({
  Editor: (props) => {
    tinyMce.byId[props.id] = props;
    return <div data-testid={`tinymce-${props.id}`} />;
  },
}));

vi.mock("../../services/sales/salesProjectsApi", async (importOriginal) => ({
  ...(await importOriginal()),
  getRecord: vi.fn(),
  createSalesLog: vi.fn(),
  createSalesProject: vi.fn(),
  updateSalesProject: vi.fn(),
}));

vi.mock("../../services/clients/clientsApi", () => ({
  getRecords: vi.fn(async () => ({
    items: [{ id: 3, name: "Acme", emailAddress: "ops@acme.com", country: "India" }],
  })),
}));

vi.mock("../../services/sales/salesManagersApi", () => ({
  getRecords: vi.fn(async () => ({ items: [{ id: 8, name: "Riya" }] })),
}));

vi.mock("../../services/toast/apiToast", () => ({
  toastApiError: vi.fn(),
  toastApiSuccess: vi.fn(),
  toastApiWarning: vi.fn(),
}));

import {
  createSalesLog,
  getRecord,
  updateSalesProject,
} from "../../services/sales/salesProjectsApi";
import AddRfqLogModal from "./components/AddRfqLogModal";
import AddRfqPage from "./pages/AddRfqPage";

const words = (count) => Array.from({ length: count }, (_, i) => `w${i}`).join(" ");
const fakeEditor = { undoManager: { ignore: (fn) => fn() }, setContent: vi.fn() };

function commentEditorProps() {
  const entries = Object.values(tinyMce.byId);
  return entries[entries.length - 1];
}

async function typeComment(html) {
  await act(async () => commentEditorProps().onEditorChange(html, fakeEditor));
}

const counterText = () => screen.getByText(/\/ 5000 words/).textContent;

describe("Add Log comment word limit", () => {
  beforeEach(() => {
    tinyMce.byId = {};
    vi.mocked(getRecord).mockReset().mockResolvedValue({ email_subject: "Quote" });
    vi.mocked(createSalesLog).mockReset().mockResolvedValue({ success: true, message: "ok" });
  });

  async function renderModal() {
    render(
      <AddRfqLogModal
        isOpen
        onClose={() => {}}
        row={{ recordId: "12", emailSubject: "Quote" }}
        onSubmitted={() => {}}
      />
    );
    await screen.findByText(/0 \/ 5000 words/);
    await waitFor(() => expect(screen.getByPlaceholderText("Enter Email Subject")).toBeEnabled());
  }

  it("updates the counter live and submits exactly 5000 words", async () => {
    await renderModal();
    expect(counterText()).toBe("0 / 5000 words · 0 characters");

    await typeComment("<p>Hello <b>there</b></p>");
    expect(counterText()).toBe("2 / 5000 words · 11 characters");

    const full = `<p>${words(5000)}</p>`;
    await typeComment(full);
    expect(counterText()).toContain("5000 / 5000 words");
    expect(counterText()).toContain("Word limit reached");

    const submit = screen.getByRole("button", { name: "Submit" });
    expect(submit).toBeEnabled();
    await act(async () => fireEvent.click(submit));
    expect(createSalesLog).toHaveBeenCalledWith("12", expect.objectContaining({ comment: full }));
  });

  it("does not accept content beyond 5000 words", async () => {
    await renderModal();
    await typeComment(`<p>${words(5000)}</p>`);
    await typeComment(`<p>${words(5001)}</p>`);

    expect(counterText()).toContain("5000 / 5000 words");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Submit" })));
    expect(createSalesLog).toHaveBeenCalledWith(
      "12",
      expect.objectContaining({ comment: `<p>${words(5000)}</p>` })
    );
  });
});

describe("Add/Edit RFQ comment word limit", () => {
  beforeEach(() => {
    tinyMce.byId = {};
    vi.mocked(getRecord).mockReset();
    vi.mocked(updateSalesProject).mockReset().mockResolvedValue({ success: true, message: "ok" });
  });

  function renderEdit() {
    return render(
      <MemoryRouter initialEntries={["/sales/rfq/edit/5"]}>
        <Routes>
          <Route path="/sales/rfq/edit/:id" element={<AddRfqPage />} />
          <Route path="/sales/rfq" element={<div>RFQ list</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("blocks saving saved content over 5000 words until it is reduced", async () => {
    vi.mocked(getRecord).mockResolvedValue({
      id: 5,
      client_id: 3,
      client_name: "Acme",
      email: "ops@acme.com",
      country: "India",
      email_subject: "Quote",
      status: "wip",
      sales_manager_id: 8,
      sales_manager_name: "Riya",
      comment: `<p>${words(5002)}</p>`,
    });
    renderEdit();

    await screen.findByText(/5002 \/ 5000 words/);
    expect(counterText()).toContain("Word limit exceeded");
    const update = screen.getByRole("button", { name: "Update" });

    await typeComment(`<p>${words(5001)}</p>`);
    expect(update).toBeDisabled();

    const handlers = {};
    commentEditorProps().init.setup({
      ...fakeEditor,
      on: (name, handler) => {
        handlers[name] = handler;
      },
      ui: { registry: { addButton: () => {}, addToggleButton: () => {} } },
    });
    await act(async () => handlers.blur());
    expect(screen.getByText("Comment must not exceed 5000 words")).toBeInTheDocument();

    await typeComment(`<p>${words(4999)}</p>`);
    expect(counterText()).toBe("4999 / 5000 words · 28883 characters");
    expect(screen.queryByText("Comment must not exceed 5000 words")).toBeNull();
    expect(update).toBeEnabled();

    await act(async () => fireEvent.click(update));
    expect(updateSalesProject).toHaveBeenCalledWith(
      "5",
      expect.objectContaining({ comment: `<p>${words(4999)}</p>` })
    );
  });
});
