/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const uuid = require('uuid')
const stream = require('stream')
const path = require('path')
const scope = Symbol('scope')


/**
 * The Nodestream class. Responsible for streaming your bytes up and down, relentlessly.
 */
class Nodestream {

  /**
   * Create a new instance
   *
   * Generally, you only need to create new instance for a specific storage destination.
   *
   * @param     {Object}        options             Options to use for this destination
   * @param     {Class|String}  options.adapter     Storage adapter to use for this destination.
   *                                                If string is given, `nodestream-{adapter}` will
   *                                                be `require`d.
   * @param     {Object}        options.config      Storage adapter-specific configuration
   * @return    {Nodestream}
   */
  constructor(options) {
    // Normalise...
    options = options || {}
    options.config = options.config || {}

    // Allow specifying adapters as strings and take care of requiring them
    if (typeof options.adapter === 'string') {
      if (!isInstalled(`nodestream-${options.adapter}`)) {
        throw new Error(`Cannot find ${options.adapter} adapter - did you \`npm install\` it?`)
      }

      // eslint-disable-next-line global-require
      options.adapter = require(`nodestream-${options.adapter}`)
    }

    // If the adapter has been provided explicitly, make sure it's a constructor function/class
    if (typeof options.adapter !== 'function') {
      throw new TypeError('You must provide a valid Nodestream adapter')
    }

    // Instantiate the adapter
    // eslint-disable-next-line new-cap
    options.adapter = new options.adapter(options.config)

    this[scope] = {
      options,
      transforms: {
        upload: [],
        download: []
      }
    }
  }

  /**
   * Upload a file to the remote storage
   *
   * @param     {stream.Readable}   file                A readable stream representing the file to
   *                                                    be uploaded
   * @param     {Object}            options             Options for the adapter
   * @param     {String?}           options.directory   Directory to which the file should be
   *                                                    uploaded
   * @param     {String?}           options.name        Filename to upload the file to. If you do
   *                                                    not provide a name, a random UUIDv4 string
   *                                                    will be generated for you.
   * @return    {Promise}
   */
  upload(file, options) {
    if (!(file instanceof stream.Readable)) {
      throw new TypeError('Only readable streams can be uploaded')
    }

    // Normalise options
    options = options || {}

    const adapter = this[scope].options.adapter
    const location = path.posix.join(options.directory || '', options.name || uuid.v4())
    const destination = adapter.createWriteStream(location)
    const result = { location }
    const transforms = []

    // Apply upload transforms
    file = this[scope].transforms.upload.reduce(
      (upstream, transform) => {
        const transformer = new transform.Transformer(transform.options)
        const transformed = transformer.transform(upstream)

        transforms.push(transformer)
        // Forward any and all errors up to the final destination stream
        upstream.on('error', err => transformed.emit('error', err))

        return transformed
      }, file)

    return new Promise((resolve, reject) => {
      destination.once('finish', resolve)
      destination.once('error', reject)
      file.once('error', reject)

      file.pipe(destination)
    })
    .then(() => {
      for (const transformer of transforms) {
        result[transformer.constructor.identity] = transformer.results()
      }

      return result
    })
  }

  /**
   * Download a file from the remote storage
   *
   * @param     {String}            location      The location of the file on the remote storage to
   *                                              download
   * @param     {stream.Writable}  destination    The destination stream into which to send the data
   * @return    {Promise}
   */
  download(location, destination) {
    const adapter = this[scope].options.adapter
    // Apply download transforms and return the last returned stream
    const source = this[scope].transforms.download.reduce(
      (downstream, transform) => {
        const transformer = new transform.Transformer(transform.options)
        const transformed = transformer.transform(downstream)

        // Forward any and all errors down to the final destination stream
        downstream.on('error', err => transformed.emit('error', err))

        return transformed
      }, adapter.createReadStream(location))

    return new Promise((resolve, reject) => {
      destination.once('finish', resolve)
      destination.once('error', reject)
      source.once('error', reject)

      source.pipe(destination)
    })
  }

  /**
   * Remove a file from the remote storage
   *
   * @param     {String}      location      The location of the file on the remote storage to remove
   * @return    {Promise}
   */
  remove(location) {
    const adapter = this[scope].options.adapter

    return Promise.resolve(adapter.remove(location))
  }

  /**
   * Register a transform
   *
   * @param     {String}        direction     Direction for which the transform should be applied.
   *                                          Allowed values are: `upload`, `download`
   * @param     {Class|String}  transformer   A class/constructor function to be used for data
   *                                          transformations. A new instance of this class will be
   *                                          created for each file being uploaded/downloaded. If a
   *                                          string is given, `nodestream-transform-{transformer}`
   *                                          will be `require`d.
   * @param     {Object=}       options       An object which will be passed directly to the
   *                                          transformer constructor when an instance is created.
   * @return    {this}
   */
  addTransform(direction, transformer, options) {
    // Allow specifying transformers as strings and take care of requiring them
    if (typeof transformer === 'string') {
      if (!isInstalled(`nodestream-transform-${transformer}`)) {
        throw new Error(`Cannot find ${transformer} transform - did you \`npm install\` it?`)
      }

      // eslint-disable-next-line global-require
      transformer = require(`nodestream-transform-${transformer}`)
    }

    if (typeof transformer !== 'function') {
      throw new TypeError('Transformer must be a class or constructor function')
    }

    if (typeof transformer.identity !== 'string') {
      throw new ReferenceError(`Transformer ${transformer.name} does not declare its identity`)
    }

    if (['upload', 'download'].indexOf(direction) === -1) {
      throw new Error(`Invalid direction: ${direction} - only 'upload' and 'download' are allowed`)
    }

    options = options || {}

    this[scope].transforms[direction].push({ Transformer: transformer, options })

    return this
  }
}

module.exports = Nodestream


/**
 * Check if a module is installed
 *
 * @param     {String}    moduleName    The module name to check
 * @return    {Boolean}
 */
function isInstalled(moduleName) {
  try {
    // eslint-disable-next-line global-require
    require.resolve(moduleName)

    return true
  } catch (err) {
    return false
  }
}
