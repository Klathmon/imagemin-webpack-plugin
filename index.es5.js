'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

/**
 * Optimize images from webpack and put them back in the asset array when done
 * @param  {Function} throttle       The setup throttle library
 * @param  {Object} compilation      The compilation from webpack-sources
 * @param  {Regex} testRegexes       The regex to match if a specific image should be optimized
 * @param  {Integer} minFileSize     The minimum size of a file in bytes (files under this size will be skipped)
 * @param  {Integer} maxFileSize     The maximum size of a file in bytes (files over this size will be skipped)
 * @param  {Object} imageminOptions  Options to pass to imageminOptions
 * @return {Promise}                 Resolves when all images are done being optimized
 */
var optimizeWebpackImages = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(throttle, compilation, testRegexes, minFileSize, maxFileSize, imageminOptions) {
    var _this2 = this;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt('return', _promise2.default.all((0, _lodash2.default)(compilation.assets, function (asset, filename) {
              return throttle((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
                var assetSource, optimizedImageBuffer;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        assetSource = asset.source();
                        // Skip the image if it's not a match for the regex

                        if (!(testFile(filename, testRegexes) && testFileSize(assetSource, minFileSize, maxFileSize))) {
                          _context2.next = 6;
                          break;
                        }

                        _context2.next = 4;
                        return optimizeImage(assetSource, imageminOptions);

                      case 4:
                        optimizedImageBuffer = _context2.sent;

                        // Then write the optimized version back to the asset object as a "raw source"
                        compilation.assets[filename] = new _RawSource2.default(optimizedImageBuffer);

                      case 6:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, _this2);
              })));
            })));

          case 1:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function optimizeWebpackImages(_x4, _x5, _x6, _x7, _x8, _x9) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * Optimizes external images,
 * @param  {[type]} throttle        [description]
 * @param  {[type]} sources         [description]
 * @param  {[type]} destination     [description]
 * @param  {[type]} imageminOptions [description]
 * @param  {[type]} minFileSize     [description]
 * @param  {[type]} maxFileSize     [description]
 * @return {[type]}                 [description]
 */


var optimizeExternalImages = function () {
  var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(throttle, sources, destination, minFileSize, maxFileSize, imageminOptions) {
    var _this3 = this;

    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            return _context5.abrupt('return', _promise2.default.all((0, _lodash2.default)(sources, function (filename) {
              return throttle((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
                var fileData, optimizedImageBuffer, writeFilePath;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        _context4.next = 2;
                        return readFile(filename);

                      case 2:
                        fileData = _context4.sent;

                        if (!testFileSize(fileData, minFileSize, maxFileSize)) {
                          _context4.next = 15;
                          break;
                        }

                        _context4.t0 = optimizeImage;
                        _context4.next = 7;
                        return readFile(filename);

                      case 7:
                        _context4.t1 = _context4.sent;
                        _context4.t2 = imageminOptions;
                        _context4.next = 11;
                        return (0, _context4.t0)(_context4.t1, _context4.t2);

                      case 11:
                        optimizedImageBuffer = _context4.sent;


                        // Then if the destination is provided use it, otherwise overwrite the image in place
                        if (typeof destination !== 'string') {
                          destination = '.';
                        }
                        writeFilePath = _path2.default.normalize(`${destination}/${filename}`);
                        return _context4.abrupt('return', writeFile(writeFilePath, optimizedImageBuffer));

                      case 15:
                      case 'end':
                        return _context4.stop();
                    }
                  }
                }, _callee4, _this3);
              })));
            })));

          case 1:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function optimizeExternalImages(_x10, _x11, _x12, _x13, _x14, _x15) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * Optimizes a single image, returning the orignal if the "optimized" version is larger
 * @param  {Object}  imageData
 * @param  {Object}  imageminOptions
 * @return {Promise(asset)}
 */


