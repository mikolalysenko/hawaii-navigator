var mkdirp = require('mkdirp')
var path = require('path')
var fs = require('fs')

var index = require('./index.json')

var adjacency = buildAdjacency(index.vert2Place.length, index.edges)

var trie = {}
index.vert2Place.forEach(insertPlace)

function insertPlace (place) {
  var str = placeToks(place)
  var prefix = str.slice(0, 12)
  var suffix = str.slice(12)
  var vert = index.place2Vert[place]

  var node = trie[prefix]
  if (!node) {
    node = trie[prefix] = {}
  }

  node[suffix] = {
    p: index.place2Coord[place],
    li: renameLabels(index.labels.inV[vert], index.labels.inW[vert]),
    lo: renameLabels(index.labels.outV[vert], index.labels.outW[vert]),
    ai: renameLabels(adjacency.inV[vert], adjacency.inW[vert]),
    ao: renameLabels(adjacency.outV[vert], adjacency.outW[vert])
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
    prefix.slice(8, 10))
  mkdirp(dir, function (err) {
    if (err) {
      return
    }
    var file = path.join(dir, prefix.slice(10, 12) + '.json')
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
  return Math.floor(p.w * 1000) / 1000
}

function buildAdjacency (numVerts, edges) {
  var inV = fillArray(numVerts)
  var inW = fillArray(numVerts)
  var outV = fillArray(numVerts)
  var outW = fillArray(numVerts)

  for (var i = 0; i < edges.length; ++i) {
    var e = edges[i]
    var s = e[0]
    var t = e[1]
    var w = e[2]
    outV[s].push(t)
    outW[s].push(w)
    inV[t].push(s)
    inW[t].push(w)
  }
  return {
    inV: inV,
    inW: inW,
    outV: outV,
    outW: outW
  }
}

function fillArray (n) {
  var arr = new Array(n)
  for (var i = 0; i < n; ++i) {
    arr[i] = []
  }
  return arr
}
