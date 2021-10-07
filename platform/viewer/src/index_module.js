import React from 'react';

import OHIFDefaultExtension from '@ohif/extension-default';
import OHIFCornerstoneExtension from '@ohif/extension-cornerstone';
import OHIFMeasurementTrackingExtension from '@ohif/extension-measurement-tracking';
import OHIFDICOMSRExtension from '@ohif/extension-dicom-sr';

import App from './App.jsx';
import defaultConfig from '../public/config/default';

const LanternViewer = ({ accessToken, studyUID, gcpDicomURL }) => {
  const appConfig = {
    ...defaultConfig,
    whiteLabeling: {
      createLogoComponentFn: () => <div></div>,
    },
    dataSources: [
      {
        friendlyName: 'New Lantern DICOM server',
        namespace: 'org.ohif.default.dataSourcesModule.dicomweb',
        sourceName: 'dicomweb',
        configuration: {
          name: 'New Lantern',
          wadoUriRoot: gcpDicomURL,
          qidoRoot: gcpDicomURL,
          wadoRoot: gcpDicomURL,
          qidoSupportsIncludeField: true,
          imageRendering: 'wadors',
          thumbnailRendering: 'wadors',
          enableStudyLazyLoad: true,
          supportsFuzzyMatching: true,
          supportsWildcard: false,
        },
      },
    ],
  };

  const appProps = {
    config: appConfig,
    defaultExtensions: [
      OHIFDefaultExtension,
      OHIFCornerstoneExtension,
      OHIFMeasurementTrackingExtension,
      OHIFDICOMSRExtension,
    ],
  };

  return <App {...appProps} accessToken={accessToken} studyUID={studyUID} />;
};

export default LanternViewer;
