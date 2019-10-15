/**
 * Nodestream - Checksum Transform
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

import * as stream from 'stream'
import { expect } from 'chai'
import Checksum from '../lib/checksum'

describe('Class: Checksum', () => {
  let checksum

  beforeEach(() => {
    checksum = new Checksum({})
  })


  it('should exist', () => {
    expect(Checksum).to.be.a('function')
  })

  it("should have identity 'checksum'", () => {
    expect(Checksum.identity).to.equal('checksum')
  })


  describe('.transform()', () => {
    it('should exist', () => {
      expect(checksum).to.have.property('transform')
      expect(checksum.transform).to.be.a('function')
    })

    it('should return a new stream', () => {
      const file = new stream.PassThrough()
      const transformed = checksum.transform(file)

      expect(transformed).to.be.instanceof(stream)
      expect(transformed).to.not.equal(file)
    })
  })


  describe('.results()', () => {
    it('should exist', () => {
      expect(checksum).to.have.property('results')
      expect(checksum.results).to.be.a('function')
    })

    it('should default to md5 if no algorithm is provided', done => {
      const file = new stream.PassThrough()
      const transformed = checksum.transform(file)

      file.end('hello world')

      // Allow the pipes to update downstream targets
      transformed.on('finish', () => {
        const results = checksum.results()

        expect(results).to.be.an('object')
        expect(results.algorithm).to.equal('md5')

        return done()
      })
    })

    it('should return object with algorithm and value', done => {
      const file = new stream.PassThrough()
      const transformed = checksum.transform(file)

      file.end('hello world')

      // Allow the pipes to update downstream targets
      transformed.on('finish', () => {
        const results = checksum.results()

        expect(results).to.be.an('object')
        // Calculated by external utility
        expect(results.value).to.equal('5eb63bbbe01eeed093cb22bb8f5acdc3')

        return done()
      })
    })

    it('should allow algorithm selection', done => {
      checksum = new Checksum({ algorithm: 'sha1' })

      const file = new stream.PassThrough()
      const transformed = checksum.transform(file)

      file.end('hello world')

      // Allow the pipes to update downstream targets
      transformed.on('finish', () => {
        const results = checksum.results()

        expect(results).to.be.an('object')
        expect(results.algorithm).to.equal('sha1')
        // Calculated by external utility
        expect(results.value).to.equal('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed')

        return done()
      })
    })

    it('should return raw buffer if asked for', done => {
      checksum = new Checksum({ buffer: true })

      const file = new stream.PassThrough()
      const transformed = checksum.transform(file)

      file.end('hello world')

      // Allow the pipes to update downstream targets
      transformed.on('finish', () => {
        const results = checksum.results()

        expect(results).to.be.an('object')
        expect(results.value).to.be.instanceof(Buffer)

        return done()
      })
    })
  })
})
