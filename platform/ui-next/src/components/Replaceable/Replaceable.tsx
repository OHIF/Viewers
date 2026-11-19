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
  props?: Record<string, unknown>;
  children?: React.ReactNode;
};

const ReplaceablePropsContext = createContext<Record<string, unknown>>({});

const warnedIds = new Set<string>();

/**
 * The top-level element of a replaceable component. It reads the customization
 * `components.<id>`:
 *
 * - no entry: renders `children` (the default display) with no change.
 * - `{ component: null }`: renders nothing at this place.
 * - `{ component: C }`: renders `C` with the merged props, and `children` as the
 *   default, so that `C` can wrap the default. In a value with a `$` key, write
 *   `component: { $set: C }` and `{ $set: null }`: the service applies a bare
 *   function, and throws on a bare `null` or a `React.memo` object.
 * - `{ props }` only: clones the one child element with `props`.
 *
 * The merged props are the props of every `Replaceable` above this one plus
 * `props`. A replacement of a parent can place a child part elsewhere, and the
 * part still gets its props from the context.
 */
export function Replaceable({ id, props, children }: ReplaceableProps) {
  const merged = { ...useContext(ReplaceablePropsContext), ...props };
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
        {...merged}
        {...extra}
      >
        {children}
      </Component>
    );
  } else if (extra && canClone) {
    content = cloneElement(children as React.ReactElement, extra);
  }

  return (
    <ReplaceablePropsContext.Provider value={merged}>{content}</ReplaceablePropsContext.Provider>
  );
}

/** The merged props of the `Replaceable` elements above the caller. */
export function useReplaceableProps<T = Record<string, unknown>>(): T {
  return useContext(ReplaceablePropsContext) as T;
}

export default Replaceable;
