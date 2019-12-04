import React from 'react';
import PropTypes from 'prop-types';
import { LabellingFlowProvider } from '@ohif/ui';

const CustomLabellingFlowProvider = ({
  children,
  service,
  commandsManager,
}) => {
  const onUpdateLabellingHandler = (labellingData, measurementData) => {
    commandsManager.runCommand(
      'updateTableWithNewMeasurementData',
      measurementData
    );
  };

  return (
    <LabellingFlowProvider
      service={service}
      onUpdateLabelling={onUpdateLabellingHandler}
    >
      {children}
    </LabellingFlowProvider>
  );
};

CustomLabellingFlowProvider.defaultProps = {
  service: null,
};

CustomLabellingFlowProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }),
  commandsManager: PropTypes.object.isRequired,
};

export default CustomLabellingFlowProvider;
