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

declare global {
  namespace AppTypes {
    /**
     * Custom `$<command>` keys usable inside customization specs, beyond the
     * immutability-helper built-ins ($set, $push, $merge, $apply, ...). Each
     * entry maps the command name to the type of argument it accepts.
     *
     * The CustomizationService registers `$filter` itself (declared just
     * below). Anything registered at runtime through
     * `customizationService.registerCustomUpdateCommand` is declared the same
     * way the customization ids themselves are — by whoever registers it:
     *
     * ```ts
     * declare global {
     *   namespace AppTypes {
     *     interface CustomizationUpdateCommands {
     *       $myCommand: MyCommandArg;
     *     }
     *   }
     * }
     * ```
     */
    interface CustomizationUpdateCommands {
      /** See {@link FilterSpec}. */
      $filter: FilterSpec;
    }
  }
}

/**
 * The {@link AppTypes.CustomizationUpdateCommands} registry in the branded form
 * `immutability-helper` expects for the `C` parameter of its `Spec` type.
 *
 * `Partial` is required, not cosmetic: `Spec` surfaces custom commands through
 * `C extends CustomCommands<infer O> ? O : never`, and `O` infers to the whole
 * registry — so without it every spec would have to supply *all* registered
 * commands at once, and a registry with more than one command would reject
 * `{ $filter: ... }` outright.
 */
export type CustomizationUpdateCommands = CustomCommands<
  Partial<AppTypes.CustomizationUpdateCommands>
>;

/**
 * A read-time `{ $reference: '<customization id>' }` marker. The service
 * replaces it with the value of the referenced customization when the value is
 * read (see `_resolveReferences`), so markers may stand in for a value
 * anywhere the resolver walks: as a whole value, as an array item (a
 * referenced array is flattened into the surrounding list), or as a plain
 * object's property value.
 */
export type ReferenceMarker = { $reference: string };

/**
 * A read-time `{ $transform }` hook. `transform()` calls it with the service
 * and uses the result as the value, so the object carrying it does not have to
 * satisfy the declared value type itself — the sibling properties are the
 * hook's input, read off `this` (see `contextMenuCustomization`).
 *
 * Note the return type is not enforced: `Spec` already admits a bare
 * `(value: T) => T` function form, so a `$transform` is checked as a function
 * but not against `T`. `$transform` is a dynamic escape hatch with an untyped
 * `this`; the checked paths are direct values and `$set` / `$push` / ... specs.
 */
export type TransformMarker<T> = { $transform: (service: any) => T };

/**
 * Values `_resolveReferences` returns untouched rather than walking, so a
 * `$reference` marker cannot be substituted inside them.
 */
type OpaqueValue =
  | ((...args: any[]) => any)
  | (abstract new (...args: any[]) => any)
  | React.ReactElement
  | Date
  | RegExp;

/**
 * What may be *authored* in place of a customization value that resolves to
 * `T`: the value itself, or any of the read-time markers above substituted at
 * the positions the resolver walks.
 *
 * This transform is deliberately applied only on the write side
 * ({@link CustomizationEntries}). `getCustomization` returns the resolved
 * value, which never contains markers, so its declared type stays clean — the
 * registry declares what a key resolves to, not what may be written for it.
 */
export type Authorable<T> =
  | ReferenceMarker
  | TransformMarker<T>
  | (T extends OpaqueValue
      ? T
      : T extends readonly (infer U)[]
        ? Authorable<U>[]
        : T extends object
          ? { [K in keyof T]: Authorable<T[K]> }
          : T);

type KnownCustomizationIds = keyof AppTypes.Customizations;

/**
 * The customization-id -> value map accepted by
 * `customizationService.setCustomizations`. Ids registered in
 * `AppTypes.Customizations` are checked against their declared value type,
 * either as a direct value or as an immutability-helper spec over it
 * (e.g. `{ $set: ... }`, `{ $push: [...] }`), in both cases allowing the
 * read-time markers {@link Authorable} describes. Ids not in the registry
 * (dynamic keys, third-party keys that have not been declared) are still
 * accepted, with unconstrained value types.
 */
export type CustomizationEntries = {
  [K in KnownCustomizationIds]?:
    | Authorable<AppTypes.Customizations[K]>
    | Spec<Authorable<AppTypes.Customizations[K]>, CustomizationUpdateCommands>;
} & {
  [customizationId: string]: unknown;
};
