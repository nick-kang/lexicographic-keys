import assert from "node:assert/strict";
import test from "node:test";
import { generateKey, generateKeys, generateInt32Key, generateInt32Keys } from "../src/index.ts";

test("generateKey returns one string and propagates bound validation", () => {
  assert.equal(generateKey(), "V");
  assert.equal(generateKey("A", "B"), "AV");
  assert.equal(generateKey(undefined, "A"), "5");
  assert.equal(generateKey("z"), "zV");
  assert.throws(() => generateKey(""), TypeError);
  assert.throws(() => generateKey(undefined, "A!"), TypeError);
  assert.throws(() => generateKey("B", "A"), RangeError);
  assert.throws(() => generateKey("A", "A"), RangeError);
  assert.throws(() => generateKey("A", "A00"), RangeError);
  assert.throws(() => generateKey(undefined, "0"), RangeError);
});

function check(start: string | undefined, end: string | undefined, count: number): string[] {
  const keys = generateKeys(start, end, count);
  assert.equal(keys.length, count);
  let previous = start ?? "";
  for (const key of keys) {
    assert.match(key, /^[0-9A-Za-z]+$/);
    assert.ok(!key.endsWith("0"));
    assert.ok(key > previous, `${key} must follow ${previous}`);
    if (end !== undefined) assert.ok(key < end, `${key} must precede ${end}`);
    previous = key;
  }
  return keys;
}

test("examples, omitted bounds, and zero count", () => {
  assert.deepEqual(generateKeys(), ["V"]);
  assert.deepEqual(generateKeys("A", "B", 3), ["AF", "AV", "Ak"]);
  assert.deepEqual(generateKeys(undefined, undefined, 10), [
    "5",
    "B",
    "G",
    "M",
    "S",
    "X",
    "d",
    "j",
    "o",
    "u",
  ]);
  check(undefined, "0001", 100);
  check("z", undefined, 100);
  assert.deepEqual(generateKeys("A", "B", 0), []);
  assert.deepEqual(generateKeys(undefined, undefined, 0), []);
});

test("ordering and count across prefix, narrow, and unequal-length intervals", () => {
  const bounds = [
    undefined,
    ...["0", "1", "A", "B", "z"].flatMap((character) => [
      character,
      ...["0", "1", "A", "z"].map((suffix) => character + suffix),
    ]),
  ];
  for (const start of bounds) {
    for (const end of bounds) {
      if (start !== undefined && end !== undefined && start >= end) continue;
      for (const count of [0, 1, 2, 10, 100]) {
        if (end !== undefined && (start ?? "").replace(/0+$/, "") === end.replace(/0+$/, "")) {
          assert.throws(() => generateKeys(start, end, count), RangeError);
        } else {
          check(start, end, count);
        }
      }
    }
  }
});

test("long keys and repeated insertion retain precision", () => {
  const prefix = "A".repeat(500);
  check(prefix + "0", prefix + "1", 100);
  check("z".repeat(500), undefined, 100);
  let left = "A";
  let right = "B";
  for (let index = 0; index < 500; index++) {
    [left] = check(left, "B", 1);
    [right] = check("A", right, 1);
  }
});

test("invalid bounds and counts are rejected, including for empty batches", () => {
  for (const bound of ["", null, 1, {}, [], "A!", "A B", "é", "😀", "A\n", "A\r"]) {
    for (const count of [0, 1]) {
      // @ts-expect-error Exercise invalid inputs from JavaScript callers.
      assert.throws(() => generateKeys(bound, undefined, count), TypeError);
      // @ts-expect-error Exercise invalid inputs from JavaScript callers.
      assert.throws(() => generateKeys(undefined, bound, count), TypeError);
    }
  }
  for (const count of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "1", null, 1n]) {
    // @ts-expect-error Exercise invalid inputs from JavaScript callers.
    assert.throws(() => generateKeys("A", "B", count), RangeError);
  }
  for (const [start, end] of [
    ["B", "A"],
    ["A", "A"],
    ["A", "A00"],
    ["A0", "A00"],
    ["A00", "A"],
    [undefined, "0"],
    [undefined, "000"],
  ]) {
    for (const count of [0, 1]) {
      assert.throws(() => generateKeys(start, end, count), RangeError);
    }
  }
});

