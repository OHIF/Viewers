# Table of contents
In this document, some important objects are described. In the files there are comments that can help better undestand their methods and properties.
  - [ResizeViewportManager object](#the-resize-viewport-manager-object)
  - [ImageSet object](#the-image-set-object)
  - [Layout Manager](#the-layout-manager-object)
  - [Type Safe Collections](#the-type-safe-collections)

# The Resize Viewport Manager object
This object has multiple functions to manage window resize event. It relocates Dialogs, resizes viewport elements and scrollbars and some other UI components such as Study and Series Quick Switch, when available.

## Usage
It's only necessary to bind **handleResize** function to the window resize event as follows. The **ohif:viewerbase** package needs to be imported by the referring code as well.
```javascript
import { Viewerbase } from 'meteor/ohif:viewerbase';

const ResizeViewportManager = new Viewerbase.ResizeViewportManager();
window.addEventListener('resize', ResizeViewportManager.getResizeHandler());
```
An example os its usage can be found in **ohif-viewerbase/client/components/viewer/viewerMain/viewerMain.js**.

# The Image Set object
An object that represents a list of images that are associated by any arbitrary criteria being thus content agnostic. Besides the main attributes (**images** and **uid**) it allows additional attributes to be appended to it (currently indiscriminately, but this should be changed).

## Usage
ImageSet constructor requires an array of SOP instances like in the example below. It's necessary to import **ohif:viewerbase**.

```javascript
import { Viewerbase } from 'meteor/ohif:viewerbase';

const imageSet = new Viewerbase.ImageSet(sopInstances);

imageSet.setAttributes({
    displaySetInstanceUid: imageSet.uid,
    seriesInstanceUid: seriesData.seriesInstanceUid,
    seriesNumber: seriesData.seriesNumber,
    seriesDescription: seriesData.seriesDescription,
    numImageFrames: instances.length,
    frameRate: instance.getRawValue('x00181063'),
    modality: seriesData.modality,
    isMultiFrame: isMultiFrame(instance)
});

// Sort instances by InstanceNumber (0020,0013)
imageSet.sortBy((a, b) => {
    return (parseInt(a.getRawValue('x00200013', 0)) || 0) - (parseInt(b.getRawValue('x00200013', 0)) || 0);
});
```
Each SOP instance in this example is an instance of **OHIFInstanceMetadata** object, which is a specialization of **InstanceMetadata**. To read more about the **Metadata API** click [here](metadata/).

# The Layout Manager object
Objects of this class are responsible for creating, organizing and maintaining (manage) viewport rendering. It creates a grid, positioning viewports accordingly to it's configuration keeping all viewports data (in **viewportData** property) for easy access from other components. It support many layout configurations and some of them were fully tested: 1x1, 1x2, 1x3, 2x1, 2x2, 2x3, 3x1, 3x2, 3x3. Other configurations may work as well. 
Finally it provides some useful functions to move through viewports and zoom it.

## Usage
In order to use _LayoutManager_ the **ohif:viewerbase** package needs to be imported by the referring code and instantiated as follows. An example os its usage is in **ohif-viewerbase/client/components/viewer/viewerMain/viewerMain.js**.

```javascript
import { Viewerbase } from 'meteor/ohif:viewerbase';

// Get an array of studies object. This function needs to be implemented, it does not exist.
const studies = getArrayOfStudiesObjects();
const parentElement = document.getElementById('layoutManagerTarget');
const LayoutManager = new Viewerbase.LayoutManager(parentElement, studies);
```

The default configuration is 1x1, and to change it just set **layoutProps** and call **updateViewports** to update the layout as follows.

```javascript
import { Viewerbase } from 'meteor/ohif:viewerbase';

// Get an array of studies object. This function needs to be implemented, it does not exist.
const studies = getArrayOfStudiesObjects();
const parentElement = document.getElementById('layoutManagerTarget');
const LayoutManager = new LayoutManager(parentElement, studies);

// Set the layout proprerties to 2x2 layout
LayoutManager.layoutProps = {
    rows: 2,
    columns: 2
};

// It will render four viewports: two in each row.
LayoutManager.updateViewports();
```

The layoutManagerTarget element will have a new class **layout-2-2** (to allow further styling) and it's inner content will a new div#imageViewerViewports that has four inner elements like the following (some elements and attributes were removed for example purpose):
```html
<div class="viewportContainer active" style="height:50%; width:50%;">
    <div class="removable">
        <div class="imageViewerViewport">
            <canvas></canvas>
        </div>
        <div class="imageViewerViewportOverlay"></div>
        <div class="imageViewerLoadingIndicator"></div>
        <div class="imageViewerErrorLoadingIndicator"></div>
        <div class="viewportOrientationMarkers"></div>
    </div>
</div>
```

Each of this _div.viewportContainer_ will have some classes to help CSS specific styling accordingly to the element's position in the grid: **top**, **middle** and **bottom**. This classes are added by **viewer/components/gridLayout/** component in ohif-viewerbase package.

# The Type Safe Collections

With the introduction of the new _Study Metadata API_ in which study metadata is represented by class hierarchies (using prototype-based inheritance), the usage of standard _Minimongo_ collections as a central client-side storage for this data became no longer an option. Standard _Mongo_ and _Minimongo_ collections internally _flatten_ data (in other words, data gets serialized) before storage hence no functions or prototype chains are preserved. In that scenario, when an object is restored (fetched), what is returned is actually a flattened copy of the original object with no functions or prototype (it's no longer an instance of it's original class). As an attempt to overcome this limitation a new type of collection was intruduced: the *TypeSafeCollection*.

The `TypeSafeCollection` is a simple list-like collection which tries to implement an API _similar_ but not compatible with _Mongo_'s API. It supports basic features like search by attribute map and ID, retrieval by index, sorting of result sets, insertion, removal and reactive operations but, unlike _Mongo_'s API, it (still) lacks support to advanced functionality like complex search criterea or flexible sorting options.

## Implementation

The `TypeSafeCollection` is implemented on top of the _JavaScript_ `Array` object. Each element inserted in the collection is appended to the end of its internal array as a _key-value pair (KVP)_ object where the _key_ is a unique randomly generated ID string and the _value_ is the element itself. Once the object has been successfully stored, the generated ID (its ID) is returned to the client code and can later be used to access that specific element. At this point, an important difference to the _Minimongo_ API can be highlighted: a _TypeSafeCollection_ instance will never make any changes to the stored element (e.g., no "\_id" property will ever be assigned to the original object). Another relevant feature that is supported by this design decision is that _not only objects_ can be stored in this collections, but literally _anything_.

Inside the codebase, the _value_ attribute of each _KVP_ entry in the collection is refered to as _the **payload** of the entry_ since it's what really matters to the user. Hence, this term will also be used here to refer to the _value that has been stored in the collection_. That being said, we can approach another important feature of these collections: A single _payload_ cannot be stored more than once in a given collection. When an attempt of inserting a _payload_ which is already present in the collection is detected, the insert operation will fail and `null` will be returned. In that regard, the collection behaves like `Set` object not permitting a payload to be stored more than once. Strict equality is used when comparing payloads, thus cloned objects are not considered the same. This feature adds an additional garantee that a given study/series/instance will not be listed more than once (it was designed as a replacement for central study collections which were always checked for duplicates).

Please refer to the codebase for the full `TypeSafeCollection` API.

## Usage

In order to use the `TypeSafeCollection` class, the **ohif:viewerbase** package needs to be imported by the referring code and instantiated as follows:

```javascript
import { Viewerbase } from 'meteor/ohif:viewerbase'; // i.e., Viewerbase.TypeSafeCollection
OR
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase'; // i.e., OHIF.viewerbase.TypeSafeCollection
// The later is preferred when the client code already makes use of the "OHIF" namespace making the second
// "import" a garantee that the ".viewerbase" namespace has been properly loaded.
```

A few usage examples:

```javascript

const Users = new OHIF.viewerbase.TypeSafeCollection();

[[ ... ]]

// Insert a User object...
let userId = Users.insert({
    data: {
        firstName: 'John',
        lastName: 'Doe',
        age: 45
    },
    getFullName() {
        return `${this.data.firstName} ${this.data.lastName}`;
    },
    getAge() {
        return this.data.age;
    }
});

[[ ... ]]

let theUserWeJustStored = Users.findById(userId); // ;-)

[[ ... ]]

// Retrieve a single user with "Doe" as `lastName`...
let myUser = Users.findBy({ 'data.lastName': 'Doe' });
// Or all users with "Doe" as `lastName`, sorted by `firstName` in ascending
// order and using the `age` attribute to break ties in descending order...
let myUsers = Users.findAllBy({ 'data.lastName': 'Doe' }, {
    sort: [ [ 'data.firstName', 'asc' ], [ 'data.age', 'desc' ] ]
});

```
