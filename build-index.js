var graph = require('./graph.json')

var createGraph = require('planetary-navigator/lib/graph')
var createIndex = require('planetary-navigator/lib/indexer')

var G = createGraph(graph.point2Id.length, graph.edges)
var index = createIndex(G)

var data = {
  edges: graph.edges,
  tiles: graph.tiles,
  place2Vert: graph.point2Id,
  place2Tiles: graph.id2Tiles,
  vert2Place: graph.id2Point,
  labels: {
    in: {
      v: index.inVerts,
      w: index.inWeights
    },
    out: {
      v: index.outVerts,
      w: index.outWeights
    }
  }
}

console.log(JSON.stringify(data))
