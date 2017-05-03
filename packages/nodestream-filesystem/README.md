[npm-badge]: https://badge.fury.io/js/nodestream-filesystem.svg
[npm-url]: https://npmjs.org/package/nodestream-filesystem
[travis-badge]: https://travis-ci.org/nodestream/nodestream-filesystem.svg
[travis-url]: https://travis-ci.org/nodestream/nodestream-filesystem
[coveralls-badge]: https://img.shields.io/coveralls/nodestream/nodestream-filesystem.svg
[coveralls-url]: https://coveralls.io/r/nodestream/nodestream-filesystem
[inch-badge]: http://inch-ci.org/github/nodestream/nodestream-filesystem.svg
[inch-url]: http://inch-ci.org/github/nodestream/nodestream-filesystem
[make-badge]: https://img.shields.io/badge/built%20with-GNU%20Make-brightgreen.svg
[apidocs-url]: https://nodestream.github.io/nodestream-filesystem
[nodestream-url]: https://github.com/nodestream/nodestream
[fs-icon]: https://cloud.githubusercontent.com/assets/3058150/13901081/d81b824c-ee17-11e5-8fbe-40eff40646f7.png

# ![Filesystem][fs-icon] nodestream-filesystem

[![NPM Version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Documentation Status][inch-badge]][inch-url]
![Built with GNU Make][make-badge]

> Local filesystem adapter for [Nodestream][nodestream-url]

**Identity:** `filesystem`

[**API docs**][apidocs-url]

## Description

This adapter provides interface for Nodestream to transfer bytes between your app and the local filesystem storage on which the app runs.

## Usage

### Installation

`npm install --save nodestream-filesystem`

### Configuration

This adapter has only one confuguration option - `root` - a path to a folder where Nodestream should expect to find/write your files to. If you do not provide this option, then Nodestream will try its best to determine that path for you:

- By checking the presence of `require.main` and using it
- By using the current working directory

In all these default cases, the target folder will be named *.storage*. If it does not exist, it will be created on first write.

> **Even with these defaults, you should always explicitly state where Nodestream should put your files**. It's the only way to guarantee that you will not spend hours searching through your project's files trying to figure out where the hell did that file go. 😀

```js
const Nodestream = require('nodestream')
const nodestream = new Nodestream({
  adapter: 'filesystem',
  config: {
    // You MUST provide either an absolute path or nothing at all
    // You can use array notation, the parts will be `path.join()`ed for you
    root: [__dirname, '.storage']
  }
})
```

## License

This software is licensed under the **BSD-3-Clause License**. See the [LICENSE](LICENSE) file for more information.
