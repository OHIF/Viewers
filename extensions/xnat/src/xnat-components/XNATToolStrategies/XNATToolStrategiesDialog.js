import React, { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import XNATToolStrategyButton from './XNATToolStrategyButton';

import './XNATToolStrategiesDialog.styl';

const _state = {
  keepExpanded: false,
};

const XNATToolStrategiesDialog = ({ toolStrategies, tool }) => {
  const [activeStrategyId, setActiveStrategyId] = useState(tool.activeStrategy);
  const [isExpanded, setExpanded] = useState(_state.keepExpanded);

  useEffect(() => {
    setActiveStrategyId(tool.activeStrategy);
    return () => {
      // debugger;
      const defaultStrategy = tool.defaultStrategy;
      if (defaultStrategy) {
        tool.setActiveStrategy(defaultStrategy);
      }
    };
  }, [tool]);

  useEffect(() => {
    _state.keepExpanded = isExpanded;
  }, [isExpanded]);

  const onStrategyChanged = newStrategyId => {
    tool.setActiveStrategy(newStrategyId);
    setActiveStrategyId(newStrategyId);
  };

  let className = 'XNATToolStrategiesDialog';
  if (isExpanded) {
    className += ' expanded';
  }

  const expandStyle = isExpanded
    ? { transform: 'rotate(270deg)' }
    : { transform: 'rotate(90deg)' };

  return (
    <div className={className}>
      <div className="dialogHandle" title="Tool Variants">
        <div
          className="expandIconContainer"
          onClick={() => setExpanded(!isExpanded)}
          title={isExpanded ? 'Hide Tools' : 'Show Tools'}
        >
          <Icon
            name="angle-double-up"
            width="14px"
            height="14px"
            style={expandStyle}
          />
        </div>
        <Icon name="xnat-dialog-handle" width="14px" height="42px" />
      </div>
      {isExpanded &&
        toolStrategies.map((strategy, index) => (
          <XNATToolStrategyButton
            key={index}
            strategyId={strategy.id}
            isActive={strategy.id === activeStrategyId}
            label={strategy.label}
            icon={strategy.icon}
            onClick={onStrategyChanged}
          />
        ))}
    </div>
  );
};

XNATToolStrategiesDialog.propTypes = {
  toolStrategies: PropTypes.array.isRequired,
  tool: PropTypes.object.isRequired,
};

export default memo(XNATToolStrategiesDialog);
