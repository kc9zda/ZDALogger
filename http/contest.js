var contests = [];

function init() {
    load_contests();
    display_contests();
    init_ping();
}

function load_contests() {
    contests.push({name: "Field Day", code: "fd", begin: new Date("2019-06-22T21:00:00"), end: new Date("2019-06-23T21:00:00")});
}

function display_contests() {
    var s = "";

    for (var i=0;i<contests.length;i++) {
        s+=gen_contest_html(i);
    }
    si("contest_select",s);
}

function gen_contest_html(i) {
    var c = contests[i];
    var s = "";

    s+=c.name+"("+c.code+") <br>";
    s+="Begin: "+c.begin+"<br> End: "+c.end+"<br>";
    s+="<a href=\"javascript:void(0);\" onclick=\"select_contest("+i+");\">Select</a>";
    s+="<hr>";
    return s;
}

function select_contest(i) {
    redir("/"+contests[i].code+"?session="+get_session());
}

function btn_back() {
    redir("/logout?"+get_session());
}

/** Gets session string
 * @return {string} Session ID
 */
function get_session() {
    return get_param('session') || "DEFAULT";
}

/** Gets a URL parameter
 * @param {string} name - Parameter name
 * @return {string} Parameter value
 */
function get_param(name) {
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}

/** Initializes ping to server */
function init_ping() {
    do_ping();
}

/** Sends a ping request to the server to keep session alive */
function do_ping() {
    function cb0() {
        setTimeout(do_ping,500*parseInt(this.responseText)); // ping at half timeout
    }

    var oReq = new XMLHttpRequest();
    var url = gfu("/ping?"+get_session());

    oReq.addEventListener("load",cb0);
    oReq.open("GET",url);
    oReq.send();
}