import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Icon, Typography } from '../../';

/**
 * REACT CheckBox component
 * it has two props, checked and onChange
 * checked is a boolean value
 * onChange is a function that will be called when the checkbox is clicked
 *
 * CheckBox is a component that allows you to use as a boolean
 */

const CheckBox: React.FC<{
  checked: boolean;
  onChange: (state) => void;
  className?: string;
  label: string;
  labelClassName?: string;
  labelVariant?: string;
}> = ({ checked, onChange, label, labelClassName, labelVariant = 'body', className }) => {
  const [isChecked, setIsChecked] = useState(checked);

  const handleClick = useCallback(() => {
    setIsChecked(!isChecked);
    onChange(!isChecked);
  }, [isChecked, onChange]);

  return (
    <div
      className={`flex cursor-pointer items-center space-x-1 ${className ? className : ''}`}
      onClick={handleClick}
    >
      {isChecked ? <Icon name="checkbox-checked" /> : <Icon name="checkbox-unchecked" />}

      <Typography
        variant={labelVariant ?? 'subtitle'}
        component="p"
        className={labelClassName ?? 'text-white '}
      >
        {label}
      </Typography>
    </div>
  );
};

CheckBox.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.string,
  labelClassName: PropTypes.string,
  labelVariant: PropTypes.string,
};

export default CheckBox;