test("Int32 examples, omitted bounds, exact capacity, and zero count", () => {
  assert.equal(generateInt32Key(), -1);
  assert.deepEqual(generateInt32Keys(), [-1]);
  assert.deepEqual(generateInt32Keys(undefined, undefined, 3), [-1_073_741_825, -1, 1_073_741_823]);
  assert.equal(generateInt32Key(-20, -10), -15);
  assert.equal(generateInt32Key(0), 1_073_741_823);
  assert.equal(generateInt32Key(undefined, 0), -1_073_741_824);
  assert.deepEqual(generateInt32Keys(10, 20, 3), [12, 15, 17]);
  assert.deepEqual(generateInt32Keys(-3, 3, 5), [-2, -1, 0, 1, 2]);
  assert.equal(generateInt32Key(-2_147_483_648, -2_147_483_646), -2_147_483_647);
  assert.equal(generateInt32Key(2_147_483_645, 2_147_483_647), 2_147_483_646);
  assert.deepEqual(generateInt32Keys(undefined, undefined, 0), []);
  assert.deepEqual(generateInt32Keys(10, 11, 0), []);
  assert.throws(() => generateInt32Key(10, 11), RangeError);
  assert.throws(() => generateInt32Keys(-3, 3, 6), RangeError);
  assert.throws(() => generateInt32Keys(undefined, undefined, Number.MAX_SAFE_INTEGER), RangeError);
});

test("Int32 batches are deterministic, ordered, and inside exclusive bounds", () => {
  const bounds = [-2_147_483_648, -2_147_483_647, -20, -1, 0, 1, 20, 2_147_483_646, 2_147_483_647];
  for (const start of bounds) {
    for (const end of bounds) {
      if (start >= end) continue;
      for (const count of [0, 1, 2, 10, 100]) {
        if (count > end - start - 1) {
          assert.throws(() => generateInt32Keys(start, end, count), RangeError);
          continue;
        }
        const keys = generateInt32Keys(start, end, count);
        assert.equal(keys.length, count);
        assert.deepEqual(keys, generateInt32Keys(start, end, count));
        let previous = start;
        for (const key of keys) {
          assert.ok(Number.isInteger(key));
          assert.ok(key > previous && key < end);
          previous = key;
        }
        // The count + 1 gaps must differ by at most one integer.
        const gaps = [...keys, end].map(
          (key, index) => key - (index === 0 ? start : keys[index - 1]),
        );
        assert.ok(Math.max(...gaps) - Math.min(...gaps) <= 1);
      }
    }
  }
});

test("Int32 invalid bounds and counts are rejected, including for empty batches", () => {
  for (const bound of [
    null,
    "1",
    {},
    [],
    true,
    1n,
    NaN,
    Infinity,
    -Infinity,
    0.5,
    -2_147_483_649,
    2_147_483_648,
  ]) {
    const error = typeof bound === "number" ? RangeError : TypeError;
    // @ts-expect-error Exercise invalid inputs from JavaScript callers.
    assert.throws(() => generateInt32Key(bound), error);
    // @ts-expect-error Exercise invalid inputs from JavaScript callers.
    assert.throws(() => generateInt32Key(undefined, bound), error);
    for (const count of [0, 1]) {
      // @ts-expect-error Exercise invalid inputs from JavaScript callers.
      assert.throws(() => generateInt32Keys(bound, undefined, count), error);
      // @ts-expect-error Exercise invalid inputs from JavaScript callers.
      assert.throws(() => generateInt32Keys(undefined, bound, count), error);
    }
  }
  for (const count of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "1", null, 1n]) {
    // @ts-expect-error Exercise invalid inputs from JavaScript callers.
    assert.throws(() => generateInt32Keys(undefined, undefined, count), RangeError);
  }
  for (const [start, end] of [
    [1, -1],
    [0, 0],
    [undefined, -2_147_483_648],
    [2_147_483_647, undefined],
  ]) {
    assert.throws(() => generateInt32Key(start, end), RangeError);
    for (const count of [0, 1]) {
      assert.throws(() => generateInt32Keys(start, end, count), RangeError);
    }
  }
});
