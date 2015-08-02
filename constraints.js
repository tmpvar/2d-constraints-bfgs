var constraints = module.exports = {};

var debug = process.env.DEBUG ? console.log : function() {};
var cos = Math.cos;
var pow = Math.pow;
var sqrt = Math.sqrt;

function hypot() {
  var y = 0;
  var length = arguments.length;

  for (var i = 0; i < length; i++) {
    if (arguments[i] === Infinity || arguments[i] === -Infinity) {
      return Infinity;
    }
    y += arguments[i] * arguments[i];
  }
  return sqrt(y);
}

function injectPoints(orig, values) {
  var l = orig.length;
  var vwhere = 0;
  for (var i=0; i<l; i++) {
    orig[i][0] = values[vwhere++];
    orig[i][1] = values[vwhere++];
  }
}

function extractPoints(args, addComponent) {
  var l = args.length;
  for (var i=0; i<l; i++) {
    addComponent(args[i], 0);
    addComponent(args[i], 1);
  }
};

function injectTwoLines(args, values) {
  var line1 = args[0];
  var line2 = args[1];
  var a = line1[0];
  var b = line1[1];
  var c = line2[0];
  var d = line2[1];

  a[0] = values[0];
  a[1] = values[1];
  b[0] = values[2];
  b[1] = values[3];
  c[0] = values[4];
  c[1] = values[5];
  d[0] = values[6];
  d[1] = values[7];
}

function extractTwoLines(args, addComponent) {
  var line1 = args[0];
  var line2 = args[1];
  var a = line1[0];
  var b = line1[1];
  var c = line2[0];
  var d = line2[1];

  addComponent(a, 0);
  addComponent(a, 1);
  addComponent(b, 0);
  addComponent(b, 1);
  addComponent(c, 0);
  addComponent(c, 1);
  addComponent(d, 0);
  addComponent(d, 1);
};

constraints.horizontal = horizontalConstraint;

function horizontalConstraint(y1, y2) {
  var ydiff = y2 - y1;
  return ydiff * ydiff * 1000;
}

horizontalConstraint.size = 2;
horizontalConstraint.extract =  function(args, addComponent) {
  addComponent(args[0], 1)
  addComponent(args[1], 1)
};

horizontalConstraint.inject = function(orig, values) {
  orig[0][1] = values[0];
  orig[1][1] = values[1];
}

constraints.vertical = verticalConstraint;

function verticalConstraint(x1, x2) {
  var xdiff = x2 - x1;
  return xdiff * xdiff * 1000;
}

verticalConstraint.size = 2;

verticalConstraint.extract = function(args, addComponent) {
  addComponent(args[0], 0)
  addComponent(args[1], 0)
};

verticalConstraint.inject = function(orig, values) {
  orig[0][0] = values[0];
  orig[1][0] = values[1];
}

constraints.pointOnPoint = pointOnPoint;

function pointOnPoint(x1, y1, x2, y2) {
  var dx = x1 - x2;
  var dy = y1 - y2;

  return dx * dx + dy * dy;
}

pointOnPoint.size = 4;
pointOnPoint.extract = extractPoints
pointOnPoint.inject = injectPoints;

constraints.fixed = fixed;

function fixed(px, py, ox, oy) {
  return 0;
  var dx = px - ox;
  var dy = py - oy;

  return dx * dx + dy * dy;
}

fixed.size = 0;

fixed.extract = function(args) {
  // NOOP: no need to add points
}

fixed.inject = function(orig, values) {
  // NOOP: you can't change me sucka!!!
}

constraints.pointOnLine = pointOnLine;

function pointOnLine(px, py, x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;

  var m = dy / dx; //Slope
  var n = dx / dy; //1/Slope

  if(m<=1 && m>=-1) {
    //Calculate the expected y point given the x coordinate of the point
    var y = y1 + m * (px - x1);
    var yd = y - py;
    return yd * yd;
  } else {
    //Calculate the expected x point given the y coordinate of the point
    var x = x1 + n * (py - y1);
    var xd = x - px
    return xd * xd;
  }
}

pointOnLine.size = 6;

pointOnLine.extract = function(args, addComponent) {
  var point = args[0]
  var a = args[1];
  var b = args[2];

  addComponent(point, 0)
  addComponent(point, 1)

  addComponent(a, 0)
  addComponent(a, 1)
  addComponent(b, 0)
  addComponent(b, 1)
};

