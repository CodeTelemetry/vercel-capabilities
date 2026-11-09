export function sum(values) {
  if (!Array.isArray(values) || values.length > 100) {
    throw new TypeError('Expected an array of at most 100 numbers');
  }
  if (!values.every(Number.isFinite)) {
    throw new TypeError('Expected finite numbers');
  }
  const total = values.reduce((result, value) => result + value, 0);
  if (!Number.isFinite(total)) throw new RangeError('Total must be finite');
  return total;
}
