# Imagemin plugin for Webpack

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

This is a simple plugin that uses [Imagemin](https://github.com/imagemin/imagemin) to compress all images in your project.

## Install

`npm install imagemin-webpack-plugin`

## Usage
```js
var ImageminPlugin = require('imagemin-webpack-plugin').default
// Or if using ES2015:
// import ImageminPlugin from 'imagemin-webpack-plugin'

module.exports = {
  plugins: [
    // Make sure that the plugin is after any plugins that add images
    // These are the default options:
    new ImageminPlugin({
      disable: false,
      optipng: {
        optimizationLevel: 3
      },
      gifsicle: {
        optimizationLevel: 1
      },
      jpegtran: {
        progressive: false
      },
      svgo: {
      },
      pngquant: null, // pngquant is not run unless you pass options here
      plugins: []
    })
  ]
}

```

## Options

Includes the following imagemin plugins:
* [optipng](https://github.com/imagemin/imagemin-optipng)
* [gifsicle](https://github.com/imagemin/imagemin-gifsicle)
* [jpegtran](https://github.com/imagemin/imagemin-jpegtran)
* [svgo](https://github.com/imagemin/imagemin-svgo)
* [pngquant](https://github.com/imagemin/imagemin-pngquant) - (only enabled if you pass in options for it)

#### `plugins`

Provide any additional plugins you want to have Imagemin run, and their options. Ex:
``` js
{
  pngquant: {
    quality: '95-100'
  },
  plugins: [
    imageminMozjpeg({
      quality: 100
    })
  ]
}
```

#### `disable`

Pass `disable: true` to disable this plugin, like during development. Defaults to `false`.


## FAQ

**Why?**  
I was suprised that there weren't any Imagemin plugins for webpack, so I made one!

**Why not use [`image-webpack-loader`](https://github.com/tcoopman/image-webpack-loader)?**  
Because I had other things like the [`favicons-webpack-plugin`](https://github.com/jantimon/favicons-webpack-plugin) and [`responsive-loader`](https://github.com/herrstucki/responsive-loader) that were generating images that I couldn't have `image-webpack-loader` optimize. This plugin will optimize ANY images regardless of how they were added to webpack. Plus `image-webpack-loader` is currently using an older version of imagemin.

**Can you add this new feature?**  
Maybe... I'm trying to keep this a small single-purpose plugin, but if you want a feature feel free to open an issue and I'll take a look.

## Inspiration

* Big thanks to [`image-webpack-loader`](https://github.com/tcoopman/image-webpack-loader) for the idea.
* Used [`compression-webpack-plugin`](https://github.com/webpack/compression-webpack-plugin) to learn how to write the plugin. It's source code is a better tutorial on how to write plugins than the webpack documentation is...

## Contributing

The code is written in ES6 using [Javascript Standard Style](https://github.com/feross/standard). Feel free to make PRs adding features you want, but please try to follow Standard. Also, codumentation/readme PRs are more then welcome!

## License

[MIT](LICENSE.md) Copyright (c) [Gregory Benner](https://github.com/Klathmon)
