/** Global variables */
var Global = {
    /** @typedef {import("./Config")} Config
     *  @type {Config} */
    conf: undefined,

    /** @typedef {import("./HTTPServer")} HTTPServer
     *  @type {HTTPServer} */
    httpServer: undefined,

    /** @typedef {import("./WSServer")} WSServer
     *  @type {WSServer} */
    wsServer: undefined,

    /** @typedef {import("./ConnectionManager")} connectionManager
     *  @type {connectionManager} */
    connectionManager: undefined,

    /** @typedef {import("./Authenticator")} Authenticator
     *  @type {Authenticator} */
    authenticator: undefined,

    /** @typedef {import("./LoggingEngine")} LoggingEngine 
     *  @type {LoggingEngine} */
    logger: undefined
};

module.exports = Global;