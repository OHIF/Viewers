var EventEmitter = Npm.require('events').EventEmitter, net = Npm.require('net'), Socket = net.Socket;

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
}

util.inherits(Connection, EventEmitter);

Connection.prototype.addPeer = function(options) {
  if (!options.aeTitle || !options.host || !options.port) {
    return false;
  }
  this.peers[options.aeTitle] = {
    host : options.host, port : options.port
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
    server.listen(options.port, options.host, function(){
        console.log("listening on %j", this.address());
    });
    server.on('error', function(err){
        console.log("server error %j", err);
    });
    var o = this;
    server.on('connection', function(nativeSocket) {
        //incoming connections
        var socket = new CSocket(nativeSocket, o.options);
        o.addSocket(options.aeTitle, socket);

        //close server on close socket
        socket.on('close', function(){
          server.close();
        });
    });
  }
};

Connection.prototype.selectPeer = function(aeTitle) {
    if (!aeTitle || !this.peers[aeTitle]) {
      throw "No such peer";
    }
    return this.peers[aeTitle];
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
    socket.on("close", function() {
      if (o.peerSockets[ae][this.id]) {
        delete o.peerSockets[ae][this.id];
      } 
    });
};

Connection.prototype.associate = function(options, callback) {
    var hostAE = options.hostAE ? options.hostAE : this.defaultPeer,
        sourceAE = options.sourceAE ? options.sourceAE : this.defaultServer;
    if (!hostAE || !sourceAE) {
      throw "Peers not provided or no defaults in settings";
    }

    var peerInfo = this.selectPeer(hostAE), nativeSocket = new Socket();
    var socket = new CSocket(nativeSocket, this.options), o = this;
    if (callback) {
        socket.once('associated', callback);
    }
    socket.setCalledAe(hostAE);
    socket.setCallingAE(sourceAE);

    nativeSocket.connect({
      host : peerInfo.host, port : peerInfo.port
    }, function(){
      //connected
      o.addSocket(hostAE, socket);

      if (options.contexts) {
          socket.setPresentationContexts(options.contexts);
      } else {
          throw "Contexts must be specified";
      }

      socket.associate();
    });

    return socket;
};