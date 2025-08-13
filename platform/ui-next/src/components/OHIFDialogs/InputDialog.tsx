import React, { createContext, useContext, useRef, useEffect } from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { Label, Input as InputComponent, FooterAction } from '../../components';
import { cn } from '../../lib/utils';

interface InputDialogContextValue {
  value: string;
  setValue: (value: string) => void;
  submitOnEnter?: boolean;
}

const InputDialogContext = createContext<InputDialogContextValue | null>(null);

export type InputDialogRootProps = {
  /** The controlled value of the input */
  value?: string;
  /** The default value for uncontrolled usage */
  defaultValue?: string;
  /** Callback when input value changes */
  onChange?: (value: string) => void;
  /** Optional className for the root container */
  className?: string;
  /** Enable save on Enter key press */
  submitOnEnter?: boolean;
  children: React.ReactNode;
};

const InputDialogRoot = React.forwardRef<HTMLDivElement, InputDialogRootProps>(
  ({ value, defaultValue = '', onChange, className, submitOnEnter, children }, ref) => {
    const [internalValue, setInternalValue] = useControllableState({
      prop: value,
      defaultProp: defaultValue,
      onChange,
    });

    return (
      <InputDialogContext.Provider
        value={{
          value: internalValue,
          setValue: setInternalValue,
          submitOnEnter,
        }}
      >
        <div
          ref={ref}
          className={cn('flex flex-col', className)}
        >
          {children}
        </div>
      </InputDialogContext.Provider>
    );
  }
);

InputDialogRoot.displayName = 'InputDialog';

export interface InputDialogFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional className for the field container */
  className?: string;
  children: React.ReactNode;
}

const Field = React.forwardRef<HTMLDivElement, InputDialogFieldProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mb-4 flex flex-col space-y-2', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Field.displayName = 'InputDialog.Field';

export interface InputDialogInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** ID for the input field */
  id?: string;
  /** Optional className for the input container */
  className?: string;
  /** Save handler */
  onSave?: (value: string) => void;
  /** Placeholder text for the input field */
  placeholder?: string;
}

const InputDialogInput = React.forwardRef<HTMLInputElement, InputDialogInputProps>(
  ({ id = 'dialog-input', className, onSave, ...props }, ref) => {
    const context = useContext(InputDialogContext);
    if (!context) {
      throw new Error('InputDialog.Input must be used within an InputDialog');
    }

    const { value, setValue } = context;
    const inputRef = useRef<HTMLInputElement>(null);

    // Combine the forwarded ref with our local ref
    React.useImperativeHandle(ref, () => inputRef.current);

    // Focus the input when it mounts
    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (context.submitOnEnter && e.key === 'Enter') {
        e.preventDefault();
        const saveButton = document.querySelector(
          '[data-cy="input-dialog-save-button"]'
        ) as HTMLButtonElement;
        if (saveButton) {
          saveButton.click();
        }
      }
    };

    return (
      <div className={cn('w-full', className)}>
        <InputComponent
          ref={inputRef}
          id={id}
          data-cy={id}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          {...props}
        />
      </div>
    );
  }
);

InputDialogInput.displayName = 'InputDialog.Input';

export interface InputDialogLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Optional className for the label */
  className?: string;
  /** For attribute to match input ID */
  htmlFor?: string;
  children: React.ReactNode;
}

const InputDialogLabel = React.forwardRef<HTMLLabelElement, InputDialogLabelProps>(
  ({ className, htmlFor = 'dialog-input', children, ...props }, ref) => {
    return (
      <Label
        ref={ref}
        className={cn(className)}
        htmlFor={htmlFor}
        {...props}
      >
        {children}
      </Label>
    );
  }
);

InputDialogLabel.displayName = 'InputDialog.Label';

export interface InputDialogActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional className for the actions container */
  className?: string;
  children: React.ReactNode;
}

const Actions = React.forwardRef<HTMLDivElement, InputDialogActionsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
      >
        <FooterAction className={cn(className)}>
          <FooterAction.Right>{children}</FooterAction.Right>
        </FooterAction>
      </div>
    );
  }
);

Actions.displayName = 'InputDialog.Actions';

export interface InputDialogActionButtonProps {
  /** Optional className for the button */
  className?: string;
  /** Click handler that receives the current input value */
  onClick: (value: string) => void;
  children: React.ReactNode;
}

const ActionsSecondary = React.forwardRef<HTMLDivElement, InputDialogActionButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const context = useContext(InputDialogContext);
    if (!context) {
      throw new Error('InputDialog.ActionsSecondary must be used within an InputDialog');
    }

    const { value } = context;

    return (
      <div
        ref={ref}
        {...props}
      >
        <FooterAction.Secondary
          onClick={() => onClick(value)}
          className={cn(className)}
        >
          {children}
        </FooterAction.Secondary>
      </div>
    );
  }
);

ActionsSecondary.displayName = 'InputDialog.ActionsSecondary';

const ActionsPrimary = React.forwardRef<HTMLDivElement, InputDialogActionButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const context = useContext(InputDialogContext);
    if (!context) {
      throw new Error('InputDialog.ActionsPrimary must be used within an InputDialog');
    }

    const { value } = context;
    return (
      <div
        ref={ref}
        {...props}
        data-cy="input-dialog-save-button"
        onClick={() => onClick(value)}
      >
        <FooterAction.Primary
          onClick={() => onClick(value)}
          className={cn(className)}
        >
          {children}
        </FooterAction.Primary>
      </div>
    );
  }
);

ActionsPrimary.displayName = 'InputDialog.ActionsPrimary';

export const InputDialog = Object.assign(InputDialogRoot, {
  Label: InputDialogLabel,
  Input: InputDialogInput,
  Field,
  Actions,
  ActionsSecondary,
  ActionsPrimary,
});
