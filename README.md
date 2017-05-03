[npm-badge]: https://badge.fury.io/js/nodestream.svg
[npm-url]: https://npmjs.org/package/nodestream
[travis-badge]: https://travis-ci.org/nodestream/nodestream.svg
[travis-url]: https://travis-ci.org/nodestream/nodestream
[coveralls-badge]: https://img.shields.io/coveralls/nodestream/nodestream.svg
[coveralls-url]: https://coveralls.io/r/nodestream/nodestream
[inch-badge]: http://inch-ci.org/github/nodestream/nodestream.svg
[inch-url]: http://inch-ci.org/github/nodestream/nodestream
[make-badge]: https://img.shields.io/badge/built%20with-GNU%20Make-brightgreen.svg
[apidocs-url]: https://nodestream.github.io/nodestream
[ns-fs]: https://github.com/nodestream/nodestream-filesystem
[fs-icon]: https://cloud.githubusercontent.com/assets/3058150/13901081/d81b824c-ee17-11e5-8fbe-40eff40646f7.png
[ns-s3]: https://github.com/nodestream/nodestream-s3
[s3-icon]: https://cloud.githubusercontent.com/assets/3058150/13901098/80692616-ee18-11e5-98c1-91c35b936c51.png
[ns-gridfs]: https://github.com/nodestream/nodestream-gridfs
[gridfs-icon]: https://cloud.githubusercontent.com/assets/3058150/13901696/59652146-ee2c-11e5-8c7e-3cba5ba9854c.png
[ns-gcs]: https://github.com/nodestream/nodestream-gcs
[gcs-icon]: https://cloud.githubusercontent.com/assets/3058150/13907413/bfb554e0-eeed-11e5-9e51-ce490fad8abd.png
[ns-checksum]: https://github.com/nodestream/nodestream-transform-checksum
[ns-compress]: https://github.com/nodestream/nodestream-transform-compress
[ns-progress]: https://github.com/nodestream/nodestream-transform-progress

# Nodestream <img src="https://raw.githubusercontent.com/nodestream/nodestream/master/media/artwork/nodestream.png" width="150px" alt="Nodestream logo" title="Nodestream" />

[![NPM Version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Documentation Status][inch-badge]][inch-url]
![Built with GNU Make][make-badge]

> Streaming library for binary data transfers

[**API docs**][apidocs-url]

## Description

This library aims to provide a unified API for all the major storage systems out there (filesystem, AWS S3, Google Cloud Storage etc.). It also provides an easy way to manipulate data streams as they are being uploaded/downloaded from those storage systems (compression/ checksum calculation/encryption etc.).

### Use cases

- Single API to rule them all
- Easy way to transform incoming/outgoing data
- Work with filesystem storage during development, AWS S3 in production without changing code
- *Insert your idea here*

## Available adapters

| [![S3][s3-icon]][ns-s3] | [![GridFS][gridfs-icon]][ns-gridfs] | [![GCS][gcs-icon]][ns-gcs] | [![Filesystem][fs-icon]][ns-fs] |
|:-----------------------:|:-----------------------------------:|:--------------------------:|:-------------------------------:|
| Amazon S3               | GridFS                              | Google Cloud Storage       | Local Filesystem                |


## Available transforms

