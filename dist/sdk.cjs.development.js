'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

require('cross-fetch/polyfill');
var EventEmitter = _interopDefault(require('events'));
var contracts = require('@ethersproject/contracts');
var bignumber = require('@ethersproject/bignumber/lib/bignumber');
var bignumber$1 = require('@ethersproject/bignumber');
var address = require('@ethersproject/address');
var hash = _interopDefault(require('object-hash'));

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;

  _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);

  if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
    if (it) o = it;
    var i = 0;
    return function () {
      if (i >= o.length) return {
        done: true
      };
      return {
        done: false,
        value: o[i++]
      };
    };
  }

  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var runtime_1 = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined$1; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined$1) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined$1;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined$1;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined$1;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined$1, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined$1;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined$1;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined$1;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined$1;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined$1;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   module.exports 
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}
});

/**
 * Generic SDK error, likely caused by internal method calls.
 *
 * // TODO: setup error codes
 */

var SdkError = /*#__PURE__*/function (_Error) {
  _inheritsLoose(SdkError, _Error);

  function SdkError() {
    return _Error.apply(this, arguments) || this;
  }

  return SdkError;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var Service = function Service(chainId, ctx) {
  var _this = this;

  this.chainId = chainId;
  this.ctx = ctx;
  this.events = new EventEmitter(); // Error handling + update events via proxy / reflection

  var methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

  var _loop = function _loop() {
    var property = _step.value;
    var method = Reflect.get(_this, property);
    var path = [_this.constructor.name, method.name].join(".");
    Reflect.set(_this, property, new Proxy(method, {
      apply: function apply(target, thisArg, argArray) {
        try {
          var res = target.apply(thisArg, argArray);

          if (res && res instanceof Promise) {
            res.then(function (result) {
              _this.events.emit(method.name, result);

              return result;
            })["catch"](function (error) {
              throw new SdkError(path + ": " + error.message);
            });
          } else {
            _this.events.emit(method.name, res);
          }

          return res;
        } catch (error) {
          throw new SdkError(path + ": " + error.message);
        }
      }
    }));
  };

  for (var _iterator = _createForOfIteratorHelperLoose(methods), _step; !(_step = _iterator()).done;) {
    _loop();
  }
};
var Reader = /*#__PURE__*/function (_Service) {
  _inheritsLoose(Reader, _Service);

  function Reader(yearn, chainId, ctx) {
    var _this2;

    _this2 = _Service.call(this, chainId, ctx) || this;
    _this2.yearn = yearn; // Error handling + update events via proxy / reflection

    var methods = Object.getOwnPropertyNames(Object.getPrototypeOf(_assertThisInitialized(_this2)));

    var _loop2 = function _loop2() {
      var property = _step2.value;
      var method = Reflect.get(_assertThisInitialized(_this2), property);
      var path = [_this2.constructor.name, method.name].join(".");
      Reflect.set(_assertThisInitialized(_this2), property, new Proxy(method, {
        apply: function apply(target, thisArg, argArray) {
          var _this2$ctx$cache;

          var cached = (_this2$ctx$cache = _this2.ctx.cache).get.apply(_this2$ctx$cache, [path].concat(argArray));

          if (cached) {
            console.debug("[SDK] Cache hit " + path);
            return cached;
          } else {
            console.debug("[SDK] Cache miss " + path);
          }

          var res = target.apply(thisArg, argArray);

          if (res && res instanceof Promise) {
            res.then(function (result) {
              var _this2$ctx$cache2;

              (_this2$ctx$cache2 = _this2.ctx.cache).set.apply(_this2$ctx$cache2, [result, path].concat(argArray));

              return result;
            });
          } else {
            var _this2$ctx$cache3;

            (_this2$ctx$cache3 = _this2.ctx.cache).set.apply(_this2$ctx$cache3, [res, path].concat(argArray));
          }

          return res;
        }
      }));
    };

    for (var _iterator2 = _createForOfIteratorHelperLoose(methods), _step2; !(_step2 = _iterator2()).done;) {
      _loop2();
    }

    return _this2;
  }

  return Reader;
}(Service);
var ContractService = /*#__PURE__*/function (_Service2) {
  _inheritsLoose(ContractService, _Service2);

  function ContractService(address, chainId, ctx) {
    var _this3;

    _this3 = _Service2.call(this, chainId, ctx) || this;
    _this3.address = address;
    _this3.contract = new contracts.Contract(_this3.address, // @ts-ignore
    _this3.constructor.abi, ctx.provider);
    return _this3;
  }

  return ContractService;
}(Service);
ContractService.abi = [];

function struct(tuple) {
  if (typeof tuple !== "object") return tuple;
  var keys = Object.keys(tuple);
  var properties = keys.filter(function (key) {
    return isNaN(Number(key));
  });
  if (properties.length === 0) return structArray(tuple);
  var copy = {};
  properties.forEach(function (property) {
    var value = tuple[property];

    if (typeof value === "object" && !bignumber.isBigNumberish(value)) {
      copy[property] = struct(value);
    } else if (bignumber.isBigNumberish(value)) {
      copy[property] = value.toString();
    } else {
      copy[property] = value;
    }
  });
  return copy;
}
function structArray(tuples) {
  return tuples.map(function (tuple) {
    return struct(tuple);
  });
}

var RegistryV2AdapterAbi = ["function assetsStatic() public view returns (" + "tuple(address address, string typeId, string name, string version," + "tuple(address address, string name, string symbol, uint256 decimals) token" + ")[] memory)", "function assetsStatic(address[] memory) public view returns (" + "tuple(address address, string typeId, string name, string version," + "tuple(address address, string name, string symbol, uint256 decimals) token" + ")[] memory)", "function assetsDynamic() public view returns (" + "tuple(address address, string typeId, address tokenId," + "tuple(uint256 amount, uint256 amountUsdc) underlyingTokenBalance," + "tuple(string symbol, uint256 pricePerShare, bool migrationAvailable, address latestVaultAddress, uint256 depositLimit, bool emergencyShutdown) metadata" + ")[] memory)", "function assetsDynamic(address[] memory) public view returns (" + "tuple(address address, string typeId, address tokenId," + "tuple(uint256 amount, uint256 amountUsdc) underlyingTokenBalance," + "tuple(string symbol, uint256 pricePerShare, bool migrationAvailable, address latestVaultAddress, uint256 depositLimit, bool emergencyShutdown) metadata" + ")[] memory)", "function assetsPositionsOf(address) public view returns (" + "tuple(address assetId, address tokenId, string typeId, uint256 balance," + "tuple(uint256 amount, uint256 amountUsdc) underlyingTokenBalance," + "tuple(address owner, address spender, uint256 amount)[] tokenAllowances," + "tuple(address owner, address spender, uint256 amount)[] assetAllowances" + ")[] memory)", "function assetsPositionsOf(address, address[] memory) public view returns (" + "tuple(address assetId, address tokenId, string typeId, uint256 balance," + "tuple(uint256 amount, uint256 amountUsdc) underlyingTokenBalance," + "tuple(address owner, address spender, uint256 amount)[] tokenAllowances," + "tuple(address owner, address spender, uint256 amount)[] assetAllowances" + ")[] memory)", "function tokens() public view returns (" + "tuple(address address, string name, string symbol, uint256 decimals)" + "[] memory)"];
var RegistryV2Adapter = /*#__PURE__*/function (_ContractService) {
  _inheritsLoose(RegistryV2Adapter, _ContractService);

  function RegistryV2Adapter(chainId, ctx) {
    var _ctx$address;

    return _ContractService.call(this, (_ctx$address = ctx.address("registryV2Adapter")) != null ? _ctx$address : RegistryV2Adapter.addressByChain(chainId), chainId, ctx) || this;
  }

  RegistryV2Adapter.addressByChain = function addressByChain(chainId) {
    switch (chainId) {
      case 1:
        return "0xE75E51566C5761896528B4698a88C92A54B3C954";

      case 250:
        return "0xE75E51566C5761896528B4698a88C92A54B3C954";
    }

    throw new TypeError("RegistryV2Adapter does not have an address for chainId " + chainId);
  };

  var _proto = RegistryV2Adapter.prototype;

  _proto.assetsStatic = /*#__PURE__*/function () {
    var _assetsStatic = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee(addresses) {
      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!addresses) {
                _context.next = 4;
                break;
              }

              _context.next = 3;
              return this.contract["assetsStatic(address[])"](addresses).then(structArray);

            case 3:
              return _context.abrupt("return", _context.sent);

            case 4:
              _context.next = 6;
              return this.contract["assetsStatic()"]().then(structArray);

            case 6:
              return _context.abrupt("return", _context.sent);

            case 7:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function assetsStatic(_x) {
      return _assetsStatic.apply(this, arguments);
    }

    return assetsStatic;
  }();

  _proto.assetsDynamic = /*#__PURE__*/function () {
    var _assetsDynamic = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2(addresses) {
      return runtime_1.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!addresses) {
                _context2.next = 4;
                break;
              }

              _context2.next = 3;
              return this.contract["assetsDynamic(address[])"](addresses).then(structArray);

            case 3:
              return _context2.abrupt("return", _context2.sent);

            case 4:
              _context2.next = 6;
              return this.contract["assetsDynamic()"]().then(structArray);

            case 6:
              return _context2.abrupt("return", _context2.sent);

            case 7:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function assetsDynamic(_x2) {
      return _assetsDynamic.apply(this, arguments);
    }

    return assetsDynamic;
  }();

  _proto.positionsOf = /*#__PURE__*/function () {
    var _positionsOf = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee3(address, addresses) {
      return runtime_1.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (!addresses) {
                _context3.next = 4;
                break;
              }

              _context3.next = 3;
              return this.contract["assetsPositionsOf(address,address[])"](address, addresses).then(structArray);

            case 3:
              return _context3.abrupt("return", _context3.sent);

            case 4:
              _context3.next = 6;
              return this.contract["assetsPositionsOf(address)"](address).then(structArray);

            case 6:
              return _context3.abrupt("return", _context3.sent);

            case 7:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function positionsOf(_x3, _x4) {
      return _positionsOf.apply(this, arguments);
    }

    return positionsOf;
  }();

  _proto.tokens = /*#__PURE__*/function () {
    var _tokens = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee4() {
      return runtime_1.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return this.contract.tokens().then(structArray);

            case 2:
              return _context4.abrupt("return", _context4.sent);

            case 3:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function tokens() {
      return _tokens.apply(this, arguments);
    }

    return tokens;
  }();

  return RegistryV2Adapter;
}(ContractService);
RegistryV2Adapter.abi = RegistryV2AdapterAbi;

var LensAbi = ["function getRegistries() external view returns (address[] memory)", "function getAssets() external view returns (" + "tuple(string name, address address, string version)[] memory" + ")", "function getAssetsFromAdapter(address) external view returns (" + "tuple(string name, address address, string version)[] memory" + ")", "function getPositionsOf(address) external view returns (" + "tuple(address asset, uint256 depositedBalance, uint256 tokenBalance, uint256 tokenAllowance)[] memory" + ")", "function getPositionsOf(address, address) external view returns (" + "tuple(address asset, uint256 depositedBalance, uint256 tokenBalance, uint256 tokenAllowance)[] memory" + ")"];
/**
 * [[LensService]] provides access to all yearn's assets and user positions.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 */

var LensService = /*#__PURE__*/function (_ContractService) {
  _inheritsLoose(LensService, _ContractService);

  function LensService(chainId, ctx) {
    var _ctx$address;

    return _ContractService.call(this, (_ctx$address = ctx.address("lens")) != null ? _ctx$address : LensService.addressByChain(chainId), chainId, ctx) || this;
  }

  LensService.addressByChain = function addressByChain(chainId) {
    switch (chainId) {
      case 1: // FIXME: doesn't actually exist

      case 250:
        return "0xFa58130BE296EDFA23C42a1d15549fA91449F979";
    }

    throw new TypeError("Lens does not have an address for chainId " + chainId);
  };

  var _proto = LensService.prototype;

  _proto.getRegistries = /*#__PURE__*/function () {
    var _getRegistries = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee() {
      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.contract.getRegistries();

            case 2:
              return _context.abrupt("return", _context.sent);

            case 3:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function getRegistries() {
      return _getRegistries.apply(this, arguments);
    }

    return getRegistries;
  }();

  _proto.getAssets = /*#__PURE__*/function () {
    var _getAssets = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2() {
      return runtime_1.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return this.contract.getAssets().then(structArray);

            case 2:
              return _context2.abrupt("return", _context2.sent);

            case 3:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function getAssets() {
      return _getAssets.apply(this, arguments);
    }

    return getAssets;
  }();

  _proto.getAssetsFromAdapter = /*#__PURE__*/function () {
    var _getAssetsFromAdapter = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee3(adapter) {
      return runtime_1.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return this.contract.getAssetsFromAdapter(adapter).then(structArray);

            case 2:
              return _context3.abrupt("return", _context3.sent);

            case 3:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function getAssetsFromAdapter(_x) {
      return _getAssetsFromAdapter.apply(this, arguments);
    }

    return getAssetsFromAdapter;
  }();

  _proto.getPositions = /*#__PURE__*/function () {
    var _getPositions = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee4(address) {
      return runtime_1.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return this.contract.getPositionsOf(address).then(structArray);

            case 2:
              return _context4.abrupt("return", _context4.sent);

            case 3:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function getPositions(_x2) {
      return _getPositions.apply(this, arguments);
    }

    return getPositions;
  }();

  _createClass(LensService, [{
    key: "adapters",
    get: function get() {
      switch (this.chainId) {
        case 1:
        case 250:
        case 1337:
          return {
            vaults: {
              v2: new RegistryV2Adapter(this.chainId, this.ctx)
            }
          };
      }

      throw new TypeError("No adapter exist for chainId " + this.chainId);
    }
  }]);

  return LensService;
}(ContractService);
LensService.abi = LensAbi;

var ZeroAddress = "0x0000000000000000000000000000000000000000";
var EthAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
function handleHttpError(_x) {
  return _handleHttpError.apply(this, arguments);
}

function _handleHttpError() {
  _handleHttpError = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee(response) {
    return runtime_1.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(response.status !== 200)) {
              _context.next = 2;
              break;
            }

            throw new SdkError("HTTP to " + response.url + " request failed (status " + response.status + " " + response.statusText + ")");

          case 2:
            return _context.abrupt("return", response);

          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _handleHttpError.apply(this, arguments);
}

function usdc(value) {
  return bignumber$1.BigNumber.from(Math.floor(Number(value) * 1e6)).toString();
}

function _int(value) {
  return value.toString();
}

var OracleAbi = [// Oracle general
"function calculations() external view returns (address[] memory)", "function getPriceUsdcRecommended(address) public view returns (uint256)", "function usdcAddress() public view returns (address)", // Calculations Curve
"function isCurveLpToken(address) public view returns (bool)", "function getCurvePriceUsdc(address) public view returns (uint256)", "function getBasePrice(address) public view returns (uint256)", "function getVirtualPrice(address) public view returns (uint256)", "function getFirstUnderlyingCoinFromPool(address) public view returns (address)", "function curveRegistryAddress() public view returns (address)", // Calculations Iron Bank
"function isIronBankMarket(address) public view returns (bool)", "function getIronBankMarketPriceUsdc(address) public view returns (uint256)", "function getIronBankMarkets() public view returns (address[] memory)", // Calculations Sushiswap
"function isLpToken(address) public view returns (bool)", "function getPriceFromRouter(address, address) public view returns (uint256)", "function getPriceFromRouterUsdc(address) public view returns (uint256)", "function getLpTokenTotalLiquidityUsdc(address) public view returns (uint256)", "function getLpTokenPriceUsdc(address) public view returns (uint256)"];
/**
 * [[OracleService]] is the main pricing engine, used by all price calculations.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 */

var OracleService = /*#__PURE__*/function (_ContractService) {
  _inheritsLoose(OracleService, _ContractService);

  function OracleService(chainId, ctx) {
    var _ctx$address;

    return _ContractService.call(this, (_ctx$address = ctx.address("oracle")) != null ? _ctx$address : OracleService.addressByChain(chainId), chainId, ctx) || this;
  }

  OracleService.addressByChain = function addressByChain(chainId) {
    switch (chainId) {
      case 1:
        return "0xd3ca98D986Be88b72Ff95fc2eC976a5E6339150d";

      case 250:
        return "0xae813841436fe29b95a14AC701AFb1502C4CB789";
    }

    throw new TypeError("Oracle does not have an address for chainId " + chainId);
  };

  var _proto = OracleService.prototype;

  _proto.getCalculations = /*#__PURE__*/function () {
    var _getCalculations = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee() {
      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.contract.calculations();

            case 2:
              return _context.abrupt("return", _context.sent);

            case 3:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function getCalculations() {
      return _getCalculations.apply(this, arguments);
    }

    return getCalculations;
  }();

  _proto.getPriceUsdc = /*#__PURE__*/function () {
    var _getPriceUsdc = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2(token) {
      return runtime_1.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return this.contract.getPriceUsdcRecommended(token).then(_int);

            case 2:
              return _context2.abrupt("return", _context2.sent);

            case 3:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function getPriceUsdc(_x) {
      return _getPriceUsdc.apply(this, arguments);
    }

    return getPriceUsdc;
  }();

  _proto.getUsdcAddress = /*#__PURE__*/function () {
    var _getUsdcAddress = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee3() {
      return runtime_1.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return this.contract.usdcAddress().then(_int);

            case 2:
              return _context3.abrupt("return", _context3.sent);

            case 3:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function getUsdcAddress() {
      return _getUsdcAddress.apply(this, arguments);
    }

    return getUsdcAddress;
  }() // Calculations Curve
  ;

  _proto.isCurveLpToken =
  /*#__PURE__*/
  function () {
    var _isCurveLpToken = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee4(lpToken) {
      return runtime_1.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return this.contract.isCurveLpToken(lpToken);

            case 2:
              return _context4.abrupt("return", _context4.sent);

            case 3:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function isCurveLpToken(_x2) {
      return _isCurveLpToken.apply(this, arguments);
    }

    return isCurveLpToken;
  }();

  _proto.getCurvePriceUsdc = /*#__PURE__*/function () {
    var _getCurvePriceUsdc = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee5(lpToken) {
      return runtime_1.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return this.contract.getCurvePriceUsdc(lpToken).then(_int);

            case 2:
              return _context5.abrupt("return", _context5.sent);

            case 3:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function getCurvePriceUsdc(_x3) {
      return _getCurvePriceUsdc.apply(this, arguments);
    }

    return getCurvePriceUsdc;
  }();

  _proto.getBasePrice = /*#__PURE__*/function () {
    var _getBasePrice = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee6(lpToken) {
      return runtime_1.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return this.contract.getBasePrice(lpToken).then(_int);

            case 2:
              return _context6.abrupt("return", _context6.sent);

            case 3:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    function getBasePrice(_x4) {
      return _getBasePrice.apply(this, arguments);
    }

    return getBasePrice;
  }();

  _proto.getVirtualPrice = /*#__PURE__*/function () {
    var _getVirtualPrice = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee7(lpToken) {
      return runtime_1.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return this.contract.getVirtualPrice(lpToken).then(_int);

            case 2:
              return _context7.abrupt("return", _context7.sent);

            case 3:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, this);
    }));

    function getVirtualPrice(_x5) {
      return _getVirtualPrice.apply(this, arguments);
    }

    return getVirtualPrice;
  }();

  _proto.getFirstUnderlyingCoinFromPool = /*#__PURE__*/function () {
    var _getFirstUnderlyingCoinFromPool = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee8(pool) {
      return runtime_1.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return this.contract.getFirstUnderlyingCoinFromPool(pool);

            case 2:
              return _context8.abrupt("return", _context8.sent);

            case 3:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8, this);
    }));

    function getFirstUnderlyingCoinFromPool(_x6) {
      return _getFirstUnderlyingCoinFromPool.apply(this, arguments);
    }

    return getFirstUnderlyingCoinFromPool;
  }();

  _proto.getCurveRegistryAddress = /*#__PURE__*/function () {
    var _getCurveRegistryAddress = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee9() {
      return runtime_1.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              _context9.next = 2;
              return this.contract.usdcAddress().then(_int);

            case 2:
              return _context9.abrupt("return", _context9.sent);

            case 3:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9, this);
    }));

    function getCurveRegistryAddress() {
      return _getCurveRegistryAddress.apply(this, arguments);
    }

    return getCurveRegistryAddress;
  }() // Calculations: Iron Bank
  ;

  _proto.isIronBankMarket =
  /*#__PURE__*/
  function () {
    var _isIronBankMarket = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee10(token) {
      return runtime_1.wrap(function _callee10$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              _context10.next = 2;
              return this.contract.isIronBankMarket(token);

            case 2:
              return _context10.abrupt("return", _context10.sent);

            case 3:
            case "end":
              return _context10.stop();
          }
        }
      }, _callee10, this);
    }));

    function isIronBankMarket(_x7) {
      return _isIronBankMarket.apply(this, arguments);
    }

    return isIronBankMarket;
  }();

  _proto.getIronBankMarketPriceUsdc = /*#__PURE__*/function () {
    var _getIronBankMarketPriceUsdc = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee11(token) {
      return runtime_1.wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              _context11.next = 2;
              return this.contract.getIronBankMarketPriceUsdc(token).then(_int);

            case 2:
              return _context11.abrupt("return", _context11.sent);

            case 3:
            case "end":
              return _context11.stop();
          }
        }
      }, _callee11, this);
    }));

    function getIronBankMarketPriceUsdc(_x8) {
      return _getIronBankMarketPriceUsdc.apply(this, arguments);
    }

    return getIronBankMarketPriceUsdc;
  }();

  _proto.getIronBankMarkets = /*#__PURE__*/function () {
    var _getIronBankMarkets = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee12() {
      return runtime_1.wrap(function _callee12$(_context12) {
        while (1) {
          switch (_context12.prev = _context12.next) {
            case 0:
              _context12.next = 2;
              return this.contract.getIronBankMarkets();

            case 2:
              return _context12.abrupt("return", _context12.sent);

            case 3:
            case "end":
              return _context12.stop();
          }
        }
      }, _callee12, this);
    }));

    function getIronBankMarkets() {
      return _getIronBankMarkets.apply(this, arguments);
    }

    return getIronBankMarkets;
  }() // Calculations: Sushiswap
  ;

  _proto.isLpToken =
  /*#__PURE__*/
  function () {
    var _isLpToken = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee13(token) {
      return runtime_1.wrap(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              _context13.next = 2;
              return this.contract.isLpToken(token);

            case 2:
              return _context13.abrupt("return", _context13.sent);

            case 3:
            case "end":
              return _context13.stop();
          }
        }
      }, _callee13, this);
    }));

    function isLpToken(_x9) {
      return _isLpToken.apply(this, arguments);
    }

    return isLpToken;
  }();

  _proto.getPriceFromRouter = /*#__PURE__*/function () {
    var _getPriceFromRouter = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee14(token0, token1) {
      return runtime_1.wrap(function _callee14$(_context14) {
        while (1) {
          switch (_context14.prev = _context14.next) {
            case 0:
              _context14.next = 2;
              return this.contract.getPriceFromRouter(token0, token1).then(_int);

            case 2:
              return _context14.abrupt("return", _context14.sent);

            case 3:
            case "end":
              return _context14.stop();
          }
        }
      }, _callee14, this);
    }));

    function getPriceFromRouter(_x10, _x11) {
      return _getPriceFromRouter.apply(this, arguments);
    }

    return getPriceFromRouter;
  }();

  _proto.getPriceFromRouterUsdc = /*#__PURE__*/function () {
    var _getPriceFromRouterUsdc = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee15(token) {
      return runtime_1.wrap(function _callee15$(_context15) {
        while (1) {
          switch (_context15.prev = _context15.next) {
            case 0:
              _context15.next = 2;
              return this.contract.getPriceFromRouterUsdc(token).then(_int);

            case 2:
              return _context15.abrupt("return", _context15.sent);

            case 3:
            case "end":
              return _context15.stop();
          }
        }
      }, _callee15, this);
    }));

    function getPriceFromRouterUsdc(_x12) {
      return _getPriceFromRouterUsdc.apply(this, arguments);
    }

    return getPriceFromRouterUsdc;
  }();

  _proto.getLpTokenTotalLiquidityUsdc = /*#__PURE__*/function () {
    var _getLpTokenTotalLiquidityUsdc = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee16(token) {
      return runtime_1.wrap(function _callee16$(_context16) {
        while (1) {
          switch (_context16.prev = _context16.next) {
            case 0:
              _context16.next = 2;
              return this.contract.getLpTokenTotalLiquidityUsdc(token).then(_int);

            case 2:
              return _context16.abrupt("return", _context16.sent);

            case 3:
            case "end":
              return _context16.stop();
          }
        }
      }, _callee16, this);
    }));

    function getLpTokenTotalLiquidityUsdc(_x13) {
      return _getLpTokenTotalLiquidityUsdc.apply(this, arguments);
    }

    return getLpTokenTotalLiquidityUsdc;
  }();

  _proto.getLpTokenPriceUsdc = /*#__PURE__*/function () {
    var _getLpTokenPriceUsdc = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee17(token) {
      return runtime_1.wrap(function _callee17$(_context17) {
        while (1) {
          switch (_context17.prev = _context17.next) {
            case 0:
              _context17.next = 2;
              return this.contract.getLpTokenPriceUsdc(token).then(_int);

            case 2:
              return _context17.abrupt("return", _context17.sent);

            case 3:
            case "end":
              return _context17.stop();
          }
        }
      }, _callee17, this);
    }));

    function getLpTokenPriceUsdc(_x14) {
      return _getLpTokenPriceUsdc.apply(this, arguments);
    }

    return getLpTokenPriceUsdc;
  }();

  return OracleService;
}(ContractService);
OracleService.abi = OracleAbi;

