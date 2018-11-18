var resolve = require('resolve')
var path = require('path')
var assign = require('object-assign')
var fs = require('fs')

var notNodeModuleRe = /^(\.|\/)/
var clientRe = /\/client(\/|$)/
var serverRe = /\/server(\/|$)/

exports.interfaceVersion = 2

exports.resolve = function (source, file, config) {
  if (resolve.isCore(source)) return { found: true, path: null }

  if (source.startsWith('meteor/')) {
    var meteorRoot = findMeteorRoot(file)
    return resolveMeteorPackage(source, meteorRoot)
  }

  var meteorSource = source
  if (source.startsWith('/')) {
    var meteorRoot = findMeteorRoot(file)
    meteorSource = path.resolve(meteorRoot, source.substr(1))
  }

  var fileUsingSlash = file.split(path.sep).join('/')
  if (!isNodeModuleImport(source) && (isClientInServer(source, fileUsingSlash) || isServerInClient(source, fileUsingSlash))) {
    return { found: false }
  }

  try {
    return { found: true, path: resolve.sync(meteorSource, opts(file, config)) }
  } catch (err) {
    return { found: false }
  }
}

function opts(file, config) {
  return assign({},
    config,
    {
      // path.resolve will handle paths relative to CWD
      basedir: path.dirname(path.resolve(file)),
      packageFilter: packageFilter,
    })
}

function packageFilter(pkg, path, relativePath) {
  if (pkg['jsnext:main']) {
    pkg['main'] = pkg['jsnext:main']
  }
  return pkg
}

function findMeteorRoot(start) {
  start = start || module.parent.filename
  if (typeof start === 'string') {
    if (start[start.length-1] !== path.sep) {
      start += path.sep
    }
    start = start.split(path.sep)
  }
  if(!start.length) {
    throw new Error('.meteor not found in path')
  }
  start.pop()
  var dir = start.join(path.sep)
  try {
    fs.statSync(path.join(dir, '.meteor'))
    return dir
  } catch (e) {}
  return findMeteorRoot(start)
}

function isNodeModuleImport(source) {
  return !notNodeModuleRe.test(source)
}

function isClientInServer(source, file) {
  return serverRe.test(source) && clientRe.test(file)
}

function isServerInClient(source, file) {
  return clientRe.test(source) && serverRe.test(file)
}

function resolveMeteorPackage(source, meteorRoot) {
  try {
    var package = source.split('/')[1]
    var packageCheckFile = package.indexOf(':') !== -1 ?
      getPackageFile(meteorRoot) :
      getVersionFile(meteorRoot)
    var found = new RegExp('^' + package + '(?:@.*?)?(?:[ \s\t]*#.*)?$', 'm').test(packageCheckFile)
    return found ?
      { found: found, path: null } :
      { found: false }
  } catch (e) {
    return { found: false }
  }
}

function getVersionFile(meteorRoot) {
  var filePath = path.join(meteorRoot, '.meteor', 'versions')
  var fileBuffer = fs.readFileSync(filePath)
  return fileBuffer.toString()
}

function getPackageFile(meteorRoot) {
  var filePath = path.join(meteorRoot, '.meteor', 'packages')
  var fileBuffer = fs.readFileSync(filePath)
  return fileBuffer.toString()
}
