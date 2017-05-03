[npm-badge]: https://badge.fury.io/js/nodestream-transform-checksum.svg
[npm-url]: https://npmjs.org/package/nodestream-transform-checksum
[travis-badge]: https://travis-ci.org/nodestream/nodestream-transform-checksum.svg
[travis-url]: https://travis-ci.org/nodestream/nodestream-transform-checksum
[coveralls-badge]: https://img.shields.io/coveralls/nodestream/nodestream-transform-checksum.svg
[coveralls-url]: https://coveralls.io/r/nodestream/nodestream-transform-checksum
[inch-badge]: http://inch-ci.org/github/nodestream/nodestream-transform-checksum.svg
[inch-url]: http://inch-ci.org/github/nodestream/nodestream-transform-checksum
[make-badge]: https://img.shields.io/badge/built%20with-GNU%20Make-brightgreen.svg
[apidocs-url]: https://nodestream.github.io/nodestream-transform-checksum
[nodestream-url]: https://github.com/nodestream/nodestream
[crypto-get-hashes]: https://nodejs.org/api/crypto.html#crypto_crypto_gethashes

# Nodestream - Checksum Transform

[![NPM Version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Documentation Status][inch-badge]][inch-url]
![Built with GNU Make][make-badge]

> Checksum calculator for [Nodestream][nodestream-url]

**Identity:**: `checksum`

[**API docs**][apidocs-url]

## Description

This transformer allows you to calculate checksums of the files you upload/download with Nodestream. It can also be used as a standalone library, although it does not provide much in addition to the standard crypto APIs.

## Usage

### Installation

`npm install --save nodestream-transform-checksum`

### Configuration

You need to register this tranform with Nodestream before you can use it:

```js
// Assuming you already have a nodestream instance configured with an adapter
nodestream.registerTransform('checksum')
```

Now you can create a pipeline which will use this transform:

```js
const pipeline = nodestream.pipeline()
  .use('checksum', {
    algorithm: 'md5',
    buffer: false
  })
```

The transform accepts two options:

- `algorithm`: Which hashing algorithm should be used. This can be anything that [`crypto.getHashes()`][crypto-get-hashes] shows on your system.
- `buffer`: By default, the resulting hash will be returned as hex string. Set this to `true` to get the actual raw buffer instead.

### Results

This transform will publish its data to the `checksum` property (this transform's identity) on the `results` response:

```js
// Uploads
const file = fs.createReadStream('/users/me/profile-pic.png')
pipeline.upload(file, { name: 'avatar.png' })
.then(results => {
  results.checksum.value // The actual hash
  results.checksum.algorithm // The algorithm used
})

// Downloads
const dest = fs.createWriteStream('/users/me/profile-pic.png')
pipeline.download('avatars/user-123.png', dest)
.then(results => {
  results.checksum.value // The actual hash
  results.checksum.algorithm // The algorithm used
})
```

## License

This software is licensed under the **BSD-3-Clause License**. See the [LICENSE](LICENSE) file for more information.
