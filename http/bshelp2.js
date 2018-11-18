/** Sets element's contents
 *  @param {string} i - Element ID
 *  @param {string} v - Element contents
 */
function si(i,v) {
    ge(i).innerHTML = v;
}

/** Gets the contents of an element
 * @param {string} i - Element ID
 * @return {string} Element contents
 */
function gc(i) {
    return ge(i).innerHTML;
}

/** Gets an element
 * @param {string} i - Element ID
 * @return {object} Element
 */
function ge(i) {
    return document.getElementById(i);
}

/** Sets value of element
 * @param {string} i - Element ID
 * @param {any} v - Element value
 */
function sv(i,v) {
    ge(i).value = v;
}

/** Gets value of element
 * @param {string} i - Element ID
 * @return {any} Element value
 */
function gv(i) {
    return ge(i).value;
}

/** Focuses element
 * @param {string} i - Element ID
 */
function fe(i) {
    ge(i).focus();
}

/** Sets contents of overlay
 * @param {string} c - Overlay contents
 */
function set_overlay(c) {
    si("overlay",c);
}

/** Shows overlay */
function show_overlay() {
    ge("overlay").style.visibility = "visible";
}

/** Hides overlay */
function hide_overlay() {
    ge("overlay").style.visibility = "hidden";
}

/** Generates a panel in HTML
 * @param {string} h - Header contents
 * @param {string} c - Panel contents
 * @param {string} i - Panel ID base
 * @param {object} [o] - Panel options
 * @param {string} [o.extra_classes] - Extra classes for the panel
 * @param {boolean} [o.no_header] - True for no header
 */
function create_panel(h,c,i,o) {
    var s;
    var hi,ci;
    var de = "</div>";

    o = o || {
        extra_classes: "",
        no_header: false
    };
    hi = i+"head";
    ci = i+"cont";
    s = '<div class="panel panel-default '+o.extra_classes+'" id="'+i+'">';
    if (!o.no_header) {
        s+= '<div class="panel-heading" id="'+hi+'" style="display: block;">';
        s+= h;
        s+= de;
    }
    s+= '<div class="panel-body" id="'+ci+'">';
    s+= c;
    s+= de;
    s+= de;
    return s;
}

/** Redirects browser to another path
 * @param {string} p - Path to redirect to
 */
function redir(p) {
    window.location.href = gfu(p);
}

/** Returns full HTTP path for a given path
 * @param {string} p - Path
 * @returns {string} Full HTTP URL
 */
function gfu(p) {
    var s="";

    s+=window.location.protocol;
    s+="//";
    s+=window.location.host;
    s+=p;
    return s;
}