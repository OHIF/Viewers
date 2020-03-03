import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const defaults = {
  variant: 'contained',
  color: 'default',
  size: 'medium',
  radius: 'medium',
  disabled: false,
  type: 'button',
};

const radiusClasses = {
  none: '',
  small: 'rounded-sm',
  medium: 'rounded-md',
  large: 'rounded-lg',
  full: 'rounded-full',
};

const disabledClasses = {
  true: 'cursor-not-allowed',
  false: '',
};

const variantClasses = {
  text: {
    default: 'hover:bg-gray-200 text-black',
    primary: 'hover:bg-blue-100 text-blue-900',
    secondary: 'hover:bg-blue-100 text-blue-300',
  },
  outlined: {
    default: 'border border-black text-black hover:bg-gray-200',
    primary: 'border border-blue-900 text-blue-900 hover:bg-blue-100',
    secondary: 'border border-blue-300 text-blue-300 hover:bg-blue-100',
  },
  contained: {
    default: 'bg-black hover:bg-gray-800 text-white',
    primary: 'bg-blue-900 hover:bg-blue-800 text-white',
    secondary: 'bg-blue-300 hover:bg-blue-500 text-black',
  },
};

const sizeClasses = {
  small: 'py-1 px-2 text-sm',
  medium: 'py-2 px-4 text-base',
  large: 'py-3 px-6 text-lg',
};

const Button = ({
  children,
  variant = defaults.variant,
  color = defaults.color,
  size = defaults.size,
  radius = defaults.radius,
  disabled = defaults.disabled,
  type = defaults.type,
  fullWidth = defaults.fullWidth,
  startIcon: startIconProp,
  endIcon: endIconProp,
  className,
  ...rest
}) => {
  const baseClasses =
    'inline-flex items-center outline-none transition duration-300 ease-in-out font-bold focus:outline-none';

  const startIcon = startIconProp && (
    <div className="mr-2">{startIconProp}</div>
  );

  const endIcon = endIconProp && <div className="ml-2">{endIconProp}</div>;

  return (
    <button
      className={classnames(
        baseClasses,
        variantClasses[variant][color],
        radiusClasses[radius],
        sizeClasses[size],
        disabledClasses[disabled],
        className
      )}
      type={type}
      {...rest}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  radius: PropTypes.oneOf(['none', 'small', 'medium', 'large', 'full']),
  variant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  color: PropTypes.oneOf(['default', 'primary', 'secondary']),
  disabled: PropTypes.bool,
  type: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  className: PropTypes.string,
};

export default Button;
