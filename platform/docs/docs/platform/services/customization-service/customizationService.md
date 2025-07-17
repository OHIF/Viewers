---
sidebar_label: Introduction
sidebar_position: 1
title: Customization Service
summary: Documentation for OHIF's Customization Service, which provides a flexible framework for configuring and overriding viewer components across different scopes (default, mode, global), supporting dynamic customization of UI elements and behaviors.
---

import { customizations, TableGenerator } from './sampleCustomizations';
import Heading from '@theme/Heading';
import TOCInline from '@theme/TOCInline';

# Customization Service

There are a lot of places where users may want to configure certain elements
differently between different modes or for different deployments.  A mode
example might be the use of a custom overlay showing mode related DICOM header
information such as radiation dose or patient age.

The use of `customizationService` enables these to be defined in a typed fashion by
providing an easy way to set default values for this, but to allow a
non-default value to be specified by the configuration or mode.


:::note

`customizationService` itself doesn't implement the actual customization,
but rather just provide mechanism to register reusable prototypes, to configure
those prototypes with actual configurations, and to use the configured objects
(components, data, whatever).

Actual implementation of the customization is totally up to the component that
supports customization.
:::


## General Overview

This framework allows you to configure many features, or "slots," through customization modules. Extensions can choose to offer their own module, which outlines which values can be changed. By looking at each extension's getCustomizationModule(), you can see which objects or components are open to customization.

Below is a high-level example of how you might define a default customization and then consume and override it:

1. **Defining a Customizable Default**

   In your extension, you might export a set of default configurations (for instance, a list that appears in a panel). Here, you provide an identifier and store the default list under that identifier. This makes the item discoverable by the customization service:

   ```js
   // Inside your extension’s customization module
   export default function getCustomizationModule() {
     return [
       {
         name: 'default',
         value: {
           defaultList: ['Item A', 'Item B'],
         },
       },
     ];
   }
   ```

   By naming it `default`, it is automatically registered.

   :::info
   You might want to have customizations ready to use in your application without actually applying them. In such cases, you can name them something other than `default`. For example, in your mode, you can do this:

    ```js
    customizationService.setCustomizations([
     '@ohif/extension-cornerstone-dicom-seg.customizationModule.dicom-seg-sorts',
    ]);
    ```

    This is really useful when you want to apply a set of customizations as a pack, kind of like a bundle.
   :::

3. **Retrieving the Default Customization**
   In the panel or component (or whatever) that needs the list, you retrieve it using `getCustomization`:

   ```js
   const myList = customizationService.getCustomization('defaultList');
   // If unmodified, this returns ['Item A', 'Item B']
   ```

   This allows your component to always fetch the most current version (original default or overridden).

4. **Overriding from Outside**
   To customize this list outside your extension, call `setCustomizations` with the identifier (`'defaultList'`). For example, a mode can modify the list to add or change items:

   ```js
   // From within a mode (or globally)
   customizationService.setCustomizations({
     'defaultList': {
       $set: ['New Item 1', 'New Item 2'],
     },
   });
   ```

   The next time any panel calls `getCustomization('defaultList')`, it will get the updated list.

   Don't worry we will go over the `$set` syntax in more detail later.

---

## Scope of Customization


Customizations can be declared at three different scopes, each with its own priority and lifecycle. These scopes determine how and when customizations are applied.


### 1. **Default Scope**
   - **Purpose**: Establish baseline or "fallback" values that extensions provide.
   - **Options**:
     1. **Via Extensions**:
        - Implement a `getCustomizationModule` function in your extension and name it `default`.
        ```tsx
        function getCustomizationModule() {
          return [
            {
              name: 'default',
              value: {
                'studyBrowser.sortFunctions': {
                  $set: [
                    {
                      label: 'Default Sort Function',
                      sortFunction: (a, b) => a.SeriesDate - b.SeriesDate,
                    },
                  ],
                },
              },
            },
          ];
        }
        ```
     2. **Using the `setCustomizations` Method**:
        - Call `setCustomizations` in your application and specify `CustomizationScope.Default` as the second argument:
        ```tsx
        customizationService.setCustomizations(
          {
            'studyBrowser.sortFunctions': {
              $set: [
                {
                  label: 'Default Sort Function',
                  sortFunction: (a, b) => a.SeriesDate - b.SeriesDate,
                },
              ],
            },
          },
          CustomizationScope.Default
        );
        ```


### 2. **Mode Scope**
   - **Purpose**: Apply customizations specific to a particular mode.
   - **Lifecycle**: These customizations are cleared or reset when switching between modes.
   - **Example**: Use the `setCustomizations` method to define mode-specific behavior.
     ```tsx
     customizationService.setCustomizations({
       'studyBrowser.sortFunctions': {
         $set: [
           {
             label: 'Mode-Specific Sort Function',
             sortFunction: (a, b) => b.SeriesDate - a.SeriesDate,
           },
         ],
       },
     });
     ```



