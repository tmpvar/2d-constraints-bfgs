var test = require('tape');
var solve = require('./solver');
var constraints = require('./constraints');

var EPS = 1e-12;

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
