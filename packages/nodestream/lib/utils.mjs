/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

/**
 * Check if a module is installed
 *
 * @private
 * @param     {String}    moduleName    The module name to check
 * @return    {Boolean}
 */
function isInstalled(moduleName) {
  try {
    require.resolve(moduleName)

    return true
  } catch (err) {
    return false
  }
}

export {
  isInstalled,
}
