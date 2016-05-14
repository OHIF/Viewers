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
                var property = propertyArray.shift();
                var isArray = property.slice(-2) === '[]';
                var key = isArray ? property.slice(0, -2) : property;
                if (!propertyArray.length) {
                    currentObject[key] = value;
                } else {
                    if (!currentObject[key]) {
                        var dataStructure = isArray ? [] : {};
                        currentObject[key] = dataStructure;
                    }

                    currentObject = currentObject[key];
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
                    if (currentValue instanceof Array) {
                        currentKey += '[]';
                    }

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
