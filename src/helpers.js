import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
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
 * Tests a filename to see if it matches any of the given test functions
 * This function is curried, pass in the first 3 params first, then the next 2
 * for each test needed
 * @param  {RegExp|RegExp[]|Function|Function[]|String|String[]} rawTestValue
 * @param  {Number} minFileSize
 * @param  {Number} maxFileSize
 * @return {Boolean}
 */
export function buildTestFunction (rawTestValue, minFileSize, maxFileSize) {
  const testFunctions = compileRegex(rawTestValue)
  /**
   * @param  {String}      filename
   * @param  {assetSource} assetSource
   * @return {Boolean}
   */
  return (filename, assetSource) => {
    for (let func of testFunctions) {
      if (func(filename) === true) {
        return assetSource.length > minFileSize && assetSource.length <= maxFileSize
      }
    }
    return false
  }
}

/**
 * hashes file contents to make sure I can uniquely store a file even with absolute paths
 * @param  {string} content  File contents
 * @return {string}          A hash of the full file contents
 */
export function hashContent (content) {
  return crypto.createHash('sha1').update(content).digest('hex')
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
 * @param  {String} content
 * @param  {Function} elseFunc
 * @return {Buffer}
 */
export async function getFromCacheIfPossible (cacheFolder, content, elseFunc) {
  let cacheFilePath
  if (cacheFolder !== null) {
    cacheFilePath = path.resolve(cacheFolder, hashContent(content))
    if (await exists(cacheFilePath)) {
      return readFile(cacheFilePath)
    }
  }

  const fileBuffer = await elseFunc()
  if (cacheFolder !== null) {
    await writeFile(cacheFilePath, fileBuffer)
  }
  return fileBuffer
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

/**
 * Compiles a regex, glob, function, or an array of any of them to an array of functions
 * @param  {RegExp|RegExp[]|Function|Function[]|String|String[]} rawTestValue
 * @return {Function[]}
 */
function compileRegex (rawTestValue) {
  const tests = Array.isArray(rawTestValue) ? rawTestValue : [rawTestValue]

  return tests.map((test) => {
    if (typeof test === 'function') {
      // if it's a function, just return this
      return test
    } else if (test instanceof RegExp) {
      // If it's a regex return it wrapped in a function
      return (filename) => test.test(filename)
    } else if (typeof test === 'string') {
      // If it's a string, let minimatch convert it to a regex then wrap that in a function
      const regex = makeRe(test)
      return (filename) => regex.test(filename)
    } else {
      throw new Error('test parameter must be a regex, glob string, function, or an array of any of them')
    }
  })
}

/**
 * Replaces file name templates for a given path. Inspired by webpack's output.filename config.
 * @param {String|Function} fileName
 * @param {String} filePath
 * @returns {String}
 */
export function templatedFilePath (fileName, filePath) {
  if (typeof fileName === 'function') {
    return fileName(filePath)
  }

  if (typeof fileName === 'string') {
    const originalFilePath = filePath

    return fileName
      .replace('[path]', originalFilePath.split(path.basename(originalFilePath))[0])
      .replace('[name]', path.basename(originalFilePath, path.extname(originalFilePath)))
      .replace('[ext]', path.extname(originalFilePath).split('.')[1])
  }

  throw new Error('fileName parameter must be a string or a function')
}