### 3. **Global Scope**
   - **Purpose**: Apply system-wide customizations that override both default and mode-scoped values.
   - **How to Configure**:
     1. Add global customizations directly to the application's configuration file:
        ```jsx
        window.config = {
          name: 'config/default.js',
          routerBasename: null,
          customizationService: [
            {
              'studyBrowser.sortFunctions': {
                $push: [
                  {
                    label: 'Global Sort Function',
                    sortFunction: (a, b) => b.SeriesDate - a.SeriesDate,
                  },
                ],
              },
            },
          ],
        };
        ```

     2. Use Namespaced Extensions:
        - Instead of directly specifying customizations in the configuration, you can refer to a predefined customization module within an extension:

        ```jsx
        window.config = {
          name: 'config/default.js',
          routerBasename: null,
          customizationService: [
            '@ohif/extension-cornerstone.customizationModule.newCustomization',
          ],
        };
        ```

        - In this example, the `newCustomization` module within the `@ohif/extension-cornerstone` extension contains the global customizations. The application will load and apply these settings globally.

          ```tsx
          function getCustomizationModule() {
            return [
              {
                name: 'newCustomization',
                value: {
                  'studyBrowser.sortFunctions': {
                    $push: [
                      {
                        label: 'Global Namespace Sort Function',
                        sortFunction: (a, b) => b.SeriesDate - a.SeriesDate,
                      },
                    ],
                  },
                },
              },
            ];
          }
          ```


### Priority of Scopes
When a customization is retrieved:
1. **Global Scope**: Takes precedence if defined.
2. **Mode Scope**: Used if no global customization is defined.
3. **Default Scope**: Fallback when neither global nor mode-specific values are available.


As you have guessed the `.setCustomizations` accept a second argument which is the scope. By default it is set to `mode`.


## Customization Syntax


The customization syntax is designed to offer **flexibility** when modifying configurations. Instead of simply replacing values, you can perform granular updates like appending items to arrays, inserting at specific indices, updating deeply nested fields, or applying filters. This flexibility ensures that updates are efficient, targeted, and suitable for complex data structures.

<details>
<summary>
Why a Special Syntax?
</summary>

Traditional value replacement might not be ideal in scenarios such as:
- **Appending or prepending** to an existing list instead of overwriting it.
- **Selective updates** for specific fields in an object without affecting other fields.
- **Filtering or merging** nested items in arrays or objects while preserving other parts.