pointOnLine.inject = function(orig, values) {
  var point = orig[0]
  var a = orig[1];
  var b = orig[2];

  point[0] = values[0];
  point[1] = values[1];

  a[0] = values[2];
  a[1] = values[3];
  b[0] = values[4];
  b[1] = values[5];
}

module.exports.internalAngle = internalAngle;

function internalAngle(angle, l1sx, l1sy, l1ex, l1ey, l2sx, l2sy, l2ex, l2ey) {
  var d1x = l1ex - l1sx;
  var d1y = l1ey - l1sy;
  var d2x = l2ex - l2sx;
  var d2y = l2ey - l2sy;

  var hyp1 = hypot(d1x, d1y);
  var hyp2 = hypot(d2x, d2y);

  var d1x = d1x / hyp1;
  var d1y = d1y / hyp1;
  var dx2 = d2x / hyp2;
  var dy2 = d2y / hyp2;

  var temp = d1x * d2x + d1y * d2y;
  var temp2 = cos(angle);

  return (temp + temp2) * (temp + temp2);
}

internalAngle.size = 9;

internalAngle.extract = function(args, addComponent) {
  var angle = args[0];
  var a = args[1];
  var b = args[2];
  var c = args[3];
  var d = args[4];

  addComponent(angle);
  addComponent(a, 0);
  addComponent(a, 1);
  addComponent(b, 0);
  addComponent(b, 1);
  addComponent(c, 0);
  addComponent(c, 1);
  addComponent(d, 0);
  addComponent(d, 1);
};

internalAngle.inject = function(orig, values) {
  var angle = orig[0];
  var a = orig[1];
  var b = orig[2];
  var c = orig[3];
  var d = orig[4];

  // skip angle (index 0) as it's a constant

  a[0] = values[1];
  a[1] = values[2];
  b[0] = values[3];
  b[1] = values[4];
  c[0] = values[5];
  c[1] = values[6];
  d[0] = values[7];
  d[1] = values[8];
}

module.exports.equalLength = equalLength;

function equalLength(l1sx, l1sy, l1ex, l1ey, l2sx, l2sy, l2ex, l2ey) {
  var r = (hypot(l1ex - l1sx , l1ey - l1sy) - hypot(l2ex - l2sx, l2ey - l2sy));
  return r * r;
}

equalLength.size = 8;
equalLength.extract = extractPoints
equalLength.inject = injectPoints;

module.exports.lineLength = lineLength;

function lineLength(length, l1sx, l1sy, l1ex, l1ey) {
  var r = hypot(l1ex - l1sx , l1ey - l1sy) - length;
  return r * r;
}

lineLength.size = 5;

lineLength.extract = function(args, addComponent) {
  var length = args[0];
  var a = args[1];
  var b = args[2];

  addComponent(length);
  addComponent(a, 0);
  addComponent(a, 1);
  addComponent(b, 0);
  addComponent(b, 1);
};

lineLength.inject = function(orig, values) {
  // skip injecting `length` because it is a constant

  var a = orig[1];
  var b = orig[2];

  a[0] = values[1];
  a[1] = values[2];
  b[0] = values[3];
  b[1] = values[4];
}

module.exports.symmetricPoints = symmetricPoints;

function symmetricPoints(p1x, p1y, p2x, p2y, l1sx, l1sy, l1ex, l1ey) {
  var dx=l1ex-l1sx;
  var dy=l1ey-l1sy;

  var t = -(dy * p1x - dx * p1y - dy * l1sx + dx * l1sy) / (dx * dx + dy * dy);
  var ex = p1x + dy * t * 2;
  var ey = p1y - dx * t * 2;
  var tx = ex - p2x;
  var ty = ey - p2y;
  return tx * tx + ty * ty;
}

symmetricPoints.size = 8;

symmetricPoints.extract = function(args, addComponent) {
  var p1 = args[0];
  var p2 = args[1];
  var a = args[2];
  var b = args[3];

  addComponent(p1, 0);
  addComponent(p1, 1);
  addComponent(p2, 0);
  addComponent(p2, 1);
  addComponent(a, 0);
  addComponent(a, 1);
  addComponent(b, 0);
  addComponent(b, 1);
};

symmetricPoints.inject = function(orig, values) {
  var p1 = orig[0];
  var p2 = orig[1];
  var a = orig[2];
  var b = orig[3];

  p1[0] = values[0];
  p1[1] = values[1];
  p2[0] = values[2];
  p2[1] = values[3];
  a[0] = values[4];
  a[1] = values[5];
  b[0] = values[6];
  b[1] = values[7];
}

