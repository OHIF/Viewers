/**
 * Stand-in for `@ohif/extension-cornerstone` under jest.
 *
 * The SOP class handler reads the cornerstone tool source name and version from
 * the cornerstone extension, and importing that package for real pulls in the
 * cornerstone rendering stack, which does not load under jsdom. The catch-all
 * `@ohif/(.*)` mapping also sends it to `platform/extension-cornerstone/src`, which
 * does not exist.
 */
module.exports = {
  Enums: {
    CORNERSTONE_3D_TOOLS_SOURCE_NAME: 'Cornerstone3DTools',
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION: '0.1',
  },
};
