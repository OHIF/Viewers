import { copyTextToClipboard } from './copyTextToClipboard';

describe('copyTextToClipboard', () => {
  it('returns false when the Clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    await expect(copyTextToClipboard('error details')).resolves.toBe(false);
  });

  it('returns false when the browser rejects clipboard access', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: jest.fn().mockRejectedValue(new DOMException('Not allowed', 'NotAllowedError')),
      },
    });

    await expect(copyTextToClipboard('error details')).resolves.toBe(false);
  });

  it('returns false when clipboard access throws synchronously', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: jest.fn(() => {
          throw new DOMException('Not allowed', 'NotAllowedError');
        }),
      },
    });

    await expect(copyTextToClipboard('error details')).resolves.toBe(false);
  });

  it('copies text when clipboard access is available', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await expect(copyTextToClipboard('error details')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('error details');
  });
});
