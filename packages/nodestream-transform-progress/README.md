[npm-badge]: https://badge.fury.io/js/nodestream-transform-progress.svg
[npm-url]: https://npmjs.org/package/nodestream-transform-progress
[travis-badge]: https://travis-ci.org/nodestream/nodestream-transform-progress.svg
[travis-url]: https://travis-ci.org/nodestream/nodestream-transform-progress
[coveralls-badge]: https://img.shields.io/coveralls/nodestream/nodestream-transform-progress.svg
[coveralls-url]: https://coveralls.io/r/nodestream/nodestream-transform-progress
[inch-badge]: http://inch-ci.org/github/nodestream/nodestream-transform-progress.svg
[inch-url]: http://inch-ci.org/github/nodestream/nodestream-transform-progress
[make-badge]: https://img.shields.io/badge/built%20with-GNU%20Make-brightgreen.svg
[apidocs-url]: https://nodestream.github.io/nodestream-transform-progress
[nodestream-url]: https://github.com/nodestream/nodestream

# Nodestream - Progress Transform

[![NPM Version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Documentation Status][inch-badge]][inch-url]
![Built with GNU Make][make-badge]

> Progress monitor for [Nodestream][nodestream-url]

**Identity:**: `progress`

[**API docs**][apidocs-url]

## Description

This transformer will report detailed stats about the ongoing upload/download back to you via a custom, per-file function.

## Usage

### Installation

`npm install --save nodestream-transform-progress`

### Configuration

You need to register this tranform with Nodestream before you can use it:

```js
// Assuming you already have a nodestream instance configured with an adapter
nodestream.registerTransform('progress')
```

Now you can create a pipeline which will use this transform:

```js
const pipeline = nodestream.pipeline()
  .use('progress')
```

The transform accepts two per-file options:

- `total`: Nodestream cannot determine how much data will flow through it - if you want to have some stats available (like % completed), you must provide the expected size of the stream (in bytes, as integer). How you obtain this information is completely up to you.
- `update`: Pass a function here. This function will be called repeatedly until the stream is finished with detailed statistics about current progress.

### Progress monitoring

The following example demonstrates how to monitor the progress of a single file upload.

```js
const file = fs.createReadStream('/users/me/profile-pic.png')
// WARNING - Do not use *Sync() methods in production! Used for demo purposes only.
const size = fs.statSync('/users/me/profile-pic.png').size
pipeline.upload(file, {
  progress: {
    total: size,
    update(stats) {
      // stats now contains a bunch of interesting properties about current progress
      console.log(stats)
    }
  }
})
```

### Stats available

The following progress stats are available for you:

- `openedAt` (`Date`) - When the stream has been opened. This occurs approximately when you call `.upload()` or `.download()`.
- `startedAt` (`Date`) - When the first byte has been received
- `finishedAt` (`Date`) - When the stream has been completely processed
- `duration` (`Number`) - For how long (in ms) has the upload been going on? This is updated continuously.
- `total` - (`Number`|`null`) - Total number of bytes - you must provide this value yourself. Will be set to the total amount of processed bytes once the stream has finished processing.
- `processed` (`Number`) - Number of bytes processed so far
- `remaining` (`Number`|`null`) - Bytes still remaining - requires `total` to be available. Will be set to 0 once the stream has finished processing.
- `progress` (`Number`|`null`) - Percentage of current progress - requires `total` to be available. Will be set to 100 once the stream has finished processing.

### Results

This transform will publish its final progress stats via `stats` on the `progress` (this transform's identity) property on the `results` response:

```js
// Uploads
const file = fs.createReadStream('/users/me/profile-pic.png')
pipeline.upload(file, { name: 'avatar.png' })
.then(results => {
  results.progress.stats
})

// Downloads
const dest = fs.createWriteStream('/users/me/profile-pic.png')
pipeline.download('avatars/user-123.png', dest)
.then(results => {
  results.progress.stats
})
```

## License

This software is licensed under the **BSD-3-Clause License**. See the [LICENSE](LICENSE) file for more information.
