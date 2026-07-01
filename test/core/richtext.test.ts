import { describe, it, expect } from "vitest";
import { htmlToText } from "../../src/core/richtext";

describe("htmlToText (spec 7.3)", () => {
  it("drops inline markup", () => {
    expect(htmlToText("<b>A</b>")).toBe("A");
  });

  it("turns block boundaries into line breaks", () => {
    expect(htmlToText("<p>A</p><p>B</p>")).toBe("A\nB");
  });

  it("turns <br> into a line break", () => {
    expect(htmlToText("A<br>B")).toBe("A\nB");
  });

  it("replaces img with [画像] (spec EC-11)", () => {
    expect(htmlToText('X<img src="https://example.com/a.png">Y')).toBe("X[画像]Y");
    // src difference does not change the text
    expect(htmlToText('<img src="a.png">')).toBe(htmlToText('<img src="b.png">'));
  });

  it("decodes named and numeric entities", () => {
    expect(htmlToText("A&amp;B")).toBe("A&B");
    expect(htmlToText("&#65;&#x42;")).toBe("AB");
  });

  it("returns empty string for empty input", () => {
    expect(htmlToText("")).toBe("");
    expect(htmlToText(null)).toBe("");
  });
});
