PDVHandle = function() {

}
util.inherits(PDVHandle, EventEmitter);

PDU = function() {
  this.fields = [];
  this.lengthBytes = 4;  
}

PDU.prototype.length = function(fields) {
  var len = 0;
  fields.forEach(function(f) {
    len += !f.getFields ? f.length() : f.length(f.getFields());
  });
  return len;
}

PDU.prototype.is = function(type) {
  return this.type == type;
}

PDU.prototype.getFields = function(fields) {
  var len = this.lengthField(fields);
  fields.unshift(len);
  if (this.type !== null) {
    fields.unshift(new ReservedField());
    fields.unshift(new HexField(this.type));
  }
    
  return fields;
}

PDU.prototype.lengthField = function(fields) {
  if (this.lengthBytes == 4) {
    return new UInt32Field(this.length(fields));
  } else if (this.lengthBytes == 2) {
    return new UInt16Field(this.length(fields));
  } else {
    throw "Invalid length bytes";
  }
}  

PDU.prototype.read = function(stream) {
  stream.read(C.TYPE_HEX, 1);
  var length = stream.read(C.TYPE_UINT32);
  this.readBytes(stream, length);
}

PDU.prototype.load = function(stream) {
  return PDU.createByStream(stream);
}

PDU.prototype.loadPDV = function(stream, length) {
  if (stream.end()) return false;
  var bytesRead = 0, pdvs = [];
  while (bytesRead < length) {
    var plength = stream.read(C.TYPE_UINT32), 
        pdv = new PresentationDataValueItem();
    pdv.readBytes(stream, plength);
    bytesRead += plength + 4;

    pdvs.push(pdv);
  }

  return pdvs;
}

PDU.prototype.loadDicomMessage = function(stream, isCommand, isLast) {
  var message = DicomMessage.read(stream, isCommand, isLast);
  return message;
}

PDU.prototype.stream = function() {
  var stream = new WriteStream(), 
      fields = this.getFields();

  // writing to buffer
  fields.forEach(function(field){
    field.write(stream);
  });

  return stream;
}

PDU.prototype.buffer = function() {
  return this.stream().buffer();
}

var interpretCommand = function(stream, isLast) {
  parseDicomMessage(stream);
}

mergePDVs = function(pdvs) {
  var merges = [], count = pdvs.length, i = 0;
  while (i < count) {console.log(pdvs[i].isLast, pdvs[i].type);
    if (!pdvs[i].isLast) {
      var j = i;
      while (!pdvs[j++].isLast && j < count) {
        pdvs[i].messageStream.concat(pdvs[j].messageStream);
      }
      merges.push(pdvs[i]);
      i = j;
    } else {
      merges.push(pdvs[i++]);
    }
  }
  return merges;
}

PDU.splitPData = function(pdata, maxSize) {
  var totalLength = pdata.totalLength();
  if (totalLength > maxSize) {
    //split into chunks of pdatas
    var chunks = Math.floor(totalLength / maxSize), left = totalLength % maxSize;

    for (var i = 0;i < chunks;i++) {
      if (i == chunks - 1) {
        if (left < 6) {
          //need to move some of the last chunk
        }
      }
    }
  } else {
    return [pdata];
  }
}

var readChunk = function(fd, bufferSize, slice, callback) {
  var buffer = new Buffer(bufferSize), length = slice.length, start = slice.start;
  fs.read(fd, buffer, 0, length, start, function(err, bytesRead) {
    callback(err, bytesRead, buffer, slice);
  });  
}

