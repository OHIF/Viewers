function paddingLeft(paddingValue, string) {
    return String(paddingValue + string).slice(-paddingValue.length);
}

function rtrim(str) {
    return str.replace(/\s*$/g, '');
}

function ltrim(str) {
    return str.replace(/^\s*/g, '');
}

function fieldsLength(fields) {
    var length = 0;
    fields.forEach(function(field) {
        length += field.length();
    });
    return length;
}

Tag = function(value) {
    this.value = value;
};

Tag.prototype.toString = function() {
    return '(' + paddingLeft('0000', this.group().toString(16)) + ',' + 
           paddingLeft('0000', this.element().toString(16)) + ')';
};

Tag.prototype.is = function(t) {
    return this.value === t;
};

Tag.prototype.group = function() {
    return this.value >>> 16;
};

Tag.prototype.element = function() {
    return this.value & 0xffff;
};

Tag.prototype.isPixelDataTag = function() {
    return this.is(0x7fe00010);
}

tagFromNumbers = function(group, element) {
    return new Tag(((group << 16) | element) >>> 0);
};

function readTag(stream) {
    var group = stream.read(C.TYPE_UINT16), 
        element = stream.read(C.TYPE_UINT16);

    return tagFromNumbers(group, element);
}

parseElements = function(stream, syntax) {
    var pairs = {};
    stream.reset();
    while (!stream.end()) {
        var elem = new DataElement();
        elem.setSyntax(syntax);
        elem.readBytes(stream);
        pairs[elem.tag.value] = elem;
    }

    return pairs;
};

ValueRepresentation = function(type) {
    this.type = type;
    this.multi = false;  
};

ValueRepresentation.prototype.read = function(stream, length, syntax) {
    if (this.fixed && this.maxLength) {
        if (!length) {
            return this.defaultValue;
        }

        if (this.maxLength !== length) {
            console.log('Invalid length for fixed length tag, vr ' + this.type + ', length ' + this.maxLength + ' !== ' + length);
        }
    }

    return this.readBytes(stream, length, syntax);
};

ValueRepresentation.prototype.readBytes = function(stream, length) {
    return stream.read(C.TYPE_ASCII, length);
};

ValueRepresentation.prototype.readNullPaddedString = function(stream, length) {
    if (!length) {
        return '';
    }

    var str = stream.read(C.TYPE_ASCII, length - 1);
    if (stream.read(C.TYPE_UINT8) !== 0) {
        stream.increment(-1);
        str += stream.read(C.TYPE_ASCII, 1);
    }    

    return str;
};

ValueRepresentation.prototype.getFields = function(fields) {
    var valid = true;
    if (this.checkLength) {
        valid = this.checkLength(fields);
    } else if (this.maxCharLength) {
        var check = this.maxCharLength,
     length = 0;
        fields.forEach(function(field) {
            if (typeof field.value === 'string')
              length += field.value.length;
        });
        valid = length <= check; 
    } else if (this.maxLength) {
        var check = this.maxLength,
     length = fieldsLength(fields);
        valid = length <= check;
    }

    if (!valid) {
        throw 'Value exceeds max length';
    }

    //check for odd
    var length = fieldsLength(fields);
    if (length & 1) {
        fields.push(new HexField(this.padByte));
    }

    for (var i = 0;i < fields.length;i++) {
        if (fields[i].isNumeric() && (fields[i].value === '' || fields[i].value === null)) {
            fields[i] = new StringField('');
        }
    }

    return fields;
};

ApplicationEntity = function() {
    ValueRepresentation.call(this, 'AE');
    this.maxLength = 16;
    this.padByte = '20';
};

util.inherits(ApplicationEntity, ValueRepresentation);

ApplicationEntity.prototype.readBytes = function(stream, length) {
    return stream.read(C.TYPE_ASCII, length).trim();
};  

ApplicationEntity.prototype.getFields = function(value) {
    return ApplicationEntity.super_.prototype.getFields.call(this, [new FilledField(value, 16)]);
};

CodeString = function() {
    ValueRepresentation.call(this, 'CS');
    this.maxLength = 16;
    this.padByte = '20'; 
};

util.inherits(CodeString, ValueRepresentation);

CodeString.prototype.readBytes = function(stream, length) {
    var str = this.readNullPaddedString(stream, length);
    return str.trim();    
};

CodeString.prototype.getFields = function(value) {
    return CodeString.super_.prototype.getFields.call(this, [new StringField(value)]);
};

