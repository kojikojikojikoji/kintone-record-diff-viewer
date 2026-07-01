// Inline diff for rich-text values (spec FR-13). Tokens are diffed with a
// self-implemented longest common subsequence, then merged into same/del/ins
// segments. No external diff library is used.
import { tokenize } from "./tokenize";

export type SegmentType = "same" | "del" | "ins";

export interface Segment {
  type: SegmentType;
  text: string;
}

// Token count above which the LCS is skipped (spec EC-10). Compared per column.
export const TOKEN_CAP = 3000;

interface DiffResult {
  segments: Segment[];
  // Number of matched tokens (the LCS length in tokens).
  lcsLen: number;
}

// Fraction of matched tokens below which the token-level highlighting is
// replaced by a full-replacement view (spec FR-13). lcsLen * 10 < (aLen + bLen)
// means the matched tokens are under 10% of the combined token count.
function isFullReplacement(lcsLen: number, aLen: number, bLen: number): boolean {
  return lcsLen * 10 < aLen + bLen;
}

function diffTokens(a: string[], b: string[]): DiffResult {
  const n = a.length;
  const m = b.length;
  const width = m + 1;
  const dp = new Int32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i * width + j] =
        a[i] === b[j]
          ? dp[(i + 1) * width + (j + 1)] + 1
          : Math.max(dp[(i + 1) * width + j], dp[i * width + (j + 1)]);
    }
  }

  const raw: { type: SegmentType; token: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      raw.push({ type: "same", token: a[i] });
      i += 1;
      j += 1;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + (j + 1)]) {
      // Emit deletions before insertions at a mismatch (spec examples).
      raw.push({ type: "del", token: a[i] });
      i += 1;
    } else {
      raw.push({ type: "ins", token: b[j] });
      j += 1;
    }
  }
  while (i < n) {
    raw.push({ type: "del", token: a[i] });
    i += 1;
  }
  while (j < m) {
    raw.push({ type: "ins", token: b[j] });
    j += 1;
  }

  return { segments: mergeSegments(raw), lcsLen: dp[0] };
}

function mergeSegments(raw: { type: SegmentType; token: string }[]): Segment[] {
  const segments: Segment[] = [];
  for (const { type, token } of raw) {
    const last = segments[segments.length - 1];
    if (last && last.type === type) {
      last.text += token;
    } else {
      segments.push({ type, text: token });
    }
  }
  return segments;
}

// Diff two token arrays into ordered same/del/ins segments. Column A reads the
// same + del segments, column B reads the same + ins segments.
export function diffSegments(a: string[], b: string[]): Segment[] {
  return diffTokens(a, b).segments;
}

export type InlineDiffMode = "segments" | "full" | "plain";

export interface InlineDiff {
  mode: InlineDiffMode;
  segments: Segment[];
}

// Compute the inline diff for two rich-text plain-text values.
// - "plain": one column exceeds TOKEN_CAP tokens, so no inline diff is shown.
// - "full": matched tokens are under 10%, so A is one del and B is one ins.
// - "segments": normal token-level highlighting.
export function inlineDiff(aText: string, bText: string): InlineDiff {
  const a = tokenize(aText);
  const b = tokenize(bText);
  if (a.length > TOKEN_CAP || b.length > TOKEN_CAP) {
    return { mode: "plain", segments: [] };
  }
  const { segments, lcsLen } = diffTokens(a, b);
  if (isFullReplacement(lcsLen, a.length, b.length)) {
    const full: Segment[] = [];
    if (aText.length > 0) full.push({ type: "del", text: aText });
    if (bText.length > 0) full.push({ type: "ins", text: bText });
    return { mode: "full", segments: full };
  }
  return { mode: "segments", segments };
}
