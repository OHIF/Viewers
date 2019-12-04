import React from 'react';
import PropTypes from 'prop-types';
import { LabellingFlowProvider } from '@ohif/ui';

const CustomLabellingFlowProvider = ({
  children,
  service,
  labellingComponent,
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
      labellingComponent={labellingComponent}
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
  labellingComponent: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func,
  ]).isRequired,
  commandsManager: PropTypes.object.isRequired,
};

export default CustomLabellingFlowProvider;
