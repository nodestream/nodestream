/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

import { expect } from 'chai'
import sinon from 'sinon'
import stream from 'stream'
import Nodestream from '../lib/nodestream'


describe('Feature: Transformers', () => {
  let DummyTransform
  let storage
  let pipeline
  let dummyFile

  beforeEach(() => {
    function DummyAdapter() {}
    DummyAdapter.identity = 'dummy'
    DummyAdapter.prototype.createWriteStream = () => new stream.PassThrough()
    DummyAdapter.prototype.createReadStream = () => {
      const file = new stream.PassThrough()

      setImmediate(() => {
        file.write('hello world')
        file.end()
      })

      return file
    }

    DummyTransform = function() {}
    DummyTransform.identity = 'testidentity'
    DummyTransform.prototype.transform = file => file
    DummyTransform.prototype.results = () => true

    dummyFile = new stream.PassThrough()
    setImmediate(() => {
      dummyFile.write('hello world')
      dummyFile.end()
    })

    storage = new Nodestream({ adapter: DummyAdapter })
    pipeline = storage
      .registerTransform(DummyTransform)
      .pipeline()
      .use('testidentity')
  })

  it('creates new Transform instance for each file (upload)', () => {
    const spy = sinon.spy(DummyTransform)

    spy.identity = 'spy'
    pipeline = storage.registerTransform(spy)
      .pipeline()
      .use('spy')

    return Promise.all([
      pipeline.upload(dummyFile),
      pipeline.upload(dummyFile),
    ])
      .then(() => {
        expect(spy.callCount).to.equal(2)
      })
  })

  it('creates new Transform instance for each file (download)', () => {
    const spy = sinon.spy(DummyTransform)

    spy.identity = 'spy'
    pipeline = storage.registerTransform(spy)
      .pipeline()
      .use('spy')

    return Promise.all([
      pipeline.download('fake/location', new stream.PassThrough()),
      pipeline.download('fake/location', new stream.PassThrough()),
    ])
      .then(() => {
        expect(spy.callCount).to.equal(2)
      })
  })


  describe('Uploading', () => {
    it('should pass the file to all transforms', () => {
      const spy = sinon.spy(DummyTransform.prototype, 'transform')

      return pipeline.upload(dummyFile)
        .then(() => {
          spy.restore()
          expect(spy.callCount).to.equal(1)
        })
        .catch(err => {
          spy.restore()

          throw err
        })
    })

    it('should pass the configuration object to the transformer', () => {
      const config = { muhaha: true }

      DummyTransform = function(options) {
        expect(options).to.equal(config)
      }
      DummyTransform.identity = 'testidentity'
      DummyTransform.prototype.transform = file => file
      DummyTransform.prototype.results = () => true

      storage.registerTransform(DummyTransform, config)

      pipeline.upload(dummyFile)
    })

    it('should gather transformation results and publish it to the results object', () =>
      expect(pipeline.upload(dummyFile))
        .to.eventually.have.property('testidentity').and.to.equal(true))

    it('should make the transform appear in the list of applied transforms', () =>
      expect(pipeline.upload(dummyFile))
        .to.eventually.have.property('transforms').which.contains(DummyTransform.identity))

    it('passes per-file configuration options to the transformer', () => {
      const spy = sinon.spy(DummyTransform.prototype, 'transform')
      const transformOpts = { received: true }

      return pipeline.upload(dummyFile, { testidentity: transformOpts })
        .then(() => {
          expect(spy.getCall(0).args[1]).to.equal(transformOpts)
        })
        .catch(err => {
          spy.restore()

          throw err
        })
    })
  })


  describe('Downloading', () => {
    it('should pass the file to all transforms', () => {
      const spy = sinon.spy(DummyTransform.prototype, 'transform')

      return pipeline.download('fake/location', new stream.PassThrough())
        .then(() => {
          spy.restore()
          expect(spy.callCount).to.equal(1)
        })
        .catch(err => {
          spy.restore()

          throw err
        })
    })

    it('should pass the configuration object to the transformer', () => {
      const config = { muhaha: true }

      DummyTransform = function(options) {
        expect(options).to.equal(config)
      }
      DummyTransform.identity = 'testidentity'
      DummyTransform.prototype.transform = file => file
      DummyTransform.prototype.results = () => true

      storage.registerTransform(DummyTransform, config)
      pipeline.download('fake/location', new stream.PassThrough())
    })

    it('should gather transformation results and publish it to the results object', () =>
      expect(pipeline.download('fake/location', new stream.PassThrough()))
        .to.eventually.have.property('testidentity').and.to.equal(true))

    it('should make the transform appear in the list of applied transforms', () =>
      expect(pipeline.download('fake/location', new stream.PassThrough()))
        .to.eventually.have.property('transforms').which.contains(DummyTransform.identity))

    it('passes per-file configuration options to the transformer', () => {
      const spy = sinon.spy(DummyTransform.prototype, 'transform')
      const transformOpts = { received: true }

      return pipeline.download('fake/location', new stream.PassThrough(), {
        testidentity: transformOpts,
      })
        .then(() => {
          expect(spy.getCall(0).args[1]).to.equal(transformOpts)
        })
        .catch(err => {
          spy.restore()

          throw err
        })
    })
  })
})
