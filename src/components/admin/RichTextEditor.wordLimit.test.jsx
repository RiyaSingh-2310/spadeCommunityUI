import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useState } from "react";

const tinyMce = vi.hoisted(() => ({ props: null }));

vi.mock("@tinymce/tinymce-react", () => ({
  Editor: (props) => {
    tinyMce.props = props;
    return <div data-testid="tinymce" />;
  },
}));

vi.mock("../../services/toast/apiToast", () => ({
  toastApiWarning: vi.fn(),
}));

import { toastApiWarning } from "../../services/toast/apiToast";
import RichTextEditor from "./RichTextEditor";

const words = (count) => Array.from({ length: count }, (_, i) => `w${i}`).join(" ");

function createFakeEditor(content = "", selection = "") {
  const handlers = {};
  return {
    handlers,
    on: (name, handler) => {
      handlers[name] = handler;
    },
    ui: { registry: { addButton: vi.fn(), addToggleButton: vi.fn() } },
    getContent: () => content,
    selection: { getContent: () => selection },
    setContent: vi.fn(),
    undoManager: { ignore: (fn) => fn() },
  };
}

function ControlledEditor({ initial = "", maxWords = 5, onChangeSpy }) {
  const [value, setValue] = useState(initial);
  return (
    <RichTextEditor
      id="comment"
      value={value}
      maxWords={maxWords}
      onChange={(next) => {
        onChangeSpy?.(next);
        setValue(next);
      }}
    />
  );
}

async function renderEditor(props) {
  render(<ControlledEditor {...props} />);
  await screen.findByTestId("tinymce");
}

describe("RichTextEditor maxWords", () => {
  beforeEach(() => {
    tinyMce.props = null;
    vi.mocked(toastApiWarning).mockReset();
  });

  it("shows a live word and character counter", async () => {
    await renderEditor({ initial: "<p>Hello world</p>" });
    const counter = screen.getByTestId("comment-word-count");
    expect(counter).toHaveTextContent("2 / 5 words · 11 characters");

    await act(async () => tinyMce.props.onEditorChange("<p>Hello big world</p>", createFakeEditor()));
    expect(counter).toHaveTextContent("3 / 5 words · 15 characters");
  });

  it("accepts edits up to the limit and flags when it is reached", async () => {
    const onChangeSpy = vi.fn();
    await renderEditor({ onChangeSpy });

    await act(async () => tinyMce.props.onEditorChange(`<p>${words(5)}</p>`, createFakeEditor()));
    expect(onChangeSpy).toHaveBeenLastCalledWith(`<p>${words(5)}</p>`);
    expect(screen.getByTestId("comment-word-count")).toHaveTextContent(
      "5 / 5 words · 14 characters · Word limit reached"
    );
  });

  it("rejects edits that exceed the limit so the editor rolls back", async () => {
    const onChangeSpy = vi.fn();
    await renderEditor({ initial: `<p>${words(5)}</p>`, onChangeSpy });

    await act(async () => tinyMce.props.onEditorChange(`<p>${words(6)}</p>`, createFakeEditor()));
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("comment-word-count")).toHaveTextContent("5 / 5 words");
  });

  it("clears the editor itself when an over-limit change starts from empty content", async () => {
    const onChangeSpy = vi.fn();
    await renderEditor({ onChangeSpy });
    const editor = createFakeEditor();

    await act(async () => tinyMce.props.onEditorChange(`<p>${words(9)}</p>`, editor));
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(editor.setContent).toHaveBeenCalledWith("");
  });

  it("still accepts edits that reduce over-limit saved content", async () => {
    const onChangeSpy = vi.fn();
    await renderEditor({ initial: `<p>${words(8)}</p>`, onChangeSpy });

    await act(async () => tinyMce.props.onEditorChange(`<p>${words(7)}</p>`, createFakeEditor()));
    expect(onChangeSpy).toHaveBeenCalledWith(`<p>${words(7)}</p>`);
  });

  it("trims a paste to the remaining word budget", async () => {
    await renderEditor({ initial: "<p>one two three</p>" });
    const editor = createFakeEditor("<p>one two three</p>");
    tinyMce.props.init.setup(editor);

    const event = { content: "<p>alpha beta gamma delta</p>" };
    editor.handlers.PastePreProcess(event);

    expect(event.content).toBe("alpha beta");
    expect(toastApiWarning).toHaveBeenCalledWith(
      "Pasted content was trimmed to stay within the 5-word limit."
    );
  });

  it("counts selected text being replaced by the paste", async () => {
    await renderEditor({ initial: "<p>one two three four five</p>" });
    const editor = createFakeEditor("<p>one two three four five</p>", "four five");
    tinyMce.props.init.setup(editor);

    const event = { content: "x y" };
    editor.handlers.PastePreProcess(event);

    expect(event.content).toBe("x y");
    expect(toastApiWarning).not.toHaveBeenCalled();
  });

  it("does not add a counter or limit when maxWords is not set", async () => {
    render(<RichTextEditor id="plain" value={`<p>${words(20)}</p>`} onChange={() => {}} />);
    await screen.findByTestId("tinymce");
    expect(screen.queryByTestId("plain-word-count")).toBeNull();

    const editor = createFakeEditor(`<p>${words(20)}</p>`);
    tinyMce.props.init.setup(editor);
    const event = { content: `<p>${words(50)}</p>` };
    editor.handlers.PastePreProcess?.(event);
    expect(event.content).toBe(`<p>${words(50)}</p>`);
    expect(toastApiWarning).not.toHaveBeenCalled();
  });
});
