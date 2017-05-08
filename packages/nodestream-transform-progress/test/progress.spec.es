/**
 * Nodestream - Progress Transform
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

import { expect } from 'chai'
import sinon from 'sinon'
import stream from 'stream'
import Progress from '../lib/progress'

describe('Class: Progress', () => {
  let progress

  beforeEach(() => {
    progress = new Progress()
  })


  it('should exist', () => {
    expect(Progress).to.be.a('function')
  })

  it("should have identity 'progress'", () => {
    expect(Progress.identity).to.equal('progress')
  })


  describe('.transform()', () => {
    it('should exist', () => {
      expect(progress).to.have.property('transform')
      expect(progress.transform).to.be.a('function')
    })

    it('should return a new stream', () => {
      const file = new stream.PassThrough()
      const transformed = progress.transform(file, {})

      expect(transformed).to.be.instanceof(stream)
      expect(transformed).to.not.equal(file)
    })
  })


  describe('.results()', () => {
    it('should exist', () => {
      expect(progress).to.have.property('results')
      expect(progress.results).to.be.a('function')
    })

    it('should return object with all the stats', done => {
      const file = new stream.PassThrough()
      const transformed = progress.transform(file, {})

      file.end('hello world')

      transformed.once('finish', () => {
        const results = progress.results()

        expect(results).to.be.an('object')
        // Calculated by external utility
        expect(results).to.have.property('stats')
        expect(results.stats).to.have.all.keys([
          'openedAt',
          'startedAt',
          'finishedAt',
          'duration',
          'total',
          'processed',
          'remaining',
          'progress',
        ])
        expect(results.stats.openedAt).to.be.instanceof(Date)
        expect(results.stats.startedAt).to.be.instanceof(Date)
        expect(results.stats.finishedAt).to.be.instanceof(Date)
        expect(results.stats.duration).to.be.a('number')
        // Wrote 'hello world', that's 11 bytes
        expect(results.stats.processed).to.equal(11)
        expect(results.stats.total).to.equal(11)
        expect(results.stats.remaining).to.be.equal(0)
        expect(results.stats.progress).to.equal(100)

        return done()
      })
    })

    it('should return object with all total-dependent stats if total is given', done => {
      const file = new stream.PassThrough()
      const transformed = progress.transform(file, { total: 11 })

      file.end('hello world')

      transformed.once('finish', () => {
        const results = progress.results()

        expect(results.stats.total).to.equal(11)
        expect(results.stats.progress).to.equal(100)

        return done()
      })
    })

    it('should call notifier for each written chunk', () => {
      const update = sinon.spy()
      const file = new stream.PassThrough()

      progress.transform(file, { update })

      file.write('a')
      file.write('b')
      file.write('c')
      file.end()

      expect(update.callCount).to.equal(3)
    })

    it('should properly calculate stats during progress', () => {
      const update = sinon.spy()
      const file = new stream.PassThrough()

      progress.transform(file, { update, total: 3 })

      for (const iteration of [1, 2, 3]) {
        file.write(String(iteration))

        const args = update.lastCall.args[0]

        expect(args).to.have.property('progress', (iteration / 3) * 100)
        expect(args).to.have.property('remaining', 3 - iteration)
        expect(args).to.have.property('processed', iteration)
      }
    })
  })
})
