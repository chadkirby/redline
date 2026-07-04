import { describe, expect, it } from "vitest";

import { diffText, diffWords } from "./index.js";
import type { DiffSegment, LineDiff } from "./types.js";

/**
 * These tests assert the modern structured API directly.
 */
describe("diffWords", () => {
  it("diffs by words while preserving whitespace", () => {
    expect(diffWords("the red balloon", "the blue balloon")).toEqual([
      { kind: "equal", text: "the " },
      { kind: "delete", text: "red" },
      { kind: "insert", text: "blue" },
      { kind: "equal", text: " balloon" },
    ]);
  });

  it("keeps user-authored tag-like text as ordinary text", () => {
    expect(diffWords("use <tag> here", "use <tag> there")).toEqual([
      { kind: "equal", text: "use <tag> " },
      { kind: "delete", text: "here" },
      { kind: "insert", text: "there" },
    ]);
  });

  it("accepts a custom tokenizer", () => {
    const tokenizeCharacters = (text: string) => [...text];

    expect(diffWords("abc", "axc", { tokenizeWords: tokenizeCharacters })).toEqual([
      { kind: "equal", text: "a" },
      { kind: "delete", text: "b" },
      { kind: "insert", text: "x" },
      { kind: "equal", text: "c" },
    ]);
  });
});

/**
 * Line-level tests cover alignment behavior and in-line segment generation.
 */
describe("diffText", () => {
  it("returns one equal line for unchanged text", () => {
    expect(diffText("line one", "line one")).toEqual([
      {
        kind: "equal",
        oldLineNumber: 0,
        newLineNumber: 0,
        oldText: "line one",
        newText: "line one",
        segments: [{ kind: "equal", text: "line one" }],
      },
    ]);
  });

  it("models inserted and deleted lines directly", () => {
    expect(diffText("first\nsecond", "first\nnew\nsecond")).toEqual([
      line("equal", 0, 0, "first", "first", [{ kind: "equal", text: "first" }]),
      line("insert", null, 1, "", "new", [{ kind: "insert", text: "new" }]),
      line("equal", 1, 2, "second", "second", [{ kind: "equal", text: "second" }]),
    ]);

    expect(diffText("first\nold\nsecond", "first\nsecond")).toEqual([
      line("equal", 0, 0, "first", "first", [{ kind: "equal", text: "first" }]),
      line("delete", 1, null, "old", "", [{ kind: "delete", text: "old" }]),
      line("equal", 2, 1, "second", "second", [{ kind: "equal", text: "second" }]),
    ]);
  });

  it("pairs similar lines and diffs inside them", () => {
    expect(diffText("alpha one\nbeta two", "alpha one\nbeta changed two")).toEqual([
      line("equal", 0, 0, "alpha one", "alpha one", [{ kind: "equal", text: "alpha one" }]),
      line("modify", 1, 1, "beta two", "beta changed two", [
        { kind: "equal", text: "beta " },
        { kind: "insert", text: "changed " },
        { kind: "equal", text: "two" },
      ]),
    ]);
  });

  it("does not force unrelated lines into a modification", () => {
    expect(diffText("alpha\nbeta\ngamma", "alpha\ncompletely unrelated\ngamma")).toEqual([
      line("equal", 0, 0, "alpha", "alpha", [{ kind: "equal", text: "alpha" }]),
      line("delete", 1, null, "beta", "", [{ kind: "delete", text: "beta" }]),
      line("insert", null, 1, "", "completely unrelated", [
        { kind: "insert", text: "completely unrelated" },
      ]),
      line("equal", 2, 2, "gamma", "gamma", [{ kind: "equal", text: "gamma" }]),
    ]);
  });

  it("lets callers tune line-pairing tolerance", () => {
    const oldText = "short line";
    const newText = "short line with more words";

    expect(diffText(oldText, newText, { maxLineDistance: 25 }).map((line) => line.kind)).toEqual([
      "delete",
      "insert",
    ]);
    expect(diffText(oldText, newText, { maxLineDistance: 75 }).map((line) => line.kind)).toEqual([
      "modify",
    ]);
  });
});

/**
 * Builds expected line results without hiding any fields from assertions.
 */
function line(
  kind: LineDiff["kind"],
  oldLineNumber: number | null,
  newLineNumber: number | null,
  oldText: string,
  newText: string,
  segments: DiffSegment[],
): LineDiff {
  return { kind, oldLineNumber, newLineNumber, oldText, newText, segments };
}
