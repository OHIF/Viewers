import React from 'react';
import PropTypes from 'prop-types';

import { Button, ButtonEnums } from '../../components';

function ActionButtons({ actions, disabled = false, t }) {
  return (
    <React.Fragment>
      {actions.map((action, index) => (
        <Button
          key={index}
          onClick={action.onClick}
          disabled={disabled || action.disabled}
          type={ButtonEnums.type.secondary}
          size={ButtonEnums.size.small}
          className={index > 0 ? 'ml-2' : ''}
        >
          {t ? t(action.label) : action.label}
        </Button>
      ))}
    </React.Fragment>
  );
}

ActionButtons.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  disabled: PropTypes.bool,
};

export default ActionButtons;
