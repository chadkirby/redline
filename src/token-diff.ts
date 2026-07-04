import { DiffMatchPatch, DiffOp } from "diff-match-patch-ts";

import { compressTokenLists, expandChars } from "./token-compression.js";
import type { DiffSegment } from "./types.js";

/**
 * Maps diff-match-patch operation constants to the package's public terms.
 */
const KIND_BY_DIFF_OP = {
  [DiffOp.Delete]: "delete",
  [DiffOp.Equal]: "equal",
  [DiffOp.Insert]: "insert",
} as const;

/**
 * Diffs two token streams and returns structured text segments.
 *
 * The token streams are first compressed into strings so diff-match-patch can
 * run its normal character diff. The result is then expanded back to token text.
 */
export function diffTokens(oldTokens: string[], newTokens: string[]): DiffSegment[] {
  const dmp = new DiffMatchPatch();
  dmp.Diff_Timeout = 0;

  const compressed = compressTokenLists(oldTokens, newTokens);
  const diffs = dmp.diff_main(compressed.oldChars, compressed.newChars, false);
  dmp.diff_cleanupSemantic(diffs);

  return joinAdjacentSegments(
    diffs
      .map(([op, chars]) => ({
        kind: KIND_BY_DIFF_OP[op],
        text: expandChars(chars, compressed.tokenByCode),
      }))
      .filter((segment) => segment.text.length > 0),
  );
}

/**
 * Merges neighboring segments with the same operation kind.
 */
function joinAdjacentSegments(segments: DiffSegment[]): DiffSegment[] {
  const joined: DiffSegment[] = [];

  for (const segment of segments) {
    const previous = joined.at(-1);

    if (previous?.kind === segment.kind) {
      previous.text += segment.text;
    } else {
      joined.push({ ...segment });
    }
  }

  return joined;
}
