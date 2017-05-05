/**
 * Nodestream - S3
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const AWS = require('aws-sdk')
const stream = require('stream')
const merge = require('semantic-merge')

const scope = Symbol('nodestream internal')


/**
 * AWS S3 adapter for Nodestream
 */
class S3 {

  static get identity() {
    return 's3'
  }


  /**
   * Create a new adapter instance
   *
   * @param     {Object}    config            Configuration options which are passed directly to AWS
   *                                          SDK library
   * @param     {String}    config.bucket     S3 bucket on which to operate. The bucket will be
   *                                          used for all operations you perform on this instance.
   */
  constructor(config) {
    // Normalise...
    config = config || {}

    this[scope] = {
      bucket: config.bucket,
      client: new AWS.S3(config),
    }
  }

  /**
   * Create a write stream to send the data to
   *
   * @param     {String}            location            The file's location in the S3 bucket
   * @param     {Object}            options             Options for the upload
   * @param     {Object?}           options.params      Optional parameters to be passed along to S3
   *                                                    as the first argument of .upload() method
   * @param     {Object?}           options.options     Optional options to be passed along to S3 as
   *                                                    the second argument of .upload() method
   * @return    {stream}                                Returns a writable stream to which the
   *                                                    caller should pipe the data
   */
  createWriteStream(location, options) {
    options = options || {}

    const client = this[scope].client
    const bucket = this[scope].bucket
    const destination = new stream.PassThrough()
    const s3options = options.options || {}
    const params = merge({
      Key: location,
      Bucket: bucket,
      Body: destination,
    })
    .and(options.params || {})
    .into({})

    client.upload(params, s3options, err => {
      if (err) {
        destination.emit('error', err)
      }
    })

    return destination
  }

  /**
   * Create a read stream to read the data from
   *
   * @param     {String}            location      The file's location on S3, relative to bucket
   * @param     {Object?}           options       Optional options for the download. These will be
   *                                              passed to the S3's .getObject() method.
   * @return    {stream.Readable}
   */
  createReadStream(location, options) {
    const client = this[scope].client
    const bucket = this[scope].bucket
    const params = merge({
      Key: location,
      Bucket: bucket,
    })
    .and(options || {})
    .into({})
    const request = client.getObject(params)
    const source = request.createReadStream()

    // The request object may emit error events, but since we must return a stream, we should
    // somehow forward these errors to the caller
    request.on('error', err => source.emit('error', err))

    return source
  }

  /**
   * Remove a file from storage
   *
   * @param     {String}    location    The file's location on S3 to be removed, relative to bucket
   * @return    {Promise}               Resolves with the relative location once the file is removed
   */
  remove(location) {
    return new Promise((resolve, reject) => {
      const client = this[scope].client
      const bucket = this[scope].bucket
      const params = {
        Key: location,
        Bucket: bucket,
      }

      client.deleteObject(params, err =>
        err ? reject(err) : resolve(location)
      )
    })
  }
}

module.exports = S3
