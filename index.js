import map from 'lodash.map'
import RawSource from 'webpack-sources/lib/RawSource'
import imagemin from 'imagemin'
import imageminPngquant from 'imagemin-pngquant'
import imageminOptipng from 'imagemin-optipng'
import imageminGifsicle from 'imagemin-gifsicle'
import imageminJpegtran from 'imagemin-jpegtran'
import imageminSvgo from 'imagemin-svgo'
import { cpus } from 'os'
import createThrottle from 'async-throttle'
import { makeRe } from 'minimatch'

export default class ImageminPlugin {
  constructor (options = {}) {
    // I love ES2015!
    const {
      disable = false,
      test = /.*/,
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
      maxConcurrency = cpus().length,
      plugins = []
    } = options

    this.options = {
      disable,
      maxConcurrency,
      imageminOptions: {
        plugins: []
      },
      testRegex: compileTestOption(test)
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
    const testRegex = this.options.testRegex

    // Access the assets once they have been assembled
    compiler.plugin('emit', async (compilation, callback) => {
      const throttle = createThrottle(this.options.maxConcurrency)

      try {
        await Promise.all(map(compilation.assets, (asset, filename) => throttle(async () => {
          // Skip the image if it's not a match for the regex
          if (testRegex.test(filename)) {
            compilation.assets[filename] = await optimizeImage(asset, this.options.imageminOptions)
          }
        })))

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
 * Compiles a regex, glob, or an array of globs to a single regex for testing later
 * @param  {RegExp|String|String[]} rawTestValue
 * @return {RegExp}
 */
function compileTestOption (rawTestValue) {
  const errorMessage = 'test parameter must be a regex, glob string, or an array of glob strings'
  if (rawTestValue instanceof RegExp) {
    // If it's a regex, just return it
    return rawTestValue
  } else if (typeof rawTestValue === 'string') {
    // if it's a string, let minimatch convert it to a regex
    return makeRe(rawTestValue)
  } else if (Array.isArray(rawTestValue)) {
    try {
      // if it's an array of strings, then compile them all to a single regex and return that
      return new RegExp(rawTestValue.map((test) => makeRe(test).source).join('|'))
    } catch (err) {
      throw new Error(errorMessage + ` "${err}"`)
    }
  }

  // If we get here then something is wrong with what was passed into `test`, so throw since we can't deal with it
  throw new Error(errorMessage)
}
