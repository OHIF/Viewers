// Write your tests here!
// Here is an example.
describe('clinical:collaborations-ui', function () {
  it.client('runs only in client', function () {
    expect(Meteor.isClient).to.be.true;
  });
  it.server('runs only in server', function () {
    expect(Meteor.isServer).to.be.true;
  });
});
