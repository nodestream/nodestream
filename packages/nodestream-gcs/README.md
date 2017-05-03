[npm-badge]: https://badge.fury.io/js/nodestream-gcs.svg
[npm-url]: https://npmjs.org/package/nodestream-gcs
[travis-badge]: https://travis-ci.org/nodestream/nodestream-gcs.svg
[travis-url]: https://travis-ci.org/nodestream/nodestream-gcs
[coveralls-badge]: https://img.shields.io/coveralls/nodestream/nodestream-gcs.svg
[coveralls-url]: https://coveralls.io/r/nodestream/nodestream-gcs
[inch-badge]: http://inch-ci.org/github/nodestream/nodestream-gcs.svg
[inch-url]: http://inch-ci.org/github/nodestream/nodestream-gcs
[make-badge]: https://img.shields.io/badge/built%20with-GNU%20Make-brightgreen.svg
[apidocs-url]: https://nodestream.github.io/nodestream-gcs
[nodestream-url]: https://github.com/nodestream/nodestream
[gcs-icon]: https://cloud.githubusercontent.com/assets/3058150/13907413/bfb554e0-eeed-11e5-9e51-ce490fad8abd.png
[gcloud-function]: http://googlecloudplatform.github.io/gcloud-node/#/docs/v0.36.0/gcloud
[gcloud-createWriteStream]: http://googlecloudplatform.github.io/gcloud-node/#/docs/v0.36.0/storage/file?method=createWriteStream
[gcloud-createReadStream]: http://googlecloudplatform.github.io/gcloud-node/#/docs/v0.36.0/storage/file?method=createReadStream

# ![Google Cloud Storage][gcs-icon] nodestream-gcs

[![NPM Version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Documentation Status][inch-badge]][inch-url]
![Built with GNU Make][make-badge]

> Google Cloud Storage adapter for [Nodestream][nodestream-url]

**Identity:**: `gcs`

[**API docs**][apidocs-url]

## Description

This adapter provides interface for Nodestream to transfer bytes between your app and Google Cloud Storage.

## Usage

### Installation

`npm install --save nodestream-gcs`

### Configuration

When configuring Nodestream instance, you must specify at minimum the `bucket` on which you want to operate, and, as per GCS documentation, at least `projectId`, but preferably also `keyFilename` to have fully authenticated client functionality. All configuration options are passed along unmodified to the [`gcloud()` function][gcloud-function]. No default values are provided.

```js
const Nodestream = require('nodestream')
const nodestream = new Nodestream({
  adapter: 'gcs',
  config: {
    bucket: 'my-gcs-bucket',
    projectId: 'project-id-123',
    keyFilename: '/path/to/keyfile.json'
  }
})
```

### Uploading

When uploading files, you may specify a `directory` and `name` for the upload. Both are optional - if no `name` is given, a random GUID will be generated.

You can also specify options for the [`createWriteStream()` method][gcloud-createWriteStream] via `gcs` object (this adapter's identity).

```js
const file = fs.createReadStream('/users/me/profile-pic.png')
nodestream.upload(file, {
  directory: 'avatars',
  name: 'user-123.png',
  gcs: {
    gzip: true
  }
})
```

### Downloading

You can also specify options for the [`createReadStream()` method][gcloud-createReadStream] via `gcs` object (this adapter's identity) in the third argument.

```js
const dest = fs.createWriteStream('/users/me/profile-pic.png')
nodestream.download('avatars/user-123.png', dest, {
  gcs: {
    start: 1000
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
