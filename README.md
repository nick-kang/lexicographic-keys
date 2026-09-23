# lexicographic-keys

Generate sortable string keys to insert or reorder items without renumbering a
list. No runtime dependencies; TypeScript declarations included.

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
