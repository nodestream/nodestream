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
const stream = require('stream')

describe('Class: Nodestream', function() {

  let DummyAdapter
  let storage

  beforeEach(function() {
    DummyAdapter = function() {}
    DummyAdapter.prototype.upload = () => Promise.resolve('/a/b/c')

    storage = new Nodestream({ adapter: DummyAdapter })
  })


  it('should be a class', function() {
    // Can't test for a class directly... 🙁
    expect(Nodestream).to.be.a('function')
  })

  it('should throw when the adapter is not a constructor function', function() {
    expect(() => new Nodestream({})).to.throw(TypeError)
  })

  it('should instantiate the adapter', function(done) {
    DummyAdapter = function() {
      // eslint-disable-next-line no-invalid-this
      expect(this).to.be.instanceof(DummyAdapter)

      return done()
    }

    return new Nodestream({ adapter: DummyAdapter })
  })

  it('should pass along the adapter configuration to the adapter', function() {
    const testOpts = { customdata: '123' }

    DummyAdapter = function(options) {
      expect(options).to.equal(testOpts)
    }

    return new Nodestream({ adapter: DummyAdapter, config: testOpts })
  })

  it('should attempt to require the adapter if only the adapter\'s name is given', function() {
    expect(() => new Nodestream({ adapter: 'filesystem' }))
    .to.throw(/Cannot find filesystem adapter/)
  })


  describe('.upload()', function() {

    let dummyFile

    beforeEach(function() {
      dummyFile = new stream.Readable()
    })


    it('should be function', function() {
      expect(storage).to.have.property('upload')
      expect(storage.upload).to.be.a('function')
    })

    it('should normalise options into object if not provided', function() {
      DummyAdapter.prototype.upload = (file, options) => {
        expect(options).to.be.instanceof(Object)

        return Promise.resolve('a/b/c')
      }

      return storage.upload(dummyFile)
    })

    it('should reject files which are not readable streams', function() {
      expect(() => storage.upload({}, {})).to.throw(TypeError)
      expect(() => storage.upload(new stream.Writable(), {})).to.throw(TypeError)
    })

    it('should allow uploading instances of streams', function() {
      expect(() => storage.upload(dummyFile, {})).to.not.throw()
    })

    it('should generate a unique name if no name is provided', function() {
      DummyAdapter.prototype.upload = (file, options) => {
        expect(options).to.have.ownProperty('name')
        expect(options.name).to.be.a('string')

        return Promise.resolve('/a/b/c')
      }

      return storage.upload(dummyFile, {})
    })

    it('should not replace the name if it was specified as string', function() {
      DummyAdapter.prototype.upload = (file, options) => {
        expect(options.name).to.equal('testfile')

        return Promise.resolve('/a/b/c')
      }

      return storage.upload(dummyFile, { name: 'testfile' })
    })

    it('should return the file location as a key named location', function() {
      return storage.upload(dummyFile)
      .then(results => {
        expect(results).to.be.an('object')
        expect(results).to.have.property('location', '/a/b/c')
      })
    })

    it('should return ES 2015 Promise', function() {
      // Return a promise-like object
      const stupidPromise = {
        then: () => stupidPromise,
        catch: () => {}
      }

      DummyAdapter.prototype.upload = () => stupidPromise

      expect(storage.upload(dummyFile)).to.be.instanceof(Promise)
    })
  })


  describe('.download()', function() {

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

    it('should return ES 2015 Promise', function() {

      expect(storage.download('/test/file.txt')).to.be.instanceof(Promise)
    })
  })


  describe('.remove()', function() {

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

    it('should return ES 2015 Promise', function() {
      DummyAdapter.prototype.remove = () => ({})

      expect(storage.remove('/test/file.txt')).to.be.instanceof(Promise)
    })
  })


  describe('.addTransform()', function() {

    class DummyTransform {
      static get identity() {
        return 'testidentity'
      }
    }


    it('should be function', function() {
      expect(storage).to.have.property('addTransform')
      expect(storage.addTransform).to.be.a('function')
    })

    it('should return self', function() {
      expect(storage.addTransform('upload', DummyTransform)).to.equal(storage)
    })

    it('should accept class/constructor function', function() {
      function DummyCtor() {}
      DummyCtor.identity = 'testidentity'

      expect(() => storage.addTransform('upload', DummyTransform)).to.not.throw()
      expect(() => storage.addTransform('upload', DummyCtor)).to.not.throw()
    })

    it("should attempt to require the transform if only the transform's name is given", function() {
      expect(() => storage.addTransform('upload', 'checksum'))
      .to.throw(/Cannot find checksum transform/)
    })

    it('should reject invalid direction', function() {
      expect(() => storage.addTransform('upsidedown', DummyTransform)).to.throw(/Invalid direction/)
    })

    it('should reject non-class/constructor function values', function() {
      expect(() => storage.addTransform('upload', 1234)).to.throw()
      expect(() => storage.addTransform('upload', 'ab')).to.throw()
      expect(() => storage.addTransform('upload', null)).to.throw()
      expect(() => storage.addTransform('upload', {})).to.throw()
    })

    it('should reject implementations without declared identity', function() {
      class Invalid {}

      expect(() => storage.addTransform('upload', Invalid)).to.throw(ReferenceError)
    })
  })
})
