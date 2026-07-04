# redline

A small TypeScript diff engine for comparing multi-line strings.

`redline` is built for human-readable text diffs:

- It compares documents line by line.
- It pairs lines that are similar enough to be treated as modifications.
- It then diffs paired lines by whitespace-preserving word tokens.
- It returns structured data.

## Install

```sh
pnpm add @ckirby/redline
```

## API

```ts
import { diffText, diffWords } from "@ckirby/redline";
```

### `diffWords(oldText, newText, options?)`

Diffs two strings using whitespace-preserving word tokens.

```ts
diffWords("the red balloon", "the blue balloon");
```

Returns:

```ts
[
  { kind: "equal", text: "the " },
  { kind: "delete", text: "red" },
  { kind: "insert", text: "blue" },
  { kind: "equal", text: " balloon" },
];
```

### `diffText(oldText, newText, options?)`

Diffs two multi-line strings. Each returned line includes line metadata and
word-level segments for inserted, deleted, equal, or modified lines.

```ts
diffText("alpha one\nbeta two", "alpha one\nbeta changed two");
```

Returns:

```ts
[
  {
    kind: "equal",
    oldLineNumber: 0,
    newLineNumber: 0,
    oldText: "alpha one",
    newText: "alpha one",
    segments: [{ kind: "equal", text: "alpha one" }],
  },
  {
    kind: "modify",
    oldLineNumber: 1,
    newLineNumber: 1,
    oldText: "beta two",
    newText: "beta changed two",
    segments: [
      { kind: "equal", text: "beta " },
      { kind: "insert", text: "changed " },
      { kind: "equal", text: "two" },
    ],
  },
];
```

## Options

### `maxLineDistance`

Controls how dissimilar two lines can be while still being paired as a
modification. Lower values produce more delete/insert line pairs. Higher values
produce more modified lines.

```ts
diffText(oldText, newText, { maxLineDistance: 60 });
```

The default is `75`.

### `tokenizeWords`

Provides a custom tokenizer for in-line diffs.

```ts
diffWords("abc", "axc", {
  tokenizeWords: (text) => [...text],
});
```

The default tokenizer preserves whitespace by returning whitespace and
non-whitespace runs as separate tokens.

## Internals

The diff engine uses `diff-match-patch-ts`, which is character-oriented. To make
it work on arbitrary tokens, `redline` compresses each unique token into a
single UTF-16 character, runs the diff, then expands the characters back to the
original token text.

This keeps `diff-match-patch-ts` unpatched while still allowing word-level or
custom-token diffs.

## Development

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm format
```

## Release Checklist

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm publish --access public
```
