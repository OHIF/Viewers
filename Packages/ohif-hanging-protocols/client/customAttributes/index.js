// Define an empty object to store callbacks that are used to retrieve custom attributes
// The simplest example for a custom attribute is the Timepoint type (i.e. baseline or follow-up)
// used in the LesionTracker application.
//
// Timepoint type can be obtained given a studyId, and this is done through a custom callback.
// Developers can define attributes (i.e. attributeId = timepointType) with a name ('Timepoint Type')
// and a callback function that is used to calculate them.
//
// The input to the callback, which is called during viewport-image matching rule evaluation
// is the set of attributes that contains the specified attribute. In our example, timepointType is
// linked to the study attributes, and so the inputs to the callback is an object containing
// the study attributes.
HP.CustomAttributeRetrievalCallbacks = {};

/**
 * Adds a custom attribute to be used in the HangingProtocol UI and matching rules, including a
 * callback that will be used to calculate the attribute value.
 *
 * @param attributeId The ID used to refer to the attribute (e.g. 'timepointType')
 * @param attributeName The name of the attribute to be displayed (e.g. 'Timepoint Type')
 * @param callback The function used to calculate the attribute value from the other attributes at its level (e.g. study/series/image)
 */
HP.addCustomAttribute = (attributeId, attributeName, callback) => {
    HP.CustomAttributeRetrievalCallbacks[attributeId] = {
        name: attributeName,
        callback: callback
    };
};