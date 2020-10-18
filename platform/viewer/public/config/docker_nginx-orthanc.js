window.config = {
  routerBasename: '/',
  showStudyList: true,
  servers: {
    dicomWeb: [
      {
        name: 'Orthanc',
        wadoUriRoot: '/wado',
        qidoRoot: '/dicom-web',
        wadoRoot: '/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
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
  extensions: [
  ],
  whiteLabeling: {

    createLogoComponentFn: function(React) {
      return React.createElement('a', {
        target: '_self',
        rel: 'noopener noreferrer',
        className: 'header-brand',
        href: '/',
        style: {
          display: 'block',
          textIndent: '-9999px',
          background: 'url(../public/assets/logoN.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          width: '300px',
          height: "70px",
        }

      },
      // {
      //   target: '_self',
      //   rel: 'noopener noreferrer',
      //   className: 'header-logo-text',
      //   href: '/',
      //   style: {
      //     display: 'block',
      //     textIndent: '-9999px',
      //     background: 'url(../public/assets/blood-sample-21-1128351.png)',
      //     backgroundSize: 'contain',
      //     backgroundRepeat: 'no-repeat',
      //     width: '200px',
      //   }

      );
    },
  },
};
