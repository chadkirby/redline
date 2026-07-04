/**
 * Splits text into logical lines while accepting common newline conventions.
 */
export function splitLines(text: string): string[] {
  if (text.length === 0) {
    return [];
  }

  return text.split(/\r\n|\n|\r/);
}

/**
 * Splits text into alternating whitespace and non-whitespace runs.
 *
 * Keeping whitespace as tokens lets the diff preserve user-authored spacing
 * without a cleanup pass after diffing.
 */
export function wordsWithWhitespace(text: string): string[] {
  return text.match(/\s+|[^\s]+/g) ?? [];
}

/**
 * Splits text into whitespace-separated words for approximate line comparison.
 *
 * This intentionally discards exact spacing because line pairing only needs a
 * similarity score, not renderable output.
 */
export function comparableWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}
