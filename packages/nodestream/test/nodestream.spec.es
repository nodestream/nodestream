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

describe('Class: Nodestream', () => {
  let DummyAdapter
  let storage

  beforeEach(() => {
    DummyAdapter = function() {}
    DummyAdapter.identity = 'dummy'
    DummyAdapter.prototype.createWriteStream = () => new stream.PassThrough()
    DummyAdapter.prototype.createReadStream = () => new stream.PassThrough()
    DummyAdapter.prototype.remove = () => {}

    storage = new Nodestream({ adapter: DummyAdapter })
  })


  it('should be a class', () => {
    // Can't test for a class directly... 🙁
    expect(Nodestream).to.be.a('function')
  })

  it('should throw when the adapter is not a constructor function', () => {
    expect(() => new Nodestream({})).to.throw(TypeError)
  })

  it('should throw when the adapter does not declare its identity', () => {
    delete DummyAdapter.identity

    expect(() => new Nodestream({ adapter: DummyAdapter })).to.throw(ReferenceError)
  })

  it('should instantiate the adapter', done => {
    DummyAdapter = function() {
      // eslint-disable-next-line no-invalid-this
      expect(this).to.be.instanceof(DummyAdapter)

      return done()
    }
    DummyAdapter.identity = 'dummy'

    return new Nodestream({ adapter: DummyAdapter })
  })

  it('should pass along the adapter configuration to the adapter', () => {
    const testOpts = { customdata: '123' }

    DummyAdapter = function(options) {
      expect(options).to.equal(testOpts)
    }
    DummyAdapter.identity = 'dummy'

    return new Nodestream({ adapter: DummyAdapter, config: testOpts })
  })

  it('should attempt to require the adapter if only the adapter\'s name is given', () => {
    expect(() => new Nodestream({ adapter: 'filesystem' }))
    .to.throw(/Cannot find adapter package nodestream-filesystem/)
  })


  describe('.upload()', () => {
    let dummyFile

    beforeEach(() => {
      dummyFile = new stream.PassThrough()
      setImmediate(() => dummyFile.end())
    })


    it('should be function', () => {
      expect(storage).to.have.property('upload')
      expect(storage.upload).to.be.a('function')
    })

    it('should reject files which are not readable streams', () => {
      expect(() => storage.upload({}, {})).to.throw(TypeError)
      expect(() => storage.upload(new stream.Writable(), {})).to.throw(TypeError)
    })

    it('should allow uploading instances of streams', () => {
      expect(() => storage.upload(dummyFile, {})).to.not.throw()
    })

    it('should not replace the name if it was specified as string', () =>
      expect(storage.upload(dummyFile, { name: 'testfile' }))
      .to.eventually.have.property('location', 'testfile'))

    it('should generate a unique name if no name is provided', () =>
      expect(storage.upload(dummyFile, {}))
      .to.eventually.have.property('location')
      .and.be.a('string'))

    it('should return ES 2015 Promise', () => {
      expect(storage.upload(dummyFile)).to.be.instanceof(Promise)
    })

    it('should pass adapter-specific options to the adapter', () => {
      DummyAdapter.prototype.createWriteStream = (location, options) => {
        expect(options).to.be.an('object')
        expect(options.test).to.equal(true)

        return new stream.PassThrough()
      }

      return storage.upload(dummyFile, { dummy: { test: true } })
    })

    it('should reject if the destination emits error', () => {
      DummyAdapter.prototype.createWriteStream = () => {
        const destination = new stream.PassThrough()

        setImmediate(() => destination.emit('error', new Error('fail')))

        return destination
      }

      return expect(storage.upload(dummyFile)).to.eventually.be.rejectedWith(Error, 'fail')
    })

    it('should reject if the source emits error', () => {
      setImmediate(() => dummyFile.emit('error', new Error('fail')))

      return expect(storage.upload(dummyFile)).to.eventually.be.rejectedWith(Error, 'fail')
    })

    it('should resolve with an object containing the upload results', () =>
      expect(storage.upload(dummyFile, {}))
      .to.eventually.have.all.keys('location', 'transforms', 'adapter'))

    it('should resolve with the name of the adapter used for upload', () =>
      expect(storage.upload(dummyFile, {}))
      .to.eventually.have.property('adapter', DummyAdapter.identity))
  })


  describe('.download()', () => {
    let dummyDest

    beforeEach(() => {
      dummyDest = new stream.PassThrough()
    })


    it('should be function', () => {
      expect(storage).to.have.property('download')
      expect(storage.download).to.be.a('function')
    })

    it('should pass the location to the adapter', done => {
      DummyAdapter.prototype.createReadStream = location => {
        expect(location).to.equal('fake/location')
        const source = new stream.PassThrough()
        setImmediate(() => source.end())

        return source
      }

      storage.download('fake/location', new stream.PassThrough())
        .then(() => done())
        .catch(done)
    })

    it('should return ES 2015 Promise', () => {
      expect(storage.download('fake/location', dummyDest)).to.be.instanceof(Promise)
    })

    it('should reject if the source emits error', () => {
      DummyAdapter.prototype.createReadStream = () => {
        const source = new stream.PassThrough()

        setImmediate(() => source.emit('error', new Error('fail')))

        return source
      }

      return expect(storage.download('fake/location', dummyDest))
      .to.eventually.be.rejectedWith(Error, 'fail')
    })

    it('should reject if the target emits error', () => {
      const target = new stream.PassThrough()

      setImmediate(() => target.emit('error', new Error('fail')))

      return expect(storage.download('fake/location', target))
      .to.eventually.be.rejectedWith(Error, 'fail')
    })

    it('should resolve when the source stream ends', () => {
      const source = new stream.PassThrough()

      DummyAdapter.prototype.createReadStream = () => source
      setImmediate(() => source.end('all done'))

      return storage.download('fake/location', dummyDest)
    })

    it('should resolve with an object containing the download results', () => {
      setImmediate(() => dummyDest.end())

      return expect(storage.download('fake/location', dummyDest))
      .to.eventually.have.all.keys('location', 'transforms', 'adapter')
    })

    it('should resolve with the name of the adapter used for download', () => {
      setImmediate(() => dummyDest.end())

      return expect(storage.download('fake/location', dummyDest))
      .to.eventually.have.property('adapter', DummyAdapter.identity)
    })

    it('should pass adapter-specific options to the adapter', () => {
      setImmediate(() => dummyDest.end())

      DummyAdapter.prototype.createReadStream = (location, options) => {
        expect(options).to.be.an('object')
        expect(options.test).to.equal(true)

        return new stream.PassThrough()
      }

      return storage.download('fake/location', dummyDest, { dummy: { test: true } })
    })

    it('should throw a TypeError if location is not string', () => {
      expect(() => storage.download(123, dummyDest)).to.throw(TypeError)
    })

    it('should throw a TypeError if destination is not writable stream', () => {
      expect(() => storage.download('fake/location', new stream.Readable())).to.throw(TypeError)
    })
  })


  describe('.remove()', () => {
    it('should be function', () => {
      expect(storage).to.have.property('remove')
      expect(storage.remove).to.be.a('function')
    })

    it('should pass the location to the adapter', () => {
      DummyAdapter.prototype.remove = location => {
        expect(location).to.equal('fake/location')
      }

      return storage.remove('fake/location')
    })

    it('should return ES 2015 Promise', () => {
      DummyAdapter.prototype.remove = () => ({})

      expect(storage.remove('fake/location')).to.be.instanceof(Promise)
    })

    it('should throw a TypeError if location is not string', () => {
      expect(() => storage.remove(123)).to.throw(TypeError)
    })
  })


  describe('.registerTransform()', () => {
    class DummyTransform {
      static get identity() {
        return 'testidentity'
      }
    }


    it('should be function', () => {
      expect(storage).to.have.property('registerTransform')
      expect(storage.registerTransform).to.be.a('function')
    })

    it('should return self', () => {
      expect(storage.registerTransform(DummyTransform)).to.equal(storage)
    })

    it('should accept class/constructor function', () => {
      function DummyCtor() {}
      DummyCtor.identity = 'testidentity'

      expect(() => storage.registerTransform(DummyTransform)).to.not.throw()
      expect(() => storage.registerTransform(DummyCtor)).to.not.throw()
    })

    it("should attempt to require the transform if only the transform's name is given", () => {
      expect(() => storage.registerTransform('checksum'))
      .to.throw(/Cannot find transform package nodestream-transform-checksum/)
    })

    it('should reject non-class/constructor function values', () => {
      expect(() => storage.registerTransform(1234)).to.throw()
      expect(() => storage.registerTransform(Infinity)).to.throw()
      expect(() => storage.registerTransform(NaN)).to.throw()
      expect(() => storage.registerTransform(void 0)).to.throw()
      expect(() => storage.registerTransform(true)).to.throw()
      expect(() => storage.registerTransform(null)).to.throw()
      expect(() => storage.registerTransform({})).to.throw()
    })

    it('should reject implementations without declared identity', () => {
      class Invalid {}

      expect(() => storage.registerTransform(Invalid)).to.throw(ReferenceError)
    })
  })
})
