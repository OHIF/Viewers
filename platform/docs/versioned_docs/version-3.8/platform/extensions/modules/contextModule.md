---
sidebar_position: 9
sidebar_label: Context
---
# Module: Context

## Overview
This new module type allows you to connect components via a shared context. You can create a context that two components, e.g. a viewport and a panel can use to synchronize and communicate. An extensive example of this can be seen in the longitudinal mode’s custom extensions.



```jsx
const ExampleContext = React.createContext();

function ExampleContextProvider({ children }) {
  return (
    <ExampleContext.Provider value={{ example: 'value' }}>
      {children}
    </ExampleContext.Provider>
  );
}

const getContextModule = () => [
  {
    name: 'ExampleContext',
    context: ExampleContext,
    provider: ExampleContextProvider,
  },
];
```
