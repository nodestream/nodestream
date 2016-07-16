/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const Pipeline = require('./pipeline')
const isInstalled = require('./util/is-installed')
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
      transforms: new Map()
    }
  }

  /**
   * Create a new pipeline from this Nodestream instance
   *
   * @return    {Pipeline}
   */
  pipeline() {
    return new Pipeline({
      adapter: this[scope].adapter,
      transforms: this[scope].transforms
    })
  }

  /**
   * Upload a file to the remote storage
   *
   * This is a convenience method to be used in situations where you do not need a pipeline and just
   * want a file to be uploaded to the remote storage.
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
    return this.pipeline().upload(file, options)
  }

  /**
   * Download a file from the remote storage
   *
   * This is a convenience method to be used in situations where you do not need a pipeline and just
   * want a file to be downloaded from the remote storage.
   *
   * @param     {String}            location      The location of the file on the remote storage to
   *                                              download
   * @param     {stream.Writable}  destination    The destination stream into which to send the data
   * @param     {Object?}          options        Options for the download
   * @return    {Promise}
   */
  download(location, destination, options) {
    return this.pipeline().download(location, destination, options)
  }

  /**
   * Remove a file from the remote storage
   *
   * This is a convenience method to be used in situations where you do not need a pipeline and just
   * want a file to be removed from the remote storage.
   *
   * @param     {String}      location      The location of the file on the remote storage to remove
   * @return    {Promise}
   */
  remove(location) {
    return this.pipeline().remove(location)
  }

  /**
   * Register a transform
   *
   * You must use this method to register a transform before you can [`.use()`]{@link Pipeline#use}
   * it in a pipeline.
   *
   * @param     {Class|String}  transformer   A class/constructor function to be used for data
   *                                          transformations. A new instance of this class will be
   *                                          created for each file being uploaded/downloaded. If a
   *                                          string is given, `nodestream-transform-{transformer}`
   *                                          will be `require`d.
   * @return    {this}
   */
  registerTransform(transformer) {
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

    this[scope].transforms.set(transformer.identity, transformer)

    return this
  }
}

module.exports = Nodestream
