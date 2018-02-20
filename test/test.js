// var cleanup = require('jsdom-global')();
var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

// Testing the test suite
describe('#indexOf()', function() {
  it('should return -1 when the value is not present', () => {
    expect([1,2,3].indexOf(4)).to.be.equal(-1);
  });
});