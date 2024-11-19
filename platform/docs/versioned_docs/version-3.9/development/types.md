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

## Typing the custom extensions's new services

Extensions can define additional services that integrate seamlessly into the application's global service architecture, and will be available on the ServicesManager for use across the application.

### Adding the extension's services Types

Declare your service in the global namespace and use it across your application as demonstrated below:

`extensions/my-extension/src/types/whatever.ts`

```typescript
declare global {
  namespace AppTypes {
    // only add if you need direct access to the service ex. AppTypes.MicroscopyService
    export type MicroscopyService = MicroscopyServiceType;
    // add to the global Services interface, and to withAppTypes
    export interface Services {
      microscopyService?: MicroscopyServiceType;
    }
  }
}
```

Doing the above adds the `microscopyService` to the global Services interface, which ServicesManager uses by default `public services: AppTypes.Services = {};` to type services, and is also used by withAppTypes to inject services into components.
You will also get access to the seperate services via `AppTypes.YourServiceName` in your application.


```typescript
export function CustomComponent({
  servicesManager,
}: withAppTypes<CustomComponentProps>): ReactElement {
  const { microscopyService } = servicesManager.services;
  microscopyService.someMethod(); // auto completation available

}
```

```typescript
export function CustomComponent2(
  microscopyService: AppTypes.MicroscopyService,
): ReactElement {
  microscopyService.someMethod(); // auto completation available
}
```
