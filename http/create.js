/** onclick handler for create button */
function btn_create() {
    if (!check_passwords()) return;
    set_overlay("<div class=\"panel vcenter centered\" id=\"loadpan\">Creating</div>");
    loadInt = setInterval(updateLoadingPanel,750);
    loadPd = 0;
    si("alertbox","");
    show_overlay();
    
    $.post(
        "/create_post",
        {callsign: gv("callsign").toUpperCase(), password: gv("passwd")},
        createcb,
        "json",
        );
}

/** Checks password boxes
 * @return {boolean} True if passwords match
 */
function check_passwords() {
    if (gv("passwd")!=gv("passwd2")) {
        setAlert("danger","Passwords don't match");
        return false;
    }
    return true;
}

/** Sets alert box
 * @param {string} typ - Alert type
 * @param {string} txt - Alert text
 */
function setAlert(typ,txt) {
    si("alertbox","<div class=\"alert alert-"+typ+"\">"+txt+"</div>");
}

/** Updates the animation of the loading panel */
function updateLoadingPanel() {
    var s = "";

    loadPd = (loadPd+1)%4;
    for (var i=0;i<loadPd;i++) s+=".";
    si("loadpan","Creating"+s);
}

/** POST callback */
function createcb(d,s,x) {
    clearInterval(loadInt);
    console.log(d);
    //hide_overlay();
    //redir("/log?session="+d.session); // todo: get this from server

    if (d.error) {
        hide_overlay();
        switch(d.error) {
            case "callinuse":
                setAlert("danger","Callsign already registered");
                break;
            default:
                setAlert("danger","Unknown error");
                break;
        }
    } else {
        setAlert("success","Account created. Redirecting to login page...");
        hide_overlay();
        setTimeout(redircb,5000);
    }
}

/** Redirect to login */
function redircb() {
    redir("/login");
}