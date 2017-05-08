/**
 * Nodestream - GridFS
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

import stream from 'stream'
import mongodb from 'mongodb'

const scope = Symbol('nodestream internal')


/**
 * GridFS adapter for Nodestream
 */
export default class GridFS {

  static get identity() {
    return 'gridfs'
  }


  /**
   * Create a new adapter instance
   *
   * @param     {Object}    config              Configuration options
   * @param     {Object}    config.db           The MongoDB database instance, as returned by the
   *                                            `MongoClient.connect()` call
   * @param     {String}    config.uri          Mongo URI resource to connect to. If no `db`
   *                                            instance is provided, this will be used to connect
   *                                            to MongoDB and create one.
   * @param     {Object=}   config.connectOpts  Connection options to pass along to
   *                                            `MongoClient.connect()` call
   * @param     {String}    config.bucket       The bucket's name to connect to/create
   * @param     {Number}    config.chunkSize    The bucket's default chunk size to be used
   */
  constructor(config) {
    // Normalise...
    config = config || {}
    config.bucket = config.bucket || 'fs'
    config.chunkSize = config.chunkSize || 255 * 1024

    if (typeof config.db !== 'object' && typeof config.uri !== 'string') {
      throw new Error('No mongo `db` instance given and no URI provided')
    }

    this[scope] = {
      config,
      adapter: config.db
        ? new mongodb.GridFSBucket(config.db, {
          chunkSizeBytes: config.chunkSize,
          bucketName: config.bucket,
        })
        : null,
      getAdapter: done => getAdapter(this[scope], done),
    }
  }

  /**
   * Create a write stream to send the data to
   *
   * @param     {String}            location            The file's location in the storage bucket
   * @param     {Object}            options             Options for the upload passed directly to
   *                                                    `GridFSBucket.openUploadStream()`
   * @return    {stream}                                Returns a writable stream to which the
   *                                                    caller should pipe the data
   */
  createWriteStream(location, options) {
    const source = new stream.PassThrough()

    this[scope].getAdapter((err, adapter) => {
      if (err) {
        return source.emit('error', err)
      }

      const upstream = adapter.openUploadStream(location, options)

      return source.pipe(upstream)
    })

    return source
  }

  /**
   * Create a read stream to read the data from
   *
   * @param     {String}            location      The file's name on the gridfs bucket
   * @param     {Object?}           options       Options for the upload passed directly to
   *                                              `GridFSBucket.openDownloadStream()`
   * @return    {stream.Readable}
   */
  createReadStream(location, options) {
    const destination = new stream.PassThrough()

    this[scope].getAdapter((err, adapter) => {
      if (err) {
        return destination.emit('error', err)
      }

      const upstream = adapter.openDownloadStreamByName(location, options)

      return upstream.pipe(destination)
    })

    return destination
  }

  /**
   * Remove a file from storage
   *
   * @param     {String}    location    The file's location on the gridfs to be removed
   * @return    {Promise}
   */
  remove(location) {
    return new Promise((resolve, reject) => {
      this[scope].getAdapter((err, adapter) => {
        if (err) {
          return reject(err)
        }

        return adapter
          .find({ filename: location })
          .toArray((findErr, files) => findErr ? reject(findErr) : resolve(files))
      })
    })
    .then(files => {
      const tasks = []

      for (const file of files) {
        // eslint-disable-next-line no-underscore-dangle
        tasks.push(this[scope].adapter.delete(file._id))
      }

      return Promise.all(tasks)
    })
  }
}


/**
 *  Get or create GridFSBucket adapter based on current context
 *
 *  @private
 *  @param     {Object}       ctx     Current context, normally stored at `adapter[scope]`
 *  @param     {Function}     done    Standard callback which receives the adapter
 *  @return    {void}
 */
function getAdapter(ctx, done) {
  if (ctx.adapter) {
    return setImmediate(done, null, ctx.adapter)
  }

  // We do not have an adapter instance ready, so let's connect and create one!
  return mongodb.connect(ctx.config.uri, ctx.config.connectOpts, (err, db) => {
    if (err) {
      return done(err)
    }

    ctx.adapter = new mongodb.GridFSBucket(db, {
      chunkSizeBytes: ctx.config.chunkSize,
      bucketName: ctx.config.bucket,
    })

    return done(null, ctx.adapter)
  })
}
