function placeString (place) {
  var str = place.toString(16)
  while (str.length < 16) {
    str = '0' + str
  }
  return str
}

function Vertex (place, data) {
  this.place = place
  this.lat = data.p[0]
  this.lon = data.p[1]
}

function extractPath (start, edges) {
  var adj = {}
  for (var i = 0; i < edges.length; ++i) {
    var e = edges[i]
    adj[e[0].place] = e
  }
  var path = []
  var v = start
  var next
  while (v in adj) {
    next = adj[v]
    path.push(next[0])
    v = next[1].place
  }
  path.push(next[1])
  return path
}

function merge (a, b) {
  var av = a.v
  var aw = a.w
  var bv = b.v
  var bw = b.w

  if (av.length <= 0 || bv.length <= 0) {
    return null
  }

  var aptr = 0
  var aacc = av[0]
  var bptr = 0
  var bacc = bv[0]

  var w
  var hitV = -1
  var hitW = Infinity

  while (true) {
    if (aacc < bacc) {
      aptr += 1
      if (aptr >= av.length) {
        break
      }
      aacc += av[aptr]
    } else if (aacc > bacc) {
      bptr += 1
      if (bptr >= bv.length) {
        break
      }
      bacc += bv[bptr]
    } else {
      w = aw[aptr] + bw[bptr]
      if (w < hitW) {
        hitV = aacc
        hitW = w
      }

      aptr += 1
      if (aptr < av.length) {
        aacc += av[aptr]
      }
      bptr += 1
      if (bptr < bv.length) {
        bacc += bv[bptr]
      }

      if (aptr >= av.length || bptr >= bv.length) {
        break
      }
    }
  }

  while (aacc <= bacc && aptr < av.length) {
    if (aacc === bacc) {
      w = aw[aptr] + bw[bptr]
      if (w < hitW) {
        hitV = aacc
        hitW = w
      }
    }
    aptr += 1
    if (aptr >= av.length) {
      break
    }
    aacc += av[aptr]
  }

  while (bacc <= aacc && bptr < bv.length) {
    if (aacc === bacc) {
      w = aw[aptr] + bw[bptr]
      if (w < hitW) {
        hitV = bacc
        hitW = w
      }
    }
    bptr += 1
    if (bptr >= bv.length) {
      break
    }
    bacc += bv[bptr]
  }

  if (hitV < 0) {
    return null
  }
  return {
    vertex: hitV,
    distance: hitW
  }
}

function containsVert (dv, v) {
  var acc = 0
  for (var i = 0; i < dv.length; ++i) {
    acc += dv[i]
    if (acc === v) {
      return true
    }
  }
  return false
}

module.exports = function (getFile) {
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
      var item = data[str.slice(12)]
      if (!item) {
        return cb('missing place id: ' + place)
      }
      cb(null, item)
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
        return cb(null, d.distance)
      } else {
        return cb(null, Infinity)
      }
    })
  }

  function getRoute (start_, end_, cb) {
    var done = false
    var pending = 0
    var edges = []

    refineRoute(start_, end_)

    function refineRoute (start, end) {
      pending += 1
      getPlaceList([start, end], function (err, result) {
        if (done) {
          return
        }
        if (err) {
          done = true
          return cb(err)
        }

        var hub = merge(result[0].lo, result[1].li)
        if (!hub) {
          done = true
          return cb(null, [])
        }

        if (hub.vertex === start) {
          if (containsVert(result[0].ao.v, end)) {
            edges.push([
              new Vertex(start, result[0]),
              new Vertex(end, result[1])
            ])
          } else {
            chaseHub(end, result[1], start, result[0], true)
          }
        } else if (hub.vertex === end) {
          if (containsVert(result[1].ai.v, start)) {
            edges.push([
              new Vertex(start, result[0]),
              new Vertex(end, result[1])
            ])
          } else {
            chaseHub(start, result[0], end, result[1], false)
          }
        } else {
          refineRoute(start, hub.vertex)
          refineRoute(hub.vertex, end)
        }

        pending -= 1
        if (pending === 0) {
          var path = extractPath(start, edges, cb)
          cb(null, path)
        }
      })
    }

    function chaseHub (start, splace, end, eplace, flip) {
      var stack = []
      next(start, splace)

      function next (place, data) {
        var i
        stack.push(new Vertex(place, data))
        if (place === end) {
          if (flip) {
            for (i = 1; i < stack.length; ++i) {
              edges.push([stack[i], stack[i - 1]])
            }
          } else {
            for (i = 1; i < stack.length; ++i) {
              edges.push([stack[i - 1], stack[i]])
            }
          }
          if (pending === 0) {
            cb(null, extractPath(start, edges, cb))
          }
        } else {
          var X = flip ? data.ai : data.ao
          var V = X.v
          var W = X.w
          var adj = []
          var acc = 0
          for (i = 0; i < V.length; ++i) {
            acc += V[i]
            adj.push(acc)
          }
          search(adj, W)
        }
      }

      function search (v, w) {
        pending += 1
        getPlaceList(v, function (err, places) {
          if (done) {
            return
          }
          if (err) {
            done = true
            return cb(err)
          }
          pending -= 1
          var bestN = -1
          var bestD = Infinity
          for (var i = 0; i < places.length; ++i) {
            var X = flip ? places[i].li : places[i].lo
            var V = X.v
            var W = X.w
            var acc = 0
            for (var j = 0; j < V.length; ++j) {
              acc += V[j]
              var d = w[i] + W[j]
              if (acc === end && d < bestD) {
                bestN = i
                bestD = d
              }
            }
          }
          next(v[bestN], places[bestN])
        })
      }
    }
  }

  return {
    distance: getDistance,
    route: getRoute
  }
}
