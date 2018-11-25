var fs = require("fs");

var Global = require("./Global.js");

/** Stores individual users' settings
 * @param {string} [fn] - Filename for settings database (defaults to usersets.json)
 */
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

/** Updates user's settings
 * @param {string} ses - Session to update settings for
 * @param {object} set - Settings to update to
 */
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

/** Updates user's station information
 * @param {string} ses - Session to update station information for
 * @param {object} sa - Station information
 */
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

/** Updates the user settings database file */
SettingsManager.prototype.updateDatabase = function() {
    fs.writeFileSync(this.filename,JSON.stringify(this.db));
}

/** Gets the settings object for the session
 * @param {string} ses - Session ID
 * @return {object} Settings
 */
SettingsManager.prototype.getSettingsForSession = function(ses) {
    var s = Global.authenticator.getSession(ses);
    var cs = s.callsign;
    var op = s.operator;

    if (this.db[cs] && this.db[cs][op]) return this.db[cs][op].settings;
    else return {};
}

/** Gets the station info object for session
 * @param {string} ses - Session ID
 * @return {object} Station info
 */
SettingsManager.prototype.getStaInfoForSession = function(ses) {
    var s = Global.authenticator.getSession(ses);
    var cs = s.callsign;
    var op = s.operator;

    if (this.db[cs] && this.db[cs][op]) return this.db[cs][op].stainfo;
    else return {};
}

/** Gets the stored mode for the session
 * @param {string} ses - Session ID
 * @return {string} Stored mode
 */
SettingsManager.prototype.getModeForSession = function(ses) {
    var s = Global.authenticator.getSession(ses);
    var cs = s.callsign;
    var op = s.operator;

    if (this.db[cs] && this.db[cs][op]) return this.db[cs][op].mode;
    else return "SSB";
}

/** Gets the stored band for the session
 * @param {string} ses - Session ID
 * @return {string} Stored band
 */
SettingsManager.prototype.getBandForSession = function(ses) {
    var s = Global.authenticator.getSession(ses);
    var cs = s.callsign;
    var op = s.operator;

    if (this.db[cs] && this.db[cs][op]) return this.db[cs][op].band;
    else return "20m";
}

/** Updates stored band/mode 
 * @param {string} ses - Session ID
 * @param {string} mode - New mode
 * @param {string} band - New band
 */
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