> See [Pipelines and Transforms](#pipelines-and-transforms) section for more info.

| [checksum][ns-checksum] | [compress][ns-compress] | [progress][ns-progress] | crypto (WIP)           |
|:-----------------------:|:-----------------------:|:----------------------:|:----------------------:|
| Checksum Calculator     | Stream (de)compressor   | Progress monitor       | Stream (en/de)cryption |

## Usage

### Installation

The first step is to install nodestream into your project:

`npm install --save nodestream`

The next thing is to decide which *adapter* you want to use. An adapter is an interface for nodestream to be able to interact with a particular storage system. Let's use local filesystem for a start:

`npm install --save nodestream-filesystem`

### Configuration

Let's create and configure a nodestream instance with which your application can then interact:

```js
// Require the main Nodestream class
const Nodestream = require('nodestream')
const nodestream = new Nodestream({
  // This tells nodestream which storage system it should interact with
  // Under the hood, it will try to require `nodestream-filesystem` module
  adapter: 'filesystem',
  // This object is always specific to your adapter of choice - always check
  // the documentation for that adapter for available options
  config: {
    // The `filesystem` adapter requires a `root` configuration option, so let's provide one
    root: [__dirname, '.storage']
  }
})
```

Great! At this point, nodestream is ready to transfer some bytes!

### Actions

#### Uploading

You can upload any kind of readable stream. Nodestream does not care where that stream comes from, whether it's an http upload or a file from your filesystem or something totally different.

For this example, we will upload a file from our filesystem.

> We will be uploading the file to our local filesystem as well as reading it from the same filesystem. Normally you would probably use a source different from the target storage, but Nodestream does not really care.

```js
const fs = require('fs')
// This is the file we will upload - create a readable stream of that file
const profilePic = fs.createReadStream('/users/me/pictures/awesome-pic.png')

nodestream.upload(profilePic, {
  // directory and name are supported by all storage adapters, but each
  // adapter might have additional options you can use
  directory: 'avatars',
  name: 'user-123.png'
})
.then(results => {
  // results can contain several properties, but the most interesting
  // and always-present is `location` - you should definitely save this
  // somewhere, you will need it to retrieve this file later!
  console.log(results.location)
})
.catch(err => {
  // U-oh, something blew up 😱
})
```

Congratulations, you just uploaded your first file!

#### Downloading

Downloading a file is quite straight-forward - all you need is the file's location as returned by the `upload()` method and a destination stream to which you want to send the data. This can be any valid writable stream. Again, Nodestream does not care where you are sending the bytes, be it local filesystem, an http response or even a different Nodestream instance (ie. S3 to GridFS transfer).

```js
// Let's create a destination for the download
const fs = require('fs')
const destination = fs.createWriteStream('/users/me/downloads/picture.png')

// We are hardcoding the location here, but you will probably want to
// retrieve the file's location from a database
nodestream.download('avatars/user-123.png', destination)
.then(() => {
  // All good, destination received all the data!
})
.catch(err => {
  // Oh well...
})
```

#### Removing

Just pass the file's location to the `.remove()` method.

```js
nodestream.remove('avatars/user-123.png')
.then(location => {
  // The file at this location has just been removed!
})
.catch(err => {
  // Oh no!
})
```

## Pipelines and Transforms

Nodestream supports two features which are meant to be used together - pipelines and transforms.

- **Transform**: A plugin which takes an input stream and produces an output stream
- **Pipeline**: A re-usable, ordered collection of transforms

The real power of pipelines is that you only have to create a single pipeline, tell it which transforms it should use and then you just keep sending files to or retrieving files from it - all files will be processed in exactly the same way.

Here are some ideas what a transform can be used for. With pipelines, you can combine them to your heart's liking:

- Calculating checksums
- Compressing/decompressing data
- Modifying the data completely, ie. appending headers/footers and whatnot

### Registering a transform

All transforms must be first registered with your Nodestream instance before you can use them in a pipeline. Registering is easy and is generally recommended to be done immediately after your application is started, because requiring a module is a synchronous, blocking operation, so you want to get it done before you start doing something important.

Once you configure your Nodestream instance, you can register a transform using the `.registerTransform()` function.

```js
// Let's register a compression transform! The following will try to require
// `nodestream-transform-compress` package.
nodestream.registerTransform('compress')

// You can also register an actual implementation of the transform!
const compress = require('nodestream-transform-compress')
nodestream.registerTransform(compress)
```

### Using pipelines

To use a pipeline, you must first create one! Once you have your pipeline, you can then go on and tell it to use any of the registered transforms. Pipelines are reusable, so the general practice is to create one pipeline and use it for all uploads/downloads.

You may want to create multiple pipelines per project to accommodate different processing needs for your files, ie. you might have one pipeline for image uploads (with a transform plugin to calculate checksums and one to crop the images) and another pipeline for other files (with just the checksum transform). Any combination can be achieved.

```js
// Let's create our first pipeline
const pipeline = nodestream.pipeline()

// Now, we can tell the pipeline to use any of the registered transforms
// The second parameter is specific to each transform so always check the
// transform's docs to see what you can set
pipeline
  .use('checksum', { algorithm: 'md5' })
  .use('compress', { algorithm: 'gzip' })

// You can use a single pipeline for multiple file uploads/downloads
// Aaand, you can also pass per-file, transform-specific options here
pipeline.upload(file, { name: 'pic.png', compress: { mode: 'compress' } })
```

> **WARNING!**
>
> The **order** in which transforms are added to a pipeline using `.use()` **matters!** Transforms are applied to the stream in the order they were added. For example, if you first add a checksum calculation transform and then a compress transform, the checksum will be calculated from the uncompressed data. Switching the order would cause the checksum to be calculated from the compressed data. There are use cases for both situations, so the choice of ordering is completely up to you.


### Accessing transform results

You might have noticed that Nodestream returns a Promise which is resolved with a `results` object. In addition to the `location` property, this object also contains results of all applied transformations (if there are any).

Each transform declares its "identity" - a string which will be used as a "scope" to publish its results or to provide a mechanism to customise the transform's options. Check each of the transforms' documentation to learn what is its `identity` string.

For the `checksum` transform, its identity is, surprisingly, "checksum". When used, the calculated checksum can be obtained as follows:

```js
nodestream
  .pipeline()
  .use('checksum')
  .upload(file, { name: 'pic.png' })
  .then(results => {
    // The `results` object will have a "checksum" property, because that's
    // the transform's identity
    console.log(results.checksum.value)
  })
```

There is no limit to the amount of transforms which can be registered per Nodestream instance, although there are some practical limitations which restrict you to only one particular transform type per Nodestream instance (ie. only one checksum transform with only one compress transform).

## Contributing

Looking for suggestions, improvements, bug reports... any kind of contribution is welcome!

## License

This software is licensed under the **BSD-3-Clause License**. See the [LICENSE](LICENSE) file for more information.
