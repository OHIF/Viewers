export default function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}
