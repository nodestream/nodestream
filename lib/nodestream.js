/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const uuid = require('uuid')
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
   * @param     {Object}    options             Options to use for this destination
   * @param     {Function}  options.adapter     Storage adapter to use for this destination
   * @param     {Object}    options.config      Storage adapter-specific configuration
   * @return    {Nodestream}
   */
  constructor(options) {

    // Normalise...
    options = options || {}
    options.config = options.config || {}

    if (typeof options.adapter !== 'function')
      throw new TypeError('You must provide a valid Nodestream adapter')

    // Instantiate the adapter
    options.adapter = new options.adapter(options.config)   // eslint-disable-line new-cap

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

    const adapter = this[scope].options.adapter
    const result = {}
    const transforms = []

    // Normalise options
    options = options || {}
    // If no name has been given, generate one
    options.name = options.name || uuid.v4()

    // Apply upload transforms
    file = this[scope].transforms.upload.reduce(
      (upstream, Transformer) => {
        const transformer = new Transformer()

        transforms.push(transformer)

        return transformer.transform(upstream)
      }, file)

    return adapter.upload(file, options)
    .then(destination => {
      result.destination = destination

      for (const transformer of transforms) {
        const ctor = transformer.constructor
        const namespace = ctor.namespace

        if (! namespace)
          throw new ReferenceError(`Transformer ${ctor.name} does not declare namespace`)

        result[namespace] = transformer.results()
      }

      return result
    })
  }

  /**
   * Download a file from the remote storage
   *
   * @param     {String}            location      The location of the file on the remote storage to
   *                                              download
   * @return    {stream.Readable}
   */
  download(location) {

    const adapter = this[scope].options.adapter
    const file = adapter.download(location)

    // Apply download transforms and return the last returned stream
    return this[scope].transforms.upload.reduce(
      (downstream, Transformer) => {
        const transformer = new Transformer()

        return transformer.transform(downstream)
      }, file)
  }

  /**
   * Remove a file from the remote storage
   *
   * @param     {String}      location      The location of the file on the remote storage to remove
   * @return    {Promise}
   */
  remove(location) {

    const adapter = this[scope].options.adapter

    return adapter.remove(location)
  }

  /**
   * Register an upload transform
   *
   * @param     {class}    transformer    A class/constructor function to be used for data
   *                                      transformations during uploads. A new instance of this
   *                                      class will be created for each file being uploaded.
   * @return    {this}
   */
  onUpload(transformer) {

    if (typeof transformer !== 'function')
      throw new TypeError('Handler must be a class or constructor function')

    this[scope].transforms.upload.push(transformer)

    return this
  }

  /**
   * Register a download transform
   *
   * @param     {class}    transformer    A class/constructor function to be used for data
   *                                      transformations during downloads. A new instance of this
   *                                      class will be created for each file being downloaded.
   * @return    {this}
   */
  onDownload(transformer) {

    if (typeof transformer !== 'function')
      throw new TypeError('Handler must be a class or constructor function')

    this[scope].transforms.download.push(transformer)

    return this
  }
}

module.exports = Nodestream
