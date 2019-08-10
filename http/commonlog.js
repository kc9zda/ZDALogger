/** Object containing default logging functions */
function BaseLog() {
    /** @type {string} QSO feed heading */
    this.qfhead = "";
    /** @type {string} QSO feed body */
    this.qfbody = "";
    /** @type {string} Current band */
    this.current_band = "20m";
    /** @type {string} Current mode */
    this.current_mode = "SSB";
    /** @type {object} Settings */
    this.settings = {
        /** @type {number} Chat timezone */
        chattz: 0,
        /** @type {number} Distance units */
        distunit: 0,
        /** @type {number} Log timezone */
        logtz: 0,
        /** @type {number} Date format */
        dateform: 0
    };
    /** @type {object} Station info */
    this.stainfo = {
        /** @type {string} Grid square */
        grid: ""
    };
    /** @type {string[]} List of filter settings */
    this.filters = ["Same operator, same callsign", "Same callsign only", "No filter"];
    /** @type {number} Current filter */
    this.current_filter = 0;
    /** @type {{img: string; link: string; text: string}[]} Solar information sources */
    this.solar_sources = [
        {img: "http://www.hamqsl.com/solarpic.php", link: "http://www.hamqsl.com/solar.html", text: "HamQSL.com / N0NBH"},
        {img: "http://www.hamqsl.com/solar101vhf.php", link: "http://www.hamqsl.com/solar.html", text: "HamQSL.com / N0NBH"},
        {img: "http://www.hamqsl.com/solarmap.php", link: "http://www.hamqsl.com/solar.html", text: "HamQSL.com / N0NBH"}
    ];
    /** @type {string[]} List of supported bands */
    this.bands = ["2200m","1750m","630m","160m","80m","60m","40m","30m","20m","17m","15m","12m","10m","6m","2m","1.25m","70cm","33cm","23cm","13cm","9cm","5cm","3cm","1.2cm","6mm","4mm","2.5mm","2mm","1mm"];
    /** @type {string[]} List of supported modes */
    this.modes = ["CW","PHONE","IMAGE","DATA","AM","C4FM","DIGITALVOICE","DSTAR","FM","SSB","ATV","FAX","SSTV","AMTOR","ARDOP","CHIP","CLOVER","CONTESTI","DOMINO","FSK31","FSK441","FT8","GTOR","HELL","HFSK","ISCAT","JT4","JT65","JT6M","JT9","MFSK16","MFSK8","MINIRTTY","MSK144","MT63","OLIVIA","OPERA","PACKET","PAX","PSK10","PSK125","PSK2K","PSK31","PSK63","PSK63F","PSKAM","PSKFEC31","Q15","QRA64","ROS","RTTY","RTTYM","T10","THOR","THROB","VOI","WINMOR","WSPR"];
    /** @type {[]} Entire log */
    this.log = [];
    /** @type {{field: string; name: string; type: string;}[]} List of contest fields */
    this.contest_fields = [];

    this.init_logout_link();
    this.init_cty_dat();
    this.init_qso_feed();
    this.init_qso_entry();
    this.init_chat_box();
    this.init_ws();
}

/** Initializes logout link */
BaseLog.prototype.init_logout_link = function() {
    ge("logout_link").href = "/logout?"+this.get_session();
}

/** Gets session string
 * @return {string} Session ID
 */
BaseLog.prototype.get_session = function() {
    return this.get_param('session') || "DEFAULT";
}

/** Gets a URL parameter
 * @param {string} name - Parameter name
 * @return {string} Parameter value
 */
BaseLog.prototype.get_param = function(name) {
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}

/** initializes CtyDat database */
BaseLog.prototype.init_cty_dat = function() {
    CtyDat.loadFromURL(gfu("/cty.dat"),this.onctyload.bind(this));
}

/** onload callback for cty.dat */
BaseLog.prototype.onctyload = function() {
    console.log("cty.dat loaded");
}

/** Initializes QSO feed */
BaseLog.prototype.init_qso_feed = function() {
    this.qfhead = this.build_tblrow("th",["","FromCall", "FromOp", "Freq", "Mode", "Call", "Time", "Date", "Comment"]);
    this.qfbody = "";
    this.update_qso_feed();
}

/** Builds a table row
 * @param {string} ct - cell type
 * @param {string[]} dat - row data
 * @return {string} row HTML
 */
BaseLog.prototype.build_tblrow = function(ct, dat) {
    var s = "";

    s+="<tr>";
    for (var i=0;i<dat.length;i++) {
        s+="<"+ct+">"+dat[i]+"</"+ct+">";
    }
    s+="</tr>";
    return s;
}

/** Updates QSO feed HTML */
BaseLog.prototype.update_qso_feed = function() {
    si("logbox-head",this.qfhead);
    si("logbox-body",this.qfbody);
}