// TODO: try to reuse this for pointOnCircle
module.exports.pointToPointDistance = pointToPointDistance;

function pointToPointDistance(distance, p1x, p1y, p2x, p2y) {
  var dx = p2x - p1x;
  var dy = p2y - p1y;
  var r = hypot(dx, dy) - distance
  return  r*r;
}

pointToPointDistance.size = 4;

pointToPointDistance.extract = function(args, addComponent) {
  var distance = args[0];
  var p1 = args[1];
  var p2 = args[2];

  addComponent(distance);
  addComponent(p1, 0);
  addComponent(p1, 1);
  addComponent(p2, 0);
  addComponent(p2, 1);
};

pointToPointDistance.inject = function(args, values) {
  var distance = args[0];
  var p1 = args[1];
  var p2 = args[2];

  // skip backfilling distance

  p1[0] = values[1];
  p1[1] = values[2];
  p2[0] = values[3];
  p2[1] = values[4];
}

module.exports.perpendicular = perpendicular;

function perpendicular(l1sx, l1sy, l1ex, l1ey, l2sx, l2sy, l2ex, l2ey) {
  var dx1 = l1ex - l1sx;
  var dy1 = l1ey - l1sy;
  var dx2 = l2ex - l2sx;
  var dy2 = l2ey - l2sy;

  var hypotenuse1 = hypot(dx1, dy1);
  var hypotenuse2 = hypot(dx2, dy2);

  dx1 /= hypotenuse1;
  dy1 /= hypotenuse1;
  dx2 /= hypotenuse2;
  dy2 /= hypotenuse2;

  var r = dx1 * dx2 + dy1 * dy2;
  return r * r;
}

perpendicular.size = 8;
perpendicular.extract = extractPoints;
perpendicular.inject = injectPoints;

module.exports.parallel = parallel;

function parallel(l1sx, l1sy, l1ex, l1ey, l2sx, l2sy, l2ex, l2ey) {
  var dx1 = l1ex - l1sx;
  var dy1 = l1ey - l1sy;
  var dx2 = l2ex - l2sx;
  var dy2 = l2ey - l2sy;

  var r = dx1 * dy2 - dy1 * dx2
  return r * r;
}

parallel.size = 8;
parallel.extract = extractPoints;
parallel.inject = injectPoints;

module.exports.colinear = colinear;
function colinear(l1sx, l1sy, l1ex, l1ey, l2sx, l2sy, l2ex, l2ey) {
  var dx = l1ex - l1sx;
  var dy = l1ey - l1sy;

  var m=dy / dx;
  var n=dx / dy;
  var r = 0;

  // Calculate the error between the expected intersection point
  // and the true point of the second lines two end points on the
  // first line
  if(m <= 1 && m >- 1) {
    //Calculate the expected y point given the x coordinate of the point
    var ey1 = (l1sy + m * (l2sx - l1sx)) - l2sy;
    var ey2 = (l1sy + m * (l2ex - l1sx)) - l2ey;
    r = ey1 * ey1 + ey2 * ey2
  } else {
    //Calculate the expected x point given the y coordinate of the point
    var ex1 = (l1sx + n * (l2sy - l1sy)) - l2sx;
    var ex2 = (l1sx + n * (l2ey - l1sy)) - l2ex;
    r = ex1 * ex1 + ex2 * ex2;
  }
  return r;
}

colinear.size = 8;
colinear.extract = extractPoints;
colinear.inject = injectPoints;


constraints.pointOnLineMidpoint = pointOnLineMidpoint;
function pointOnLineMidpoint(px, py, x1, y1, x2, y2) {
  var mx = pow((x1 + x2) / 2 - px, 2);
  var my = pow((y1 + y2) / 2 - py, 2);
  return mx+my
}

pointOnLineMidpoint.size = 6;

pointOnLineMidpoint.extract = function(args, addComponent) {
  var point = args[0]
  var a = args[1];
  var b = args[2];

  addComponent(point, 0)
  addComponent(point, 1)

  addComponent(a, 0)
  addComponent(a, 1)
  addComponent(b, 0)
  addComponent(b, 1)
};

pointOnLineMidpoint.inject = function(orig, values) {
  var point = orig[0];
  var a = orig[1];
  var b = orig[2];

  point[0] = values[0];
  point[1] = values[1];

  a[0] = values[2];
  a[1] = values[3];
  b[0] = values[4];
  b[1] = values[5];
}
