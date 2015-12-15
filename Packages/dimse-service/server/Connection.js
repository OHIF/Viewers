var EventEmitter = Npm.require('events').EventEmitter;

function time() {
    return Math.floor(Date.now() / 1000);
}

var DEFAULT_MAX_PACKAGE_SIZE = 32768;
var DEFAULT_SOURCE_AE = "OHIFDCM";

var Envelope = function(conn, command, dataset) {
    EventEmitter.call(this);
    this.command = command;
    this.dataset = dataset;
    this.conn = conn;
}
util.inherits(Envelope, EventEmitter);

Envelope.prototype.send = function() {
    return this;
}

Connection = function(socket, options) {
    EventEmitter.call(this);
    this.socket = socket;
    this.options = Object.assign({
        hostAE: "",
        sourceAE: "OHIFDCM",
        maxPackageSize: 32768,
        idle: 60,
        reconnect: true,
        vr: {
            split: true
        }
    }, options);

    this.connected = false;
    this.started = null;
    this.lastReceived = null;
    this.associated = false;
    this.receiving = null;
    this.receiveLength = null;
    this.minRecv = null;
    this.pendingPDVs = null;
    this.server = null;
    //this.retrieveModel = RETRIEVE_MODEL_STUDY_ROOT;
    this.presentationContexts = [];
    this.transferSyntaxes = [];
    this.negotiatedContexts = {};
    this.messages = {};
    this.messageIdCounter = 0;
    this.services = [];
    this.lastCommand = null;
    this.lastSent = null;
    this.lastGets = [];
    this.findContext = C.SOP_STUDY_ROOT_FIND;

    //register hooks
    var o = this;
    this.socket.on("data", function(data) {
        o.received(data);
    });
    this.socket.on("close", function(he) {
        o.closed(he);
        o.emit("close", he);
    });
    this.socket.on("error", function(he) {
        o.error(he);
    });
    this.socket.on("end", function() {
        if (o.intervalId) {
            clearInterval(o.intervalId);
        }
        if (o.server) {
            console.log("Closing server");
            o.server.close();
        }
        console.log('ended');
    })
    this.on("released", function() {
        this.released();
    });
    this.on('aborted', function() {
        this.released();
    })
    this.on('message', function(pdvs) {
        this.receivedMessage(pdvs);
    });
    this.on("init", this.ready);

    //this.pause();
    if (this.options.listenHost && this.options.listenPort) {
        this.server = net.createServer();
        this.server.listen(this.options.listenPort, this.options.listenHost);
        this.server.on('listening', function() {
            console.log("listening on %j", this.address());
        });
        this.server.on('connection', function(socket) {

        });
    }
    this.emit("init");
}

util.inherits(Connection, EventEmitter);

Connection.prototype.checkIdle = function() {
    var current = time(),
        idl = this.options.idle;
    if (!this.lastReceived && (current - this.started >= idl)) {
        this.idleClose();
    } else if (this.lastReceived && (current - this.lastReceived >= idl)) {
        this.idleClose();
    } else {
        //console.log('keep idling')
    }
};

Connection.prototype.released = function() {
    this.socket.end();
};

Connection.prototype.idleClose = function() {
    console.log('Exceed idle time, closing connection');
    this.release();
};

Connection.prototype.getSoureceAE = function() {
    return this.options.sourceAE;
};

Connection.prototype.ready = function() {
    console.log("Connection established");
    this.connected = true;
    this.started = time();

    var o = this;
    this.intervalId = setInterval(function() {
        o.checkIdle();
    }, 3000);

    //this.emit("init");
    //this.startAssociationRequest();
};

Connection.prototype.resetReceive = function() {
    this.receiving = this.receiveLength = null;
};

Connection.prototype.received = function(data) {
    var i = 0;
    do {
        data = this.process(data);
    } while (data !== null);
    this.lastReceived = time();
};

Connection.prototype.process = function(data) {
    //console.log("Data received");
    if (this.receiving === null) {
        if (this.minRecv) {
            data = Buffer.concat([this.minRecv, data], this.minRecv.length + data.length);
            this.minRecv = null;
        }

        if (data.length < 6) {
            this.minRecv = data;
            return null;
        }

        var stream = new ReadStream(data);
        var type = stream.read(C.TYPE_UINT8);
        stream.increment(1);
        var len = stream.read(C.TYPE_UINT32),
            cmp = data.length - 6;
        if (len > cmp) {
            this.receiving = data;
            this.receiveLength = len;
        } else {
            var process = data,
                remaining = null;
            if (len < cmp) {
                process = data.slice(0, len + 6);
                remaining = data.slice(len + 6, cmp + 6);
            }
            this.resetReceive();
            this.interpret(new ReadStream(process));
            if (remaining) {
                return remaining;
            }
        }
    } else {
        var newData = Buffer.concat([this.receiving, data], this.receiving.length + data.length),
            pduLength = newData.length - 6;

        if (pduLength < this.receiveLength) {
            this.receiving = newData;
        } else {
            var remaining = null;
            if (pduLength > this.receiveLength) {
                remaining = newData.slice(this.receiveLength + 6, pduLength + 6);
                newData = newData.slice(0, this.receiveLength + 6);
            }
            this.resetReceive();
            this.interpret(new ReadStream(newData));
            if (remaining) {
                return remaining;
            }
        }
    }
    return null;
};

