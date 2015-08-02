var test = require('tape');
var createSolver = require('./solver');
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

function distance(a, b) {
  var dx = b[0] - a[0];
  var dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}

test('basic horizontal test', function(t) {
  var line = [
    [0, 0],
    [1, 1]
  ];

  var horizontal = [constraints.horizontal, [line[0], line[1]]];

  var res = createSolver([horizontal]).solve();

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

  var vertical = [constraints.vertical, [line[0], line[1]]];

  var res = createSolver([vertical]).solve();

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
  var res = createSolver([pointOnPoint]).solve();

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
  var res = createSolver([pointOnPoint, fixed]).solve();

  t.ok(res, 'found a solution');
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

  var pointOnLine = [constraints.pointOnLine, [point, line[0], line[1]]];
  var res = createSolver([pointOnLine]).solve();

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

  var pointOnLine = [constraints.pointOnLine, [point, line[0], line[1]]];
  var l1p0Fixed = [constraints.fixed, [line[0]]];
  var l1p1Fixed = [constraints.fixed, [line[1]]];

  var res = createSolver([pointOnLine, l1p0Fixed, l1p1Fixed]).solve();

  t.ok(res, 'found a solution');
  t.ok(near(point[0], 0.5), 'point1 x near 0.5');
  t.ok(near(point[1], 0), 'point1 y near 0.0');
  t.deepEqual(line, [
    [0, 0],
    [1, 0]
  ], 'line did not move')
  t.end();
});

test('basic internalAngle test with fixed points', function(t) {
  var line1 = [[0, 0], [1, 0]];
  var line2 = [[0, 0], [1, 1]];

  var l1p0Fixed = [constraints.fixed, [line1[0]]];
  var l1p1Fixed = [constraints.fixed, [line1[1]]];
  var l2p0Fixed = [constraints.fixed, [line2[0]]];

  var internalAngle = [constraints.internalAngle, [Math.PI/2, line1[0], line1[1], line2[0], line2[1]]]

  var res = createSolver([l2p0Fixed, l1p0Fixed, l1p1Fixed, internalAngle]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line1, [[0, 0], [1, 0]], 'line1 did not move')
  t.deepEqual(line2[0], [0, 0], 'line2.start did not move')
  t.equal(line2[1][1], 1, 'line2.end.y did not move')
  t.ok(near(line2[1][0], 0), 'line2.end.x is near 0')

  t.end();
});

test('basic equalLength test with fixed points', function(t) {
  var line1 = [[0, 0], [10, 0]];
  var line2 = [[0, 1], [1, 1]];

  var l1p0Fixed = [constraints.fixed, [line1[0]]];
  var l1p1Fixed = [constraints.fixed, [line1[1]]];
  var l2p0Fixed = [constraints.fixed, [line2[0]]];

  var equalLength = [constraints.equalLength, [line1[0], line1[1], line2[0], line2[1]]]

  var res = createSolver([l2p0Fixed, l1p0Fixed, l1p1Fixed, equalLength]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line1, [[0, 0], [10, 0]], 'line1 did not move')
  t.deepEqual(line2[0], [0, 1], 'line2.start did not move')
  t.equal(line2[1][1], 1, 'line2.end.y did not move')
  t.ok(near(line2[1][0], 10), 'line2.end.x is near 0')

  t.end();
});

test('basic lineLength test', function(t) {
  var line = [[-10, 0], [10, 0]];

  var lineLength = [constraints.lineLength, [10, line[0], line[1]]]

  var res = createSolver([lineLength]).solve();

  t.ok(res, 'found a solution');

  t.ok(near(distance(line[0], line[1]), 10), 'line is 10 units long');

  t.end();
});

test('basic lineLength test with fixed start point', function(t) {
  var line1 = [[0, 0], [10, 0]];

  var l1p0Fixed = [constraints.fixed, [line1[0]]];

  var lineLength = [constraints.lineLength, [5, line1[0], line1[1]]]

  var res = createSolver([l1p0Fixed, lineLength]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line1[0], [0, 0], 'line start did not move')
  t.equal(line1[0][1], 0, 'line end y did not move')
  t.ok(near(line1[1][0], 5), 'line2.end.x is near 5')

  t.end();
});