/**
 * [[ZapperService]] interacts with the zapper api to gather more insight for
 * tokens and user positions.
 */

var ZapperService = /*#__PURE__*/function (_Service) {
  _inheritsLoose(ZapperService, _Service);

  function ZapperService() {
    return _Service.apply(this, arguments) || this;
  }

  var _proto = ZapperService.prototype;

  _proto.supportedTokens = /*#__PURE__*/function () {
    var _supportedTokens = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee() {
      var url, params, tokens;
      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              url = "https://api.zapper.fi/v1/prices";
              params = new URLSearchParams({
                api_key: this.ctx.zapper
              });
              _context.next = 4;
              return fetch(url + "?" + params).then(handleHttpError).then(function (res) {
                return res.json();
              });

            case 4:
              tokens = _context.sent;
              return _context.abrupt("return", tokens.map(function (token) {
                return {
                  address: token.address,
                  name: token.symbol,
                  symbol: token.symbol,
                  icon: "https://zapper.fi/icons/" + token.symbol + "-icon.png",
                  decimals: token.decimals,
                  price: usdc(token.price),
                  supported: {
                    zapper: true
                  }
                };
              }));

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function supportedTokens() {
      return _supportedTokens.apply(this, arguments);
    }

    return supportedTokens;
  }();

  _proto.balances = /*#__PURE__*/function () {
    var _balances = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2(addresses) {
      var url, params, balances;
      return runtime_1.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              url = "https://api.zapper.fi/v1/balances/tokens";
              params = new URLSearchParams({
                "addresses[]": Array.isArray(addresses) ? addresses.join() : addresses,
                api_key: this.ctx.zapper
              });
              _context2.next = 4;
              return fetch(url + "?" + params).then(handleHttpError).then(function (res) {
                return res.json();
              });

            case 4:
              balances = _context2.sent;
              Object.keys(balances).forEach(function (address$1) {
                var copy = balances[address$1];
                delete balances[address$1];
                balances[address.getAddress(address$1)] = copy.map(function (balance) {
                  var address$1 = balance.address === ZeroAddress ? EthAddress : address.getAddress(String(balance.address));
                  return {
                    address: address$1,
                    token: {
                      address: address$1,
                      name: balance.symbol,
                      symbol: balance.symbol,
                      decimals: balance.decimals
                    },
                    balance: balance.balanceRaw,
                    balanceUsdc: usdc(balance.balanceUSD),
                    price: usdc(balance.price)
                  };
                });
              });

              if (Array.isArray(addresses)) {
                _context2.next = 8;
                break;
              }

              return _context2.abrupt("return", balances[addresses]);

            case 8:
              return _context2.abrupt("return", balances);

            case 9:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function balances(_x) {
      return _balances.apply(this, arguments);
    }

    return balances;
  }();

  _proto.gas = /*#__PURE__*/function () {
    var _gas = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee3() {
      var url, params, gas;
      return runtime_1.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              url = "https://api.zapper.fi/v1/gas-price";
              params = new URLSearchParams({
                api_key: this.ctx.zapper
              });
              _context3.next = 4;
              return fetch(url + "?" + params).then(handleHttpError).then(function (res) {
                return res.json();
              });

            case 4:
              gas = _context3.sent;
              return _context3.abrupt("return", gas);

            case 6:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function gas() {
      return _gas.apply(this, arguments);
    }

    return gas;
  }();

  return ZapperService;
}(Service);

/**
 * [[ApyService]] provides access to off chain apy calculations for yearn
 * products.
 */

var ApyService = /*#__PURE__*/function (_Service) {
  _inheritsLoose(ApyService, _Service);

  function ApyService() {
    return _Service.apply(this, arguments) || this;
  }

  var _proto = ApyService.prototype;

  _proto.get = /*#__PURE__*/function () {
    var _get = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee(address) {
      var url, vaults, vault;
      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              url = "https://vaults.finance/all";
              _context.next = 3;
              return fetch(url).then(handleHttpError).then(function (res) {
                return res.json();
              });

            case 3:
              vaults = _context.sent;
              vault = vaults.find(function (vault) {
                return vault.address === address;
              });

              if (vault) {
                _context.next = 7;
                break;
              }

              return _context.abrupt("return");

            case 7:
              return _context.abrupt("return", vault.apy);

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    function get(_x) {
      return _get.apply(this, arguments);
    }

    return get;
  }();

  return ApyService;
}(Service);

var VaultReader = /*#__PURE__*/function (_Reader) {
  _inheritsLoose(VaultReader, _Reader);

  function VaultReader() {
    return _Reader.apply(this, arguments) || this;
  }

  var _proto = VaultReader.prototype;

  _proto.get = /*#__PURE__*/function () {
    var _get = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2(addresses) {
      var adapters;
      return runtime_1.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              adapters = Object.values(this.yearn.services.lens.adapters.vaults);
              _context2.next = 3;
              return Promise.all(adapters.map( /*#__PURE__*/function () {
                var _ref = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee(adapter) {
                  var assetsStatic, assetsDynamic, assets, _loop, _iterator, _step;

                  return runtime_1.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.next = 2;
                          return adapter.assetsStatic(addresses);

                        case 2:
                          assetsStatic = _context.sent;
                          _context.next = 5;
                          return adapter.assetsDynamic(addresses);

                        case 5:
                          assetsDynamic = _context.sent;
                          assets = new Array();

                          _loop = function _loop() {
                            var asset = _step.value;
                            var dynamic = assetsDynamic.find(function (_ref2) {
                              var address = _ref2.address;
                              return asset.address === address;
                            });

                            if (!dynamic) {
                              throw new SdkError("Dynamic asset does not exist for " + asset.address);
                            }

                            assets.push(_extends({}, asset, dynamic));
                          };

                          for (_iterator = _createForOfIteratorHelperLoose(assetsStatic); !(_step = _iterator()).done;) {
                            _loop();
                          }

                          return _context.abrupt("return", assets);

                        case 10:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }));

                return function (_x2) {
                  return _ref.apply(this, arguments);
                };
              }())).then(function (arr) {
                return arr.flat();
              });

            case 3:
              return _context2.abrupt("return", _context2.sent);

            case 4:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function get(_x) {
      return _get.apply(this, arguments);
    }

    return get;
  }();

  _proto.positionsOf = /*#__PURE__*/function () {
    var _positionsOf = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee3(address, addresses) {
      var adapters;
      return runtime_1.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              adapters = Object.values(this.yearn.services.lens.adapters.vaults);
              _context3.next = 3;
              return Promise.all(adapters.map(function (adapter) {
                return adapter.positionsOf(address, addresses);
              })).then(function (arr) {
                return arr.flat();
              });

            case 3:
              return _context3.abrupt("return", _context3.sent);

            case 4:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function positionsOf(_x3, _x4) {
      return _positionsOf.apply(this, arguments);
    }

    return positionsOf;
  }();

  _proto.apy = /*#__PURE__*/function () {
    var _apy = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee4(address) {
      return runtime_1.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              return _context4.abrupt("return", this.yearn.services.apy.get(address));

            case 1:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function apy(_x5) {
      return _apy.apply(this, arguments);
    }

    return apy;
  }();

  return VaultReader;
}(Reader);

var TokenReader = /*#__PURE__*/function (_Reader) {
  _inheritsLoose(TokenReader, _Reader);

  function TokenReader() {
    return _Reader.apply(this, arguments) || this;
  }

  var _proto = TokenReader.prototype;

  _proto.priceUsdc = /*#__PURE__*/function () {
    var _priceUsdc = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee(token) {
      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", this.yearn.services.oracle.getPriceUsdc(token));

            case 1:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function priceUsdc(_x) {
      return _priceUsdc.apply(this, arguments);
    }

    return priceUsdc;
  }();

  _proto.price = /*#__PURE__*/function () {
    var _price = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2(from, to) {
      return runtime_1.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              return _context2.abrupt("return", this.yearn.services.oracle.getPriceFromRouter(from, to));

            case 1:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function price(_x2, _x3) {
      return _price.apply(this, arguments);
    }

    return price;
  }();

  _proto.balances = /*#__PURE__*/function () {
    var _balances = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee3(addresses) {
      return runtime_1.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              return _context3.abrupt("return", this.yearn.services.zapper.balances(addresses));

            case 1:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function balances(_x4) {
      return _balances.apply(this, arguments);
    }

    return balances;
  }();

  _proto.supported = /*#__PURE__*/function () {
    var _supported = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee6() {
      var _this = this;

      var tokens, zapper, adapters, vaults;
      return runtime_1.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              tokens = [];

              if (!(this.chainId === 1 || this.chainId === 1337)) {
                _context6.next = 6;
                break;
              }

              _context6.next = 4;
              return this.yearn.services.zapper.supportedTokens();

            case 4:
              zapper = _context6.sent;
              tokens.push.apply(tokens, zapper);

            case 6:
              adapters = Object.values(this.yearn.services.lens.adapters.vaults);
              _context6.next = 9;
              return Promise.all(adapters.map( /*#__PURE__*/function () {
                var _ref = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee5(adapter) {
                  var tokens, icons;
                  return runtime_1.wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          _context5.next = 2;
                          return adapter.tokens();

                        case 2:
                          tokens = _context5.sent;
                          icons = _this.yearn.services.icons.get(tokens.map(function (_ref2) {
                            var address = _ref2.address;
                            return address;
                          }));
                          return _context5.abrupt("return", Promise.all(tokens.map( /*#__PURE__*/function () {
                            var _ref3 = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee4(token) {
                              return runtime_1.wrap(function _callee4$(_context4) {
                                while (1) {
                                  switch (_context4.prev = _context4.next) {
                                    case 0:
                                      _context4.t0 = _extends;
                                      _context4.t1 = {};
                                      _context4.t2 = token;
                                      _context4.t3 = icons[token.address];
                                      _context4.t4 = {};
                                      _context4.next = 7;
                                      return _this.yearn.services.oracle.getPriceUsdc(token.address);

                                    case 7:
                                      _context4.t5 = _context4.sent;
                                      _context4.t6 = {
                                        icon: _context4.t3,
                                        supported: _context4.t4,
                                        price: _context4.t5
                                      };
                                      return _context4.abrupt("return", (0, _context4.t0)(_context4.t1, _context4.t2, _context4.t6));

                                    case 10:
                                    case "end":
                                      return _context4.stop();
                                  }
                                }
                              }, _callee4);
                            }));

                            return function (_x6) {
                              return _ref3.apply(this, arguments);
                            };
                          }())));

                        case 5:
                        case "end":
                          return _context5.stop();
                      }
                    }
                  }, _callee5);
                }));

                return function (_x5) {
                  return _ref.apply(this, arguments);
                };
              }())).then(function (arr) {
                return arr.flat();
              });

            case 9:
              vaults = _context6.sent;
              tokens.push.apply(tokens, vaults);
              return _context6.abrupt("return", tokens);

            case 12:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    function supported() {
      return _supported.apply(this, arguments);
    }

    return supported;
  }();

  _proto.icon = function icon(address) {
    return this.yearn.services.icons.get(address);
  };

  return TokenReader;
}(Reader);

var CACHE_NAMESPACE = "yearn_sdk";
var CacheManager = /*#__PURE__*/function () {
  function CacheManager(cache) {
    this.cache = Object.assign({}, {
      get: function get() {
        return undefined;
      },
      set: function set() {},
      ttl: Infinity
    }, cache);
  }

  var _proto = CacheManager.prototype;

  _proto.what = function what(key) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return CACHE_NAMESPACE + hash({
      key: key,
      args: args
    });
  };

  _proto.set = function set(value, key) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      args[_key2 - 2] = arguments[_key2];
    }

    var id = this.what.apply(this, [key].concat(args));
    this.cache.set(id, JSON.stringify({
      value: value,
      timestamp: Date.now()
    }));
  };

  _proto.get = function get(key) {
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }

    var id = this.what.apply(this, [key].concat(args));
    var raw = this.cache.get(id);
    if (!raw) return undefined;
    var cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > this.cache.ttl) return undefined;
    return cached.value;
  };

  return CacheManager;
}();

