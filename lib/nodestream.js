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
const stream = require('stream')


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

    if (! (file instanceof stream.Readable))
      throw new TypeError('Only readable streams can be uploaded')

    const adapter = this[scope].options.adapter
    const result = {}
    const transforms = []

    // Normalise options
    options = options || {}
    // If no name has been given, generate one
    options.name = options.name || uuid.v4()

    // Apply upload transforms
    file = this[scope].transforms.upload.reduce(
      (upstream, transform) => {
        const transformer = new transform.Transformer(transform.options)

        transforms.push(transformer)

        return transformer.transform(upstream)
      }, file)

    return adapter.upload(file, options)
    .then(location => {
      result.location = location

      for (const transformer of transforms)
        result[transformer.constructor.identity] = transformer.results()

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

    // Apply download transforms and return the last returned stream
    return this[scope].transforms.download.reduce(
      (downstream, transform) => {
        const transformer = new transform.Transformer(transform.options)

        return transformer.transform(downstream)
      }, adapter.download(location))
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
   * Register a transform
   *
   * @param     {String}   direction      Direction for which the transform should be applied.
   *                                      Allowed values are: `upload`, `download`
   * @param     {class}    transformer    A class/constructor function to be used for data
   *                                      transformations. A new instance of this class will be
   *                                      created for each file being uploaded/downloaded.
   * @param     {Object=}  options        An object which will be passed directly to the transformer
   *                                      constructor when an instance is created.
   * @return    {this}
   */
  addTransform(direction, transformer, options) {

    if (typeof transformer !== 'function')
      throw new TypeError('Transformer must be a class or constructor function')

    if (typeof transformer.identity !== 'string')
      throw new ReferenceError(`Transformer ${transformer.name} does not declare its identity`)

    if (['upload', 'download'].indexOf(direction) === -1)
      throw new Error(`Invalid direction: ${direction} - only 'upload' and 'download' are allowed`)

    options = options || {}

    this[scope].transforms[direction].push({ Transformer: transformer, options })

    return this
  }
}

module.exports = Nodestream
