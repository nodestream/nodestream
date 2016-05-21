/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const path = require('path')
const stream = require('stream')
const Domain = require('domain').Domain
const uuid = require('uuid')
const scope = Symbol('nodestream internal')

class Pipeline {

  constructor(options) {
    options = options || {}

    if (!options.adapter) {
      throw new Error('Pipeline requires a configured adapter to operate with')
    }

    this[scope] = {
      adapter: options.adapter,
      transforms: options.transforms || new Map(),
      middleware: []
    }
  }

  use(transform, options) {
    const transformer = this[scope].transforms.get(transform)

    if (!transformer) {
      throw new ReferenceError(`Transform ${transform} is not registered`)
    }

    this[scope].middleware.push({ Transformer: transformer, options })

    return this
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
      file = this[scope].middleware.reduce(
        (upstream, transform) => {
          const transformer = new transform.Transformer(transform.options)
          // @TODO: Allow per-file options to be specified for the transform
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
      const source = this[scope].middleware.reduce(
        (downstream, transform) => {
          const transformer = new transform.Transformer(transform.options)
          // @TODO: Allow per-file options to be specified for the transform
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
}

module.exports = Pipeline
