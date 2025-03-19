import * as React from 'react';
import { cn } from '../../lib/utils';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

// Calculate decimal places based on step
const getDecimalPlaces = (step: number): number => {
  if (Number.isInteger(step)) {
    return 0;
  }
  const stepStr = step.toString();
  if (stepStr.includes('.')) {
    return stepStr.split('.')[1].length;
  }
  return 0;
};

// Context type
type InputNumberContextType = {
  value: number | string;
  min: number;
  max: number;
  step: number;
  decimalPlaces: number;
  disabled?: boolean;
  arrowsDirection: 'vertical' | 'horizontal';
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  increment: () => void;
  decrement: () => void;
};

// Create context
const InputNumberContext = React.createContext<InputNumberContextType | undefined>(undefined);

// Hook to use context
const useInputNumber = () => {
  const context = React.useContext(InputNumberContext);
  if (!context) {
    throw new Error('useInputNumber must be used within an InputNumber component');
  }
  return context;
};

// Root component props
export interface InputNumberRootProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  arrowsDirection?: 'vertical' | 'horizontal';
  children?: React.ReactNode;
}

// Sizes mapping for backward compatibility
const sizesClasses = {
  sm: 'w-[45px] h-[28px]',
  md: 'w-[58px] h-[28px]',
  lg: 'w-[206px] h-[35px]',
};

// Root component
const InputNumberRoot = React.forwardRef<HTMLDivElement, InputNumberRootProps>(
  (
    {
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      className,
      arrowsDirection = 'vertical',
      children,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState<number | string>(value);
    const decimalPlaces = getDecimalPlaces(step);

    // Update internal state when prop changes
    React.useEffect(() => {
      setInputValue(value);
    }, [value]);

    // Increment function
    const increment = React.useCallback(() => {
      const currentValue =
        typeof inputValue === 'string' ? parseFloat(inputValue) || min : inputValue;
      const newValue = Math.min(currentValue + step, max);
      setInputValue(newValue);
      onChange(newValue);
    }, [inputValue, min, max, step, onChange]);

    // Decrement function
    const decrement = React.useCallback(() => {
      const currentValue =
        typeof inputValue === 'string' ? parseFloat(inputValue) || min : inputValue;
      const newValue = Math.max(currentValue - step, min);
      setInputValue(newValue);
      onChange(newValue);
    }, [inputValue, min, max, step, onChange]);

    // Handle input change
    const handleInputChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // Allow empty string, minus sign, or decimal point for flexibility
        if (val === '' || val === '-' || val === '.') {
          setInputValue(val);
          return;
        }

        const numValue = Number(val);

        // Only update if it's a valid number
        if (!isNaN(numValue)) {
          setInputValue(numValue);

          // Only call onChange if value is within boundaries
          if (numValue >= min && numValue <= max) {
            onChange(numValue);
          }
        }
      },
      [min, max, onChange]
    );

    // Handle blur to format and validate
    const handleBlur = React.useCallback(() => {
      if (typeof inputValue === 'string') {
        // Handle empty or partial inputs
        if (inputValue === '' || inputValue === '-' || inputValue === '.') {
          setInputValue(min);
          onChange(min);
          return;
        }

        const numValue = parseFloat(inputValue);

        if (isNaN(numValue)) {
          setInputValue(min);
          onChange(min);
          return;
        }

        // Constrain value to min/max
        const boundedValue = Math.max(min, Math.min(max, numValue));
        setInputValue(boundedValue);
        onChange(boundedValue);
      }
    }, [inputValue, min, max, onChange]);

    // Context value
    const contextValue = React.useMemo(
      () => ({
        value: inputValue,
        min,
        max,
        step,
        decimalPlaces,
        disabled,
        arrowsDirection,
        handleInputChange,
        handleBlur,
        increment,
        decrement,
      }),
      [
        inputValue,
        min,
        max,
        step,
        decimalPlaces,
        disabled,
        arrowsDirection,
        handleInputChange,
        handleBlur,
        increment,
        decrement,
      ]
    );

    return (
      <InputNumberContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn('flex', className)}
          {...props}
        >
          {children}
        </div>
      </InputNumberContext.Provider>
    );
  }
);

InputNumberRoot.displayName = 'InputNumber.Root';

// Input component
export interface InputNumberInputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Input>, 'onChange'> {}

const InputNumberInput = React.forwardRef<HTMLInputElement, InputNumberInputProps>(
  ({ className, ...props }, ref) => {
    const { value, handleInputChange, handleBlur, disabled, decimalPlaces } = useInputNumber();

    // Format displayed value
    const displayValue = React.useMemo(() => {
      if (typeof value === 'string') {
        return value;
      }
      return decimalPlaces > 0 ? value.toFixed(decimalPlaces) : value.toString();
    }, [value, decimalPlaces]);

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn(
          'appearance-none border-none p-0 text-center shadow-none focus:border-none focus:outline-none',
          className
        )}
        {...props}
      />
    );
  }
);

InputNumberInput.displayName = 'InputNumber.Input';

// Label component
export interface InputNumberLabelProps extends React.HTMLAttributes<HTMLLabelElement> {
  position?: 'left' | 'right' | 'top' | 'bottom';
}

