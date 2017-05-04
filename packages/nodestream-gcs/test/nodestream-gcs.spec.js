/**
 * Nodestream - GCS
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const stream = require('stream')
const Adapter = require('../lib/nodestream-gcs')
const gcs = require('@google-cloud/storage')
// Access the File prototype so we can stub it
const file = gcs({ projectId: 'x' })
             .bucket('x')
             .file('x')
const fileProto = Object.getPrototypeOf(file)


describe('Adapter', () => {
  it('should be a class', () => {
    // Can't test for a class directly... 🙁
    expect(Adapter).to.be.a('function')
  })

  xit('should operate on the given bucket', () => {
    // TODO: Ensure gcloud.storage().bucket('bucket-here') was called
  })


  describe('.createWriteStream()', () => {
    let adapter
    let gcsStub

    beforeEach(() => {
      adapter = new Adapter({ bucket: 'testbucket', projectId: 'test' })
      gcsStub = sinon.stub(fileProto, 'createWriteStream').returns(new stream.PassThrough())
    })

    afterEach(() => {
      gcsStub.restore()
    })


    it('should be function', () => {
      expect(adapter).to.have.property('createWriteStream')
      expect(adapter.createWriteStream).to.be.a('function')
    })

    it('should return writable stream', () => {
      expect(adapter.createWriteStream('fake/location')).to.be.instanceof(stream)
    })

    it('should pass the second argument to the underlying function', () => {
      const options = { test: true }

      adapter.createWriteStream('fake/location', options)

      expect(gcsStub.firstCall.args[0]).to.equal(options)
    })
  })


  describe('.createReadStream()', () => {
    let adapter
    let gcsStub

    beforeEach(() => {
      adapter = new Adapter({ bucket: 'testbucket', projectId: 'test' })
      gcsStub = sinon.stub(fileProto, 'createReadStream').returns(new stream.PassThrough())
    })

    afterEach(() => {
      gcsStub.restore()
    })


    it('should be function', () => {
      expect(adapter).to.have.property('createReadStream')
      expect(adapter.createReadStream).to.be.a('function')
    })

    it('should return a readable stream', () => {
      expect(adapter.createReadStream('test.txt')).to.be.instanceof(stream.Readable)
    })

    it('should pass the second parameter to gcloud.createReadStream() function', () => {
      adapter.createReadStream('test.txt', { test: true })

      expect(gcsStub.firstCall.args[0]).to.have.property('test', true)
    })
  })


  describe('.remove()', () => {
    let adapter
    let gcsStub

    beforeEach(() => {
      adapter = new Adapter({ bucket: 'testbucket', projectId: 'test' })
      gcsStub = sinon.stub(fileProto, 'delete').callsArgWith(0, null)
    })

    afterEach(() => {
      gcsStub.restore()
    })


    it('should be function', () => {
      expect(adapter).to.have.property('remove')
      expect(adapter.remove).to.be.a('function')
    })

    it('should return Promise', () => {
      expect(adapter.remove('test.txt')).to.be.instanceof(Promise)
    })

    it('should resolve when the file is removed', done => {
      adapter.remove('test.txt')
      .then(location => {
        expect(location).to.equal('test.txt')

        return done()
      })
      .catch(done)
    })

    it('should reject if the removal fails', done => {
      const dummyErr = new Error('fail!')

      gcsStub.callsArgWithAsync(0, dummyErr)

      adapter.remove('test.txt')
      .then(() => done(new Error('Removal should have been rejected')))
      .catch(err => {
        expect(err).to.be.equal(dummyErr)

        return done()
      })
      .catch(done)
    })
  })
})
