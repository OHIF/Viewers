DicomMessage = function(syntax) {
    this.syntax = syntax ? syntax : null;
    this.type = C.DATA_TYPE_COMMAND;
    this.messageId = C.DEFAULT_MESSAGE_ID;
    this.elementPairs = {};
};

DicomMessage.prototype.isCommand = function() {
    return this.type == C.DATA_TYPE_COMMAND;
};

DicomMessage.prototype.setSyntax = function(syntax) {
    this.syntax = syntax;

    for (var tag in this.elementPairs) {
        this.elementPairs[tag].setSyntax(this.syntax);
    }  
};

DicomMessage.prototype.setMessageId = function(id) {
    this.messageId = id;
};

DicomMessage.prototype.setReplyMessageId = function(id) {
    this.replyMessageId = id;
};

DicomMessage.prototype.command = function(cmds) {
    cmds.unshift(this.newElement(0x00000800, this.dataSetPresent ? C.DATA_SET_PRESENT : C.DATE_SET_ABSENCE));
    cmds.unshift(this.newElement(0x00000700, this.priority));
    cmds.unshift(this.newElement(0x00000110, this.messageId));
    cmds.unshift(this.newElement(0x00000100, this.commandType));
    cmds.unshift(this.newElement(0x00000002, this.contextUID));

    var length = 0;
    cmds.forEach(function(cmd) {
        length += cmd.length(cmd.getFields());
    });

    cmds.unshift(this.newElement(0x00000000, length));
    return cmds;
};

DicomMessage.prototype.response = function(cmds) {
    cmds.unshift(this.newElement(0x00000800, this.dataSetPresent ? C.DATA_SET_PRESENT : C.DATE_SET_ABSENCE));
    cmds.unshift(this.newElement(0x00000120, this.replyMessageId));
    cmds.unshift(this.newElement(0x00000100, this.commandType));
    if (this.contextUID)
      cmds.unshift(this.newElement(0x00000002, this.contextUID));

    var length = 0;
    cmds.forEach(function(cmd) {
        length += cmd.length(cmd.getFields());
    });

    cmds.unshift(this.newElement(0x00000000, length));
    return cmds;
};  

DicomMessage.prototype.setElements = function(pairs) {
    var p = {};
    for (var tag in pairs) {
        p[tag] = this.newElement(tag, pairs[tag]);
    }

    this.elementPairs = p;
};  

DicomMessage.prototype.newElement = function(tag, value) {
    return elementByType(tag, value, this.syntax);
};

DicomMessage.prototype.setElement = function(key, value) {
    this.elementPairs[key] = elementByType(key, value);
};

DicomMessage.prototype.setElementPairs = function(pairs) {
    this.elementPairs = pairs;
};

DicomMessage.prototype.setContextId = function(context) {
    this.contextUID = context;
};

DicomMessage.prototype.setPriority = function(pri) {
    this.priority = pri;
};

DicomMessage.prototype.setType = function(type) {
    this.type = type;
};

DicomMessage.prototype.setDataSetPresent = function(present) {
    this.dataSetPresent = present == 0x0101 ? false : true;
};

DicomMessage.prototype.haveData = function() {
    return this.dataSetPresent;
};  

DicomMessage.prototype.tags = function() {
    return Object.keys(this.elementPairs);
};

DicomMessage.prototype.key = function(tag) {
    return elementKeywordByTag(tag);
};

DicomMessage.prototype.getValue = function(tag) {
    return this.elementPairs[tag] ? this.elementPairs[tag].getValue() : null;
};

DicomMessage.prototype.affectedSOPClassUID = function() {
    return this.getValue(0x00000002);
};  

DicomMessage.prototype.getMessageId = function() {
    return this.getValue(0x00000110);
};

DicomMessage.prototype.getFields = function() {
    var eles = [];
    for (var tag in this.elementPairs) {
        eles.push(this.elementPairs[tag]);
    }

    return eles;
};  

DicomMessage.prototype.length = function(elems) {
    var len = 0;
    elems.forEach(function(elem) {
        len += elem.length(elem.getFields());
    });
    return len;
};

DicomMessage.prototype.isResponse = function() {
    return false;
};

DicomMessage.prototype.is = function(type) {
    return this.commandType == type;
};  

DicomMessage.prototype.write = function(stream) {
    var fields = this.getFields(),
   o = this;
    fields.forEach(function(field) {
        field.setSyntax(o.syntax);
        field.write(stream);
    });
};

