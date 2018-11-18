var expect = require('chai').expect

var path = require('path')
var meteorResolver = require('../index.js')

function replaceSlashWithPathSep(filePath) {
  return filePath.replace(/\//g, path.sep);
}

describe('paths', function () {
  it('handles base path relative to CWD', function () {
    expect(meteorResolver.resolve('./another-file', replaceSlashWithPathSep('./test/imports/test-file.js')))
      .to.have.property('path')
      .equal(path.resolve(__dirname, './imports/another-file.js'))
  })

  it('handles root (/) paths relative to CWD', function () {
    expect(meteorResolver.resolve('/imports/another-file', replaceSlashWithPathSep('./test/imports/test-file.js')))
      .to.have.property('path')
      .equal(path.resolve(__dirname, './imports/another-file.js'))
  })

  it('should not resolve a client file in a server file', function () {
    expect(meteorResolver.resolve('/imports/client/client-test', replaceSlashWithPathSep('./test/imports/server/server-test.js')))
      .to.deep.equal({found: false})
  })

  it('should resolve a client file in a non-client file which is not inside a server folder', function () {
    expect(meteorResolver.resolve('/imports/client/client-test', replaceSlashWithPathSep('./test/imports/package-test/plain-file.js')))
      .to.have.property('found', true)
  })

  it('should not resolve a server file in a client file', function () {
    expect(meteorResolver.resolve('/imports/server/server-test', replaceSlashWithPathSep('./test/imports/client/client-test.js')))
      .to.deep.equal({found: false})
  })

  it('should resolve a server file in a non-server file which is not inside a client folder', function () {
    expect(meteorResolver.resolve('/imports/server/server-test', replaceSlashWithPathSep('./test/imports/package-test/plain-file.js')))
      .to.have.property('found', true)
  })

  it(`should resolve a file ending in server in a non-server file if it comes from a node module`, function () {
    expect(meteorResolver.resolve('react-dom/server', replaceSlashWithPathSep('./test/imports/package-test/plain-file.js')))
      .to.have.property('found', true)
  })

  it('should resolve a custom Meteor package if it is in the packages file', function () {
    expect(meteorResolver.resolve('meteor/test:package', replaceSlashWithPathSep('./test/imports/client/client-test.js')))
      .to.deep.equal({
        found: true,
        path: null
      })
  })

  it('should not resolve a custom Meteor package if it is not in the packages file', function () {
    expect(meteorResolver.resolve('meteor/fake:package', replaceSlashWithPathSep('./test/imports/client/client-test.js')))
      .to.deep.equal({found: false})
  })

  it('should resolve a built-in Meteor package if it is in the versions file', function () {
    expect(meteorResolver.resolve('meteor/meteor', replaceSlashWithPathSep('./test/imports/client/client-test.js')))
      .to.deep.equal({
        found: true,
        path: null
      })
  })

  it('should not resolve a built-in Meteor package if it is not in the versions file', function () {
    expect(meteorResolver.resolve('meteor/email', replaceSlashWithPathSep('./test/imports/client/client-test.js')))
      .to.deep.equal({found: false})
  })
})
