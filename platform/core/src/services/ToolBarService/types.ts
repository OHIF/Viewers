import type { RunCommand } from '../../types/Command';

export type EvaluatePublic = string | EvaluateFunction | string[];

export type EvaluateFunction = (props: Record<string, unknown>) => {
  disabled: boolean;
  className: string;
};

export type ButtonProps = {
  id: string;
  icon: string;
  label: string;
  tooltip?: string;
  commands?: RunCommand;
  disabled?: boolean;
  className?: string;
  evaluate?: EvaluatePublic;
  listeners?: Record<string, RunCommand>;
};

export type NestedButtonProps = {
  groupId: string;
  // group evaluate which is different
  // from the evaluate function for the primary and items
  evaluate?: EvaluatePublic;
  items: ButtonProps[];
  primary: ButtonProps & {
    // Todo: this is really ugly but really we don't have any other option
    // the ui design requires this since the button should be rounded if
    // active otherwise it should not be rounded
    isActive?: boolean;
  };
  secondary: ButtonProps;
};

export type Button = {
  id: string;
  props: ButtonProps | NestedButtonProps;
  // button ui type (e.g. 'ohif.splitButton', 'ohif.radioGroup')
  // extensions can provide custom components for these types
  uiType: string;
};
