# Theme Configuration
When adding new theme extendible configuration items, please document
them here.  See [Theme Configuration with Config Point](#configPoint) on how to modify certain types of
configuration values using the config-point defintions.

## Hanging Protocols
It is possible to customize the available hanging protocols by defining them
in a new theme file OR by defining the hanging protocols in a custom mode.
If done correctly, the mode defined hanging protocols are automatically
applied when using a particular view mode, allowing for further customization
by theme files.

The default hanging protocols for the cornerstone mode is defined in
themeProtocolProvider.js,  in a configuration point named
`ThemeProtocols.protocols`  To define a new
hanging protocol, it is possible to simply extend the protocols list with
a new definition, for example, in the file mgHP.json5, the following definition
would add a new hanging protocol:
```js
{
  ThemeProtocols: {
    protocols: {
      MG:         {
        // This is a working HP, but isn't MG specific...
          id: 'MG',
          locked: true,
          hasUpdatedPriorsInformation: false,
          name: '1x2',
          createdDate: '2021-11-01T18:32:42.849Z',
          modifiedDate: '2021-11-01T18:32:42.849Z',
          availableTo: {},
          editableBy: {},
          protocolMatchingRules: [
            {
              id: 'NumberOfStudyRelatedSeries>1',
              weight: 10,
              attribute: 'NumberOfStudyRelatedSeries',
              constraint: {
                greaterThan: {
                  value: 1,
                },
              },
              required: true,
            },
          ],
          stages: [
            {
              name: 'OneByTwo',
              viewportStructure: {
                type: 'grid',
                properties: {
                  rows: 1,
                  columns: 2,
                },
              },
              viewport: {},
            },
          ],
          numberOfPriorsReferenced: 0,
        },
    },
  },
}
```
The MG protocol doesn't initially exist, so this would add a new hanging
protocol, which would be defined in the normal hanging protocol definition.

## Query List
One of the suggested areas for customization is the columns in the query table.
TODO

## Demographics Overlay
Another recommended change is to configure the demographics overlay using
themes to allow site or mode specific demographics overlays.
This should be done at several levels.  An overall level, defining the system
defaults, and then an overlay for each mode type, to allow mode specific information
to be added to the general model.  Note how that allows customizing at two
or more levels to specify only the required change (aspect oriented programming).

# <a name="configPoint" />Theme Configuration with Config Point
This section explains the syntax used for declaring various types of theme
configurations, as well as where to place theme files.

The configuration schema is based on the
[config-point](https://github.com/OHIF/config-point)
library.  This library is design to allow developers to create configuration
points for their code by declaring static values, which can be modified externally.
See [config-point-service](../platform/services/config-point-service.md) for
internal details and development documentation.

## Theme Files
Theme files are simple json5 definition files,
available from the endpoint `https://ohif/theme/`
for the site deployment.  How the files get there is the responsibility of the
site deployment.  JSON5 is an extension of JSON,
for which the primary addition here is the ability to use comments within the
JSON structure.  The attribute definition can also be an unquoted string when
it is a simple attribute value.

The default example themes are located in `Viewers/platform/viewer/public/theme/`,
for example, there is a theme there named 'theme.json5'.  These files are
automatically included in a default distribution.

Their content looks like a static object declaration in JavaScript, where
the object has one or more attributes declared.  The name of the attribute
matches the configuration point for the given configuration item.  For example:
```js
{
  // This extension modifies the ThemeProtocols
  // by adding a new hanging protocol for MG and modifying the existing
  // 2x2 layout to make it not preferred.
  ThemeProtocols: {
    // The original protocols declaration was a list,
    // doing this as an object matches by the id value specified here.
    // With no ID being found, creates a new entry.
    protocols: {
      // MG is just a referencable key, that matches the MG name here
      // In this case, it does not match any existing id, so it is net new.
      MG: {
        id: 'MG',
        // ... rest of definition of hanging protocol
      },
      // 2x2 is an existing hanging protocol, matching by id
      // Thus, it modifies values rather than replacing/updating it
      '2x2': {
        protocolMatchingRules: {
          // The actual change is weight:5 instead of weight:20, to make this
          // a non-preferred hanging protocol according to the HP definitions.
          'NumberOfStudyRelatedSeries>2': { weight: 5 },
        },
      }
    },
  },
}
```
that modifies the hanging protocols, both by adding and updating
elements.  Note how this is a deep modification to a value.  The intent is
to allow modifying configuration values which are heavily nested and/or list
based.

## Working with Objects
The object tree is matched by the simple attribute name.  The attribute tree
is then merged with the existing objects.  That is, suppose we have:
```js
// base object definition
baseObject: {
  value1: 5,
  value2: { subValue1: true, leftAlone: "value to be unchanged', },
}
```

then value1 and subValue1 can be changed by the following theme configuration:
```js
// ... base object extension:
baseObject: {
  value1: 7,
  value2: {subValue1: false, subValue2: 'new value', },
}
```
changing value1 to 7 and subValue1 to false, and adding subValue2.

This is the basic modification for all changes - match the path and replace one
or more left (primitive) values.

## Working with Arrays
Arrays in JSON and JSON5 only allow natural plus zero indices, and it isn't easy
to specify sparse array values or "next" values.  To address this, a base
array, declared exactly as a normal array value can be extended with an
object where the key of the object matches the extension value in some way.
For example, the base array:
```js
array: ['value1', {id: 'value2', ...}, 'value3']
// can be extended with the changes in an array, modifying only
// the array[1] and adding an array[3] element.
array: [null, {...extensions for value2},null,{id:'new array element'}]
// Or, this can be re-written as:
array: {
  'value1': 'new-string-for-value1',
  'value2': {...extensions for value2},
  'value4': {id:'new array element',...},
}
```

matches value1 by simple comparison, getting `array[0]` as the value to change.
Then matching 'value2' to `array[1]` by `array[1].id==='value2'` and finally not
matching any value with `id==='new array element'` so adding it to the end
(warning, adding to the end MAY be replaced by adding in the middle of the
array such that the id is between an id smaller than the new id and larger
than the new id, still TBD along with one or two other small enhancements).

## Custom Mappings (configOperation)
There are a number of default custom mappings available for config-point.
The general format is:
```js
valueName: {configOperation: 'opName', value?: 'default-value', reference?: 'named-reference',
   source?: 'name-of-config-point-for-reference', ...}
```
which defines an operation to perform instead of using the value literally.
The value provided can then be later extended/updated in the usual way, for
example:
```js
valueName: 'alternateStringValue for valueName',
```
would replace valueName that the config operation acts on.

### Immediate operations
Immediate operations perform the action immediately, and can thus be
extended further.  They support the additional keys:
* position to modify something at a given position

The immediate operations are:
* replace, insert, delete

For example, supposing there was a configuration point ModalityList, then
the following extensions could be applied:
```js
// Replace the entire list
ModalityList: {configOperation: 'replace', value: [
  'CT', 'MR', 'CR',
]}

// Replace an item at position 3
ModalityList: [ {configOperation: 'replace', position: 3, value: {id: 'MRI', description:'Magnetic resonance imaging'}}]

// Delete an item with value or id 'MR'
ModalityList: {
  'MR': {configOperation: 'delete'},

// Insert before the item with id 'MG'
ModalityList: {
  'MG': {configOperation: 'insert', value: 'MGTomo'},
```

### Getter Operations
Getter operations are performed at the time the attribute is accessed, and then
are stored.  These attributes typically have parameters:
* reference to get a value relative to the current context or the source value.
* source to get a value for reference from another ConfigPoint root
* value to get a literal, immediate value
* transform to modify the value(s)

The default getter operations are:
* sort to generate a sorted list
* reference to get another value from elsewhere
but the configurations below may also list new getter operations.

An example for sort might be:
```js
// Define a basic list:
list: ['CT', {id:'MR', name: 'Magnetic Resonance Imaging'}, 'CR']
// Declared to be sorted like this (can be done before/after the base declaration)
list: {configOperation: 'sort', sortKey: 'priority', usePositionAsSortKey: true},
// Then extended via:
list: {
  // Change the priority and add a name to the CT value
  // This makes it an object instead of a string
  'CT': {id:'CT', name:'Computed Tomography', priority: 3},
}
```

and and example for reference could be:
```js
// Base definition:
MGHangingProtocol: // ... full definition of MG HP here
// Reference to it
ThemeProtocols: {
  protocols: {
    MGHangingProtocol: {configOperation:reference, source:"MGHangingProtocol"},
  }
}

// Or, a bit of definition for a table element combining two values to render:
StudyInstancesColumn: {
  id: 'StudyInstancesColumn',
  title: '# of Series and Instances',
  value: {
    configOperation: 'reference',
    value: '`Se: ${study.NumberOfStudyRelatedSeries} Obj: ${study.NumberOfStudyRelatedInstances}`',
    transform: ${
      configOperation: "reference",
      source: 'ConfigPointOperation',
      reference: 'safeFunction'}
```
Note how in the last example, the transform itself contains a reference.  This
is a function that generates a javascript function taking props, where the
props are available directly.  Thus, this props would need `study` containing
the appropriate child objects.
