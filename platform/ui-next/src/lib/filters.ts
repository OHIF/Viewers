export function tokenizeModalities(value: string): string[] {
  return String(value ?? '')
    .toUpperCase()
    .split(/[\s,\/\\]+/)
    .filter(Boolean);
}

