# AGENTS.md

Guidance for coding agents working in this package.

## Goals

`redline` should stay small, modern, and easy to reason about. Prefer
structured diff data over generated markup.

## Public API

The public surface should remain centered on:

- `diffText(oldText, newText, options?)`
- `diffWords(oldText, newText, options?)`
- exported TypeScript types

## Architecture

Keep responsibilities separated:

- `index.ts`: public facade only
- `types.ts`: public result and option types
- `tokenize.ts`: tokenizers
- `token-compression.ts`: token-to-character compression
- `token-diff.ts`: DMP integration
- `line-distance.ts`: similarity scoring for line pairing
- `line-align.ts`: line-level alignment

## Diff Semantics

Use `equal`, `insert`, and `delete` for segment-level diffs. Use `modify` only
for line-level entries where an old line and new line are paired and then
diffed internally.

## Implementation Preferences

- Keep `diff-match-patch-ts` unpatched.
- Preserve whitespace through tokenization rather than cleanup passes.
- Keep line-pairing thresholds named and configurable.
- Avoid regex-over-markup pipelines. Operate on structured arrays.
- Add tests for behavior, not compatibility with historical tag strings.

## Verification

Run these before handing work back:

```sh
pnpm test
pnpm typecheck
pnpm lint
```

`pnpm format` is available for mechanical formatting.