Connection.prototype.interpret = function(stream) {
    var pdatas = [],
        size = stream.size(),
        o = this;
    while (stream.offset < size) {
        var pdu = pduByStream(stream);
        //console.log("Received PDU-TYPE " + pdu.type);
        if (pdu.is(C.ITEM_TYPE_PDU_ASSOCIATE_AC)) {
            pdu.presentationContextItems.forEach(function(ctx) {
                var requested = o.getContext(ctx.presentationContextID);
                if (!requested) {
                    throw "Accepted presentation context not found";
                }
                o.negotiatedContexts[ctx.presentationContextID] = {
                    id: ctx.presentationContextID,
                    transferSyntax: ctx.transferSyntaxesItems[0].transferSyntaxName,
                    abstractSyntax: requested.abstractSyntax
                };

                var notfound = false;
                o.services.forEach(function(service) {
                    if (service.contextUID == requested.abstractSyntax) {
                        service.contextID = ctx.presentationContextID;
                    }
                });
            });

            //console.log('Accepted');
            this.associated = true;
            this.emit('associated', pdu);
        } else if (pdu.is(C.ITEM_TYPE_PDU_RELEASE_RP)) {
            //console.log('Released');
            this.associated = false;
            this.emit('released');
        } else if (pdu.is(C.ITEM_TYPE_PDU_AABORT)) {
            //console.log('Aborted');
            this.emit('aborted');
        } else if (pdu.is(C.ITEM_TYPE_PDU_PDATA)) {
            pdatas.push(pdu);
        }
    }

    if (pdatas) {
        var pdvs = this.pendingPDVs ? this.pendingPDVs : [];
        pdatas.forEach(function(pdata) {
            pdvs = pdvs.concat(pdata.presentationDataValueItems);
        });
        this.pendingPDVs = null;
        var i = 0,
            count = pdvs.length;
        while (i < count) {
            if (!pdvs[i].isLast) {
                var j = i + 1;
                while (j < count) {
                    pdvs[i].messageStream.concat(pdvs[j].messageStream);
                    if (pdvs[j++].isLast) {
                        pdvs[i].isLast = true;
                        break;
                    }
                }
                if (pdvs[i].isLast) {
                    this.emit('message', pdvs[i]);
                } else {
                    this.pendingPDVs = [pdvs[i]];
                }
                i = j;
            } else {
                this.emit('message', pdvs[i++]);
            }
        }
    }

    //this.release();
};

Connection.prototype.newMessageId = function() {
    return (++this.messageIdCounter) % 255;
}

Connection.prototype.closed = function(had_error) {
    this.connected = false;
    console.log("Connection closed", had_error);
    //this.destroy();
}

Connection.prototype.error = function(err) {
    console.log("Error: ", err);
}

Connection.prototype.send = function(pdu, afterCbk) {
    //console.log('SEND PDU-TYPE: ', pdu.type);
    var toSend = pdu.buffer();
    //console.log('send buffer', toSend.toString('hex'));
    this.socket.write(toSend, afterCbk ? afterCbk : function() {
        //console.log('Data written');
    });
}

Connection.prototype.getSyntax = function(contextId) {
    if (!this.negotiatedContexts[contextId]) return null;

    return this.negotiatedContexts[contextId].transferSyntax;
}

Connection.prototype.getContextByUID = function(uid) {
    for (var k in this.negotiatedContexts) {
        var ctx = this.negotiatedContexts[k];
        if (ctx.abstractSyntax == uid) {
            return ctx;
        }
    }
    return null;
}

Connection.prototype.getContextId = function(contextId) {
    if (!this.negotiatedContexts[contextId]) return null;

    return this.negotiatedContexts[contextId].id;
}

Connection.prototype.getContext = function(id) {
    for (var k in this.presentationContexts) {
        var ctx = this.presentationContexts[k];
        if (id == ctx.id) return ctx;
    }
    return null;
}

Connection.prototype.setPresentationContexts = function(uids) {
    var contexts = [],
        id = 0;
    uids.forEach(function(uid) {
        contexts.push({
            id: ++id,
            abstractSyntax: uid,
            transferSyntaxes: [C.IMPLICIT_LITTLE_ENDIAN, C.EXPLICIT_LITTLE_ENDIAN, C.EXPLICIT_BIG_ENDIAN]
        });
    });
    this.presentationContexts = contexts;
}

