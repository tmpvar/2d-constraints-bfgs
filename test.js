var test = require('tape');
var solve = require('./solver');
var constraints = require('./constraints');

var EPS = 1e-9;

function near(a, b) {
  if  (Math.abs(a-b) < EPS) {
    return true;
  } else {
    console.log(a, b, Math.abs(a-b))
    return false;
  }
}

test('basic horizontal test', function(t) {
  var line = [
    [0, 0],
    [1, 1]
  ];

  var horizontal = [constraints.horizontal, [line]];

  var res = solve([horizontal]);

  t.ok(res, 'found a solution');

  t.ok(near(line[0][0], 0), 'start x near 0');
  t.ok(near(line[0][1], 0.5), 'start y near 0.5');
  t.ok(near(line[1][0], 1), 'end x near 0');
  t.ok(near(line[1][1], 0.5), 'end y near 0.5');
  t.end();
});

test('basic vertical test', function(t) {
  var line = [
    [0, 0],
    [1, 1]
  ];

  var vertical = [constraints.vertical, [line]];

  var res = solve([vertical]);

  t.ok(res, 'found a solution');
  t.ok(near(line[0][0], 0.5), 'start x near 0.5');
  t.ok(near(line[0][1], 0.0), 'start y near 0.0');
  t.ok(near(line[1][0], 0.5), 'end x near 0.5');
  t.ok(near(line[1][1], 1.0), 'end y near 1.0');
  t.end();
});

test('basic pointOnPoint test', function(t) {
  var point1 = [0, 0];
  var point2 = [1, 1];

  var pointOnPoint = [constraints.pointOnPoint, [point1, point2]];
  var res = solve([pointOnPoint]);

  t.ok(res, 'found a solution');
  t.ok(near(point1[0], 0.5), 'point1 x near 0.5');
  t.ok(near(point1[1], 0.5), 'point1 y near 0.5');
  t.ok(near(point2[0], 0.5), 'point2 x near 0.5');
  t.ok(near(point2[1], 0.5), 'point2 y near 0.5');
  t.end();
});

test('basic pointOnPoint', function(t) {
  var point1 = [0, 0];
  var point2 = [1, 1];

  var pointOnPoint = [constraints.pointOnPoint, [point1, point2]];
  var res = solve([pointOnPoint]);

  t.ok(res, 'found a solution');
  t.ok(near(point1[0], 0.5), 'point1 x near 0.5');
  t.ok(near(point1[1], 0.5), 'point1 y near 0.5');
  t.ok(near(point2[0], 0.5), 'point2 x near 0.5');
  t.ok(near(point2[1], 0.5), 'point2 y near 0.5');
  t.end();
});

test('basic pointOnPoint w/ fixed point', function(t) {
  var point1 = [0, 0];
  var point2 = [1, 1];

  var pointOnPoint = [constraints.pointOnPoint, [point1, point2]];
  var fixed = [constraints.fixed, [point1]];
  var res = solve([pointOnPoint, fixed]);

  // t.ok(res, 'found a solution');
  t.ok(near(point1[0], 0.0), 'point1 x near 0');
  t.ok(near(point1[1], 0.0), 'point1 y near 0');
  t.ok(near(point2[0], 0.0), 'point2 x near 0');
  t.ok(near(point2[1], 0.0), 'point2 y near 0');
  t.end();
});

test('basic pointOnLine test', function(t) {
  var point = [.5, 1];

  var line = [
    [0, 0],
    [1, 0]
  ];

  var pointOnLine = [constraints.pointOnLine, [point, line]];
  var res = solve([pointOnLine]);

  t.ok(res, 'found a solution');
  t.ok(near(point[0], 0.5), 'point1 x near 0.5');
  t.ok(near(point[1], 1/3), 'point1 y near 0.333333');

  t.ok(near(line[0][0], 0.0), 'line.start x near 0.0');
  t.ok(near(line[1][0], 1.0), 'line.end x near 1.0');

  t.ok(near(line[0][1], 1/3), 'line.start x near 1/3');
  t.ok(near(line[1][1], 1/3), 'line.end x near 1/3');
  t.end();
});



test('basic pointOnLine test with fixed points', function(t) {
  var point = [.5, 1];

  var line = [
    [0, 0],
    [1, 0]
  ];

  var pointOnLine = [constraints.pointOnLine, [point, line]];
  var l1p0Fixed = [constraints.fixed, [line[0]]];
  var l1p1Fixed = [constraints.fixed, [line[1]]];

  var res = solve([pointOnLine, l1p0Fixed, l1p1Fixed]);

  t.ok(res, 'found a solution');
  t.ok(near(point[0], 0.5), 'point1 x near 0.5');
  t.ok(near(point[1], 0), 'point1 y near 0.0');
  t.deepEqual(line, [
    [0, 0],
    [1, 0]
  ], 'line did not move')
  t.end();
});
