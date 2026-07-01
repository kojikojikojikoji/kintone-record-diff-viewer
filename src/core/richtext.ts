// Turns kintone rich-text HTML into plain text for comparison and display.
// DOMParser is avoided so this stays runnable in a plain unit-test environment.
// Block elements become line breaks, <img> becomes [画像], every other tag is
// dropped, and HTML entities are decoded.

const BLOCK_TAG =
  "p|div|li|tr|ul|ol|table|thead|tbody|blockquote|pre|h[1-6]|section|article|header|footer";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body[0] === "#") {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (Number.isFinite(code) && code > 0) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return whole;
        }
      }
      return whole;
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named !== undefined ? named : whole;
  });
}

export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  let s = html;
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<img\b[^>]*>/gi, "[画像]");
  // Insert a break at both the opening and closing edge of block elements so
  // that adjacent blocks do not merge into one line.
  s = s.replace(new RegExp(`</?(?:${BLOCK_TAG})\\b[^>]*>`, "gi"), "\n");
  // Drop any remaining tags.
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  // Collapse the runs of blank lines introduced by block boundaries and trim
  // the leading/trailing breaks so equal content compares equal.
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{2,}/g, "\n");
  s = s.replace(/^\n+|\n+$/g, "");
  return s;
}
