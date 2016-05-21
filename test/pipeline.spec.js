/**
 * Nodestream
 *
 * @author      Robert Rossmann <robert.rossmann@me.com>
 * @copyright   2016 Robert Rossmann
 * @license     BSD-3-Clause
 */

'use strict'

const expect = require('chai').expect
const Pipeline = require('../lib/pipeline')

describe('Class: Pipeline', function() {
  it('is a class', function() {
    // Can't test for a class directly... 🙁
    expect(Pipeline).to.be.a('function')
  })

  // @TODO: More tests here! Most of the implementation is tested indirectly via Nodestream,
  // but we should really include some specifics in here as well
})
