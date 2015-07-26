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

constraints.pointOnPoint = pointOnPoint;

function pointOnPoint(x1, y1, x2, y2) {
  var pdx = x1 - x2;
  var pdy = y1 - y2;

  return pdx * pdx + pdy * pdy;
}

pointOnPoint.size = 4;
pointOnPoint.extract = function(args) {
  return [
    args[0][0],
    args[0][1],
    args[1][0],
    args[1][1],
  ];
};

pointOnPoint.inject = function(orig, values) {

  orig[0][0] = values[0];
  orig[0][1] = values[1];
  orig[1][0] = values[2];
  orig[1][1] = values[3];
}

constraints.pointOnLine = pointOnLine;

function pointOnLine(x1, y1, x2, y2) {
// dx = L1_P2_x - L1_P1_x;
//       dy = L1_P2_y - L1_P1_y;

//       m=dy/dx; //Slope
//       n=dx/dy; //1/Slope

//       if(m<=1 && m>=-1) {
//         //Calculate the expected y point given the x coordinate of the point
//         Ey=L1_P1_y+m*(P1_x-L1_P1_x);
//         error+=(Ey-P1_y)*(Ey-P1_y);
//       }
//       else
//       {
//         //Calculate the expected x point given the y coordinate of the point
//         Ex=L1_P1_x+n*(P1_y-L1_P1_y);
//         error+=(Ex-P1_x)*(Ex-P1_x);
//       }

}

pointOnLine.size = 6;
pointOnLine.extract = function(args) {
  var point = args[0]
  var line = args[1];
  var a = line[0];
  var b = line[1];
  return [
    point[0],
    point[1],
    a[0],
    a[1],
    b[0],
    b[1]
  ];
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
