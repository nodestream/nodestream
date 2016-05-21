/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

/**
 * Check if a module is installed
 *
 * @private
 * @param     {String}    moduleName    The module name to check
 * @return    {Boolean}
 */
module.exports = function isInstalled(moduleName) {
  try {
    // eslint-disable-next-line global-require
    require.resolve(moduleName)

    return true
  } catch (err) {
    return false
  }
}
