# lexicographic-keys

Generate sortable string or signed 32-bit integer keys to insert or reorder items.
String keys grow as needed; integer keys may require renumbering when gaps fill up.
No runtime dependencies; TypeScript declarations included.

## Installation

```sh
npm install lexicographic-keys
```

## Usage

```ts
import { generateKey, generateKeys } from "lexicographic-keys";

generateKey(); // 'V': first item
generateKey("A", "B"); // 'AV': insert between items
generateKey(undefined, "A"); // '5': prepend
generateKey("z"); // 'zV': append
generateKeys(undefined, undefined, 3); // ['F', 'V', 'k']: initial batch
generateKeys("A", "B", 3); // ['AF', 'AV', 'Ak']: insert between items
```

Store each key alongside its item. Sort keys with `<`, `>`, or default `.sort()`,
not `localeCompare`. Database sorting must use the same case-sensitive order:
`0–9`, then `A–Z`, then `a–z`.

## API

```ts
generateKey(start?: string, end?: string): string
generateKeys(start?: string, end?: string, count = 1): string[]
```

Returns one key or a sorted batch strictly between the bounds. Omit `start` to
prepend or `end` to append. `count` must be a nonnegative safe integer.

Bounds must be nonempty strings containing only `0–9`, `A–Z`, and `a–z`.
Invalid bounds or counts throw. Use generated keys as bounds to avoid invalid gaps.

Identical inputs produce identical keys, so coordinate concurrent inserts into the
same gap.

## Signed 32-bit integer keys

```ts
import { generateInt32Key, generateInt32Keys } from "lexicographic-keys";

generateInt32Key(); // -1: first item
generateInt32Key(-20, -10); // -15: negative keys
generateInt32Key(0); // 1_073_741_823: positive keys
generateInt32Keys(10, 20, 3); // [12, 15, 17]: insert between items
generateInt32Key(10, 11); // throws RangeError: no integer fits
```

```ts
generateInt32Key(start?: number, end?: number): number
generateInt32Keys(start?: number, end?: number, count = 1): number[]
```

Returns one integer or an evenly spaced, ascending batch strictly between the
bounds. Omitted bounds default to `-2_147_483_648` and `2_147_483_647`; neither
endpoint is generated. Supply `0` as the lower bound to generate positive keys.
Sort numeric keys with `.sort((a, b) => a - b)`.

Bounds must be integers within the inclusive signed 32-bit range. Non-number
bounds throw `TypeError`; fractional, nonfinite, out-of-range, reversed, or equal
bounds throw `RangeError`. `count` must be a nonnegative safe integer, or a
`RangeError` is thrown. Zero returns `[]` after validating the bounds and their
order, even when the bounds are adjacent.

Unlike string keys, integer keys have finite space. If a gap cannot fit the
requested count, generation throws `RangeError`; the caller must renumber stored
keys before retrying. Identical inputs produce identical keys, so coordinate
concurrent inserts into the same gap.

## Releasing

1. On `main`, run `npm version patch --no-git-tag-version` (or choose `minor` or
   `major`) and move the changes under `Unreleased` in `CHANGELOG.md` into a dated
   version entry, leaving an empty `Unreleased` section.
2. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check`,
   `npm test`, and `npm pack --dry-run`. Review the package contents.
3. Commit and push the changes to origin. Create and push an annotated tag matching
   the package version, such as `v0.1.1`.
4. Publish a GitHub release for that tag, using the changelog entry as its notes.
   The publishing workflow checks the tag and runs the checks before publishing to
   npm. Releases marked as prereleases are skipped.

The initial `0.1.0` release is published from the authenticated npm CLI. During that
GitHub release, temporarily disable `publish.yml` to avoid publishing it twice,
then re-enable it. Future releases use [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/):
configure GitHub owner `nick-kang`, repository `lexicographic-keys`, workflow
`publish.yml`, no environment, and allow direct publishing in the npm package
settings. No npm token secret is needed.