PDU.generatePDatas = function(context, bufferOrFile, maxSize, length, metaLength, callback) {
  var total, isFile = false;
  if (typeof bufferOrFile == 'string') {
    var stats = fs.statSync(bufferOrFile);
    total = stats['size'];
    isFile = true;
  } else if (bufferOrFile instanceof Buffer) {
    total = length ? length : bufferOrFile.length;
  }
  var handler = new PDVHandle();

  var slices = [], start = metaLength + 144, index = 0;
  maxSize -= 6;
  while (start < total) {
    var sliceLength = maxSize, isLast = false;
    if (total - start < maxSize) {
      sliceLength = total - start;
      isLast = true;
    } 
    slices.push({start : start, length : sliceLength, isLast : isLast, index : index});
    start += sliceLength;
    index++;
  }

  if (isFile) {
    fs.open(bufferOrFile, 'r', function(err, fd) {
      if (err) {
        //fs.closeSync(fd);
        return quitWithError(err, callback);
      } else callback(null, handler);

      var after = function(err, bytesRead, buffer, slice) {
        if (err) {
          fs.closeSync(fd);
          handler.emit('error', err);
          return;
        }
        var pdv = new RawDataPDV(context, buffer, 0, slice.length, slice.isLast);
        handler.emit('pdv', pdv);

        if (slices.length < 1) {
          handler.emit('end');
          fs.closeSync(fd);
        } else {
          var next = slices.shift();
          readChunk(fd, maxSize, next, after);
        }
      };

      var sl = slices.shift();
      readChunk(fd, maxSize, sl, after);
    });
  } else {
    for (var i = 0;i < slices.length;i++) {
      var toSlice = slices[i];

      var buffer = bufferOrFile.slice(toSlice.start, toSlice.length);
      var pdv = new RawDataPDV(context, buffer, 0, toSlice.length, toSlice.isLast);
      handler.emit('pdv', pdv); 

      if (i == slices.length - 1) {
        handler.emit('end');
      }        
    }
  }

  return;
}

PDU.typeToString = function(type) {
  var pdu = null, typeNum = parseInt(type, 16);
  //console.log("RECEIVED PDU-TYPE ", typeNum);
  switch (typeNum) {
    case 0x01 : pdu = 'ASSOCIATE-RQ'; break;
    case 0x02 : pdu = 'ASSOCIATE-AC'; break;
    case 0x04 : pdu = 'P-DATA-TF'; break;
    case 0x06 : pdu = 'RELEASE-RP'; break;
    case 0x07 : pdu = 'ASSOCIATE-ABORT'; break;
    case 0x10 : pdu = 'APPLICATION-CONTEXT-ITEM'; break;
    case 0x20 : pdu = 'PRESENTATION-CONTEXT-ITEM'; break;
    case 0x21 : pdu = 'PRESENTATION-CONTEXT-ITEM-AC'; break;
    case 0x30 : pdu = 'ABSTRACT-SYNTAX-ITEM'; break;
    case 0x40 : pdu = 'TRANSFER-SYNTAX-ITEM'; break;
    case 0x50 : pdu = 'USER-INFORMATION-ITEM'; break;
    case 0x51 : pdu = 'MAXIMUM-LENGTH-ITEM'; break;
    case 0x52 : pdu = 'IMPLEMENTATION-CLASS-UID-ITEM'; break;
    case 0x55 : pdu = 'IMPLEMENTATION-VERSION-NAME-ITEM'; break;
    default : break;
  }

  return pdu;
}

PDU.createByStream = function(stream) {
  if (stream.end()) return null;

  var pduType = stream.read(C.TYPE_HEX, 1), typeNum = parseInt(pduType, 16), pdu = null;
  //console.log("RECEIVED PDU-TYPE ", pduType);
  switch (typeNum) {
    case 0x01 : pdu = new AssociateRQ(); break;
    case 0x02 : pdu = new AssociateAC(); break;
    case 0x04 : pdu = new PDataTF(); break;
    case 0x06 : pdu = new ReleaseRP(); break;
    case 0x07 : pdu = new AssociateAbort(); break;
    case 0x10 : pdu = new ApplicationContextItem(); break;
    case 0x20 : pdu = new PresentationContextItem(); break;
    case 0x21 : pdu = new PresentationContextItemAC(); break;
    case 0x30 : pdu = new AbstractSyntaxItem(); break;
    case 0x40 : pdu = new TransferSyntaxItem(); break;
    case 0x50 : pdu = new UserInformationItem(); break;
    case 0x51 : pdu = new MaximumLengthItem(); break;
    case 0x52 : pdu = new ImplementationClassUIDItem(); break;
    case 0x55 : pdu = new ImplementationVersionNameItem(); break;
    default : throw "Unrecoginized pdu type " + pduType; break;
  }
  if (pdu)
    pdu.read(stream);

  return pdu;
}

var nextItemIs = function(stream, pduType) {
  if (stream.end()) return false;

  var nextType = stream.read(C.TYPE_HEX, 1);
  stream.increment(-1);
  return pduType == nextType;
}

AssociateRQ = function() {
  PDU.call(this);
  this.type = C.ITEM_TYPE_PDU_ASSOCIATE_RQ;
  this.protocolVersion = 1;  
}

