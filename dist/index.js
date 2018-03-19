'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _os = require('os');

var _lodash = require('lodash.map');

var _lodash2 = _interopRequireDefault(_lodash);

var _asyncThrottle = require('async-throttle');

var _asyncThrottle2 = _interopRequireDefault(_asyncThrottle);

var _RawSource = require('webpack-sources/lib/RawSource');

var _RawSource2 = _interopRequireDefault(_RawSource);

var _helpers = require('./helpers.js');

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
        externalImages = _options$externalImag === undefined ? {} : _options$externalImag,
        _options$cacheFolder = options.cacheFolder,
        cacheFolder = _options$cacheFolder === undefined ? null : _options$cacheFolder;


    this.options = {
      disable,
      maxConcurrency,
      imageminOptions: {
        plugins: []
      },
      testFunction: (0, _helpers.buildTestFunction)(test, minFileSize, maxFileSize),
      externalImages: (0, _extends3.default)({
        context: '.',
        sources: [],
        destination: '.'
      }, externalImages),
      cacheFolder

      // And finally, add any plugins that they pass in the options to the internal plugins array
    };(_options$imageminOpti = this.options.imageminOptions.plugins).push.apply(_options$imageminOpti, (0, _toConsumableArray3.default)(plugins));
  }

  (0, _createClass3.default)(ImageminPlugin, [{
    key: 'apply',
    value: function apply(compiler) {
      var _this = this;

      // Add the compiler options to my options
      this.options.compilerOptions = compiler.options;

      // If disabled, short-circuit here and just return
      if (this.options.disable === true) return null;

      // Access the assets once they have been assembled
      var onEmit = function () {
        var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(compilation, callback) {
          var throttle;
          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  // Create a throttle object which will limit the number of concurrent processes running
                  throttle = (0, _asyncThrottle2.default)(_this.options.maxConcurrency);
                  _context.prev = 1;
                  _context.next = 4;
                  return _promise2.default.all([].concat((0, _toConsumableArray3.default)(_this.optimizeWebpackImages(throttle, compilation)), (0, _toConsumableArray3.default)(_this.optimizeExternalImages(throttle))));

                case 4:

                  // At this point everything is done, so call the callback without anything in it
                  callback();
                  _context.next = 10;
                  break;

                case 7:
                  _context.prev = 7;
                  _context.t0 = _context['catch'](1);

                  // if at any point we hit a snag, pass the error on to webpack
                  callback(_context.t0);

                case 10:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this, [[1, 7]]);
        }));

        return function onEmit(_x2, _x3) {
          return _ref.apply(this, arguments);
        };
      }();

      // Check if the webpack 4 plugin API is available
      if (compiler.hooks) {
        // Register emit event listener for webpack 4
        compiler.hooks.emit.tapAsync(this.constructor.name, onEmit);
      } else {
        // Register emit event listener for older webpack versions
        compiler.plugin('emit', onEmit);
      }
    }

    /**
     * Optimize images from webpack and put them back in the asset array when done
     * @param  {Function} throttle       The setup throttle library
     * @param  {Object} compilation      The compilation from webpack-sources
     * @return {Promise[]}               An array of promises that resolve when each image is done being optimized
     */

  }, {
    key: 'optimizeWebpackImages',
    value: function optimizeWebpackImages(throttle, compilation) {
      var _this2 = this;

      var _options = this.options,
          testFunction = _options.testFunction,
          cacheFolder = _options.cacheFolder;

      // Return an array of promises that resolve when each file is done being optimized
      // pass everything through the throttle function to limit maximum concurrency

      return (0, _lodash2.default)(compilation.assets, function (asset, filename) {
        return throttle((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
          var assetSource, optimizedImageBuffer;
          return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  assetSource = asset.source();
                  // Skip the image if it's not a match for the regex or it's too big/small

                  if (!testFunction(filename, assetSource)) {
                    _context2.next = 6;
                    break;
                  }

                  _context2.next = 4;
                  return (0, _helpers.getFromCacheIfPossible)(cacheFolder, filename, function () {
                    return (0, _helpers.optimizeImage)(assetSource, _this2.options.imageminOptions);
                  });

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
      });
    }

    /**
     * Optimizes external images
     * @param  {Function} throttle The setup throttle library
     * @return {Promise[]}         An array of promises that resolve when each image is done being optimized
     */

  }, {
    key: 'optimizeExternalImages',
    value: function optimizeExternalImages(throttle) {
      var _this3 = this;

      var _options2 = this.options,
          compilerOptions = _options2.compilerOptions,
          _options2$externalIma = _options2.externalImages,
          context = _options2$externalIma.context,
          sources = _options2$externalIma.sources,
          destination = _options2$externalIma.destination,
          testFunction = _options2.testFunction,
          cacheFolder = _options2.cacheFolder;


      var fullContext = _path2.default.resolve(compilerOptions.context, context);

      var invokedDestination = _path2.default.resolve((0, _helpers.invokeIfFunction)(destination));

      return (0, _lodash2.default)((0, _helpers.invokeIfFunction)(sources), function (filename) {
        return throttle((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
          var relativeFilePath, fileData, writeFilePath, optimizedImageBuffer;
          return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  relativeFilePath = _path2.default.relative(fullContext, filename);
                  _context4.next = 3;
                  return (0, _helpers.readFile)(_path2.default.resolve(fullContext, relativeFilePath));

                case 3:
                  fileData = _context4.sent;

                  if (!testFunction(filename, fileData)) {
                    _context4.next = 10;
                    break;
                  }

                  writeFilePath = _path2.default.join(invokedDestination, relativeFilePath);

                  // Use the helper function to get the file from cache if possible, or
                  // run the optimize function and store it in the cache when done

                  _context4.next = 8;
                  return (0, _helpers.getFromCacheIfPossible)(cacheFolder, relativeFilePath, (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
                    return _regenerator2.default.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            return _context3.abrupt('return', (0, _helpers.optimizeImage)(fileData, _this3.options.imageminOptions));

                          case 1:
                          case 'end':
                            return _context3.stop();
                        }
                      }
                    }, _callee3, _this3);
                  })));

                case 8:
                  optimizedImageBuffer = _context4.sent;
                  return _context4.abrupt('return', (0, _helpers.writeFile)(writeFilePath, optimizedImageBuffer));

                case 10:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, _this3);
        })));
      });
    }
  }]);
  return ImageminPlugin;
}();

exports.default = ImageminPlugin;
//# sourceMappingURL=index.js.map