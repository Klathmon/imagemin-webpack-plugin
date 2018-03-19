'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.writeFile = exports.exists = exports.getFromCacheIfPossible = exports.optimizeImage = exports.readFile = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * Optimizes a single image, returning the orignal if the "optimized" version is larger
 * @param  {Object}  imageData
 * @param  {Object}  imageminOptions
 * @return {Promise(asset)}
 */
var optimizeImage = exports.optimizeImage = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(imageData, imageminOptions) {
    var imageBuffer, originalSize, optimizedImageBuffer;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // Ensure that the contents i have are in the form of a buffer
            imageBuffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData, 'utf8');
            // And get the original size for comparison later to make sure it actually got smaller

            originalSize = imageBuffer.length;

            // Await for imagemin to do the compression

            _context.next = 4;
            return _imagemin2.default.buffer(imageBuffer, imageminOptions);

          case 4:
            optimizedImageBuffer = _context.sent;

            if (!(optimizedImageBuffer.length < originalSize)) {
              _context.next = 9;
              break;
            }

            return _context.abrupt('return', optimizedImageBuffer);

          case 9:
            return _context.abrupt('return', imageBuffer);

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function optimizeImage(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Tests a filename to see if it matches any of the given test functions
 * This function is curried, pass in the first 3 params first, then the next 2
 * for each test needed
 * @param  {RegExp|RegExp[]|Function|Function[]|String|String[]} rawTestValue
 * @param  {Number} minFileSize
 * @param  {Number} maxFileSize
 * @return {Boolean}
 */


/**
 * Gets the buffer of the file from cache. If it doesn't exist or the cache is
 * not enabled, it will invoke elseFunc and use it's result as the result of the
 * function, saving the result in the cache
 * @param  {String} cacheFolder
 * @param  {String} filename
 * @param  {Function} elseFunc
 * @return {Buffer}
 */
var getFromCacheIfPossible = exports.getFromCacheIfPossible = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(cacheFolder, filename, elseFunc) {
    var cacheFilePath, fileBuffer;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            cacheFilePath = void 0;

            if (!(cacheFolder !== null)) {
              _context2.next = 7;
              break;
            }

            cacheFilePath = _path2.default.resolve(cacheFolder, hashFilename(filename));
            _context2.next = 5;
            return exists(cacheFilePath);

          case 5:
            if (!_context2.sent) {
              _context2.next = 7;
              break;
            }

            return _context2.abrupt('return', readFile(cacheFilePath));

          case 7:
            _context2.next = 9;
            return elseFunc();

          case 9:
            fileBuffer = _context2.sent;

            if (!(cacheFolder !== null)) {
              _context2.next = 13;
              break;
            }

            _context2.next = 13;
            return writeFile(cacheFilePath, fileBuffer);

          case 13:
            return _context2.abrupt('return', fileBuffer);

          case 14:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function getFromCacheIfPossible(_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * checks if a file/directory is accessable
 * @param {any} directory
 * @returns
 */


var exists = exports.exists = function () {
  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(directory) {
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt('return', new _promise2.default(function (resolve, reject) {
              _fs2.default.access(directory, _fs2.default.constants.R_OK | _fs2.default.constants.W_OK, function (err) {
                if (err) {
                  resolve(false);
                } else {
                  resolve(true);
                }
              });
            }));

          case 1:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function exists(_x6) {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * async wrapper for writeFile that will create the directory if it does not already exist
 * @param {String} filename
 * @param {Buffer} buffer
 * @returns
 */


var writeFile = exports.writeFile = function () {
  var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(filename, buffer) {
    var directory;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            directory = _path2.default.dirname(filename);
            // if the directory doesn't exist, create it

            _context4.next = 3;
            return exists(directory);

          case 3:
            if (_context4.sent) {
              _context4.next = 6;
              break;
            }

            _context4.next = 6;
            return mkdirpAsync(directory);

          case 6:
            return _context4.abrupt('return', writeFileAsync(filename, buffer));

          case 7:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function writeFile(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * Compiles a regex, glob, function, or an array of any of them to an array of functions
 * @param  {RegExp|RegExp[]|Function|Function[]|String|String[]} rawTestValue
 * @return {Function[]}
 */


exports.buildTestFunction = buildTestFunction;
exports.hashFilename = hashFilename;
exports.invokeIfFunction = invokeIfFunction;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _minimatch = require('minimatch');

var _imagemin = require('imagemin');

var _imagemin2 = _interopRequireDefault(_imagemin);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _util = require('util.promisify');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var readFile = exports.readFile = (0, _util2.default)(_fs2.default.readFile);
var writeFileAsync = (0, _util2.default)(_fs2.default.writeFile);
var mkdirpAsync = (0, _util2.default)(_mkdirp2.default);function buildTestFunction(rawTestValue, minFileSize, maxFileSize) {
  var testFunctions = compileRegex(rawTestValue);
  /**
   * @param  {String}      filename
   * @param  {assetSource} assetSource
   * @return {Boolean}
   */
  return function (filename, assetSource) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = (0, _getIterator3.default)(testFunctions), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var func = _step.value;

        if (func(filename) === true) {
          return assetSource.length > minFileSize && assetSource.length <= maxFileSize;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return false;
  };
}

/**
 * hashes a filename to make sure I can uniquely store a file even with absolute paths
 * @param  {string} filePath The path (relative or absolute) to the file
 * @return {string}          A hash of the full file path
 */
function hashFilename(filePath) {
  return _crypto2.default.createHash('sha1').update(filePath).digest('hex');
}

/**
 * Invokes the passed in argument if it's a function
 * @param  {Function|Any}  func
 * @return {Any}
 */
function invokeIfFunction(func) {
  if (typeof func === 'function') {
    return func();
  } else {
    return func;
  }
}function compileRegex(rawTestValue) {
  var tests = Array.isArray(rawTestValue) ? rawTestValue : [rawTestValue];

  return tests.map(function (test) {
    if (typeof test === 'function') {
      // if it's a function, just return this
      return test;
    } else if (test instanceof RegExp) {
      // If it's a regex return it wrapped in a function
      return function (filename) {
        return test.test(filename);
      };
    } else if (typeof test === 'string') {
      // If it's a string, let minimatch convert it to a regex then wrap that in a function
      var regex = (0, _minimatch.makeRe)(test);
      return function (filename) {
        return regex.test(filename);
      };
    } else {
      throw new Error('test parameter must be a regex, glob string, function, or an array of any of them');
    }
  });
}
//# sourceMappingURL=helpers.js.map