util.inherits(AssociateRQ, PDU);

AssociateRQ.prototype.setProtocolVersion = function(version) {
  this.protocolVersion = version;
}

AssociateRQ.prototype.setCalledAETitle = function(title) {
  this.calledAETitle = title;
}

AssociateRQ.prototype.setCallingAETitle = function(title) {
  this.callingAETitle = title;
}

AssociateRQ.prototype.setApplicationContextItem = function(item) {
  this.applicationContextItem = item;
}

AssociateRQ.prototype.setPresentationContextItems = function(items) {
  this.presentationContextItems = items;
}

AssociateRQ.prototype.setUserInformationItem = function(item) {
  this.userInformationItem = item;
}

AssociateRQ.prototype.allAccepted = function() {
  for (var i in this.presentationContextItems) {
    var item = this.presentationContextItems[i];
    if (!item.accepted()) return false;
  }
  return true;
}

AssociateRQ.prototype.getFields = function() {
  var f = [
    new UInt16Field(this.protocolVersion), new ReservedField(2),
    new FilledField(this.calledAETitle, 16), new FilledField(this.callingAETitle, 16),
    new ReservedField(32), this.applicationContextItem
  ];
  this.presentationContextItems.forEach(function(context){
    f.push(context);
  });
  f.push(this.userInformationItem);
  return AssociateRQ.super_.prototype.getFields.call(this, f);
}

AssociateRQ.prototype.readBytes = function(stream, length) {
  this.type = C.ITEM_TYPE_PDU_ASSOCIATE_RQ;
  var version = stream.read(C.TYPE_UINT16);
  this.setProtocolVersion(version);
  stream.increment(2);
  var calledAE = stream.read(C.TYPE_ASCII, 16);
  this.setCalledAETitle(calledAE);
  var callingAE = stream.read(C.TYPE_ASCII, 16);
  this.setCallingAETitle(callingAE);
  stream.increment(32);
  
  var appContext = this.load(stream);
  this.setApplicationContextItem(appContext);

  var presContexts = [];
  do {
    presContexts.push(this.load(stream));
  } while (nextItemIs(stream, C.ITEM_TYPE_PRESENTATION_CONTEXT));
  this.setPresentationContextItems(presContexts);

  var userItem = this.load(stream);
  this.setUserInformationItem(userItem);
}

AssociateRQ.prototype.buffer = function() {
  return AssociateRQ.super_.prototype.buffer.call(this);
}

AssociateAC = function() {
  AssociateRQ.call(this);
};

util.inherits(AssociateAC, AssociateRQ);

AssociateAC.prototype.readBytes = function(stream, length) {
  this.type = C.ITEM_TYPE_PDU_ASSOCIATE_AC;
  var version = stream.read(C.TYPE_UINT16);
  this.setProtocolVersion(version);
  stream.increment(66);
  
  var appContext = this.load(stream);
  this.setApplicationContextItem(appContext);

  var presContexts = [];
  do {
    presContexts.push(this.load(stream));
  } while (nextItemIs(stream, C.ITEM_TYPE_PRESENTATION_CONTEXT_AC));
  this.setPresentationContextItems(presContexts);

  var userItem = this.load(stream);
  this.setUserInformationItem(userItem);
}

AssociateAC.prototype.getMaxSize = function() {
  var items = this.userInformationItem.userDataItems, length = items.length, size = null;

  for (var i = 0;i < length;i++) {
    if (items[i].is(C.ITEM_TYPE_MAXIMUM_LENGTH)) {
      size = items[i].maximumLengthReceived;
      break;
    }
  }
  return size;
}

AssociateAbort = function() {
  this.type = C.ITEM_TYPE_PDU_AABORT;
  this.source = 1;
  this.reason = 0;
  PDU.call(this);  
}

util.inherits(AssociateAbort, PDU);

AssociateAbort.prototype.setSource = function(src) {
  this.source = src;
}

AssociateAbort.prototype.setReason = function(reason) {
  this.reason = reason;
}

AssociateAbort.prototype.readBytes = function(stream, length) {
  stream.increment(2);

  var source = stream.read(C.TYPE_UINT8);
  this.setSource(source);

  var reason = stream.read(C.TYPE_UINT8);
  this.setReason(reason);
}

AssociateAbort.prototype.getFields = function() {
  return AssociateAbort.super_.prototype.getFields.call(this, [
    new ReservedField(), new ReservedField(), 
    new UInt8Field(this.source), new UInt8Field(this.reason)
  ]);
}