test('basic symmetricPoints', function(t) {
  var line = [[5, 10], [5, 0]];
  var point1 = [0, 5];
  var point2 = [0, 0];

  var lsfixed = [constraints.fixed, [line[0]]];
  var lefixed = [constraints.fixed, [line[1]]];
  var pfixed = [constraints.fixed, [point1]];

  var symmetricPoints = [constraints.symmetricPoints, [point1, point2, line[0], line[1]]];

  var res = createSolver([lsfixed, lefixed, pfixed, symmetricPoints]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line, [[5, 10], [5, 0]], 'line did not move')
  t.deepEqual(point1, [0, 5], 'line did not move')
  t.ok(near(point2[0], 10), 'point2.x is near 10')
  t.ok(near(point2[1], 5), 'point2.y is near 5')

  t.end();
});

test('basic pointToPointDistance', function(t) {
  var point1 = [0, 0];
  var point2 = [10, 0];
  var d = 5;

  var pfixed = [constraints.fixed, [point1]];
  var p2p = [constraints.pointToPointDistance, [d, point1, point2]]

  var res = createSolver([pfixed, p2p]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(point1, [0, 0], 'point1 did not move')
  t.ok(near(point2[0], 5), 'point2.x is near 5')
  t.ok(near(point2[1], 0), 'point2.y is near 0')
  t.ok(near(distance(point1, point2), d))
  t.end();
});

test('basic perpendicular with fixed points', function(t) {
  var line1 = [[0, 0], [10, 0]];
  var line2 = [[5, 1], [10, 10]];

  var l1p0Fixed = [constraints.fixed, [line1[0]]];
  var l1p1Fixed = [constraints.fixed, [line1[1]]];
  var l2p0Fixed = [constraints.fixed, [line2[0]]];

  var perp = [constraints.perpendicular, [line1[0], line1[1], line2[0], line2[1]]];

  var res = createSolver([l2p0Fixed, l1p0Fixed, l1p1Fixed, perp]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line1, [[0, 0], [10, 0]], 'line1 did not move')
  t.ok(near(line2[0][0], line2[1][0]), 'line2 is vertical')

  t.end();
});

test('basic colinear with fixed points (horizontal)', function(t) {
  var line1 = [[0, 0], [10, 0]];
  var line2 = [[10, 0], [20, 10]];

  var l1p0Fixed = [constraints.fixed, [line1[0]]];
  var l1p1Fixed = [constraints.fixed, [line1[1]]];
  var l2p0Fixed = [constraints.fixed, [line2[0]]];

  var colinear = [constraints.colinear, [line1[0], line1[1], line2[0], line2[1]]];

  var res = createSolver([l2p0Fixed, l1p0Fixed, l1p1Fixed, colinear]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line1, [[0, 0], [10, 0]], 'line1 did not move')
  t.deepEqual(line2[0], [10, 0], 'line2 start did not move')
  t.ok(near(line2[0][1], line2[1][1]), 'line2 is horizontal')
  t.ok(near(line2[1][1], 0), 'line2 end y is near 0')

  t.end();
});

test('basic colinear with fixed points (vertical)', function(t) {
  var line1 = [[0, 0], [0, 10]];
  var line2 = [[0, 10], [10, 20]];

  var l1p0Fixed = [constraints.fixed, [line1[0]]];
  var l1p1Fixed = [constraints.fixed, [line1[1]]];
  var l2p0Fixed = [constraints.fixed, [line2[0]]];

  var colinear = [constraints.colinear, [line1[0], line1[1], line2[0], line2[1]]]

  var res = createSolver([l2p0Fixed, l1p0Fixed, l1p1Fixed, colinear]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line1, [[0, 0], [0, 10]], 'line1 did not move')
  t.deepEqual(line2[0], [0, 10], 'line2 start did not move')
  t.ok(near(line2[0][0], line2[1][0]), 'line2 is vertical')
  t.ok(near(line2[1][0], 0), 'line2 end y is near 0')

  t.end();
});


test('basic colinear with fixed points (diagonal)', function(t) {
  var line1 = [[0, 0], [10, 10]];
  var line2 = [[10, 10], [10, 20]];

  var l1p0Fixed = [constraints.fixed, [line1[0]]];
  var l1p1Fixed = [constraints.fixed, [line1[1]]];
  var l2p0Fixed = [constraints.fixed, [line2[0]]];

  var colinear = [constraints.colinear, [line1[0], line1[1], line2[0], line2[1]]];

  var res = createSolver([l2p0Fixed, l1p0Fixed, l1p1Fixed, colinear]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line1, [[0, 0], [10, 10]], 'line1 did not move')
  t.deepEqual(line2[0], [10, 10], 'line2 start did not move')
  t.ok(near(line2[1][0], 15), 'line2 end x is near 15')
  t.ok(near(line2[1][1], 15), 'line2 end y is near 15')

  t.end();
});

test('basic parallel with fixed points (horizontal)', function(t) {
  var line1 = [[0, 0], [10, 0]];
  var line2 = [[0, 2], [2, 10]];

  var l1p0Fixed = [constraints.fixed, [line1[0]]];
  var l1p1Fixed = [constraints.fixed, [line1[1]]];
  var l2p0Fixed = [constraints.fixed, [line2[0]]];

  var parallel = [constraints.parallel, [line1[0], line1[1], line2[0], line2[1]]]

  var res = createSolver([l2p0Fixed, l1p0Fixed, l1p1Fixed, parallel]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line1, [[0, 0], [10, 0]], 'line1 did not move')
  t.ok(near(line2[0][1], line2[1][1]), 'line2 is horizontal')

  t.end();
});

test('basic parallel with fixed points (vertical)', function(t) {
  var line1 = [[0, 0], [0, 10]];
  var line2 = [[2, 0], [10, 10]];

  var l1p0Fixed = [constraints.fixed, [line1[0]]];
  var l1p1Fixed = [constraints.fixed, [line1[1]]];
  var l2p0Fixed = [constraints.fixed, [line2[0]]];

  var parallel = [constraints.parallel, [line1[0], line1[1], line2[0], line2[1]]];

  var res = createSolver([l2p0Fixed, l1p0Fixed, l1p1Fixed, parallel]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line1, [[0, 0], [0, 10]], 'line1 did not move')
  t.equal(line2[0][1], 0, 'line2 end y did not move')
  t.equal(line2[1][1], 10, 'line2 end y did not move')
  t.ok(near(line2[0][0], line2[1][0]), 'line2 is vertical')

  t.end();
});

test('basic parallel with fixed points (diagonal)', function(t) {
  var line1 = [[0, 0], [10, 10]];
  var line2 = [[2, 0], [10, 10]];

  var l1p0Fixed = [constraints.fixed, [line1[0]]];
  var l1p1Fixed = [constraints.fixed, [line1[1]]];
  var l2p0Fixed = [constraints.fixed, [line2[0]]];

  var parallel = [constraints.parallel, [line1[0], line1[1], line2[0], line2[1]]];

  var res = createSolver([l2p0Fixed, l1p0Fixed, l1p1Fixed, parallel]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line1, [[0, 0], [10, 10]], 'line1 did not move')
  t.ok(near(line2[0][1], 0), 'line2 end y did not move')
  t.ok(near(line2[1][0], 11), 'line2 end x near 9')
  t.ok(near(line2[1][1], 9), 'line2 end y near 9')

  t.end();
});

test('basic pointOnLineMidpoint', function(t) {
  var line = [[0, 0], [10, 0]];
  var point = [100, 0];

  var l1p0Fixed = [constraints.fixed, [line[0]]];
  var l1p1Fixed = [constraints.fixed, [line[1]]];

  var midpoint = [constraints.pointOnLineMidpoint, [point, line[0], line[1]]];

  var res = createSolver([l1p0Fixed, l1p1Fixed, midpoint]).solve();

  t.ok(res, 'found a solution');
  t.deepEqual(line, [[0, 0], [10, 0]], 'line1 did not move');
  t.ok(near(point[0], 5), 'point x near 5');
  t.equal(point[1], 0, 'point y is on 0');

  t.end();
});

test('ConstraintManager#isPointFixed', function(t) {
  var fixedPoint = [0, 0];
  var notFixed = [1, 1];

  var s = createSolver([
    [constraints.fixed, [fixedPoint]],
    [constraints.pointOnPoint, [notFixed, fixedPoint]],
  ])

  t.ok(s.isPointFixed(fixedPoint), 'fixedPoint is fixed')
  t.notOk(s.isPointFixed(notFixed), 'notFixed is not fixed')
  t.end();
})

test('overconstrained skips syncing and returns false', function(t) {
  var fixedPoint = [0, 0];
  var fixedPoint2 = [1, 1];
  var movablePoint = [10, 0];

  var s = createSolver([
    [constraints.fixed, [fixedPoint]],
    [constraints.fixed, [fixedPoint2]],
    [constraints.pointOnPoint, [fixedPoint2, fixedPoint]],
    [constraints.horizontal, [fixedPoint2, movablePoint]],
  ])
  var r = s.solve();
  t.notOk(r);

  t.ok(s.isPointFixed(fixedPoint), 'no solution')
  t.deepEqual(fixedPoint, [0, 0], 'fixedPoint did not move');
  t.deepEqual(fixedPoint2, [1, 1], 'fixedPoint2 did not move');
  t.deepEqual(movablePoint, [10, 0], 'fixedPoint2 did not move');
  t.end();
})
