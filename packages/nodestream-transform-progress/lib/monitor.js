/**
 * Nodestream - Progress Transform
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const stream = require('stream')

/**
 * Progress monitor
 */
class Monitor extends stream.Transform {

  _transform(data, encoding, done) {
    this.emit('progress', data.length)

    return done(null, data)
  }
}

module.exports = Monitor
