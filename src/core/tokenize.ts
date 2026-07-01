// Splits a string into diff tokens (spec FR-13):
// - a run of halfwidth alphanumerics [0-9A-Za-z] is one token,
// - a run of whitespace is one token,
// - every other character (Japanese included) is one token per character.
// Iteration is over code points so surrogate pairs are not split.

function isAlnum(ch: string): boolean {
  return (
    ch.length === 1 &&
    ((ch >= "0" && ch <= "9") || (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z"))
  );
}

function isSpace(ch: string): boolean {
  return /\s/.test(ch);
}

export function tokenize(input: string): string[] {
  const chars = Array.from(input);
  const tokens: string[] = [];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (isAlnum(ch)) {
      let run = ch;
      let j = i + 1;
      while (j < chars.length && isAlnum(chars[j])) {
        run += chars[j];
        j += 1;
      }
      tokens.push(run);
      i = j;
    } else if (isSpace(ch)) {
      let run = ch;
      let j = i + 1;
      while (j < chars.length && isSpace(chars[j])) {
        run += chars[j];
        j += 1;
      }
      tokens.push(run);
      i = j;
    } else {
      tokens.push(ch);
      i += 1;
    }
  }
  return tokens;
}
