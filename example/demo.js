// First we initialize the temporary storage
var getFile = require('./http-store')()

// Then we create the navigator
var nav = require('../client')(getFile)

// Search is keyed by place id
var start = 3539645082
var end = 582262220

// Use the navigator to get a distance query
nav.distance(start, end, function (err, distance) {
  if (err) {
    return console.error(err)
  }
  if (distance < Infinity) {
    return console.log('distance from', start, 'to', end, 'is', distance)
  } else {
    return console.log('no route from', start, 'to', end)
  }
})

// Now a routing query
nav.route(start, end, function (err, route) {
  if (err) {
    return console.error(err)
  }
  return console.log('route:', route)
})
