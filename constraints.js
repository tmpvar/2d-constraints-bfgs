var constraints = module.exports = {};

var debug = process.env.DEBUG ? console.log : function() {};

constraints.horizontal = horizontalConstraint;

function horizontalConstraint(y1, y2) {
  var ydiff = y2 - y1;
  debug('calc: %s - %s = %s', y2, y1, ydiff);
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
  debug('calc: %s - %s = %s', x2, x1, xdiff);
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

fixed.size = 2;

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
    var x = x1+ n * (py - y1);
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

  addComponent(point[0], 0)
  addComponent(point[0], 1)
  addComponent(point[1], 0)
  addComponent(point[1], 1)

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
  a[0] = values[3];
  b[0] = values[4];
  b[0] = values[5];
}
