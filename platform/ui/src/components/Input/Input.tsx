import React from 'react';
import Label from '../Label';
import classnames from 'classnames';

const baseInputClasses =
  'shadow transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-full py-2 px-3 text-sm text-white placeholder-inputfield-placeholder leading-tight';

const transparentClasses = {
  true: 'bg-transparent',
  false: 'bg-black',
};

const smallInputClasses = {
  true: 'input-small',
  false: '',
};

interface InputProps {
  id?: string;
  label?: string;
  containerClassName?: string;
  labelClassName?: string;
  className?: string;
  transparent?: boolean;
  smallInput?: boolean;
  type?: string;
  value?: any;
  onChange?(...args: unknown[]): unknown;
  onFocus?(...args: unknown[]): unknown;
  autoFocus?: boolean;
  readOnly?: boolean;
  onKeyPress?(...args: unknown[]): unknown;
  onKeyDown?(...args: unknown[]): unknown;
  disabled?: boolean;
  labelChildren?: React.ReactNode;
}

const Input = ({
  id,
  label,
  containerClassName = '',
  labelClassName = '',
  className = '',
  transparent = false,
  smallInput = false,
  type = 'text',
  value,
  onChange,
  onFocus,
  autoFocus,
  onKeyPress,
  onKeyDown,
  readOnly,
  disabled,
  labelChildren,
  ...otherProps
}: InputProps) => {
  return (
    <div className={classnames('flex flex-1 flex-col', containerClassName)}>
      <Label
        className={labelClassName}
        text={label}
        children={labelChildren}
      ></Label>
      <input
        data-cy={`input-${id}`}
        className={classnames(
          label && 'mt-2',
          className,
          baseInputClasses,
          transparentClasses[transparent],
          smallInputClasses[smallInput],
          { 'cursor-not-allowed': disabled }
        )}
        disabled={disabled}
        readOnly={readOnly}
        autoFocus={autoFocus}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onKeyPress={onKeyPress}
        onKeyDown={onKeyDown}
        {...otherProps}
      />
    </div>
  );
};

export default Input;
