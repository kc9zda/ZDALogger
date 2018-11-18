var CtyDat = {
    list: []
};

/** Loads the cty.dat database from a URL
 * @param {string} url - URL to cty.dat file
 * @param {function} cb - Callback that signals when cty.dat is loaded
 */
CtyDat.loadFromURL = function(url,cb){
    function cb0() {
        CtyDat.loadFromText(this.responseText);
        cb();
    }

    var oReq = new XMLHttpRequest();

    oReq.addEventListener("load",cb0);
    oReq.open("GET",url);
    oReq.send();
};

/** Loads the cty.dat database from a string containing the entire contents of a cty.dat file
 * @param txt - contents of cty.dat
 */
CtyDat.loadFromText = function(txt) {
    var r = new CtyDat.StringReader(txt);

    while (!r.done) {
        CtyDat.readCountry(r);
    }
    CtyDat.list.splice(CtyDat.list.length-1,1); // last one is garbage for some reason
};

/** Reads a country from the cty.dat file
 * @param {CtyDat.StringReader} r - File reader
 */
CtyDat.readCountry = function(r) {
    var c = {};
    var s = "";
    var sa;

    c.name = r.readUntil(":").trim();
    c.cq = parseInt(r.readUntil(":").trim());
    c.itu = parseInt(r.readUntil(":").trim());
    c.continent = r.readUntil(":").trim();
    c.latitude = parseFloat(r.readUntil(":").trim());
    c.longitude = parseFloat(r.readUntil(":").trim());
    c.timeZone = r.readUntil(":").trim();
    c.primary = r.readUntil(":").trim();
    s = r.readUntil(";");
    sa = s.split(",");
    c.aliases = [];
    for (var i=0;i<sa.length;i++) {
        c.aliases.push(sa[i].trim());
    }
    CtyDat.list.push(c);
};


/** Decodes country/entity information from a callsign
 * @param {string} cs - Callsign
 * @return {object} Country information
 */
CtyDat.decodeCallsign = function(cs) {
    var sa = cs.split("/");
    var o;
    var a = [];
    var idx;
    var max = -1;
    
    cs = sa[0];
    for (var i=0;i<CtyDat.list.length;i++) {
        for (var j=0;j<CtyDat.list[i].aliases.length;j++) {
            o = CtyDat.checkAlias(cs,i,j);
            if (o) {
                a.push(o);
            }
        }
    }
    for (var i=0;i<a.length;i++) {
        if (a[i].prefix.length>max) {
            idx = i;
            max = a[i].prefix.length;
        }
    }
    return a[idx];
};

/** Checks callsign against aliases for a particular country
 * @param {string} cs - callsign
 * @param {number} i - country index
 * @param {number} j - alias index
 * @return {object} Country information, undefined if callsign doesn't match alias
 */
CtyDat.checkAlias = function(cs,i,j) {
    var o,a;

    //console.log("checkAlias: "+cs+" "+i+" "+j);
    a = CtyDat.decodeAlias(i,j);
    if (!CtyDat.checkAlias2(cs,a)) return undefined;
    o = CtyDat.copyEntry(i);
    o.index = a.index;
    o.isPrefix = a.isPrefix;
    o.prefix = (a.isPrefix?a.prefix:a.exact);
    if (!a) return o;
    if (a.cq) o.cq = a.cq;
    if (a.itu) o.itu = a.itu;
    if (a.latitude) o.latitude = a.latitude;
    if (a.longitude) o.longitude = a.longitude;
    if (a.continent) o.continent = a.continent;
    if (a.timeZone) o.timeZone = a.timeZone;
    return o;
};

/** Decodes an alias string
 * @param {number} i2 - country index
 * @param {number} j - alias index
 * @return {object} Country info
 */
CtyDat.decodeAlias = function(i2,j) {
    var s = CtyDat.list[i2].aliases[j];
    var a = {};
    var i = 0;
    var e = 0;
    var t = "";

    a.index = j;
    a.isPrefix = true;
    i = s.indexOf("(");
    if (i>=0) {
        e = s.indexOf(")");
        t = s.substring(i+1,e);
        a.cq = parseInt(t);
        s = CtyDat.stringsplice(s,i,e-i+1);
    }

    i = s.indexOf("[");
    if (i>=0) {
        e = s.indexOf("]");
        t = s.substring(i+1,e);
        a.itu = parseInt(t);
        s = CtyDat.stringsplice(s,i,e-i+1);
    }

    i = s.indexOf("=");
    if (i>=0) {
        a.isPrefix = false;
        s = CtyDat.stringsplice(s,i,1);
        a.exact = s;
    }
    
    if (a.isPrefix) {
        a.prefix = s;
    }

    return a;
};

/** Checks if a callsign is within an alias prefix
 * @param {string} cs - Callsign
 * @param {object} a - Alias object
 */
CtyDat.checkAlias2 = function(cs,a) {
    //console.log("checkAlias2: "+cs+" "+a.prefix);
    if (a.isPrefix) {
        return (cs.startsWith(a.prefix));
    } else {
        return cs==a.exact;
    }
}

/** Copies entry from country list
 * @param {number} i - Country index
 * @return {object} Clone of country object
 */
CtyDat.copyEntry = function(i) {
    var c = {};
    var o = CtyDat.list[i];

    c.name = o.name;
    c.cq = o.cq;
    c.itu = o.itu;
    c.continent = o.continent;
    c.latitude = o.latitude;
    c.longitude = o.longitude;
    c.timeZone = o.timeZone;
    c.primary = o.primary;
    return c;
}

/// STRING READER

/** Reads a cty.dat file
 * @param {string} s - countents of cty.dat file
 */
CtyDat.StringReader = function(s) {
    this.str = s;
    this.idx = 0;
    this.done = false;
};

/** Reads a string until a certain character is reached
 * @param {string} c - character
 * @return {string} string not including terminating character
 */
CtyDat.StringReader.prototype.readUntil = function(c) {
    var s = "";
    var t = "";

    if (this.done) return ""; // why is cty.dat formatted like this?
    t = this.getChar();
    while (t!=c) {
        s+=t;
        if (s.length>20000) {
            this.done = true;
            return s; // lets not slow down the browser
        }
        t = this.getChar();
        if (t=="") break; // also lets not slow down the browser
    }
    this.done = (this.str.length-this.idx)<1; // less than enough for any kind of use
    return s;
};

/** Reads character from string, increments index
 * @return {string} character
 */
CtyDat.StringReader.prototype.getChar = function() {
    var c = this.str.charAt(this.idx);
    this.idx++;
    return c;
};

/** Splices a string. For some reason, Javascript has no built-in functionality for this
 * @param {string} str - String to splice
 * @param {number} index - Index to start
 * @param {number} count - Characters to splice out
 * @return {string} Spliced string
 */
CtyDat.stringsplice = function(str,index,count) {
    if (index<0) {
        index = str.length + index;
        if (index < 0) {
            index = 0;
        }
    }

    return str.slice(0,index) + str.slice(index+count);
};