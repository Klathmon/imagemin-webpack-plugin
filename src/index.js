import RawSource from 'webpack-sources/lib/RawSource'
import map from 'lodash/map'
import imagemin from 'imagemin'
import imageminPngquant from 'imagemin-pngquant'
import imageminOptipng from 'imagemin-optipng'
import imageminGifsicle from 'imagemin-gifsicle'
import imageminJpegtran from 'imagemin-jpegtran'
import imageminSvgo from 'imagemin-svgo'

function ImageminPlugin (options) {
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
      // Enable these by default, just pass what they give me as the options (or nothing)
      plugins: [
        imageminOptipng(optipng),
        imageminGifsicle(gifsicle),
        imageminJpegtran(jpegtran),
        imageminSvgo(svgo)
      ]
    }
  }

  // Only enable these if they pass in options for it...
  if (pngquant !== null) this.options.imageminOptions.plugins.push(imageminPngquant(pngquant))

  // And finally, add any plugins that they pass in the options to the internal plugins array
  this.options.imageminOptions.plugins.push(...plugins)
}

ImageminPlugin.prototype.apply = function (compiler) {
  // If disabled, short-circuit here and just return
  if (this.options.disable === true) return null

  // "this-compilation" seems to be the secret plugin event that i need to grab to only get
  // everything once... I'm honestly not sure why it works, but i saw it at the below link.
  // https://github.com/webpack/compression-webpack-plugin/blob/ee8e701e47b2f488da32b135abe88a47972487de/index.js#L55
  compiler.plugin('this-compilation', (compilation) => {
    compilation.plugin('optimize-assets', (assets, callback) => {
      // Map over all assets here async and wait for all of them to complete before moving
      // Might want to look into throttling this if it overwhelms some systems...
      Promise.all(map(assets, (asset, filename) => {
        // Grab the orig source and size
        const assetSource = asset.source()
        const assetOrigSize = asset.size()
        // Ensure that the contents i have are in the form of a buffer
        const assetContents = (Buffer.isBuffer(assetSource) ? assetSource : new Buffer(assetSource, 'utf8'))
        // push it into imagemin with the options setup up top
        return imagemin.buffer(assetContents, this.options.imageminOptions)
          .then((optimizedAssetContents) => {
            // If we are bigger (or equal) after "optimization", don't touch the file...
            if (optimizedAssetContents.length >= assetOrigSize) return Promise.resolve()

            // Also not entirely sure how it works, but i got it from the below link as well as
            // looking at other webpack plugins' source code.
            // https://github.com/webpack/compression-webpack-plugin/blob/ee8e701e47b2f488da32b135abe88a47972487de/index.js#L82
            assets[filename] = new RawSource(optimizedAssetContents)
          })
      }))
      // And once everything is done, go ahead and call the callback.
      .then(() => callback())
    })
  })
}

export default ImageminPlugin