DicomMessage.prototype.printElements = function(pairs, indent) {
    var typeName = '';
    for (var tag in pairs) {
        var value = pairs[tag].getValue();
        typeName += (' '.repeat(indent)) + this.key(tag) + ' : ';
        if (value instanceof Array) {
            var o = this;
            value.forEach(function(p) {
                if (typeof p == 'object') {
                    typeName += '[\n' + o.printElements(p, indent + 2) + (' '.repeat(indent)) + ']';
                } else {
                    typeName += '[' + p + ']';
                }
            });
            if (typeName[typeName.length - 1] != '\n') {
                typeName += '\n';
            }
        } else {
            typeName += value + '\n';
        }
    }

    return typeName;
};

DicomMessage.prototype.typeString = function() {
    var typeName = '';
    if (!this.isCommand()) {
        typeName = 'DateSet Message';
    } else {
        switch (this.commandType) {
        case C.COMMAND_C_GET_RSP : typeName = 'C-GET-RSP'; break;
        case C.COMMAND_C_MOVE_RSP : typeName = 'C-MOVE-RSP'; break;
        case C.COMMAND_C_GET_RQ : typeName = 'C-GET-RQ'; break;
        case C.COMMAND_C_STORE_RQ : typeName = 'C-STORE-RQ'; break;
        case C.COMMAND_C_FIND_RSP : typeName = 'C-FIND-RSP'; break;
        case C.COMMAND_C_MOVE_RQ : typeName = 'C-MOVE-RQ'; break;
        case C.COMMAND_C_FIND_RQ : typeName = 'C-FIND-RQ'; break;
        case C.COMMAND_C_STORE_RSP : typeName = 'C-STORE-RSP'; break;
    }      
    }   

    return typeName;
};

DicomMessage.prototype.toString = function() {
    var typeName = this.typeString();
    typeName += ' [\n';
    typeName += this.printElements(this.elementPairs, 0);
    typeName += ']';
    return typeName;
};

DicomMessage.prototype.walkObject = function(pairs) {
    var obj = {},
   o = this;
    for (var tag in pairs) {
        var v = pairs[tag].getValue(),
     u = v;
        if (v instanceof Array) {
            u = [];
            v.forEach(function(a) {
                if (typeof a == 'object') {
                    u.push(o.walkObject(a));
                } else u.push(a);
            });
        }

        obj[tag] = u;
    }

    return obj;
};

DicomMessage.prototype.toObject = function() {
    return this.walkObject(this.elementPairs);
};

DicomMessage.readToPairs = function(stream, syntax, options) {
    var pairs = {};
    while (!stream.end()) {
        var elem = new DataElement();
        if (options) {
            elem.setOptions(options);
        }

        elem.setSyntax(syntax);
        elem.readBytes(stream);
        pairs[elem.tag.value] = elem;
    }

    return pairs;  
};

var fileValid = function(stream) {
    return stream.readString(4, C.TYPE_ASCII) == 'DICM';
};

var readMetaStream = function(stream, useSyntax, length, callback) {
    var message = new FileMetaMessage();
    message.setElementPairs(DicomMessage.readToPairs(stream, useSyntax));
    if (callback) {
        callback(null, message, length);
    }

    return message;  
};

DicomMessage.readMetaHeader = function(bufferOrFile, callback) {
    var useSyntax = C.EXPLICIT_LITTLE_ENDIAN;
    if (bufferOrFile instanceof Buffer) {
        var stream = new ReadStream(bufferOrFile);
        stream.reset();
        stream.increment(128);  
        if (!fileValid(stream)) {
            return quitWithError('Invalid a dicom file ', callback);  
        }      

        var el = readAElement(stream, useSyntax),
            metaLength = el.value,
            metaStream = stream.more(metaLength);

        return readMetaStream(metaStream, useSyntax, metaLength, callback);
    } else if (typeof bufferOrFile == 'string') {
        fs.open(bufferOrFile, 'r', function(err, fd) {
            if (err) {
                //fs.closeSync(fd);
                return quitWithError('Cannot open file', callback);
            }

            var buffer = new Buffer(16);
            fs.read(fd, buffer, 0, 16, 128, function(err, bytesRead) {
                if (err || bytesRead != 16) {
                    fs.closeSync(fd);
                    return quitWithError('Cannot read file', callback);
                } 

                var stream = new ReadStream(buffer);
                if (!fileValid(stream)) {
                    fs.closeSync(fd);
                    return quitWithError('Not a dicom file ' + bufferOrFile, callback);
                }

                var el = readAElement(stream, useSyntax), 
                    metaLength = el.value,
                    metaBuffer = new Buffer(metaLength);

                fs.read(fd, metaBuffer, 0, metaLength, 144, function(err, bytesRead) {
                    fs.closeSync(fd);
                    if (err || bytesRead != metaLength) {
                      return quitWithError('Invalid a dicom file ' + bufferOrFile, callback);            
                    }

                    var metaStream = new ReadStream(metaBuffer);
                    return readMetaStream(metaStream, useSyntax, metaLength, callback);
                });
            });
        });
    } 

    return null;
};

