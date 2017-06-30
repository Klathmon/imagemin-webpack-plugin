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

    // Pull out the regex test
    const testRegexes = this.options.testRegexes
    const externalImages = this.options.externalImages

    // Access the assets once they have been assembled
    compiler.plugin('emit', async (compilation, callback) => {
      const throttle = createThrottle(this.options.maxConcurrency)

      try {
        await Promise.all(map(compilation.assets, (asset, filename) => throttle(async () => {
          // Skip the image if it's not a match for the regex
          if (testFile(filename, testRegexes)) {
            compilation.assets[filename] = await optimizeImage(asset, this.options.imageminOptions)
          }
        })))

        // Additionally optimize user specified file list
        if ('sources' in externalImages && Array.isArray(externalImages.sources)) {
          await Promise.all(map(externalImages.sources, (filename) => throttle(async () => {
            const buffer = await readFile(filename)
            const optimizedAssetContents = await imagemin.buffer(buffer, this.options.imageminOptions)

            // if a destination was provided use it otherwise overwrite in place
            if (externalImages.destination && typeof externalImages.destination === 'string') {
              filename = path.normalize(`${externalImages.destination}/${path.basename(filename)}`)
            }
            await writeFile(filename, optimizedAssetContents)
          })))
        }

        // At this point everything is done, so call the callback without anything in it
        callback()
      } catch (err) {
        callback(err)
      }
    })
  }
}

/**
 * Optimizes a single image asset, returning the orignal if the "optimized" version is larger
 * @param  {Object}  asset
 * @param  {Object}  imageminOptions
 * @return {Promise(asset)}
 */
async function optimizeImage (asset, imageminOptions) {
  // Grab the orig source and size
  const assetSource = asset.source()
  const assetOrigSize = asset.size()

  // Ensure that the contents i have are in the form of a buffer
  const assetContents = (Buffer.isBuffer(assetSource) ? assetSource : new Buffer(assetSource, 'utf8'))

  // Await for imagemin to do the compression
  const optimizedAssetContents = await imagemin.buffer(assetContents, imageminOptions)

  // If the optimization actually produced a smaller file, then return the optimized version
  if (optimizedAssetContents.length < assetOrigSize) {
    return new RawSource(optimizedAssetContents)
  } else {
    // otherwize return the orignal
    return asset
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
    fs.exists(directory, (exists) => {
      resolve(exists)
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
