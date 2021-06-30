const hangingProtocolName = 'petCT';

const petCTProtocol = {
  id: 'PET/CT',
  locked: true,
  hasUpdatedPriorsInformation: false,
  name: 'PET/CT',
  createdDate: '2021-02-23T18:32:42.849Z',
  modifiedDate: '2021-02-23T18:32:42.849Z',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [
    {
      id: 'wauZK2QNEfDPwcAQo',
      weight: 1,
      attribute: 'StudyInstanceUID',
      constraint: {
        equals: {
          value: '1.3.6.1.4.1.25403.345050719074.3824.20170125112931.11',
        },
      },
      required: true,
    },
  ],
  stages: [
    {
      id: 'hYbmMy3b7pz7GLiaT',
      name: 'oneByTwo',
      viewportStructure: {
        type: 'grid',
        properties: {
          rows: 2,
          columns: 2,
        },
      },
      viewports: [
        {
          viewportSettings: [
            {
              options: {
                voi: {
                  windowWidth: 500,
                  windowCenter: 500,
                },
              },
              commandName: '',
              // Type can be viewport or prop
              // viewport:  It is most suited for settings that
              // should be applied before the first render
              // prop: It is the type of command that can be applied
              // after the image render, such as tool activations.
              type: 'viewport',
            },
          ],
          imageMatchingRules: [],
          seriesMatchingRules: [
            {
              id: 'vSjk7NCYjtdS3XZAw',
              weight: 1,
              attribute: 'SeriesNumber',
              constraint: {
                equals: {
                  value: "4",
                },
              },
              required: false,
            },
          ],
          studyMatchingRules: [],
        },
        {
          viewportSettings: [
            {
              options: {
                invert: true,
              },
              commandName: '',
              type: 'viewport',
            },
          ],
          imageMatchingRules: [

          ],
          seriesMatchingRules: [
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'SeriesNumber',
              constraint: {
                equals: {
                  value: "1",
                },
              },
              required: false,
            },
          ],
          studyMatchingRules: [

          ],
        },
        {
          viewportSettings: [
            {
              options: {
                invert: true,
              },
              commandName: '',
              type: 'viewport',
            },
          ],
          imageMatchingRules: [

          ],
          seriesMatchingRules: [
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'SeriesNumber',
              constraint: {
                equals: {
                  value: "6",
                },
              },
              required: false,
            },
          ],
          studyMatchingRules: [

          ],
        },
        {
          viewportSettings: [
            {
              options: {
                invert: true,
              },
              commandName: '',
              type: 'viewport',
            },
          ],
          imageMatchingRules: [

          ],
          seriesMatchingRules: [
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'SeriesDescription',
              constraint: {
                contains: {
                  value: "Corrected",
                },
              },
              required: false,
            },
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 2,
              attribute: 'SeriesDescription',
              constraint: {
                doesNotContain: {
                  value: "Uncorrected",
                },
              },
              required: false,
            },
          ],
          studyMatchingRules: [

          ],
        },
      ],
      createdDate: '2021-02-23T18:32:42.850Z',
    },
  ],
  numberOfPriorsReferenced: 0,
};

function getHangingProtocolModule() {
  return [
    {
      name: hangingProtocolName,
      protocols: [petCTProtocol],
    },
  ];
}

export default getHangingProtocolModule;
