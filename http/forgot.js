/** onclick handler for reset button */
function btn_reset() {
    set_overlay("<div class=\"panel vcenter centered\" id=\"loadpan\">Resetting</div>");
    loadInt = setInterval(updateLoadingPanel,750);
    loadPd = 0;
    si("alertbox","");
    show_overlay();
    
    $.post(
        "/forgot_post",
        {callsign: gv("callsign").toUpperCase()},
        resetcb,
        "json",
        );
}

/** Updates the animation of the loading panel */
function updateLoadingPanel() {
    var s = "";

    loadPd = (loadPd+1)%4;
    for (var i=0;i<loadPd;i++) s+=".";
    si("loadpan","Resetting"+s);
}

/** POST callback */
function resetcb(d,s,x) {
    clearInterval(loadInt);
    console.log(d);
    //hide_overlay();
    //redir("/log?session="+d.session); // todo: get this from server

    if (d.error) {
        hide_overlay();
        switch(d.error) {
            case "nouser":
                setAlert("danger","No such callsign registered");
                break;
            default:
                setAlert("danger","Unknown error");
                break;
        }
    } else {
        setAlert("success","Your new password is <b>"+d.newpw+"</b>");
        hide_overlay();
    }
}

/** Sets alert box
 * @param {string} typ - Alert type
 * @param {string} txt - Alert text
 */
function setAlert(typ,txt) {
    si("alertbox","<div class=\"alert alert-"+typ+"\">"+txt+"</div>");
}