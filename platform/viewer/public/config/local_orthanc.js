window.config = {
  // default: '/'
  routerBasename: '/',
  // default: ''
  showStudyList: true,
  servers: {
    dicomWeb: [
      {
        name: 'Orthanc',
        wadoUriRoot: 'http://localhost:8042/wado',
        qidoRoot: 'http://localhost:8042/dicom-web',
        wadoRoot: 'http://localhost:8042/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadouri',
        thumbnailRendering: 'wadors',
        requestOptions: {
          auth: 'alice:alicePassword',
          logRequests: true,
          logResponses: false,
          logTiming: true,
        },
      },
    ],
  },
  studyListFunctionsEnabled: true,
  cornerstoneExtensionConfig: {},
  extensions: [
    {
      id: "myCustomExtension",
      getToolbarModule() {
        return {
          definitions: [
            {
              id: "say-hell-world",
              label: "🎉 HELLO WORLD 🎉",
              icon: "exclamation-triangle",
              type: "command",
              commandName: "sayHelloWorld"
            }
          ],
          defaultContext: "VIEWER"
        };
      },
      getCommandsModule({ servicesManager }) {
        const { UINotificationService } = servicesManager.services;
        return {
          definitions: {
            sayHelloWorld: {
              commandFn: function() {
                console.log(UINotificationService);
                UINotificationService.show({
                  title: "What does a nosey pepper do?",
                  message: "Gets jalapeno business!"
                });
              },
              storeContexts: [],
              options: {}
            }
          },
          defaultContext: ["VIEWER"]
        };
      }
    }
  ],
};
