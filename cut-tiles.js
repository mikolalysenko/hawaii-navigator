var path = require('path')
var mkdirp = require('mkdirp')
var fs = require('fs')

var search = require('./index.json')

var tilePlaces = new Array(search.tiles.length)
var tileEdges = new Array(search.tiles.length)

search.tiles.forEach(function (name, id) {
  var file = name.replace('tiles', 'search').replace('.pbf', '')
  mkdirp(path.dirname(file), function (err) {
    if (err) {
      return console.error(err)
    }
    var data = processTile(
      tilePlaces[id],
      tileEdges[id],
      search)
    encode(file, data)
  })

  tilePlaces[id] = []
  tileEdges[id] = []
})

filterPlaces(search.place2Tiles)
filterEdges(search.place2Tiles, search.vert2Place, search.edges)

function filterPlaces (place2Tiles) {
  Object.keys(place2Tiles).forEach(function (place) {
    var tiles = place2Tiles[place]
    for (var j = 0; j < tiles.length; ++j) {
      tilePlaces[tiles[j]].push(place)
    }
  })
}

function filterEdges (place2Tiles, vert2Place, edges) {
  for (var i = 0; i < edges.length; ++i) {
    var e = edges[i]
    var ta = place2Tiles[vert2Place[e[0]]]
    var tb = place2Tiles[vert2Place[e[1]]]

    for (var j = 0; j < ta.length; ++j) {
      tileEdges[ta[j]].push(e)
    }
    for (var k = 0; k < tb.length; ++k) {
      var t = tb[k]
      if (ta.indexOf(t) < 0) {
        tileEdges[t].push(e)
      }
    }
  }
}

function processTile (places, edges, search) {
  var externalPlaces = []
  var i

  var _vertIds = {}
  var _tileIds = {}
  var _verts = []
  for (i = 0; i < places.length; ++i) {
    var id = search.place2Vert[places[i]]
    _verts.push(id)
    _tileIds[id] = true
    _vertIds[id] = i
  }

  function addVert (vert) {
    if (vert in _vertIds) {
      return _vertIds[vert]
    }
    externalPlaces.push(search.vert2Place[vert])
    var id = externalPlaces.length + places.length
    _vertIds[vert] = id
    return id
  }

  function addVertList (list) {
    list.forEach(addVert)
  }

  for (i = 0; i < edges.length; ++i) {
    addVert(edges[i][0])
    addVert(edges[i][1])
  }

  search.labels.inV.forEach(addVertList)
  search.labels.outV.forEach(addVertList)

  externalPlaces.sort(function (a, b) {
    return search.place2Tiles[a][0] - search.place2Tiles[b][0]
  })
  var externalTiles = []
  var externalOffset = [0]
  for (i = 0; i < externalPlaces.length;) {
    var place = externalPlaces[i]
    var tile = search.place2Tiles[place][0]
    externalTiles.push(search.tiles[tile])
    externalOffset.push(i + places.length)
    while (i < externalPlaces.length &&
      search.place2Tiles[externalPlaces[i]][0] === tile) {
      _vertIds[externalPlaces[i]] = -i
      ++i
    }
  }
  externalOffset.push(externalPlaces.length + places.length)

  return {
    places: places.concat(externalPlaces).map(toDouble),
    edges: expandEdges(),
    search: {
      in: relabel(search.labels.inV, search.labels.inW),
      out: relabel(search.labels.outV, search.labels.outW)
    },
    external: {
      tiles: externalTiles,
      offset: externalOffset
    }
  }

  function relabel (v, w) {
    var _v = []
    var _w = []

    for (var i = 0; i < _verts.length; ++i) {
      var id = _verts[i]
      var labels = v[id]
      var weights = w[id]

      var table = []
      for (var j = 0; j < labels.length; ++j) {
        table.push([_vertIds[labels[j]], weights[j]])
      }
      table.sort(comparePair)

      _v.push(table.map(first))
      _w.push(table.map(second))
    }

    return {
      v: _v,
      w: _w
    }
  }

  function expandEdges () {
    var s = []
    var t = []
    var w = []
    for (var i = 0; i < edges.length; ++i) {
      var e = edges[i]
      s.push(_vertIds[e[0]])
      t.push(_vertIds[e[1]])
      w.push(e[2])
    }
    return {
      s: s,
      t: t,
      w: w
    }
  }
}

function comparePair (a, b) {
  return a[0] - b[0]
}

function first (a) {
  return a[0]
}

function second (a) {
  return a[1]
}

function toDouble (str) {
  return +str
}

function encode (prefix, data) {
  var places = new Float64Array(data.places)
  var es = new Int32Array(data.edges.s)
  var et = new Int32Array(data.edges.t)
  var ew = new Float32Array(data.edges.w)

  var numPlaces = places.length
  var numEdges = et.length
  var numVerts = data.search.in.v.length

  var header = {
    numPlaces: numPlaces,
    numEdges: numEdges,
    numVerts: numVerts,
    external: data.external
  }

  fs.writeFile(prefix + '.json', JSON.stringify(header))
  fs.writeFile(prefix + '.places', places)
  fs.writeFile(prefix + '.s.bin', es)
  fs.writeFile(prefix + '.t.bin', et)
  fs.writeFile(prefix + '.w.bin', ew)

  flattenSearch(prefix + '.in', data.search.in)
  flattenSearch(prefix + '.out', data.search.out)

  function flattenSearch (prefix, search) {
    var v = search.v
    var w = search.w

    var sz = 0
    var offsets = new Int32Array(v.length + 1)
    for (var i = 0; i < v.length; ++i) {
      offsets[i] = sz
      sz += v[i].length
    }
    offsets[i] = sz

    var vflat = new Uint16Array(sz)
    var wflat = new Float32Array(sz)
    var ptr = 0
    for (i = 0; i < v.length; ++i) {
      var vrow = v[i]
      var wrow = w[i]
      for (var j = 0; j < vrow.length; ++j) {
        vflat[ptr] = vrow[j]
        wflat[ptr] = wrow[j]
        ptr += 1
      }
    }

    fs.writeFile(prefix + '.v.bin', vflat)
    fs.writeFile(prefix + '.w.bin', wflat)
    fs.writeFile(prefix + '.offsets.bin', offsets)
  }
}
