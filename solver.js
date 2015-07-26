module.exports = solve;

var lineSearch = require('./line-search')

var debug = process.env.DEBUG ? console.log : function() {};

function squareMatrix(width) {
  var c = new Array(width);
  for (var i=0; i<width; i++) {
    var r = c[i] = new Array(width)
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

  for (i=0; i<constraints.length; i++) {
    var constraint = constraints[i];
    var size = constraint.size;
    var args = components.slice(where, size);
    val += constraints[i][0].apply(null, args);
    where += size;
  }

  return val;
}


var PERTURB_MAGNITUDE = 1e-6
var PERTURB_MINIMUM = 1e-10
var MAX_ITERATIONS = 50 //Note that the total number of iterations allowed is MaxIterations *l
var EPS = 1e-20;
var CONVERGENCE_ROUGH = 1e-8;
var CONVERGENCE_FINE = 1e-10;

function solve(constraints) {
  var l, i, j, k;

  var components = [];
  var fixedComponents = [];

  function setComponent(idx, value) {
    if (fixedComponents[idx]) {
      return;
    } else {
      components[idx] = value;
    }
  }

  var fixedPoints = constraints.filter(function(a) {
    return a[0].name === 'fixed';
  }).map(function(a) {
    // first component for identity test, second for
    // a list of components affected.
    return a[1][0];
  })


  // turn the nested constraint component values into a 1d array
  for (i=0; i<constraints.length; i++) {
    var constraint = constraints[i];
    if (constraint[0].name === 'fixed') {
      // skip fixed constraints
      continue;
    }
    constraint[0].extract(constraint[1], function addComponent(point, key) {
      // TODO: make this more efficient..
      var r = fixedPoints.filter(function(a) {
        if (a === point) {
          return true;
        }
      })

      if (r.length) {
        fixedComponents.push(true);
      } else {
        fixedComponents.push(false);
      }

      components.push(point[key]);
    });
  }

  // compenents can be thought of as the original n-dimensional vector
  // in this system
  l = components.length;

  // perform a baseline compute using the incoming components
  var f0 = calc(constraints, components);
  debug('---------\n')
  if (f0 < EPS/2) {
    // return immediately if already stable
    return true;
  }

  debug('f0:', f0);
  var perturbValue = f0 * PERTURB_MAGNITUDE;
  debug('perturbValue:', perturbValue)
  var gradient = new Array(l);
  var gradientNormal = 0;

  for (i=0; i<l; i++) {
    var original = components[i];

    setComponent(i, original - perturbValue);
    debug('sub: %s - %s = %s', original, perturbValue, components[i])
    var first = calc(constraints, components);

    setComponent(i, original + perturbValue);
    var second = calc(constraints, components);

    debug('perturb: %s - %s', first, second);

    gradient[i] =  (.5 * (second - first)) / perturbValue;
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
  )

  var firstSecond = squareMatrix(l);
  var deltaXDotGammatDotN = squareMatrix(l);
  var gammatDotDeltaXt = squareMatrix(l);
  var NDotGammaDotDeltaXt = squareMatrix(l);

  var bottom = 0;
  var firstTerm = 0;
  var gammatDotNDotGamma = 0;
  var firstTerm = 0;
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
  var deltaX = new Array(l);
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

      second= calc(constraints, components);
      gradnew[i]=.5 * (second - first) / perturbValue;

      setComponent(i, oldParamValue);
      //Calculate the change in the gradient
      gamma[i] = gradnew[i] - gradient[i];
      bottom += deltaX[i] * gamma[i];

      deltaXtDotGamma += deltaX[i] * gamma[i];
    }
    debug("deltaXtDotGamma: %s", deltaXtDotGamma);
    debug("bottom: %s", bottom);


    //make sure that bottom is never 0
    if (bottom==0) {
      bottom=.0000000001;
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
    )
    iterations--;
  }

  components.map(function(c, i) {
    debug('Parameter(%s): %s', i, c);
  })

  debug("Fnew: %s", fnew);
  debug("Number of Iterations: %s", (MAX_ITERATIONS - iterations) + 1)

  // backfill the original entities
  var cwhere = 0;
  for (i=0; i<constraints.length; i++) {

    var args = constraints[i];
    var constraint = args[0];
    var constraintSize = constraint.size;

    constraint.inject(args[1], components.slice(cwhere, cwhere+constraintSize))
    cwhere += constraintSize;
  }


  return true;
}
