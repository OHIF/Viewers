import React from 'react';
import { Icon, OverlayTrigger, Tooltip } from '@ohif/ui';
import PropTypes from 'prop-types';

const ViewportOverlayWarning = props => {
  const { warningList } = props;

  if (warningList.length === 0) {
    return null;
  }

  const overlay = (
    <Tooltip placement="top" className="in tooltip-warning" id="tooltip">
      <div className="warningTitle">Inconsistencies</div>
      <div className="warningContent">
        <ol>
          {warningList.map((warn, index) => (
            <li key={index}>{warn}</li>
          ))}
        </ol>
      </div>
    </Tooltip>
  );

  return (
    <OverlayTrigger key={1} placement="top" overlay={overlay}>
      <div className="viewportWarning">
        <span className="warning-icon">
          <Icon name="exclamation-triangle" />
        </span>
      </div>
    </OverlayTrigger>
  );
};

ViewportOverlayWarning.propTypes = {
  warningList: PropTypes.array,
};

ViewportOverlayWarning.defaultProps = {
  warningList: [],
};

export default ViewportOverlayWarning;
