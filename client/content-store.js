var GATEWAY_URL = 'https://gateway.ipfs.io/ipns/'
var CACHE = {}

function placeString (place) {
  var str = place.toString(16)
  while (str.length < 16) {
    str = '0' + str
  }
  return str
}

module.exports = function connect (contentId, cb) {
  // FIXME:  Replace this with something smarter
  function getBlock (path, cb) {
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

  // Retrieves the adjacency data from a place id
  function getPlace (place, cb) {
    var str = placeString(place)
    var path = [
      'hub',
      str.slice(0, 2),
      str.slice(2, 4),
      str.slice(4, 6),
      str.slice(6, 8),
      str.slice(8, 10),
      str.slice(10, 12)
    ].join('/') + '.json'

    getBlock(path, function (err, data) {
      if (err) {
        return cb(err)
      }
      cb(null, data[str.slice(12)])
    })
  }

  setTimeout(function () {
    cb(null, getPlace)
  }, 0)
}