/** Initializes QSO entry box */
BaseLog.prototype.init_qso_entry = function() {
    this.set_band(this.current_band);
    this.set_mode(this.current_mode);
    setInterval(this.update_time_box.bind(this),100);
}

/** Sets current band and updates to server
 * @param {string} f - band
 */
BaseLog.prototype.set_band = function(f) {
    this.current_band = f;
    si("entryboxband",f);
    this.send_band_mode();
}

/** Sets current mode and updates to server
 * @param {string} m - mode
 */
BaseLog.prototype.set_mode = function(m) {
    this.current_mode = m;
    si("entryboxmode",m);
    this.send_band_mode();
}

/** Sends band and mode to server */
BaseLog.prototype.send_band_mode = function() {
    var o = {};

    o.cmd = "mode";
    o.band = this.current_band;
    o.mode = this.current_mode;
    o.session = this.get_session();
    this.ws_send_message(o);
}

/** Sends message object as JSON to server
 * @param {object} obj - Message
 * @param {string} obj.cmd - Command
 */
BaseLog.prototype.ws_send_message = function(obj) {
    if (this.ws==undefined) return; // for you, firefox
    this.ws.send(JSON.stringify(obj));
}

/** updates time display in QSO entry box */
BaseLog.prototype.update_time_box = function() {
    var d = new Date();
    //var u = "UTC: "+d.getUTCHours()+":"+d.getUTCMinutes()+":"+d.getUTCSeconds();
    var u = "UTC: "+this.uts(d);
    //var l = "Local: "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
    var l = "Local: "+this.lts(d);

    si("timebox",u+" / "+l);
}

/** Initializes chat box */
BaseLog.prototype.init_chat_box = function() {
    si("chatbox-scroller","");
    this.chat_add_line("Page loaded");
}

/** Adds line to chat
 * @param {string} l - chat text
 */
BaseLog.prototype.chat_add_line = function(l) {
    var c = gc("chatbox-scroller");

    l=this.chat_timestring(Date.now())+" "+l;
    si("chatbox-scroller",l+"<br>"+c);
}

/** Gets time string for chat message
 * @param {Date} t - Time for string
 * @return {string} Time string
 */
BaseLog.prototype.chat_timestring = function(t) {
    var d = new Date(t);

    if (this.settings.chattz == 1) {
        return "["+this.lts(d)+"]";
    } else {
        return "["+this.uts(d)+"]";
    }
}

/** Gets UTC time string
 * @param {Date} d - Time
 * @return {string} UTC time string
 */
BaseLog.prototype.uts = function(d) {
    var h = ("0"+d.getUTCHours()).slice(-2);
    var m = ("0"+d.getUTCMinutes()).slice(-2);
    var s = ("0"+d.getUTCSeconds()).slice(-2);

    return h+":"+m+":"+s;
}

/** Gets local time string
 * @param {Date} d - Time
 * @return {string} local time string
 */
BaseLog.prototype.lts = function(d) {
    var h = ("0"+d.getHours()).slice(-2);
    var m = ("0"+d.getMinutes()).slice(-2);
    var s = ("0"+d.getSeconds()).slice(-2);

    return h+":"+m+":"+s;
}

/** Gets UTC date string
 * @param {Date} d - Date
 * @return {string} UTC date string
 */
BaseLog.prototype.uds = function(d) {
    var m = ("0"+(d.getUTCMonth()+1)).slice(-2);
    var d2 = ("0"+d.getUTCDate()).slice(-2);
    var y = d.getUTCFullYear();

    if (this.settings.dateform == 1) return d2+"/"+m+"/"+y;
    else return m+"/"+d2+"/"+y;
}

/** Gets local date string
 * @param {Date} d - Date
 * @return {string} UTC date string
 */
BaseLog.prototype.lds = function(d) {
    var m = ("0"+(d.getMonth()+1)).slice(-2);
    var d2 = ("0"+d.getDate()).slice(-2);
    var y = d.getFullYear();

    if (this.settings.dateform == 1) return d2+"/"+m+"/"+y;
    else return m+"/"+d2+"/"+y;
}

/** Initializes Websockets connection */
BaseLog.prototype.init_ws = function() {
    this.ws = new WebSocket(this.get_ws_url("/ws"));

    this.ws.onopen=this.ws_onopen.bind(this);
    this.ws.onmessage=this.ws_onmessage.bind(this);
    this.ws.onclose=this.ws_onclose.bind(this);
    this.ws.onerror=this.ws_onerror.bind(this);
}

/** Generates WebSockets URL 
 * @param {string} path - Websockets path
 * @return {string} Websockets URL
 */
BaseLog.prototype.get_ws_url = function(path) {
    var proto, host, port;

    proto = ((window.location.protocol.indexOf("https")>0)?"wss://":"ws://");
    host = window.location.hostname;
    port = ":" + window.location.port;
    return proto + host + port + path;
}