var optimizeImage = function () {
  var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(imageData, imageminOptions) {
    var imageBuffer, originalSize, optimizedImageBuffer;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            // Ensure that the contents i have are in the form of a buffer
            imageBuffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData, 'utf8');
            // And get the original size for comparison later to make sure it actually got smaller

            originalSize = imageBuffer.length;

            // Await for imagemin to do the compression

            _context6.next = 4;
            return _imagemin2.default.buffer(imageBuffer, imageminOptions);

          case 4:
            optimizedImageBuffer = _context6.sent;

            if (!(optimizedImageBuffer.length < originalSize)) {
              _context6.next = 9;
              break;
            }

            return _context6.abrupt('return', optimizedImageBuffer);

          case 9:
            return _context6.abrupt('return', imageBuffer);

          case 10:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function optimizeImage(_x16, _x17) {
    return _ref6.apply(this, arguments);
  };
}();

/**
 * Tests a filename to see if it matches any of the given test globs/regexes
 * @param  {String} filename
 * @param  {Array} regexes
 * @return {Boolean}
 */


/**
 * async wrapper for fs readFile.
 * @param {any} filename
 * @returns * @return {Promise(buffer)}
 */
var readFile = function () {
  var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(filename) {
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            return _context7.abrupt('return', new _promise2.default(function (resolve, reject) {
              _fs2.default.readFile(filename, '', function (error, result) {
                if (error) {
                  return reject(error);
                }
                resolve(result);
              });
            }));

          case 1:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function readFile(_x18) {
    return _ref7.apply(this, arguments);
  };
}();

/**
 * async wrapper for exists
 * @param {any} directory
 * @returns
 */


var exists = function () {
  var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(directory) {
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            return _context8.abrupt('return', new _promise2.default(function (resolve, reject) {
              _fs2.default.access(directory, _fs2.default.constants.R_OK | _fs2.default.constants.W_OK, function (err) {
                if (err) resolve(false);

                resolve(true);
              });
            }));

          case 1:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function exists(_x19) {
    return _ref8.apply(this, arguments);
  };
}();

/**
 * async wrapper for writeFile
 * @param {any} filename
 * @param {any} buffer
 * @returns
 */


var writeFile = function () {
  var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9(filename, buffer) {
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            return _context9.abrupt('return', new _promise2.default(function (resolve, reject) {
              var doWrite = function doWrite() {
                _fs2.default.writeFile(filename, buffer, function (error) {
                  if (error) {
                    return reject(error);
                  }
                  resolve();
                });
              };
              var directory = _path2.default.dirname(filename);
              exists(directory).then(function (exists) {
                if (!exists) {
                  _fs2.default.mkdir(directory, doWrite);
                } else {
                  doWrite();
                }
              });
            }));

          case 1:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function writeFile(_x20, _x21) {
    return _ref9.apply(this, arguments);
  };
}();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _os = require('os');

var _lodash = require('lodash.map');

var _lodash2 = _interopRequireDefault(_lodash);

var _imagemin = require('imagemin');

var _imagemin2 = _interopRequireDefault(_imagemin);

var _minimatch = require('minimatch');

var _asyncThrottle = require('async-throttle');

var _asyncThrottle2 = _interopRequireDefault(_asyncThrottle);

var _RawSource = require('webpack-sources/lib/RawSource');

var _RawSource2 = _interopRequireDefault(_RawSource);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ImageminPlugin = function () {
  function ImageminPlugin() {
    var _options$imageminOpti;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, ImageminPlugin);

    // I love ES2015!
    var _options$disable = options.disable,
        disable = _options$disable === undefined ? false : _options$disable,
        _options$test = options.test,
        test = _options$test === undefined ? /.*/ : _options$test,
        _options$minFileSize = options.minFileSize,
        minFileSize = _options$minFileSize === undefined ? 0 : _options$minFileSize,
        _options$maxFileSize = options.maxFileSize,
        maxFileSize = _options$maxFileSize === undefined ? Infinity : _options$maxFileSize,
        _options$maxConcurren = options.maxConcurrency,
        maxConcurrency = _options$maxConcurren === undefined ? (0, _os.cpus)().length : _options$maxConcurren,
        _options$plugins = options.plugins,
        plugins = _options$plugins === undefined ? [] : _options$plugins,
        _options$externalImag = options.externalImages,
        externalImages = _options$externalImag === undefined ? {
      sources: [],
      destination: null
    } : _options$externalImag;


    this.options = {
      disable,
      maxConcurrency,
      minFileSize,
      maxFileSize,
      imageminOptions: {
        plugins: []
      },
      testRegexes: compileTestOption(test),
      externalImages

      // And finally, add any plugins that they pass in the options to the internal plugins array
    };(_options$imageminOpti = this.options.imageminOptions.plugins).push.apply(_options$imageminOpti, (0, _toConsumableArray3.default)(plugins));
  }

  (0, _createClass3.default)(ImageminPlugin, [{
    key: 'apply',
    value: function apply(compiler) {
      var _this = this;

      // If disabled, short-circuit here and just return
      if (this.options.disable === true) return null;

      // Pull out options needed here
      var _options = this.options,
          testRegexes = _options.testRegexes,
          minFileSize = _options.minFileSize,
          maxFileSize = _options.maxFileSize;
      var _options$externalImag2 = this.options.externalImages,
          sources = _options$externalImag2.sources,
          destination = _options$externalImag2.destination;

      // Access the assets once they have been assembled

      compiler.plugin('emit', function () {
        var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(compilation, callback) {
          var throttle;
          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  throttle = (0, _asyncThrottle2.default)(_this.options.maxConcurrency);

                  if (!(typeof sources === 'function')) {
                    _context.next = 5;
                    break;
                  }

                  _context.next = 4;
                  return sources();

                case 4:
                  sources = _context.sent;

                case 5:
                  if (!(typeof destination === 'function')) {
                    _context.next = 9;
                    break;
                  }

                  _context.next = 8;
                  return destination();

                case 8:
                  destination = _context.sent;

                case 9:
                  _context.prev = 9;
                  _context.next = 12;
                  return _promise2.default.all([optimizeWebpackImages(throttle, compilation, testRegexes, minFileSize, maxFileSize, _this.options.imageminOptions), optimizeExternalImages(throttle, sources, destination, minFileSize, maxFileSize, _this.options.imageminOptions)]);

                case 12:
                  // At this point everything is done, so call the callback without anything in it
                  callback();
                  _context.next = 18;
                  break;

                case 15:
                  _context.prev = 15;
                  _context.t0 = _context['catch'](9);

                  callback(_context.t0);

                case 18:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this, [[9, 15]]);
        }));

        return function (_x2, _x3) {
          return _ref.apply(this, arguments);
        };
      }());
    }
  }]);
  return ImageminPlugin;
}();

exports.default = ImageminPlugin;
function testFile(filename, regexes) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(regexes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var regex = _step.value;

      if (regex.test(filename)) {
        return true;
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
}

function testFileSize(assetSource, minFileSize, maxFileSize) {
  return assetSource.length > minFileSize && assetSource.length <= maxFileSize;
}

/**
 * Compiles a regex, glob, or an array of globs to a single regex for testing later
 * @param  {RegExp|String|String[]} rawTestValue
 * @return {RegExp}
 */
function compileTestOption(rawTestValue) {
  var tests = Array.isArray(rawTestValue) ? rawTestValue : [rawTestValue];

  return tests.map(function (test) {
    if (test instanceof RegExp) {
      // If it's a regex, just return it
      return test;
    } else if (typeof test === 'string') {
      // If it's a string, let minimatch convert it to a regex
      return (0, _minimatch.makeRe)(test);
    } else {
      throw new Error('test parameter must be a regex, glob string, or an array of regexes or glob strings');
    }
  });
}
