'use strict'

module.exports = {

  extends: [
    '@strv/javascript/environments/nodejs/latest',
    '@strv/javascript/environments/nodejs/best-practices',
    '@strv/javascript/environments/nodejs/optional',
    '@strv/javascript/coding-styles/base'
  ],

  rules: {
    // Node.js 4 does not support spread
    'prefer-spread': 0,

    // If your editor cannot find and show these to you, occasionally turn this off and run the
    // linter
    'no-warning-comments': 0,

    // Some deviations from the defined coding style
    'padded-blocks': 0,
    curly: [1, 'multi'],
    'newline-per-chained-call': 0,
    'space-unary-ops': 0
  }
}
