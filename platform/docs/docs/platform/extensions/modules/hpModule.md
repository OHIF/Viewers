---
sidebar_position: 8
sidebar_label: Hanging Protocol
---
# Module: Hanging Protocol

## Overview
`hangingProtocolModule` provides the protocols for hanging the displaySets in the viewer.
This module can be as simple as loading a list of pre-defined protocols, or it can be more complex
and `fetch` the protocols from a server.

You can read more about hanging protocols in HangingProtocolService.

```js
const deafultProtocol = {
  id: 'defaultProtocol',
  locked: true,
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2021-02-23T19:22:08.894Z',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [],
  stages: [
    {
      id: 'nwzau7jDkEkL8djfr',
      name: 'oneByOne',
      viewportStructure: {
        type: 'grid',
        properties: {
          rows: 1,
          columns: 1,
        },
      },
      viewports: [
        {
          viewportSettings: [],
          imageMatchingRules: [],
          seriesMatchingRules: [],
          studyMatchingRules: [],
        },
      ],
      createdDate: '2021-02-23T19:22:08.894Z',
    },
  ],
  numberOfPriorsReferenced: -1,
};

function getHangingProtocolModule() {
  return [
    {
      name: hangingProtocolName,
      protocols: [deafultProtocol],
    },
  ];
}
```
