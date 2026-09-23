# Changelog

## Unreleased

## 0.3.1 - 2026-09-22

- Speed up key generation by decoding base62 digits in chunks, reusing the interval span, and scanning each candidate prefix once. Generated keys remain unchanged.

## 0.3.0 - 2026-09-21

- Remove `generateInt32Key` and `generateInt32Keys` (breaking change): fixed-width integer keys allow only roughly 31 rounds of repeated midpoint insertion before a gap is exhausted. Use `generateKey` and `generateKeys`, which grow as needed, instead.

## 0.2.0 - 2026-09-21

- Add `generateInt32Key` and `generateInt32Keys` for signed 32-bit integer ordering keys with exclusive bounds and exhausted-gap validation.

## 0.1.0 - 2026-09-21

- Initial release with `generateKey` and `generateKeys` for single and batch key generation.
- Input validation for base62 bounds, ascending intervals, and nonnegative safe integer counts.
- ESM exports and TypeScript declarations with no runtime dependencies.