/** onopen handler for Websockets */
BaseLog.prototype.ws_onopen = function() {
    var o = {};

    this.chat_add_line("WebSocket connection established");
    o.cmd = "join";
    o.logtype = "normal";
    o.isStatus = false;
    o.session = this.get_session();
    this.ws_send_message(o);
    this.send_band_mode();
    hide_overlay();
}

/** onmessage handler for Websockets
 * @param {string} m - JSON message string
 */
BaseLog.prototype.ws_onmessage = function(m) {
    var o = JSON.parse(m.data);

    //console.log(m);
    //this.chat_add_line("WebSocket message: "+o.cmd);
    switch(o.cmd) {
        case "feed":
            this.add_to_feed(o);
            break;
        case "log":
            this.init_log(o);
            break;
        case "chat":
            this.chat_new_message(o);
            break;
        case "online":
            this.update_users_online(o.online);
            break;
        case "redir":
            redir(o.redir);
            break;
        case "settings":
            if (o.settings) {
                this.settings.chattz = o.settings.chattz || 0;
                this.settings.distunit = o.settings.distunit || 0;
                this.settings.logtz = o.settings.logtz || 0;
                this.settings.dateform = o.settings.dateform || 0;
            }
            break;
        case "stainfo":
            if (o.stainfo) {
                this.stainfo.grid = o.stainfo.grid || "JJ00aa";
            }
            break;
        case "mode":
            if (o.mode) {
                this.current_mode = o.mode;
                si("entryboxmode",o.mode);
            } else this.current_mode = "20m";
            if (o.band) {
                this.current_band = o.band;
                si("entryboxband",o.band);
            } else this.current_band = "SSB";
            this.send_band_mode();
            break;
        default:
            console.log("unknown message from server: "+o.cmd);
            break;
    }
}

/** onclose handler for Websockets */
BaseLog.prototype.ws_onclose = function() {
    this.chat_add_line("WebSocket connection lost");
    set_overlay(create_panel("","Reconnecting...","reconn",{extra_classes: "vcenter centered", no_header: true}));
    show_overlay();
    setTimeout(init,2000);
}

/** onerror handler for Websockets */
BaseLog.prototype.ws_onerror = function() {
    this.chat_add_line("WebSocket error");
}

/** Initializes QSO feed
 * @param {object} obj
 * @param {object[]} obj.log
 */
BaseLog.prototype.init_log = function(obj) {
    this.qfbody = "";
    this.log = [];
    for (var i=0;i<obj.log.length;i++) {
        obj.log[i].mine = true;
        this.add_to_feed(obj.log[i]);
    }
    this.update_qso_feed();
}

/** Adds QSO to feed
 * @param {object} qso - QSO to add
 */
BaseLog.prototype.add_to_feed = function(qso) {
    var d = new Date(qso.timestamp);
    var s,date,time;

    this.log.push(qso);
    switch(this.settings.logtz) {
        case 1:
            time = this.lts(d);
            date = this.lds(d);
            break;
        case 0:
        default:
            time = this.uts(d);
            date = this.uds(d);
            break;
    }
    s = this.build_tblrow("td",[(qso.mine?"<a href=\"javascript:void(0);\" onclick=\"ZDALOG.btn_delqso("+qso.id+")\">X</a> <a href=\"javascript:void(0);\" onclick=\"ZDALOG.btn_editqso("+qso.id+")\">E</a>":""),qso.fmcallsign, qso.fmoperator, qso.band, qso.mode, qso.dxcallsign, time, date, qso.comment]);
    this.qfbody = s + this.qfbody;
    this.update_qso_feed();
}

/** updates online operators list
 * @param {object[]} o
 */
BaseLog.prototype.update_users_online = function(o) {
    var s = "";

    this.online_ops = o;
    if (this.online_ops.length == 1) {
        s = "1 operator online";
    } else {
        s = this.online_ops.length+" operators online";
    }
    si("opsonline",s);
}

/** onclick handler for export button */
BaseLog.prototype.btn_export = function() {
    this.coming_soon();
}

/** Shows a simple overlay to indicate a feature is coming soon */
BaseLog.prototype.coming_soon = function() {
    var cont = "Coming soon...<br><br><button class=\"btn btn-info\" onclick=\"ZDALOG.coming_soon_close();\">Close</a>";

    set_overlay(create_panel("",cont,"coming_soon",{extra_classes: "vcenter centered", no_header: true}));
    show_overlay();
}

/** Closes coming soon overlay */
BaseLog.prototype.coming_soon_close = function() {
    hide_overlay();
}

/** onclick handler for import button */
BaseLog.prototype.btn_import = function() {
    this.coming_soon();
}

