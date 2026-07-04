import { alignLines } from "./line-align.js";
import { diffTokens } from "./token-diff.js";
import { splitLines, wordsWithWhitespace } from "./tokenize.js";
import type { DiffOptions, DiffSegment, LineDiff } from "./types.js";

export type { DiffKind, DiffOptions, DiffSegment, LineDiff, LineDiffKind } from "./types.js";

const DEFAULT_MAX_LINE_DISTANCE = 75;

/**
 * Diffs two strings at the token level.
 *
 * By default, this uses a whitespace-preserving word tokenizer, making it
 * suitable for rendering human-readable inline diffs.
 */
export function diffWords(
  oldText: string,
  newText: string,
  options: Pick<DiffOptions, "tokenizeWords"> = {},
): DiffSegment[] {
  const tokenize = options.tokenizeWords ?? wordsWithWhitespace;
  return diffTokens(tokenize(oldText), tokenize(newText));
}

/**
 * Diffs two multi-line strings.
 *
 * The engine first aligns lines, then performs token-level diffs inside paired
 * modified lines. Inserted and deleted lines are returned as single segments.
 */
export function diffText(oldText: string, newText: string, options: DiffOptions = {}): LineDiff[] {
  const tokenizeWords = options.tokenizeWords ?? wordsWithWhitespace;
  const maxLineDistance = options.maxLineDistance ?? DEFAULT_MAX_LINE_DISTANCE;
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);

  return alignLines(oldLines, newLines, { maxLineDistance }).map((line) => ({
    ...line,
    segments: getLineSegments(line, tokenizeWords),
  }));
}

/**
 * Computes in-line segments for one aligned line.
 */
function getLineSegments(
  line: Omit<LineDiff, "segments">,
  tokenizeWords: (text: string) => string[],
): DiffSegment[] {
  if (line.kind === "insert") {
    return [{ kind: "insert", text: line.newText }];
  }

  if (line.kind === "delete") {
    return [{ kind: "delete", text: line.oldText }];
  }

  if (line.kind === "equal") {
    return [{ kind: "equal", text: line.oldText }];
  }

  return diffTokens(tokenizeWords(line.oldText), tokenizeWords(line.newText));
}
