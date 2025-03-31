import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import { CheckIcon } from '../../elements';

const XNATViewportMenuCheckItem = props => {
  const { property, label, icon, isChecked, onClick } = props;

  return (
    <li
      className="ViewportMenuRow"
      onClick={evt => {
        evt.stopPropagation();
        onClick({ [property]: !isChecked });
      }}
    >
      <div className="ViewportMenuIcon">
        <Icon name={icon} />
      </div>
      <div className="ViewportMenuLabel">{label}</div>
      <CheckIcon checked={isChecked} />
    </li>
  );
};

XNATViewportMenuCheckItem.propTypes = {
  property: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  isChecked: PropTypes.bool,
  onClick: PropTypes.func,
};

XNATViewportMenuCheckItem.defaultProps = {};

export default XNATViewportMenuCheckItem;