Connection.prototype.verify = function() {
    this.setPresentationContexts([C.SOP_VERIFICATION]);
    this.startAssociationRequest(function() {
        //associated, we can release now
        this.release();
    });
}

Connection.prototype.release = function() {
    var releaseRQ = new ReleaseRQ();
    this.send(releaseRQ);
}

Connection.prototype.addService = function(service) {
    service.setConnection(this);
    this.services.push(service);
}

Connection.prototype.receivedMessage = function(pdv) {
    var syntax = this.getSyntax(pdv.contextId),
        msg = readMessage(pdv.messageStream, pdv.type, syntax, this.options.vr);

    if (msg.isCommand()) {
        this.lastCommand = msg;

        if (msg.isResponse()) {
            if (msg.is(C.COMMAND_C_GET_RSP) || msg.is(C.COMMAND_C_MOVE_RSP)) {
                //console.log('remaining', msg.getNumOfRemainingSubOperations(), msg.getNumOfCompletedSubOperations());
            }
            if (msg.failure()) {
                //console.log("message failed with status ", msg.getStatus().toString(16));
            }
            if (msg.isFinal()) {
                var replyId = msg.respondedTo();
                if (this.messages[replyId].listener) {
                    this.messages[replyId].listener.emit('end', msg);
                    /*if (this.messages[replyId].listener[1]) {
            this.messages[replyId].listener[1].call(this, msg);
          }*/
                    if (!msg.haveData())
                        delete this.messages[replyId];
                }

                if (msg.is(C.COMMAND_C_GET_RSP)) {
                    if (!msg.getNumOfRemainingSubOperations()) {
                        if (this.lastGets && this.lastGets.length > 0) this.lastGets.shift();
                    }
                }
            }
        } else {
            /*if (msg.is(0x01)) {
        console.log('ae title ', msg.getValue(0x00001031))
      }*/
        }

    } else {
        if (!this.lastCommand) {
            throw "Only dataset?";
        } else if (!this.lastCommand.haveData()) {
            throw "Last command didn't indicate presence of data";
        }

        if (this.lastCommand.isResponse()) {
            var replyId = this.lastCommand.respondedTo();
            if (this.messages[replyId].listener) {
                var flag = this.lastCommand.failure() ? true : false;

                this.messages[replyId].listener.emit("result", msg, flag);

                if (this.lastCommand.failure()) {
                    delete this.messages[replyId];
                }
            }
        } else {
            if (this.lastCommand.is(C.COMMAND_C_STORE_RQ)) {
                var moveMessageId = this.lastCommand.getMoveMessageId(),
                    useId = moveMessageId;
                if (!moveMessageId) {
                    //!! Going to deprecate now
                    //kinda hacky but we know this c-store is came from a c-get
                    if (this.lastGets.length > 0) {
                        useId = this.lastGets[0];
                    } else {
                        throw "Where does this c-store came from?";
                    }
                } else console.log('move ', moveMessageId);
                //this.storeResponse(useId, msg);
            }
        }
    }
}

Connection.prototype.storeResponse = function(messageId, msg) {
    var rq = this.messages[messageId];

    if (rq.listener[2]) {
        var status = rq.listener[2].call(this, msg);
        if (status !== undefined && status !== null && rq.command.store) {
            //store ok, ready to send c-store-rsp
            var storeSr = rq.command.store,
                replyMessage = storeSr.replyWith(status);
            replyMessage.setAffectedSOPInstanceUID(this.lastCommand.getSOPInstanceUID());
            replyMessage.setReplyMessageId(this.lastCommand.messageId);
            this.sendMessage(replyMessage, null, null, storeSr);
        } else {
            throw "Missing store status";
        }
    }
}

Connection.prototype.sendMessage = function(context, command, dataset, listener) {
    var nContext = this.getContextByUID(context),
        syntax = nContext.transferSyntax,
        cid = nContext.id,
        messageId = this.newMessageId(),
        msgData = {};

    /*if (listener) {
    if (typeof listener != 'object') {
      listener = [listener, null];
    }
    msgData.listener = listener;
  }*/
    msgData.listener = new Envelope();

    var pdata = new PDataTF(),
        pdv = new PresentationDataValueItem(cid);

    command.setSyntax(C.IMPLICIT_LITTLE_ENDIAN);
    command.setContextId(context);
    command.setMessageId(messageId);
    if (dataset)
        command.setDataSetPresent(C.DATA_SET_PRESENT);

    this.lastSent = command;
    if (command.is(C.COMMAND_C_GET_RQ)) {
        this.lastGets.push(messageId);
    }
    pdv.setMessage(command);
    pdata.setPresentationDataValueItems([pdv]);

    msgData.command = command;
    this.messages[messageId] = msgData;

    /*var stream = new ReadStream(pdata.buffer()), np = pduByStream(stream), pdv = np.presentationDataValueItems[0];
  var msg = readMessage(pdv.messageStream, pdv.type, C.IMPLICIT_LITTLE_ENDIAN);
  console.log(msg.isCommand());
  return;*/

    this.send(pdata);
    if (dataset) {
        dataset.setSyntax(syntax);
        var dsData = new PDataTF(),
            dPdv = new PresentationDataValueItem(cid);

        dPdv.setMessage(dataset);
        dsData.setPresentationDataValueItems([dPdv]);
        this.send(dsData);
    }
    return msgData.listener;
};

