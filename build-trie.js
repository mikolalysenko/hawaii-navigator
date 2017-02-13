var mkdirp = require('mkdirp')
var path = require('path')
var fs = require('fs')

var index = require('./index.json')

var trie = {}

index.vert2Place.forEach(insertPlace)

function insertPlace (place) {
  var str = placeToks(place)
  var prefix = str.slice(0, 14)
  var suffix = str.slice(14)
  var vert = index.place2Vert[place]

  var node = trie[prefix]
  if (!node) {
    node = trie[prefix] = {}
  }

  node[suffix] = {
    in: renameLabels(index.labels.inV[vert], index.labels.inW[vert]),
    out: renameLabels(index.labels.outV[vert], index.labels.outW[vert])
  }
}

function placeToks (place) {
  var str = place.toString(16)
  while (str.length < 16) {
    str = '0' + str
  }
  return str
}

Object.keys(trie).forEach(function (prefix) {
  var node = trie[prefix]
  var dir = path.join(
    'hub',
    prefix.slice(0, 2),
    prefix.slice(2, 4),
    prefix.slice(4, 6),
    prefix.slice(6, 8),
    prefix.slice(8, 10),
    prefix.slice(10, 12))
  mkdirp(dir, function (err) {
    if (err) {
      return
    }
    var file = path.join(dir, prefix.slice(12, 14) + '.json')
    fs.writeFile(file, JSON.stringify(node), noop)
  })
})

function noop () {}

function renameLabels (verts, weights) {
  var pairs = new Array(verts.length)
  for (var i = 0; i < pairs.length; ++i) {
    pairs[i] = {
      v: index.vert2Place[i],
      w: weights[i]
    }
  }
  pairs.sort(compareV)
  var deltaV = new Array(pairs.length)
  deltaV[0] = pairs[0].v
  for (var j = 1; j < pairs.length; ++j) {
    deltaV[j] = pairs[j].v - pairs[j - 1].v
  }
  return {
    v: deltaV,
    w: pairs.map(takeW)
  }
}

function compareV (a, b) {
  return a.v - b.v
}

function takeW (p) {
  return p.w
}
