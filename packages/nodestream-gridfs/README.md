[npm-badge]: https://badge.fury.io/js/nodestream-gridfs.svg
[npm-url]: https://npmjs.org/package/nodestream-gridfs
[travis-badge]: https://travis-ci.org/nodestream/nodestream-gridfs.svg
[travis-url]: https://travis-ci.org/nodestream/nodestream-gridfs
[coveralls-badge]: https://img.shields.io/coveralls/nodestream/nodestream-gridfs.svg
[coveralls-url]: https://coveralls.io/r/nodestream/nodestream-gridfs
[inch-badge]: http://inch-ci.org/github/nodestream/nodestream-gridfs.svg
[inch-url]: http://inch-ci.org/github/nodestream/nodestream-gridfs
[make-badge]: https://img.shields.io/badge/built%20with-GNU%20Make-brightgreen.svg
[apidocs-url]: https://nodestream.github.io/nodestream-gridfs
[nodestream-url]: https://github.com/nodestream/nodestream
[gridfs-icon]: https://cloud.githubusercontent.com/assets/3058150/13901696/59652146-ee2c-11e5-8c7e-3cba5ba9854c.png
[mongo-connect]: http://mongodb.github.io/node-mongodb-native/2.2/api/MongoClient.html#.connect

# ![GridFS][gridfs-icon] nodestream-gridfs

[![NPM Version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Documentation Status][inch-badge]][inch-url]
![Built with GNU Make][make-badge]

> MongoDB GridFS adapter for [Nodestream][nodestream-url]

**Identity:** `gridfs`

[**API docs**][apidocs-url]

## Description

This adapter provides interface for Nodestream to transfer bytes between your app and GridFS buckets.

## Usage

### Installation

`npm install --save nodestream-gridfs`

### Configuration

The following configuration options are required by the adapter:

- `db`: A connected MongoClient instance, **or**
- `uri`: A MongoDB URI to connect to (`db` instance will take precedence if provided)
- `connectOpts`: Connection options to be used when connecting. Passed directly to [`MongoClient.connect()`][mongo-connect]
- `bucket`: The bucket name this adapter will operate on (defaults to `fs`)
- `chunkSize`: The default chunk size (defaults to 255kB)

Using the `db` instance might seem a bit more complicated, but it has several advantages:

- You have full control over the state of the connection - you can close the session anytime you want. Currently this is not possible to achieve if Nodestream manages the `db` instance itself and thus prevents you from making the Node.js process quit gracefully.
- Rather than creating new connection to Mongo, you can re-use the same connection your ORM uses. This can save some memory by only having one `db` instance for the whole app.
- You have special requirements on how the connection is created

```js
// With `db` instance
// WARNING - Not production-ready code
const mongodb = require('mongodb')

mongodb.MongoClient().connect((err, db) => {
  // db is what this adapter needs!
  const Nodestream = require('nodestream')
  const nodestream = new Nodestream({
    adapter: 'gridfs',
    config: {
      db: db,
      bucket: 'avatars'
    }
  })
})

// With `uri`
const Bluebird = require('bluebird')
const Nodestream = require('nodestream')
const nodestream = new Nodestream({
  adapter: 'gridfs',
  config: {
    uri: 'mongodb://user:pass@localhost:27017/my-db',
    connectOpts: {
      promiseLibrary: Bluebird
    }
    bucket: 'avatars'
  }
})
```

## License

This software is licensed under the **BSD-3-Clause License**. See the [LICENSE](LICENSE) file for more information.
