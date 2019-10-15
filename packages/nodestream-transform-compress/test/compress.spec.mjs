/**
 * Nodestream - Compress Transform
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

import * as stream from 'stream'
import * as zlib from 'zlib'
import { expect } from 'chai'
import Compress from '../lib/compress'

describe('Class: Compress', () => {
  let compress

  beforeEach(() => {
    compress = new Compress()
  })


  it('should exist', () => {
    expect(Compress).to.be.a('function')
  })

  it("should have identity 'compress'", () => {
    expect(Compress.identity).to.equal('compress')
  })

  it('should throw when invalid algorithm is given', () => {
    expect(() => new Compress({ algorithm: 'test' })).to.throw(Error)

    expect(() => new Compress({ algorithm: 'gzip' })).to.not.throw(Error)
    expect(() => new Compress({ algorithm: 'deflate' })).to.not.throw(Error)
  })

  it('should default to gzip compression', () => {
    expect(new Compress().results()).to.have.property('algorithm', 'gzip')
  })


  describe('.transform()', () => {
    it('should exist', () => {
      expect(compress).to.have.property('transform')
      expect(compress.transform).to.be.a('function')
    })

    it('should return a new stream', () => {
      const file = new stream.PassThrough()
      const transformed = compress.transform(file, { mode: 'compress' })

      expect(transformed).to.be.instanceof(stream)
      expect(transformed).to.not.equal(file)
    })

    it('should construct proper zlib instance based on input options', () => {
      const file = new stream.PassThrough()

      // gzip
      expect(new Compress({
        algorithm: 'gzip',
        raw: false,
      }).transform(file, { mode: 'compress' })).to.be.instanceof(zlib.Gzip)

      // deflate
      expect(new Compress({
        algorithm: 'deflate',
        raw: false,
      }).transform(file, { mode: 'compress' })).to.be.instanceof(zlib.Deflate)

      // deflate, raw
      expect(new Compress({
        algorithm: 'deflate',
        raw: true,
      }).transform(file, { mode: 'compress' })).to.be.instanceof(zlib.DeflateRaw)

      // gunzip
      expect(new Compress({
        algorithm: 'gzip',
        raw: false,
      }).transform(file, { mode: 'decompress' })).to.be.instanceof(zlib.Gunzip)

      // inflate
      expect(new Compress({
        algorithm: 'deflate',
        raw: false,
      }).transform(file, { mode: 'decompress' })).to.be.instanceof(zlib.Inflate)

      // inflate, raw
      expect(new Compress({
        algorithm: 'deflate',
        raw: true,
      }).transform(file, { mode: 'decompress' })).to.be.instanceof(zlib.InflateRaw)
    })

    it('should throw when invalid mode is given', () => {
      const file = new stream.PassThrough()

      expect(() => new Compress().transform(file)).to.throw(Error)
      expect(() => new Compress().transform(file, { mode: 'test' })).to.throw(Error)

      expect(() => new Compress().transform(file, { mode: 'compress' })).to.not.throw(Error)
      expect(() => new Compress().transform(file, { mode: 'decompress' })).to.not.throw(Error)
    })
  })


  describe('.results()', () => {
    it('should exist', () => {
      expect(compress).to.have.property('results')
      expect(compress.results).to.be.a('function')
    })

    it('should return the options object', () => {
      const options = { mode: 'compress' }

      expect(new Compress(options).results()).to.equal(options)
    })
  })
})
