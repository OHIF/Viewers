var valueRepresentationTypes = {
    number: [
        'SH',
        'LO'
    ]
};

/**
 * converts an WADO instance to a javascript object with the help of a data dictionary
 *
 * @param instance
 * @param options
 */
instanceDataToJsObject = function(instance, dictionary) {
    if (!instance) {
        throw 'instanceDataToJsObject: missing required parameter dataSet';
    }

    var result = {};

    // The comma is always inserted after the first four digits
    var position = 4;

    Object.keys(instance).forEach(function(tag) {
        var item = instance[tag];

        // Reformat the tag from 00020010 to "(0002,0010)" to suit the dictionary
        var tagFormatted = '(' + tag.substr(0, position) + ',' + tag.substr(position) + ')';

        // Retrieve the tag dictionary entry
        var tagDictionaryEntry = dictionary[tagFormatted];
        console.log(tagDictionaryEntry);

        // If there is no tag dictionary entry, or no name
        // for this tag, just use the original tag instead
        var tagName;
        if (!tagDictionaryEntry || !tagDictionaryEntry.name) {
            tagName = tag;
        } else {
            tagName = tagDictionaryEntry.name;
        }

        if (item.Value && item.Value.length > 1) {
            // handle sequences
            var sequenceItems = [];
            item.Value.forEach(function(instance) {
                sequenceItems.push(instanceDataToJsObject(instance, dictionary));
            });
            result[tagName] = sequenceItems;

        } else if (!item.Value || !item.Value.length) {
            // Handle empty arrays
            result[tagName] = undefined;

        } else {
            // Handle single valued cases
            if (item.vr === 'PN') {
                // Patient Name
                result[tagName] = DICOMWeb.getName(item);

            } else if (valueRepresentationTypes.number.indexOf(item.vr) > 0) {
                // Number type
                result[tagName] = DICOMWeb.getNumber(item);

            } else {
                // Everything else
                result[tagName] = DICOMWeb.getString(item);
            }
        }
    });
    console.log(result);
    return result;
};
