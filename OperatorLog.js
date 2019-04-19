var fs = require("fs");

/** Initializes a log for a particular operator using a particular callsign
 * @constructor
 * @param {string} callsign 
 * @param {string} operator 
 */
function OperatorLog(callsign,operator) {
    /** @type {string} Station callsign */
    this.callsign = callsign;
    /** @type {string} Operator callsign */
    this.operator = operator;
    /** @type {object[]} Log */
    this.log = [];
    /** @type {boolean} True if log is in memory at log[] */
    this.isLoaded = false;
    /** @type {string} Log filename */
    this.logFilename = "logs/"+callsign+"_"+operator+".json";
    /** @type {number} Max log entry ID in the log */
    this.maxId = -1;
}

/** Submits a QSO to the operator's log
 * @param {object} qso - QSO to submit
 */
OperatorLog.prototype.submit = function(qso) {
    if (qso.fmcallsign != this.callsign) return;
    if (qso.fmoperator != this.operator) return;
    if (!this.isLoaded) this.loadLog();

    qso.cmd = undefined;
    qso.mine = true;
    qso.mystation = true;
    qso.id = ++this.maxId;
    this.log.push(qso);
    fs.writeFileSync(this.logFilename, JSON.stringify(this.log));
}

/** Loads the operator's log from the file system */
OperatorLog.prototype.loadLog = function() {
    var s;
    var maxId = -1;

    if (this.isLoaded) return;
    if (!fs.existsSync("logs")) {
        fs.mkdirSync("logs");
    }
    if (!fs.existsSync(this.logFilename)) return;
    s = fs.readFileSync(this.logFilename, "utf8");
    if (s.length > 0) this.log = JSON.parse(s);
    for (var i=0;i<this.log.length;i++) {
        if (this.log[i].id && this.log[i].id>maxId) {
            maxId = this.log[i].id;
        }
    }
    for (var i=0;i<this.log.length;i++) {
        if (this.log[i].id==undefined) {
            this.log[i].id = ++maxId;
        }
    }
    this.isLoaded = true;
    this.maxId = maxId;
}

/** Deletes the QSO in the log with a specific ID
 * @param {number} id - ID of QSO to delete
 */
OperatorLog.prototype.deleteQSO = function(id) {
    for (var i=0;i<this.log.length;i++) {
        if (this.log[i].id == id) {
            this.log.splice(i,1);
        }
    }
    fs.writeFileSync(this.logFilename, JSON.stringify(this.log));
}

/** Updates existing QSO
 * @param {object} obj - Parameters
 * @param {number} obj.id - QSO ID to edit
 * @param {string[]} obj.fields - QSO fields to update
 */
OperatorLog.prototype.updateQSO = function(obj) {
    var idx = -1;

    for (var i=0;i<this.log.length;i++) {
        if (this.log[i].id == obj.id) {
            idx = i;
            break;
        }
    }
    if (idx>=0) {
        for (var i=0;i<obj.fields.length;i++) {
            this.log[idx][obj.fields[i]] = obj[obj.fields[i]];
        }
    }
}

module.exports = OperatorLog;