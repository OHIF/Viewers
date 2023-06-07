import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export enum ButtonType {
  primary = 'primary',
  secondary = 'secondary',
}
export enum ButtonSize {
  medium = 'medium',
  small = 'small',
}

const sizeClasses = {
  [ButtonSize.small]: 'h-[26px] text-[13px]',
  [ButtonSize.medium]: 'h-[32px] text-[14px]',
};

const layoutClasses =
  'inline-flex flex-row items-center gap-[5px] justify center px-[10px] outline-none rounded';

const baseFontTextClasses = 'leading-[1.2] font-sans text-center';

const fontTextClasses = {
  [ButtonType.primary]: classnames(baseFontTextClasses, 'font-semibold'),
  [ButtonType.secondary]: classnames(baseFontTextClasses, 'font-400'),
};

const baseEnabledEffectClasses =
  'transition duration-300 ease-in-out focus:outline-none';

const enabledEffectClasses = {
  [ButtonType.primary]: classnames(
    baseEnabledEffectClasses,
    'hover:bg-customblue-80 active:bg-customblue-40'
  ),
  [ButtonType.secondary]: classnames(
    baseEnabledEffectClasses,
    'hover:bg-customblue-50 active:bg-customblue-20'
  ),
};

const baseEnabledClasses = 'text-white';

const enabledClasses = {
  [ButtonType.primary]: classnames(
    'bg-primary-main',
    baseEnabledClasses,
    enabledEffectClasses[ButtonType.primary]
  ),
  [ButtonType.secondary]: classnames(
    'bg-customblue-30',
    baseEnabledClasses,
    enabledEffectClasses[ButtonType.secondary]
  ),
};

const disabledClasses =
  'bg-inputfield-placeholder text-common-light cursor-default';

const defaults = {
  color: 'default',
  disabled: false,
  rounded: 'small',
  size: ButtonSize.medium,
  type: ButtonType.primary,
};

const Button = ({
  children,
  size = defaults.size,
  disabled = defaults.disabled,
  type = defaults.type,
  startIcon: startIconProp,
  endIcon: endIconProp,
  name,
  className,
  onClick,
}) => {
  const startIcon = startIconProp && (
    <>
      {React.cloneElement(startIconProp, {
        className: classnames('w-4 h-4 fill-current'),
      })}
    </>
  );

  const endIcon = endIconProp && (
    <>
      {React.cloneElement(endIconProp, {
        className: classnames('w-4 h-4 fill-current'),
      })}
    </>
  );
  const buttonElement = useRef(null);

  const handleOnClick = e => {
    buttonElement.current.blur();
    if (!disabled) {
      onClick(e);
    }
  };

  const finalClassName = classnames(
    layoutClasses,
    fontTextClasses[type],
    disabled ? disabledClasses : enabledClasses[type],
    sizeClasses[size],
    className
  );

  return (
    <button
      className={finalClassName}
      disabled={disabled}
      ref={buttonElement}
      onClick={handleOnClick}
      data-cy={`${name}-btn`}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
};

Button.defaultProps = {
  disabled: false,
  children: '',
  onClick: () => {},
  type: defaults.type,
  size: defaults.size,
};

Button.propTypes = {
  /** What is inside the button, can be text or react component */
  children: PropTypes.node,
  /** Callback to be called when the button is clicked  */
  onClick: PropTypes.func.isRequired,
  /** Button size  */
  size: PropTypes.oneOf([ButtonSize.medium, ButtonSize.small]),
  /** Whether the button should be disabled  */
  disabled: PropTypes.bool,
  /** Button type  */
  type: PropTypes.oneOf([ButtonType.primary, ButtonType.secondary]),
  name: PropTypes.string,
  /** Button start icon name - if any icon is specified  */
  startIcon: PropTypes.node,
  /** Button end icon name - if any icon is specified  */
  endIcon: PropTypes.node,
  /** Additional TailwindCSS classnames */
  className: PropTypes.string,
};

export default Button;
