const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const base = 62n;

function encode(key: string): bigint {
  let value = 0n;
  for (const character of key) {
    value = value * base + BigInt(alphabet.indexOf(character));
  }
  return value;
}

function decode(value: bigint, width: number): string {
  let key = "";
  while (value > 0n) {
    key = alphabet[Number(value % base)] + key;
    value /= base;
  }
  return key.padStart(width, "0");
}

/**
 * Return `count` distinct, ascending base62 keys strictly between the bounds.
 * Keys never end in `0`. Sort with `<`, `>`, or `.sort()`, not `localeCompare`.
 * Identical inputs produce identical keys, including across concurrent calls.
 *
 * @param start - Exclusive lower bound; `undefined` means beginning of key space.
 * @param end - Exclusive upper bound; `undefined` means end of key space.
 * @param count - Nonnegative safe integer, default 1. Zero still validates bounds.
 * @throws {TypeError} A supplied bound is not a nonempty `[0-9A-Za-z]` string.
 * @throws {RangeError} Invalid count, reversed/equal bounds, or zero-suffix gaps
 * (`A` to `A00`, or `undefined` to `0`).
 *
 * @example
 * generateKeys();               // ['V']
 * generateKeys('A', 'B', 3);     // ['AF', 'AV', 'Ak']
 * generateKeys(undefined, 'A'); // ['5']: prepend
 * generateKeys('z');            // ['zV']: append
 */
function generateKeys(start?: string, end?: string, count = 1): string[] {
  for (const bound of [start, end]) {
    if (
      bound !== undefined &&
      (typeof bound !== "string" || bound.length === 0 || /[^0-9A-Za-z]/.test(bound))
    ) {
      throw new TypeError("Bounds must be nonempty base62 strings or undefined");
    }
  }
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError("Count must be a nonnegative safe integer");
  }

  let width = Math.max(start?.length ?? 0, end?.length ?? 0, 1);
  let low = encode((start ?? "").padEnd(width, "0"));
  let high = end === undefined ? base ** BigInt(width) : encode(end.padEnd(width, "0"));
  if (low >= high) {
    throw new RangeError("Bounds must be ascending and differ by more than trailing zeroes");
  }
  if (count === 0) return [];

  const divisions = BigInt(count) + 1n;
  while (high - low < divisions) {
    low *= base;
    high *= base;
    width++;
  }

  let previous = start ?? "";
  return Array.from({ length: count }, (_, index) => {
    const value = low + ((high - low) * (BigInt(index) + 1n)) / divisions;
    let key = decode(value, width);
    // Shorten without crossing the preceding key or creating a zero-suffix gap.
    for (let length = 1; length <= key.length; length++) {
      if (key[length - 1] === "0") continue;
      const prefix = key.slice(0, length);
      if (prefix > previous) {
        key = prefix;
        break;
      }
    }
    previous = key;
    return key;
  });
}

/** Return one key using the same bounds and validation as {@link generateKeys}. */
function generateKey(start?: string, end?: string): string {
  return generateKeys(start, end, 1).join("");
}

export { generateKey, generateKeys };
