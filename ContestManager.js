var Contest = require("./Contest.js");

function ContestManager() {
    this.contests = [];
    this.addContest(new Contest("contests/fd.json")); // TODO: read these from a directory
}

/** Adds contest fields to the QSO object
 * 
 * @param {object} qso - Object to add fields to
 * @param {object} obj - Object to copy fields from
 * @param {string} contest - Contest ID
 * @returns {object} QSO object with fields added
 */
ContestManager.prototype.addContestFields = function(qso,obj,contest) {
    return this.contests[contest].addFields(qso,obj);
}

/** Adds contest to the list
 * 
 * @param {Contest} c - Contest to add
 */
ContestManager.prototype.addContest = function(c) {
    this.contests[c.id] = c;
}

module.exports = ContestManager;