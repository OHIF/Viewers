import React from 'react';
import PropTypes from 'prop-types';

const Button = ({
  children,
  variant = defaults.variant,
  color = defaults.color,
  size = defaults.size,
  radius = defaults.radius,
  disabled = defaults.disabled,
  elevation,
  type = defaults.type,
  startIcon: startIconProp,
  endIcon: endIconProp,
  className,
  ...rest
}) => {
  const hasIcon = startIconProp || endIconProp;
  const getClasses = () => {
    const classes = [];
    let buttonElevation;

    if (variant === 'text') {
      if (elevation) {
        buttonElevation = elevation;
      } else {
        buttonElevation = false;
      }
    } else {
      buttonElevation = defaults.elevation;
    }

    classes.push(variantClasses[variant][color]);
    classes.push(radiusClasses[radius]);
    classes.push(sizeClasses[size]);
    classes.push(disabledClasses[disabled]);
    classes.push(elevationClasses[buttonElevation]);
    classes.push(className);

    if (hasIcon) {
      classes.push(baseIconClasses);
    }

    return classes.join(' ');
  };

  const baseIconClasses = 'inline-flex items-center';
  const baseClasses =
    'outline-none transition duration-300 ease-in-out rounded font-bold focus:outline-none';

  const startIcon = startIconProp && (
    <div className="mr-2">{startIconProp}</div>
  );

  const endIcon = endIconProp && <div className="ml-2">{endIconProp}</div>;

  return (
    <button className={`${baseClasses} ${getClasses()}`} type={type} {...rest}>
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
};

const defaults = {
  variant: 'outlined',
  color: 'default',
  size: 'medium',
  radius: 'medium',
  disabled: false,
  elevation: true,
  type: 'button',
};

const radiusClasses = {
  small: 'rounded-sm',
  medium: 'rounded-md',
  large: 'rounded-lg',
  full: 'rounded-full',
};

const disabledClasses = {
  true: 'cursor-not-allowed',
  false: '',
};

const elevationClasses = {
  true: 'shadow',
  false: 'shadow-none',
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

Button.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  radius: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
  variant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  color: PropTypes.oneOf(['default', 'primary', 'secondary']),
};

export default Button;
