[npm-badge]: https://badge.fury.io/js/nodestream-transform-compress.svg
[npm-url]: https://npmjs.org/package/nodestream-transform-compress
[travis-badge]: https://travis-ci.org/nodestream/nodestream-transform-compress.svg
[travis-url]: https://travis-ci.org/nodestream/nodestream-transform-compress
[coveralls-badge]: https://img.shields.io/coveralls/nodestream/nodestream-transform-compress.svg
[coveralls-url]: https://coveralls.io/r/nodestream/nodestream-transform-compress
[inch-badge]: http://inch-ci.org/github/nodestream/nodestream-transform-compress.svg
[inch-url]: http://inch-ci.org/github/nodestream/nodestream-transform-compress
[make-badge]: https://img.shields.io/badge/built%20with-GNU%20Make-brightgreen.svg
[apidocs-url]: https://nodestream.github.io/nodestream-transform-compress
[nodestream-url]: https://github.com/nodestream/nodestream
[zlib-url]: https://nodejs.org/api/zlib.html

# Nodestream - Compress Transform

[![NPM Version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Documentation Status][inch-badge]][inch-url]
![Built with GNU Make][make-badge]

> Zlib compression/decompression transform for [Nodestream][nodestream-url]

**Identity:**: `compress`

[**API docs**][apidocs-url]

## Description

This transformer allows you to compress/decompress streams that you upload/download with Nodestream. Same functionality as with the built-in [`zlib`][zlib-url] module is supported.

You can use any combination of compressing/decompressing and downloading/uploading - you are **not** limited to ie. only compressing uploads and decompressing downloads.

## Usage

### Installation

`npm install --save nodestream-transform-compress`

### Configuration

You need to register this tranform with Nodestream before you can use it:

```js
// Assuming you already have a nodestream instance configured with an adapter
nodestream.registerTransform('compress')
```

Now you can create a pipeline which will use this transform:

```js
const pipeline = nodestream.pipeline()
  .use('checksum', {
    algorithm: 'gzip',  // Either gzip or deflate, gzip is default
    raw: false  // For deflate, setting this to true will not prepend deflate header
  })
```

The following options are supported:

- `algorithm`: Either *gzip* or *deflate* - determines which compression algorithm should be used
- `raw`: `true` or `false` - Only available for *deflate* algorithm. If set to true, then no header will be added to the resulting stream.

The following per-file options are required:

- `mode`: Either *compress* or *decompress* - determines how the stream should be transformed

Pass this option via the last argument in `.upload()` or `.download()` methods on the pipeline via a `compress` key (this transform's identity) - see the examples below.

### Results

This transform does not have any transformation results to publish, so it will publish the input configuration which was used for this transformation - it will be available on the `compress` property (this transform's identity) on the `results` response:

```js
const file = fs.createReadStream('/users/me/profile-pic.png')
pipeline.upload(file, { name: 'avatar.png', compress: { mode: 'compress' } })
.then(results => {
  results.compress.algorithm  // gzip
  results.compress.raw  // false
})

// Downloads
const dest = fs.createWriteStream('/users/me/profile-pic.png')
pipeline.download('avatars/user-123.png', dest, { compress: { mode: 'decompress' } })
.then(results => {
  results.compress.algorithm  // gzip
  results.compress.raw  // false
})
```

## License

This software is licensed under the **BSD-3-Clause License**. See the [LICENSE](LICENSE) file for more information.
