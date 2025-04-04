import * as React from 'react';

// https://github.com/reach/reach-ui/blob/dev/packages/utils/src/context.tsx
type ContextProvider<T> = React.FC<React.PropsWithChildren<T>>;

export function createContext<ContextValueType extends object | null>(
  rootComponentName: string,
  defaultContext?: ContextValueType
): [ContextProvider<ContextValueType>, (callerComponentName: string) => ContextValueType] {
  const Ctx = React.createContext<ContextValueType | undefined>(defaultContext);

  function Provider(props: React.PropsWithChildren<ContextValueType>) {
    const { children, ...context } = props;
    const value = React.useMemo(
      () => context,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(context)
    ) as ContextValueType;
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  function useContext(callerComponentName: string) {
    const context = React.useContext(Ctx);
    if (context) {
      return context;
    }
    if (defaultContext) {
      return defaultContext;
    }
    throw Error(
      `${callerComponentName} must be rendered inside of a ${rootComponentName} component.`
    );
  }

  Ctx.displayName = `${rootComponentName}Context`;
  Provider.displayName = `${rootComponentName}Provider`;
  return [Provider, useContext];
}
