var fs = require("fs");
var crypto = require("crypto");

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
    
    /** @type {Object.<string,{password: string,salt: string}>} Password database */
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
    if (!this.db[cs].hash) {
        this.setPassword(cs,this.db[cs].password);
        this.db[cs].password = undefined;
    }

    var ph = this.generateHash(pw, this.db[cs].salt);
    return (this.db[cs].hash == ph);
}

/** Sets password for a callsign
 * @param {string} cs - Callsign
 * @param {string} pw - Password
 */
PasswordManager.prototype.setPassword = function(cs,pw) {
    this.db[cs].salt = this.generateSalt(16);
    this.db[cs].hash = this.generateHash(pw,this.db[cs].salt);
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
    this.db[cs].salt = this.generateSalt(16);
    this.db[cs].hash = this.generateHash(pw,this.db[cs].salt);
    this.updateDatabase();
}

/** Generate a salt
 * @param {number} len - Length of salt
 * @returns {string} Random salt string
 */
PasswordManager.prototype.generateSalt = function(len) {
    return crypto.randomBytes(Math.ceil(len/2)).toString('hex').slice(0,len);
}

/** Generate a hash 
 * @param {string} pw - Password to hash
 * @param {string} salt - Salt
 * @returns {string} Hash
 */
PasswordManager.prototype.generateHash = function(pw, salt) {
    var hash = crypto.createHmac('sha512',salt);
    hash.update(pw);
    var value = hash.digest('hex');
    return value;
}

module.exports = PasswordManager;