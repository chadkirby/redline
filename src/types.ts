/**
 * The operation kinds used inside a single line or token sequence.
 */
export type DiffKind = "equal" | "insert" | "delete";

/**
 * A contiguous span of text with one diff operation.
 */
export interface DiffSegment {
  /** Whether the text is unchanged, inserted, or deleted. */
  kind: DiffKind;
  /** The original text for equal/delete spans, or new text for insert spans. */
  text: string;
}

/**
 * The operation kinds used for line-level alignment.
 */
export type LineDiffKind = "equal" | "modify" | "insert" | "delete";

/**
 * A line-level diff result, including optional word-level segments.
 */
export interface LineDiff {
  /** The line-level operation. */
  kind: LineDiffKind;
  /** Zero-based line number in the old text, or null for inserted lines. */
  oldLineNumber: number | null;
  /** Zero-based line number in the new text, or null for deleted lines. */
  newLineNumber: number | null;
  /** The old line text, or an empty string for inserted lines. */
  oldText: string;
  /** The new line text, or an empty string for deleted lines. */
  newText: string;
  /** In-line diff segments for this line. */
  segments: DiffSegment[];
}

/**
 * Options that tune line pairing and in-line tokenization.
 */
export interface DiffOptions {
  /**
   * Maximum normalized line distance that can still be paired as a modification.
   * Lower values create more delete/insert line pairs.
   */
  maxLineDistance?: number;
  /**
   * Tokenizer used for word-level diffs inside paired lines.
   */
  tokenizeWords?: (text: string) => string[];
}