AgeString = function() {
    ValueRepresentation.call(this, 'AS');
    this.maxLength = 4;
    this.padByte = '20';
    this.fixed = true;
    this.defaultValue = '';
};

util.inherits(AgeString, ValueRepresentation);

AgeString.prototype.getFields = function(value) {
    var str = '';
    if (value) {
        if (value.days) {
            str = paddingLeft('000' + value.days) + 'D';
        } else if (value.weeks) {
            str = paddingLeft('000' + value.weeks) + 'W';
        } else if (value.months) {
            str = paddingLeft('000' + value.months) + 'M';
        } else if (value.years) {
            str = paddingLeft('000' + value.years) + 'Y';
        } else {
            throw 'Invalid age string';
        }    
    }

    return AgeString.super_.prototype.getFields.call(this, [new StringField(str)]);
};

AttributeTag = function() {
    ValueRepresentation.call(this, 'AT');
    this.maxLength = 4;
    this.padByte = '00';
    this.fixed = true;
};

util.inherits(AttributeTag, ValueRepresentation);

AttributeTag.prototype.readBytes = function(stream, length) {
    var group = stream.read(C.TYPE_UINT16),
    element = stream.read(C.TYPE_UINT16);
    return tagFromNumbers(group, element);
};

AttributeTag.prototype.getFields = function(value) {
    if (!value)
        return AttributeTag.super_.prototype.getFields.call(this, [new StringField("")]);

    return AttributeTag.super_.prototype.getFields.call(this, [new UInt16Field(value.group()), new UInt16Field(value.element())]);
};

DateValue = function() {
    ValueRepresentation.call(this, 'DA');
    this.maxLength = 8;
    this.padByte = '20';
    this.fixed = true;
    this.defaultValue = '';
};

util.inherits(DateValue, ValueRepresentation);

DateValue.prototype.readBytes = function(stream, length) {
    var datestr = stream.read(C.TYPE_ASCII, length);

    var year = parseInt(datestr.substring(0, 4)), 
        month = parseInt(datestr.substring(4, 6)), 
        day = parseInt(datestr.substring(6, 8));

    return datestr;//new Date(year, month, day);
};

DateValue.prototype.getFields = function(date) {
    var str = null;
    if (typeof date === 'object') {
        var year = date.getFullYear(),
     month = paddingLeft('00', date.getMonth()),
     day = paddingLeft('00', date.getDate());
        str = year + month + day;
    } else if (date && date.length > 0) {
        this.maxLength = 18;
        this.fixed = false;
        str = date;
    } else {
        str = '';
    }

    return DateValue.super_.prototype.getFields.call(this, [new StringField(str)]);
};

DecimalString = function() {
    ValueRepresentation.call(this, 'DS');
    this.maxLength = 16;
    this.padByte = '20';
};

util.inherits(DecimalString, ValueRepresentation);

DecimalString.prototype.readBytes = function(stream, length) {
    var str = this.readNullPaddedString(stream, length);
    return str.trim();
};

DecimalString.prototype.getFields = function(value) {
    var f = parseFloat(value);
    return DecimalString.super_.prototype.getFields.call(this, [new StringField(isNaN(f) ? '' : f.toExponential())]);
};

DateTime = function() {
    ValueRepresentation.call(this, 'DT');
    this.maxLength = 26;
    this.padByte = '20';
};

util.inherits(DateTime, ValueRepresentation);

DateTime.prototype.getFields = function(value) {
    if (!value)
        return DateTime.super_.prototype.getFields.call(this, [new StringField("")]);

    var year = value.getUTCFullYear(),
        month = paddingLeft('00', value.getUTCMonth()),
        day = paddingLeft('00', value.getUTCDate()),
        hour = paddingLeft('00', value.getUTCHours()),
        minute = paddingLeft('00', value.getUTCMinutes()),
        second = paddingLeft('00', value.getUTCSeconds()),
        millisecond = paddingLeft('000', value.getUTCMilliseconds());

    return DateTime.super_.prototype.getFields.call(this, [new StringField(year + month + day + hour + minute + second + '.' + millisecond + '+0000')]);
};

FloatingPointSingle = function() {
    ValueRepresentation.call(this, 'FL');
    this.maxLength = 4;
    this.padByte = '00';
    this.fixed = true;
    this.defaultValue = 0.0;
};

util.inherits(FloatingPointSingle, ValueRepresentation);

