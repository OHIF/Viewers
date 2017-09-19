import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

// Uses NodeJS 'net'
// https://nodejs.org/api/net.html
var net = Npm.require('net');
var Socket = net.Socket;

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

    this.reset();
};

util.inherits(Connection, EventEmitter);

var StoreHandle = function() {
    EventEmitter.call(this);
};

util.inherits(StoreHandle, EventEmitter);

Connection.prototype.reset = function() {
    this.defaultPeer = null;
    this.defaultServer = null;

    _.each(this.peers, peerInfo => {
        _.each(peerInfo.sockets, socket => socket.emit('close'));
    });

    this.peers = {};
};

Connection.prototype.addPeer = function(options) {
    if (!options.aeTitle || !options.host || !options.port) {
        return false;
    }

    var peer = {
        host: options.host,
        port: options.port,
        sockets: {}
    };

    this.peers[options.aeTitle] = peer;
    if (options.default) {
        if (options.server) {
            this.defaultServer = options.aeTitle;
        } else {
            this.defaultPeer = options.aeTitle;
        }
    }

    if (options.server) {
        //start listening
        peer.server = net.createServer();
        peer.server.listen(options.port, options.host, function() {
            OHIF.log.info('listening on', this.address());
        });
        peer.server.on('error', function(err) {
            OHIF.log.info('server error', err);
        });
        peer.server.on('connection', nativeSocket => {
            //incoming connections
            var socket = new CSocket(nativeSocket, this.options);
            this.addSocket(options.aeTitle, socket);

            //close server on close socket
            socket.on('close', function() {
                peer.server.close();
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
    OHIF.log.info(`Sending file ${fileNameText}`);
    var useContext = socket.getContextByUID(file.context);
    var self = this;

    PDU.generatePDatas(useContext.id, file.file, maxSend, null, metaLength, function(err, handle) {
        if (err) {
            OHIF.log.info('Error while sending file');
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
            OHIF.log.info('STORE reponse with status', statusText);
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
    var contexts = {};
    var read = 0;
    var length = fileList.length;
    var toSend = [];
    var self = this;
    var handle = new StoreHandle();
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

            OHIF.log.info(`Dicom file ${(typeof bufferOrFile === 'string' ? bufferOrFile : 'buffer')} found`);
            lastProcessedMetaLength = metaLength;
            var syntax = metaMessage.getValue(0x00020010);
            var sopClassUID = metaMessage.getValue(0x00020002);
            var instanceUID = metaMessage.getValue(0x00020003);

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
    _.each(contexts, (useSyntaxes, context) => {
        if (useSyntaxes.length > 0) {
            useContexts.push({
                context: context,
                syntaxes: useSyntaxes
            });
        } else {
            throw 'No syntax specified for context ' + context;
        }
    });

    self.associate({
        contexts: useContexts
    }, function(ac) {
        var maxSend = ac.getMaxSize();
        var next = toSend.shift();
        self._sendFile(this, handle, next, maxSend, metaLength, toSend);

    });
};

Connection.prototype.storeResponse = function(messageId, msg) {
    var rq = this.messages[messageId];

    if (rq.listener[2]) {
        var status = rq.listener[2].call(this, msg);
        if (status !== undefined && status !== null && rq.command.store) {
            //store ok, ready to send c-store-rsp
            var storeSr = rq.command.store;
            var replyMessage = storeSr.replyWith(status);
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
    for (var i in this.peers) {
        if (Object.keys(peers[i].sockets).length > 0) {
            allClosed = false;
            break;
        }
    }

    return allClosed;
};

Connection.prototype.addSocket = function(hostAE, socket) {
    var peerInfo = this.selectPeer(hostAE);

    peerInfo.sockets[socket.id] = socket;

    socket.on('close', function() {
        if (peerInfo.sockets[this.id]) {
            delete peerInfo.sockets[this.id];
        }
    });
};

Connection.prototype.associate = function(options, callback) {
    const self = this;
    var hostAE = options.hostAE ? options.hostAE : this.defaultPeer;
    var sourceAE = options.sourceAE ? options.sourceAE : this.defaultServer;

    if (!hostAE || !sourceAE) {
        throw 'Peers not provided or no defaults in settings';
    }

    var peerInfo = this.selectPeer(hostAE);
    var nativeSocket = new Socket();

    var socket = new CSocket(nativeSocket, this.options);

    if (callback) {
        socket.once('associated', callback);
    }

    OHIF.log.info('Starting Connection...');

    socket.setCalledAe(hostAE);
    socket.setCallingAE(sourceAE);

    nativeSocket.connect({
        host: peerInfo.host,
        port: peerInfo.port
    }, () => {
        //connected
        this.addSocket(hostAE, socket);

        if (options.contexts) {
            socket.setPresentationContexts(options.contexts);
        } else {
            throw new Meteor.Error('Contexts must be specified');
        }

        socket.associate();
    });

    return socket;
};