/** onclick handler for filters button */
BaseLog.prototype.btn_filters = function() {
    var cont = "";

    for (var i=0;i<this.filters.length;i++) {
        if (i == this.current_filter) {
            cont+="<button class=\"btn btn-success\" onclick=\"ZDALOG.btn_filter_set("+i+");\">"+this.filters[i]+"</button>&nbsp;";
        } else {
            cont+="<button class=\"btn btn-default\" onclick=\"ZDALOG.btn_filter_set("+i+");\">"+this.filters[i]+"</button>&nbsp;";
        }
    }
    cont+="<hr><button class=\"btn btn-info\" onclick=\"ZDALOG.btn_filter_close();\">Close</button>";
    set_overlay(create_panel("Select Filter", cont, "selfilt", {extra_classes: "vcenter centered"}));
    show_overlay();
}

/** onclick handler for filter set button
 * @param {number} i - Filter index
 */
BaseLog.prototype.btn_filter_set = function(i) {
    this.set_filter(i);
    this.btn_filters();
}

/** Sets current filter and sends to server
 * @param {number} i - Filter index
 */
BaseLog.prototype.set_filter = function(i) {
    var o = {};

    this.current_filter = i;
    o.cmd = "filter";
    o.filter = i;
    this.ws_send_message(o);
}

/** onclick handler for filter close button */
BaseLog.prototype.btn_filter_close = function() {
    hide_overlay();
}

/** onclick handler for settings button */
BaseLog.prototype.btn_settings = function() {
    var cont = "";

    cont = "Chat time zone: <select id=\"settings_chattz\"><option>UTC</option><option>Local</option></select><br>";
    cont+= "Log time zone: <select id=\"settings_logtz\"><option>UTC</option><option>Local</option></select><br>";
    cont+= "Date format: <select id=\"settings_dateform\"><option>mm/dd</option><option>dd/mm</option></select><br>";
    cont+= "Distance units: <select id=\"settings_distunit\"><option>Kilometers</option><option>Miles</option></select>";
    cont+= "<hr><button class=\"btn btn-info\" onclick=\"ZDALOG.btn_settings_close();\">Close</button>";
    set_overlay(create_panel("Settings", cont, "settings", {extra_classes: "vcenter centered"}));
    ge("settings_chattz").selectedIndex = this.settings.chattz;
    ge("settings_distunit").selectedIndex = this.settings.distunit;
    ge("settings_logtz").selectedIndex = this.settings.logtz;
    ge("settings_dateform").selectedIndex = this.settings.dateform;
    show_overlay();
}

/** onclick handler for settings close button */
BaseLog.prototype.btn_settings_close = function() {
    var o = {};

    this.settings.chattz = ge("settings_chattz").selectedIndex;
    this.settings.distunit = ge("settings_distunit").selectedIndex;
    this.settings.logtz = ge("settings_logtz").selectedIndex;
    this.settings.dateform = ge("settings_dateform").selectedIndex;
    hide_overlay();
    o.cmd = "settings";
    o.settings = this.settings;
    this.ws_send_message(o);
}

/** onclick handler for solar button */
BaseLog.prototype.btn_solar = function() {
    var cont = "";

    this.current_solar = this.solar_sources.length;
    cont+="<a href=\"javascript:void(0);\" onclick=\"ZDALOG.solar_advance();\"><img id=\"solarimg\" alt=\"Solar information\" title=\"Click to advance\" src=\"http://www.hamqsl.com/solarpic.php\"></a>";
    cont+="<br>Solar Data Source: <a href=\"http://www.hamqsl.com/solar.html\" id=\"solarlink\" target=\"_blank\">HamQSL.com (N0NBH)</a>";
    cont+="<hr><button class=\"btn btn-info\" onclick=\"ZDALOG.btn_solar_close();\">Close</button>";
    set_overlay(create_panel("Solar Information", cont, "solar", {extra_classes: "vcenter centered"}));
    this.solar_advance();
    show_overlay();
}

/** Advances to the next solar data format */
BaseLog.prototype.solar_advance = function() {
    this.current_solar++;
    if (this.current_solar>=this.solar_sources.length) this.current_solar = 0;

    ge("solarimg").src = this.solar_sources[this.current_solar].img;
    ge("solarlink").href = this.solar_sources[this.current_solar].link;
    si("solarlink",this.solar_sources[this.current_solar].text);
}

/** onclick handler for solar window close button */
BaseLog.prototype.btn_solar_close = function() {
    hide_overlay();
}

/** onclick handler for delete QSO button
 * @param {number} id - QSO id
 */
