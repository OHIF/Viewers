import getUserManagerForOpenIdConnectClient from './getUserManagerForOpenIdConnectClient.js';

describe('getUserManagerForOpenIdConnectClient', () => {
  it('returns undefined if store is not provided', () => {
    const expectedReturnVal = undefined;
    const returnVal = getUserManagerForOpenIdConnectClient(undefined, {});

    expect(returnVal).toEqual(expectedReturnVal);
  });

  it('returns undefined if oidcSettings are not provided', () => {
    const expectedReturnVal = undefined;
    const returnVal = getUserManagerForOpenIdConnectClient({}, undefined);

    expect(returnVal).toEqual(expectedReturnVal);
  });

  it('does not return undefined when store and oidcSettings are defined', () => {
    const returnVal = getUserManagerForOpenIdConnectClient({}, {});

    expect(returnVal).not.toBe(undefined);
  });
});
