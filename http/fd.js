/** @type {string[]} List of supported bands */
var bands = ["2200m","1750m","630m","160m","80m","60m","40m","30m","20m","17m","15m","12m","10m","6m","2m","1.25m","70cm","33cm","23cm","13cm","9cm","5cm","3cm","1.2cm","6mm","4mm","2.5mm","2mm","1mm"];
/** @type {string[]} List of supported modes */
var modes = ["CW","PHONE","IMAGE","DATA","AM","C4FM","DIGITALVOICE","DSTAR","FM","SSB","ATV","FAX","SSTV","AMTOR","ARDOP","CHIP","CLOVER","CONTESTI","DOMINO","FSK31","FSK441","FT8","GTOR","HELL","HFSK","ISCAT","JT4","JT65","JT6M","JT9","MFSK16","MFSK8","MINIRTTY","MSK144","MT63","OLIVIA","OPERA","PACKET","PAX","PSK10","PSK125","PSK2K","PSK31","PSK63","PSK63F","PSKAM","PSKFEC31","Q15","QRA64","ROS","RTTY","RTTYM","T10","THOR","THROB","VOI","WINMOR","WSPR"];

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

/** onclick handler for log button */
function btn_log()  {
    var o = {};

    if (gv("qsocall").trim() == "") return;
    o.cmd = "qso";
    o.timestamp = Date.now();
    o.callsign = gv("qsocall").toUpperCase();
    o.section = gv("qsosection");
    o.class = gv("qsoclass");
    o.comment = "&lt;FD&gt;"+o.class+" "+o.section;
    o.session = get_session();
    ws_send_message(o);
    sv("qsocall","");
    sv("qsosection","");
    sv("qsoclass","");
    fe("qsocall");
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

/** onopen handler for Websockets */
function ws_onopen() {
    var o = {};

    chat_add_line("WebSocket connection established");
    o.cmd = "join";
    o.logtype = "contest";
    o.contest = "fd";
    o.isStatus = false;
    o.session = get_session();
    ws_send_message(o);
    send_band_mode();
    hide_overlay();
}