/**
 * @jest-environment node
 *
 * Runs in node (not jsdom): jsdom (jest 30) exposes `window.location` as an
 * unforgeable, non-configurable property that can't be replaced or stubbed.
 * absoluteUrl only reads `window.location.origin` and this suite imports nothing
 * that needs the DOM, so we run without jsdom and provide a plain `window`.
 */
import absoluteUrl from './absoluteUrl';

describe('absoluteUrl', () => {
  const setOrigin = url => {
    global.window = { location: { origin: url } };
  };

  afterEach(() => {
    delete global.window;
  });

  test('should return /path_1/path_2/path_3/path_to_destination when the window.location.origin is http://dummy.com/path_1/path_2 and the path is /path_3/path_to_destination', () => {
    setOrigin('http://dummy.com/path_1/path_2');
    const absoluteUrlOutput = absoluteUrl('/path_3/path_to_destination');
    expect(absoluteUrlOutput).toEqual('/path_1/path_2/path_3/path_to_destination');
  });

  test('should return / when the path is not defined', () => {
    const absoluteUrlOutput = absoluteUrl(undefined);
    expect(absoluteUrlOutput).toBe('/');
  });

  test('should return the original path when there path in the window.origin after the domain and port', () => {
    setOrigin('http://dummy.com');
    const absoluteUrlOutput = absoluteUrl('path_1/path_2/path_3');
    expect(absoluteUrlOutput).toEqual('/path_1/path_2/path_3');
  });

  test('should be able to return the absolute path even when the path contains duplicates', () => {
    setOrigin('http://dummy.com');
    const absoluteUrlOutput = absoluteUrl('path_1/path_1/path_1');
    expect(absoluteUrlOutput).toEqual('/path_1/path_1/path_1');
  });
});
