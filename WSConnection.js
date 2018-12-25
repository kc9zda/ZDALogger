var Global = require("./Global.js");

/** Stores information about a WebSocket connection
 * @constructor
 * @param {WebSocket} sock - Websocket Connection
 */
function WSConnection(sock) {
    /** @type {WebSocket} Websocket Connection */
    this.sock = sock;
    /** @type {string} Session ID */
    this.session = "INVALID";
    /** @type {string} Log type */
    this.logtype = "normal";
    /** @type {string} Current band */
    this.band = "20m";
    /** @type {string} Current mode */
    this.mode = "SSB";
    /** @type {number} Current filter setting */
    this.filter_mode = 0;
    
    this.sock.on('message',this.onmessage.bind(this));
    this.sock.on('close',this.onclose.bind(this));
}

/** Callback for received message from WebSockets
 * @param {string} msg - Received message
 */
WSConnection.prototype.onmessage = function(msg) {
    var o = JSON.parse(msg);

    console.log(msg);
    switch(o.cmd) {
        case "join":
            this.join(o);
            break;
        case "mode":
            this.setMode(o);
            break;
        case "qso":
            this.qso(o);
            break;
        case "chat":
            this.chat(o);
            break;
        case "delete":
            this.delqso(o);
            break;
        case "filter":
            this.filter(o);
            break;
        case "stainfo":
            this.msg_stainfo(o);
            break;
        case "settings":
            this.msg_settings(o);
            break;
        default:
            console.log("unknown ws cmd: "+o.cmd);
            break;
    }
}

/** Handler for join message
 * @param {object} obj - received message
 * @param {string} obj.session - Session ID
 * @param {string} obj.logtype - Log type
 */
WSConnection.prototype.join = function(obj) {
    this.session = obj.session;
    this.logtype = obj.logtype;
     if (this.logtype == "contest") this.contest = obj.contest;
    // this.isStatus = false;
    if (Global.authenticator.getSession(obj.session) == undefined) {
        //this.session = "DEFAULT";
        this.redir("/login");
        return;
    }
    Global.authenticator.connect(obj.session);
    this.sendSettings(this.session);
    this.sendLog(this.session);
    this.callsign = Global.authenticator.getSession(this.session).callsign;
    this.operator = Global.authenticator.getSession(this.session).operator;
    this.manager.updateOnline(this.callsign);
}

/** Sets band/mode for the connection
 * @param {object} obj - Received message
 * @param {string} obj.band - New band
 * @param {string} obj.mode - New mode
 */
WSConnection.prototype.setMode = function(obj) {
    this.band = obj.band;
    this.mode = obj.mode;
    Global.settingsManager.updateMode(this.session, this.mode, this.band);
    this.manager.updateOnline(this.callsign);
}

/** Handles received QSO
 * @param {object} obj - Received message
 * @param {string} obj.session - Session ID
 * @param {string} obj.callsign - Callsign
 * @param {number} obj.timestamp - Timestamp
 * @param {string} obj.comment - Comment
 */
WSConnection.prototype.qso = function(obj) {
    var qso_obj = {};
    var session = Global.authenticator.getSession(obj.session);

    if (session == undefined) {
        console.log("unable to find session "+obj.session);
        return;
    }
    qso_obj.fmcallsign = this.callsign;
    qso_obj.fmoperator = this.operator;
    qso_obj.contest = this.contest;
    qso_obj.band = this.band;
    qso_obj.mode = this.mode;
    qso_obj.dxcallsign = obj.callsign;
    qso_obj.timestamp = obj.timestamp;
    qso_obj.comment = obj.comment;
    Global.logger.submit(qso_obj);
}

/** Checks feed filter and sends QSO to client
 * @param {object} qso - QSO to send
 */
WSConnection.prototype.feedQSO = function(qso) {
    if(!this.checkFilter(qso.fmcallsign, qso.fmoperator)) return;
    qso.mine = (this.callsign == qso.fmcallsign && this.operator == qso.fmoperator);
    qso.cmd = "feed";
    this.send_message(qso);
}