ReleaseRQ = function() {
  this.type = C.ITEM_TYPE_PDU_RELEASE_RQ;
  PDU.call(this);
};

util.inherits(ReleaseRQ, PDU);

ReleaseRQ.prototype.getFields = function() {
  return ReleaseRQ.super_.prototype.getFields.call(this, [new ReservedField(4)]);
};

ReleaseRP = function() {
  this.type = C.ITEM_TYPE_PDU_RELEASE_RP;
  PDU.call(this);
}

util.inherits(ReleaseRP, PDU);

ReleaseRP.prototype.readBytes = function(stream, length) {
  stream.increment(4);
};

ReleaseRP.prototype.getFields = function() {
  return ReleaseRP.super_.prototype.getFields.call(this, [new ReservedField(4)]);
}

PDataTF = function() {
  this.type = C.ITEM_TYPE_PDU_PDATA;
  this.presentationDataValueItems = [];
  PDU.call(this);
}
util.inherits(PDataTF, PDU);

PDataTF.prototype.setPresentationDataValueItems = function(items) {
  this.presentationDataValueItems = items ? items : [];
}

PDataTF.prototype.getFields = function() {
  var fields = this.presentationDataValueItems;

  return PDataTF.super_.prototype.getFields.call(this, fields);
}

PDataTF.prototype.totalLength = function() {
  var fields = this.presentationDataValueItems;

  return this.length(fields);
}

PDataTF.prototype.readBytes = function(stream, length) {
  var pdvs = this.loadPDV(stream, length);
  //let merges = mergePDVs(pdvs);

  this.setPresentationDataValueItems(pdvs);
}

Item = function() {
  PDU.call(this);
  this.lengthBytes = 2;
};
util.inherits(Item, PDU);

Item.prototype.read = function(stream) {
  stream.read(C.TYPE_HEX, 1);
  var length = stream.read(C.TYPE_UINT16);
  this.readBytes(stream, length);
}  

Item.prototype.write = function(stream) {
  stream.concat(this.stream());
}

Item.prototype.getFields = function(fields) {
  return Item.super_.prototype.getFields.call(this, fields);
}

PresentationDataValueItem = function(context) {
  this.type = null;
  this.isLast = true;
  this.dataFragment = null;
  this.contextId = context;
  this.messageStream = null;
  Item.call(this);

  this.lengthBytes = 4;
};
util.inherits(PresentationDataValueItem, Item);

PresentationDataValueItem.prototype.setContextId = function(id) {
  this.contextId = id;
}

PresentationDataValueItem.prototype.setFlag = function(flag) {
  this.flag = flag;
}

PresentationDataValueItem.prototype.setPresentationDataValue = function(pdv) {
  this.pdv = pdv;
}

PresentationDataValueItem.prototype.setMessage = function(msg) {
  this.dataFragment = msg;
}

PresentationDataValueItem.prototype.getMessage = function() {
  return this.dataFragment;
}

PresentationDataValueItem.prototype.readBytes = function(stream, length) {
  this.contextId = stream.read(C.TYPE_UINT8);
  var messageHeader = stream.read(C.TYPE_UINT8);
  this.isLast = messageHeader >> 1;
  this.type = messageHeader & 1 ? C.DATA_TYPE_COMMAND : C.DATA_TYPE_DATA;

  //load dicom messages
  this.messageStream = stream.more(length - 2);
}

PresentationDataValueItem.prototype.getFields = function() {
  var fields = [new UInt8Field(this.contextId)];
  //define header
  var messageHeader = (1 & this.dataFragment.type) | ((this.isLast ? 1 : 0) << 1);
  fields.push(new UInt8Field(messageHeader));

  fields.push(this.dataFragment);

  return PresentationDataValueItem.super_.prototype.getFields.call(this, fields);
}  

RawDataPDV = function(context, buffer, start, length, isLast) {
  this.type = null;
  this.isLast = isLast;
  this.dataFragmentBuffer = buffer;
  this.bufferStart = start;
  this.bufferLength = length;
  this.contextId = context;
  Item.call(this);

  this.lengthBytes = 4;
};
util.inherits(RawDataPDV, Item);

