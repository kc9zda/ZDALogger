var fs = require("fs");

var Global = require("./Global.js");

function SettingsManager(fn) {
    var s;

    /** @type {string} Filename for user settings */
    this.filename = fn || "usersets.json";
    if (!fs.existsSync(this.filename)) {
        var o = {};
        fs.writeFileSync(this.filename,JSON.stringify(o));
    }
    s = fs.readFileSync(this.filename);
    /** @type {Object.<string,Object.<string,{settings: object, stainfo: object}>>} User settings database */
    this.db = JSON.parse(s);
}

SettingsManager.prototype.updateSettings = function(ses,set) {
    var s = Global.authenticator.getSession(ses);
    var cs = s.callsign;
    var op = s.operator;

    if (!this.db[cs]) {
        this.db[cs] = {};
    }
    if (!this.db[cs][op]) {
        this.db[cs][op] = {
            settings: {},
            stainfo: {},
            band: "20m",
            mode: "SSB"
        };
    }
    this.db[cs][op].settings = set;
    this.updateDatabase();
}

SettingsManager.prototype.updateStaInfo = function(ses,sa) {
    var s = Global.authenticator.getSession(ses);
    var cs = s.callsign;
    var op = s.operator;

    if (!this.db[cs]) {
        this.db[cs] = {};
    }
    if (!this.db[cs][op]) {
        this.db[cs][op] = {
            settings: {},
            stainfo: {},
            band: "20m",
            mode: "SSB"
        };
    }
    this.db[cs][op].stainfo = sa;
    this.updateDatabase();
}

SettingsManager.prototype.updateDatabase = function() {
    fs.writeFileSync(this.filename,JSON.stringify(this.db));
}

SettingsManager.prototype.getSettingsForSession = function(ses) {
    var s = Global.authenticator.getSession(ses);
    var cs = s.callsign;
    var op = s.operator;

    return this.db[cs][op].settings;
}

SettingsManager.prototype.getStaInfoForSession = function(ses) {
    var s = Global.authenticator.getSession(ses);
    var cs = s.callsign;
    var op = s.operator;

    return this.db[cs][op].stainfo;
}

SettingsManager.prototype.getModeForSession = function(ses) {
    var s = Global.authenticator.getSession(ses);
    var cs = s.callsign;
    var op = s.operator;

    return this.db[cs][op].mode;
}

SettingsManager.prototype.getBandForSession = function(ses) {
    var s = Global.authenticator.getSession(ses);
    var cs = s.callsign;
    var op = s.operator;

    return this.db[cs][op].band;
}

SettingsManager.prototype.updateMode = function(ses, mode, band) {
    var s = Global.authenticator.getSession(ses);
    if (!s) return;
    var cs = s.callsign;
    var op = s.operator;

    if (!this.db[cs]) {
        this.db[cs] = {};
    }
    if (!this.db[cs][op]) {
        this.db[cs][op] = {
            settings: {},
            stainfo: {},
            band: "20m",
            mode: "SSB"
        };
    }
    this.db[cs][op].mode = mode;
    this.db[cs][op].band = band;
    this.updateDatabase();
}

module.exports = SettingsManager;