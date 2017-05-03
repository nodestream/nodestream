/**
 * Nodestream - Checksum Transform
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const crypto = require('crypto')
const stream = require('stream')

const scope = Symbol('nodestream internal')


/**
 * Checksum calculator for Nodestream
 */
class Checksum {

  /**
   * This transform's identity
   *
   * Required by Nodestream - it will be used as key to export transformation results.
   *
   * @return    {String}
   */
  static get identity() {
    return 'checksum'
  }

  /**
   * Create a new transform instance
   *
   * @param     {Object}    options             Options to be applied to this transformation
   * @param     {String}    options.algorithm   Hash algorithm to be used when generating the hash.
   *                                            Any value returned by `crypto.getHashes()` can be
   *                                            used.
   * @param     {Boolean}   options.buffer      If set to true, the hash value will be returned as
   *                                            raw buffer (instead of a hex string)
   * @return    {Checksum}
   */
  constructor(options) {
    // Normalise...
    options = options || {}
    options.algorithm = options.algorithm || 'md5'

    this[scope] = { options }
  }

  /**
   * Take a stream and start calculating the bytes' checksum
   *
   * @param     {stream.Readable}    file    The input stream to calculate checksum from
   * @return    {stream.Readable}
   */
  transform(file) {
    const hasher = crypto.createHash(this[scope].options.algorithm)
    const output = new stream.PassThrough()

    this[scope].hasher = hasher

    file.pipe(hasher)
    file.pipe(output)

    return output
  }

  /**
   * Generate the hash digest
   *
   * @return    {Object}    The resulting object will contain two properties:
   * - `algorithm`: The algorithm used to calculate the hash
   * - `value`: The actual hash, either as buffer or hex string
   */
  results() {
    return {
      algorithm: this[scope].options.algorithm,
      value: this[scope].options.buffer
        ? this[scope].hasher.read()
        : this[scope].hasher.read().toString('hex'),
    }
  }
}

module.exports = Checksum