FloatingPointSingle.prototype.readBytes = function(stream, length) {
    return stream.read(C.TYPE_FLOAT);
};

FloatingPointSingle.prototype.getFields = function(value) {
    return FloatingPointSingle.super_.prototype.getFields.call(this, [new FloatField(value)]);
};

FloatingPointDouble = function() {
    ValueRepresentation.call(this, 'FD');
    this.maxLength = 8;
    this.padByte = '00';
    this.fixed = true;
    this.defaultValue = 0.0;
};

util.inherits(FloatingPointDouble, ValueRepresentation);

FloatingPointDouble.prototype.readBytes = function(stream, length) {
    return stream.read(C.TYPE_DOUBLE);
};  

FloatingPointDouble.prototype.getFields = function(value) {
    return FloatingPointDouble.super_.prototype.getFields.call(this, [new DoubleField(value)]);
};

IntegerString = function() {
    ValueRepresentation.call(this, 'IS');
    this.maxLength = 12;
    this.padByte = '20';
};

util.inherits(IntegerString, ValueRepresentation);

IntegerString.prototype.readBytes = function(stream, length) {
    var str = this.readNullPaddedString(stream, length);
    return str.trim();
};

IntegerString.prototype.getFields = function(value) {
    return IntegerString.super_.prototype.getFields.call(this, [new StringField(value.toString())]);
};

LongString = function() {
    ValueRepresentation.call(this, 'LO');
    this.maxCharLength = 64;
    this.padByte = '20';
};

util.inherits(LongString, ValueRepresentation);

LongString.prototype.readBytes = function(stream, length) {
    var str = this.readNullPaddedString(stream, length);
    return str.trim();
};  

LongString.prototype.getFields = function(value) {
    return LongString.super_.prototype.getFields.call(this, [new StringField(value ? value : '')]);
};

LongText = function() {
    ValueRepresentation.call(this, 'LT');
    this.maxCharLength = 10240;
    this.padByte = '20';
};

util.inherits(LongText, ValueRepresentation);

LongText.prototype.readBytes = function(stream, length) {
    var str = this.readNullPaddedString(stream, length);
    return rtrim(str);
};  

LongText.prototype.getFields = function(value) {
    return LongText.super_.prototype.getFields.call(this, [new StringField(value)]);
};

PersonName = function() {
    ValueRepresentation.call(this, 'PN');
    this.maxLength = null;
    this.padByte = '20';
};

util.inherits(PersonName, ValueRepresentation);

PersonName.prototype.checkLength = function(field) {
    var cmps = field[0].value.split(/\^/);
    for (var i in cmps) {
        var cmp = cmps[i];
        if (cmp.length > 64) return false;
    }

    return true;
};

PersonName.prototype.readBytes = function(stream, length) {
    var str = this.readNullPaddedString(stream, length);
    return rtrim(str);
};

PersonName.prototype.getFields = function(value) {
    var str = null;
    if (typeof value === 'string') {
        str = value;
    } else if (value) {
        var fName = value.family || '',
     gName = value.given || '', 
            middle = value.middle || '',
     prefix = value.prefix || '',
     suffix = value.suffix || '';

        str = [fName, gName, middle, prefix, suffix].join('^');      
    } else str = '';

    return PersonName.super_.prototype.getFields.call(this, [new StringField(str)]);
};

ShortString = function() {
    ValueRepresentation.call(this, 'SH');
    this.maxCharLength = 16;
    this.padByte = '20';
};

util.inherits(ShortString, ValueRepresentation);

ShortString.prototype.readBytes = function(stream, length) {
    var str = this.readNullPaddedString(stream, length);
    return str.trim();
};  

ShortString.prototype.getFields = function(value) {
    return ShortString.super_.prototype.getFields.call(this, [new StringField(value)]);
};

SignedLong = function() {
    ValueRepresentation.call(this, 'SL');
    this.maxLength = 4;
    this.padByte = '00';
    this.fixed = true;
    this.defaultValue = 0;
};

util.inherits(SignedLong, ValueRepresentation);

SignedLong.prototype.readBytes = function(stream, length) {
    return stream.read(C.TYPE_INT32);
};

SignedLong.prototype.getFields = function(value) {
    return SignedLong.super_.prototype.getFields.call(this, [new Int32Field(value)]);
};

SequenceOfItems = function() {
    ValueRepresentation.call(this, 'SQ');
    this.maxLength = null;
    this.padByte = '00';
};

