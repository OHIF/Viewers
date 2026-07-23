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

// Enhanced context type - includes shared constraints
type InputNumberContextType = {
  value: number | string;
  setValue: React.Dispatch<React.SetStateAction<number | string>>;
  onChange: (value: number) => void;
  // Shared constraints that can be used by subcomponents
  constraints?: {
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
  };
};

// Create context
const InputNumberContext = React.createContext<InputNumberContextType | undefined>(undefined);

// Hook to use context
const useInputNumber = () => {
  const context = React.useContext(InputNumberContext);
  if (!context) {
    throw new Error('useInputNumber must be used within an <InputNumber> component');
  }
  return context;
};

// Simplified root component props
export interface InputNumberProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  children?: React.ReactNode;
}

// The single top-level InputNumber component - much simpler now
const InputNumber = React.forwardRef<HTMLDivElement, InputNumberProps>(
  ({ value, onChange, className, children, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState<number | string>(value);

    // Update internal state when prop changes
    React.useEffect(() => {
      setInputValue(value);
    }, [value]);

    // Context value - only core state
    const contextValue = React.useMemo(
      () => ({
        value: inputValue,
        setValue: setInputValue,
        onChange,
      }),
      [inputValue, onChange]
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

InputNumber.displayName = 'InputNumber';

// Input component with its own constraints
export interface InputNumberInputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Input>, 'onChange'> {
  min?: number;
  max?: number;
  step?: number;
}

const InputNumberInput = React.forwardRef<HTMLInputElement, InputNumberInputProps>(
  ({ className, min, max, step, ...props }, ref) => {
    // Get context which may include constraints from parent
    const { value, setValue, onChange, constraints = {} } = useInputNumber();

    // Use provided props or fall back to parent constraints or defaults
    const effectiveMin = min ?? constraints.min ?? 0;
    const effectiveMax = max ?? constraints.max ?? 100;
    const effectiveStep = step ?? constraints.step ?? 1;
    const decimalPlaces = getDecimalPlaces(effectiveStep);

    // Format displayed value with proper decimal places
    const displayValue = React.useMemo(() => {
      if (typeof value === 'string') {
        return value;
      }
      return decimalPlaces > 0 ? value.toFixed(decimalPlaces) : value.toString();
    }, [value, decimalPlaces]);

    // Handle input change with constraint awareness
    const handleInputChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // Allow empty string, minus sign, or decimal point for flexibility
        if (val === '' || val === '-' || val === '.') {
          setValue(val);
          return;
        }

        const numValue = Number(val);
        if (!isNaN(numValue)) {
          setValue(numValue);
          // Only call onChange if value is within boundaries
          if (numValue >= effectiveMin && numValue <= effectiveMax) {
            onChange(numValue);
          }
        }
      },
      [effectiveMin, effectiveMax, onChange, setValue]
    );

    // Handle blur to format and validate
    const handleBlur = React.useCallback(() => {
      if (typeof value === 'string') {
        // Handle empty or partial inputs
        if (value === '' || value === '-' || value === '.') {
          setValue(effectiveMin);
          onChange(effectiveMin);
          return;
        }

        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          setValue(effectiveMin);
          onChange(effectiveMin);
          return;
        }

        // Constrain value to min/max
        const boundedValue = Math.max(effectiveMin, Math.min(effectiveMax, numValue));
        setValue(boundedValue);
        onChange(boundedValue);
      }
    }, [value, effectiveMin, effectiveMax, onChange, setValue]);

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className={cn(
          'h-6 appearance-none border-none p-0 text-center shadow-none focus:border-none focus:outline-none',
          className
        )}
        {...props}
      />
    );
  }
);

InputNumberInput.displayName = 'InputNumber.Input';

// Label component with position prop
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
        className={cn('text-muted-foreground text-xs', positionClasses[position], className)}
        {...props}
      >
        {children}
      </label>
    );
  }
);

InputNumberLabel.displayName = 'InputNumber.Label';

// Container for horizontal button layout with constraints that are shared via context
export interface InputNumberHorizontalControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const InputNumberHorizontalControls = React.forwardRef<
  HTMLDivElement,
  InputNumberHorizontalControlsProps
>(({ className, children, min = 0, max = 100, step = 1, disabled = false, ...props }, ref) => {
  // Get existing context and enhance it with constraints
  const context = useInputNumber();
  const { value, onChange } = context;

  // Set constraints in context for child components to use
  React.useEffect(() => {
    context.constraints = { min, max, step, disabled };
  }, [context, min, max, step, disabled]);

  // Increment function with local constraints
  const increment = React.useCallback(() => {
    if (disabled) {
      return;
    }

    const currentValue = typeof value === 'string' ? parseFloat(value) || min : value;
    const newValue = Math.min(currentValue + step, max);
    onChange(newValue);
  }, [value, min, max, step, onChange, disabled]);

  // Decrement function with local constraints
  const decrement = React.useCallback(() => {
    if (disabled) {
      return;
    }

    const currentValue = typeof value === 'string' ? parseFloat(value) || min : value;
    const newValue = Math.max(currentValue - step, min);
    onChange(newValue);
  }, [value, min, max, step, onChange, disabled]);

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
        className="text-primary h-6 w-4 cursor-pointer p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {children}

      <Button
        variant="ghost"
        size="icon"
        onClick={increment}
        disabled={disabled}
        className="text-primary h-6 w-4 cursor-pointer p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
});

InputNumberHorizontalControls.displayName = 'InputNumber.HorizontalControls';

// Vertical controls with its own constraints
export interface InputNumberVerticalControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const InputNumberVerticalControls = React.forwardRef<
  HTMLDivElement,
  InputNumberVerticalControlsProps
>(({ className, children, min = 0, max = 100, step = 1, disabled = false, ...props }, ref) => {
  // Get existing context and enhance it with constraints
  const context = useInputNumber();
  const { value, onChange } = context;

  // Set constraints in context for child components to use
  React.useEffect(() => {
    context.constraints = { min, max, step, disabled };
  }, [context, min, max, step, disabled]);

  // Increment function with local constraints
  const increment = React.useCallback(() => {
    if (disabled) {
      return;
    }

    const currentValue = typeof value === 'string' ? parseFloat(value) || min : value;
    const newValue = Math.min(currentValue + step, max);
    onChange(newValue);
  }, [value, min, max, step, onChange, disabled]);

  // Decrement function with local constraints
  const decrement = React.useCallback(() => {
    if (disabled) {
      return;
    }

    const currentValue = typeof value === 'string' ? parseFloat(value) || min : value;
    const newValue = Math.max(currentValue - step, min);
    onChange(newValue);
  }, [value, min, max, step, onChange, disabled]);

  return (
    <div
      ref={ref}
      className={cn('flex items-center', className)}
      {...props}
    >
      {children}
      <div className="ml-1 flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          onClick={increment}
          disabled={disabled}
          className="text-primary h-3 w-5 pr-px"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={decrement}
          disabled={disabled}
          className="text-primary h-3 w-5 pr-px"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});

InputNumberVerticalControls.displayName = 'InputNumber.VerticalControls';

// Container with size prop
const sizesClasses = {
  sm: 'w-[45px] h-[28px]',
  md: 'w-[58px] h-[28px]',
  lg: 'w-[206px] h-[35px]',
};

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
          'bg-background border-input flex items-center rounded-md border',
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

// Attach subcomponents
Object.assign(InputNumber, {
  Input: InputNumberInput,
  Label: InputNumberLabel,
  Container: InputNumberContainer,
  HorizontalControls: InputNumberHorizontalControls,
  VerticalControls: InputNumberVerticalControls,
});

export { InputNumber };
