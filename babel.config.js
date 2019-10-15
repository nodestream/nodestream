'use strict'

module.exports = {
  compact: false,
  comments: false,
  sourceMaps: 'both',
  plugins: [
    '@babel/syntax-object-rest-spread',
    ['@babel/transform-modules-commonjs', {
      allowTopLevelThis: false,
      noInterop: true,
    }],
    '@babel/plugin-syntax-class-properties',
  ],
  ignore: [
    '**/node_modules',
  ],
}