RawDataPDV.prototype.getFields = function() {
  var fields = [new UInt8Field(this.contextId)];
  var messageHeader = (this.isLast ? 1 : 0) << 1;
  fields.push(new UInt8Field(messageHeader));
  fields.push(new BufferField(this.dataFragmentBuffer, this.bufferStart, this.bufferLength));

  return RawDataPDV.super_.prototype.getFields.call(this, fields);
}

ApplicationContextItem = function() {
  this.type = C.ITEM_TYPE_APPLICATION_CONTEXT;
  this.applicationContextName = C.APPLICATION_CONTEXT_NAME;
  Item.call(this);  
}
util.inherits(ApplicationContextItem, Item);

ApplicationContextItem.prototype.setApplicationContextName = function(name) {
  this.applicationContextName = name;
}

ApplicationContextItem.prototype.getFields = function() {
  return ApplicationContextItem.super_.prototype.getFields.call(this, [new StringField(this.applicationContextName)]);
}

ApplicationContextItem.prototype.readBytes = function(stream, length) {
  var appContext = stream.read(C.TYPE_ASCII, length);
  this.setApplicationContextName(appContext);
}

ApplicationContextItem.prototype.buffer = function() {
  return ApplicationContextItem.super_.prototype.buffer.call(this);
}

PresentationContextItem = function() {
  this.type = C.ITEM_TYPE_PRESENTATION_CONTEXT;
  Item.call(this);
};
util.inherits(PresentationContextItem, Item);

PresentationContextItem.prototype.setPresentationContextID = function(id) {
  this.presentationContextID = id;
}

PresentationContextItem.prototype.setAbstractSyntaxItem = function(item) {
  this.abstractSyntaxItem = item;
}

PresentationContextItem.prototype.setTransferSyntaxesItems = function(items) {
  this.transferSyntaxesItems = items;
}

PresentationContextItem.prototype.setResultReason = function(reason) {
  this.resultReason = reason;
}

PresentationContextItem.prototype.accepted = function() {
  return this.resultReason == 0;
}

PresentationContextItem.prototype.readBytes = function(stream, length) {
  var contextId = stream.read(C.TYPE_UINT8);
  this.setPresentationContextID(contextId);
  stream.increment(1);
  stream.increment(1);
  stream.increment(1);

  var abstractItem = this.load(stream);
  this.setAbstractSyntaxItem(abstractItem);

  var transContexts = [];
  do {
    transContexts.push(this.load(stream));
  } while (nextItemIs(stream, C.ITEM_TYPE_TRANSFER_CONTEXT));
  this.setTransferSyntaxesItems(transContexts);
}

PresentationContextItem.prototype.getFields = function() {
  var f = [
    new UInt8Field(this.presentationContextID), 
    new ReservedField(), new ReservedField(), new ReservedField(), this.abstractSyntaxItem
  ];
  this.transferSyntaxesItems.forEach(function(syntaxItem){
    f.push(syntaxItem);
  });
  return PresentationContextItem.super_.prototype.getFields.call(this, f);  
}

PresentationContextItem.prototype.buffer = function() {
  return PresentationContextItem.super_.prototype.buffer.call(this);
}

PresentationContextItemAC = function() {
  this.type = C.ITEM_TYPE_PRESENTATION_CONTEXT_AC;
  Item.call(this);
};
util.inherits(PresentationContextItemAC, PresentationContextItem);

PresentationContextItemAC.prototype.readBytes = function(stream, length) {
  var contextId = stream.read(C.TYPE_UINT8);
  this.setPresentationContextID(contextId);
  stream.increment(1);
  var resultReason = stream.read(C.TYPE_UINT8);
  this.setResultReason(resultReason);
  stream.increment(1);

  var transItem = this.load(stream);
  this.setTransferSyntaxesItems([transItem]);
}

AbstractSyntaxItem = function() {
  this.type = C.ITEM_TYPE_ABSTRACT_CONTEXT;
  Item.call(this);  
}
util.inherits(AbstractSyntaxItem, Item);

AbstractSyntaxItem.prototype.setAbstractSyntaxName = function(name) {
  this.abstractSyntaxName = name;
}

AbstractSyntaxItem.prototype.getFields = function() {
  return AbstractSyntaxItem.super_.prototype.getFields.call(this, [new StringField(this.abstractSyntaxName)]);
}  

AbstractSyntaxItem.prototype.buffer = function() {
  return AbstractSyntaxItem.super_.prototype.buffer.call(this);
}

