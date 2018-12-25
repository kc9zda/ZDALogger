var fs = require("fs");

/** Describes a contest */
function Contest(fn) {
    var s = fs.readFileSync(fn);

    this.raw = JSON.parse(s);
    this.id = this.raw.id;
    this.fields = this.raw.fields;
}

/** Adds fields to QSO object
 * 
 * @param {object} qso - Target object
 * @param {object} obj - Source object
 * @returns {object} Target object with fields added
 */
Contest.prototype.addFields = function(qso,obj) {
    for (var i=0;i<this.fields.length;i++) {
        qso[this.fields[i]] = obj[this.fields[i]];
    }
    return qso;
}

module.exports = Contest;