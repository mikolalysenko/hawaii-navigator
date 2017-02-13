var connectToDB = require('./client/content-store')

function merge (a, b) {
}

module.exports = function (infoHash, cb) {
  connectToDB(infoHash, function (err, getPlace) {
    if (err) {
      return cb(err)
    }

    function fetchPlaces (places, cb) {
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
      fetchPlaces([start, dest], function (err, result) {
        if (err) {
          return cb(err)
        }
        return merge(result[0].lo, result[1].li).distance
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
