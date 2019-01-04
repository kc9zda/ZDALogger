var ZDALOG;

/** Field day logging object */
function FieldDayLog() {
    BaseLog.call(this);
    this.removeBands(["60m","30m","17m","12m"]);
    this.update_qsohr_stat();
    setInterval(this.update_qsohr_stat.bind(this),10000);
}

FieldDayLog.prototype = Object.create(BaseLog.prototype);

/** onchange handler for the QSO callsign */
FieldDayLog.prototype.onchange_qsocall = function() {
    var cs = gv("qsocall").toUpperCase();
    var s = "";
    var dl = [];

    if (cs=="") {
        si("dupecheck","");
        si("country","");
        return;
    }
    var o = CtyDat.decodeCallsign(cs);
    if (o) {
        r = GridSquare.distance(this.stainfo.grid,o.latitude,o.longitude);
        s = "Country: <b>"+o.name+"</b><br>";
        //s+= "CQ: <b>"+o.cq+"</b>&nbsp;ITU: <b>"+o.itu+"</b><br>";
        //s+= "Lat: <b>"+o.latitude+"</b>&nbsp;Lon: <b>"+o.longitude+"</b><br>";
        s+= "Vec: <b>"+r.angle.toFixed(2)+"</b>&deg;&nbsp;("+this.bearing_to_cardinal(r.angle)+")&nbsp;<b>"+this.encode_distance(r.distance)+"</b>";
    } else {
        s = "";
    }
    si("country",s);

    for (var i=0;i<this.log.length;i++) {
        if (((Date.now()-this.log[i].timestamp) < (2*86400*1000)) && (this.log[i].contest && this.log[i].contest == "fd") && this.log[i].mine && (this.log[i].band == this.current_band) && (this.log[i].mode == this.current_mode) && (this.log[i].dxcallsign.indexOf(cs) >= 0)) {
            dl.push(this.log[i]);
        }
    }
    if (dl.length>0) {
        s = "Possible Duplicates:";
        for (var i=0;i<dl.length;i++) {
            s+=" "+dl[i].dxcallsign;
        }
        si("dupecheck",s);
    } else {
        si("dupecheck","");
    }
}

/** onclick callback for station info button */
FieldDayLog.prototype.btn_stainfo = function() {
    var cont = "";

    cont+="Gridsquare: <input type=\"text\" id=\"stainfo_grid\" onchange=\"ZDALOG.stainfo_grid_change();\"><br>";
    cont+="<span id=\"stainfo_loc\"></span><br>";
    cont+="<hr><button class=\"btn btn-info\" onclick=\"ZDALOG.btn_stainfo_close();\">Close</button>";
    set_overlay(create_panel("Station Information", cont, "stainfo", {extra_classes: "vcenter centered"}));
    sv("stainfo_grid",stainfo.grid);
    this.stainfo_grid_change();
    show_overlay();
}

/** onclick handler for log button */
FieldDayLog.prototype.btn_log = function()  {
    var o = {};

    if (gv("qsocall").trim() == "") return;
    o.cmd = "qso";
    o.timestamp = Date.now();
    o.callsign = gv("qsocall").toUpperCase();
    o.section = gv("qsosection").toUpperCase();
    o.class = gv("qsoclass").toUpperCase();
    o.comment = "&lt;FD&gt;"+o.class+" "+o.section;
    o.session = this.get_session();
    this.ws_send_message(o);
    sv("qsocall","");
    sv("qsosection","");
    sv("qsoclass","");
    fe("qsocall");
}

/** onclick callback for station info close button */
FieldDayLog.prototype.btn_stainfo_close = function() {
    var o = {};

    this.stainfo.grid = gv("stainfo_grid");
    hide_overlay();
    o.cmd = "stainfo";
    o.stainfo = this.stainfo;
    this.ws_send_message(o);
}

/** onopen handler for Websockets */
FieldDayLog.prototype.ws_onopen = function() {
    var o = {};

    this.chat_add_line("WebSocket connection established");
    o.cmd = "join";
    o.logtype = "contest";
    o.contest = "fd";
    o.isStatus = false;
    o.session = this.get_session();
    this.ws_send_message(o);
    this.send_band_mode();
    hide_overlay();
}

/** Initialize log table */
FieldDayLog.prototype.init_qso_feed = function() {
    this.qfhead = this.build_tblrow("th",["","FromCall", "FromOp", "Freq", "Mode", "Call", "Time", "Date", "Class", "Section"]);
    this.qfbody = "";
    this.update_qso_feed();
}

/** Adds QSO to feed
 * @param {object} qso - QSO to add
 */
FieldDayLog.prototype.add_to_feed = function(qso) {
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
    s = this.build_tblrow("td",[(qso.mine?"<a href=\"javascript:void(0);\" onclick=\"ZDALOG.btn_delqso("+qso.id+")\">X</a>":""),qso.fmcallsign, qso.fmoperator, qso.band, qso.mode, qso.dxcallsign, time, date, (qso.class||" "), (qso.section||" ")]);
    this.qfbody = s + this.qfbody;
    this.update_qso_feed();
}

/** Update QSO/Hour stat */
FieldDayLog.prototype.update_qsohr_stat = function() {
    var mine_list = [];
    var count = 0;

    for (var i=0;i<this.log.length;i++) {
        if (((Date.now()-this.log[i].timestamp) < (60*60*1000)) && (this.log[i].contest && this.log[i].contest == "fd") && this.log[i].mine) {
            count++;
        }
    }
    si("qsohrstat","QSO/hr: "+count);
}

/** Initialize logging object */
function init() {
    ZDALOG = new FieldDayLog();
}