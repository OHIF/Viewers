import { Command } from '../../types/Command';
import { ComponentType } from 'react';
import type { Spec, CustomCommands } from 'immutability-helper';

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
  | CallbackCustomization
  | string
  | number
  | boolean;

export default Customization;

export type ComponentReturn = {
  component: ComponentType;
  props?: Obj;
};

export type NestedStrings = string[] | NestedStrings[];

/**
 * Accepted shapes for the custom `$filter` update command registered by the
 * CustomizationService (see the `extend('$filter', ...)` block there):
 *   - a predicate function used to filter array items
 *   - a string id, removing items whose `id` equals it
 *   - `{ match, $merge }` merging into items whose properties match `match`
 *   - `{ id, $merge }` merging into items whose `id` matches (backwards compat)
 */
export type FilterSpec =
  | string
  | ((item: any, index: number, array: any[]) => boolean)
  | { match: Record<string, unknown>; $merge: Record<string, unknown> }
  | { id: string; $merge: Record<string, unknown> };

/**
 * Update commands available in customization specs beyond the
 * immutability-helper built-ins ($set, $push, $merge, $apply, ...).
 * Commands added at runtime through `registerCustomUpdateCommand` are not
 * represented here; specs using them need a cast at the call site.
 */
export type CustomizationUpdateCommands = CustomCommands<{ $filter: FilterSpec }>;

type KnownCustomizationIds = keyof AppTypes.Customizations;

/**
 * The customization-id -> value map accepted by
 * `customizationService.setCustomizations`. Ids registered in
 * `AppTypes.Customizations` are checked against their declared value type,
 * either as a direct value or as an immutability-helper spec over it
 * (e.g. `{ $set: ... }`, `{ $push: [...] }`). Ids not in the registry
 * (dynamic keys, third-party keys that have not been declared) are still
 * accepted, with unconstrained value types.
 */
export type CustomizationEntries = {
  [K in KnownCustomizationIds]?:
    | AppTypes.Customizations[K]
    | Spec<AppTypes.Customizations[K], CustomizationUpdateCommands>;
} & {
  [customizationId: string]: unknown;
};
