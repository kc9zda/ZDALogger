var loadInt,loadPd;

/** onclick handler for login button */
function btn_login() {
    var cs = gv("callsign").toUpperCase();
    var op = gv("operator").toUpperCase();
    set_overlay("<div class=\"panel vcenter centered\" id=\"loadpan\">Logging In</div>");
    loadInt = setInterval(updateLoadingPanel,750);
    loadPd = 0;
    si("alertbox","");
    show_overlay();
    
    if (op == "") op = cs;
    $.post(
        "/login_post",
        {callsign: cs, operator: op, password: gv("paswd"), dest: gv("dest")},
        logincb,
        "json",
        );
}

/** Updates the animation of the loading panel */
function updateLoadingPanel() {
    var s = "";

    loadPd = (loadPd+1)%4;
    for (var i=0;i<loadPd;i++) s+=".";
    si("loadpan","Logging In"+s);
}

/** POST callback */
function logincb(d,s,x) {
    clearInterval(loadInt);
    console.log(d);
    //hide_overlay();
    //redir("/log?session="+d.session); // todo: get this from server

    if (d.error) {
        hide_overlay();
        switch(d.error) {
            case "nouser":
                setAlert("No such callsign registered");
                break;
            case "wrongpw":
                setAlert("Incorrect password");
                break;
            case "dupeop":
                setAlert("Operator already online");
                break;
            default:
                setAlert("Unknown error");
                break;
        }
    } else {
        redir(d.redir);
    }
}

/** Sets alert box
 * @param {string} txt - Alert text
 */
function setAlert(txt) {
    si("alertbox","<div class=\"alert alert-danger\">"+txt+"</div>");
}