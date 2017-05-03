/**
 * Nodestream - Filesystem
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const stream = require('stream')
const Adapter = require('../lib/nodestream-filesystem')


describe('Adapter', () => {
  it('should be a class', () => {
    // Can't test for a class directly... 🙁
    expect(Adapter).to.be.a('function')
  })

  it('should reject relative root path', () => {
    expect(() => new Adapter({ root: '.storage' })).to.throw(/root must be absolute/)
  })

  it('should support array of strings when specifying root', () => {
    expect(() => new Adapter({ root: [__dirname, '.storage'] })).to.not.throw()
  })

  it('should not throw on missing options', () => {
    expect(() => new Adapter()).to.not.throw()
  })


  describe('.createWriteStream()', () => {
    let adapter
    let fakeStream
    let stubMkdirp
    let stubFs

    beforeEach(() => {
      adapter = new Adapter({ root: __dirname })
      fakeStream = new stream.PassThrough()
      stubFs = sinon.stub(fs, 'createWriteStream').returns(fakeStream)
      stubMkdirp = sinon.stub(mkdirp, 'mkdirp').callsArgWithAsync(2, null)
    })

    afterEach(() => {
      stubFs.restore()
      stubMkdirp.restore()
    })


    it('should be function', () => {
      expect(adapter).to.have.property('createWriteStream')
      expect(adapter.createWriteStream).to.be.a('function')
    })

    it('should return stream', () => {
      expect(adapter.createWriteStream('fake/location')).to.be.instanceof(stream)
    })

    it('should emit error when destination encounters error', done => {
      const dummyError = new Error('some shit happened')
      const destination = adapter.createWriteStream('fake/location')

      destination.once('error', err => {
        expect(err).to.equal(dummyError)

        return done()
      })

      // Wait until the destination is piped into the actual fs stream
      fakeStream.once('pipe', () => {
        setImmediate(() => fakeStream.emit('error', dummyError))
      })
    })

    it('should emit error on destination when mkdirp encounters error', done => {
      const mkdirpErr = new Error('mkdirp fatal')

      stubMkdirp.callsArgWithAsync(2, mkdirpErr)

      const destination = adapter.createWriteStream('fake/location')

      destination.once('error', err => {
        expect(err).to.equal(mkdirpErr)

        return done()
      })
    })

    it('should write the file to a location relative to root', done => {
      const destination = adapter.createWriteStream('fake/location')

      destination.end()
      destination.once('end', () => {
        expect(stubFs.firstCall.args[0]).to.equal(path.join(__dirname, 'fake', 'location'))

        return done()
      })
    })
  })


  describe('.createReadStream()', () => {
    let adapter
    let fakeStream
    let stubFs

    beforeEach(() => {
      adapter = new Adapter({ root: __dirname })
      fakeStream = new stream.PassThrough()
      stubFs = sinon.stub(fs, 'createReadStream').returns(fakeStream)
    })

    afterEach(() => {
      stubFs.restore()
    })


    it('should be function', () => {
      expect(adapter).to.have.property('createReadStream')
      expect(adapter.createReadStream).to.be.a('function')
    })

    it('should read the file from a location relative to root', () => {
      adapter.createReadStream('test.txt')

      expect(stubFs.firstCall.args[0]).to.equal(path.join(__dirname, 'test.txt'))
    })

    it('should pass the second options parameter to fs.createReadStream() function', () => {
      adapter.createReadStream('test.txt', { test: true })

      expect(stubFs.firstCall.args[1]).to.have.property('test', true)
    })

    it('should return a readable stream', () => {
      expect(adapter.createReadStream('test.txt')).to.be.instanceof(stream.Readable)
    })
  })


  describe('.remove()', () => {
    let adapter
    let stubFs

    beforeEach(() => {
      adapter = new Adapter({ root: __dirname })
      stubFs = sinon.stub(fs, 'unlink').callsArgWith(1, null)
    })

    afterEach(() => {
      stubFs.restore()
    })


    it('should be function', () => {
      expect(adapter).to.have.property('remove')
      expect(adapter.remove).to.be.a('function')
    })

    it('should return Promise', () => {
      expect(adapter.remove()).to.be.instanceof(Promise)
    })

    it('should remove the file from a location relative to root', () => {
      adapter.remove('test.txt')

      expect(stubFs.firstCall.args[0]).to.equal(path.join(__dirname, 'test.txt'))
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

      stubFs.restore()
      stubFs = sinon.stub(fs, 'unlink').callsArgWith(1, dummyErr)

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
