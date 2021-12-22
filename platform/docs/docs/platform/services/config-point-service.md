# Config Point Service
The Config Point service is based on the external library
[config-point](https://github.com/OHIF/config-point).
It is a service that allows exposing internal "static" configuration data
for modification by sites at load time by defining "theme" files.  For
information on the configuration side of things, see [theme-configuration](../../configuration/theme-conffiguration.md).

The service isn't a traditional OHIF service avaialble in the services
deployment, but is rather a service which exposes static declarations of
data as configurable data.  For example, suppose a list of modalities
was required for the search constraints.  The core code might decide to
supply such a list by default, but sites may want to customize it to
only list the actual modalities they use.  Further, they might want to
change the name of some of these.  The core code could declare the modalities
list in a file like this:
```js
export default const { ModalitiesList } = ConfigPoint.register({
  ModalitiesList: [
    "CR",
    {id: "MR", description: "Magnetic Resonance Imaging"},
    {id: "CT", name: "Computed Tomography"},
  ]
})
```
The CR modality is just a plain name, whereas MR includes a description,
and CT includes an alternate name.  That list is used exactly as a straight
list for display, so the code needs to understand both simple strings and
the simple object definitions with id and/or name and description.

Now, a site might also happen to have an Ultrasound modality, so they would
want to extend the list.  They could then follow the instructions in the
theme-configuration area to add the "US" device.  One way of doing that is
by editing the `platform/viewer/public/theme/theme.json5` file, and adding
the following element to it:
```js
{
  ...
  ModalitiesList: {
    US: {id: 'US', name: 'Ultrasound'},
  },
}
```

The intent of the config point service is to expose a configuration point
that can be further modified.  The exposed point needs to be basically
a constant/static definition.  This may involve reworking some of the
code design to extract the configuration value from the dynamic code.  For
example, in the above modalities list, the original declaration is:
```js
    inputProps: {
      options: [
        { value: 'AR', label: 'AR' },
        { value: 'ASMT', label: 'ASMT' },
        ...
```
so the constant should be extracted to it's own file, but it is a fairly
simple list, so extracting it that way is fairly easy.  A more complex example
might be the columns displayed in the search page.  These are directly
referenced in the WorkList as bits of code that have both the configuration
and the ReactJs functionality.  To allow configuring this, the change would
need to extract what should be displayed into a config point, from the actual
rendering logic to render a table.

A table rendering component might be defined externally, something like:
```js
import {patientInfoFilter} from './filtersMeta.js';

export default const {WorkListColumns} = ConfigPoint.register({
  WorkListColumns: [
    { // This one has custom row and query rendering
      id: 'PatientInfo',
      rowRender: (props) => {... function to render a row },
      queryRender: patientInfoFilter,
    },
    { // This one defaults the row and query to fetching StudyDescription
      id: 'Description',
      rowData: 'StudyDescription',
    }
    ... rest of columns
  ],
})
```
Note how this version includes functions as static data, as well as
the basic data structure.  It would then need to be rendered by iterating
over the elements of the WorkListColumns.

Always the basic idea is that the code extracts a literal declaration of
data, defaulting to the base behaviour of the application, allowing it to
be exposed later to enhancements in a declarative fashion.  The remaining
sections below simply expand on the idea with some more advanced concepts.

## Automatic Sorting of Data
Sometimes, data needs to be sorted in the provided order.  The above
examples show how that can be done, but in other cases, it is desirable
to allow sorting the data, either with the initially provided sort order,
or with additional sort constraints. This can be done by adding a
configOperation to the literal value.  The operation is applied at the
time the value is first retrieved, and then is cached (unless the value is
further updated, in which case it is re-calculated).

In the WorkListColumns example, this would look like:
```js
WorkListColumns: {
  configOperation: 'sort',
  sortKey: 'priority',
  usePositionAsSortKey: true,
  value: [ ... definition above of original columns]
  },
```
This would sort the value in the original order it was defined in, and then
any news items would get sorted into position.

## Transform Data
It is possible that you want a transformation of the data.  For example,
there might be a simple declarative form for a value, but you want a custom
version to be used for display.  For example, setting default values for
missing attributes, or for turning a simple string into a full definition of
a name.  Here is a possible example:
```js
// Declared as part of the base configuration, which is always included
// first
configBase: {
  ModalitiesList: {
    configOperation: 'reference',
    transform: list => list.map(str => ({id:str, name:str, value:str})),
  },
},
// Then, for this example, the same name is referenced to assign the value,
ModalitiesList: ["CR", "CT"],
```
This type of transform needs to be declared in code because of the need
to reference a function, but allows for having a uniform format, but
including an easy declarative form.

## Reference Data
Sometimes you want to separate long declarations into their own configuration
item.  You can do this via the reference operation, for example:
```js
export default const { HangingProtocols } = ConfigPoint.register({
  MGHangingProtocol: {
    rightOnLeft: // Definition for MG Hanging Protocol right on left,
    leftOnLeft: // Definition for MG hanging protocol left on left
  },
  CRHangingProtocol: // Defn for CR hanging protocol
  ...
  HangingProtocols: {
    default: // Definition of default HP
    protocols: [
    // Reference the child element rightOnLeft of MGHangingProtocols
    {configOperation: 'reference', source: "MGHangingProtocols", reference: "rightOnLeft"},
    // Just reference the entire object CRHangingProtocol
    {configOperation: 'reference', source: 'CRHangingProtocol',},
    // Reference default within the current config point instance
    {configOperation: 'reference', reference: 'default',}
```

## Theme Load Timing
The theme values are intended to be constants for a given instance of OHIF.
However, because the actual theme files are loaded at startup time, if an initial
render is performed before all the theme files have been fully loaded, it may
be necessary to re-render after all the theme loads have completed.  There is
a listener service which can be used to listen for load events, and then to
re-render the display.  It works like:
```js
    if (!this._listenThemeProtocols) {
      this._listenThemeProtocols = this.listenThemeProtocols.bind(this);
    }
    ConfigPoint.addLoadListener(ThemeProtocols, this._listenThemeProtocols);
```

This is NOT intended for listening for programatic changes to the configuration,
but is intended only for load time updates.  Again, the idea is that the
configuration points are constants loaded from configuration files.

## Mode Changes to Configuration Point
If the config points are "constants", then one might ask how different modes
can end up apply different configuration values.  The answer to that is to
add a new configuration point specific to that mode, and to change the referenced
name of which configuration gets used.  For example, suppose a "Mammo Mode" wanted
to specify a bunch of customizations to configuration such as the set of
hanging protocols to apply.  One way to do that is to have the mode specify
the name of the configuration, and then to use the initial/default configuration
as a base, and extend it, something like this:
```js
const {MGHangingProtocols} = ConfigPoint.register({
  MGHangingProtocols: {
    // The config base says to START with the value from the named
    // config point as the base values.
    configBase: 'HangingProtocols',
    // Now, just extend the protocols list with the mg protocols.
    protocols: {
      mgProtocol1: ...
      mgProtocol2: ...
    }

```

As an alternative to extending the protocols, they can be replaced via:
```js
protocols: {
  configOperation: 'replace',
  value: [
    // mgProtocol1,
    // mgProtocol2
  ]
}
```
The replace operation is an immediate operation, and allows the protocols
list to be extended in the normal fashion.

The MGHangingProtocols value would then just be set as the mode hanging
protocols object, and it would then be used directly.  It could also have
been set by name instead of value, depending on the desired context.

The site can then extend the MGHangingProtocols in the usual way, by creating
custom theme files.

# Concluding Remarks
Use the configuration point service to extract things that might need to be
configured by some sites by extracting the data into a constant declaration,
and then register it with config point to expose it.  Then, document
your configuration points in the [theme-configuration](../../configuration/theme-configuration.md)
guide.  That will allow sites to make declarative configuration changes to
the values.
