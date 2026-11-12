export function dicomSplit(value) {
  return (
    (Array.isArray(value) && value) || (typeof value === 'string' && value.split('\\')) || value
  );
}
