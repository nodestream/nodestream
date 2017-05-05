/**
 * Nodestream - GCS
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const gcs = require('@google-cloud/storage')

const scope = Symbol('nodestream internal')


/**
 * Google Cloud Storage adapter for Nodestream
 */
class Gcs {

  static get identity() {
    return 'gcs'
  }


  /**
   * Create a new adapter instance
   *
   * @param     {Object}    config              Configuration options which are passed directly to
   *                                            GCS SDK library
   * @param     {String}    config.bucket       GCS bucket on which to operate. The bucket will be
   *                                            used for all operations you perform on this instance
   * @param     {String}    config.projectId    The project's Id
   * @param     {String?}   config.keyFilename  Path to a file with Gcloud credentials for
   *                                            authenticated requests (recommended)
   */
  constructor(config) {
    this[scope] = {
      client: gcs(config).bucket(config.bucket),
    }
  }

  /**
   * Create a write stream to send the data to
   *
   * @param     {String}            location            The file's location in the GCS bucket
   * @param     {Object}            options             Options for the upload, passed directly to
   *                                                    `createWriteStream()` on the `gcloud` client
   * @return    {stream}
   */
  createWriteStream(location, options) {
    const client = this[scope].client

    return client.file(location).createWriteStream(options)
  }

  /**
   * Create a read stream to read the data from
   *
   * @param     {String}            location      The file's location on GCS, relative to bucket
   * @param     {Object?}           options       Options for the download, passed directly to
   *                                              `createReadStream()` on the `gcloud` client
   * @return    {stream.Readable}
   */
  createReadStream(location, options) {
    const client = this[scope].client

    return client.file(location).createReadStream(options)
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

      client.file(location).delete(err =>
        err ? reject(err) : resolve(location)
      )
    })
  }
}

module.exports = Gcs
