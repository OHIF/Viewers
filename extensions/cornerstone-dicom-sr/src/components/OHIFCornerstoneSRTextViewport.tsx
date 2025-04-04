import PropTypes from 'prop-types';
import React from 'react';
import { ExtensionManager } from '@ohif/core';
import { OHIFCornerstoneSRContainer } from './OHIFCornerstoneSRContainer';

function OHIFCornerstoneSRTextViewport(props: withAppTypes) {
  const { displaySets } = props;
  const displaySet = displaySets[0];
  const instance = displaySet.instances[0];

  return (
    <div className="relative flex h-full w-full flex-col overflow-auto p-4 text-white">
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