/** Sends object as JSON to client
 * @param {object} obj - Message to send
 * @param {string} obj.cmd - Message type
 */
WSConnection.prototype.send_message = function(obj) {
    this.sock.send(JSON.stringify(obj));
}

/** Sends log for session 
 * @param {string} ses - Session ID
 */
WSConnection.prototype.sendLog = function(ses) {
    var log = Global.logger.getLogForSession(ses);
    var o = {};

    o.cmd = "log";
    if (log==undefined) {
        o.log = [];
    } else {
        o.log = log.log || [];
    }
    if (o.log.length > 100) { // todo configure
        o.log.splice(0,o.log.length-100);
    }
    this.send_message(o);
}

/** Disconnect handler for WebSockets connection */
WSConnection.prototype.onclose = function() {
    Global.authenticator.disconnect(this.session);
    this.manager.disconnect(this.uid);
    this.manager.updateOnline(this.callsign);
}

/** Handler for received chat messages
 * @param {object} obj - Received message
 * @param {string} obj.message - Chat text
 */
WSConnection.prototype.chat = function(obj) {
    var o2 = {};

    if (this.session.indexOf("DEFAULT")>=0 || this.session.indexOf("INVALID")>=0) return;
    o2.message = "<b>"+this.operator+"</b>&nbsp;"+obj.message;
    this.manager.broadcastChat(this.callsign, o2);
}

/** Sends redirect message to client
 * @param {string} p - Path to redirect to
 */
WSConnection.prototype.redir = function(p) {
    var o = {};

    o.cmd = "redir";
    o.redir = p;
    this.send_message(o);
}

/** Handles deletion of a log entry
 * @param {object} obj - Received message
 * @param {number} obj.id - QSO id
 */
WSConnection.prototype.delqso = function(obj) {
    var log = Global.logger.getLogForSession(this.session);

    log.deleteQSO(obj.id);
    this.sendLog(this.session);
}

/** Handles new filter settings
 * @param {object} obj - Received message
 * @param {number} obj.filter - Filter mode
 */
WSConnection.prototype.filter = function(obj) {
    this.filter_mode = obj.filter;
}

/** Checks if callsign/operator combo is valid for user's filter
 * @param {string} cs - Callsign
 * @param {string} op - Operator
 * @return {boolean} True if passes filter
 */
WSConnection.prototype.checkFilter = function(cs,op) {
    switch(this.filter_mode) {
        case 0:
            return (cs == this.callsign && op == this.operator);
        case 1:
            return (cs == this.callsign);
        case 2:
        default:
            return true;
    }
}

/** Handles new Station Info
 * @param {object} obj - Receieved message
 */
WSConnection.prototype.msg_stainfo = function(obj) {
    this.stainfo = obj.stainfo;
    Global.settingsManager.updateStaInfo(this.session,this.stainfo);
}

/** Handles new settings 
 * @param {object} obj - Received message
 */
WSConnection.prototype.msg_settings = function(obj) {
    this.settings = obj.settings;
    Global.settingsManager.updateSettings(this.session,this.settings);
}

/** Sends saved settings and station info to newly joined client
 * @param {string} ses - Session id
 */
WSConnection.prototype.sendSettings = function(ses) {
    var set = Global.settingsManager.getSettingsForSession(ses);
    var sa = Global.settingsManager.getStaInfoForSession(ses);
    var mode = Global.settingsManager.getModeForSession(ses);
    var band = Global.settingsManager.getBandForSession(ses);

    var o = {};
    o.cmd = "settings";
    o.settings = set;
    this.send_message(o);

    o = {};
    o.cmd = "stainfo";
    o.stainfo = sa;
    this.send_message(o);

    o = {};
    o.cmd = "mode";
    o.mode = mode;
    o.band = band;
    this.send_message(o);
}

module.exports = WSConnection;