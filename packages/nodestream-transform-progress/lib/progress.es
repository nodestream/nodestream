/**
 * Nodestream - Progress Transform
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

import Monitor from './monitor'

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

  constructor() {
    this[scope] = {
      stats: {
        // When the stream has been opened (right now 😀)
        openedAt: new Date(),
        // When the first byte has been received
        startedAt: null,
        // When the stream has been completely processed
        finishedAt: null,
        // For how long (in ms) has the upload been going on? This is updated with each `progress`
        duration: 0,
        // Total number of bytes - must be provided by the consumer
        total: null,
        // Number of bytes processed so far
        processed: 0,
        // Bytes still remaining - requires `total` to be available
        remaining: null,
        // Percentage of current progress - requires `total` to be available
        progress: null,
      },
    }
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
    // If no progress handler is given, use a noop handler
    const notify = typeof options.update === 'function'
      ? options.update
      : () => {}

    if (Number.isInteger(options.total) && options.total > 0) {
      this[scope].stats.total = options.total
      this[scope].stats.remaining = options.total
      this[scope].stats.progress = 0
    }

    const output = new Monitor()

    output.once('progress', () => {
      this[scope].stats.startedAt = new Date()
    })

    output.on('progress', chunksize => {
      const stats = this[scope].stats

      stats.processed += chunksize
      stats.duration = Math.abs(stats.startedAt.valueOf() - Date.now())

      // @NOTE: total always comes from userland, therefore we should not trust it to be accurate ⚡️
      if (stats.total) {
        // Ensure we do not go negative in case `total` is incorrect
        stats.remaining = Math.max(stats.remaining - chunksize, 0)

        const percent = (stats.processed / stats.total) * 100

        // Ensure we do not go over 100% in case `total` is incorrect
        stats.progress = Math.min(percent, 100)
      }

      notify(stats)
    })

    output.once('finish', () => {
      const stats = this[scope].stats

      stats.finishedAt = new Date()
      stats.duration = stats.finishedAt.valueOf() - stats.startedAt.valueOf()
      stats.remaining = 0
      // Normalise stats which depend on `total` - we can now accurately determine those 😎
      stats.total = stats.processed
      stats.progress = 100
    })

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
