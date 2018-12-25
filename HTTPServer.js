var http = require("http");
var fs = require("fs");
var url = require("url");

var Global = require("./Global.js");

/** Initializes main HTTP server
 * 
 * @param {Config} conf - Server configuration
 */
function HTTPServer(conf) {
	/** @type {Config} Server configuration */
	this.config = conf;
	/** @type {string[][]} */
	this.localEPs = [];
	/** @type {any[][]} */
	this.handlerEPs = [];
	
	this.localEPs.push(["/","http/index.html","text/html"]);
	this.localEPs.push(["/login","http/login.html","text/html"]);
	this.localEPs.push(["/log","http/log.html","text/html"]);
	this.localEPs.push(["/forgot","http/forgot.html","text/html"]);
	this.localEPs.push(["/create","http/create.html","text/html"]);
	this.localEPs.push(["/contest","http/contest.html","text/html"]);
	this.localEPs.push(["/fd","http/fd.html","text/html"]);

	this.localEPs.push(["/css/common.css","http/common.css","text/css"]);
	this.localEPs.push(["/css/log.css","http/log.css","text/css"]);
	this.localEPs.push(["/css/contest.css","http/contest.css","text/css"]);
	this.localEPs.push(["/css/contestlog.css","http/contestlog.css","text/css"]);

	this.localEPs.push(["/bs/css/bootstrap.min.css","http/bootstrap-3.3.7-dist/css/bootstrap.min.css","text/css"]);
	this.localEPs.push(["/bs/css/bootstrap-theme.min.css","http/bootstrap-3.3.7-dist/css/bootstrap-theme.min.css","text/css"]);
	this.localEPs.push(["/bs/js/bootstrap.min.js","http/bootstrap-3.3.7-dist/js/bootstrap.min.js","text/javascript"]);

	this.localEPs.push(["/js/bshelp2.js","http/bshelp2.js","text/javascript"]);
	this.localEPs.push(["/js/log.js","http/log.js","text/javascript"]);
	this.localEPs.push(["/js/login.js","http/login.js","text/javascript"]);
	this.localEPs.push(["/js/forgot.js","http/forgot.js","text/javascript"]);
	this.localEPs.push(["/js/create.js","http/create.js","text/javascript"]);
	this.localEPs.push(["/js/logout.js","http/logout.js","text/javascript"]);
	this.localEPs.push(["/js/ctydat.js","http/ctydecode/ctydat.js","text/javascript"]);
	this.localEPs.push(["/js/gridsquare.js","http/gridsquare.js","text/javascript"]);
	this.localEPs.push(["/js/jquery-3.3.1.min.js","http/jquery-3.3.1.min.js","text/javascript"]);
	this.localEPs.push(["/js/contest.js","http/contest.js","text/javascript"]);
	this.localEPs.push(["/js/commonlog.js","http/commonlog.js","text/javascript"]);
	this.localEPs.push(["/js/fd.js","http/fd.js","text/javascript"]);

	this.localEPs.push(["/favicon.ico","http/radio_log.png","image/png"]);
	this.localEPs.push(["/img/bt.png","http/bt.png","image/png"]);

	this.localEPs.push(["/cty.dat","cty.dat","text/plain"]);

	this.handlerEPs.push(["/login_post",this.postLogin]);
	this.handlerEPs.push(["/forgot_post",this.postReset]);
	this.handlerEPs.push(["/create_post",this.postCreate]);
	this.handlerEPs.push(["/logout",this.getLogout.bind(this)]);
	this.handlerEPs.push(["/ping",this.getPing]);
}

/** Handles a GET request to /ping 
 * @param {IncomingMessage} req - Incoming Request
 * @param {ServerResponse} res - Outgoing Response
 */
HTTPServer.prototype.getPing = function(req,res) {
	var u = url.parse(req.url);
	var s = u.query;

	Global.authenticator.ping(s);
	res.setHeader("Content-Type","text/plain");
	res.write(Global.conf.get("autoLogoutTime",30).toString());
	res.end();
}

/** Handles a GET request to /logout 
 * @param {IncomingMessage} req - Incoming Request
 * @param {ServerResponse} res - Outgoing Response
 */
HTTPServer.prototype.getLogout = function(req,res) {
	var u = url.parse(req.url);
	var s = u.query;

	Global.authenticator.logoutSession(s);
	this.sendFile(res,"http/logout.html","text/html");
}

/** Handles a POST request to /create_post
 * @param {IncomingMessage} req - Incoming Request
 * @param {ServerResponse} res - Outgoing Response
 */
HTTPServer.prototype.postCreate = function(req,res) {
	var s = "";

	req.on('data',function(d){
		s+=d;
	});

	req.on('end',function() {
		var o = Global.authenticator.processCreate(s);

		res.setHeader("Content-Type","text/json");
		res.write(JSON.stringify(o));
		res.end();
	});
}

/** Handles a POST request to /reset_post
 * @param {IncomingMessage} req - Incoming Request
 * @param {ServerResponse} res - Outgoing Response
 */
