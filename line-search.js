module.exports = lineSearch


function lineSearch(out, alpha, f0, constraints, componentsCopy, searchVector, calc) {

  var l = out.length;
  console.log("\n\n/// START OF LINE SEARCH");
  //Make the initial position alpha1
  var alpha1=0;
  var f1 = f0;
  console.log('f1: %s', f1);
  // REMINDER! `s` is the negated nd vector

  //Take a step of alpha=1 as alpha2
  var alpha2=1;
  for(var i=0;i<l;i++) {
    out[i] = componentsCopy[i] + alpha2 * searchVector[i];//calculate the new x
  }

  var f2 = calc(constraints, out);
  console.log('f2: %s', f2);

  //Take a step of alpha 3 that is 2*alpha2
  var alpha3 = alpha*2;
  for(var i=0;i<l;i++) {
    out[i] = componentsCopy[i] + alpha3 * searchVector[i]; //calculate the new x
  }
  var f3=calc(constraints, out);
  console.log('f3: %s', f3);


  // COMPUTE INTERVAL
  //Now reduce or lengthen alpha2 and alpha3 until the minimum is
  //Bracketed by the triplet f1>f2<f3
  //             f2<f1<f3
  // f2>f1 f2>f3
  while(f2 > f1 || f2 > f3) {
    if(f2 > f1) {
      //If f2 is greater than f1 then we shorten alpha2 and alpha3 closer to f1
      //Effectively both are shortened by a factor of two.
      alpha3=alpha2;
      f3=f2;
      alpha2=alpha2/2;
      for(var i=0; i<l; i++) {
        out[i] = componentsCopy[i] + alpha2 * searchVector[i];
      }

      f2 = calc(constraints, out);
    }

    else if(f2 > f3) {
      //If f2 is greater than f3 then we length alpah2 and alpha3 closer to f1
      //Effectively both are lengthened by a factor of two.
      alpha2 = alpha3;
      f2 = f3;
      alpha3 = alpha3 * 2;
      for(var i=0;i<l;i++) {
        out[i] = componentsCopy[i] + alpha3 * searchVector[i];
      }
      f3 = calc(constraints, out);
    }
  }

  // get the alpha for the minimum f of the quadratic approximation
  var alphaStar = alpha2 + ((alpha2 - alpha1) * (f1 - f3)) / (3 * (f1 - 2 * f2 + f3));

  //Guarantee that the new alphaStar is within the bracket
  if(alphaStar > alpha3 || alphaStar < alpha1) {
    alphaStar = alpha2;
  }

  if(alphaStar !== alphaStar) {
    alphaStar = .001;//Fix nan problem
  }

  /// Set the values to alphaStar
  for(var i=0; i<l; i++) {
    out[i] = componentsCopy[i] + alphaStar * searchVector[i];
  }

  var fnew=calc(constraints, out);

  console.log("F at alphaStar: ", fnew);
  console.log("alphaStar: ", alphaStar);
  console.log("F0: ", f0);
  console.log("F1: ", f1);
  console.log("F2: ", f2);
  console.log("F3: ", f3);
  console.log("Alpha1: ", alpha1);
  console.log("Alpha2: ", alpha2);
  console.log("Alpha3: ", alpha3);

  console.log("/// END OF LINE SEARCH\n");

  return fnew;
}