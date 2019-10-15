/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

import { expect } from 'chai'
import Pipeline from '../lib/pipeline'

describe('Class: Pipeline', () => {
  it('is a class', () => {
    // Can't test for a class directly... 🙁
    expect(Pipeline).to.be.a('function')
  })

  // @TODO: More tests here! Most of the implementation is tested indirectly via Nodestream,
  // but we should really include some specifics in here as well
})