BaseLog.prototype.btn_delqso = function(id) {
    var s = "";

    s+="Are you sure you want to delete this entry?<hr>";
    s+="<button class=\"btn btn-default\" style=\"float: left;\" onclick=\"ZDALOG.btn_delqso_cancel();\">Cancel</button><button class=\"btn btn-danger\" style=\"float: right;\" onclick=\"ZDALOG.btn_delqso_confirm("+id+")\">Confirm</button>";
    set_overlay(create_panel("Delete entry", s, "del", {extra_classes: "vcenter centered"}));
    show_overlay();
}

/** onclick handler for confirm delete QSO button
 * @param {number} id - QSO id
 */
BaseLog.prototype.btn_delqso_confirm = function(id) {
    var o = {};

    o.cmd = "delete";
    o.id = id;
    this.ws_send_message(o);
    hide_overlay();
}

/** onclick handler for cancel delete QSO button */
BaseLog.prototype.btn_delqso_cancel = function() {
    hide_overlay();
}

/** onchange handler for the QSO callsign */
BaseLog.prototype.onchange_qsocall = function() {
    var cs = gv("qsocall").toUpperCase();
    var s = "";

    if (cs=="") {
        si("country","");
        return;
    }
    var o = CtyDat.decodeCallsign(cs);
    if (o) {
        r = GridSquare.distance(this.stainfo.grid,o.latitude,o.longitude);
        s = "Country: <b>"+o.name+"</b><br>";
        s+= "CQ: <b>"+o.cq+"</b>&nbsp;ITU: <b>"+o.itu+"</b><br>";
        s+= "Lat: <b>"+o.latitude+"</b>&nbsp;Lon: <b>"+o.longitude+"</b><br>";
        s+= "Vec: <b>"+r.angle.toFixed(2)+"</b>&deg;&nbsp;("+this.bearing_to_cardinal(r.angle)+")&nbsp;<b>"+this.encode_distance(r.distance)+"</b>";
    } else {
        s = "";
    }
    si("country",s);
}

/** converts a bearing to a cardinal direction 
 * @param {number} deg - Degrees
 * @return {string} Direction string (e.g. N,SW,ENE)
 */
BaseLog.prototype.bearing_to_cardinal = function(deg) {
    if (deg < 11.25) return "N";
    if (deg < 33.75) return "NNE";
    if (deg < 56.25) return "NE";
    if (deg < 78.75) return "ENE";
    if (deg < 101.25) return "E";
    if (deg < 123.75) return "ESE";
    if (deg < 146.25) return "SE";
    if (deg < 168.75) return "SSE";
    if (deg < 191.25) return "S";
    if (deg < 213.75) return "SSW";
    if (deg < 236.25) return "SW";
    if (deg < 258.75) return "WSW";
    if (deg < 281.25) return "W";
    if (deg < 303.75) return "WNW";
    if (deg < 326.75) return "NW";
    if (deg < 348.75) return "NNW";
    return "N";
}

/** encodes distance with proper units
 * @param {number} mtrs - Distance in meters
 * @return {string} Distance string
 */
BaseLog.prototype.encode_distance = function(mtrs) {
    var km = mtrs/1000;
    var mi = km/1.609;

    switch(this.settings.distunit) {
        case 0: 
            return km.toFixed(4)+" km";
        case 1:
            return mi.toFixed(2)+" mi";
        default:
            return mtrs+" m";
    }
}

/** onkeyup handler for qso entry box */
BaseLog.prototype.qsoln_keyup = function(event) {
    if (event.key.toUpperCase() == "ENTER") {
        this.btn_log();
    }
}

/** onclick handler for log button */
BaseLog.prototype.btn_log = function() {
    var o = {};

    if (gv("qsocall").trim() == "") return;
    o.cmd = "qso";
    o.timestamp = Date.now();
    o.callsign = gv("qsocall").toUpperCase();
    o.comment = gv("qsocomment");
    o.session = this.get_session();
    this.ws_send_message(o);
    sv("qsocall","");
    sv("qsocomment","");
    fe("qsocall");
}

/** onclick handler for band button */
BaseLog.prototype.btn_band = function() {
    var cont = "";

    for (var i=0;i<this.bands.length;i++) {
        if (this.bands[i] == this.current_band) {
            cont+="<button class=\"btn btn-success\" onclick=\"ZDALOG.btn_band_set("+i+");\">"+this.bands[i]+"</button>&nbsp;";
        } else {
            cont+="<button class=\"btn btn-default\" onclick=\"ZDALOG.btn_band_set("+i+");\">"+this.bands[i]+"</button>&nbsp;";
        }
    }
    cont+="<hr><button class=\"btn btn-info\" onclick=\"ZDALOG.btn_band_close();\">Close</button>";
    set_overlay(create_panel("Select Band", cont, "selband", {extra_classes: "vcenter centered"}));
    show_overlay();
}

/** onclick handler for band set button
 * @param {number} i - Band index
 */
BaseLog.prototype.btn_band_set = function(i) {
    this.set_band(this.bands[i]);
    this.btn_band();
}

