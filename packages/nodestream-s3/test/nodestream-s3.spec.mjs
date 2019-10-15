/**
 * Nodestream - S3
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

import * as stream from 'stream'
import { expect } from 'chai'
import * as sinon from 'sinon'
import * as AWS from 'aws-sdk'
import Adapter from '../lib/nodestream-s3'

const s3proto = Object.getPrototypeOf(new AWS.S3())


describe('Adapter', () => {
  it('should be a class', () => {
    // Can't test for a class directly... 🙁
    expect(Adapter).to.be.a('function')
  })

  it('should declare its identity', () => {
    expect(Adapter.identity).to.be.a('string')
  })

  it('should not throw on missing options', () => {
    expect(() => new Adapter()).to.not.throw()
  })


  describe('.createWriteStream()', () => {
    let adapter
    let stubS3

    beforeEach(() => {
      adapter = new Adapter({ bucket: 'testbucket' })
      stubS3 = sinon.stub(s3proto, 'upload').callsArgWithAsync(2, null)
    })

    afterEach(() => {
      stubS3.restore()
    })


    it('should be function', () => {
      expect(adapter).to.have.property('createWriteStream')
      expect(adapter.createWriteStream).to.be.a('function')
    })

    it('should return stream', () => {
      expect(adapter.createWriteStream()).to.be.instanceof(stream)
    })

    it('should emit error when S3 uploader encounters error', done => {
      const dummyError = new Error('some shit happened')

      stubS3.restore()
      stubS3 = sinon.stub(s3proto, 'upload').callsArgWithAsync(2, dummyError)

      const source = adapter.createWriteStream('fake/location')

      source.once('error', err => {
        expect(err).to.equal(dummyError)

        return done()
      })
    })

    it('should write the file to a location relative to bucket', () => {
      adapter.createWriteStream('fake/location')

      expect(stubS3.firstCall.args[0]).to.have.property('Bucket', 'testbucket')
    })

    it('should send the stream to the Body property on .upload()', () => {
      const destination = adapter.createWriteStream('fake/location')

      expect(stubS3.firstCall.args[0]).to.have.property('Body', destination)
    })
  })


  describe('.createReadStream()', () => {
    let adapter
    let fakeReq
    let stubS3

    beforeEach(() => {
      adapter = new Adapter({ bucket: 'testbucket' })
      fakeReq = {
        on: () => {},
        createReadStream: () => {},
      }
      stubS3 = sinon.stub(s3proto, 'getObject').returns(fakeReq)
    })

    afterEach(() => {
      stubS3.restore()
    })


    it('should be function', () => {
      expect(adapter).to.have.property('createReadStream')
      expect(adapter.createReadStream).to.be.a('function')
    })

    it('should read the file from a location relative to root', () => {
      adapter.createReadStream('test.txt')

      expect(stubS3.firstCall.args[0]).to.have.property('Bucket', 'testbucket')
    })

    it('should pass the second options parameter to the .getObject() function', () => {
      adapter.createReadStream('test.txt', { test: true })

      expect(stubS3.firstCall.args[0]).to.have.property('test', true)
    })

    it('should return a readable stream', () => {
      const fakeStream = new stream.PassThrough()

      fakeReq.createReadStream = () => fakeStream

      expect(adapter.createReadStream('test.txt')).to.equal(fakeStream)
    })
  })


  describe('.remove()', () => {
    let adapter
    let stubS3

    beforeEach(() => {
      adapter = new Adapter({ bucket: 'testbucket' })
      stubS3 = sinon.stub(s3proto, 'deleteObject').callsArgWith(1, null)
    })

    afterEach(() => {
      stubS3.restore()
    })


    it('should be function', () => {
      expect(adapter).to.have.property('remove')
      expect(adapter.remove).to.be.a('function')
    })

    it('should return Promise', () => {
      expect(adapter.remove()).to.be.instanceof(Promise)
    })

    it('should remove the file from a location relative to bucket', () => {
      adapter.remove('test.txt')

      expect(stubS3.firstCall.args[0]).to.have.property('Bucket', 'testbucket')
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

      stubS3.restore()
      stubS3 = sinon.stub(s3proto, 'deleteObject').callsArgWith(1, dummyErr)

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
