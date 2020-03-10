import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const baseClasses =
  'min-w-md leading-none font-sans text-center justify-center items-center outline-none transition duration-300 ease-in-out focus:outline-none';

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
    default:
      'text-custom-aquaBright hover:bg-custom-aquaBright hover:text-white active:opacity-80 focus:bg-custom-aquaBright focus:text-white',
    primary:
      'text-custom-blue hover:bg-custom-blue hover:text-white active:opacity-80 focus:bg-custom-blue focus:text-white',
    secondary:
      'text-custom-violetPale hover:bg-custom-violetPale hover:text-white active:opacity-80 focus:bg-custom-violetPale focus:text-white',
    white:
      'text-white hover:bg-white hover:text-black active:opacity-80 focus:bg-white focus:text-black',
  },
  outlined: {
    default:
      'border bg-trasparent border-custom-aquaBright text-custom-aquaBright hover:bg-custom-aquaBright hover:text-black focus:text-black focus:bg-custom-aquaBright active:opacity-80',
    primary:
      'border bg-transparent border-custom-blue text-custom-blue hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary:
      'border bg-transparent border-custom-violetPale text-custom-violetPale hover:opacity-80 active:opacity-100 focus:opacity-80',
    white:
      'border bg-transparent border-white text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
  },
  contained: {
    default:
      'bg-custom-aquaBright text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    primary:
      'bg-custom-blue text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary:
      'bg-custom-violetPale text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    white:
      'bg-white text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
  },
};

const sizeClasses = {
  small: 'py-2 px-2 text-base',
  medium: 'py-2 px-2 text-lg',
  large: 'py-2 px-6 text-xl',
};

const fullWidthClasses = {
  true: 'flex w-full',
  false: 'inline-flex',
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