/** onclick handler for band close button */
BaseLog.prototype.btn_band_close = function() {
    hide_overlay();
}

/** onclick handler for mode button */
BaseLog.prototype.btn_mode = function() {
    var cont = "";

    for (var i=0;i<this.modes.length;i++) {
        if (this.modes[i] == this.current_mode) {
            cont+="<button class=\"btn btn-success\" onclick=\"ZDALOG.btn_mode_set("+i+");\">"+this.modes[i]+"</button>&nbsp;";
        } else {
            cont+="<button class=\"btn btn-default\" onclick=\"ZDALOG.btn_mode_set("+i+");\">"+this.modes[i]+"</button>&nbsp;";
        }
    }
    cont+="<hr><button class=\"btn btn-info\" onclick=\"ZDALOG.btn_mode_close();\">Close</button>";
    set_overlay(create_panel("Select Mode", cont, "selmode", {extra_classes: "vcenter centered"}));
    show_overlay();
}

/** onclick handler for mode close button */
BaseLog.prototype.btn_mode_close = function() {
    hide_overlay();
}

/** onclick handler for mode set button
 * @param {number} i - mode index
 */
BaseLog.prototype.btn_mode_set = function(i) {
    this.set_mode(this.modes[i]);
    this.btn_mode();
}

/** onkeyup handler for chat box */
BaseLog.prototype.chat_keyup = function(event) {
    if (event.key.toUpperCase() == "ENTER") {
        this.btn_chatsend();
    }
}

/** onclick handler for chat send button */
BaseLog.prototype.btn_chatsend = function() {
    var obj = {};
    var msg = this.escapeHTML(gv("chatboxtext"));

    if (msg=="") {
        sv("chatboxtext","");
        return;
    }
    obj.cmd = "chat";
    obj.message = msg;
    obj.session = this.get_session();
    this.ws_send_message(obj);
    sv("chatboxtext","");
}

/** escapes unsafe HTML characters from string
 * @param {string} unsafe - Input string
 * @return Output string
 */
