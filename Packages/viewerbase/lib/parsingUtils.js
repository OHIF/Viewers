
import {dicomParser} from 'meteor/cornerstone';

export const parsingUtils = {
    isValidDataSet: function(data) {
        return (data instanceof dicomParser.DataSet);
    },
    attributeTag: function(data, tag) {
        if (this.isValidDataSet(data) && tag in data.elements) {
            let element = data.elements[tag];
            if (element && element.length === 4) {
                let parser = data.byteArrayParser.readUint16,
                    bytes = data.byteArray,
                    offset = element.dataOffset;
                return 'x' + ('00000000' + (parser(bytes, offset) * 256 * 256 + parser(bytes, offset + 2)).toString(16)).substr(-8);
            }
        }
        return null;
    },
    multiValue: function(data, tag, parser) {
        if (this.isValidDataSet(data) && tag in data.elements) {
            let element = data.elements[tag];
            if (element && element.length > 0) {
                let string = dicomParser.readFixedString(data.byteArray, element.dataOffset, element.length);
                if (typeof string === 'string' && string.length > 0) {
                    if (typeof parser !== 'function') {
                        parser = null;
                    }
                    return string.split('\\').map(function(value) {
                        value = value.trim();
                        return parser !== null ? parser(value) : value;
                    });
                }
            }
        }
        return null;
    },
    floatArray: function(data, tag) {
        return this.multiValue(data, tag, parseFloat);
    }
};
