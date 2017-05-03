/**
 * Nodestream - GridFS
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const mongodb = require('mongodb')
const stream = require('stream')
const Adapter = require('../lib/nodestream-gridfs')

const GridFSProto = mongodb.GridFSBucket.prototype


describe('Adapter', () => {
  it('should be a class', () => {
    // Can't test for a class directly... 🙁
    expect(Adapter).to.be.a('function')
  })

  it('should throw when no MongoDB database instance is given in options', () => {
    expect(() => new Adapter({})).to.throw()
  })


  describe('.createWriteStream()', () => {
    let adapter

    beforeEach(() => {
      adapter = new Adapter({
        db: {
          // eslint-disable-next-line id-length
          s: {},
          collection: sinon.stub(),
        },
      })
    })


    it('should be function', () => {
      expect(adapter).to.have.property('createWriteStream')
      expect(adapter.createWriteStream).to.be.a('function')
    })

    it('should return stream', () => {
      expect(adapter.createWriteStream('fake/location')).to.be.instanceof(stream)
    })

    it('should write the file to the given location', done => {
      const destination = adapter.createWriteStream('fake/location')
      const stub = sinon.stub(GridFSProto, 'openUploadStream').callsFake(location => {
        stub.restore()
        expect(location).to.equal('fake/location')

        return done()
      })

      destination.end()
    })

    it('should pass the second argument to the underlying adapter', done => {
      const destination = adapter.createWriteStream('fake/location', { test: true })
      const stub = sinon.stub(GridFSProto, 'openUploadStream').callsFake((location, opts) => {
        stub.restore()
        expect(opts).to.have.property('test', true)

        return done()
      })

      destination.end()
    })

    it('should connect to mongodb on first use when no database instance is given', done => {
      adapter = new Adapter({ uri: 'mongodb://localhost' })
      const mockDb = {
        // eslint-disable-next-line id-length
        s: {},
        collection: sinon.stub(),
      }
      const connectStub = sinon.stub(mongodb, 'connect').callsArgWithAsync(2, null, mockDb)
      const destination = adapter.createWriteStream('fake/location', { test: true })

      destination.once('finish', () => {
        connectStub.restore()
        expect(connectStub.callCount).to.equal(1)

        return done()
      })
      destination.end()
    })
  })


  describe('.createReadStream()', () => {
    let adapter

    beforeEach(() => {
      adapter = new Adapter({
        db: {
          // eslint-disable-next-line id-length
          s: {},
          collection: sinon.stub(),
        },
      })
    })


    it('should be function', () => {
      expect(adapter).to.have.property('createReadStream')
      expect(adapter.createReadStream).to.be.a('function')
    })

    it('should read the file from the given location', done => {
      const stub = sinon.stub(GridFSProto, 'openDownloadStreamByName').callsFake(location => {
        stub.restore()
        expect(location).to.equal('fake/test.txt')

        return done()
      })

      adapter.createReadStream('fake/test.txt')
    })

    it('should pass the second options parameter to the underlying adapter', done => {
      const stub = sinon.stub(GridFSProto, 'openDownloadStreamByName')
        .callsFake((location, opts) => {
          stub.restore()
          expect(opts).to.have.property('test', true)

          return done()
        })

      adapter.createReadStream('fake/test.txt', { test: true })
    })

    it('should return a readable stream', () => {
      expect(adapter.createReadStream('fake/test.txt')).to.be.instanceof(stream.Readable)
    })
  })


  describe('.remove()', () => {
    let adapter
    let stub
    let stubFind

    beforeEach(() => {
      adapter = new Adapter({
        db: {
          // eslint-disable-next-line id-length
          s: {},
          collection: sinon.stub(),
        },
      })
      stub = sinon.stub(GridFSProto, 'delete').returns(Promise.resolve())
      stubFind = sinon.stub(GridFSProto, 'find').returns({
        toArray: sinon.stub().callsArgWithAsync(0, null, [{ _id: 123 }]),
      })
    })

    afterEach(() => {
      stub.restore()
      stubFind.restore()
    })


    it('should be function', () => {
      expect(adapter).to.have.property('remove')
      expect(adapter.remove).to.be.a('function')
    })

    it('should return Promise', () => {
      expect(adapter.remove()).to.be.instanceof(Promise)
    })

    it('should remove the file from the location by looking up the location\'s ID', () =>
      adapter.remove('fake/test.txt')
      .then(() => {
        expect(stub.firstCall.args[0]).to.equal(123)
      }))

    it('should resolve when the file is removed', () =>
      adapter.remove('fake/test.txt')
      .then(() => {
        expect(stub.callCount).to.equal(1)
      }))

    it('should reject if the removal fails', () => {
      const dummyErr = new Error('fail!')

      stub.restore()
      stub = sinon.stub(GridFSProto, 'delete').returns(Promise.reject(dummyErr))

      return adapter.remove('fake/test.txt')
      .then(() => { throw new Error('Removal should have been rejected') })
      .catch(err => {
        expect(err).to.be.equal(dummyErr)
      })
    })
  })
})
