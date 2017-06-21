/**
 * Nodestream - Progress Transform
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */


import stream from 'stream'

/**
 * Progress monitor
 */
export default class Monitor extends stream.Transform {
  _transform(data, encoding, done) {
    this.emit('progress', data.length)

    return done(null, data)
  }
}
