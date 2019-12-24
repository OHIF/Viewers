import absoluteUrl from './absoluteUrl';

describe('absoluteUrl', () => {
  test('should return /path_1/path_2/path_3/path_to_destination when the window.location.origin is http://dummy.com/path_1/path_2 and the path is /path_3/path_to_destination', () => {
    let global = {
      window: Object.create(window),
    };
    const url = 'http://dummy.com/path_1/path_2';
    Object.defineProperty(window, 'location', {
      value: {
        origin: url,
      },
      writable: true,
    });
    const absoluteUrlOutput = absoluteUrl('/path_3/path_to_destination');
    expect(absoluteUrlOutput).toEqual(
      '/path_1/path_2/path_3/path_to_destination'
    );
  });

  test('should return / when the path is not defined', () => {
    const absoluteUrlOutput = absoluteUrl(undefined);
    expect(absoluteUrlOutput).toBe('/');
  });

  test('should return the original path when there path in the window.origin after the domain and port', () => {
    global.window = Object.create(window);
    const url = 'http://dummy.com';
    Object.defineProperty(window, 'location', {
      value: {
        origin: url,
      },
      writable: true,
    });
    const absoluteUrlOutput = absoluteUrl('path_1/path_2/path_3');
    expect(absoluteUrlOutput).toEqual('/path_1/path_2/path_3');
  });

  test('should be able to return the absolute path even when the path contains duplicates', () => {
    global.window = Object.create(window);
    const url = 'http://dummy.com';
    Object.defineProperty(window, 'location', {
      value: {
        origin: url,
      },
      writable: true,
    });
    const absoluteUrlOutput = absoluteUrl('path_1/path_1/path_1');
    expect(absoluteUrlOutput).toEqual('/path_1/path_1/path_1');
  });
});
