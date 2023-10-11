import resolveObjectPath from './resolveObjectPath';

describe('resolveObjectPath', function () {
  let config;

  beforeEach(function () {
    config = {
      active: {
        user: {
          name: {
            first: 'John',
            last: 'Doe',
          },
        },
        servers: [
          {
            ipv4: '10.0.0.1',
          },
        ],
      },
    };
  });

  it('should safely return deeply nested values from an object', function () {
    expect(resolveObjectPath(config, 'active.user.name.first')).toBe('John');
    expect(resolveObjectPath(config, 'active.user.name.last')).toBe('Doe');
    expect(resolveObjectPath(config, 'active.servers.0.ipv4')).toBe('10.0.0.1');
  });

  it('should silently return undefined when intermediate values are not valid objects', function () {
    expect(resolveObjectPath(config, 'active.usr.name.first')).toBeUndefined();
    expect(resolveObjectPath(config, 'active.name.last')).toBeUndefined();
    expect(resolveObjectPath(config, 'active.servers.7.ipv4')).toBeUndefined();
  });
});
