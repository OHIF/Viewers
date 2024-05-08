---
sidebar_position: 10
sidebar_label: Global Types
---

# Extending App Types and Services in Your Application

This documentation provides an overview and examples on how to use and extend `withAppTypes`, integrate custom properties, and add services in the global namespace of the application. This helps in enhancing the application's modularity and extensibility.

## Overview of `withAppTypes`

The `withAppTypes` function is a TypeScript utility that extends the base properties of components or modules with the application's core service and manager types. It allows for a more flexible and type-safe way to pass around core functionality and custom properties.

### Using `withAppTypes`

`withAppTypes` can be enhanced using generics to include custom properties. This is particularly useful for passing additional data or configurations specific to your component or service.

#### Basic Syntax

```typescript
export type withAppTypes<T = object> = T & AppTypes.Services & AppTypes.Managers & {
    [key: string]: any;
};
```

This construct merges the generic type `T`, which you can define based on your component's needs, with the predefined service and manager types.

### Extending with Custom Properties

You can extend `withAppTypes` to include custom properties by defining an interface for the props you need. For example:

```typescript
interface ColorbarProps {
  viewportId: string;
  displaySets: Array<any>;
  colorbarProperties: ColorbarProperties;
}

export function Colorbar({
  viewportId,
  displaySets,
  commandsManager, // injected type
  servicesManager, // injected type
  colorbarProperties,
}: withAppTypes<ColorbarProps>): ReactElement {
  // Component logic here
}
```

In this example, `ColorbarProps` is a custom interface that extends the application types through `withAppTypes`.

## Adding Services in Extensions

Extensions can define additional services that integrate seamlessly into the application's global service architecture, and will be available on the ServicesManager for use across the application.

### Defining a New Service

Declare your service in the global namespace and use it across your application as demonstrated below:

`extensions/my-extension/src/types/AppTypes.ts`

```typescript
declare global {
  namespace AppTypes {
    export type MicroscopyService = MicroscopyServiceType; // AppTypes.MicroscopyService
    export interface Services {
      microscopyService?: MicroscopyServiceType; // servicesManager.services.microscopyService
    }
  }
}
```

Doing the above adds the `microscopyService` to the global Services interface, which ServicesManager uses by defualt `public services: AppTypes.Services = {};` to manage services, and is also used by withAppTypes to inject services into components.
You will also get access to the seperate services via `AppTypes.YourServiceName` in your application.


```typescript
export function CustomComponent({
  microscopyService,
  servicesManager,
  // other injected services
}: withAppTypes<CustomComponentProps>): ReactElement {
  microscopyService.someMethod(); // auto completation available
  const { microscopyService: microscopyServiceViaServicesManager } = servicesManager.services;
  microscopyServiceViaServicesManager.someMethod(); // auto completation available

}
```

```typescript
export function CustomComponent2(
  microscopyService: AppTypes.MicroscopyService,
  servicesManager: AppTypes.ServicesManager,
): ReactElement {
}
```

## Extending Managers

Managers handle more complex interactions and state management across services. You can extend existing managers or introduce new ones as part of your extension framework.

### Example: Adding a New Manager

```typescript
declare global {
  namespace AppTypes {
    export type NewManager = NewManagerType;
    export interface Managers {
      newManager?: NewManager;
    }
  }
}
```

Doing the above adds the `newManager` to the global Managers interface, making it available on 'withAppTypes' and also directly via `AppTypes.NewManager` in your application.

```typescript
export function SomeComponent({ newManager }: withAppTypes<SomeComponentProps>): ReactElement {
  // Use newManager here
}
```

```typescript
export function SomeComponent2(newManager: AppTypes.NewManager): ReactElement {
  // Use newManager here
}
```
