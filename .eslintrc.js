'use strict'

module.exports = {

  extends: [
    'javascript/environments/nodejs/latest',
    'javascript/environments/nodejs/best-practices',
    'javascript/environments/nodejs/optional',
    'javascript/coding-styles/base'
  ],

  rules: {
    // If your editor cannot find and show these to you, occasionally turn this off and run the
    // linter
    'no-warning-comments': 0,

    // Some deviations from the defined coding style
    'padded-blocks': 0,

    curly: [1, 'multi'],

    'newline-per-chained-call': 0
  }
}
