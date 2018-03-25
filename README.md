# Imagemin plugin for Webpack

[![npm](https://img.shields.io/npm/v/imagemin-webpack-plugin.svg)](https://www.npmjs.com/package/imagemin-webpack-plugin)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm](https://img.shields.io/npm/dt/imagemin-webpack-plugin.svg)](https://www.npmjs.com/package/imagemin-webpack-plugin)

This is a simple plugin that uses [Imagemin](https://github.com/imagemin/imagemin) to compress all images in your project.

## Install

`npm install imagemin-webpack-plugin`

Requires node >=4.0.0

## Example Usage

```js
var ImageminPlugin = require('imagemin-webpack-plugin').default
// Or if using ES2015:
// import ImageminPlugin from 'imagemin-webpack-plugin'

module.exports = {
  plugins: [
    // Make sure that the plugin is after any plugins that add images
    new ImageminPlugin({
      disable: process.env.NODE_ENV !== 'production', // Disable during development
      pngquant: {
        quality: '95-100'
      }
    })
  ]
}
```

Working with [copy-webpack-plugin](https://github.com/kevlened/copy-webpack-plugin):

```js
module.exports = {
  plugins: [
    // Copy the images folder and optimize all the images
    new CopyWebpackPlugin([{
      from: 'images/'
    }]),
    new ImageminPlugin({ test: /\.(jpe?g|png|gif|svg)$/i })
  ]
}
```

## API

### new ImageminPlugin(options)

#### options.disable

**type**: `Boolean`
**default**: `false`

When set to `true` it will disable the plugin entirely. This is useful for disabling the plugin during development, and only enabling it during production

#### options.test

**type**: `RegExp` or `String` or `Array`
**default**: `/.*/`

This plugin will only run on files that match this test. This is similar to the webpack loader `test` option (but is not using the same implementation, so there might be major differences!). This can either be a RegExp object, a [minimatch glob](https://github.com/isaacs/minimatch), a function which gets the filename and returns `true` if the file should be minified, or an array of any of them.

This can allow you to only run the plugin on specific files, or even include the plugin multiple times for different sets of images and apply different imagemin settings to each.

This will overwrite everything, including the `externalImages` option!

Example:

```js
import ImageminPlugin from 'imagemin-webpack-plugin'

module.exports = {
  plugins: [
    // Use the default settings for everything in /images/*
    new ImageminPlugin({ test: 'images/**' }),
    // bump up the optimization level for all the files in my `bigpngs` directory
    new ImageminPlugin({
      test: 'bigpngs/**',
      optipng: {
        optimizationLevel: 9
      }
    })
  ]
}
```

Note the order of the plugins matters. `CopyWebpackPlugin` must be before `ImageminWebpackPlugin` in the `plugins` array.

#### options.maxConcurrency

**type**: `Number`
**default**: the number of logical CPUS on the system

Sets the maximum number of instances of Imagemin that can run at once. Set to `Infinity` to run a seperate process per image all at the same time.

#### options.optipng

**type**: `Object` or `null`
**default**: `{ optimizationLevel: 3 }`

Passes the given object to [`imagemin-optipng`](https://github.com/imagemin/imagemin-optipng). Set to `null` to disable optipng.

#### options.gifsicle

**type**: `Object` or `null`
**default**: `{ optimizationLevel: 1 }`

Passes the given object to [`imagemin-gifsicle`](https://github.com/imagemin/imagemin-gifsicle). Set to `null` to disable gifsicle.

#### options.jpegtran

**type**: `Object` or `null`
**default**: `{ progressive: false }`

Passes the given object to [`imagemin-jpegtran`](https://github.com/imagemin/imagemin-jpegtran). Set to `null` to disable jpegtran.

#### options.svgo

**type**: `Object` or `null`
**default**: `{}`

Passes the given object to [`imagemin-svgo`](https://github.com/imagemin/imagemin-svgo). Set to `null` to disable svgo.

#### options.pngquant

**type**: `Object` or `null`
**default**: `null`

Passes the given object to [`imagemin-pngquant`](https://github.com/imagemin/imagemin-pngquant). Disabled by default.

#### options.plugins

**type**: `Array`
**default**: `[]`

Include any additional plugins that you want to work with imagemin here. By default the above are included, but if you want (or need to) you can disable them (by setting them to `null`) and include them yourself here.

A list of possible imagemin plugins can be found [here](https://www.npmjs.com/search?q=imagemin%20plugin).

Example:

```js
import ImageminPlugin from 'imagemin-webpack-plugin'
import imageminMozjpeg from 'imagemin-mozjpeg'

module.exports = {
  plugins: [
    new ImageminPlugin({
      plugins: [
        imageminMozjpeg({
          quality: 100,
          progressive: true
        })
      ]
    })
  ]
}
```

#### options.externalImages

**type**: `Object`
**default**: `{ context: '.', sources: [], destination: null }`

Include any external images (those not included in webpack's compilation assets) that you want to be parsed by imagemin.
If a destination value is not supplied the files are optimized in place. You can optionally set either of these to a function which will be invoked at the last possible second before optimization to grab files that might not exist at the time of writing the config (see #37 for more info).

The paths will work based on the webpack's (and this plugin's) `context` option, so in the following example, the files will be read from `./src/images/**/*.png` and will be written to `.src/public/images/**/*.png` Context only applies to the `sources` array.

Example:

```js
import ImageminPlugin from 'imagemin-webpack-plugin'
import glob from 'glob'

module.exports = {
  plugins: [
    new ImageminPlugin({
      externalImages: {
        context: 'src', // Important! This tells the plugin where to "base" the paths at
        sources: glob.sync('src/images/**/*.png'),
        destination: 'src/public/images'
      }
    })
  ]
}
```

#### options.minFileSize

**type**: `Integer`
**default**: `0`

Only apply to images that are **larger** than this value *in bytes*.

#### options.maxFileSize

**type**: `Integer`
**default**: `Infinity`

Only apply to images that are **smaller than or equal-to** this value *in bytes*.

This and `minFileSize` together can be used to include WebpackImageminPlugin multiple times with multiple configs on different file sizes.

Example:

```js
import ImageminPlugin from 'imagemin-webpack-plugin'
import glob from 'glob'

module.exports = {
  plugins: [
    new ImageminPlugin({
      maxFileSize: 10000, // Only apply this one to files equal to or under 10kb
      jpegtran: { progressive: false }
    }),
    new ImageminPlugin({
      minFileSize: 10000, // Only apply this one to files over 10kb
      jpegtran: { progressive: true }
    })
  ]
}
```

#### options.cacheFolder

**type**: `String`
**default**: `''`

Cache already minified images into a `cacheFolder`. On next run plugin will
check for the cached images first. If cached image exists it will simply use that one.
Otherwise image will be optimised and written to the `cacheFolder` for later builds.

**Note**: This is a very simple cache implementation, it WILL NOT intelligently clear the
cache if you update the options in this plugin. There also might be significantly more files in the cache than you have images, this is normal, and a side-effect of how I'm deferring to `imagemin` to determine if a file is an image or not. It can be prevented by setting a good `test` regex.

Example:

```js
import resolve from 'path'
import ImageminPlugin from 'imagemin-webpack-plugin'

module.exports = {
  plugins: [
    new ImageminPlugin({
      cacheFolder: resolve('./cache'), // use existing folder called cache in the current dir
    })
  ]
}
```

### Troubleshooting

If you get an error similar to `Error in parsing SVG: Unquoted attribute value` while using SVGO, you most likely have un-quoted attributes in the SVG image. A workaround can be found [here](https://github.com/Klathmon/imagemin-webpack-plugin/issues/25) from @vzaidman. They also made an issue upstream which should fix it at the source [here](https://github.com/svg/svgo/issues/678).

## FAQ

**Why?**
I was suprised that there weren't any Imagemin plugins for webpack, so I made one!

**Why not use [`image-webpack-loader`](https://github.com/tcoopman/image-webpack-loader)?**
Because I had other things like the [`favicons-webpack-plugin`](https://github.com/jantimon/favicons-webpack-plugin) and [`responsive-loader`](https://github.com/herrstucki/responsive-loader) that were generating images that I couldn't have `image-webpack-loader` optimize. This plugin will optimize ANY images regardless of how they were added to webpack. Plus `image-webpack-loader` is currently using an older version of imagemin.

**Can you add this new feature?**
Maybe... I'm trying to keep this a small single-purpose plugin, but if you want a feature feel free to open an issue and I'll take a look.

## Inspiration

*   Big thanks to [`image-webpack-loader`](https://github.com/tcoopman/image-webpack-loader) for the idea.
*   Used [`compression-webpack-plugin`](https://github.com/webpack/compression-webpack-plugin) to learn how to write the plugin. It's source code is a better tutorial on how to write plugins than the webpack documentation is...

## Contributing

[See the CONTRIBUTING file here](CONTRIBUTING.md)

## License

[MIT](LICENSE.md) Copyright (c) [Gregory Benner](https://github.com/Klathmon)
