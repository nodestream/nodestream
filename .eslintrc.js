/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

module.exports = {

  extends: [
    '@strv/javascript/environments/nodejs/v5',
    '@strv/javascript/environments/nodejs/best-practices',
    '@strv/javascript/environments/nodejs/optional',
    '@strv/javascript/coding-styles/base'
  ],

  rules: {
    // Node.js 4 does not support spread
    'prefer-spread': 0,
    // Node.js 4 does not support Reflect
    'prefer-reflect': 0,
    // If your editor cannot show these to you, occasionally turn this off and run the linter
    'no-warning-comments': 0
  }
}
