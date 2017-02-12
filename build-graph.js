var fs = require('fs')
var parser = require('osm-pbf-parser')
var through = require('through2')
var ndarray = require('ndarray')
var ndsort = require('ndarray-sort')

// var assert = require('assert')

// reciprocal of precision = tolerance radius
var PRECISION = 1024

// FIXME: use geodesic distance
function edgeWeight (px, py, qx, qy) {
  return Math.sqrt(
    Math.pow(px - qx, 2) +
    Math.pow(py - qy, 2))
}

fs.readFile('./tiles.txt', function (err, data) {
  if (err) {
    return console.error(err)
  }
  var tiles = data
    .toString()
    .split('\n')
    .map(function (name) {
      return name.trim()
    })
    .filter(function (name) {
      return name.length > 0
    })
  var count = tiles.length

  var nodes = []
  var ways = []

  tiles.forEach(function (fileName, tileId) {
    return (
      fs.createReadStream(fileName)
        .pipe(parser())
        .pipe(through.obj(chunk, drain)))

    function chunk (items, enc, next) {
      for (var i = 0; i < items.length; ++i) {
        var item = items[i]
        switch (item.type) {
          case 'node':
            nodes.push(
              Math.floor(item.lat * PRECISION),
              Math.floor(item.lon * PRECISION),
              +item.id,
              +tileId)
            break
          case 'way':
            if (item.tags && item.tags.highway) {
              ways.push(item)
            }
            break
        }
      }
      next()
    }
  })

  function drain () {
    if (--count) {
      return
    }

    var indexData = fuseNodes(nodes)
    var edges = convertEdges(indexData.points,
      splitWays(indexData.id2Point, ways))
    removeIslands(indexData, edges)

    process({
      edges: edges,
      point2Id: indexData.point2Id,
      id2Point: indexData.id2Point,
      id2Tiles: indexData.id2Tiles,
      tiles: tiles
    })

    function fuseNodes (nodes) {
      ndsort(ndarray(nodes, [nodes.length / 4, 4]))
      var id2Point = {}
      var id2Tiles = {}
      var point2Id = []
      var points = []
      var i = 0
      while (i < nodes.length) {
        var lat = nodes[i]
        var lon = nodes[i + 1]
        var pointOffset = point2Id.length
        point2Id.push(nodes[i + 2])
        points.push(lat, lon)
        while (i < nodes.length && nodes[i] === lat && nodes[i + 1] === lon) {
          var id = nodes[i + 2]
          id2Point[id] = pointOffset
          var tiles = id2Tiles[id] = []
          while (i < nodes.length && nodes[i + 2] === id) {
            tiles.push(nodes[i + 3])
            i += 4
          }
        }
      }
      return {
        points,
        id2Point,
        id2Tiles,
        point2Id,
        tiles
      }
    }

    function splitWays (idOffset, ways) {
      var edges = []
      for (var i = 0; i < ways.length; ++i) {
        var item = ways[i]
        var way = item.refs
        for (var j = 1; j < way.length; ++j) {
          var a = idOffset[way[j - 1]]
          var b = idOffset[way[j]]
          if (a && b && a !== b) {
            edges.push(a, b)
            edges.push(b, a)
          }
        }
      }
      return edges
    }

    function convertEdges (points, baseEdges) {
      var edges = []
      ndsort(ndarray(baseEdges, [baseEdges.length / 2, 2]))
      var i = 0
      while (i < baseEdges.length) {
        var a = baseEdges[i]
        var b = baseEdges[i + 1]
        edges.push([a, b,
          edgeWeight(
            points[2 * a], points[2 * a + 1],
            points[2 * b], points[2 * b + 1])])
        while (
          i < baseEdges.length &&
          baseEdges[i] === a &&
          baseEdges[i + 1] === b) {
          i += 2
        }
      }
      return edges
    }

    function degrees (numVerts, edges) {
      var degree = new Int32Array(numVerts)
      for (var j = 0; j < edges.length; ++j) {
        var e = edges[j]
        degree[e[0]] += 1
        degree[e[1]] += 1
      }
      return degree
    }

    function removeIslands (indexData, edges) {
      var point2Id = indexData.point2Id
      var id2Point = indexData.id2Point
      var id2Tiles = indexData.id2Tiles

      var numVerts = point2Id.length
      var degree = degrees(numVerts, edges)
      var labels = new Int32Array(numVerts)

      var ptr = 0
      for (var i = 0; i < numVerts; ++i) {
        if (degree[i] > 1) {
          point2Id[ptr] = point2Id[i]
          labels[i] = ptr
          ptr += 1
        } else {
          labels[i] = -1
        }
      }
      point2Id.length = ptr

      for (var j = 0; j < edges.length; ++j) {
        var e = edges[j]
        e[0] = labels[e[0]]
        e[1] = labels[e[1]]
      }

      Object.keys(id2Point).forEach((id) => {
        var point = id2Point[id]
        var label = labels[point]
        if (label >= 0) {
          id2Point[id] = label
        } else {
          delete id2Point[id]
          delete id2Tiles[id]
        }
      })
    }
  }
})

function process (data) {
  console.log(JSON.stringify(data))
}
