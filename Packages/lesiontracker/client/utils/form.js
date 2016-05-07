class Form {

    // Identify the element's type and get its value
    static getElementValue($element) {
        var type = $element.attr('type');
        var value;
        switch (type) {
            case 'checkbox':
                value = $element.is(':checked');
                break;
            default:
                value = $element.val();
        }
        return value;
    };

    // Identify the element's type and get its value
    static setElementValue($element, value) {
        if (!$element.length) {
            return;
        }

        var type = $element.attr('type');
        switch (type) {
            case 'checkbox':
                $element.prop('checked', !!value);
                break;
            default:
                $element.val(value);
        }
        $element.trigger('change');
    };

    // Transforms a shallow object with keys separated by "." into a nested object
    static getNestedObject(shallowObject) {
        var nestedObject = {};
        for (var key in shallowObject) {
            var value = shallowObject[key];
            var propertyArray = key.split('.');
            var currentObject = nestedObject;
            while (propertyArray.length) {
                var currentProperty = propertyArray.shift();
                if (!propertyArray.length) {
                    currentObject[currentProperty] = value;
                } else {
                    if (!currentObject[currentProperty]) {
                        currentObject[currentProperty] = {};
                    }

                    currentObject = currentObject[currentProperty];
                }
            }
        }

        return nestedObject;
    };

    // Transforms a nested object into a shallowObject merging its keys with "." character
    static getShallowObject(nestedObject) {
        var shallowObject = {};
        var putValues = function(baseKey, nestedObject, resultObject) {
            for (var key in nestedObject) {
                var currentKey = baseKey ? baseKey + '.' + key : key;
                var currentValue = nestedObject[key];
                if (typeof currentValue === 'object') {
                    putValues(currentKey, currentValue, resultObject);
                } else {
                    resultObject[currentKey] = currentValue;
                }
            }
        };

        putValues('', nestedObject, shallowObject);
        return shallowObject;
    }

    // Gets the nested data for the given form
    static getFormData($form) {
        var data = {};
        $form.find(':input[name]').each((index, element) => {
            var $element = $(element);
            var value = this.getElementValue($element);
            var name = $element.attr('name');
            data[name] = value;
        });
        return this.getNestedObject(data);
    }

    // Sets the nested data in the given form
    static setFormData($form, data) {
        var shallowData = this.getShallowObject(data);
        for (var key in shallowData) {
            var value = shallowData[key];
            var $element = $form.find(':input[name="' + key + '"]');
            this.setElementValue($element, value);
        }
    }

}

FormUtils = Form;
