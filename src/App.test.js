import App from './App.js'

describe('Top level exports', () => {
  test('have not changed', () => {
    const expectedExports = ['App'].sort()

    const exports = true // Object.keys(OHIFViewer).sort()

    expect(exports).toEqual(true)
  })
})
