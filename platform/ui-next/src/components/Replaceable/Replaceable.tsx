import React, {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
} from 'react';
import { useCustomization } from '@ohif/core';

type ReplaceableEntry = {
  component?: React.ComponentType<any> | null;
  props?: Record<string, unknown>;
};

type ReplaceableProps = {
  id: string;
  /** The props that the part got from its parent, unchanged. */
  props?: Record<string, unknown>;
  children?: React.ReactNode;
  /** The values that the part computed, for example from its hooks. */
  [computed: string]: unknown;
};

const ReplaceablePropsContext = createContext<Record<string, Record<string, unknown>>>({});

const warnedIds = new Set<string>();

/**
 * The top-level element of a replaceable component:
 * `<Replaceable id="x" props={props} isActive={isActive}>default</Replaceable>`.
 * `props` holds the props of the part, and the other attributes hold the values
 * that the part computed, so that a computed value never hides an input prop.
 *
 * It reads the customization `components.<id>`:
 *
 * - no entry: renders `children` (the default display) with no change.
 * - `{ component: null }`: renders nothing at this place.
 * - `{ component: C }`: renders `C` with the same props as this `Replaceable`
 *   except `id`, plus the entry `props`, and `children` as the default, so that
 *   `C` can wrap the default. In a value with a `$` key, write
 *   `component: { $set: C }` and `{ $set: null }`: the service applies a bare
 *   function, and throws on a bare `null` or a `React.memo` object.
 * - `{ props }` only: clones the one child element with `props`.
 *
 * A replacement of a parent can place a child part elsewhere; the part reads the
 * props of a level above with `useReplaceableProps(id)`.
 */
export function Replaceable({ id, children, ...given }: ReplaceableProps) {
  const levels = useContext(ReplaceablePropsContext);
  const entry = useCustomization<ReplaceableEntry | undefined>(`components.${id}`);
  const { component: Component, props: extra } = entry ?? {};
  const canClone = isValidElement(children);
  const cloneFails = Component === undefined && !!extra && Children.count(children) > 1;

  useEffect(() => {
    if (cloneFails && !warnedIds.has(id)) {
      warnedIds.add(id);
      console.warn(`Replaceable ${id}: a props-only entry needs one child element, not several`);
    }
  }, [cloneFails, id]);

  let content: React.ReactNode = children;
  if (Component === null) {
    content = null;
  } else if (Component !== undefined) {
    content = (
      <Component
        {...given}
        {...extra}
      >
        {children}
      </Component>
    );
  } else if (extra && canClone) {
    content = cloneElement(children as React.ReactElement, extra);
  }

  return (
    <ReplaceablePropsContext.Provider value={{ ...levels, [id]: given }}>
      {content}
    </ReplaceablePropsContext.Provider>
  );
}

/**
 * The props (`props` and the computed values) of the `Replaceable` with `id`
 * above the caller, or `undefined` when no such level exists.
 */
export function useReplaceableProps<T = Record<string, unknown>>(id: string): T | undefined {
  return useContext(ReplaceablePropsContext)[id] as T | undefined;
}

export default Replaceable;