DicomMessage.read = function(stream, type, syntax, options) {
    var elements = [],
   pairs = {},
   useSyntax = type == C.DATA_TYPE_COMMAND ? C.IMPLICIT_LITTLE_ENDIAN : syntax;
    stream.reset();
    while (!stream.end()) {
        var elem = new DataElement();
        if (options) {
            elem.setOptions(options);
        }

        elem.setSyntax(useSyntax);
        elem.readBytes(stream);//return;
        pairs[elem.tag.value] = elem;
    }

    var message = null;
    if (type == C.DATA_TYPE_COMMAND) {
        var cmdType = pairs[0x00000100].value;

        switch (cmdType) {
        case 0x8020 : message = new CFindRSP(useSyntax); break;
        case 0x8021 : message = new CMoveRSP(useSyntax); break;
        case 0x8010 : message = new CGetRSP(useSyntax); break;
        case 0x0001 : message = new CStoreRQ(useSyntax); break;
        case 0x0020 : message = new CFindRQ(useSyntax); break;
        case 0x8001 : message = new CStoreRSP(useSyntax); break;
        default : throw 'Unrecognized command type ' + cmdType.toString(16); break;
    }

        message.setElementPairs(pairs);
        message.setDataSetPresent(message.getValue(0x00000800));
        message.setContextId(message.getValue(0x00000002));
        if (!message.isResponse()) {
            message.setMessageId(message.getValue(0x00000110));
        } else {
            message.setReplyMessageId(message.getValue(0x00000120));
        }
    } else if (type == C.DATA_TYPE_DATA) {
        message = new DataSetMessage(useSyntax);
        message.setElementPairs(pairs);
    } else {
        throw 'Unrecognized message type';
    }

    return message;
};

DataSetMessage = function(syntax) {
    DicomMessage.call(this, syntax);
    this.type = C.DATA_TYPE_DATA;
};

util.inherits(DataSetMessage, DicomMessage);

DataSetMessage.prototype.is = function(type) {
    return false;
};

FileMetaMessage = function(syntax) {
    DicomMessage.call(this, syntax);
    this.type = null;
};

util.inherits(FileMetaMessage, DicomMessage);

CommandMessage = function(syntax) {
    DicomMessage.call(this, syntax);
    this.type = C.DATA_TYPE_COMMAND;
    this.priority = C.PRIORITY_MEDIUM;
    this.dataSetPresent = true;     
};

util.inherits(CommandMessage, DicomMessage);

CommandMessage.prototype.getFields = function() {
    return this.command(CommandMessage.super_.prototype.getFields.call(this));
};  

CommandResponse = function(syntax) {
    DicomMessage.call(this, syntax);
    this.type = C.DATA_TYPE_COMMAND;
    this.dataSetPresent = true;
};

util.inherits(CommandResponse, DicomMessage);

CommandResponse.prototype.isResponse = function() {
    return true;
};

CommandResponse.prototype.respondedTo = function() {
    return this.getValue(0x00000120);
};

CommandResponse.prototype.isFinal = function() {
    return this.success() || this.failure() || this.cancel();
};

CommandResponse.prototype.warning = function() {
    var status = this.getStatus();
    return (status == 0x0001) || (status >> 12 == 0xb);
};

CommandResponse.prototype.success = function() {
    return this.getStatus() == 0x0000;
};

CommandResponse.prototype.failure = function() {
    var status = this.getStatus();
    return (status >> 12 == 0xa) || (status >> 12 == 0xc) || (status >> 8 == 0x1);
};

CommandResponse.prototype.cancel = function() {
    return this.getStatus() == C.STATUS_CANCEL;
};

CommandResponse.prototype.pending = function() {
    var status = this.getStatus();
    return (status == 0xff00) || (status == 0xff01);
};