util.inherits(SequenceOfItems, ValueRepresentation);

SequenceOfItems.prototype.readBytes = function(stream, sqlength, syntax) {
    if (sqlength === 0x0) {
        return []; //contains no dataset
    } else {
        var undefLength = sqlength === 0xffffffff,
     elements = [],
     read = 0;

        while (true) {
            var tag = readTag(stream),
       length = null;
            read += 4;

            if (tag.is(0xfffee0dd)) {
                stream.read(C.TYPE_UINT32);
                break;
            } else if (!undefLength && (read === sqlength)) {
                break;
            } else if (tag.is(0xfffee000)) {
                length = stream.read(C.TYPE_UINT32);
                read += 4;
                var itemStream = null,
         toRead = 0,
         undef = length === 0xffffffff;

                if (undef) {
                    var stack = 0;
                    while (1) {
                        var g = stream.read(C.TYPE_UINT16);
                        if (g === 0xfffe) {
                            var ge = stream.read(C.TYPE_UINT16);
                            if (ge === 0xe00d) {
                                stack--;
                                if (stack < 0) {
                                    stream.increment(4);
                                    read += 8;
                                    break;
                                } else {
                                    toRead += 4;
                                }
                            } else if (ge === 0xe000) {
                                stack++;
                                toRead += 4;
                            } else {
                                toRead += 2;
                                stream.increment(-2);
                            }
                        } else {
                            toRead += 2;
                        }
                    }
                } else {
                    toRead = length;
                }

                if (toRead) {
                    stream.increment(undef ? (-toRead - 8) : 0);
                    itemStream = stream.more(toRead);//parseElements
                    read += toRead;
                    if (undef)
                      stream.increment(8);

                    elements.push(parseElements(itemStream, syntax));
                }

                if (!undefLength && (read === sqlength)) {
                    break;
                }
            }
        }

        return elements;
    }
};

SequenceOfItems.prototype.getFields = function(value, syntax) {
    var fields = [];
    if (value) {
        value.forEach(function(message) {
            fields.push(new UInt16Field(0xfffe));
            fields.push(new UInt16Field(0xe000));
            fields.push(new UInt32Field(0xffffffff));

            message.forEach(function(element) {
                element.setSyntax(syntax);
                fields = fields.concat(element.getFields());
            });

            fields.push(new UInt16Field(0xfffe));
            fields.push(new UInt16Field(0xe00d));
            fields.push(new UInt32Field(0x00000000));
        });    
    }

    fields.push(new UInt16Field(0xfffe));
    fields.push(new UInt16Field(0xe0dd));
    fields.push(new UInt32Field(0x00000000));    

    return SequenceOfItems.super_.prototype.getFields.call(this, fields);
};

SignedShort = function() {
    ValueRepresentation.call(this, 'SS');
    this.maxLength = 2;
    this.padByte = '00';
    this.fixed = true;
    this.defaultValue = 0;
};

util.inherits(SignedShort, ValueRepresentation);

SignedShort.prototype.readBytes = function(stream, length) {
    return stream.read(C.TYPE_INT16);
};

SignedShort.prototype.getFields = function(value) {
    return SignedShort.super_.prototype.getFields.call(this, [new Int16Field(value)]);
};

ShortText = function() {
    ValueRepresentation.call(this, 'ST');
    this.maxCharLength = 1024;
    this.padByte = '20';
};

util.inherits(ShortText, ValueRepresentation);

ShortText.prototype.readBytes = function(stream, length) {
    var str = this.readNullPaddedString(stream, length);
    return rtrim(str);
};

ShortText.prototype.getFields = function(value) {
    return ShortText.super_.prototype.getFields.call(this, [new StringField(value)]);
};

TimeValue = function() {
    ValueRepresentation.call(this, 'TM');
    this.maxLength = 14;
    this.padByte = '20';
};

util.inherits(TimeValue, ValueRepresentation);

TimeValue.prototype.readBytes = function(stream, length) {
    return rtrim(stream.read(C.TYPE_ASCII, length));
};  

TimeValue.prototype.getFields = function(date) {
    var dateStr = '';
    if (date) {
        var hour = paddingLeft('00', date.getHours()),
            minute = paddingLeft('00', date.getMinutes()),
     second = paddingLeft('00', date.getSeconds()),
            millisecond = paddingLeft('000', date.getMilliseconds());    
        dateStr = hour + minute + second + '.' + millisecond;
    }

    return TimeValue.super_.prototype.getFields.call(this, [new StringField(dateStr)]);
};

