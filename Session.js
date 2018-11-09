var Global = require("./Global.js");

/** Creates an object that contains information about the particular session
 * @constructor
 * @param {string} callsign - Callsign
 * @param {string} [operator] - Operator
 */
function Session(callsign, operator) {
    /** @type {string} Station callsign */
    this.callsign = callsign || "NOCALL";
    /** @type {string} Operator callsign */
    this.operator = operator || this.callsign;
    /** @type {string} Session ID */
    this.id = "DEFAULT";
    /** @type {boolean} True if waiting for client to reconnect */
    this.waitReconnect = false;
    /** @type {any} Reconnection timeout */
    this.reconnectTimeout = null;
}

/** Marks session as reconnected and cancels timeout */
Session.prototype.connect = function() {
    //if ()
    if (this.waitReconnect) {
        clearTimeout(this.reconnectTimeout);
        this.waitReconnect = false;
    }
}

/** Marks session as disconnected and starts timeout */
Session.prototype.disconnect = function() {
    function cb() {
        Global.authenticator.logoutSession(this.id);
    }

    this.waitReconnect = true;
    this.reconnectTimeout = setTimeout(cb.bind(this),1000*30); // 30 seconds, todo: config this
}

module.exports = Session;