Connection.prototype.associate = function(options, callback) {
    if (callback) {
        this.once('associated', callback);
    }
    if (this.associated) {
        this.emit('associated');
        return;
    }

    if (options.contexts) {
        this.setPresentationContexts(options.contexts);
    } else {
        throw "No services attached";
    }

    var associateRQ = new AssociateRQ();
    associateRQ.setCalledAETitle(options.hostAE);
    var sourceAE = options.sourceAE ? options.sourceAE : DEFAULT_SOURCE_AE;
    associateRQ.setCallingAETitle(sourceAE);
    associateRQ.setApplicationContextItem(new ApplicationContextItem());

    var contextItems = []
    this.presentationContexts.forEach(function(context) {
        var contextItem = new PresentationContextItem(),
            syntaxes = [];
        context.transferSyntaxes.forEach(function(transferSyntax) {
            var transfer = new TransferSyntaxItem();
            transfer.setTransferSyntaxName(transferSyntax);
            syntaxes.push(transfer);
        });
        contextItem.setTransferSyntaxesItems(syntaxes);
        contextItem.setPresentationContextID(context.id);

        var abstractItem = new AbstractSyntaxItem();
        abstractItem.setAbstractSyntaxName(context.abstractSyntax);
        contextItem.setAbstractSyntaxItem(abstractItem);
        contextItems.push(contextItem);
    });
    associateRQ.setPresentationContextItems(contextItems);

    var maxLengthItem = new MaximumLengthItem(),
        classUIDItem = new ImplementationClassUIDItem(),
        versionItem = new ImplementationVersionNameItem();

    classUIDItem.setImplementationClassUID(C.IMPLEM_UID);
    versionItem.setImplementationVersionName(C.IMPLEM_VERSION);
    var packageSize = options.maxPackageSize ? options.maxPackageSize : DEFAULT_MAX_PACKAGE_SIZE;
    maxLengthItem.setMaximumLengthReceived(packageSize);

    var userInfo = new UserInformationItem();
    userInfo.setUserDataItems([maxLengthItem, classUIDItem, versionItem]);

    associateRQ.setUserInformationItem(userInfo);

    this.send(associateRQ);
}

Connection.prototype.wrapMessage = function(data) {
    if (data) {
        var datasetMessage = new DataSetMessage();
        datasetMessage.setElements(data);
        return datasetMessage;
    } else return data;
}

Connection.prototype.setFindContext = function(ctx) {
    this.findContext = ctx;
}

Connection.prototype.find = function(params, callback) {
    return this.sendMessage(this.findContext, new CFindRQ(), this.wrapMessage(params), callback);
}

Connection.prototype.findPatients = function(params, callback) {
    var sendParams = Object.assign({
        0x00080052: C.QUERY_RETRIEVE_LEVEL_PATIENT,
        0x00100010: "",
        0x00100020: "",
        0x00100030: "",
        0x00100040: "",
    }, params);

    return this.find(sendParams, callback);
}

Connection.prototype.findStudies = function(params, callback) {
    var sendParams = Object.assign({
        0x00080052: C.QUERY_RETRIEVE_LEVEL_STUDY,
        0x00080020: "",
        0x00100010: "",
        0x00080061: "",
        0x0020000D: ""
    }, params);

    return this.find(sendParams, callback);
}

Connection.prototype.findSeries = function(params, callback) {
    var sendParams = Object.assign({
        0x00080052: C.QUERY_RETRIEVE_LEVEL_SERIES,
        0x00080020: "",
        0x0020000E: "",
        0x0008103E: "",
        0x0020000D: ""
    }, params);

    return this.find(sendParams, callback);
}

Connection.prototype.findInstances = function(params, callback) {
    var sendParams = Object.assign({
        0x00080052: C.QUERY_RETRIEVE_LEVEL_IMAGE,
        0x00080020: "",
        0x0020000E: "",
        0x0008103E: "",
        0x0020000D: ""
    }, params);

    return this.find(sendParams, callback);
}