var Context = /*#__PURE__*/function () {
  function Context(ctx, cache) {
    this.ctx = Object.assign({}, ctx, {
      // https://docs.zapper.fi/build/zapper-api#authentication
      zapper: "96e0cc51-a62e-42ca-acee-910ea7d2a241"
    });
    this.cache = new CacheManager(cache);
  }

  var _proto = Context.prototype;

  _proto.address = function address(service) {
    return this.addresses[service];
  };

  _createClass(Context, [{
    key: "provider",
    get: function get() {
      if (this.ctx.provider) return this.ctx.provider;
      throw new SdkError("provider must not be undefined in Context for this feature to work.");
    }
  }, {
    key: "zapper",
    get: function get() {
      if (this.ctx.zapper) return this.ctx.zapper;
      throw new SdkError("zapper must not be undefined in Context for this feature to work.");
    }
  }, {
    key: "etherscan",
    get: function get() {
      if (this.ctx.etherscan) return this.ctx.etherscan;
      throw new SdkError("etherscan must not be undefined in Context for this feature to work.");
    }
  }, {
    key: "addresses",
    get: function get() {
      if (this.ctx.addresses) return this.ctx.addresses;
      return {};
    }
  }]);

  return Context;
}();

var YearnAssets = "https://api.github.com/repos/yearn/yearn-assets/contents/icons/tokens";
var TrustAssets = "https://raw.githack.com/trustwallet/assets/master/blockchains/ethereum/tokenlist.json";

