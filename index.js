import RawSource from 'webpack-sources/lib/RawSource'
import imagemin from 'imagemin'
import imageminPngquant from 'imagemin-pngquant'
import imageminOptipng from 'imagemin-optipng'
import imageminGifsicle from 'imagemin-gifsicle'
import imageminJpegtran from 'imagemin-jpegtran'
import imageminSvgo from 'imagemin-svgo'

function ImageminPlugin (options = {}) {
  // I love ES2015!
  const {
    disable = false,
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
    plugins = []
  } = options

  this.options = {
    disable,
    imageminOptions: {
      plugins: []
    }
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

ImageminPlugin.prototype.apply = function (compiler) {
  // If disabled, short-circuit here and just return
  if (this.options.disable === true) return null

  // Access the assets once they have been assembled
  compiler.plugin('emit', async (compilation, callback) => {
    try {
      // Map over all assets here async and await for all of them to complete before moving on
      // TODO: Might want to look into throttling this if it overwhelms some systems...
      await Promise.all(compilation.assets.map(async (asset, filename) => {
        // Grab the orig source and size
        const assetSource = asset.source()
        const assetOrigSize = asset.size()
        // Ensure that the contents i have are in the form of a buffer
        const assetContents = ensureBuffer(assetSource)

        // Await for imagemin to do the compression
        const optimizedAssetContents = await imagemin.buffer(assetContents, this.options.imageminOptions)

        // If the optimization actually produced a smaller file, then overwrite the existing asset
        // with the optimized version
        if (optimizedAssetContents.length < assetOrigSize) {
          compilation.assets[filename] = new RawSource(optimizedAssetContents)
        }
      }))

      // At this point everything is done, so call the callback without anything in it
      callback()
    } catch (err) {
      callback(err)
    }
  })
}

export default ImageminPlugin

function ensureBuffer (maybeBuffer) {
  if (Buffer.isBuffer(maybeBuffer)) {
    return maybeBuffer
  } else {
    return new Buffer(maybeBuffer, 'utf8')
  }
}
