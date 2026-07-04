import { comparableWords } from "./tokenize.js";

/**
 * Approximate edit distance between two lines.
 */
export interface LineDistance {
  /** Raw weighted edit distance. Substitutions cost two. */
  distance: number;
  /** Normalized score from 0 to 100. Higher means less similar. */
  score: number;
}

const MINIMUM_SCORE_DIVISOR = 4;

/**
 * Scores how different two lines are using word-level Levenshtein distance.
 *
 * This score is used for deciding whether two changed lines should be paired as
 * a modification or represented as a delete plus insert.
 */
export function lineDistance(oldLine: string, newLine: string): LineDistance {
  if (oldLine === newLine) {
    return { distance: 0, score: 0 };
  }

  const oldTokens = comparableWords(oldLine);
  const newTokens = comparableWords(newLine);

  if (oldTokens.length === 0 || newTokens.length === 0) {
    return { distance: 100, score: 100 };
  }

  const distance = levenshteinDistance(oldTokens, newTokens);
  const divisor = Math.max(MINIMUM_SCORE_DIVISOR, oldTokens.length + newTokens.length);

  return {
    distance,
    score: Math.ceil((100 * distance) / divisor),
  };
}

/**
 * Computes weighted Levenshtein distance over tokens.
 */
function levenshteinDistance(oldTokens: string[], newTokens: string[]): number {
  let previous = Array.from({ length: oldTokens.length + 1 }, (_value, index) => index);

  for (const [newIndex, newToken] of newTokens.entries()) {
    const current = [newIndex + 1];

    for (const [oldIndex, oldToken] of oldTokens.entries()) {
      if (oldToken === newToken) {
        current.push(previous[oldIndex]);
      } else {
        current.push(
          Math.min(previous[oldIndex + 1] + 1, current[oldIndex] + 1, previous[oldIndex] + 2),
        );
      }
    }

    previous = current;
  }

  return previous[previous.length - 1];
}
