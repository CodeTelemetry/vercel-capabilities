import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { sum } from './src.mjs';

test('the checked-in acceptance expectation matches the calculation', () => {
  const { expectedSum } = JSON.parse(readFileSync(new URL('./expectation.json', import.meta.url)));
  assert.equal(sum([1, 2, 3]), expectedSum);
});
test('empty input has a zero total', () => assert.equal(sum([]), 0));
test('negative numbers are supported', () => assert.equal(sum([-4, 2]), -2));
test('invalid inputs are refused', () => {
  for (const input of [null, {}, [NaN], [Infinity], ['1'], new Array(101).fill(1)]) {
    assert.throws(() => sum(input), TypeError);
  }
});
test('overflow is refused', () => assert.throws(() => sum([Number.MAX_VALUE, Number.MAX_VALUE]), RangeError));
