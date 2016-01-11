/**
 * converts an implicit dataSet to a javascript object with the help of a data dictionary
 *
 * @param dataSet
 * @param options
 */
dataSetToJsWithDictionary = function(dataSet, dictionary, options) {
    if (!dataSet) {
        throw 'dataSetToJsWithDictionary: missing required parameter dataSet';
    }

    options = options || {
        omitPrivateAttibutes: true, // true if private elements should be omitted
        maxElementLength: 128 // maximum element length to try and convert to string format
    };

    // For the purpose of inserting a comma into the tag in order
    // to search the dictionary, store a position value
    var position = 3;

    var result = {};

    for (var tag in dataSet.elements) {
        var element = dataSet.elements[tag];

        // Reformat the tag from x00020010 to "0002,0010" to suit the dictionary
        var tagFormatted = tagFormatted.substr(1, position) + ',' + tagFormatted.substr(position);

        // Retrieve the tag dictionary entry
        var tagDictionaryEntry = dictionary[tagFormatted];

        // If there is no tag dictionary entry, or no name
        // for this tag, just use the original tag instead
        var tagName;
        if (!tagDictionaryEntry || !tagDictionaryEntry.name) {
            tagName = tag;
        } else {
            tagName = tagDictionaryEntry.name;
        }

        // Set the element VR from the dictionary, if necessary and possible
        if (!element.vr && tagDictionaryEntry && tagDictionaryEntry.vr) {
            element.vr = tagDictionaryEntry.vr;
        }

        // skip this element if it a private element and our options specify that we should
        if (options.omitPrivateAttibutes === true && dicomParser.isPrivateTag(tag)) {
            continue;
        }

        if (element.items) {
            // handle sequences
            var sequenceItems = [];
            for (var i = 0; i < element.items.length; i++) {
                sequenceItems.push(dicomParser.dataSetToJsWithDictionary(element.items[i].dataSet, dictionary, options));
            }

            result[tagName] = sequenceItems;
        } else {
            var asString;

            if (element.length < options.maxElementLength) {
                asString = dicomParser.explicitElementToString(dataSet, element);
            }

            if (asString !== undefined) {
                result[tagName] = asString;
            } else {
                result[tagName] = {
                    dataOffset: element.dataOffset,
                    length: element.length
                };
            }
        }
    }

    return result;
};