var YearnAsset = function YearnAsset(address) {
  return "https://raw.githack.com/yearn/yearn-assets/master/icons/tokens/" + address + "/logo-128.png";
};

var TrustAsset = function TrustAsset(address) {
  return "https://raw.githack.com/trustwallet/assets/master/blockchains/ethereum/assets/" + address + "/logo.png";
};
/**
 * [[IconsService]] fetches correct icons related to eth addresses
 * from trusted asset sources
 */


var IconsService = /*#__PURE__*/function (_Service) {
  _inheritsLoose(IconsService, _Service);

  function IconsService(chainId, ctx) {
    var _this;

    _this = _Service.call(this, chainId, ctx) || this;
    _this.supported = new Map();
    _this.ready = _this.initialize();
    return _this;
  }

  var _proto = IconsService.prototype;

  _proto.initialize = /*#__PURE__*/function () {
    var _initialize = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee() {
      var yearn, trust, _iterator, _step, token, _iterator2, _step2, _token;

      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return fetch(YearnAssets).then(handleHttpError).then(function (res) {
                return res.json();
              });

            case 2:
              yearn = _context.sent;
              _context.next = 5;
              return fetch(TrustAssets).then(handleHttpError).then(function (res) {
                return res.json();
              }).then(function (res) {
                return res.tokens;
              });

            case 5:
              trust = _context.sent;
              this.supported = new Map();

              for (_iterator = _createForOfIteratorHelperLoose(trust); !(_step = _iterator()).done;) {
                token = _step.value;
                this.supported.set(token.address, TrustAsset(token.address));
              }

              for (_iterator2 = _createForOfIteratorHelperLoose(yearn); !(_step2 = _iterator2()).done;) {
                _token = _step2.value;
                this.supported.set(_token.address, YearnAsset(_token.address));
              }

            case 9:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function initialize() {
      return _initialize.apply(this, arguments);
    }

    return initialize;
  }();

  _proto.get = function get(address) {
    var _this2 = this;

    if (!Array.isArray(address)) {
      return this.supported.get(address);
    }

    return Object.fromEntries(address.map(function (address) {
      return [address, _this2.supported.get(address)];
    }));
  };

  return IconsService;
}(Service);

var subgraphUrl = "https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-mainnet";
var SubgraphService = /*#__PURE__*/function (_Service) {
  _inheritsLoose(SubgraphService, _Service);

  function SubgraphService() {
    return _Service.apply(this, arguments) || this;
  }

  var _proto = SubgraphService.prototype;

  _proto.performQuery = /*#__PURE__*/function () {
    var _performQuery = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee(query) {
      var response, result;
      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return fetch(subgraphUrl, {
                method: "POST",
                body: JSON.stringify({
                  query: query
                })
              });

            case 2:
              response = _context.sent;
              _context.next = 5;
              return response.json();

            case 5:
              result = _context.sent;
              return _context.abrupt("return", result.data);

            case 7:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    function performQuery(_x) {
      return _performQuery.apply(this, arguments);
    }

    return performQuery;
  }();

  return SubgraphService;
}(Service);

var EarningsReader = /*#__PURE__*/function (_Reader) {
  _inheritsLoose(EarningsReader, _Reader);

  function EarningsReader() {
    return _Reader.apply(this, arguments) || this;
  }

  var _proto = EarningsReader.prototype;

  _proto.protocolEarnings = /*#__PURE__*/function () {
    var _protocolEarnings = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee() {
      var query, response, result, _iterator, _step, vault, earnings, earningsUsdc;

      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              query = "\n    {\n      vaults(where:{balanceTokens_gt:0}) {\n        id\n        balanceTokens\n        token {\n          symbol\n          id\n          decimals\n        }\n        latestUpdate {\n          pricePerShare\n        }\n        sharesSupply\n      }\n    }\n    ";
              _context.next = 3;
              return this.yearn.services.subgraph.performQuery(query);

            case 3:
              response = _context.sent;
              result = bignumber$1.BigNumber.from(0);
              _iterator = _createForOfIteratorHelperLoose(response.vaults);

            case 6:
              if ((_step = _iterator()).done) {
                _context.next = 15;
                break;
              }

              vault = _step.value;
              earnings = calculateEarningsForVault(vault);
              _context.next = 11;
              return this.tokensValueInUsdc(earnings, vault.token);

            case 11:
              earningsUsdc = _context.sent;

              // TODO - some results are negative, and some are too large to be realistically possible. This is due to problems with the subgraph and should be fixed there
              if (earningsUsdc.gt(bignumber$1.BigNumber.from(0)) && earningsUsdc.lt(bignumber$1.BigNumber.from(1000000000))) {
                result.add(earningsUsdc);
              }

            case 13:
              _context.next = 6;
              break;

            case 15:
              return _context.abrupt("return", result.toString());

            case 16:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function protocolEarnings() {
      return _protocolEarnings.apply(this, arguments);
    }

    return protocolEarnings;
  }();

  _proto.assetEarnings = /*#__PURE__*/function () {
    var _assetEarnings = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2(vaultAddress) {
      var query, response, vault, earnings, earningsUsdc, result;
      return runtime_1.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              query = "\n    {\n      vault(id: \"" + vaultAddress.toLowerCase() + "\") {\n        id\n        balanceTokens\n        token {\n          symbol\n          id\n          decimals\n        }\n        latestUpdate {\n          pricePerShare\n        }\n        sharesSupply\n      }\n    }\n    "; // console.log(query);

              _context2.next = 3;
              return this.yearn.services.subgraph.performQuery(query);

            case 3:
              response = _context2.sent;
              console.log(response);
              vault = response.vault;
              earnings = calculateEarningsForVault(vault);
              console.log(earnings.toString());
              _context2.next = 10;
              return this.tokensValueInUsdc(earnings, vault.token);

            case 10:
              earningsUsdc = _context2.sent;
              result = {
                assetId: vaultAddress,
                amount: earnings.toString(),
                amountUsdc: earningsUsdc.toString(),
                tokenId: vault.token.id
              };
              return _context2.abrupt("return", result);

            case 13:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function assetEarnings(_x) {
      return _assetEarnings.apply(this, arguments);
    }

    return assetEarnings;
  }();

  _proto.accountEarnings = /*#__PURE__*/function () {
    var _accountEarnings = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee4(accountAddress) {
      var _this = this;

      var sumTokenAmountsFromInteractions, calculateEarningsForVaultPosition, query, response, account, vaultPositions, earnings, totalEarningsUsdc, _iterator2, _step2, vaultPosition, vaultUserEarnings, result;

      return runtime_1.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              sumTokenAmountsFromInteractions = function _sumTokenAmountsFromI(interactions, vaultAddress) {
                return interactions.filter(function (deposit) {
                  return deposit.vault.id == vaultAddress;
                }).map(function (deposit) {
                  return bignumber$1.BigNumber.from(deposit.tokenAmount);
                }).reduce(function (total, amount) {
                  return total.add(amount);
                }, bignumber$1.BigNumber.from(0));
              };

              calculateEarningsForVaultPosition = /*#__PURE__*/function () {
                var _ref = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee3(vaultPosition) {
                  var vaultAddress, depositsTotal, sharesReceivedTotal, sharesSentTotal, withdrawalsTotal, positiveValues, negativeValues, totalTokensEarned, totalEarnedUsdc, result;
                  return runtime_1.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          vaultAddress = vaultPosition.vault.id;
                          depositsTotal = sumTokenAmountsFromInteractions(account.deposits, vaultAddress);
                          sharesReceivedTotal = sumTokenAmountsFromInteractions(account.sharesReceived, vaultAddress);
                          sharesSentTotal = sumTokenAmountsFromInteractions(account.sharesSent, vaultAddress);
                          withdrawalsTotal = sumTokenAmountsFromInteractions(account.withdrawals, vaultAddress);
                          positiveValues = bignumber$1.BigNumber.from(vaultPosition.tokenAmount).add(withdrawalsTotal).add(sharesSentTotal);
                          negativeValues = depositsTotal.add(sharesReceivedTotal);
                          totalTokensEarned = bignumber$1.BigNumber.from(0);

                          if (!positiveValues.gt(negativeValues)) {
                            _context3.next = 12;
                            break;
                          }

                          totalTokensEarned = positiveValues.sub(negativeValues);
                          _context3.next = 13;
                          break;

                        case 12:
                          throw new Error("subtraction overthrow error while calculating earnings for vault " + vaultPosition.vault.id + " with account address " + accountAddress + "}");

                        case 13:
                          _context3.next = 15;
                          return _this.tokensValueInUsdc(totalTokensEarned, vaultPosition.token);

                        case 15:
                          totalEarnedUsdc = _context3.sent;
                          result = {
                            assetId: vaultPosition.vault.id,
                            tokenId: vaultPosition.token.id,
                            amount: totalTokensEarned.toString(),
                            amountUsdc: totalEarnedUsdc.toString()
                          };
                          return _context3.abrupt("return", result);

                        case 18:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _callee3);
                }));

                return function calculateEarningsForVaultPosition(_x3) {
                  return _ref.apply(this, arguments);
                };
              }();

              query = "\n      {\n        account(id: \"" + accountAddress.toLowerCase() + "\") {\n        sharesSent {\n          tokenAmount\n          vault {\n            id\n          }\n        }\n        sharesReceived {\n          tokenAmount\n          vault {\n            id\n          }\n        }\n        deposits {\n          tokenAmount\n          vault {\n            id\n          }\n        }\n        withdrawals {\n          tokenAmount\n          vault {\n            id\n          }\n        }\n        vaultPositions {\n          balanceShares\n          token {\n            id\n            symbol\n            decimals\n          }\n          shareToken {\n            id\n            symbol\n            decimals\n          }\n          vault {\n            id\n            latestUpdate {\n                pricePerShare\n            }\n          }\n        }\n      }\n    }\n    ";
              _context4.next = 5;
              return this.yearn.services.subgraph.performQuery(query);

            case 5:
              response = _context4.sent;
              account = response.account;
              vaultPositions = account.vaultPositions.map(function (vaultPositionContainer) {
                var shares = bignumber$1.BigNumber.from(vaultPositionContainer.balanceShares);
                var pricePerShare = bignumber$1.BigNumber.from(vaultPositionContainer.vault.latestUpdate.pricePerShare);
                var decimals = bignumber$1.BigNumber.from(vaultPositionContainer.token.decimals);
                var tokenAmount = shares.mul(pricePerShare).div(bignumber$1.BigNumber.from(10).pow(decimals));
                var result = {
                  balanceShares: vaultPositionContainer.balanceShares,
                  token: vaultPositionContainer.token,
                  shareToken: vaultPositionContainer.shareToken,
                  vault: vaultPositionContainer.vault,
                  tokenAmount: tokenAmount.toString()
                };
                return result;
              });
              earnings = [];
              totalEarningsUsdc = bignumber$1.BigNumber.from(0);
              _iterator2 = _createForOfIteratorHelperLoose(vaultPositions);

            case 11:
              if ((_step2 = _iterator2()).done) {
                _context4.next = 20;
                break;
              }

              vaultPosition = _step2.value;
              _context4.next = 15;
              return calculateEarningsForVaultPosition(vaultPosition);

            case 15:
              vaultUserEarnings = _context4.sent;
              earnings.push(vaultUserEarnings);
              totalEarningsUsdc = totalEarningsUsdc.add(bignumber$1.BigNumber.from(vaultUserEarnings.amountUsdc));

            case 18:
              _context4.next = 11;
              break;

            case 20:
              result = {
                earnings: earnings,
                accountId: accountAddress,
                totalEarnedUsdc: totalEarningsUsdc.toString()
              };
              console.log(result);
              return _context4.abrupt("return", result);

            case 23:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function accountEarnings(_x2) {
      return _accountEarnings.apply(this, arguments);
    }

    return accountEarnings;
  }();

  _proto.tokensValueInUsdc = /*#__PURE__*/function () {
    var _tokensValueInUsdc = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee5(tokenAmount, token) {
      var tokenUsdcPrice;
      return runtime_1.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return this.yearn.services.oracle.getPriceUsdc(token.id);

            case 2:
              tokenUsdcPrice = _context5.sent;
              return _context5.abrupt("return", bignumber$1.BigNumber.from(tokenUsdcPrice).mul(tokenAmount).div(bignumber$1.BigNumber.from(10).pow(bignumber$1.BigNumber.from(token.decimals))));

            case 4:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function tokensValueInUsdc(_x4, _x5) {
      return _tokensValueInUsdc.apply(this, arguments);
    }

    return tokensValueInUsdc;
  }();

  return EarningsReader;
}(Reader);

function calculateEarningsForVault(vault) {
  var pricePerShare = bignumber$1.BigNumber.from(vault.latestUpdate.pricePerShare);
  var totalTokens = pricePerShare.mul(bignumber$1.BigNumber.from(vault.sharesSupply));
  var earnedTokens = totalTokens.sub(bignumber$1.BigNumber.from(vault.balanceTokens)).div(bignumber$1.BigNumber.from(10).pow(bignumber$1.BigNumber.from(vault.token.decimals)));
  return earnedTokens;
}

var Yearn = function Yearn(chainId, context, cache) {
  var ctx = new Context(context, cache);
  this.services = {
    lens: new LensService(chainId, ctx),
    oracle: new OracleService(chainId, ctx),
    zapper: new ZapperService(chainId, ctx),
    icons: new IconsService(chainId, ctx),
    apy: new ApyService(chainId, ctx),
    subgraph: new SubgraphService(chainId, ctx)
  };
  this.vaults = new VaultReader(this, chainId, ctx);
  this.tokens = new TokenReader(this, chainId, ctx);
  this.earnings = new EarningsReader(this, chainId, ctx);
  this.ready = Promise.all([this.services.icons.ready]);
};

exports.ApyService = ApyService;
exports.LensService = LensService;
exports.OracleService = OracleService;
exports.TokenReader = TokenReader;
exports.VaultReader = VaultReader;
exports.Yearn = Yearn;
exports.ZapperService = ZapperService;
//# sourceMappingURL=sdk.cjs.development.js.map
