/**
 * Nodestream - Compress Transform
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

import zlib from 'zlib'

const scope = Symbol('nodestream internal')


/**
 * Compress transform for Nodestream
 */
export default class Compress {
  /**
   * This transform's identity
   *
   * Required by Nodestream - it will be used as key to export transformation results.
   *
   * @default   compress
   * @return    {String}
   */
  static get identity() {
    return 'compress'
  }

  /**
   * Create a new transform instance
   *
   * @param     {Object}    config              Options to be applied to this transformation
   * @param     {String?}   config.algorithm    Either `gzip` or `deflate`. Defaults to `gzip`.
   * @param     {Bool?}     config.raw          Whether or not to use the raw format for the
   *                                            compression. Raw format does not prepend the
   *                                            compressed data with an 8-byte header data used by
   *                                            zlib. Defaults to `false` (will include header).
   * @return    {Compress}
   */
  constructor(config) {
    // Normalise...
    config = config || {}
    config.algorithm = config.algorithm || 'gzip'
    config.raw = config.hasOwnProperty('raw')
      ? config.raw
      : false

    // Validate...
    if (['gzip', 'deflate'].indexOf(config.algorithm) === -1) {
      throw new Error(`Unknown algorithm: "${config.algorithm}", use 'gzip' or 'deflate'`)
    }

    this[scope] = { config }
  }

  /**
   * Take a stream and compress/decompress it
   *
   * @param     {stream.Readable}     file            The input stream to compress/decompress
   * @param     {Object}              options         Per-file transform options
   * @param     {String}              options.mode    Operation mode - either `compress` or
   *                                                  `decompress`. This affects whether the given
   *                                                  stream will be compressed or decompressed.
   * @return    {stream.Readable}
   */
  transform(file, options) {
    options = options || {}

    // Validate...
    if (['compress', 'decompress'].indexOf(options.mode) === -1) {
      throw new Error(`Unknown mode: "${options.mode}", use 'compress' or 'decompress'`)
    }

    const config = this[scope].config
    let algo

    // We need to get a string that reflects the name of the class which will do the right job:
    // Deflate, DeflateRaw, Gzip etc. They are all available on the zlib module.
    switch (config.algorithm) {
      case 'gzip':
        algo = options.mode === 'compress' ? 'Gzip' : 'Gunzip'
        break

      case 'deflate':
        algo = options.mode === 'compress' ? 'Deflate' : 'Inflate'
        algo += config.raw ? 'Raw' : ''
        break
      // algorithm is validated in the constructor, so there's no need to handle that here
      // no default
    }

    // Calls `new zlib.Gzip()` or similar
    const output = new zlib[algo]()

    return file.pipe(output)
  }

  /**
   * Return the compression/decompression results
   *
   * In general, there are no actual results which could be returned, so we instead return the
   * configuration which we used to process this stream.
   *
   * @return    {Object}    The object used to configure this transformation, as given to the
   *                        constructor
   */
  results() {
    return this[scope].config
  }
}
