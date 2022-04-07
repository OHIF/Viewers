# Study Metadata Module

This module defines the API/Data-Model by which OHIF Viewerbase package and
possibly distinct viewer implementations can access studies metadata. This
module does not attempt to define any means of _loading_ study metadata from any
data end-point but only how the data that has been previously loaded into the
application context will be accessed by any of the routines or algorithm
implementations that need the data.

## Intro

For various reasons like sorting, grouping or simply rendering study
information, OHIF Viewerbase package and applications depending on it usually
have the need to access study metadata. Before the current initiative there was
no uniform way of achieving that since each implementation provides study
metadata on its own specific ways. The application and the package itself needed
to have a deep knowledge of the data structures provided by the data endpoint to
perform any of the operations mentioned above, meaning that any data access code
needed to be adapted or rewritten.

The intent of the current module is to provide a fairly consistent and flexible
API/Data-Model by which OHIF Viewerbase package (and different viewer
implementations that depend on it) can manipulate DICOM matadata retrieved from
distinct data end points (e.g., a proprietary back end servers) in uniform ways
with minor to no modifications needed.

## Implementation

The current API implementation defines three classes of objects:
`StudyMetadata`, `SeriesMetadata` and `InstanceMetadata`. Inside OHIF Viewerbase
package, every access to Study, Series or SOP Instance metadata is achieved by
the interface exposed by these three classes. By inheriting from them and
overriding or extending their methods, different applications with different
data models can adapt even the most peculiar data structures to the uniform
interface defined by those classes. Together these classes define a flexible and
extensible data manipulation layer leaving routines and algorithms that depend
on that data untouched.

## Design Decisions & "_Protected_" Members

In order to provide for good programming practices, attributes and methods meant
to be used exclusively by the classes themselves (for internal purposes only)
were written with an initial '\_' character, being thus treated as "_protected_"
members. The idea behind this practice was never to hide them from the
programmers (what makes debugging tasks painful) but only advise for something
that's not part of the official public API and thus should not be relied on.
Usage of "protected" members makes the code less readable and prone to
compatibility issues.

As an example, the initial implementation of the `StudyMetadata` class defined
the attribute `_studyInstanceUID` and the method `getStudyInstanceUID`. This
implies that whenever the _StudyInstanceUID_ of a given study needs to be
retrieved the `getStudyInstanceUID` method should be called instead of directly
accessing the attribute `_studyInstanceUID` (which might not even be populated
since `getStudyInstanceUID` can be possiblity overriden by a subclass to satisfy
specific implementation needs, leaving the attribute `_studyInstanceUID`
unused).

Ex:

```javascript
let studyUID = myStudy.getStudyInstanceUID(); // GOOD! :-)
[ ... ]
let otherStudyUID = anotherStudy._studyInstanceUID; // BAD... :-(
```

Another important topic is the preference of _methods_ over _attributes_ on the
public API. This design decision was made to ensure extensibility and
flexibility (methods are extensible while standalone attributes are not, and can
be adapted – through overrides, for example – to support even the most peculiar
data models) even though the overhead a few additional function calls may incur.

## Abstract Classes

Some classes defined in this module are "_abstract_" classes (even though
JavaScript does not _officially_ support such programming facility). They are
_abstract_ in the sense that a few methods (very important ones, by the way)
were left "_blank_" (unimplemented, or more precisely implemented as empty NOP
functions) in order to be implemented by specialized subclasses. Methods
believed to be more generic were implemented in an attempt to satify most
implementation needs but nothing prevents a subclass from overriding them as
well (again, flexibility and extensibility are design goals). Most implemented
methods rely on the implementation of an unimplemented method. For example, the
method `getStringValue` from `InstanceMetadata` class, which has indeed been
implemented and is meant to retrieve a metadata value as a string, internally
calls the `getTagValue` method which _was NOT implemented_ and is meant to query
the internal data structures for the requested metadata value and return it _as
is_. Used in that way, an application would not benefit much from the already
implemented methods. On the other hand, by simply overriding the `getTagValue`
method on a specialized class to deal with the intrinsics of its internal data
structures, this very application would now benefit from all already implemented
methods.

The following code snippet tries to illustrate the idea:

```javascript

// -- InstanceMetadata.js

class InstanceMetadata {
    [ ... ]
    getTagValue(tagOrProperty, defaultValue) {
        // Please implement this method in a specialized subclass...
    }
    [ ... ]
    getStringValue(tagOrProperty, index, defaultValue) {
        let rawValue = this.getTagValue(tagOrProperty, '');
        // parse the returned value into a string...
        [ ... ]
        return stringValue;
    }
    [ ... ]
}

// -- MyFancyAppInstanceMetadata.js

class MyFancyAppInstanceMetadata extends InstanceMetadata {
    // Overriding this method will make all methods implemented in the super class
    // that rely on it to be immediately available...
    getTagValue(tagOrProperty, defaultValue) {
        let tagValue;
        // retrieve raw value from internal data structures...
        [ ... ]
        return tagValue;
    }
}

// -- main.js

[ ... ]
let sopInstaceMetadata = new MyFancyAppInstanceMetadata(myInternalData);
if (sopInstaceMetadata instanceof MyFancyAppInstanceMetadata) { // true
    // this code will be executed...
}
if (sopInstaceMetadata instanceof InstanceMetadata) { // also true
    // this code will also be executed...
}
// The following will also work since the internal "getTagValue" call inside
// "getStringValue" method will now be satisfied... (thanks to the override)
let PatientName = sopInstaceMetadata.getStringValue('PatientName', '');
[ ... ]

```

_Copyright &copy; 2016 nucleushealth&trade;. All rights reserved_