CommandResponse.prototype.getStatus = function() {
    return this.getValue(0x00000900);
};

CommandResponse.prototype.setStatus = function(status) {
    this.setElement(0x00000900, status);
};

// following four methods only available to C-GET-RSP and C-MOVE-RSP
CommandResponse.prototype.getNumOfRemainingSubOperations = function() {
    return this.getValue(0x00001020);
};

CommandResponse.prototype.getNumOfCompletedSubOperations = function() {
    return this.getValue(0x00001021);
};

CommandResponse.prototype.getNumOfFailedSubOperations = function() {
    return this.getValue(0x00001022);
};

CommandResponse.prototype.getNumOfWarningSubOperations = function() {
    return this.getValue(0x00001023);
};
//end

CommandResponse.prototype.getFields = function() {
    return this.response(CommandResponse.super_.prototype.getFields.call(this));
};

CFindRSP = function(syntax) {
    CommandResponse.call(this, syntax);
    this.commandType = 0x8020;
};

util.inherits(CFindRSP, CommandResponse);

CGetRSP = function(syntax) {
    CommandResponse.call(this, syntax);
    this.commandType = 0x8010;
};

util.inherits(CGetRSP, CommandResponse);

CMoveRSP = function(syntax) {
    CommandResponse.call(this, syntax);
    this.commandType = 0x8021;
};

util.inherits(CMoveRSP, CommandResponse);

CFindRQ = function(syntax) {
    CommandMessage.call(this, syntax);
    this.commandType = 0x20;
    this.contextUID = C.SOP_STUDY_ROOT_FIND;
};

util.inherits(CFindRQ, CommandMessage);

CCancelRQ = function(syntax) {
    CommandResponse.call(this, syntax);
    this.commandType = 0x0fff;
    this.contextUID = null;
    this.dataSetPresent = false;
};

util.inherits(CCancelRQ, CommandResponse);

CCancelMoveRQ = function(syntax) {
    CommandResponse.call(this, syntax);
    this.commandType = 0x0fff;
    this.contextUID = null;
    this.dataSetPresent = false;
};

util.inherits(CCancelMoveRQ, CommandResponse);

CMoveRQ = function(syntax, destination) {
    CommandMessage.call(this, syntax);
    this.commandType = 0x21;
    this.contextUID = C.SOP_STUDY_ROOT_MOVE;
    this.setDestination(destination || '');  
};

util.inherits(CMoveRQ, CommandMessage);

CMoveRQ.prototype.setStore = function(cstr) {
    this.store = cstr;
};  

CMoveRQ.prototype.setDestination = function(dest) {
    this.setElement(0x00000600, dest);    
};

CGetRQ = function(syntax) {
    CommandMessage.call(this, syntax);
    this.commandType = 0x10;
    this.contextUID = C.SOP_STUDY_ROOT_GET;
    this.store = null;
};

util.inherits(CGetRQ, CommandMessage);

CGetRQ.prototype.setStore = function(cstr) {
    this.store = cstr;
};

CStoreRQ = function(syntax) {
    CommandMessage.call(this, syntax);
    this.commandType = 0x01;
    this.contextUID = C.SOP_STUDY_ROOT_GET;  
};

util.inherits(CStoreRQ, CommandMessage);

CStoreRQ.prototype.getOriginAETitle = function() {
    return this.getValue(0x00001030);
};

CStoreRQ.prototype.getMoveMessageId = function() {
    return this.getValue(0x00001031);
};

CStoreRQ.prototype.getAffectedSOPInstanceUID = function() {
    return this.getValue(0x00001000);
};

CStoreRQ.prototype.setAffectedSOPInstanceUID = function(uid) {
    this.setElement(0x00001000, uid);
};

CStoreRQ.prototype.setAffectedSOPClassUID = function(uid) {
    this.setElement(0x00000002, uid);
};

CStoreRSP = function(syntax) {
    CommandResponse.call(this, syntax);
    this.commandType = 0x8001;
    this.contextUID = C.SOP_STUDY_ROOT_GET;
    this.dataSetPresent = false;
};

util.inherits(CStoreRSP, CommandResponse);

CStoreRSP.prototype.setAffectedSOPInstanceUID = function(uid) {
    this.setElement(0x00001000, uid);
};  

CStoreRSP.prototype.getAffectedSOPInstanceUID = function(uid) {
    return this.getValue(0x00001000);
};
