import fs from 'fs'
import path from 'path'
import { cpus } from 'os'
import map from 'lodash.map'
import imagemin from 'imagemin'
import { makeRe } from 'minimatch'
import imageminSvgo from 'imagemin-svgo'
import createThrottle from 'async-throttle'
import imageminOptipng from 'imagemin-optipng'
import imageminPngquant from 'imagemin-pngquant'
import imageminGifsicle from 'imagemin-gifsicle'
import imageminJpegtran from 'imagemin-jpegtran'
import RawSource from 'webpack-sources/lib/RawSource'

export default class ImageminPlugin {
  constructor (options = {}) {
    // I love ES2015!
    const {
      disable = false,
      test = /.*/,
      minFileSize = 0,
      maxFileSize = Infinity,
      maxConcurrency = cpus().length,
      plugins = [],
      optipng = {
        optimizationLevel: 3
      },
      gifsicle = {
        optimizationLevel: 1
      },
      jpegtran = {
        progressive: false
      },
      svgo = {},
      pngquant = null,
      externalImages = {
        sources: [],
        destination: null
      }
    } = options

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
    }

    // As long as the options aren't `null` then include the plugin. Let the destructuring above
    // control whether the plugin is included by default or not.
    for (let [plugin, pluginOptions] of [
      [imageminOptipng, optipng],
      [imageminGifsicle, gifsicle],
      [imageminJpegtran, jpegtran],
      [imageminSvgo, svgo],
      [imageminPngquant, pngquant]
    ]) {
      if (pluginOptions !== null) {
        this.options.imageminOptions.plugins.push(plugin(pluginOptions))
      }
    }

    // And finally, add any plugins that they pass in the options to the internal plugins array
    this.options.imageminOptions.plugins.push(...plugins)
  }

  apply (compiler) {
    // If disabled, short-circuit here and just return
    if (this.options.disable === true) return null

    // Pull out options needed here
    const { testRegexes, minFileSize, maxFileSize } = this.options
    let { sources, destination } = this.options.externalImages

    // Access the assets once they have been assembled
    compiler.plugin('emit', async (compilation, callback) => {
      const throttle = createThrottle(this.options.maxConcurrency)
      if (typeof sources === 'function') {
        sources = await sources()
      }
      if (typeof destination === 'function') {
        destination = await destination()
      }

      try {
        await Promise.all([
          optimizeWebpackImages(throttle, compilation, testRegexes, minFileSize, maxFileSize, this.options.imageminOptions),
          optimizeExternalImages(throttle, sources, destination, minFileSize, maxFileSize, this.options.imageminOptions)
        ])
        // At this point everything is done, so call the callback without anything in it
        callback()
      } catch (err) {
        callback(err)
      }
    })
  }
}

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
async function optimizeWebpackImages (throttle, compilation, testRegexes, minFileSize, maxFileSize, imageminOptions) {
  return Promise.all(map(compilation.assets, (asset, filename) => throttle(async () => {
    const assetSource = asset.source()
    // Skip the image if it's not a match for the regex
    if (testFile(filename, testRegexes) && testFileSize(assetSource, minFileSize, maxFileSize)) {
      // Optimize the asset's source
      const optimizedImageBuffer = await optimizeImage(assetSource, imageminOptions)
      // Then write the optimized version back to the asset object as a "raw source"
      compilation.assets[filename] = new RawSource(optimizedImageBuffer)
    }
  })))
}

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
async function optimizeExternalImages (throttle, sources, destination, minFileSize, maxFileSize, imageminOptions) {
  return Promise.all(map(sources, (filename) => throttle(async () => {
    const fileData = await readFile(filename)
    if (testFileSize(fileData, minFileSize, maxFileSize)) {
      // Read in the file and optimize it
      const optimizedImageBuffer = await optimizeImage(await readFile(filename), imageminOptions)

      // Then if the destination is provided use it, otherwise overwrite the image in place
      if (typeof destination !== 'string') {
        destination = '.'
      }
      const writeFilePath = path.normalize(`${destination}/${filename}`)

      return writeFile(writeFilePath, optimizedImageBuffer)
    }
  })))
}

/**
 * Optimizes a single image, returning the orignal if the "optimized" version is larger
 * @param  {Object}  imageData
 * @param  {Object}  imageminOptions
 * @return {Promise(asset)}
 */
async function optimizeImage (imageData, imageminOptions) {
  // Ensure that the contents i have are in the form of a buffer
  const imageBuffer = (Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData, 'utf8'))
  // And get the original size for comparison later to make sure it actually got smaller
  const originalSize = imageBuffer.length

  // Await for imagemin to do the compression
  const optimizedImageBuffer = await imagemin.buffer(imageBuffer, imageminOptions)

  // If the optimization actually produced a smaller file, then return the optimized version
  if (optimizedImageBuffer.length < originalSize) {
    return optimizedImageBuffer
  } else {
    // otherwize return the orignal
    return imageBuffer
  }
}

/**
 * Tests a filename to see if it matches any of the given test globs/regexes
 * @param  {String} filename
 * @param  {Array} regexes
 * @return {Boolean}
 */
function testFile (filename, regexes) {
  for (let regex of regexes) {
    if (regex.test(filename)) {
      return true
    }
  }
  return false
}

function testFileSize (assetSource, minFileSize, maxFileSize) {
  return assetSource.length > minFileSize && assetSource.length <= maxFileSize
}

/**
 * Compiles a regex, glob, or an array of globs to a single regex for testing later
 * @param  {RegExp|String|String[]} rawTestValue
 * @return {RegExp}
 */
function compileTestOption (rawTestValue) {
  const tests = Array.isArray(rawTestValue) ? rawTestValue : [rawTestValue]

  return tests.map((test) => {
    if (test instanceof RegExp) {
      // If it's a regex, just return it
      return test
    } else if (typeof test === 'string') {
      // If it's a string, let minimatch convert it to a regex
      return makeRe(test)
    } else {
      throw new Error('test parameter must be a regex, glob string, or an array of regexes or glob strings')
    }
  })
}

/**
 * async wrapper for fs readFile.
 * @param {any} filename
 * @returns * @return {Promise(buffer)}
 */
async function readFile (filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, '', (error, result) => {
      if (error) {
        return reject(error)
      }
      resolve(result)
    })
  })
}

/**
 * async wrapper for exists
 * @param {any} directory
 * @returns
 */
async function exists (directory) {
  return new Promise((resolve, reject) => {
    fs.access(directory, fs.constants.R_OK | fs.constants.W_OK, (err) => {
      if (err) resolve(false)

      resolve(true)
    })
  })
}

/**
 * async wrapper for writeFile
 * @param {any} filename
 * @param {any} buffer
 * @returns
 */
async function writeFile (filename, buffer) {
  return new Promise((resolve, reject) => {
    const doWrite = () => {
      fs.writeFile(filename, buffer, (error) => {
        if (error) {
          return reject(error)
        }
        resolve()
      })
    }
    const directory = path.dirname(filename)
    exists(directory).then((exists) => {
      if (!exists) {
        fs.mkdir(directory, doWrite)
      } else {
        doWrite()
      }
    })
  })
}
