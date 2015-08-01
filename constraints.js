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

constraints.horizontal = horizontalConstraint;

function horizontalConstraint(y1, y2) {
  var ydiff = y2 - y1;
  return ydiff * ydiff * 1000;
}

horizontalConstraint.size = 2;

horizontalConstraint.extract = function(args, addComponent) {
  var line = args[0];
  addComponent(line[0], 1)
  addComponent(line[1], 1)
};

horizontalConstraint.inject = function(orig, values) {
  orig[0][0][1] = values[0];
  orig[0][1][1] = values[1];
}

constraints.vertical = verticalConstraint;

function verticalConstraint(x1, x2) {
  var xdiff = x2 - x1;
  return xdiff * xdiff * 1000;
}

verticalConstraint.size = 2;

verticalConstraint.extract = function(args, addComponent) {
  var line = args[0];
  addComponent(line[0], 0)
  addComponent(line[1], 0)
};

verticalConstraint.inject = function(orig, values) {
  orig[0][0][0] = values[0];
  orig[0][1][0] = values[1];
}

constraints.pointOnPoint = pointOnPoint;

function pointOnPoint(x1, y1, x2, y2) {
  var dx = x1 - x2;
  var dy = y1 - y2;

  return dx * dx + dy * dy;
}

pointOnPoint.size = 4;
pointOnPoint.extract = function(args, addComponent) {
  addComponent(args[0], 0);
  addComponent(args[0], 1);
  addComponent(args[1], 0);
  addComponent(args[1], 1);
};

pointOnPoint.inject = function(orig, values) {

  orig[0][0] = values[0];
  orig[0][1] = values[1];
  orig[1][0] = values[2];
  orig[1][1] = values[3];
}

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
  var line = args[1];
  var a = line[0];
  var b = line[1];

  addComponent(point, 0)
  addComponent(point, 1)

  addComponent(a, 0)
  addComponent(a, 1)
  addComponent(b, 0)
  addComponent(b, 1)
};

pointOnLine.inject = function(args, values) {
  var point = args[0]
  var line = args[1];
  var a = line[0];
  var b = line[1];

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
  var line1 = args[1];
  var line2 = args[2];
  var a = line1[0];
  var b = line1[1];
  var c = line2[0];
  var d = line2[1];

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

internalAngle.inject = function(args, values) {
  var angle = args[0];
  var line1 = args[1];
  var line2 = args[2];
  var a = line1[0];
  var b = line1[1];
  var c = line2[0];
  var d = line2[1];

  args[0] = values[0];
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

equalLength.extract = function(args, addComponent) {
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

equalLength.inject = function(args, values) {
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

module.exports.lineLength = lineLength;

function lineLength(length, l1sx, l1sy, l1ex, l1ey) {
  var r = hypot(l1ex - l1sx , l1ey - l1sy) - length;
  return r * r;
}

lineLength.size = 5;

lineLength.extract = function(args, addComponent) {
  var length = args[0];
  var line1 = args[1];
  var a = line1[0];
  var b = line1[1];

  addComponent(length);
  addComponent(a, 0);
  addComponent(a, 1);
  addComponent(b, 0);
  addComponent(b, 1);
};

lineLength.inject = function(args, values) {
  var line1 = args[1];
  var a = line1[0];
  var b = line1[1];
  args[0] = values[0];

  a[0] = values[1];
  a[1] = values[2];
  b[0] = values[3];
  b[1] = values[4];
}
