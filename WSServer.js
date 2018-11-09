var ws = require("ws");

var WSConnection = require("./WSConnection.js");
var Global = require("./Global.js");

/** Websockets Server
 * @constructor
 * @param {Config} conf - Server configuration
 */
function WSServer(conf) {
    /** @type {Config} Server configuration */
    this.conf = conf;
    /** @type {any} WebSockets Server */
    this.ws = new ws.Server({noServer: true});
}

/** Handles new Websocket Connections
 * @param {WebSocket} s - Incoming connection
 * @param {IncomingMessage} r - HTTP request
 */
WSServer.prototype.onConnect = function (s,r) {
    var conn = new WSConnection(s);

    Global.connectionManager.connect(conn);
}

/** Starts the Websockets Server */
WSServer.prototype.start = function() {
    this.ws.on('connection',this.onConnect.bind(this));
}

/** Handles WebSocket upgrade 
 * @param {IncomingMessage} req - Upgrade request
 * @param {Socket} sock - Connection socket
 * @param {Buffer} head - Header
 */
WSServer.prototype.upgrade = function(req,sock,head) {
    /** @this {WSServer}
     * @param {WebSocket} ws2
     */
    function done(ws2){
	    this.ws.emit('connection',ws2,req);
    }

    this.ws.handleUpgrade(req,sock,head,done.bind(this));
}

module.exports = WSServer;