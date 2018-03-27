import path from 'path'
import { cpus } from 'os'
import map from 'lodash.map'
import imageminSvgo from 'imagemin-svgo'
import createThrottle from 'async-throttle'
import imageminOptipng from 'imagemin-optipng'
import imageminPngquant from 'imagemin-pngquant'
import imageminGifsicle from 'imagemin-gifsicle'
import imageminJpegtran from 'imagemin-jpegtran'
import RawSource from 'webpack-sources/lib/RawSource'

import {
  buildTestFunction,
  invokeIfFunction,
  getFromCacheIfPossible,
  readFile,
  writeFile,
  optimizeImage
} from './helpers.js'

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
      externalImages = {},
      cacheFolder = null
    } = options

    this.options = {
      disable,
      maxConcurrency,
      imageminOptions: {
        plugins: []
      },
      testFunction: buildTestFunction(test, minFileSize, maxFileSize),
      externalImages: {
        context: '.',
        sources: [],
        destination: '.',
        ...externalImages
      },
      cacheFolder
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
    // Add the compiler options to my options
    this.options.compilerOptions = compiler.options

    // If disabled, short-circuit here and just return
    if (this.options.disable === true) return null

    // Access the assets once they have been assembled
    const onEmit = async (compilation, callback) => {
      // Create a throttle object which will limit the number of concurrent processes running
      const throttle = createThrottle(this.options.maxConcurrency)

      try {
        // Optimise all images at the same time (throttled to maxConcurrency)
        // and await until all of them to complete
        await Promise.all([
          ...this.optimizeWebpackImages(throttle, compilation),
          ...this.optimizeExternalImages(throttle)
        ])

        // At this point everything is done, so call the callback without anything in it
        callback()
      } catch (err) {
        // if at any point we hit a snag, pass the error on to webpack
        callback(err)
      }
    }

    // Check if the webpack 4 plugin API is available
    if (compiler.hooks) {
      // Register emit event listener for webpack 4
      compiler.hooks.emit.tapAsync(this.constructor.name, onEmit)
    } else {
      // Register emit event listener for older webpack versions
      compiler.plugin('emit', onEmit)
    }
  }

  /**
   * Optimize images from webpack and put them back in the asset array when done
   * @param  {Function} throttle       The setup throttle library
   * @param  {Object} compilation      The compilation from webpack-sources
   * @return {Promise[]}               An array of promises that resolve when each image is done being optimized
   */
  optimizeWebpackImages (throttle, compilation) {
    const {
      testFunction,
      cacheFolder
    } = this.options

    // Return an array of promises that resolve when each file is done being optimized
    // pass everything through the throttle function to limit maximum concurrency
    return map(compilation.assets, (asset, filename) => throttle(async () => {
      const assetSource = asset.source()
      // Skip the image if it's not a match for the regex or it's too big/small
      if (testFunction(filename, assetSource)) {
        // Use the helper function to get the file from cache if possible, or
        // run the optimize function and store it in the cache when done
        let optimizedImageBuffer = await getFromCacheIfPossible(cacheFolder, assetSource, () => {
          return optimizeImage(assetSource, this.options.imageminOptions)
        })

        // Then write the optimized version back to the asset object as a "raw source"
        compilation.assets[filename] = new RawSource(optimizedImageBuffer)
      }
    }))
  }

  /**
   * Optimizes external images
   * @param  {Function} throttle The setup throttle library
   * @return {Promise[]}         An array of promises that resolve when each image is done being optimized
   */
  optimizeExternalImages (throttle) {
    const {
      compilerOptions,
      externalImages: {
        context,
        sources,
        destination
      },
      testFunction,
      cacheFolder
    } = this.options

    const fullContext = path.resolve(compilerOptions.context, context)

    const invokedDestination = path.resolve(invokeIfFunction(destination))

    return map(invokeIfFunction(sources), (filename) => throttle(async () => {
      const relativeFilePath = path.relative(fullContext, filename)
      const fileData = await readFile(path.resolve(fullContext, relativeFilePath))
      if (testFunction(filename, fileData)) {
        const writeFilePath = path.join(invokedDestination, relativeFilePath)

        // Use the helper function to get the file from cache if possible, or
        // run the optimize function and store it in the cache when done
        let optimizedImageBuffer = await getFromCacheIfPossible(cacheFolder, fileData, async () => {
          return optimizeImage(fileData, this.options.imageminOptions)
        })

        // Write the file to the destination when done
        return writeFile(writeFilePath, optimizedImageBuffer)
      }
    }))
  }
}
