// FIXME:  This is just a temporary stub for illustrative purposes, in
// a real application you'd want to use js-ipfs, dat, web-torrent or something
// smarter with an indexed db back end.
//
//  * race condition where fetching file multiple times in quick succession results in redundant fetches
//  * connection failures hang
//  * timeout not implemented
//  * retry on failure not implemented
//  * not peer-to-peer (should use js-ipfs)
//  * not persisted to indexed db
//
var CACHE = {}

module.exports = function connect (prefix) {
  return function getFile (path, cb) {
    if (path in CACHE) {
      setTimeout(function () {
        cb(null, CACHE[path])
      }, 0)
      return
    }
    var xhr = new window.XMLHttpRequest()
    xhr.open('get', (prefix || '') + '/' + path, true)
    xhr.send()
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        var data = null
        try {
          data = JSON.parse(xhr.responseText)
        } catch (err) {
          return cb(err)
        }
        CACHE[path] = data
        return cb(null, data)
      }
    }
  }
}
