import { lineDistance } from "./line-distance.js";

/**
 * Internal line alignment operation kinds.
 */
export type LineAlignmentKind = "equal" | "modify" | "insert" | "delete";

/**
 * A line pairing before in-line word segments are computed.
 */
export interface LineAlignment {
  /** The line-level operation chosen by alignment. */
  kind: LineAlignmentKind;
  /** Zero-based old line number, or null for inserted lines. */
  oldLineNumber: number | null;
  /** Zero-based new line number, or null for deleted lines. */
  newLineNumber: number | null;
  /** Old line text, or empty string for insertions. */
  oldText: string;
  /** New line text, or empty string for deletions. */
  newText: string;
}

/**
 * Options for line-level alignment.
 */
export interface LineAlignmentOptions {
  /** Maximum distance score that can still be paired as a modified line. */
  maxLineDistance: number;
}

const INSERT_COST = 1;
const DELETE_COST = 1;
const IMPOSSIBLE_PAIR_COST = INSERT_COST + DELETE_COST + 1;

/**
 * Aligns old and new lines into equal, modified, inserted, and deleted entries.
 */
export function alignLines(
  oldLines: string[],
  newLines: string[],
  options: LineAlignmentOptions,
): LineAlignment[] {
  const table = buildAlignmentTable(oldLines, newLines, options.maxLineDistance);
  return traceAlignment(oldLines, newLines, table, options.maxLineDistance);
}

/**
 * Builds a dynamic-programming cost table for line alignment.
 */
function buildAlignmentTable(
  oldLines: string[],
  newLines: string[],
  maxLineDistance: number,
): number[][] {
  const table = Array.from({ length: oldLines.length + 1 }, () =>
    Array.from({ length: newLines.length + 1 }, () => 0),
  );

  for (let oldIndex = 1; oldIndex <= oldLines.length; oldIndex += 1) {
    table[oldIndex][0] = oldIndex * DELETE_COST;
  }

  for (let newIndex = 1; newIndex <= newLines.length; newIndex += 1) {
    table[0][newIndex] = newIndex * INSERT_COST;
  }

  for (let oldIndex = 1; oldIndex <= oldLines.length; oldIndex += 1) {
    for (let newIndex = 1; newIndex <= newLines.length; newIndex += 1) {
      const pairCost = getPairCost(oldLines[oldIndex - 1], newLines[newIndex - 1], maxLineDistance);

      table[oldIndex][newIndex] = Math.min(
        table[oldIndex - 1][newIndex] + DELETE_COST,
        table[oldIndex][newIndex - 1] + INSERT_COST,
        table[oldIndex - 1][newIndex - 1] + pairCost,
      );
    }
  }

  return table;
}

/**
 * Walks the alignment table backward to produce the chosen line operations.
 */
function traceAlignment(
  oldLines: string[],
  newLines: string[],
  table: number[][],
  maxLineDistance: number,
): LineAlignment[] {
  const alignments: LineAlignment[] = [];
  let oldIndex = oldLines.length;
  let newIndex = newLines.length;

  while (oldIndex > 0 || newIndex > 0) {
    const current = table[oldIndex][newIndex];
    const oldLine = oldLines[oldIndex - 1];
    const newLine = newLines[newIndex - 1];
    const pairCost =
      oldIndex > 0 && newIndex > 0
        ? getPairCost(oldLine, newLine, maxLineDistance)
        : IMPOSSIBLE_PAIR_COST;

    if (
      oldIndex > 0 &&
      newIndex > 0 &&
      pairCost < IMPOSSIBLE_PAIR_COST &&
      current === table[oldIndex - 1][newIndex - 1] + pairCost
    ) {
      oldIndex -= 1;
      newIndex -= 1;
      alignments.unshift({
        kind: oldLine === newLine ? "equal" : "modify",
        oldLineNumber: oldIndex,
        newLineNumber: newIndex,
        oldText: oldLine,
        newText: newLine,
      });
    } else if (newIndex > 0 && current === table[oldIndex][newIndex - 1] + INSERT_COST) {
      newIndex -= 1;
      alignments.unshift({
        kind: "insert",
        oldLineNumber: null,
        newLineNumber: newIndex,
        oldText: "",
        newText: newLines[newIndex],
      });
    } else {
      oldIndex -= 1;
      alignments.unshift({
        kind: "delete",
        oldLineNumber: oldIndex,
        newLineNumber: null,
        oldText: oldLines[oldIndex],
        newText: "",
      });
    }
  }

  return alignments;
}

/**
 * Converts a line similarity score into an alignment cost.
 */
function getPairCost(oldLine: string, newLine: string, maxLineDistance: number): number {
  if (oldLine === newLine) {
    return 0;
  }

  const distance = lineDistance(oldLine, newLine);

  if (distance.score >= maxLineDistance) {
    return IMPOSSIBLE_PAIR_COST;
  }

  return Math.max(0.01, distance.score / 100);
}
