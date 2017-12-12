import fs from 'fs'
// import path from 'path'
import path from 'path'
import { makeRe } from 'minimatch'
import imagemin from 'imagemin'
import mkdirp from 'mkdirp'
import promisify from 'util.promisify'

export const readFile = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)
const mkdirpAsync = promisify(mkdirp)

/**
 * Optimizes a single image, returning the orignal if the "optimized" version is larger
 * @param  {Object}  imageData
 * @param  {Object}  imageminOptions
 * @return {Promise(asset)}
 */
export async function optimizeImage (imageData, imageminOptions) {
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
 * Compiles a regex, glob, or an array of globs to an array of RegExp
 * @param  {RegExp|RegExp[]|String|String[]} rawTestValue
 * @return {RegExp[]}
 */
export function compileRegex (rawTestValue) {
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
 * Tests a filename to see if it matches any of the given test globs/regexes
 * @param  {String} filename
 * @param  {Array} regexes
 * @return {Boolean}
 */
export function testFile (filename, regexes) {
  for (let regex of regexes) {
    if (regex.test(filename)) {
      return true
    }
  }
  return false
}

/**
 * Tests if a file is within the given sizes
 * @param  {assetSource} assetSource
 * @param  {Number} minFileSize
 * @param  {Number} maxFileSize
 * @return {Boolean}
 */
export function testFileSize (assetSource, minFileSize, maxFileSize) {
  return assetSource.length > minFileSize && assetSource.length <= maxFileSize
}

/**
 * Invokes the passed in argument if it's a function
 * @param  {Function|Any}  func
 * @return {Any}
 */
export function invokeIfFunction (func) {
  if (typeof func === 'function') {
    return func()
  } else {
    return func
  }
}

/**
 * Gets the buffer of the file from cache. If it doesn't exist or the cache is
 * not enabled, it will invoke elseFunc and use it's result as the result of the
 * function, saving the result in the cache
 * @param  {String} cacheFolder
 * @param  {String} filename
 * @param  {Function} elseFunc
 * @return {Buffer}
 */
export async function getFromCacheIfPossible (cacheFolder, filename, elseFunc) {
  let cacheFilePath
  if (cacheFolder !== null) {
    cacheFilePath = path.resolve(cacheFolder, filename)
    if (await exists(cacheFilePath)) {
      return readFile(cacheFilePath)
    }
  } else {
    const fileBuffer = await elseFunc()
    if (cacheFolder !== null) {
      await writeFile(cacheFilePath, fileBuffer)
    }
    return fileBuffer
  }
}

/**
 * checks if a file/directory is accessable
 * @param {any} directory
 * @returns
 */
export async function exists (directory) {
  return new Promise((resolve, reject) => {
    fs.access(directory, fs.constants.R_OK | fs.constants.W_OK, (err) => {
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

/**
 * async wrapper for writeFile that will create the directory if it does not already exist
 * @param {String} filename
 * @param {Buffer} buffer
 * @returns
 */
export async function writeFile (filename, buffer) {
  const directory = path.dirname(filename)
  // if the directory doesn't exist, create it
  if (!(await exists(directory))) {
    await mkdirpAsync(directory)
  }

  return writeFileAsync(filename, buffer)
}
