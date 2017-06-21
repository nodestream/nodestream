/**
 * Nodestream - Filesystem
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

import fs from 'fs'
import stream from 'stream'
import path from 'path'
import mkdirp from 'mkdirp'

const scope = Symbol('nodestream internal')


/**
 * Filesystem adapter for Nodestream
 */
export default class Filesystem {
  static get identity() {
    return 'filesystem'
  }


  /**
   * Create a new adapter instance
   *
   * @param     {Object}    config            Configuration options
   * @param     {String}    config.root       Filesystem root directory where data should be read
   *                                          from/written to. Defaults to *.storage* folder
   *                                          relative to either the main module (`require.main`) or
   *                                          the current working directory, respectively.
   */
  constructor(config) {
    // Normalise...
    config = config || {}

    this[scope] = { config }

    // Some defaults
    if (!config.root) {
      config.root = require.main
        ? path.join(path.dirname(require.main.filename), '.storage')
        : path.join(process.cwd(), '.storage')
    }

    // Allows for specifying root as [__dirname, '.storage'] etc.
    if (config.root instanceof Array) {
      config.root = path.join(...config.root)
    }

    config.root = path.normalize(config.root)

    if (!path.isAbsolute(config.root)) {
      throw new Error(`Storage root must be absolute, received: ${config.root}`)
    }
  }

  /**
   * Create a write stream to send the data to
   *
   * @param     {String}            location            The file's location in the storage root
   * @param     {Object}            options             Options for the upload passed directly to
   *                                                    `fs.createWriteStream()`
   * @return    {stream}                                Returns a writable stream to which the
   *                                                    caller should pipe the data
   */
  createWriteStream(location, options) {
    // Location is always with forward slashes - normalise with respect to current OS
    location = path.normalize(location)

    const root = this[scope].config.root
    const destination = new stream.PassThrough()
    const absolutePath = path.join(root, location)

    // First, we must ensure the path to the file really exists, otherwise fs will refuse to
    // perform the write
    mkdirp.mkdirp(path.dirname(absolutePath), 0o755, err => {
      if (err) {
        return destination.emit('error', err)
      }

      const file = fs
        .createWriteStream(absolutePath, options)
        .once('error', fileErr => destination.emit('error', fileErr))

      return destination.pipe(file)
    })

    return destination
  }

  /**
   * Create a read stream to read the data from
   *
   * @param     {String}            location      The file's location on the filesystem, relative
   *                                              to root
   * @param     {Object?}           options       Options for the upload passed directly to
   *                                              `fs.createReadStream()`
   * @return    {stream.Readable}
   */
  createReadStream(location, options) {
    // Location is always with forward slashes - normalise with respect to current OS
    location = path.normalize(location)

    const root = this[scope].config.root
    const absolutePath = path.join(root, location)

    return fs.createReadStream(absolutePath, options)
  }

  /**
   * Remove a file from storage
   *
   * @param     {String}    location    The file's location on the filesystem to be removed,
   *                                    relative to root
   * @return    {Promise}               Resolves with the relative location once the file is removed
   */
  remove(location) {
    return new Promise((resolve, reject) => {
      // Location is always with forward slashes - normalise with respect to current OS
      location = path.normalize(location)

      const root = this[scope].config.root
      const absolutePath = path.join(root, location)

      return fs.unlink(absolutePath, err => err ? reject(err) : resolve(location)
      )
    })
  }
}
