/**
 * Attempts to copy text without exposing Clipboard API availability or permission failures.
 *
 * @returns Whether the browser confirmed that the text was copied.
 */
export function copyTextToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return Promise.resolve(false);
  }

  return Promise.resolve()
    .then(() => navigator.clipboard.writeText(text))
    .then(
      () => true,
      () => false
    );
}
