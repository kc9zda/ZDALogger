/** @typedef {import("./WSConnection")} WSConnection */

/** Initializes connection manager
 * @constructor
 */
function ConnectionManager() {
    /** @type {WSConnection[]} Connection array */
    this.connections = [];
    /** @type {number} Connection ID counter */
    this.connidcount = 1;
}

/** Register new WebSocket connection
 * @param {WSConnection} conn - Connection to add to list
 */
ConnectionManager.prototype.connect = function(conn) {
    conn.uid = this.connidcount++;
    conn.manager = this;
    this.connections.push(conn);
}

/** Broadcast a QSO to all connected clients (with correct filters)
 * @param {object} qso - Object containing information about the QSO to be broadcast
 */
ConnectionManager.prototype.broadcastQSO = function(qso) {
    qso.cmd = "feed";

    for (var i=0;i<this.connections.length;i++) {
        this.connections[i].feedQSO(qso);
    }
}

/** Removes connection from list
 * @param {number} uid - Connection ID
 */
ConnectionManager.prototype.disconnect = function(uid) {
    var idx = -1;
    for (var i=0;i<this.connections.length;i++) {
        if (this.connections[i].uid == uid) {
            idx = i;
            break;
        }
    }
    if (idx>=0) {
        this.connections.splice(idx,1);
    }
}

/** Broadcast chat to a specific callsign
 * @param {string} callsign - Callsign to send chat to
 * @param {object} obj - Chat message
 */
ConnectionManager.prototype.broadcastChat = function(callsign, obj) {
    obj.cmd = "chat";

    for (var i=0;i<this.connections.length;i++) {
        if (this.connections[i].callsign == callsign) {
            this.connections[i].send_message(obj);
        }
    }
}

/** Update online list for all operators of a specific callsign
 * @param {string} callsign - Callsign
 */
ConnectionManager.prototype.updateOnline = function(callsign) {
    var ol = [], o = {};

    // generate list
    for (var i=0;i<this.connections.length;i++) {
        if (this.connections[i].callsign == callsign) {
            o = {};
            o.operator = this.connections[i].operator;
            o.band = this.connections[i].band;
            o.mode = this.connections[i].mode;
            ol.push(o);
        }
    }
    o = {};
    o.cmd = "online";
    o.online = ol;

    // send list
    for (var i=0;i<this.connections.length;i++) {
        if (this.connections[i].callsign == callsign) {
            this.connections[i].send_message(o);
        }
    }
}

module.exports = ConnectionManager;