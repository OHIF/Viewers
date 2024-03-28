import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon/Icon';

function LayoutPreset({ onSelection, title, icon, commandOptions, classNames }) {
  return (
    <div
      className={classNames}
      onClick={() => {
        onSelection(commandOptions);
      }}
    >
      <Icon
        name={icon}
        className="group-hover:text-primary-light"
      />
      {title && <div className="font-inter text-sm text-white">{title}</div>}
    </div>
  );
}

LayoutPreset.defaultProps = {
  onSelection: () => {},
};

LayoutPreset.propTypes = {
  onSelection: PropTypes.func.isRequired,
  title: PropTypes.string,
  icon: PropTypes.string.isRequired,
  commandOptions: PropTypes.object.isRequired,
  classNames: PropTypes.string,
};

export default LayoutPreset;
