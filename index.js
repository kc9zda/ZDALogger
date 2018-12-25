var HTTPServer = require("./HTTPServer.js");
var Config = require("./Config.js");
var WSServer = require("./WSServer.js");
var Global = require("./Global.js");
var ConnectionManager = require("./ConnectionManager.js");
var Authenticator = require("./Authenticator.js");
var LoggingEngine = require("./LoggingEngine.js");
var SettingsManager = require("./SettingsManager.js");
var ContestManager = require("./ContestManager.js");

Global.conf = new Config("zdalog.conf");
Global.httpServer = new HTTPServer(Global.conf);
Global.wsServer = new WSServer(Global.conf);
Global.connectionManager = new ConnectionManager();
Global.authenticator = new Authenticator();
Global.logger = new LoggingEngine();
Global.settingsManager = new SettingsManager();
Global.contestManager = new ContestManager();

Global.httpServer.start();
Global.wsServer.start();