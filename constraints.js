var constraints = module.exports = {};

var debug = process.env.DEBUG ? console.log : function() {};

constraints.horizontal = horizontalConstraint;

function horizontalConstraint(y1, y2) {
  var ydiff = y2 - y1;
  debug('calc: %s - %s = %s', y2, y1, ydiff);
  return ydiff * ydiff * 1000;
}

horizontalConstraint.size = 2;


horizontalConstraint.extract = function(args) {
  var line = args[0];
  return [
    line[0][1],
    line[1][1]
  ];
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

verticalConstraint.extract = function(args) {
  var line = args[0];
  return [
    line[0][0],
    line[1][0]
  ];
};

verticalConstraint.inject = function(orig, values) {
  orig[0][0][0] = values[0];
  orig[0][1][0] = values[1];
}