UnlimitedCharacters = function() {
    ValueRepresentation.call(this, 'UC');
    this.maxLength = null;
    this.multi = true;
    this.padByte = '20';
};

util.inherits(UnlimitedCharacters, ValueRepresentation);

UnlimitedCharacters.prototype.readBytes = function(stream, length) {
    return rtrim(stream.read(C.TYPE_ASCII, length));
};  

UnlimitedCharacters.prototype.getFields = function(value) {
    return UnlimitedCharacters.super_.prototype.getFields.call(this, [new StringField(value)]);
};

UnlimitedText = function() {
    ValueRepresentation.call(this, 'UT');
    this.maxLength = null;
    this.padByte = '20';
};

util.inherits(UnlimitedText, ValueRepresentation);

UnlimitedText.prototype.readBytes = function(stream, length) {
    return this.readNullPaddedString(stream, length);
};  

UnlimitedText.prototype.getFields = function(value) {
    return UnlimitedText.super_.prototype.getFields.call(this, [new StringField(value)]);
};

UnsignedShort = function() {
    ValueRepresentation.call(this, 'US');
    this.maxLength = 2;
    this.padByte = '00';
    this.fixed = true;
    this.defaultValue = 0;
};

util.inherits(UnsignedShort, ValueRepresentation);

UnsignedShort.prototype.readBytes = function(stream, length) {
    return stream.read(C.TYPE_UINT16);
};

UnsignedShort.prototype.getFields = function(value) {
    return UnsignedShort.super_.prototype.getFields.call(this, [new UInt16Field(value)]);
};

UnsignedLong = function() {
    ValueRepresentation.call(this, 'UL');
    this.maxLength = 4;
    this.padByte = '00';
    this.fixed = true;
    this.defaultValue = 0;
};

util.inherits(UnsignedLong, ValueRepresentation);

UnsignedLong.prototype.readBytes = function(stream, length) {
    return stream.read(C.TYPE_UINT32);
};  

UnsignedLong.prototype.getFields = function(value) {
    return UnsignedLong.super_.prototype.getFields.call(this, [new UInt32Field(value)]);
};

UniqueIdentifier = function() {
    ValueRepresentation.call(this, 'UI');
    this.maxLength = 64;
    this.padByte = '00';
};

util.inherits(UniqueIdentifier, ValueRepresentation);

UniqueIdentifier.prototype.readBytes = function(stream, length) {
    return this.readNullPaddedString(stream, length);
};   

UniqueIdentifier.prototype.getFields = function(value) {
    return UniqueIdentifier.super_.prototype.getFields.call(this, [new StringField(value)]);
};

UniversalResource = function() {
    ValueRepresentation.call(this, 'UR');
    this.maxLength = null;
    this.padByte = '20';
};

util.inherits(UniversalResource, ValueRepresentation);

UniversalResource.prototype.readBytes = function(stream, length) {
    return rtrim(stream.read(C.TYPE_ASCII, length));
};

UniversalResource.prototype.getFields = function(value) {
    return UniversalResource.super_.prototype.getFields.call(this, [new StringField(value)]);
};

UnknownValue = function() {
    ValueRepresentation.call(this, 'UN');
    this.maxLength = null;
    this.padByte = '00';
};

util.inherits(UnknownValue, ValueRepresentation);

UnknownValue.prototype.readBytes = function(stream, length) {
    return stream.read(C.TYPE_ASCII, length);
};  

UnknownValue.prototype.getFields = function(value) {
    return UnknownValue.super_.prototype.getFields.call(this, [new StringField(value)]);
};

OtherWordString = function() {
    ValueRepresentation.call(this, 'OW');
    this.maxLength = null;
    this.padByte = '00';
};

util.inherits(OtherWordString, ValueRepresentation);

OtherWordString.prototype.readBytes = function(stream, length) {
    return stream.read(C.TYPE_ASCII, length);
};  

OtherWordString.prototype.getFields = function(value) {
    return OtherWordString.super_.prototype.getFields.call(this, [new StringField(value)]);
}; 

OtherByteString = function() {
    ValueRepresentation.call(this, 'OB');
    this.maxLength = null;
    this.padByte = '00';
};

util.inherits(OtherByteString, ValueRepresentation);

