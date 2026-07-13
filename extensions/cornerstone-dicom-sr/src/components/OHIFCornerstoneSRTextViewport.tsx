import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { ExtensionManager } from '@ohif/core';
import i18n from '@ohif/i18n';
import { OHIFCornerstoneSRContainer } from './OHIFCornerstoneSRContainer';

function OHIFCornerstoneSRTextViewport(props: withAppTypes) {
  const { displaySets, servicesManager } = props;
  const displaySet = displaySets[0];
  const instance = displaySet.instances[0];

  // A report flagged as an Imaging Measurement Report but stored without its
  // ContentSequence is downgraded to a plain SR (see getSopClassHandlerModule)
  // and lands here with nothing to show. Warn the user that the report is empty
  // when they open it.
  useEffect(() => {
    if (!displaySet.isContentlessImagingMeasurementReport) {
      return;
    }
    servicesManager.services.uiNotificationService?.show({
      title: i18n.t('Structured Report'),
      message: i18n.t('This report has no readable content and cannot be displayed.'),
      type: 'warning',
    });
  }, [displaySet.displaySetInstanceUID, servicesManager]);

  return (
    <div className="text-foreground relative flex h-full w-full flex-col overflow-auto p-4">
      <div>
        {/* The root level is always a container */}
        <OHIFCornerstoneSRContainer container={instance} />
      </div>
    </div>
  );
}

OHIFCornerstoneSRTextViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object),
  viewportId: PropTypes.string.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  viewportLabel: PropTypes.string,
  viewportOptions: PropTypes.object,
  servicesManager: PropTypes.object.isRequired,
  extensionManager: PropTypes.instanceOf(ExtensionManager).isRequired,
};

export default OHIFCornerstoneSRTextViewport;
