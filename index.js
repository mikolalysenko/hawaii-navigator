var connectToDB = require('./client/content-store')
var merge = require('./client/merge')

function placeString (place) {
  var str = place.toString(16)
  while (str.length < 16) {
    str = '0' + str
  }
  return str
}

module.exports = function (infoHash, cb) {
  connectToDB(infoHash, function (err, getFile) {
    if (err) {
      return cb(err)
    }

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

      getFile(path, function (err, data) {
        if (err) {
          return cb(err)
        }
        cb(null, data[str.slice(12)])
      })
    }

    function getPlaceList (places, cb) {
      var failed = false
      var count = places.length
      var result = new Array(places.length)
      places.forEach(function (place, i) {
        getPlace(place, function (err, data) {
          if (failed) {
            return
          }
          if (err) {
            failed = true
            return cb(err)
          }
          result[i] = data
          if (--count === 0) {
            return cb(null, result)
          }
        })
      })
    }

    function getDistance (start, dest, cb) {
      getPlaceList([start, dest], function (err, result) {
        if (err) {
          return cb(err)
        }
        var d = merge(result[0].lo, result[1].li)
        if (d) {
          return d.distance
        } else {
          return Infinity
        }
      })
    }

    function getRoute (start, dest, cb) {
    }

    cb(null, {
      distance: getDistance,
      route: getRoute
    })
  })
}
