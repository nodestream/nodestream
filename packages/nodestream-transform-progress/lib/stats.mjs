/**
 * Nodestream - Progress Transform
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2017 Robert Rossmann
 * @license     BSD-3-Clause
 */

const scope = Symbol('stats internal')

/**
 * Data structure representing the progress statistics
 */
export default class Stats {
  /**
   * Private scope
   * @private
   * @type    {Object}
   */
  [scope] = {
    update: () => {},
  }

  /**
   * When the stream has been opened (right now 😀)
   * @type    {Date}
   */
  openedAt = new Date()

  /**
   * When the first byte has been received
   * @type    {Date}
   */
  startedAt = null

  /**
   * When the stream has been completely processed
   * @type    {Date}
   */
  finishedAt = null

  /**
   * For how long (in ms) has the upload been going on? This is updated with each `progress`
   * @type    {Number}
   */
  duration = 0

  /**
   * Total number of bytes - must be provided by the consumer
   * @type    {Number}
   */
  total = null

  /**
   * Number of bytes processed so far
   * @type    {Number}
   */
  processed = 0

  /**
   * Bytes still remaining - requires `total` to be available
   * @type    {Number}
   */
  remaining = null

  /**
   * Percentage of current progress - requires `total` to be available
   * @type    {Number}
   */
  progress = null


  constructor(options = {}, update = () => {}) {
    if (typeof update === 'function') {
      this[scope].update = update
    }

    if (Number.isInteger(options.total) && options.total > 0) {
      this.total = options.total
      this.remaining = options.total
      this.progress = 0
    }
  }

  markStarted() {
    // Only mark the stats as started once
    if (this.startedAt !== null) {
      return
    }

    this.startedAt = new Date()
  }

  markProgress(chunksize) {
    this.processed += chunksize
    this.duration = Date.now() - this.startedAt.valueOf()

    // @NOTE: total always comes from userland, therefore we should not trust it to be accurate ⚡️
    if (this.total) {
      // Ensure we do not go negative in case `total` is incorrect
      this.remaining = Math.max(this.remaining - chunksize, 0)
      // Ensure we do not go over 100% in case `total` is incorrect
      this.progress = Math.min((this.processed / this.total) * 100, 100)
    }

    this[scope].update(this)
  }

  markFinished() {
    this.finishedAt = new Date()
    this.duration = this.finishedAt.valueOf() - this.startedAt.valueOf()
    this.remaining = 0
    // Normalise stats which depend on `total` - we can now accurately determine those 😎
    this.total = this.processed
    this.progress = 100

    this[scope].update(this)
  }
}