HTTPServer.prototype.postReset = function(req,res) {
	var s = "";

	req.on('data',function(d){
		s+=d;
	});

	req.on('end',function() {
		var o = Global.authenticator.processReset(s);

		res.setHeader("Content-Type","text/json");
		res.write(JSON.stringify(o));
		res.end();
	});	
}

/** Handles a POST request to /login_post
 * @param {IncomingMessage} req - Incoming Request
 * @param {ServerResponse} res - Outgoing Response
 */
HTTPServer.prototype.postLogin = function(req,res) {
	var s = "";

	req.on('data',function(d){
		s+=d;
	});

	req.on('end',function() {
		var o = Global.authenticator.processLogin(s);

		res.setHeader("Content-Type","text/json");
		res.write(JSON.stringify(o));
		res.end();
	});
}

/** Determines if URL is an alias to a local file
 * @param {string} u - HTTP path
 * @return {boolean} True if path is alias
 */
HTTPServer.prototype.useLocalURL = function(u) {
    for (var i=0;i<this.localEPs.length;i++) {
        if (this.localEPs[i][0]==u) return true;
    }
    return false;
}

/** Gets the filename for a file to be returned to the client
 * @param {string} u - HTTP path
 * @return {string} Local filename
 */
HTTPServer.prototype.getLocalFileName = function(u) {
    for (var i=0;i<this.localEPs.length;i++) {
        if (this.localEPs[i][0]==u) return this.localEPs[i][1];
    }
    return "http/this_file_should_not_exist.html";
}

/** Sends a file to the client 
 * @param {ServerResponse} res - Server response
 * @param {string} fn - Local filename
 * @param {string} ft - MIME content type to return to client
*/
HTTPServer.prototype.sendFile = function(res,fn,ft) {
	var vc;

	try {
		vc = fs.readFileSync(fn);
		res.setHeader("Content-Type",ft);
		res.end(vc);
	} catch(e) {
		switch(e.code) {
			case "ENOENT":
				res.statusCode = 404;
				res.end("File Not Found");
				break;
			default:
				res.statusCode = 500;
				res.end("Internal Server Error");
				break;
		}
		console.log("sendFile: "+e.message);
	}
}

/** Determines if the server generates a response
 * @param {string} u - HTTP Path
 * @return {boolean} True if server generates response
 */
HTTPServer.prototype.shouldHandleLocal = function(u) {
	for (var i=0;i<this.handlerEPs.length;i++) {
        if (this.handlerEPs[i][0]==u) return true;
    }
    return false;
}

/** Gets the MIME content type for the provided HTTP path
 * @param {string} u - HTTP Path
 * @return {string} MIME content type
 */
HTTPServer.prototype.getLocalFileType = function(u) {
	for (var i=0;i<this.localEPs.length;i++) {
        if (this.localEPs[i][0]==u) return (this.localEPs[i][2] || "text/html");
    }
    return "text/html";
}

/** Handles an HTTP request locally
 * @param {string} u - HTTP Path
 * @param {IncomingMessage} req - Incoming request
 * @param {ServerResponse} res - Outgoing response
 */
HTTPServer.prototype.handleLocal = function(u,req,res) {
	for (var i=0;i<this.handlerEPs.length;i++) {
        if (this.handlerEPs[i][0]==u) {
			this.handlerEPs[i][1](req,res);
			return;
		}
	}
	console.log("unhandled "+req.method+" "+req.url);
	res.writeHead(404, {'Content-Type': 'text/plain'});
	res.end('404\n');
}

/** Callback for incoming HTTP requests
 * @param {IncomingMessage} req - Incoming request
 * @param {ServerResponse} res - Outgoing response
 */
HTTPServer.prototype.onRequest = function(req,res) {
	var u = url.parse(req.url);

	//console.log("u = "+u.pathname);
	if (this.useLocalURL(u.pathname)) {
		this.sendFile(res,this.getLocalFileName(u.pathname),this.getLocalFileType(u.pathname));
		return;
	}
	if (this.shouldHandleLocal(u.pathname)) {
		this.handleLocal(u.pathname,req,res);
		return;
	}
	console.log("unhandled "+req.method+" "+req.url);
	res.writeHead(404, {'Content-Type': 'text/plain'});
	res.end('404\n');
}

/** Handles WebSockets upgrades
 * @param {IncomingMessage} req - Upgrade request
 * @param {Socket} sock - Connection socket
 * @param {Buffer} head - Header
 */
HTTPServer.prototype.onUpgrade = function(req,sock,head) {
    const pn = url.parse(req.url).pathname;

	if (pn=="/ws") {
        Global.wsServer.upgrade(req,sock,head);
		return;
	}
	console.log("unhandled upgrade "+pn);
}

/** Starts HTTP Server */
HTTPServer.prototype.start = function() {
    this.server = http.createServer(this.onRequest.bind(this)).listen(this.config.get("port",8627));
    this.server.on('upgrade',this.onUpgrade.bind(this));
}

module.exports = HTTPServer;