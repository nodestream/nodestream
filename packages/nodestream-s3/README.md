[npm-badge]: https://badge.fury.io/js/nodestream-s3.svg
[npm-url]: https://npmjs.org/package/nodestream-s3
[travis-badge]: https://travis-ci.org/nodestream/nodestream-s3.svg
[travis-url]: https://travis-ci.org/nodestream/nodestream-s3
[coveralls-badge]: https://img.shields.io/coveralls/nodestream/nodestream-s3.svg
[coveralls-url]: https://coveralls.io/r/nodestream/nodestream-s3
[inch-badge]: http://inch-ci.org/github/nodestream/nodestream-s3.svg
[inch-url]: http://inch-ci.org/github/nodestream/nodestream-s3
[make-badge]: https://img.shields.io/badge/built%20with-GNU%20Make-brightgreen.svg
[apidocs-url]: https://nodestream.github.io/nodestream-s3
[nodestream-url]: https://github.com/nodestream/nodestream
[s3-icon]: https://cloud.githubusercontent.com/assets/3058150/13901098/80692616-ee18-11e5-98c1-91c35b936c51.png
[s3-constructor]: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
[s3-upload]: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
[s3-getObject]: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property

# ![S3][s3-icon] nodestream-s3

[![NPM Version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Documentation Status][inch-badge]][inch-url]
![Built with GNU Make][make-badge]

> AWS S3 adapter for [Nodestream][nodestream-url]

**Identity:**: `s3`

[**API docs**][apidocs-url]

## Description

This adapter provides interface for Nodestream to transfer bytes between your app and Amazon S3 cloud storage.

## Usage

### Installation

`npm install --save nodestream-s3`

### Configuration

When configuring Nodestream instance, the only required option is the `bucket`. The rest is optional and is passed along unmodified to the [`AWS.S3()` constructor][s3-constructor]. No default values are provided.

```js
const Nodestream = require('nodestream')
const nodestream = new Nodestream({
  adapter: 's3',
  config: {
    // Required - cannot do anything without a bucket!
    bucket: 'my-s3-bucket',
    // The rest of the options is passed as-is to the AWS.S3() constructor
    // NOTE: You will probably need the AWS credentials here 😀
    accessKeyId: 'my-access-key-id',
    secretAccessKey: 'my-secret!'
  }
})
```

### Usage

#### Uploading

When uploading files, you may specify a `directory` and `name` for the upload. Both are optional - if no `name` is given, a random GUID will be generated.

You can also specify custom options for the [`upload()` method][s3-upload] to specify options like ACL or part size for multipart uploads.

```js
const file = fs.createReadStream('/users/me/profile-pic.png')
nodestream.upload(file, {
  directory: 'avatars',
  name: 'user-123.png',
  s3: {
    // This corresponds to the first argument of the S3.upload() method
    // NOTE: Specifying `Key`, `Body` or `Bucket` here will have no effect
    params: {
      ACL: 'public-read'
    },
    // This corresponds to the second argument of the S3.upload() method
    options: {
      partSize: 10 * 1024 * 1024
    }
  }
})
```

#### Downloading

You can also specify options for the [`getObject()` method][s3-getObject] via `s3` object (this adapter's identity) in the third argument.

```js
const dest = fs.createWriteStream('/users/me/profile-pic.png')
nodestream.download('avatars/user-123.png', dest, {
  s3: {
    Range: '1000-'
  }
})

// Perhaps in an Express controller, you would pipe the file to the client
res.setHeader('content-type', 'image/png')
res.setHeader('content-disposition', 'attachment')
nodestream.download('avatars/user-123.png', res)
.then(results => {
  // Client received the file
})
```

## License

This software is licensed under the **BSD-3-Clause License**. See the [LICENSE](LICENSE) file for more information.
