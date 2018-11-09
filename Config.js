var fs = require("fs");

/** Initializes configuration database
 * @constructor
 * @param {string} filename - Configuration file name.
 */
function Config(filename) {
    var confdata;

    /** @type {string} Configuration JSON file */
    this.filename = filename;

    if (!fs.existsSync(filename)) {
        var ncfd = fs.openSync(filename,"w");
        fs.writeSync(ncfd,JSON.stringify({}));
    }

    confdata = fs.readFileSync(filename);

    /** @type {Object.<string,any>} Configuration database*/
    this.conf = JSON.parse(confdata);
}

/**
 * Saves configuration
 */
Config.prototype.saveConfig = function() {
    fs.writeFileSync(this.filename,JSON.stringify(this.conf));
}

/** Gets a configuration key or sets if doesn't exist
 * @param {string} key - Configuration key
 * @param {string} def - Default value in case the key doesn't yet exist in the database
 * @return Value of configuration key
 */
Config.prototype.get = function(key,def) {
    if (!this.conf[key]) {
        this.conf[key] = def;
        this.saveConfig();
    }
    return this.conf[key];
}

module.exports = Config;