var test = require('tape');
var solve = require('./solver');
var constraints = require('./constraints');


  var line = [
    [0, 0],
    [1, 1]
  ];

  var horizontal = [constraints.horizontal, [line]];

  var res = solve([horizontal]);


// test('basic vertical test', function(t) {
//   var line = [
//     [0, 0],
//     [1, 1]
//   ];

//   var horizontal = [constraints.horizontal, [line]];

//   var res = solve([horizontal]);

//   t.ok(res, 'found a solution');

//   t.deepEqual(line, [
//     [0, .5],
//     [1, .5]
//   ], 'split the vertical component which resulted in .5')
// });
