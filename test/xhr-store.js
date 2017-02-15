var CACHE = {}

// FIXME:  This is just a temporary stub
//
//  * race condition where fetching file multiple times in quick succession results in redundant fetches
//  * connection failures hang
//  * timeout not implemented
//  * retry on failure not implemented
//  * not peer-to-peer (should use js-ipfs)
//  * not persisted to indexed db
//
module.exports = function connect (prefix, cb) {
  function getFile (path, cb) {
    if (path in CACHE) {
      setTimeout(function () {
        cb(null, CACHE[path])
      }, 0)
      return
    }
    var xhr = new window.XMLHttpRequest()
    xhr.open('get', GATEWAY_URL + contentId + '/' + path, false)
    xhr.send()
    xhr.onreadystatechange = function () {
      if (xhr.readystate === 4) {
        var data = JSON.parse(xhr.responseText)
        CACHE[path] = data
        cb(null, data)
      }
    }
  }

}
