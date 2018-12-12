import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const LocationSchema = new SimpleSchema({
    id: {
        type: String,
        label: 'Location ID'
    },
    location: {
        type: String,
        label: 'Location Name'
    },
    selected: {
        type: Boolean,
        label: 'Selected',
        defaultValue: false
    },
    isNodal: {
        type: Boolean,
        label: 'Nodal Location',
        defaultValue: false
    }
});

LesionLocations = new Meteor.Collection(null);
LesionLocations.attachSchema(LocationSchema);
LesionLocations._debugName = 'LesionLocations';

var organGroups = [
    'Abdominal/Chest Wall',
    'Adrenal',
    'Bladder',
    'Bone',
    'Brain',
    'Breast',
    'Colon',
    'Esophagus',
    'Extremities',
    'Gallbladder',
    'Kidney',
    'Liver',
    'Lung',
    'Lymph Node',
    'Mediastinum/Hilum',
    'Muscle',
    'Neck',
    'Other: Soft Tissue',
    'Ovary',
    'Pancreas',
    'Pelvis',
    'Peritoneum/Omentum',
    'Prostate',
    'Retroperitoneum',
    'Small Bowel',
    'Spleen',
    'Stomach',
    'Subcutaneous'];

function nameToID(name) {
    // http://stackoverflow.com/questions/29258016/remove-special-symbols-and-extra-spaces-and-make-it-camel-case-javascript
    return name
        .trim() //might need polyfill if you need to support older browsers
        .toLowerCase() //lower case everything
        .replace(/([^A-Z0-9]+)(.)/ig, //match multiple non-letter/numbers followed by any character
            function(match) {
                return arguments[2].toUpperCase(); //3rd index is the character we need to transform uppercase
            }
        );
}

organGroups.forEach(function(organGroup) {
    const id = nameToID(organGroup);

    // Check if the name has 'node' in it, if so, it is nodal
    let isNodal = false;
    if (id.toLowerCase().indexOf('node') > -1) {
        isNodal = true;
    }

    LesionLocations.insert({
        id: id,
        location: organGroup,
        selected: false,
        isNodal: isNodal
    });
});

export { LesionLocations };
