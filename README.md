# hawaii-navigator

A content addressable index for routing optimized for the Hawaiian archipelago.

## Example

```javascript
// First we initialize the file storage.  
var getFile = require('hawaii-navigator/test/http-store')()

// Then we create the navigator (need to pass in file reader method)
var nav = require('hawaii-navigator')(getFile)

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
```

## Index creation

This is pretty janky right now but to build the index, first start the IPFS daemon:

```
ipfs daemon
```

Then run the following command:

```
./run.sh
```

You can post the index to IPFS with this command:

```
ipfs add -r hub
```

## Credits
(c) 2017 Mikola Lysenko. MIT License
