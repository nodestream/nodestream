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
const Domain = require('domain').Domain
const path = require('path')
const scope = Symbol('nodestream internal')


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
    options = {
      config: options.config || {},
      adapter: options.adapter
    }

    // Allow specifying adapters as strings and take care of requiring them
    if (typeof options.adapter === 'string') {
      const pkg = `nodestream-${options.adapter}`

      if (!isInstalled(pkg)) {
        throw new Error(`Cannot find adapter package ${pkg} - did you \`npm install\` it?`)
      }

      // eslint-disable-next-line global-require
      options.adapter = require(pkg)
    }

    // If the adapter has been provided explicitly, make sure it's a constructor function/class
    if (typeof options.adapter !== 'function') {
      throw new TypeError('You must provide a valid Nodestream adapter')
    }

    if (typeof options.adapter.identity !== 'string') {
      throw new ReferenceError(`Adapter ${options.adapter.name} does not declare its identity`)
    }

    this[scope] = {
      options,
      // Instantiate the adapter
      // eslint-disable-next-line new-cap
      adapter: new options.adapter(options.config),
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
   * @param     {Object?}           options             Options for the upload
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

    return new Promise((resolve, reject) => {
      const domain = new Domain()

      domain.enter()
      // file was created before we created our domain, so we must add it manually
      domain.add(file)

      // Normalise options
      options = options || {}

      const adapter = this[scope].adapter
      const location = path.posix.join(options.directory || '', options.name || uuid.v4())
      // Custom upload options for this adapter
      const adapterOpts = options[adapter.constructor.identity] || {}
      const destination = adapter.createWriteStream(location, adapterOpts)
      const result = {
        location,
        transforms: [],
        adapter: adapter.constructor.identity
      }
      const transforms = []

      // Apply upload transforms
      file = this[scope].transforms.upload.reduce(
        (upstream, transform) => {
          const transformer = new transform.Transformer(transform.options)
          const transformed = transformer.transform(upstream)

          transforms.push(transformer)
          result.transforms.push(transformer.constructor.identity)

          return transformed
        }, file)

      file.pipe(destination)

      destination.once('finish', () => {
        for (const transformer of transforms) {
          result[transformer.constructor.identity] = transformer.results()
        }

        return resolve(result)
      })

      domain.once('error', reject)
      domain.exit()
    })
  }

  /**
   * Download a file from the remote storage
   *
   * @param     {String}            location      The location of the file on the remote storage to
   *                                              download
   * @param     {stream.Writable}  destination    The destination stream into which to send the data
   * @param     {Object?}          options        Options for the download
   * @return    {Promise}
   */
  download(location, destination, options) {
    if (!location || typeof location !== 'string') {
      throw new TypeError(`Location must be string, got: ${location} (${typeof location})`)
    }

    if (!(destination instanceof stream) || typeof destination.write !== 'function') {
      throw new TypeError('Destination must be a writable stream')
    }

    return new Promise((resolve, reject) => {
      const domain = new Domain()

      domain.enter()
      // destination was created before we created our domain, so we must add it manually
      domain.add(destination)

      // Normalise options
      options = options || {}

      const adapter = this[scope].adapter
      // Custom download options for this adapter
      const adapterOpts = options[adapter.constructor.identity] || {}
      const result = {
        location,
        transforms: [],
        adapter: adapter.constructor.identity
      }
      const transforms = []
      // Apply download transforms and return the last returned stream
      const source = this[scope].transforms.download.reduce(
        (downstream, transform) => {
          const transformer = new transform.Transformer(transform.options)
          const transformed = transformer.transform(downstream)

          transforms.push(transformer)
          result.transforms.push(transformer.constructor.identity)

          return transformed
        }, adapter.createReadStream(location, adapterOpts))

      source.pipe(destination)

      destination.once('finish', () => {
        for (const transformer of transforms) {
          result[transformer.constructor.identity] = transformer.results()
        }

        return resolve(result)
      })

      domain.once('error', reject)
      domain.exit()
    })
  }

  /**
   * Remove a file from the remote storage
   *
   * @param     {String}      location      The location of the file on the remote storage to remove
   * @return    {Promise}
   */
  remove(location) {
    if (!location || typeof location !== 'string') {
      throw new TypeError(`Location must be string, got: ${location} (${typeof location})`)
    }

    return Promise.resolve(this[scope].adapter.remove(location))
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
      const pkg = `nodestream-transform-${transformer}`

      if (!isInstalled(pkg)) {
        throw new Error(`Cannot find transform package ${pkg} - did you \`npm install\` it?`)
      }

      // eslint-disable-next-line global-require
      transformer = require(pkg)
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
