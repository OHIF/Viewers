import { Command } from '../../types/Command';
import { ComponentType } from 'react';

export type Obj = Record<string, unknown>;

export interface BaseCustomization extends Obj {
  id?: string;
  inheritsFrom?: string;
  description?: string;
  label?: string;
  commands?: Command[];
}

export interface LabelCustomization extends BaseCustomization {
  label: string;
}

export interface CodeCustomization extends BaseCustomization {
  code: string;
}

export interface CommandCustomization extends BaseCustomization {
  commands: Command[];
}

export interface ComponentCustomization extends BaseCustomization {
  content: (...props: any) => React.JSX.Element;
}

export interface CallbackCustomization extends BaseCustomization {
  callbacks: Array<(...props: any) => any>;
}

export type MenuComponentCustomization = React.ComponentType & {
  menuTitle?: string;
  title?: string;
  containerClassName?: string;
};

export type Customization =
  | MenuComponentCustomization
  | React.ComponentType
  | BaseCustomization
  | LabelCustomization
  | CommandCustomization
  | CodeCustomization
  | ComponentCustomization
  | CallbackCustomization;

export default Customization;

export type ComponentReturn = {
  component: ComponentType;
  props?: Obj;
};

export type NestedStrings = string[] | NestedStrings[];
