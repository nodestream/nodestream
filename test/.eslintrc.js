'use strict'

module.exports = {

  env: {
    mocha: true
  },

  rules: {
    // Account for main describe() block, nested describe() block and one it() block
    'max-nested-callbacks': [1, 7],

    // Mocha provides its own context (this) for the tests so let's not prevent that
    'prefer-arrow-callback': 0,

    // No jsdocs needed for test-related functions
    'require-jsdoc': 0,

    'func-names': 0
  }
}
