module.exports = ConstraintManager;

var lineSearch = require('./line-search');

var debug = process.env.DEBUG ? console.log : function() {};

function squareMatrix(width) {
  var c = new Array(width);
  for (var i=0; i<width; i++) {
    var r = c[i] = new Array(width);
    for (var j=0; j<width; j++) {
      r[j] = 0;
    }
  }
  return c;
}

function nvec(width) {
  var c = new Array(width);
  for (var i=0; i<width; i++) {
    c[i] = 0;
  }
  return c;
}

function calc(constraints, components) {
  var val = 0;
  var l = constraints.length;
  var where = 0;

  for (i=0; i<l; i++) {
    var constraint = constraints[i];
    var size = constraint.size;
    val += constraints[i][0].apply(null, constraints[i][2]);
    where += size;
  }

  return val;
}


var PERTURB_MAGNITUDE = 1e-6;
var PERTURB_MINIMUM = 1e-10;
var MAX_ITERATIONS = 50; //Note that the total number of iterations allowed is MaxIterations *l
var EPS = 1e-20;
var CONVERGENCE_ROUGH = 1e-8;
var CONVERGENCE_FINE = 1e-10;

// TODO: make this handle addition/removal of constraints
function ConstraintManager(constraints) {
  if (!(this instanceof ConstraintManager)) {
    return new ConstraintManager(constraints);
  }

  this.constraints = constraints || [];
}

ConstraintManager.prototype.sync = function(constraints) {
  var l = constraints.length;

  for (var i=0; i<l; i++) {
    var constraint = constraints[i];
    var fn = constraint[0];
    var orig = constraint[1];
    var vars = constraint[2];
    fn.inject(orig, vars.map(function(v) {
      return v+0;
    }));
  }
};

ConstraintManager.prototype.add = function(constraint) {
  this.constraints.push(constraint);
};

ConstraintManager.prototype.remove = function(constraint) {
  this.constraints = this.constraints.filter(function(c) {
    return c !== constraint;
  });
};

ConstraintManager.prototype.isPointFixed = function(point) {
  var constraints = this.constraints;
  var l = constraints.length;
  for (var i=0; i<l; i++) {
    var constraint = constraints[i];
    if (constraint[0].name === 'fixed') {
      if (constraint[1].indexOf(point) > -1) {
        return true;
      }
    }
  }
  return false;
};

