var ZDALOG;

/** Field day logging object */
function FieldDayLog() {
    BaseLog.call(this);
    this.stats = {
        qso_hr_20: -1,
        qso_hr_60: -1,
        ph_count: 0,
        cw_count: 0,
        dig_count: 0,
        points: 0,
    };
    this.dxcall_changed = false;
    this.removeBands(["60m","30m","17m","12m"]);
    this.groupnames = ["0","1","2","3","4","5","6","7","8","9","Canada","DX"];
    this.sections = [];
    this.sections[0] = ["CO", "IA", "KS", "MN", "MO", "ND", "NE", "SD"];
    this.sections[1] = ["CT", "EMA", "ME", "NH", "RI", "VT", "WMA"];
    this.sections[2] = ["ENY", "NLI", "NNJ", "NNY", "SNJ", "WNY"];
    this.sections[3] = ["DE", "EPA", "MDC", "WPA"];
    this.sections[4] = ["AL", "GA", "KY", "NC", "NFL", "PR", "SC", "SFL", "TN", "VA", "VI", "WCF"];
    this.sections[5] = ["AR", "LA", "MS", "NM", "NTX", "OK", "STX", "WTX"];
    this.sections[6] = ["EB", "LAX", "ORG", "PAC", "SB", "SCV", "SDG", "SF", "SJV", "SV"];
    this.sections[7] = ["AK", "AZ", "EWA", "ID", "MT", "NV", "OR", "UT", "WWA", "WY"];
    this.sections[8] = ["MI", "OH", "WV"];
    this.sections[9] = ["IL", "IN", "WI"];
    this.sections[10] = ["AB", "BC", "GTA", "MAR", "MB", "NL", "NT", "ONE", "ONN", "ONS", "QC", "SK"];
    this.sections[11] = ["DX"];

    this.update_stats();
    setInterval(this.update_stats.bind(this),10000);
}

FieldDayLog.prototype = Object.create(BaseLog.prototype);

/** onchange handler for the QSO callsign */
FieldDayLog.prototype.onchange_qsocall = function() {
    var cs = gv("qsocall").toUpperCase();
    var s = "";
    var dl = [];

    this.dxcall_changed = true;
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
    sv("stainfo_grid",this.stainfo.grid);
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
    if (qso.mine && ((Date.now() - qso.timestamp) < (60*1000))) {
        if (this.stats.sections.indexOf(qso.section) < 0) {
            this.stats.sections.push(qso.section);
        }
    }
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

/** Update statistics */
FieldDayLog.prototype.update_stats = function() {
    var shortlist = [];
    var count = 0;

    // generate shortlist
    for (var i=0;i<this.log.length;i++) {
        if (((Date.now()-this.log[i].timestamp) < (2*86400*1000)) && (this.log[i].contest && this.log[i].contest == "fd" && this.log[i].mystation)) {
            shortlist.push(this.log[i]);
        }
    }

    // QSO/hr (20)
    for (var i=0;i<shortlist.length;i++) {
        if ((Date.now()-shortlist[i].timestamp) < (20*60*1000)) {
            if (shortlist[i].mine) count++;
        }
    }
    this.stats.qso_hr_20 = count * 3;

    // QSO/hr (60)
    count = 0;
    for (var i=0;i<shortlist.length;i++) {
        if ((Date.now()-shortlist[i].timestamp) < (60*60*1000)) {
            if (shortlist[i].mine) count++;
        }
    }
    this.stats.qso_hr_60 = count;

    // PH/CW/DIG Stats
    this.stats.ph_count = 0;
    this.stats.cw_count = 0;
    this.stats.dig_count = 0;
    for (var i=0;i<shortlist.length;i++) {
        if (shortlist[i].mode == "PHONE") this.stats.ph_count++;
        if (shortlist[i].mode == "CW") this.stats.cw_count++;
        if (shortlist[i].mode == "DATA") this.stats.dig_count++;
    }

    // Points (2 for DIG, CW and 1 for PH)
    this.stats.points = (this.stats.cw_count * 2) + (this.stats.dig_count * 2) + this.stats.ph_count;

    // Sections
    if (!this.stats.sections && this.log) {
        this.stats.sections = [];
        for (var i=0;i<shortlist.length;i++) {
            if (this.stats.sections.indexOf(shortlist[i].section) < 0) {
                this.stats.sections.push(shortlist[i].section);
            }
        }
    }
}

/** Onfocus handler for contest exchange fields */
FieldDayLog.prototype.onfocus_qsoexchange = function() {
    var cs = gv("qsocall").toUpperCase();
    var dl = [];

    if (!this.dxcall_changed) return;
    this.dxcall_changed = false;
    for (var i=0;i<this.log.length;i++) {
        if (((Date.now()-this.log[i].timestamp) < (2*86400*1000)) && (this.log[i].contest && this.log[i].contest == "fd") && this.log[i].mine && (this.log[i].dxcallsign == cs)) {
            dl.push(this.log[i]);
        }
    }
    if (dl.length > 0) {
        sv("qsoclass",dl[0].class);
        sv("qsosection",dl[0].section);
    }
}

/** Onclick handler for stats button */
FieldDayLog.prototype.btn_stats = function() {
    var cont = "";

    cont+="<table><tr><td><div style=\"margin: 15px;\">";
    cont+="QSO/hr (60 min): "+this.stats.qso_hr_60+"<br>";
    cont+="QSO/hr (20 min): "+this.stats.qso_hr_20+"<br>";
    cont+="Phone QSOs: "+this.stats.ph_count+"<br>";
    cont+="CW QSOs: "+this.stats.cw_count+"<br>";
    cont+="Digital QSOs: "+this.stats.dig_count+"<br>";
    cont+="QSO Points: "+this.stats.points+"<br>";
    cont+="</div></td><td>";
    cont+="Sections:<br>";
    cont+="<table class=\"table\">";
    for (var i=0;i<this.groupnames.length;i++) {
        cont+="<tr><td>"+this.groupnames[i]+"</td><td>";
        for (var j=0;j<this.sections[i].length;j++) {
            var hs = (this.stats.sections.indexOf(this.sections[i][j])) >= 0;

            if (hs) cont+=(j==0?"":", ")+"<span class=\"section_worked\">"+this.sections[i][j]+"</span>";
            else cont+=(j==0?"":", ")+"<span class=\"section_not_worked\">"+this.sections[i][j]+"</span>";
        }
        cont+="</td></tr>";
    }
    cont+="</table>";
    cont+="</td></tr></table>";

    cont+="<hr><button class=\"btn btn-info\" onclick=\"ZDALOG.btn_stats_close();\">Close</button>";
    set_overlay(create_panel("Statistics", cont, "stats", {extra_classes: "vcenter centered"}));
    show_overlay();
}

/** Onclick handler for stats close button */
FieldDayLog.prototype.btn_stats_close = function() {
    hide_overlay();
}

/** Initialize logging object */
function init() {
    ZDALOG = new FieldDayLog();
}