To address these needs, the customization service uses a **special syntax** inspired by [immutability-helper](https://github.com/kolodny/immutability-helper) commands. Below are examples of each operation.

</details>

---

### 1. Replace a Value (`$set`)

Use `$set` to entirely replace a value. This is the simplest operation which would replace the entire value.

```js
// Before: someKey = 'Old Value'
customizationService.setCustomizations({
  someKey: { $set: 'New Value' },
});
// After: someKey = 'New Value'
```

Example with study browser:

```js
// Before: studyBrowser.sortFunctions = []

customizationService.setCustomizations({
  'studyBrowser.sortFunctions': {
    $set: [
      {
        label: 'Sort by Patient ID',
        sortFunction: (a, b) => a.PatientID.localeCompare(b.PatientID),
      },
    ],
  },
});

// After: studyBrowser.sortFunctions = [{label: 'Sort by Patient ID', sortFunction: ...}]
```

---

### 2. Add to an Array (`$push` and `$unshift`)

- **`$push`**: Appends items to the end of an array.
- **`$unshift`**: Adds items to the beginning of an array.

```js
// Before: NumbersList = [1, 2, 3]

// Push items to the end
customizationService.setCustomizations({
  'NumbersList': { $push: [5, 6] },
});
// After: NumbersList = [1, 2, 3, 5, 6]

// Unshift items to the front
customizationService.setCustomizations({
  'NumbersList': { $unshift: [0] },
});
// After: NumbersList = [0, 1, 2, 3, 5, 6]
```

---

### 3. Insert at Specific Index (`$splice`)

Use `$splice` to insert, replace, or remove items at a specific index in an array.

```js
// Before: NumbersList = [1, 2, 3]

customizationService.setCustomizations({
  'NumbersList': {
    $splice: [
      [2, 0, 99], // Insert 99 at index 2
    ],
  },
});
// After: NumbersList = [1, 2, 99, 3]
```

---

### 4. Merge Object Properties (`$merge`)

Use `$merge` to update specific fields in an object without affecting other fields.

```js
// Before: SeriesInfo = { label: 'Original Label', sortFunction: oldFunc }

customizationService.setCustomizations({
  'SeriesInfo': {
    $merge: {
      label: 'Updated Label',
      extraField: true,
    },
  },
});
// After: SeriesInfo = { label: 'Updated Label', sortFunction: oldFunc, extraField: true }
```

Example with nested merge:
```js
// Before: SeriesInfo = { advanced: { subKey: 'oldValue' } }

customizationService.setCustomizations({
  'SeriesInfo': {
    advanced: {
      $merge: {
        subKey: 'updatedSubValue',
      },
    },
  },
});
// After: SeriesInfo = { advanced: { subKey: 'updatedSubValue' } }
```

---

### 5. Apply a Function (`$apply`)

Use `$apply` when you need to compute the new value dynamically.

```js
// Before: SeriesInfo = { label: 'Old Label', data: 123 }

customizationService.setCustomizations({
  'SeriesInfo': {
    $apply: oldValue => ({
      ...oldValue,
      label: 'Computed Label',
    }),
  },
});
// After: SeriesInfo = { label: 'Computed Label', data: 123 }
```

---

### 6. Filter and Modify (`$filter`)

Use `$filter` to find specific items in arrays (or objects) and apply changes.

```js
// Before: advanced = {
//   functions: [
//     { id: 'seriesDate', label: 'Original Label' },
//     { id: 'other', label: 'Other Label' }
//   ]
// }

customizationService.setCustomizations({
  'advanced': {
    $filter: {
      match: { id: 'seriesDate' },
      $merge: {
        label: 'Updated via Filter',
      },
    },
  },
});
// After: advanced = {
//   functions: [
//     { id: 'seriesDate', label: 'Updated via Filter' },
//     { id: 'other', label: 'Other Label' }
//   ]
// }
```

:::note

Note `$filter` will look recursively for
an object that matches the `match` criteria and then apply the `$merge` or `$set` operation to it.

Note in the example above we are not doing anything with the `functions` array.

:::


Example with deeply nested filter:
```js
// Before: advanced = {
//   functions: [{
//     id: 'seriesDate',
//     viewFunctions: [
//       { id: 'axial', label: 'Original Axial' }
//     ]
//   }]
// }

customizationService.setCustomizations({
  'advanced': {
    $filter: {
      match: { id: 'axial' },
      $merge: {
        label: 'Axial (via Filter)',
      },
    },
  },
});
// After: advanced = {
//   functions: [{
//     id: 'seriesDate',
//     viewFunctions: [
//       { id: 'axial', label: 'Axial (via Filter)' }
//     ]
//   }]
// }
```

---

### Summary of Commands

| **Command** | **Purpose**                                   | **Example**                          |
|-------------|-----------------------------------------------|---------------------------------------|
| `$set`      | Replace a value entirely                     | Replace a list or object             |
| `$push`     | Append items to an array                     | Add to the end of a list             |
| `$unshift`  | Prepend items to an array                    | Add to the start of a list           |
| `$splice`   | Insert, remove, or replace at specific index | Modify specific indices in a list    |
| `$merge`    | Update specific fields in an object          | Change a subset of fields            |
| `$apply`    | Compute the new value dynamically            | Apply a function to transform values |
| `$filter`   | Find and update specific items in arrays     | Target nested structures             |
| `$transform`| Apply a function to transform the customization | Apply a function to transform values |

## Building Customizations Across Multiple Extensions

Sometimes it is useful to build customizations across multiple extensions. For example, you may want to build a default list of tools inside a vieweport. But then each extension may want to add their own tools to the list.

Lets say i have one default sorting function in my default extension.

```js
function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: {
        'studyBrowser.sortFunctions': [
          {
            label: 'Series Number',
            sortFunction: (a, b) => {
              return a?.SeriesNumber - b?.SeriesNumber;
            },
          },
        ],
      },
    },
  ];
}
```

This will result in having only series number as the default sorting function.

but now in another extension let's say dicom-seg extension we can add another sorting function.

```js
function getCustomizationModule() {
  return [
    {
      name: "dicom-seg-sorts",
      value: {
        "studyBrowser.sortFunctions": {
          $push: [
            {
              label: "Series Date",
              sortFunction: (a, b) => {
                return a?.SeriesDate - b?.SeriesDate;
              },
            },
          ],
        },
      },
    },
  ];
}
```

But since the module is not `default` it will not get applied, but in my segmentation mode i can do


```js
onModeEnter() {
  customizationService.setCustomizations([
    '@ohif/extension-cornerstone-dicom-seg.customizationModule.dicom-seg-sorts',
  ]);
}
```

needless to say if you opted to choose `name: default` in the `getCustomizationModule` it was applied globally.

## Customizable Parts of OHIF

Below we are providing the example configuration for global scenario (using the configuration file), however, you can also use the `setCustomizations` method to set the customizations.

{TableGenerator(customizations)}
