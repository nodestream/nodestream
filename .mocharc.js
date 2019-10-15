'use strict'

module.exports = {
  // Options for mocha-reporter-remote
  // Other reporters will ignore these options.
  reporterOption: [
    'nostats=1',
  ],
  colors: true,
  checkLeaks: true,
  require: [
    'source-map-support/register',
    'test/init',
  ],
  exclude: [
    'node_modules/**',
    '**/node_modules/**',
  ],
}
