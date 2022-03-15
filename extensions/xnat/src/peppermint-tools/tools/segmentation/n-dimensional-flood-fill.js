'use strict';

// https://github.com/tuzz/n-dimensional-flood-fill

module.exports = function(options) {
  let getter,
    seed,
    onFlood,
    onBoundary,
    equals,
    diagonals,
    startNode,
    permutations,
    stack,
    flooded,
    visits,
    bounds;

  let initialize = function() {
    getter = options.getter;
    seed = options.seed;
    onFlood = options.onFlood || noop;
    onBoundary = options.onBoundary || noop;
    equals = options.equals || defaultEquals;
    diagonals = options.diagonals || false;
    startNode = get(seed);
    permutations = prunedPermutations();
    stack = [];
    flooded = [];
    visits = {};
    bounds = {};
  };

  let main = function() {
    stack.push({ currentArgs: seed });

    while (stack.length > 0) {
      flood(stack.pop());
    }

    return {
      flooded: flooded,
      boundaries: boundaries(),
    };
  };

  let flood = function(job) {
    let getArgs = job.currentArgs;
    let preletgs = job.previousArgs;

    if (visited(getArgs)) {
      return;
    }
    markAsVisited(getArgs);

    if (member(getArgs)) {
      markAsFlooded(getArgs);
      pushAdjacent(getArgs);
    } else {
      markAsBoundary(preletgs);
    }
  };

  let visited = function(key) {
    return visits[key] === true;
  };

  let markAsVisited = function(key) {
    visits[key] = true;
  };

  let member = function(getArgs) {
    let node = safely(get, [getArgs]);

    return safely(equals, [node, startNode]);
  };

  let markAsFlooded = function(getArgs) {
    flooded.push(getArgs);
    onFlood.apply(undefined, getArgs);
  };

  let markAsBoundary = function(preletgs) {
    bounds[preletgs] = preletgs;
    onBoundary.apply(undefined, preletgs);
  };

  let pushAdjacent = function(getArgs) {
    for (let i = 0; i < permutations.length; i += 1) {
      let perm = permutations[i];
      let nextArgs = getArgs.slice(0);

      for (let j = 0; j < getArgs.length; j += 1) {
        nextArgs[j] += perm[j];
      }

      stack.push({
        currentArgs: nextArgs,
        previousArgs: getArgs,
      });
    }
  };

  let get = function(getArgs) {
    return getter.apply(undefined, getArgs);
  };

  let safely = function(f, args) {
    try {
      return f.apply(undefined, args);
    } catch (error) {}
  };

  let noop = function() {};

  let defaultEquals = function(a, b) {
    return a === b;
  };

  let prunedPermutations = function() {
    let permutations = permute(seed.length);

    return permutations.filter(function(perm) {
      let count = countNonZeroes(perm);

      return count !== 0 && (count === 1 || diagonals);
    });
  };

  let permute = function(length) {
    let perms = [];

    let permutation = function(string) {
      return string.split('').map(function(c) {
        return parseInt(c, 10) - 1;
      });
    };

    for (let i = 0; i < Math.pow(3, length); i += 1) {
      let string = lpad(i.toString(3), '0', length);

      perms.push(permutation(string));
    }

    return perms;
  };

  let lpad = function(string, character, length) {
    let array = new Array(length + 1);
    let pad = array.join(character);

    return (pad + string).slice(-length);
  };

  let countNonZeroes = function(array) {
    let count = 0;

    for (let i = 0; i < array.length; i += 1) {
      if (array[i] !== 0) {
        count += 1;
      }
    }

    return count;
  };

  let boundaries = function() {
    let array = [];

    for (let key in bounds) {
      if (bounds.hasOwnProperty(key)) {
        array.unshift(bounds[key]);
      }
    }

    return array;
  };

  initialize();
  return main();
};
