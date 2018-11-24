var GridSquare = {};

/** Decodes a grid square string (up to 5 pairs)
 * @param {string} g - Grid Square up to 5 pairs (e.g. JJ00aa00aa)
 * @return {{lat: number, lon: number}} Object with coordinates of decoded grid square
 */
GridSquare.decode = function (g) {
    var lut;
    var r = {
        lat: 0,
        lon: 0
    };

    if (!GridSquare.dlut) {
        GridSquare.init();
    }
    lut = GridSquare.dlut;
    g = g.toUpperCase();
    if (g.length>=2) {
        r.lon = lut[0][g.charAt(0)];
        r.lat = lut[0][g.charAt(1)]/2;
    }
    if (g.length>=4) {
        r.lon += lut[1][g.charAt(2)]*2;
        r.lat += lut[1][g.charAt(3)];
    } 
    if (g.length>=6) {
        r.lon += lut[2][g.charAt(4)]*2;
        r.lat += lut[2][g.charAt(5)];
    } 
    if (g.length>=8) {
        r.lon += lut[3][g.charAt(6)]*2;
        r.lat += lut[3][g.charAt(7)];
    }
    if (g.length>=10) {
        r.lon += lut[4][g.charAt(8)]*2;
        r.lat += lut[4][g.charAt(9)];
    }
    r.lat -= 90;
    r.lon -= 180;
    return r;
}

/** Initializes lookup tables (LUTs) for encoding and decoding grid square locators */
GridSquare.init = function() {
    var dlut = [];
    var elut = [];

    dlut[0] = {};
    for(var i=0;i<18;i++) {
        dlut[0][String.fromCharCode(0x41+i)] = i*20;
    }
    dlut[1] = {};
    for (var i=0;i<10;i++) {
        dlut[1][String.fromCharCode(0x30+i)] = i;
    }
    dlut[2] = {};
    for (var i=0;i<24;i++) {
        dlut[2][String.fromCharCode(0x41+i)] = i/24;
    }
    dlut[3] = {};
    for (var i=0;i<10;i++) {
        dlut[3][String.fromCharCode(0x30+i)] = i/24/10;
    }
    dlut[4] = {};
    for (var i=0;i<24;i++) {
        dlut[4][String.fromCharCode(0x41+i)] = i/24/10/24;
    }

    elut[0] = [];
    for (var i=0;i<18;i++) {
        elut[0][i] = String.fromCharCode(0x41+i);
    }
    elut[1] = [];
    for (var i=0;i<24;i++) {
        elut[1][i] = String.fromCharCode(0x61+i);
    }
    GridSquare.elut = elut;
    GridSquare.dlut = dlut;
}

/** Calculates distance and bearing between a grid square and a set of coordinates or two gridsquares
 * @param {string} g1 - Grid square
 * @param {number|string} lat - Latitude or grid square
 * @param {number} [lon] - Longitude, no need to specify if lat is a grid square
 */
GridSquare.distance = function(g1,lat,lon) {
    var a,b;
    var angle,dist;

    if (typeof lat === "string") {
        b = GridSquare.decode(lat);
    } else {
        b = {};
        b.lat = lat;
        b.lon = lon;
    }
    a = GridSquare.decode(g1);
    dist = GridSquare.distance2(a,b);
    angle = GridSquare.bearing(a,b);
    return {distance: dist, angle: angle};
}

/** Does the math to calculate distance between two sets of latitude/longitude coordinates 
 * @param {{lat: number, lon: number}} a - Point A
 * @param {{lat: number, lon: number}} b - Point B
 * @return {number} Distance in meters
 */
GridSquare.distance2 = function(a,b) {
    function rad(n) {
        return n*Math.PI/180;
    }

    var R = 6371e3; // meters
    var theta1 = rad(a.lat);
    var theta2 = rad(b.lat);
    var deltaTheta = rad(b.lat-a.lat);
    var deltaLambda = rad(b.lon-a.lon);

    var a2 = Math.sin(deltaTheta/2) * Math.sin(deltaTheta/2) +
            Math.cos(theta1) * Math.cos(theta2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    var c = 2 * Math.atan2(Math.sqrt(a2),Math.sqrt(1-a2));
    var d = R * c;

    return d;
}

/** Calculates initial bearing between two points
 * @param {{lat: number, lon: number}} a - Point A (bearing based on this location)
 * @param {{lat: number, lon: number}} b - Point B
 * @return {number} 0 to 360 degrees from North
 */
GridSquare.bearing = function(a,b) {
    function rad(n) {
        return n*Math.PI/180;
    }

    function deg(n) {
        return n*180/Math.PI;
    }

    var theta1 = rad(a.lat);
    var theta2 = rad(b.lat);
    var lambda1 = rad(a.lon);
    var lambda2 = rad(b.lon);
    var y = Math.sin(lambda2-lambda1) * Math.cos(theta2);
    var x = Math.cos(theta1) * Math.sin(theta2) -
            Math.sin(theta1) * Math.cos(theta2) * Math.cos(lambda2-lambda1);
    var brng = deg(Math.atan2(y,x));

    if (brng<0) brng+=360;
    return brng;
}

/* THE CODE BELOW IS BROKEN */
/* GridSquare.encode = function(lat, lon, pairs) {
    var s = "";
    var la,lo;
    var lut;

    lat+=90;
    lon+=180;
    if (!GridSquare.elut) {
        GridSquare.init();
    }
    lut = GridSquare.elut;
    if (pairs>=1) {
        la = (lat/20)|0;
        lo = (lon/20)|0;
        s+=lut[0][lo];
        s+=lut[0][la*2+1];
    }
    if (pairs>=2) {
        la = (lat%10)|0;
        lo = (lon%20)|0;
        s+=(lo/2)|0;
        s+=la;
    }
    if (pairs>=3) {
        la = (((lat%10)%1)*24)|0;
        lo = (((lon%20)%1)*12)|0;
        s+=lut[1][lo];
        s+=lut[1][la];
    }
    console.log(s);
    return s;
} */