OtherByteString.prototype.readBytes = function(stream, length) {
    return stream.read(C.TYPE_HEX, length);
};  

OtherByteString.prototype.getFields = function(value) {
    return OtherByteString.super_.prototype.getFields.call(this, [new HexField(value)]);
}; 

elementByType = function(type, value, syntax) {
    var elem = null,
   nk = DicomElements.dicomNDict[type];
    if (nk) {
        if (nk.vr === 'SQ') {
            var sq = [];
            if (value)
              value.forEach(function(el) {
                var values = [];
                for (var tag in el) {
                    values.push(elementByType(tag, el[tag], syntax));
                }

                sq.push(values);
            });
            elem = new DataElement(type, nk.vr, nk.vm, sq, false, syntax);
        } else {
            elem = new DataElement(type, nk.vr, nk.vm, value, false, syntax);
        }
    } else {
        throw 'Unrecognized element type';
    }

    return elem;
};

elementDataByTag = function(tag) {
    var nk = DicomElements.dicomNDict[tag];
    if (nk) {
        return nk;
    }

    throw ('Unrecognized tag ' + (tag >>> 0).toString(16));
};

elementKeywordByTag = function(tag) {
    try {
        var nk = elementDataByTag(tag);
        return nk.keyword;
    } catch (ex) {
        return 'UnknownTag';
    }
};

vrByType = function(type) {
    var vr = null;
    if (type === 'AE') vr = new ApplicationEntity();
    else if (type === 'AS') vr = new AgeString();
    else if (type === 'AT') vr = new AttributeTag();
    else if (type === 'CS') vr = new CodeString();
    else if (type === 'DA') vr = new DateValue();
    else if (type === 'DS') vr = new DecimalString();
    else if (type === 'DT') vr = new DateTime();
    else if (type === 'FL') vr = new FloatingPointSingle();
    else if (type === 'FD') vr = new FloatingPointDouble();
    else if (type === 'IS') vr = new IntegerString();
    else if (type === 'LO') vr = new LongString();
    else if (type === 'LT') vr = new LongText();
    else if (type === 'OB') vr = new OtherByteString();
    else if (type === 'OD') vr = new OtherDoubleString();
    else if (type === 'OF') vr = new OtherFloatString();
    else if (type === 'OW') vr = new OtherWordString();
    else if (type === 'PN') vr = new PersonName();
    else if (type === 'SH') vr = new ShortString();
    else if (type === 'SL') vr = new SignedLong();
    else if (type === 'SQ') vr = new SequenceOfItems();
    else if (type === 'SS') vr = new SignedShort();
    else if (type === 'ST') vr = new ShortText();
    else if (type === 'TM') vr = new TimeValue();
    else if (type === 'UC') vr = new UnlimitedCharacters();
    else if (type === 'UI') vr = new UniqueIdentifier();
    else if (type === 'UL') vr = new UnsignedLong();
    else if (type === 'UN') vr = new UnknownValue();
    else if (type === 'UR') vr = new UniversalResource();
    else if (type === 'US') vr = new UnsignedShort();
    else if (type === 'UT') vr = new UnlimitedText();
    else throw 'Invalid vr type ' + type;

    return vr;
};

readElements = function(stream, syntax) {
    if (stream.end()) return false;

    var oldEndian = stream.endian;
    stream.setEndian(this.endian);

    var group = stream.read(C.TYPE_UINT16), 
        element = stream.read(C.TYPE_UINT16),
        tag = new Tag((group << 16) | element),
        length = stream.read(C.TYPE_UINT32);

    stream.setEndian(oldEndian);
};

readAElement = function(stream, syntax) {
    var elem = newElementWithSyntax(syntax);
    elem.readBytes(stream);
    return elem;
};

newElementWithSyntax = function(syntax) {
    var elem = new DataElement();
    elem.setSyntax(syntax);
    return elem;
};

var explicitVRList = ['OB', 'OW', 'OF', 'SQ', 'UC', 'UR', 'UT', 'UN'], 
    binaryVRs = ['FL', 'FD', 'SL', 'SS', 'UL', 'US'];

DataElement = function(tag, vr, vm, value, vvr, syntax, options) {
    this.vr = vr ? vrByType(vr) : null;
    this.tag = !vvr ? new Tag(tag) : tag;
    this.value = value;
    this.vm = vm;
    this.vvr = vvr ? true : false;
    this.setOptions(options);
    this.setSyntax(syntax ? syntax : C.IMPLICIT_LITTLE_ENDIAN);
};

