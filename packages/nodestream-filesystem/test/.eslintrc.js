/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

module.exports = {

  env: {
    mocha: true
  },

  rules: {
    // Account for main describe() block, nested describe() block and one it() block
    'max-nested-callbacks': [1, 7],
    // No jsdocs needed for test-related functions
    'require-jsdoc': 0,
    'func-names': 0,
    'import/no-extraneous-dependencies': 0,
  }
}