ConstraintManager.prototype.solve = function solve() {
  var manager = this;

  // pre-compute the fixed points
  var toSolve = [];
  var fixedPoints = this.constraints.filter(function(a) {
    var isFixed = a[0].name === 'fixed';
    if (!isFixed) {
      toSolve.push(a);
    }
    return isFixed;
  }).map(function(a) {
    // first component for identity test, second for
    // a list of components affected.
    return a[1][0];
  });

  var components = [];
  var seenPoints = [];
  var seenPointsComponents = [];
  var constraints = toSolve.map(function(constraint) {
    var fn = constraint[0];
    var args = constraint[1];
    var variables = [];

    fn.extract(constraint[1], function addComponent(point, key) {
      // TODO: make this more efficient..
      var fixed = fixedPoints.indexOf(point) > -1;
      var existingPoint = seenPoints.indexOf(point);
      var existingComponent = -1;
      if (seenPointsComponents[existingPoint]) {
        existingComponent = seenPointsComponents[existingPoint].indexOf(key);
      }

      var constant = typeof key === 'undefined';
      var value = (constant) ? point : point[key];

      if (fixed || constant) {
        variables.push(value);
      } else {
        var valueIndex;

        if (existingComponent === -1) {
          valueIndex = components.length;
          components.push(value);
        } else {
          valueIndex = existingComponent;
        }

        variables.push({
          valueOf: function() {
            return components[valueIndex];
          }
        });
      }

      if (existingPoint === -1) {
        seenPoints.push(point);
        seenPointsComponents.push([key]);
      } else if (existingComponent === -1) {
        seenPointsComponents[existingPoint].push(key);
      }
    });

    constraint[2] = variables;

    return constraint;
  });

  var l, i, j, k;

  function setComponent(idx, value) {
    components[idx] = value;
  }

  // compenents can be thought of as the original n-dimensional vector
  // in this system
  l = components.length;

  // perform a baseline compute using the incoming components
  var f0 = calc(constraints, components);
  debug('---------\n');
  if (f0 < EPS/2) {
    // return immediately if already stable
    return true;
  }

  debug('f0:', f0);
  var perturbValue = f0 * PERTURB_MAGNITUDE;
  debug('perturbValue:', perturbValue);
  var gradient = new Array(l);
  var gradientNormal = 0;
  var first, second;

  for (i=0; i<l; i++) {
    var original = components[i];

    setComponent(i, original - perturbValue);
    debug('sub: %s - %s = %s', original, perturbValue, components[i]);
    first = calc(constraints, components);

    setComponent(i, original + perturbValue);
    second = calc(constraints, components);

    debug('perturb: %s - %s', first, second);

    gradient[i] =  (0.5 * (second - first)) / perturbValue;
    debug('gradient[%s] = %s', i, gradient[i]);

    // reset components back to the orig
    setComponent(i, original);
    gradientNormal += (gradient[i] * gradient[i]);
  }

  debug('gradientNormal:', gradientNormal);

  var searchVector = new Array(l);
  var hessianInverse = new Array(l);

  for(i=0; i<l; i++) {
    hessianInverse[i] = new Array(l);

    for(j=0; j<l; j++) {
      if(i==j) {
        //N[i][j]=norm; //Calculate a scaled identity matrix as a Hessian inverse estimate
        //N[i][j]=grad[i]/(norm+.001);
        hessianInverse[i][j] = 1;

        //Calculate the initial search vector
        searchVector[i] = -gradient[i];

      } else {
        hessianInverse[i][j] = 0;
      }
    }
  }

  debug('search vector:', searchVector.join(', '));

  var alpha = 1;
  var componentsCopy = components.slice();
  var fnew = lineSearch(
    setComponent,
    components,
    alpha,
    f0,
    constraints,
    componentsCopy,
    searchVector,
    calc
  );

  var firstSecond = squareMatrix(l);
  var deltaXDotGammatDotN = squareMatrix(l);
  var gammatDotDeltaXt = squareMatrix(l);
  var NDotGammaDotDeltaXt = squareMatrix(l);

  var bottom = 0;
  var firstTerm = 0;
  var gammatDotNDotGamma = 0;
  var deltaXnorm = 1;
  var iterations = MAX_ITERATIONS;
  var steps = 0;
  var deltaXtDotGamma = 0;

  var deltaX = nvec(l);
  var gradnew = nvec(l);
  var gamma = nvec(l);
  var gammatDotN = nvec(l);

  // TODO: make this a fn arg
  var convergence = CONVERGENCE_ROUGH;

  // TODO: rename this to componentsDelta
  for (i=0; i<l; i++) {
    deltaX[i] = components[i] - componentsCopy[i];
  }

  debug("deltaXnorm: ", deltaXnorm);
  debug("convergence: ", convergence);
  debug("fnew: ", fnew);
  debug("smallF: ", EPS);
  debug("maxIterNumber: ", iterations);

  while(
    deltaXnorm > convergence &&
    fnew > EPS &&
    iterations
  ) {

    bottom = 0;
    deltaXDotGammaDotN = 0;
    perturbValue = fnew * PERTURB_MAGNITUDE;

    if (perturbValue < PERTURB_MINIMUM) {
      perturbValue = PERTURB_MINIMUM;
    }

    // TODO: this code is roughly the same as the initial f0 setup
    //       it would be wise to find a way to eliminate this duplication
    for(i=0; i<l; i++) {
      //Calculate the new gradient vector
      var oldParamValue = components[i];
      setComponent(i, oldParamValue - perturbValue);
      first = calc(constraints, components);
      setComponent(i, oldParamValue + perturbValue);

      second = calc(constraints, components);
      gradnew[i] = 0.5 * (second - first) / perturbValue;

      setComponent(i, oldParamValue);
      //Calculate the change in the gradient
      gamma[i] = gradnew[i] - gradient[i];
      bottom += deltaX[i] * gamma[i];

      deltaXtDotGamma += deltaX[i] * gamma[i];
    }
    debug("deltaXtDotGamma: %s", deltaXtDotGamma);
    debug("bottom: %s", bottom);


    //make sure that bottom is never 0
    if (bottom === 0) {
      bottom = Number.MIN_VALUE;
    }

    //calculate all (1xn).(nxn)
    for(i=0;i<l;i++) {
      gammatDotN[i]=0;
      for(j=0;j<l;j++) {
        gammatDotN[i] += gamma[j] * hessianInverse[i][j];//This is gammatDotN transpose
      }
    }

    //calculate all (1xn).(nx1)
    gammatDotNDotGamma=0;
    for(i=0;i<l;i++) {
      gammatDotNDotGamma+=gammatDotN[i]*gamma[i];
    }

    //Calculate the first term
    firstTerm=0;
    firstTerm=1+gammatDotNDotGamma/bottom;

    //Calculate all (nx1).(1xn) matrices
    for(i=0;i<l;i++) {
      for(j=0;j<l;j++) {
        firstSecond[i][j]=((deltaX[j]*deltaX[i])/bottom)*firstTerm;
        deltaXDotGammatDotN[i][j]=deltaX[i]*gammatDotN[j];
        gammatDotDeltaXt[i][j]=gamma[i]*deltaX[j];
      }
    }

    //Calculate all (nxn).(nxn) matrices

    for(i=0;i<l;i++) {
      for(j=0;j<l;j++) {
        NDotGammaDotDeltaXt[i][j]=0;
        for(k=0;k<l;k++) {
          NDotGammaDotDeltaXt[i][j]+=hessianInverse[i][k]*gammatDotDeltaXt[k][j];
        }
      }
    }
    //Now calculate the BFGS update on N
    // https://en.wikipedia.org/wiki/Broyden%E2%80%93Fletcher%E2%80%93Goldfarb%E2%80%93Shanno_algorithm
    // C++ impl: http://www.loshchilov.com/pbfgs.html
    //cout<<"N:"<<endl;
    for(i=0;i<l;i++) {

      for(j=0;j<l;j++) {
        hessianInverse[i][j] += firstSecond[i][j]-(deltaXDotGammatDotN[i][j]+NDotGammaDotDeltaXt[i][j])/bottom;
      }
    }

    //Calculate s
    for(i=0;i<l;i++) {
      searchVector[i]=0;
      for(j=0;j<l;j++) {
        searchVector[i]+=-hessianInverse[i][j]*gradnew[j];
      }
    }

    alpha=1; //Initial search vector multiplier

    //copy newest values to the componentsCopy
    for(i=0;i<l;i++) {
      componentsCopy[i] = components[i];//Copy last values to componentsCopy
    }
    steps=0;

    fnew = lineSearch(
      setComponent,
      components,
      alpha,
      fnew,
      constraints,
      componentsCopy,
      searchVector,
      calc
    );
    iterations--;
  }

  components.map(function(c, i) {
    debug('Parameter(%s): %s', i, c);
  });

  debug("Fnew: %s", fnew);
  debug("Number of Iterations: %s", (MAX_ITERATIONS - iterations) + 1);

  if (isNaN(fnew) || fnew > 1e-12) {
    return false;
  } else {
    // backfill the original entities
    manager.sync(constraints);
  }
  return true;
};
