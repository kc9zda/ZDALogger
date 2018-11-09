var fs = require("fs");

/** Initializes the password manager
 * @constructor
 * @param {string} pdb - Filename of the password database
 */
function PasswordManager(pdb) {
    if (!fs.existsSync(pdb)) {
        var o = {};
        fs.writeFileSync(pdb,JSON.stringify(o));
    }
    var s = fs.readFileSync(pdb);
    
    /** @type {Object.<string,{password: string}>} Password database */
    this.db = JSON.parse(s);
    /** @type {string} Password database filename */
    this.filename = pdb;
}

/** Checks if the database contains a specific callsign
 * @param {string} cs - Callsign
 * @return {boolean} True if database contains callsign
 */
PasswordManager.prototype.hasCallsign = function(cs) {
    return this.db[cs];
}

/** Checks the password against the database
 * @param {string} cs - Callsign
 * @param {string} pw - Password
 * @return {boolean} True if password is correct
 */
PasswordManager.prototype.checkPassword = function(cs,pw) {
    return (this.db[cs].password == pw);
}

/** Sets password for a callsign
 * @param {string} cs - Callsign
 * @param {string} pw - Password
 */
PasswordManager.prototype.setPassword = function(cs,pw) {
    this.db[cs].password = pw;
    this.updateDatabase();
}

/** Writes the password database to the filesystem */
PasswordManager.prototype.updateDatabase = function() {
    fs.writeFileSync(this.filename,JSON.stringify(this.db));
}

/** Creates an account
 * @param {string} cs - Callsign
 * @param {string} pw - Password
 */
PasswordManager.prototype.create = function(cs,pw) {
    this.db[cs] = {};
    this.db[cs].password = pw;
    this.updateDatabase();
}

module.exports = PasswordManager;