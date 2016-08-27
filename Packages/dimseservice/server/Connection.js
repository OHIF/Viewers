// Uses NodeJS 'net'
// https://nodejs.org/api/net.html
var net = Npm.require('net'),
    Socket = net.Socket;

var DEFAULT_MAX_PACKAGE_SIZE = 32768;

Connection = function(options) {
    EventEmitter.call(this);
    this.options = Object.assign({
        maxPackageSize: C.DEFAULT_MAX_PACKAGE_SIZE,
        idle: false,
        reconnect: true,
        vr: {
            split: true
        }
    }, options);

    this.peers = {};
    this.peerSockets = {};
    this.defaultPeer = null;
    this.defaultServer = null;
};

util.inherits(Connection, EventEmitter);

var StoreHandle = function() {
    EventEmitter.call(this);
};

util.inherits(StoreHandle, EventEmitter);

Connection.prototype.addPeer = function(options) {
    if (!options.aeTitle || !options.host || !options.port) {
        return false;
    }

    this.peers[options.aeTitle] = {
        host: options.host,
        port: options.port
    };
    if (options.default) {
        if (options.server) {
            this.defaultServer = options.aeTitle;
        } else {
            this.defaultPeer = options.aeTitle;
        }
    }

    if (options.server) {
        //start listening
        var server = net.createServer();
        server.listen(options.port, options.host, function() {
            console.log('listening on %j', this.address());
        });
        server.on('error', function(err) {
            console.log('server error %j', err);
        });
        var o = this;
        server.on('connection', function(nativeSocket) {
            //incoming connections
            var socket = new CSocket(nativeSocket, o.options);
            o.addSocket(options.aeTitle, socket);

            //close server on close socket
            socket.on('close', function() {
                server.close();
            });
        });
    }
};

Connection.prototype.selectPeer = function(aeTitle) {
    if (!aeTitle || !this.peers[aeTitle]) {
        throw 'No such peer';
    }

    return this.peers[aeTitle];
};

Connection.prototype._sendFile = function(socket, sHandle, file, maxSend, metaLength, list) {
    var fileNameText = typeof file.file === 'string' ? file.file : 'buffer';
    console.log('Sending file ' + fileNameText);
    var useContext = socket.getContextByUID(file.context),
 self = this;

    PDU.generatePDatas(useContext.id, file.file, maxSend, null, metaLength, function(err, handle) {
        if (err) {
            console.log('Error while sending file');
            return;
        }

        var processNext = function() {
            var next = list.shift();
            if (next) {
                self._sendFile(socket, sHandle, next, maxSend, metaLength, list);
            } else {
                socket.release();
            }
        };

        var store = socket.storeInstance(useContext.abstractSyntax, file.uid);
        handle.on('pdv', function(pdv) {
            socket.sendPData(pdv);
        });
        handle.on('error', function(err) {
            sHandle.emit('file', err, fileNameText);
            processNext();
        });
        store.on('response', function(msg) {
            var statusText = msg.getStatus().toString(16);
            console.log('STORE reponse with status', statusText);
            var error = null;
            if (msg.failure()) {
                error = new Error(statusText);
            }

            sHandle.emit('file', error, fileNameText);
            processNext();
        });
    });
};

Connection.prototype.storeInstances = function(fileList) {
    var contexts = {},
 read = 0,
 length = fileList.length,
 toSend = [],
 self = this,
 handle = new StoreHandle();
    var lastProcessedMetaLength;
    fileList.forEach(function(bufferOrFile) {
        var fileNameText = typeof bufferOrFile === 'string' ? bufferOrFile : 'buffer';
        DicomMessage.readMetaHeader(bufferOrFile, function(err, metaMessage, metaLength) {
            read++;
            if (err) {
                handle.emit('file', err, fileNameText);
                if (read === length && toSend.length > 0 && lastProcessedMetaLength) {
                    sendProcessedFiles(self, contexts, toSend, handle, lastProcessedMetaLength);
                }

                return;
            }

            console.log('Dicom file ' + (typeof bufferOrFile === 'string' ? bufferOrFile : 'buffer') + ' found');
            lastProcessedMetaLength = metaLength;
            var syntax = metaMessage.getValue(0x00020010),
                sopClassUID = metaMessage.getValue(0x00020002),
                instanceUID = metaMessage.getValue(0x00020003);

            if (!contexts[sopClassUID]) {
                contexts[sopClassUID] = [];
            }

            if (syntax && contexts[sopClassUID].indexOf(syntax) === -1) {
                contexts[sopClassUID].push(syntax);
            }

            toSend.push({
                file: bufferOrFile,
                context: sopClassUID,
                uid: instanceUID
            });

            if (read === length) {
                sendProcessedFiles(self, contexts, toSend, handle, metaLength);
            }
        });
    });
    return handle;
};

// Starts to send dcm files
sendProcessedFiles = function(self, contexts, toSend, handle, metaLength) {
    var useContexts = [];
    for (var context in contexts) {
        var useSyntaxes = contexts[context];
        if (useSyntaxes.length > 0) {
            useContexts.push({
                context: context,
                syntaxes: contexts[context]
            });
        } else {
            throw 'No syntax specified for context ' + context;
        }
    }

    self.associate({
        contexts: useContexts
    }, function(ac) {
        var maxSend = ac.getMaxSize(),
 next = toSend.shift();
        self._sendFile(this, handle, next, maxSend, metaLength, toSend);

    });
};

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
            throw 'Missing store status';
        }
    }
};

Connection.prototype.allClosed = function() {
    var allClosed = true;
    for (var i in o.peerSockets) {
        if (Object.keys(o.peerSockets[ae]).length > 0) {
            allClosed = false;
            break;
        }
    }

    return allClosed;
};

Connection.prototype.addSocket = function(ae, socket) {
    if (!this.peerSockets[ae]) {
        this.peerSockets[ae] = {};
    }

    this.peerSockets[ae][socket.id] = socket;

    var o = this;
    socket.on('close', function() {
        if (o.peerSockets[ae][this.id]) {
            delete o.peerSockets[ae][this.id];
        }
    });
};

Connection.prototype.associate = function(options, callback) {
    var hostAE = options.hostAE ? options.hostAE : this.defaultPeer,
        sourceAE = options.sourceAE ? options.sourceAE : this.defaultServer;

    if (!hostAE || !sourceAE) {
        throw 'Peers not provided or no defaults in settings';
    }

    var peerInfo = this.selectPeer(hostAE),
        nativeSocket = new Socket();

    var socket = new CSocket(nativeSocket, this.options),
        o = this;

    if (callback) {
        socket.once('associated', callback);
    }

    console.log('Starting Connection...');

    socket.setCalledAe(hostAE);
    socket.setCallingAE(sourceAE);

    console.log(peerInfo);

    nativeSocket.connect({
        host: peerInfo.host,
        port: peerInfo.port
    }, function() {
        //connected
        o.addSocket(hostAE, socket);

        if (options.contexts) {
            socket.setPresentationContexts(options.contexts);
        } else {
            throw 'Contexts must be specified';
        }

        socket.associate();
    });

    return socket;
};