AbstractSyntaxItem.prototype.readBytes = function(stream, length) {
  var name = stream.read(C.TYPE_ASCII, length);
  this.setAbstractSyntaxName(name);
}

TransferSyntaxItem = function() {
  this.type = C.ITEM_TYPE_TRANSFER_CONTEXT;
  Item.call(this);
};
util.inherits(TransferSyntaxItem, Item);

TransferSyntaxItem.prototype.setTransferSyntaxName = function(name) {
  this.transferSyntaxName = name;
}

TransferSyntaxItem.prototype.readBytes = function(stream, length) {
  var transfer = stream.read(C.TYPE_ASCII, length);
  this.setTransferSyntaxName(transfer);
}

TransferSyntaxItem.prototype.getFields = function() {
  return TransferSyntaxItem.super_.prototype.getFields.call(this, [new StringField(this.transferSyntaxName)]);
}

TransferSyntaxItem.prototype.buffer = function() {
  return TransferSyntaxItem.super_.prototype.buffer.call(this);
}

UserInformationItem = function() {
  this.type = C.ITEM_TYPE_USER_INFORMATION;
  Item.call(this);
};
util.inherits(UserInformationItem, Item);

UserInformationItem.prototype.setUserDataItems = function(items) {
  this.userDataItems = items;
}

UserInformationItem.prototype.readBytes = function(stream, length) {
  var items = [], pdu = this.load(stream);

  do {
    items.push(pdu);
  } while (pdu = this.load(stream));
  this.setUserDataItems(items);
}

UserInformationItem.prototype.getFields = function() {
  var f = [];
  this.userDataItems.forEach(function(userData){
    f.push(userData);
  });
  return UserInformationItem.super_.prototype.getFields.call(this, f);
}

UserInformationItem.prototype.buffer = function() {
  return UserInformationItem.super_.prototype.buffer.call(this);
}

ImplementationClassUIDItem = function() {
  this.type = C.ITEM_TYPE_IMPLEMENTATION_UID;
  Item.call(this);  
}
util.inherits(ImplementationClassUIDItem, Item);

ImplementationClassUIDItem.prototype.setImplementationClassUID = function(id) {
  this.implementationClassUID = id;
}

ImplementationClassUIDItem.prototype.readBytes = function(stream, length) {
  var uid = stream.read(C.TYPE_ASCII, length);
  this.setImplementationClassUID(uid);
}

ImplementationClassUIDItem.prototype.getFields = function() {
  return ImplementationClassUIDItem.super_.prototype.getFields.call(this, [new StringField(this.implementationClassUID)]);
}

ImplementationClassUIDItem.prototype.buffer = function() {
  return ImplementationClassUIDItem.super_.prototype.buffer.call(this);
}

ImplementationVersionNameItem = function() {
  this.type = C.ITEM_TYPE_IMPLEMENTATION_VERSION;
  Item.call(this);  
}
util.inherits(ImplementationVersionNameItem, Item);

ImplementationVersionNameItem.prototype.setImplementationVersionName = function(name) {
  this.implementationVersionName = name;
}

ImplementationVersionNameItem.prototype.readBytes = function(stream, length) {
  var name = stream.read(C.TYPE_ASCII, length);
  this.setImplementationVersionName(name);
}

ImplementationVersionNameItem.prototype.getFields = function() {
  return ImplementationVersionNameItem.super_.prototype.getFields.call(this, [new StringField(this.implementationVersionName)]);
}

ImplementationVersionNameItem.prototype.buffer = function() {
  return ImplementationVersionNameItem.super_.prototype.buffer.call(this);
}

MaximumLengthItem = function() {
  this.type = C.ITEM_TYPE_MAXIMUM_LENGTH;
  this.maximumLengthReceived = 32768;
  Item.call(this);  
}
util.inherits(MaximumLengthItem, Item);

MaximumLengthItem.prototype.setMaximumLengthReceived = function(length) {
  this.maximumLengthReceived = length;
}

MaximumLengthItem.prototype.readBytes = function(stream, length) {
  var l = stream.read(C.TYPE_UINT32);
  this.setMaximumLengthReceived(l);
}

MaximumLengthItem.prototype.getFields = function() {
  return MaximumLengthItem.super_.prototype.getFields.call(this, [new UInt32Field(this.maximumLengthReceived)]);
}

MaximumLengthItem.prototype.buffer = function() {
  return MaximumLengthItem.super_.prototype.buffer.call(this);
}

