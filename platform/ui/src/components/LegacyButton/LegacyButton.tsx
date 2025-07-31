import React, { useRef } from 'react';
import classnames from 'classnames';

const baseClasses =
  'leading-none font-sans text-center justify-center items-center outline-none transition duration-300 ease-in-out focus:outline-none';

const defaults = {
  color: 'default',
  disabled: false,
  fullWidth: false,
  rounded: 'medium',
  border: 'none',
  size: 'medium',
  type: 'button',
  variant: 'contained',
};

const roundedClasses = {
  none: '',
  small: 'rounded',
  medium: 'rounded-md',
  large: 'rounded-lg',
  full: 'rounded-full',
};

const variants = {
  text: {
    default:
      'text-primary-light hover:bg-primary-light hover:text-white active:opacity-80 focus:bg-primary-light focus:text-white',
    primary:
      'text-primary-main hover:bg-primary-main hover:text-white active:opacity-80 focus:bg-primary-main focus:text-white',
    secondary:
      'text-secondary-light hover:bg-secondary-light hover:text-white active:opacity-80 focus:bg-secondary-light focus:text-white',
    white:
      'text-white hover:bg-white hover:text-black active:opacity-80 focus:bg-white focus:text-black',
    black:
      'text-black hover:bg-black hover:text-white focus:bg-black focus:text-white active:opacity-80',
  },
  outlined: {
    default:
      'text-primary-light hover:bg-primary-light hover:text-black focus:text-black focus:bg-primary-light active:opacity-80',
    primary: 'text-primary-main hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary: 'text-secondary-light hover:opacity-80 active:opacity-100 focus:opacity-80',
    translucent: 'text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    white:
      'text-black hover:bg-primary-main focus:bg-primary-main hover:border-black focus:border-black',
    black:
      'text-white hover:bg-primary-main focus:bg-primary-main hover:border-black focus:border-black',
    primaryActive: 'text-primary-active hover:opacity-80 active:opacity-100 focus:opacity-80',
    primaryLight:
      'border bg-transparent border-primary-main text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
  },
  contained: {
    default: 'text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
    primary: 'text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    primaryDark: 'text-primary-active hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary: 'text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    white: 'text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
    black: 'text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    light: 'border text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
  },
  disabled: {
    default: 'cursor-not-allowed opacity-50 text-black',
    primary: 'cursor-not-allowed opacity-50 text-white',
    secondary: 'cursor-not-allowed opacity-50 text-white',
    white: 'cursor-not-allowed opacity-50 text-black',
    black: 'cursor-not-allowed opacity-50 text-white',
    light: 'cursor-not-allowed opacity-50 border text-black',
  },
};

const defaultVariantBackGroundColor = {
  text: {
    default: '',
    primary: '',
    secondary: '',
    white: '',
    black: '',
  },
  outlined: {
    default: 'bg-transparent',
    primary: 'bg-transparent',
    secondary: 'bg-transparent',
    black: 'bg-black',
    white: '',
  },
  contained: {
    default: 'bg-primary-light',
    primary: 'bg-primary-main',
    primaryDark: 'bg-primary-dark',
    secondary: 'bg-secondary-light',
    white: 'bg-white',
    black: 'bg-black',
    light: 'bg-primary-light',
  },
  disabled: {
    default: 'bg-primary-light',
    primary: 'bg-primary-main',
    secondary: 'bg-secondary-light',
    white: 'bg-white',
    black: 'bg-black',
    light: 'bg-primary-light',
  },
};

const _getVariantClass = (variant, color, bgColor = null) => {
  const defaultBackgroundColor = defaultVariantBackGroundColor[variant][color];

  if (!bgColor) {
    bgColor = defaultBackgroundColor;
  }

  return `${variants[variant][color]} ${bgColor}`;
};

const borderClasses = {
  none: '',
  light: 'border border-primary-light',
  primary: 'border border-primary-main',
  primaryActive: 'border border-primary-active',
  secondary: 'border border-secondary-light',
  white: 'border border-white',
  black: 'border border-black',
};

const sizeClasses = {
  small: 'py-2 px-2 text-sm min-w-md',
  medium: 'py-2 px-2 text-lg min-w-md',
  large: 'py-2 px-6 text-xl min-w-md',
  initial: '',
};

const fullWidthClasses = {
  true: 'flex w-full',
  false: 'inline-flex',
};

interface LegacyButtonProps {
  /** What is inside the button, can be text or react component */
  children?: React.ReactNode;
  /** Callback to be called when the button is clicked  */
  onClick(...args: unknown[]): unknown;
  /** Button size  */
  size?: "small" | "medium" | "large" | "initial" | "inherit";
  /** Button corner roundness  */
  rounded?: "none" | "small" | "medium" | "large" | "full";
  variant?: "text" | "outlined" | "contained" | "disabled";
  /* color prop must have all the possible keys of variants defined above */
  color?: "default" | "primary" | "primaryDark" | "primaryActive" | "secondary" | "white" | "black" | "inherit" | "light" | "translucent";
  border?: "none" | "light" | "default" | "primary" | "primaryActive" | "secondary" | "white" | "black";
  /** Whether the button should have full width  */
  fullWidth?: boolean;
  /** Whether the button should be disabled  */
  disabled?: boolean;
  /** Button type  */
  type?: string;
  name?: string;
  /** Button start icon name - if any icon is specified  */
  startIcon?: React.ReactNode;
  /** Button end icon name - if any icon is specified  */
  endIcon?: React.ReactNode;
  /** Additional TailwindCSS classnames */
  className?: string;
  /** Background color for the button to override*/
  bgColor?: string;
}

const LegacyButton = ({
  children = '',
  variant = defaults.variant,
  color = defaults.color,
  border = defaults.border,
  size = defaults.size,
  rounded = defaults.rounded,
  disabled = defaults.disabled,
  type = defaults.type,
  fullWidth = defaults.fullWidth,
  bgColor = null,
  startIcon: startIconProp,
  endIcon: endIconProp,
  name,
  className,
  onClick = () => {},

  /** TODO: All possible props should be explicitly defined -- avoid spreading props  */
  ...rest
}: LegacyButtonProps) => {
  const startIcon = startIconProp && (
    <div className="mr-2">
      {React.cloneElement(startIconProp, {
        className: classnames('w-4 h-4 fill-current'),
      })}
    </div>
  );

  const endIcon = endIconProp && (
    <div className="ml-2">
      {React.cloneElement(endIconProp, {
        className: classnames('w-4 h-4 fill-current'),
      })}
    </div>
  );
  const buttonElement = useRef(null);

  const handleOnClick = e => {
    buttonElement.current.blur();
    if (!disabled) {
      onClick(e);
    }
  };

  const finalClassName = classnames(
    baseClasses,
    _getVariantClass(variant, color, bgColor),
    borderClasses[border],
    roundedClasses[rounded],
    sizeClasses[size],
    fullWidthClasses[fullWidth],
    className
  );

  return (
    <button
      className={finalClassName}
      disabled={disabled}
      ref={buttonElement}
      onClick={handleOnClick}
      type={type}
      data-cy={`${name}-btn`}
      {...rest}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
};

export default LegacyButton;
