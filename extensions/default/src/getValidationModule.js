const validationModule = () => {
  return {
    id: 'default-validations',
    validations: [
      {
        type: 'multiframe',
        validation: instances => {
          // const results = await fetch('some-service-only-that-validates-SR-objects')
          // results.map()

          // validate instances
          return [
            {
              code: 'this-is-bad-001',
              messageType: 'toast',
              message: 'This displaySet is invalid!', // can be translated
              hangingProtocol: 'hanging-protocol-id', // maybe set a hanging protocol that disables a few tools?
            },
          ];
        },
      },
      {
        type: 'singleframe',
        validation: displaySet => {
          // validate x
          return {
            code: 'this-is-bad-001',
            messageType: 'toast',
            message: 'This displaySet is invalid!', // can be translated
            hangingProtocol: 'hanging-protocol-id', // maybe set a hanging protocol that disables a few tools?
          };
        },
      },
      {
        type: 'displaySet',
        validation: displaySet => {
          // validate x
          return {
            code: 'this-is-bad-001',
            messageType: 'toast',
            message: 'This displaySet is invalid!', // can be translated
            hangingProtocol: 'hanging-protocol-id', // maybe set a hanging protocol that disables a few tools?
          };
        },
      },
      {
        type: 'study',
        validation: (studyMetadata, displaySet) => {
          // validate x
          return {
            code: 'this-is-bad-001',
            messageType: 'toast',
            message: 'This study is invalid!', // can be translated
            hangingProtocol: 'hanging-protocol-id', // maybe set a hanging protocol that disables a few tools?
          };
        },
      },
      {
        type: 'series',
        validation: (seriesMetadata, displaySet) => {
          // validate x
          return {
            code: 'this-is-bad-001',
            messageType: 'toast',
            message: 'This series is invalid!', // can be translated
            hangingProtocol: 'hanging-protocol-id', // maybe set a hanging protocol that disables a few tools?
          };
        },
      },
      {
        type: 'image',
        validation: (imageMetadata, displaySet) => {
          // validate here
          return {
            code: 'this-is-bad-001',
            messageType: 'toast',
            message: 'This image is invalid!', // can be translated
            hangingProtocol: 'hanging-protocol-id', // maybe set a hanging protocol that disables a few tools?
          };
        },
      },
    ],
  };
};