const InputNumberLabel = React.forwardRef<HTMLLabelElement, InputNumberLabelProps>(
  ({ className, position = 'left', children, ...props }, ref) => {
    const positionClasses = {
      left: 'mr-2',
      right: 'ml-2',
      top: 'mb-1',
      bottom: 'mt-1',
    };

    return (
      <label
        ref={ref}
        className={cn('text-aqua-pale text-[11px]', positionClasses[position], className)}
        {...props}
      >
        {children}
      </label>
    );
  }
);

InputNumberLabel.displayName = 'InputNumber.Label';

// Container for horizontal button layout
export interface InputNumberHorizontalControlsProps extends React.HTMLAttributes<HTMLDivElement> {}

const InputNumberHorizontalControls = React.forwardRef<
  HTMLDivElement,
  InputNumberHorizontalControlsProps
>(({ className, children, ...props }, ref) => {
  const { disabled, increment, decrement } = useInputNumber();

  return (
    <div
      ref={ref}
      className={cn('flex flex-row items-center', className)}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={decrement}
        disabled={disabled}
        className="text-primary-active h-4 w-4 cursor-pointer p-0 hover:opacity-70"
      >
        <ChevronLeft className="h-3 w-3" />
      </Button>

      {children}

      <Button
        variant="ghost"
        size="icon"
        onClick={increment}
        disabled={disabled}
        className="text-primary-active h-4 w-4 cursor-pointer p-0 hover:opacity-70"
      >
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
});

InputNumberHorizontalControls.displayName = 'InputNumber.HorizontalControls';

// Container for vertical button layout
export interface InputNumberVerticalControlsProps extends React.HTMLAttributes<HTMLDivElement> {}

const InputNumberVerticalControls = React.forwardRef<
  HTMLDivElement,
  InputNumberVerticalControlsProps
>(({ className, ...props }, ref) => {
  const { disabled, increment, decrement } = useInputNumber();

  return (
    <div
      ref={ref}
      className={cn('ml-auto flex flex-col pr-1', className)}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={increment}
        disabled={disabled}
        className="h-3 w-3 p-0 text-[#726f7e]"
      >
        <ChevronUp className="h-2 w-2" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={decrement}
        disabled={disabled}
        className="h-3 w-3 p-0 text-[#726f7e]"
      >
        <ChevronDown className="h-2 w-2" />
      </Button>
    </div>
  );
});

InputNumberVerticalControls.displayName = 'InputNumber.VerticalControls';

// Main container
export interface InputNumberContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  sizeClassName?: string;
}

const InputNumberContainer = React.forwardRef<HTMLDivElement, InputNumberContainerProps>(
  ({ className, size = 'md', sizeClassName, children, ...props }, ref) => {
    const sizeToUse = sizeClassName || sizesClasses[size];

    return (
      <div
        ref={ref}
        className={cn(
          'bg-primary-dark border-secondary-light flex items-center rounded-[4px] border',
          sizeToUse,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

InputNumberContainer.displayName = 'InputNumber.Container';

// Backward compatibility component
export interface InputNumberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  labelPosition?: 'left' | 'right' | 'top' | 'bottom';
  labelClassName?: string;
  showAdjustmentArrows?: boolean;
  arrowsDirection?: 'vertical' | 'horizontal';
  inputClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  sizeClassName?: string;
  inputContainerClassName?: string;
}

// Backward compatibility component
const InputNumberCompat = React.forwardRef<HTMLDivElement, InputNumberProps>(
  (
    {
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      className,
      label,
      labelPosition = 'left',
      labelClassName,
      showAdjustmentArrows = true,
      arrowsDirection = 'vertical',
      inputClassName,
      size = 'md',
      sizeClassName,
      inputContainerClassName,
    },
    ref
  ) => {
    const wrapperClass = cn(
      {
        'flex-row items-center': labelPosition === 'left' || labelPosition === 'right',
        'flex-col': labelPosition === 'top' || labelPosition === 'bottom',
      },
      className
    );

    return (
      <InputNumberRoot
        ref={ref}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        arrowsDirection={arrowsDirection}
        className={wrapperClass}
      >
        {(labelPosition === 'left' || labelPosition === 'top') && label && (
          <InputNumberLabel
            position={labelPosition}
            className={labelClassName}
          >
            {label}
          </InputNumberLabel>
        )}

        <InputNumberContainer
          size={size}
          sizeClassName={sizeClassName}
          className={inputContainerClassName}
        >
          {showAdjustmentArrows && arrowsDirection === 'horizontal' ? (
            <InputNumberHorizontalControls>
              <InputNumberInput className={inputClassName} />
            </InputNumberHorizontalControls>
          ) : (
            <>
              <InputNumberInput className={inputClassName} />
              {showAdjustmentArrows && arrowsDirection === 'vertical' && (
                <InputNumberVerticalControls />
              )}
            </>
          )}
        </InputNumberContainer>

        {(labelPosition === 'right' || labelPosition === 'bottom') && label && (
          <InputNumberLabel
            position={labelPosition}
            className={labelClassName}
          >
            {label}
          </InputNumberLabel>
        )}
      </InputNumberRoot>
    );
  }
);

InputNumberCompat.displayName = 'InputNumber';

// Create the exported component
const InputNumber = Object.assign(InputNumberCompat, {
  Root: InputNumberRoot,
  Input: InputNumberInput,
  Label: InputNumberLabel,
  Container: InputNumberContainer,
  HorizontalControls: InputNumberHorizontalControls,
  VerticalControls: InputNumberVerticalControls,
});

export { InputNumber };
