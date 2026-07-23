---
title: Advanced Customization
summary: Documentation for advanced OHIF customization techniques, including inheritance patterns, transform functions, and dynamic assembly of customizations to create sophisticated configurations across the platform.
sidebar_position: 8
---


Below is an overview of how `transform` and `inheritsFrom` work within this customization system. They allow you to build a hierarchy of customizations in which items can inherit fields from a parent and then optionally apply a transformation before returning the final result.


## `inheritsFrom`

### Purpose
Indicates that the current customization should inherit and merge fields from another customization. The system fetches the parent customization, merges its properties, and returns a combined object.

### How It Works
1. When you request or transform a customization that has `inheritsFrom: "parentCustomizationId"`, the service looks up `parentCustomizationId` via `getCustomization(...)`.
2. Properties from the parent get copied into the child, but the child’s own properties overwrite any matching ones from the parent.
3. If the child has a `transform` function, it runs after the merge.

### Example
```js
export default {
  measurementsContextMenu: {
    $set: {
      inheritsFrom: 'ohif.contextMenu',
      menus: [
        {
          selector: ({ nearbyToolData }) => !!nearbyToolData,
          items: [
            // ...
          ],
        },
      ],
    },
  },
};
```
Here, `measurementsContextMenu` inherits from `ohif.contextMenu`. During retrieval or transformation, the system merges `ohif.contextMenu` into `measurementsContextMenu`.

---

## `transform`

### Purpose
Specifies a function that can modify or enhance the customization object at runtime. Often used to run extra setup code or combine fields in a special way.

### How It Works
1. You define a `transform(customizationService)` function inside your customization object.
2. When the system retrieves the customization, after merging any inherited fields, it calls `transform`.
3. The function may return an updated object, clone existing properties, or apply logic to nested items.

### Example
```js
export default {
  '@ohif/contextMenuAnnotationCode': {
    $transform: function (customizationService) {
      const { code: codeRef } = this;
      if (!codeRef) {
        throw new Error(`item ${this} has no code ref`);
      }
      const codingValues = customizationService.getCustomization('codingValues');
      const code = codingValues[codeRef];

      return {
        ...this,
        codeRef,
        code: { ref: codeRef, ...code },
        label: this.label || code.text || codeRef,
        commands: [{ commandName: 'updateMeasurement' }],
      };
    },
  },
};
```
In this snippet, the `transform` function:
- Reads a code reference from `this`.
- Looks up more data for that code in `codingValues`.
- Merges those details back into `this` before returning the final object.

---

## Common Use Cases

1. **Base and Specialized Customizations**
   Use `inheritsFrom` to define a broad, general customization (e.g., a generic context menu) and then create specialized versions that only override certain fields.

2. **Dynamic Assembly**
   Use `transform` when you need to compute or modify fields based on application state or other registered customizations.

3. **Nested Items**
   If an item within the customization also has `inheritsFrom`, it will follow the same inheritance flow and can run its own `transform` logic.

---

**Key Points**
- `inheritsFrom` is a reference to another customization’s ID.
- If `transform` is defined, it always runs after inheritance is resolved.
- Merging is shallow: child properties override the parent’s.
- You can nest multiple levels of inheritance, each possibly having its own `transform` step.
