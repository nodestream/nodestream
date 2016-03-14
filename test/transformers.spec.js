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

  beforeEach(function() {
    function DummyAdapter() {}
    DummyAdapter.prototype.upload = () => Promise.resolve('/a/b/c')
    DummyAdapter.prototype.download = () => {
      const file = new stream.PassThrough()

      setImmediate(() => {
        file.write('hello world')
        file.end()
      })

      return file
    }

    DummyTransform = function() {}
    DummyTransform.namespace = 'testspace'
    DummyTransform.prototype.transform = file => file
    DummyTransform.prototype.results = () => true

    storage = new Nodestream({ adapter: DummyAdapter })
  })


  describe('Uploading', function() {

    beforeEach(function() {
      storage.addTransform('upload', DummyTransform)
    })


    it('should pass the file to all transforms', function() {
      const spy = sinon.spy(DummyTransform.prototype, 'transform')
      const file = new stream.PassThrough()

      setImmediate(() => {
        file.write('hello world')
        file.end()
      })

      return storage.upload(file)
      .then(() => {
        spy.restore()
        expect(spy.callCount).to.equal(1)
      })
    })

    it('should pass the configuration object to the transformer', function() {
      const config = { muhaha: true }

      DummyTransform = function(options) {
        expect(options).to.equal(config)
      }
      DummyTransform.namespace = 'testspace'
      DummyTransform.prototype.transform = file => file
      DummyTransform.prototype.results = () => true

      storage.addTransform('upload', DummyTransform, config)
      const file = new stream.PassThrough()

      storage.upload(file)
    })
  })


  describe('Downloading', function() {

    beforeEach(function() {
      storage.addTransform('download', DummyTransform)
    })


    it('should pass the file to all transforms', function(done) {
      const spy = sinon.spy(DummyTransform.prototype, 'transform')
      const file = storage.download('/a/b/c')

      file.once('finish', () => {
        spy.restore()
        expect(spy.callCount).to.equal(1)

        return done()
      })
    })

    it('should pass the configuration object to the transformer', function() {
      const config = { muhaha: true }

      DummyTransform = function(options) {
        expect(options).to.equal(config)
      }
      DummyTransform.namespace = 'testspace'
      DummyTransform.prototype.transform = file => file
      DummyTransform.prototype.results = () => true

      storage.addTransform('download', DummyTransform, config)
      storage.download('/a/b/c')
    })
  })
})
