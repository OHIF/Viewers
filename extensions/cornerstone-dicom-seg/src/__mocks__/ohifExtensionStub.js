// Resolution target for the `@ohif/extension-*` imports in unit tests; a test
// gives the members that it needs with `jest.mock`. A member that no test mocks
// throws, so a missing `jest.mock` fails with a clear message.
module.exports = new Proxy(
  {},
  {
    get(_target, member) {
      if (typeof member === 'symbol' || member === '__esModule' || member === 'then') {
        return undefined;
      }
      throw new Error(`ohifExtensionStub: mock the member "${member}" with jest.mock`);
    },
  }
);
