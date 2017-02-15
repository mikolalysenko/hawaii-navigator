var graph = require('./graph.json')

var createGraph = require('planetary-navigator/lib/graph')
var createIndex = require('planetary-navigator/lib/indexer')

var G = createGraph(graph.point2Id.length, graph.edges)
var index = createIndex(G)

var data = {
  edges: graph.edges,
  tiles: graph.tiles,
  place2Vert: graph.id2Point,
  place2Tiles: graph.id2Tiles,
  vert2Place: graph.point2Id,
  labels: {
    inV: index.inLabels,
    inW: index.inWeights,
    outV: index.outLabels,
    outW: index.outWeights
  },
  place2Coord: graph.placeCoords
}

console.log(JSON.stringify(data))
