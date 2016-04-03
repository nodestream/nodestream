/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const stream = require('stream')
const Nodestream = require('../lib/nodestream')


describe('Feature: Transformers', function() {
  let DummyTransform
  let storage
  let dummyFile

  beforeEach(function() {
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
  })


  describe('Uploading', function() {
    beforeEach(function() {
      storage.addTransform('upload', DummyTransform)
    })


    it('should pass the file to all transforms', function() {
      const spy = sinon.spy(DummyTransform.prototype, 'transform')

      return storage.upload(dummyFile)
      .then(() => {
        spy.restore()
        expect(spy.callCount).to.equal(1)
      })
      .catch(err => {
        spy.restore()

        throw err
      })
    })

    it('should pass the configuration object to the transformer', function() {
      const config = { muhaha: true }

      DummyTransform = function(options) {
        expect(options).to.equal(config)
      }
      DummyTransform.identity = 'testidentity'
      DummyTransform.prototype.transform = file => file
      DummyTransform.prototype.results = () => true

      storage.addTransform('upload', DummyTransform, config)

      storage.upload(dummyFile)
    })

    it('should gather transformation results and publish it to the results object', function() {
      return expect(storage.upload(dummyFile))
      .to.eventually.have.property('testidentity').and.to.equal(true)
    })

    it('should make the transform appear in the list of applied transforms', function() {
      return expect(storage.upload(dummyFile))
      .to.eventually.have.property('transforms').which.contains(DummyTransform.identity)
    })
  })


  describe('Downloading', function() {
    beforeEach(function() {
      storage.addTransform('download', DummyTransform)
    })


    it('should pass the file to all transforms', function() {
      const spy = sinon.spy(DummyTransform.prototype, 'transform')

      return storage.download('fake/location', new stream.PassThrough())
      .then(() => {
        spy.restore()
        expect(spy.callCount).to.equal(1)
      })
      .catch(err => {
        spy.restore()

        throw err
      })
    })

    it('should pass the configuration object to the transformer', function() {
      const config = { muhaha: true }

      DummyTransform = function(options) {
        expect(options).to.equal(config)
      }
      DummyTransform.identity = 'testidentity'
      DummyTransform.prototype.transform = file => file
      DummyTransform.prototype.results = () => true

      storage.addTransform('download', DummyTransform, config)
      storage.download('fake/location', new stream.PassThrough())
    })

    it('should gather transformation results and publish it to the results object', function() {
      return expect(storage.download('fake/location', new stream.PassThrough()))
      .to.eventually.have.property('testidentity').and.to.equal(true)
    })

    it('should make the transform appear in the list of applied transforms', function() {
      return expect(storage.download('fake/location', new stream.PassThrough()))
      .to.eventually.have.property('transforms').which.contains(DummyTransform.identity)
    })
  })
})
