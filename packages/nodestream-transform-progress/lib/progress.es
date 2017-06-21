/**
 * Nodestream - Progress Transform
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

import Monitor from './monitor'
import Stats from './stats'

const scope = Symbol('nodestream internal')


/**
 * Progress monitor for Nodestream
 */
export default class Progress {
  /**
   * This transform's identity
   *
   * Required by Nodestream - it will be used as key to export transformation results.
   *
   * @return    {String}
   */
  static get identity() {
    return 'progress'
  }

  [scope] = {
    stats: null,
    // Default update handler in case the caller does not provide their own
    update: () => {},
  }

  /**
   * Take a stream and start monitoring its progress
   *
   * @param     {stream.Readable}   file              The input stream to monitor
   * @param     {Object}            options           Options for the progress transform
   * @param     {Number?}           options.total     Expected total size (in bytes) of the stream
   * @param     {Function?}         options.update    The function to call with progress stats
   * @return    {stream.Readable}
   */
  transform(file, options) {
    this[scope].stats = new Stats(options, options.update)
    const output = new Monitor()

    output.once('progress', () => void this[scope].stats.markStarted())
    output.on('progress', chunksize => void this[scope].stats.markProgress(chunksize))
    output.once('finish', () => void this[scope].stats.markFinished())

    file.pipe(output)

    return output
  }

  /**
   * Report the final progress data
   *
   * @return    {Object}    The final stats data
   */
  results() {
    return {
      stats: this[scope].stats,
    }
  }
}
