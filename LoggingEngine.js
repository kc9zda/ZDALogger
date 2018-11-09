var OperatorLog = require("./OperatorLog.js");
var Global = require("./Global.js");

/** Initializes logging engine
 * @constructor
 */
function LoggingEngine() {
    /** @type {Object.<string,Object.<string,OperatorLog>>} */
    this.logs = {}; // TODO: init logs
}

/** Logs and broadcasts a QSO in the respective operator's log
 * @param {object} qso - QSO object
 */
LoggingEngine.prototype.submit = function(qso) {
    var oplog = this.getOperatorLog(qso.fmcallsign, qso.fmoperator);

    oplog.submit(qso);
    Global.connectionManager.broadcastQSO(qso);
}

/** Retrieves (and loads, if necessary) an operator's log
 * @param {string} call - Callsign
 * @param {string} op - Operator
 * @return {OperatorLog} Operator's log
 */
LoggingEngine.prototype.getOperatorLog = function(call,op) {
    var c,o;

    if (this.logs[call] == undefined) {
        this.logs[call] = {};
    }
    c = this.logs[call];
    o = c[op];
    if (o == undefined) {
        this.logs[call][op] = new OperatorLog(call,op);
        o = this.logs[call][op];
    }

    return o;
}

/** Gets log for session ID
 * @param {string} ses - Session ID
 * @return {OperatorLog} Log for operator specified in session
 */
LoggingEngine.prototype.getLogForSession = function(ses) {
    var s,c,o,l;

    s = Global.authenticator.getSession(ses);
    if (s==undefined) {
        return undefined;
    }
    c = s.callsign;
    o = s.operator;
    l = this.getOperatorLog(c,o);
    l.loadLog();
    return l;
}

module.exports = LoggingEngine;