BaseLog.prototype.escapeHTML = function(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/** onclick handler for operators online button */
BaseLog.prototype.btn_opsonline = function() {
    var cont = "<table class=\"table\">";

    cont+="<thead>";
    cont+=this.build_tblrow("th",["Operator","Band","Mode"]);
    cont+="</thead><tbody>";
    for (var i=0;i<this.online_ops.length;i++) {
        cont+=this.build_tblrow("td",[this.online_ops[i].operator, this.online_ops[i].band, this.online_ops[i].mode]);
    }
    cont+="</tbody></table>";
    cont+="<br><button class=\"btn btn-info\" onclick=\"ZDALOG.btn_opsonline_close();\">Close</button>";
    set_overlay(create_panel("Operators online", cont, "olpan", {extra_classes: "vcenter centered"}));
    show_overlay();
}

/** onclick handler for operators online close button */
BaseLog.prototype.btn_opsonline_close = function() {
    hide_overlay();
}

/** onclick callback for station info button */
BaseLog.prototype.btn_stainfo = function() {
    var cont = "";

    cont+="Gridsquare: <input type=\"text\" id=\"stainfo_grid\" onchange=\"ZDALOG.stainfo_grid_change();\"><br>";
    cont+="<span id=\"stainfo_loc\"></span><br>";
    cont+="<hr><button class=\"btn btn-info\" onclick=\"ZDALOG.btn_stainfo_close();\">Close</button>";
    set_overlay(create_panel("Station Information", cont, "stainfo", {extra_classes: "vcenter centered"}));
    sv("stainfo_grid",this.stainfo.grid);
    this.stainfo_grid_change();
    show_overlay();
}

/** onclick callback for station info close button */
BaseLog.prototype.btn_stainfo_close = function() {
    var o = {};

    this.stainfo.grid = gv("stainfo_grid");
    hide_overlay();
    o.cmd = "stainfo";
    o.stainfo = this.stainfo;
    this.ws_send_message(o);
}

/** onchange handler for station info grid square */
BaseLog.prototype.stainfo_grid_change = function() {
    var coord = GridSquare.decode(gv("stainfo_grid"));

    si("stainfo_loc","Lat: <b>"+coord.lat+"</b> Lon: <b>"+coord.lon+"</b>");
}

/** Remove bands from allowed list 
 * @param {string[]} bs List of disallowed bands
 */
BaseLog.prototype.removeBands = function(bs) {
    for (var i=0;i<bs.length;i++) {
        this.removeBand(bs[i]);
    }
}

/** Remove band from allowed list
 * @param {string} b Band to be disallowed
 */
BaseLog.prototype.removeBand = function(b) {
    var i = this.bands.indexOf(b);

    this.bands.splice(i,0);
}

/** Onclick handler for Go To Page button */
BaseLog.prototype.btn_gopage = function() {
    var cont = "";

    cont+="<b>Select a page to navigate to:</b><br>";
    cont+="<ul class=\"list-group\">";
    cont+="<li class=\"list-group-item\"><a href=\"/log?session="+this.get_session()+"\">Normal Log</a></li>";
    cont+="<li class=\"list-group-item\"><a href=\"/contest?session="+this.get_session()+"\">Contest Selection</a></li>";
    cont+="</ul><hr>";
    cont+="<button class=\"btn btn-info\" onclick=\"ZDALOG.btn_gopage_close();\">Close</button>";
    set_overlay(create_panel("Navigate", cont, "navpage", {extra_classes: "vcenter centered"}));
    show_overlay();
}

/** Onclick handler for Navigation window close button */
BaseLog.prototype.btn_gopage_close = function() {
    hide_overlay();
}

/** Onclick handler for edit QSO button
 * @param {number} i - QSO ID
 */
BaseLog.prototype.btn_editqso = function(i) {
    var cont="";
    var q = this.find_qso(i);
    var t = this.log_time_str(q.timestamp);
    var d2 = new Date(q.timestamp);
    var d = "";

    switch(this.settings.logtz) {
        case 0:
            d = d2.getUTCFullYear()+"-"+(("0"+(d2.getUTCMonth()+1)).slice(-2))+"-"+(("0"+d2.getUTCDate()).slice(-2));
            break;
        case 1:
            d = d2.getFullYear()+"-"+(("0"+(d2.getMonth()+1)).slice(-2))+"-"+(("0"+d2.getDate()).slice(-2));
            break;
        default:
            break;
    }
    cont+="QSO ID: "+i+"<br>";
    cont+="Log Station: "+q.fmcallsign+"<br>";
    cont+="Log Operator: "+q.fmoperator+"<br>";
    cont+="<div class=\"aligtop\" style=\"margin-top: 8px;\">";
    cont+="<div class=\"aligtop"+((this.contest_fields.length>0 && q.contest==this.contest_id)?" normal-edit":"")+"\">";
    cont+="Band: "+this.make_band_dropdown("efreq")+"<br>";
    cont+="Mode: "+this.make_mode_dropdown("emode")+"<br>";
    cont+="Callsign: <input type=\"text\" id=\"ecall\" value=\""+q.dxcallsign+"\"><br>";
    cont+="Time: <input type=\"time\" id=\"etime\" value=\""+t+"\"><br>"; 
    cont+="Date: <input type=\"date\" id=\"edate\" value=\""+d+"\"><br>";
    cont+="Comment: <input type=\"text\" id=\"ecomment\" value=\""+q.comment+"\"><br>";
    cont+="<input type=\"hidden\" id=\"eid\" value=\""+i+"\">";
    cont+="</div>";
    if (this.contest_fields.length>0 && q.contest==this.contest_id) {
        cont+="<div class=\"aligtop contest-edit\">";
        for (var i2=0;i2<this.contest_fields.length;i2++) {
            cont+=this.encode_contest_field_editor(i2,q);
        }
        cont+="</div>";
    }
    cont+="</div><hr>";
    cont+="<button class=\"btn btn-success\" onclick=\"ZDALOG.btn_editqso_save();\">Save</button>";
    cont+="<button class=\"btn btn-default\" onclick=\"ZDALOG.btn_editqso_cancel();\">Cancel</button>";
    set_overlay(create_panel("Edit QSO "+i, cont, "editqso", {extra_classes: "vcenter centered"}));
    ge("efreq").selectedIndex = this.find_band_index(q.band);
    ge("emode").selectedIndex = this.find_mode_index(q.mode);
    show_overlay();
}

BaseLog.prototype.encode_contest_field_editor = function(i,q) {
    var s = "";
    var f = this.contest_fields[i];

    switch(f.type) {
        case "text":
            s+=f.name+": <input type=\"text\" id=\"ex"+f.field+"\" value=\""+q[f.field]+"\"><br>"
            break;
        default:
            s+="unknown type <br>";
            break;
    }
    return s;
}

/** Onclick handler for edit QSO save button */
BaseLog.prototype.btn_editqso_save = function() {
    var qfields = ["band", "mode", "dxcallsign", "comment", "timestamp"];
    var o = {};
    var b = {};
    var a,id;

    for (var i=0;i<this.contest_fields.length;i++) {
        qfields.push(this.contest_fields[i].field);
    }
    id = gi("eid");
    a = this.find_qso(id);
    b.band = gv("efreq");
    b.mode = gv("emode");
    b.dxcallsign = gv("ecall");
    b.comment = this.escapeHTML(gv("ecomment"));
    b.timestamp = this.date_time_to_timestamp(gv("edate"),gv("etime"));
    for (var i=0;i<this.contest_fields.length;i++) {
        switch(this.contest_fields[i].type) {
            case "text":
                b[this.contest_fields[i].field] = gv("ex"+this.contest_fields[i].field);
                break;
            default:
                break;
        }
    }
    o.cmd = "update";
    o.id = id;
    o.fields = [];
    for (var i=0;i<qfields.length;i++) {
        if (a[qfields[i]] != b[qfields[i]]) {
            o.fields.push(qfields[i]);
            o[qfields[i]] = b[qfields[i]];
        }
    }
    console.log(o);
    if (o.fields.length > 0) {
        this.ws_send_message(o);
    }
    hide_overlay();
}

/** Onclick handler for edit QSO cancel button */
BaseLog.prototype.btn_editqso_cancel = function() {
    hide_overlay();
}

/** Finds a QSO from its id 
 * @param {number} id - QSO ID
 * @returns {object} QSO
 */
BaseLog.prototype.find_qso = function(id) {
    for (var i=0;i<this.log.length;i++) {
        if (this.log[i].id == id) return this.log[i];
    }
}

/** Creates an HTML dropdown with a list of bands
 * @param {string} id - HTML ID for element
 * @return {string} HTML code for element
 */
BaseLog.prototype.make_band_dropdown = function(id) {
    var s = "";

    s = "<select id=\""+id+"\">";
    for (var i=0;i<this.bands.length;i++) {
        s+="<option>";
        s+=this.bands[i];
        s+="</option>";
    }
    s+= "</select>";
    return s;
}

/** Creates an HTML dropdown with a list of modes
 * @param {string} id - HTML ID for element
 * @return {string} HTML code for element
 */
BaseLog.prototype.make_mode_dropdown = function(id) {
    var s = "";

    s = "<select id=\""+id+"\">";
    for (var i=0;i<this.modes.length;i++) {
        s+="<option>";
        s+=this.modes[i];
        s+="</option>";
    }
    s+= "</select>";
    return s;
}

/** Finds the index in bands array for a particular band
 * @param {string} b - Band name
 * @return {number} Index into band array for the specified band
 */
BaseLog.prototype.find_band_index = function(b) {
    for (var i=0;i<this.bands.length;i++) {
        if (this.bands[i]==b) return i;
    }
    return -1;
}

/** Finds the index in modes array for a particular mode
 * @param {string} m - Mode name
 * @return {number} Index into mode array for the specified mode
 */
BaseLog.prototype.find_mode_index = function(m) {
    for (var i=0;i<this.modes.length;i++) {
        if (this.modes[i]==m) return i;
    }
    return -1;
}

/** Returns a time string
 * @param {number} t - Unix Timestamp
 * @return {string} String in user's selected time zone
 */
BaseLog.prototype.log_time_str = function(t) {
    t = new Date(t);
    switch (this.settings.logtz) {
        case 0:
            return this.uts(t);
        case 1:
            return this.lts(t);
        default:
            return "";
    }
}

/** Returns a Unix timestamp from the supplied date and time using the timezone specified by settings.logtz. Designed for use with date and time HTML input elements\
 * @param {string} d - Date string yyyy-mm-dd
 * @param {string} t - Time string hh:mm:ss
 * @return {number} Unix timestamp
 */
BaseLog.prototype.date_time_to_timestamp = function(d,t) {
    var da,ta,o;

    console.log(d);
    console.log(t);
    da = d.split("-");
    ta = t.split(":");
    o = new Date();
    switch(this.settings.logtz) {
        case 0:
            o.setUTCFullYear(parseInt(da[0]));
            o.setUTCMonth(parseInt(da[1])-1);
            o.setUTCDate(parseInt(da[2]));
            o.setUTCHours(parseInt(ta[0]));
            o.setUTCMinutes(parseInt(ta[1]));
            o.setUTCSeconds(parseInt(ta[2]));
            break;
        case 1:
            o.setFullYear(parseInt(da[0]));
            o.setMonth(parseInt(da[1])-1);
            o.setDate(parseInt(da[2]));
            o.setHours(parseInt(ta[0]));
            o.setMinutes(parseInt(ta[1]));
            o.setSeconds(parseInt(ta[2]));
            break;
        default:
            break;
    }
    console.log(o);
    return o.getTime();
}

/** Adds contest fields
 * @param {string} field - Field ID
 * @param {string} name - Field name
 * @param {string} type - Field type (text)
 */
BaseLog.prototype.addContestField = function(field,name,type) {
    var o = {field,name,type};

    this.contest_fields.push(o);
}

/** Handles new chat message from server
 * @param {object} pkt - Packet
 */
BaseLog.prototype.chat_new_message = function(pkt) {
    var s = pkt.message;

    if (pkt.sender) {
        s = "<b>"+pkt.sender+"</b>&nbsp;" + s;
    }
    this.chat_add_line(s);
}