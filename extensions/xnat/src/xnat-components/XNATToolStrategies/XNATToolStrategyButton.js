import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';

import './XNATToolStrategyButton.styl';

const XNATToolStrategyButton = props => {
  const { strategyId, isActive, label, icon, onClick } = props;

  let className = 'XNATToolStrategyButton';
  if (isActive) {
    className += ' active';
  }

  return (
    <div className={className} onClick={() => onClick(strategyId)}>
      <Icon name={icon} title={label} />
      <div className="label">{label}</div>
    </div>
  );
};

XNATToolStrategyButton.propTypes = {
  strategyId: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default memo(XNATToolStrategyButton);
