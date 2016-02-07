/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const expect = require('chai').expect
const Nodestream = require('../lib/nodestream')

describe('Class: Nodestream', function() {

  it('should be a class', function() {
    // Can't test for a class directly... 🙁
    expect(Nodestream).to.be.a('function')
  })

  it('should throw when the adapter is not a constructor function', function() {
    expect(() => new Nodestream({})).to.throw(TypeError)
  })

  it('should instantiate the adapter', function(done) {
    function DummyAdapter() {
      expect(this).to.be.instanceof(DummyAdapter)

      return done()
    }

    return new Nodestream({ adapter: DummyAdapter })
  })

  it('should pass along the adapter configuration to the adapter', function() {
    const testOpts = { customdata: '123' }

    function DummyAdapter(options) {
      expect(options).to.equal(testOpts)
    }

    return new Nodestream({ adapter: DummyAdapter, config: testOpts })
  })


  describe('.upload()', function() {

    let DummyAdapter
    let storage

    beforeEach(function() {
      DummyAdapter = function() {}

      storage = new Nodestream({ adapter: DummyAdapter })
    })


    it('should be function', function() {
      expect(storage).to.have.property('upload')
      expect(storage.upload).to.be.a('function')
    })

    it('should normalise options into object if not provided', function(done) {
      DummyAdapter.prototype.upload = (file, options) => {
        expect(options).to.be.instanceof(Object)

        return done()
      }

      storage.upload({})
    })

    it('should generate a unique name if no name is provided', function(done) {
      DummyAdapter.prototype.upload = (file, options) => {
        expect(options).to.have.ownProperty('name')
        expect(options.name).to.be.a('string')

        return done()
      }

      storage.upload({}, {})
    })

    it('should not replace the name if it was specified as string', function(done) {
      DummyAdapter.prototype.upload = (file, options) => {
        expect(options.name).to.equal('testfile')

        return done()
      }

      storage.upload({}, { name: 'testfile' })
    })
  })


  describe('.download()', function() {

    let DummyAdapter
    let storage

    beforeEach(function() {
      DummyAdapter = function() {}

      storage = new Nodestream({ adapter: DummyAdapter })
    })


    it('should be function', function() {
      expect(storage).to.have.property('download')
      expect(storage.download).to.be.a('function')
    })

    it('should pass the location to the adapter', function(done) {
      DummyAdapter.prototype.download = location => {
        expect(location).to.equal('test/file.txt')

        return done()
      }

      storage.download('test/file.txt')
    })

    it('should return whatever the adapter returns', function() {
      const retVal = {}

      DummyAdapter.prototype.download = () => retVal

      expect(storage.download('/test/file.txt')).to.equal(retVal)
    })
  })


  describe('.remove()', function() {

    let DummyAdapter
    let storage

    beforeEach(function() {
      DummyAdapter = function() {}

      storage = new Nodestream({ adapter: DummyAdapter })
    })


    it('should be function', function() {
      expect(storage).to.have.property('remove')
      expect(storage.remove).to.be.a('function')
    })

    it('should pass the location to the adapter', function(done) {
      DummyAdapter.prototype.remove = location => {
        expect(location).to.equal('test/file.txt')

        return done()
      }

      storage.remove('test/file.txt')
    })

    it('should return whatever the adapter returns', function() {
      const retVal = {}

      DummyAdapter.prototype.remove = () => retVal

      expect(storage.remove('/test/file.txt')).to.equal(retVal)
    })
  })
})
