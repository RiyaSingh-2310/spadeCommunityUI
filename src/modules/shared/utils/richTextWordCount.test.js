import { describe, expect, it } from "vitest";
import {
  buildWordLimitedPasteHtml,
  countRichTextWords,
  getRichTextStats,
  getRichTextVisibleText,
  getRichTextWordLimitError,
  RICH_TEXT_COMMENT_WORD_LIMIT,
  truncateTextToWords,
} from "./richTextWordCount";

const words = (count) => Array.from({ length: count }, (_, i) => `w${i}`).join(" ");

describe("getRichTextStats", () => {
  it("counts visible words and characters, not markup", () => {
    expect(getRichTextStats("<p>Hello <strong>big</strong> world</p>")).toEqual({
      words: 3,
      characters: 15,
    });
  });

  it("treats block boundaries and <br> as word breaks", () => {
    expect(countRichTextWords("<p>one</p><p>two</p><div>three<br>four</div>")).toBe(4);
    expect(countRichTextWords("<ul><li>a</li><li>b</li></ul>")).toBe(2);
  });

  it("does not split words across inline formatting", () => {
    expect(countRichTextWords("<p>wo<em>rd</em></p>")).toBe(1);
  });

  it("ignores whitespace-only, &nbsp;, and empty editor content", () => {
    expect(getRichTextStats("")).toEqual({ words: 0, characters: 0 });
    expect(getRichTextStats("<p>&nbsp;</p><p>   </p><br>")).toEqual({ words: 0, characters: 0 });
    expect(countRichTextWords("<p>a&nbsp;&nbsp;&nbsp;b</p>")).toBe(2);
  });

  it("does not count punctuation-only tokens or hidden script/style text", () => {
    expect(countRichTextWords("<p>Hello - world — !</p>")).toBe(2);
    expect(countRichTextWords("<p>One</p><script>var a = 1;</script><style>p{}</style>")).toBe(1);
  });

  it("counts non-Latin words", () => {
    expect(countRichTextWords("<p>यह सर्वेक्षण पूरा हुआ</p>")).toBe(4);
  });

  it("keeps markup inert while parsing", () => {
    expect(getRichTextVisibleText('<img src="x" onerror="window.__xss = 1">ok').trim()).toBe("ok");
    expect(window.__xss).toBeUndefined();
  });
});

describe("getRichTextWordLimitError", () => {
  it("allows exactly 5000 words and rejects 5001", () => {
    expect(RICH_TEXT_COMMENT_WORD_LIMIT).toBe(5000);
    expect(getRichTextWordLimitError(`<p>${words(5000)}</p>`, "Comment")).toBe("");
    expect(getRichTextWordLimitError(`<p>${words(5001)}</p>`, "Comment")).toBe(
      "Comment must not exceed 5000 words"
    );
  });
});

describe("truncateTextToWords", () => {
  it("keeps the first N words and their spacing", () => {
    expect(truncateTextToWords("one  two - three four", 3)).toBe("one  two - three");
    expect(truncateTextToWords("one two", 5)).toBe("one two");
    expect(truncateTextToWords("one two", 0)).toBe("");
  });
});

describe("buildWordLimitedPasteHtml", () => {
  it("trims pasted HTML to the remaining words, keeps line breaks, and escapes text", () => {
    expect(
      buildWordLimitedPasteHtml("<p>one two</p><p>three &lt;b&gt; four</p><p>five six</p>", 6)
    ).toBe("one two<br>three &lt;b&gt; four<br>five");
  });
});
