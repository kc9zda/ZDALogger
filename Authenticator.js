var Session = require("./Session.js");
var PasswordManager = require("./PasswordManager.js");

/**
 * Initializes Authentication engine. Creates three default sessions, consisting of one for read-only access, and two for debug purposes
 * @constructor
 */
function Authenticator() {
    /** @type {Object.<string,Session>} */
    this.sessions = {};
    this.sessions['DEFAULT'] = new Session();
    this.sessions['DEFAULT'].id = "DEFAULT";
    this.sessions['DEFAULT2'] = new Session("XX9XXX");
    this.sessions['DEFAULT2'].id = "DEFAULT2";
    this.sessions['DEFAULT3'] = new Session("XX9XXX","KC9ZDA");
    this.sessions['DEFAULT3'].id = "DEFAULT3";

    /** @type {PasswordManager} */
    this.passwordManager = new PasswordManager("passwd.json");
}

/** Retrieves a Session object for the given session ID
 * @param {string} ses - Session ID
 * @return {Session} Session with id specified by ses
 */
Authenticator.prototype.getSession = function(ses) {
    try {
        return this.sessions[ses];
    } catch (whenAmIEverGoingToUseThisVariable) {
        return undefined;
    }
}

/** Wraps Authenticator.authenticate and processes login string from browser
 * @param {string} loginStr - Login information in string form directly from browser.
 * @return {object} Login result object
 */
Authenticator.prototype.processLogin = function(loginStr) {
    var sa = loginStr.split("&");
    var sa2;
    var lr = {};  // should have callsign, operator, and password
    var lo = {};
    
    for (var i=0;i<sa.length;i++) {
        sa2 = sa[i].split("=");
        lr[sa2[0]]=sa2[1];
    }
    lo = this.authenticate(lr.callsign, lr.operator, lr.password);
    return lo;
}

/** Adds a session to the list and returns the assigned ID
 * @param {Session} sess - Session object to add to the session list
 * @return {string} Session ID
 */
Authenticator.prototype.addSession = function(sess) {
    var id;

    id = this.genId();
    while (this.sessions[id]) id = this.genId();
    this.sessions[id] = sess;
    this.sessions[id].id = id;
    return id;
}

/** Randomly generates a session ID
 * @return {string} Randomly generated session ID
 */
Authenticator.prototype.genId = function() {
    var s = "";

    for (var i=0;i<8;i++) {
        s+=String.fromCharCode((Math.random()*26)+0x61);
    }
    return s;
}

/** Logs in a user (callsign/operator combination). Checks if callsign exists, checks password, checks if callsign/operator combo is already online.
 * @param {string} cs - Callsign
 * @param {string} op - Operator
 * @param {string} pw - Password
 * @return {object} Login result object. If error is defined, an error occurred. redir directs the browser to a new URL.
 */
Authenticator.prototype.authenticate = function(cs,op,pw) {
    var lo = {};

    if (!this.passwordManager.hasCallsign(cs)) {
        lo.error = "nouser";
        return lo;
    }
    if (!this.passwordManager.checkPassword(cs,pw)) {
        lo.error = "wrongpw";
        return lo;
    }
    if (this.operatorOnline(cs,op)) {
        lo.error = "dupeop";
        return lo;
    }
    lo.session = this.addSession(new Session(cs,op));
    lo.redir = "/log?session="+lo.session;
    return lo;
}

/** Wraps Authenticator.resetPassword and processes password reset string from browser
 * @param {string} resetStr - Password reset information in string form directly from browser.
 * @return {object} Reset result object
 */
Authenticator.prototype.processReset = function(resetStr) {
    var sa = resetStr.split("&");
    var sa2;
    var lr = {};  // should have callsign
    var lo = {};
    
    for (var i=0;i<sa.length;i++) {
        sa2 = sa[i].split("=");
        lr[sa2[0]]=sa2[1];
    }
    lo = this.resetPassword(lr.callsign);
    return lo;
}

/** Resets a password
 * @param {string} cs - Callsign to generate new password for
 * @return {object} Reset result object. newpw has new password. If error is defined, an error occurred.
 */
Authenticator.prototype.resetPassword = function(cs) {
    var np = this.genId(); 
    var o = {};

    if (!this.passwordManager.hasCallsign(cs)) {
        o.error = "nouser";
        return o;
    }
    this.passwordManager.setPassword(cs,np);
    o.newpw = np;
    return o;
}

/** Wraps Authenticator.createAccount and processes account creation string from browser
 * @param {string} createStr - New account information in string form directly from browser.
 * @return {object} Create result object
 */
Authenticator.prototype.processCreate = function(createStr) {
    var sa = createStr.split("&");
    var sa2;
    var lr = {};  // should have callsign, and password
    var lo = {};
    
    for (var i=0;i<sa.length;i++) {
        sa2 = sa[i].split("=");
        lr[sa2[0]]=sa2[1];
    }
    lo = this.createAccount(lr.callsign, lr.password);
    return lo;
}

/** Creates a new account.
 * @param {string} cs - Callsign
 * @param {string} pw - Password
 * @return {object} Login result object. If error is defined, an error occurred.
 */
Authenticator.prototype.createAccount = function(cs,pw) {
    var o = {};

    if (this.passwordManager.hasCallsign(cs)) {
        o.error = "callinuse";
        return o;
    }
    this.passwordManager.create(cs,pw);
    return o;
}

/** Checks if a callsign/operator combo has a session logged in
 * @param {string} cs - Callsign
 * @param {string} op - Operator
 * @return {boolean} True if callsign/operator combo is online
 */
Authenticator.prototype.operatorOnline = function(cs,op) {
    for (var s in this.sessions) {
        if (this.sessions[s].callsign == cs &&
            this.sessions[s].operator == op) return true;
    }
    return false;
}

/** Marks session as disconnected and initiates a timeout which logs out the user after 30 seconds.
 * @param {string} ses - Session ID of the session that disconnected
 */
Authenticator.prototype.disconnect = function(ses) {
    var s = this.getSession(ses);
    if (s) s.disconnect();
}

/** Marks session as reconnected and cancels the logout timeout
 * @param {string} ses - Session ID of the session that connected
 */
Authenticator.prototype.connect = function(ses) {
    this.getSession(ses).connect();
}

/** Logs out a session
 * @param {string} ses - Session ID to log out
 */
Authenticator.prototype.logoutSession = function(ses) {
    delete this.sessions[ses];
}

module.exports = Authenticator;