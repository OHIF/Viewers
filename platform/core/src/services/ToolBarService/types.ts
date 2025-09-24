import type { RunCommand } from '../../types/Command';
import React from 'react';

/**
 * Type definitions for toolbar sections
 */
export type ToolbarSections = {
  primary: string;
  secondary: string;
  viewportActionMenu: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
};

export type EvaluatePublic =
  | string
  | EvaluateFunction
  | EvaluateObject
  | (string | EvaluateFunction | EvaluateObject)[];

export type EvaluateFunction = (props: Record<string, unknown>) => {
  disabled: boolean;
  className: string;
};

export type EvaluateObject = {
  name: string;
  // Allow any additional properties
  [key: string]: unknown;
};

export type ButtonOptions = {
  id: string;
  type: 'range' | 'radio' | 'double-range' | 'custom';
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number | number[] | string;
  commands?: (value: unknown) => void;
  condition?: (props: Record<string, unknown>) => boolean;
  children?: React.ReactNode | (() => React.ReactNode);
  options?: Array<{ value: string; label: string }>;
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
  options?: ButtonOptions[];
  buttonSection?: string | boolean;
};

export type Button = {
  id: string;
  props: ButtonProps;
  // button ui type (e.g. 'ohif.splitButton', 'ohif.radioGroup')
  // extensions can provide custom components for these types
  uiType: string;
  component?: React.ComponentType<any>;
};
