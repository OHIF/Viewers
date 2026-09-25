// Minimal 1x1 hanging protocol: one stage, one viewport, matching any display
// set (empty seriesMatchingRules). For real matching rules and multi-stage
// protocols, see extensions/default/src/hangingprotocols/ in the OHIF repo.
const protocol = {
  id: 'example',
  name: 'Example 1x1',
  protocolMatchingRules: [],
  displaySetSelectors: {
    defaultDisplaySet: {
      seriesMatchingRules: [],
    },
  },
  stages: [
    {
      name: 'default',
      viewportStructure: {
        layoutType: 'grid',
        properties: { rows: 1, columns: 1 },
      },
      viewports: [
        {
          viewportOptions: { allowUnmatchedView: true },
          displaySets: [{ id: 'defaultDisplaySet' }],
        },
      ],
    },
  ],
};

/**
 * Protocols returned with a `protocol` property are auto-registered with the
 * HangingProtocolService under `{{name}}.hangingProtocolModule.example`.
 */
export default function getHangingProtocolModule() {
  return [
    {
      name: 'example',
      protocol,
    },
  ];
}
