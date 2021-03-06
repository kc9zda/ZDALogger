/** @type {string} QSO feed heading */
var qfhead = ""; 
/** @type {string} QSO feed body */
var qfbody = "";
/** @type {string} Current band */
var current_band = "20m";
/** @type {string} Current mode */
var current_mode = "SSB";
/** @type {string} Current filter */
var current_filter = 0;
/** @type {*} Websockets connection */
var ws;
/** @type {object[]} List of operators online */
var online_ops = [];
/** @type {string[]} List of supported bands */
var bands = ["2200m","1750m","630m","160m","80m","60m","40m","30m","20m","17m","15m","12m","10m","6m","2m","1.25m","70cm","33cm","23cm","13cm","9cm","5cm","3cm","1.2cm","6mm","4mm","2.5mm","2mm","1mm"];
/** @type {string[]} List of supported modes */
var modes = ["CW","PHONE","IMAGE","DATA","AM","C4FM","DIGITALVOICE","DSTAR","FM","SSB","ATV","FAX","SSTV","AMTOR","ARDOP","CHIP","CLOVER","CONTESTI","DOMINO","FSK31","FSK441","FT8","GTOR","HELL","HFSK","ISCAT","JT4","JT65","JT6M","JT9","MFSK16","MFSK8","MINIRTTY","MSK144","MT63","OLIVIA","OPERA","PACKET","PAX","PSK10","PSK125","PSK2K","PSK31","PSK63","PSK63F","PSKAM","PSKFEC31","Q15","QRA64","ROS","RTTY","RTTYM","T10","THOR","THROB","VOI","WINMOR","WSPR"];
/** @type {string[]} List of filter settings */
var filters = ["Same operator, same callsign", "Same callsign only", "No filter"];
/** @type {object} Settings */
var settings = {
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
var stainfo = {
    /** @type {string} Grid square */
    grid: ""
};
/** @type {{img: string; link: string; text: string}[]} Solar information sources */
var solar_sources = [
    {img: "http://www.hamqsl.com/solarpic.php", link: "http://www.hamqsl.com/solar.html", text: "HamQSL.com / N0NBH"},
    {img: "http://www.hamqsl.com/solar101vhf.php", link: "http://www.hamqsl.com/solar.html", text: "HamQSL.com / N0NBH"},
    {img: "http://www.hamqsl.com/solarmap.php", link: "http://www.hamqsl.com/solar.html", text: "HamQSL.com / N0NBH"}
];

/** onload handler */
function init() {
    init_logout_link();
    init_cty_dat();
    init_qso_feed();
    init_qso_entry();
    init_chat_box();
    init_ws();
}

/** Initializes logout link */
function init_logout_link() {
    ge("logout_link").href = "/logout?"+get_session();
}

/** Initializes QSO feed */
function init_qso_feed() {
    qfhead = build_tblrow("th",["","FromCall", "FromOp", "Freq", "Mode", "Call", "Time", "Date", "Comment"]);
    qfbody = "";
    update_qso_feed();
}

/** Builds a table row
 * @param {string} ct - cell type
 * @param {string[]} dat - row data
 * @return {string} row HTML
 */
function build_tblrow(ct, dat) {
    var s = "";

    s+="<tr>";
    for (var i=0;i<dat.length;i++) {
        s+="<"+ct+">"+dat[i]+"</"+ct+">";
    }
    s+="</tr>";
    return s;
}

/** Updates QSO feed HTML */
function update_qso_feed() {
    si("logbox-head",qfhead);
    si("logbox-body",qfbody);
}

/** Initializes QSO entry box */
function init_qso_entry() {
    set_band(current_band);
    set_mode(current_mode);
    setInterval(update_time_box,100);
}

/** Sets current band and updates to server
 * @param {string} f - band
 */
function set_band(f) {
    current_band = f;
    si("entryboxband",f);
    send_band_mode();
}

/** Sets current mode and updates to server
 * @param {string} m - mode
 */
function set_mode(m) {
    current_mode = m;
    si("entryboxmode",m);
    send_band_mode();
}

/** Initializes chat box */
function init_chat_box() {
    si("chatbox-scroller","");
    chat_add_line("Page loaded");
}

/** Adds line to chat
 * @param {string} l - chat text
 */
function chat_add_line(l) {
    var c = gc("chatbox-scroller");

    l=chat_timestring(Date.now())+" "+l;
    si("chatbox-scroller",l+"<br>"+c);
}

/** Gets time string for chat message
 * @param {Date} t - Time for string
 * @return {string} Time string
 */
function chat_timestring(t) {
    var d = new Date(t);

    if (settings.chattz == 1) {
        return "["+lts(d)+"]";
    } else {
        return "["+uts(d)+"]";
    }
}

/** Initializes Websockets connection */
function init_ws() {
    ws = new WebSocket(get_ws_url("/ws"));

    ws.onopen=ws_onopen;
    ws.onmessage=ws_onmessage;
    ws.onclose=ws_onclose;
    ws.onerror=ws_onerror;
}

/** Generates WebSockets URL 
 * @param {string} path - Websockets path
 * @return {string} Websockets URL
 */
function get_ws_url(path) {
    var proto, host, port;

    proto = ((window.location.protocol.indexOf("https")>0)?"wss://":"ws://");
    host = window.location.hostname;
    port = ":" + window.location.port;
    return proto + host + port + path;
}

/** onopen handler for Websockets */
function ws_onopen() {
    var o = {};

    chat_add_line("WebSocket connection established");
    o.cmd = "join";
    o.logtype = "normal";
    o.isStatus = false;
    o.session = get_session();
    ws_send_message(o);
    send_band_mode();
    hide_overlay();
}

/** onmessage handler for Websockets
 * @param {string} m - JSON message string
 */
function ws_onmessage(m) {
    var o = JSON.parse(m.data);

    //console.log(m);
    chat_add_line("WebSocket message: "+o.cmd);
    switch(o.cmd) {
        case "feed":
            add_to_feed(o);
            break;
        case "log":
            init_log(o);
            break;
        case "chat":
            chat_add_line(o.message);
            break;
        case "online":
            update_users_online(o.online);
            break;
        case "redir":
            redir(o.redir);
            break;
        case "settings":
            if (o.settings) {
                settings.chattz = o.settings.chattz || 0;
                settings.distunit = o.settings.distunit || 0;
                settings.logtz = o.settings.logtz || 0;
                settings.dateform = o.settings.dateform || 0;
            }
            break;
        case "stainfo":
            if (o.stainfo) {
                stainfo.grid = o.stainfo.grid || "JJ00aa";
            }
            break;
        case "mode":
            if (o.mode) {
                current_mode = o.mode;
                si("entryboxmode",o.mode);
            } else current_mode = "20m";
            if (o.band) {
                current_band = o.band;
                si("entryboxband",o.band);
            } else current_band = "SSB";
            send_band_mode();
            break;
        default:
            console.log("unknown message from server: "+o.cmd);
            break;
    }
}

/** onclose handler for Websockets */
function ws_onclose() {
    chat_add_line("WebSocket connection lost");
    set_overlay(create_panel("","Reconnecting...","reconn",{extra_classes: "vcenter centered", no_header: true}));
    show_overlay();
    setTimeout(init,2000);
}

/** onerror handler for Websockets */
function ws_onerror() {
    chat_add_line("WebSocket error");
}

/** Gets session string
 * @return {string} Session ID
 */
function get_session() {
    return get_param('session') || "DEFAULT";
}

/** Sends message object as JSON to server
 * @param {object} obj - Message
 * @param {string} obj.cmd - Command
 */
function ws_send_message(obj) {
    if (ws==undefined) return; // for you, firefox
    ws.send(JSON.stringify(obj));
}

/** Sends band and mode to server */
function send_band_mode() {
    var o = {};

    o.cmd = "mode";
    o.band = current_band;
    o.mode = current_mode;
    o.session = get_session();
    ws_send_message(o);
}

/** onclick handler for log button */
function btn_log()  {
    var o = {};

    if (gv("qsocall").trim() == "") return;
    o.cmd = "qso";
    o.timestamp = Date.now();
    o.callsign = gv("qsocall").toUpperCase();
    o.comment = gv("qsocomment");
    o.session = get_session();
    ws_send_message(o);
    sv("qsocall","");
    sv("qsocomment","");
    fe("qsocall");
}

/** escapes unsafe HTML characters from string
 * @param {string} unsafe - Input string
 * @return Output string
 */
function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/** Adds QSO to feed
 * @param {object} qso - QSO to add
 */
function add_to_feed(qso) {
    var d = new Date(qso.timestamp);
    var s,date,time;

    switch(settings.logtz) {
        case 1:
            time = lts(d);
            date = lds(d);
            break;
        case 0:
        default:
            time = uts(d);
            date = uds(d);
            break;
    }
    s = build_tblrow("td",[(qso.mine?"<a href=\"javascript:void(0);\" onclick=\"btn_delqso("+qso.id+")\">X</a>":""),qso.fmcallsign, qso.fmoperator, qso.band, qso.mode, qso.dxcallsign, time, date, qso.comment]);
    qfbody = s + qfbody;
    update_qso_feed();
}

/** Initializes QSO feed
 * @param {object} obj
 * @param {object[]} obj.log
 */
function init_log(obj) {
    qfbody = "";
    for (var i=0;i<obj.log.length;i++) {
        obj.log[i].mine = true;
        add_to_feed(obj.log[i]);
    }
    update_qso_feed();
}

/** onclick handler for chat send button */
function btn_chatsend() {
    var obj = {};
    var msg = escapeHTML(gv("chatboxtext"));

    if (msg=="") {
        sv("chatboxtext","");
        return;
    }
    obj.cmd = "chat";
    obj.message = msg;
    obj.session = get_session();
    ws_send_message(obj);
    sv("chatboxtext","");
}

/** onclick handler for operators online button */
function btn_opsonline() {
    var cont = "<table class=\"table\">";

    cont+="<thead>";
    cont+=build_tblrow("th",["Operator","Band","Mode"]);
    cont+="</thead><tbody>";
    for (var i=0;i<online_ops.length;i++) {
        cont+=build_tblrow("td",[online_ops[i].operator, online_ops[i].band, online_ops[i].mode]);
    }
    cont+="</tbody></table>";
    cont+="<br><button class=\"btn btn-info\" onclick=\"btn_opsonline_close();\">Close</button>";
    set_overlay(create_panel("Operators online", cont, "olpan", {extra_classes: "vcenter centered"}));
    show_overlay();
}

/** onclick handler for operators online close button */
function btn_opsonline_close() {
    hide_overlay();
}

/** updates online operators list
 * @param {object[]} o
 */
function update_users_online(o) {
    var s = "";

    online_ops = o;
    if (online_ops.length == 1) {
        s = "1 operator online";
    } else {
        s = online_ops.length+" operators online";
    }
    si("opsonline",s);
}

/** onclick handler for band button */
function btn_band() {
    var cont = "";

    for (var i=0;i<bands.length;i++) {
        if (bands[i] == current_band) {
            cont+="<button class=\"btn btn-success\" onclick=\"btn_band_set("+i+");\">"+bands[i]+"</button>&nbsp;";
        } else {
            cont+="<button class=\"btn btn-default\" onclick=\"btn_band_set("+i+");\">"+bands[i]+"</button>&nbsp;";
        }
    }
    cont+="<hr><button class=\"btn btn-info\" onclick=\"btn_band_close();\">Close</button>";
    set_overlay(create_panel("Select Band", cont, "selband", {extra_classes: "vcenter centered"}));
    show_overlay();
}

/** onclick handler for band close button */
function btn_band_close() {
    hide_overlay();
}

/** onclick handler for band set button
 * @param {number} i - Band index
 */
function btn_band_set(i) {
    set_band(bands[i]);
    btn_band();
}

/** onclick handler for mode button */
function btn_mode() {
    var cont = "";

    for (var i=0;i<modes.length;i++) {
        if (modes[i] == current_mode) {
            cont+="<button class=\"btn btn-success\" onclick=\"btn_mode_set("+i+");\">"+modes[i]+"</button>&nbsp;";
        } else {
            cont+="<button class=\"btn btn-default\" onclick=\"btn_mode_set("+i+");\">"+modes[i]+"</button>&nbsp;";
        }
    }
    cont+="<hr><button class=\"btn btn-info\" onclick=\"btn_mode_close();\">Close</button>";
    set_overlay(create_panel("Select Mode", cont, "selmode", {extra_classes: "vcenter centered"}));
    show_overlay();
}

/** onclick handler for mode close button */
function btn_mode_close() {
    hide_overlay();
}

/** onclick handler for mode set button
 * @param {number} i - mode index
 */
function btn_mode_set(i) {
    set_mode(modes[i]);
    btn_mode();
}

/** updates time display in QSO entry box */
function update_time_box() {
    var d = new Date();
    //var u = "UTC: "+d.getUTCHours()+":"+d.getUTCMinutes()+":"+d.getUTCSeconds();
    var u = "UTC: "+uts(d);
    //var l = "Local: "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
    var l = "Local: "+lts(d);

    si("timebox",u+" / "+l);
}

/** onclick handler for settings button */
function btn_settings() {
    var cont = "";

    cont = "Chat time zone: <select id=\"settings_chattz\"><option>UTC</option><option>Local</option></select><br>";
    cont+= "Log time zone: <select id=\"settings_logtz\"><option>UTC</option><option>Local</option></select><br>";
    cont+= "Date format: <select id=\"settings_dateform\"><option>mm/dd</option><option>dd/mm</option></select><br>";
    cont+= "Distance units: <select id=\"settings_distunit\"><option>Kilometers</option><option>Miles</option></select>";
    cont+= "<hr><button class=\"btn btn-info\" onclick=\"btn_settings_close();\">Close</button>";
    set_overlay(create_panel("Settings", cont, "settings", {extra_classes: "vcenter centered"}));
    ge("settings_chattz").selectedIndex = settings.chattz;
    ge("settings_distunit").selectedIndex = settings.distunit;
    ge("settings_logtz").selectedIndex = settings.logtz;
    ge("settings_dateform").selectedIndex = settings.dateform;
    show_overlay();
}

/** onclick handler for settings close button */
function btn_settings_close() {
    var o = {};

    settings.chattz = ge("settings_chattz").selectedIndex;
    settings.distunit = ge("settings_distunit").selectedIndex;
    settings.logtz = ge("settings_logtz").selectedIndex;
    settings.dateform = ge("settings_dateform").selectedIndex;
    hide_overlay();
    o.cmd = "settings";
    o.settings = settings;
    ws_send_message(o);
}

/** Gets UTC time string
 * @param {Date} d - Time
 * @return {string} UTC time string
 */
function uts(d) {
    var h = ("0"+d.getUTCHours()).slice(-2);
    var m = ("0"+d.getUTCMinutes()).slice(-2);
    var s = ("0"+d.getUTCSeconds()).slice(-2);

    return h+":"+m+":"+s;
}

/** Gets local time string
 * @param {Date} d - Time
 * @return {string} local time string
 */
function lts(d) {
    var h = ("0"+d.getHours()).slice(-2);
    var m = ("0"+d.getMinutes()).slice(-2);
    var s = ("0"+d.getSeconds()).slice(-2);

    return h+":"+m+":"+s;
}

/** Gets UTC date string
 * @param {Date} d - Date
 * @return {string} UTC date string
 */
function uds(d) {
    var m = ("0"+(d.getUTCMonth()+1)).slice(-2);
    var d2 = ("0"+d.getUTCDate()).slice(-2);
    var y = d.getUTCFullYear();

    if (settings.dateform == 1) return d2+"/"+m+"/"+y;
    else return m+"/"+d2+"/"+y;
}

/** Gets local date string
 * @param {Date} d - Date
 * @return {string} UTC date string
 */
function lds(d) {
    var m = ("0"+(d.getMonth()+1)).slice(-2);
    var d2 = ("0"+d.getDate()).slice(-2);
    var y = d.getFullYear();

    if (settings.dateform == 1) return d2+"/"+m+"/"+y;
    else return m+"/"+d2+"/"+y;
}

/** Gets a URL parameter
 * @param {string} name - Parameter name
 * @return {string} Parameter value
 */
function get_param(name) {
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}

/** onclick handler for delete QSO button
 * @param {number} id - QSO id
 */
function btn_delqso(id) {
    var o = {};

    o.cmd = "delete";
    o.id = id;
    ws_send_message(o);
}

/** onclick handler for filters button */
function btn_filters() {
    var cont = "";

    for (var i=0;i<filters.length;i++) {
        if (i == current_filter) {
            cont+="<button class=\"btn btn-success\" onclick=\"btn_filter_set("+i+");\">"+filters[i]+"</button>&nbsp;";
        } else {
            cont+="<button class=\"btn btn-default\" onclick=\"btn_filter_set("+i+");\">"+filters[i]+"</button>&nbsp;";
        }
    }
    cont+="<hr><button class=\"btn btn-info\" onclick=\"btn_filter_close();\">Close</button>";
    set_overlay(create_panel("Select Filter", cont, "selfilt", {extra_classes: "vcenter centered"}));
    show_overlay();
}

/** onclick handler for filter set button
 * @param {number} i - Filter index
 */
function btn_filter_set(i) {
    set_filter(i);
    btn_filters();
}

/** Sets current filter and sends to server
 * @param {number} i - Filter index
 */
function set_filter(i) {
    var o = {};

    current_filter = i;
    o.cmd = "filter";
    o.filter = i;
    ws_send_message(o);
}

/** onclick handler for filter close button */
function btn_filter_close() {
    hide_overlay();
}

/** onchange handler for the QSO callsign */
function onchange_qsocall() {
    var cs = gv("qsocall").toUpperCase();
    var s = "";

    if (cs=="") {
        si("country","");
        return;
    }
    var o = CtyDat.decodeCallsign(cs);
    if (o) {
        r = GridSquare.distance(stainfo.grid,o.latitude,o.longitude);
        s = "Country: <b>"+o.name+"</b><br>";
        s+= "CQ: <b>"+o.cq+"</b>&nbsp;ITU: <b>"+o.itu+"</b><br>";
        s+= "Lat: <b>"+o.latitude+"</b>&nbsp;Lon: <b>"+o.longitude+"</b><br>";
        s+= "Vec: <b>"+r.angle.toFixed(2)+"</b>&deg;&nbsp;("+bearing_to_cardinal(r.angle)+")&nbsp;<b>"+encode_distance(r.distance)+"</b>";
    } else {
        s = "";
    }
    si("country",s);
}

/** initializes CtyDat database */
function init_cty_dat() {
    CtyDat.loadFromURL(gfu("/cty.dat"),onctyload);
}

/** onload callback for cty.dat */
function onctyload() {
    console.log("cty.dat loaded");
}

/** onclick callback for station info button */
function btn_stainfo() {
    var cont = "";

    cont+="Gridsquare: <input type=\"text\" id=\"stainfo_grid\" onchange=\"stainfo_grid_change();\"><br>";
    cont+="<span id=\"stainfo_loc\"></span><br>";
    cont+="<hr><button class=\"btn btn-info\" onclick=\"btn_stainfo_close();\">Close</button>";
    set_overlay(create_panel("Station Information", cont, "stainfo", {extra_classes: "vcenter centered"}));
    sv("stainfo_grid",stainfo.grid);
    stainfo_grid_change();
    show_overlay();
}

/** onclick callback for station info close button */
function btn_stainfo_close() {
    var o = {};

    stainfo.grid = gv("stainfo_grid");
    hide_overlay();
    o.cmd = "stainfo";
    o.stainfo = stainfo;
    ws_send_message(o);
}

/** onchange handler for station info grid square */
function stainfo_grid_change() {
    var coord = GridSquare.decode(gv("stainfo_grid"));

    si("stainfo_loc","Lat: <b>"+coord.lat+"</b> Lon: <b>"+coord.lon+"</b>");
}

/** encodes distance with proper units
 * @param {number} mtrs - Distance in meters
 * @return {string} Distance string
 */
function encode_distance(mtrs) {
    var km = mtrs/1000;
    var mi = km/1.609;

    switch(settings.distunit) {
        case 0: 
            return km.toFixed(4)+" km";
        case 1:
            return mi.toFixed(2)+" mi";
        default:
            return mtrs+" m";
    }
}

/** onkeyup handler for qso entry box */
function qsoln_keyup(event) {
    if (event.key.toUpperCase() == "ENTER") {
        btn_log();
    }
}

/** onkeyup handler for chat box */
function chat_keyup(event) {
    if (event.key.toUpperCase() == "ENTER") {
        btn_chatsend();
    }
}

/** onclick handler for solar button */
function btn_solar() {
    var cont = "";

    current_solar = solar_sources.length;
    cont+="<a href=\"javascript:void(0);\" onclick=\"solar_advance();\"><img id=\"solarimg\" src=\"http://www.hamqsl.com/solarpic.php\"></a>";
    cont+="<br>Solar Data Source: <a href=\"http://www.hamqsl.com/solar.html\" id=\"solarlink\" target=\"_blank\">HamQSL.com (N0NBH)</a>";
    cont+="<hr><button class=\"btn btn-info\" onclick=\"btn_solar_close();\">Close</button>";
    set_overlay(create_panel("Solar Information", cont, "solar", {extra_classes: "vcenter centered"}));
    solar_advance();
    show_overlay();
}

/** Advances to the next solar data format */
function solar_advance() {
    current_solar++;
    if (current_solar>=solar_sources.length) current_solar = 0;

    ge("solarimg").src = solar_sources[current_solar].img;
    ge("solarlink").href = solar_sources[current_solar].link;
    si("solarlink",solar_sources[current_solar].text);
}

/** onclick handler for solar window close button */
function btn_solar_close() {
    hide_overlay();
}

/** converts a bearing to a cardinal direction 
 * @param {number} deg - Degrees
 * @return {string} Direction string (e.g. N,SW,ENE)
 */
function bearing_to_cardinal(deg) {
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

/** onclick handler for export button */
function btn_export() {
    coming_soon();
}

/** onclick handler for import button */
function btn_import() {
    coming_soon();
}

/** Shows a simple overlay to indicate a feature is coming soon */
function coming_soon() {
    var cont = "Coming soon...<br><br><button class=\"btn btn-info\" onclick=\"coming_soon_close();\">Close</a>";

    set_overlay(create_panel("",cont,"coming_soon",{extra_classes: "vcenter centered", no_header: true}));
    show_overlay();
}

/** Closes coming soon overlay */
function coming_soon_close() {
    hide_overlay();
}