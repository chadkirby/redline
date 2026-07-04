/**
 * The compact representation passed to diff-match-patch.
 */
export interface CompressedTokens {
  /** Old token stream encoded as one UTF-16 code unit per token. */
  oldChars: string;
  /** New token stream encoded as one UTF-16 code unit per token. */
  newChars: string;
  /** Lookup table used to expand encoded characters back to original tokens. */
  tokenByCode: string[];
}

const MAX_COMPRESSED_TOKEN_COUNT = 0xffff;

/**
 * Compresses two token lists into character strings that can be diffed by DMP.
 *
 * Identical token text gets the same character code in both strings. This makes
 * a character-oriented diff engine behave like a token-oriented diff engine.
 */
export function compressTokenLists(oldTokens: string[], newTokens: string[]): CompressedTokens {
  const tokenByCode = [""];
  const codeByToken = new Map<string, number>();

  return {
    oldChars: compressTokens(oldTokens, tokenByCode, codeByToken),
    newChars: compressTokens(newTokens, tokenByCode, codeByToken),
    tokenByCode,
  };
}

/**
 * Expands a compressed DMP character string back into original token text.
 */
export function expandChars(chars: string, tokenByCode: string[]): string {
  let text = "";

  for (let index = 0; index < chars.length; index += 1) {
    text += tokenByCode[chars.charCodeAt(index)] ?? "";
  }

  return text;
}

/**
 * Encodes one token stream using a shared token/code dictionary.
 */
function compressTokens(
  tokens: string[],
  tokenByCode: string[],
  codeByToken: Map<string, number>,
): string {
  let chars = "";

  for (const token of tokens) {
    let code = codeByToken.get(token);

    if (code === undefined) {
      code = tokenByCode.length;

      if (code > MAX_COMPRESSED_TOKEN_COUNT) {
        throw new Error("Too many unique tokens to compress into a UTF-16 diff string.");
      }

      codeByToken.set(token, code);
      tokenByCode[code] = token;
    }

    chars += String.fromCharCode(code);
  }

  return chars;
}