DataElement.prototype.setOptions = function(options) {
    this.options = Object.assign({
        split: true
    }, options);
};

DataElement.prototype.setSyntax = function(syn) {
    this.syntax = syn;
    this.implicit = this.syntax === C.IMPLICIT_LITTLE_ENDIAN ? true : false;
    this.endian = (this.syntax === C.IMPLICIT_LITTLE_ENDIAN || this.syntax === C.EXPLICIT_LITTLE_ENDIAN) ? C.LITTLE_ENDIAN : C.BIG_ENDIAN;
};

DataElement.prototype.getValue = function() {
    if (!this.singleValue() && !this.isBinaryNumber()) {
        return this.options.split ? this.value.split(String.fromCharCode(0x5c)) : this.value;
    } else {
        return this.value;
    }
};

DataElement.prototype.singleValue = function() {
    return this.vm === C.VM_SINGLE ? true : false;
};

DataElement.prototype.getVMNum = function() {
    var num = 1;
    switch (this.vm) {
    case C.VM_SINGLE : num = 1; break;
    case C.VM_TWO : num = 2; break;
    case C.VM_THREE : num = 3; break;
    case C.VM_FOUR : num = 4; break;
    case C.VM_16 : num = 16; break;
    default : break;
}
    return num;
};

DataElement.prototype.isBinaryNumber = function() {
    return binaryVRs.indexOf(this.vr.type) !== -1;
};

DataElement.prototype.length = function(fields) {
    //let fields = this.vr.getFields(this.value);
    return fieldsLength(fields);
};

DataElement.prototype.readBytes = function(stream) {
    var oldEndian = stream.endian;
    stream.setEndian(this.endian);

    var group = stream.read(C.TYPE_UINT16), 
        element = stream.read(C.TYPE_UINT16),
        tag = tagFromNumbers(group, element);

    var length = null, vr = null, edata, vm;

    try {
        edata = elementDataByTag(tag.value);
        vm = edata.vm;
    } catch (ex) {
        edata = null;
        vm = null;
    }

    if (this.implicit) {
        length = stream.read(C.TYPE_UINT32);
        if (!edata) {
          if (length == 0xffffffff) {
            vr = 'SQ';
          } else if (tag.isPixelDataTag()) {
            vr = 'OW';
          } else {
            vr = 'UN';  
          }
        } else {
            vr = edata.vr;
        }
    } else {
        vr = stream.read(C.TYPE_ASCII, 2);
        if (explicitVRList.indexOf(vr) !== -1) {
            stream.increment(2);
            length = stream.read(C.TYPE_UINT32);
        } else {
            length = stream.read(C.TYPE_UINT16);
        }
    }

    this.vr = vrByType(vr);
    this.tag = tag;
    this.vm = vm;
    //try {
    if (this.isBinaryNumber() && length > this.vr.maxLength) {
        var times = length / this.vr.maxLength,
     i = 0;
        this.value = [];//console.log(times, length, this.vr.maxLength);return;
        //try {
        while (i++ < times) {
            this.value.push(this.vr.read(stream, this.vr.maxLength));
        }
        //} catch (e) {  }
    } else {
        this.value = this.vr.read(stream, length, this.syntax);
    }
    //} catch (e) { console.log('error', vr, length); }

    stream.setEndian(oldEndian);
};

DataElement.prototype.write = function(stream) {
    var oldEndian = stream.endian;
    stream.setEndian(this.endian);

    var fields = this.getFields();
    fields.forEach(function(field) {
        field.write(stream);
    });

    stream.setEndian(oldEndian);
};

DataElement.prototype.getFields = function() {
    var fields = [new UInt16Field(this.tag.group()), new UInt16Field(this.tag.element())], 
        valueFields = this.vr.getFields(this.value, this.syntax),
   valueLength = fieldsLength(valueFields),
   vrType = this.vr.type;    

    if (vrType === 'SQ') {
        valueLength = 0xffffffff;
    }

    if (this.implicit) {
        fields.push(new UInt32Field(valueLength));
    } else {
        if (explicitVRList.indexOf(vrType) !== -1) {
            fields.push(new StringField(vrType), new ReservedField(2), new UInt32Field(valueLength));
        } else {
            fields.push(new StringField(vrType), new UInt16Field(valueLength));
        } 
    }

    fields = fields.concat(valueFields);
    return fields;
};

