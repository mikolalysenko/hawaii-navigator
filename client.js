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

      if (aptr >= av.length && bptr >= bv.length) {
        break
      }
    }

    while (aacc <= bacc) {
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

    while (bacc <= aacc) {
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

    if (hitV < 0) {
      return null
    }
    return {
      vertex: hitV,
      distance: hitW
    }
  }
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
          if (result[0].ao.v.indexOf(end) >= 0) {
            edges.push([
              new Vertex(start, result[0]),
              new Vertex(end, result[1])
            ])
          } else {
            scanAdjacent(start, result[0].ao, end, { v: [end], w: [0] })
          }
        } else if (hub.vertex === end) {
          if (result[1].ai.v.indexOf(start) >= 0) {
            edges.push([
              new Vertex(start, result[0]),
              new Vertex(end, result[1])
            ])
          } else {
            scanAdjacent(start, { v: [start], w: [0] }, end, result[1].ai)
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

    function scanAdjacent (start, outAdj, end, inAdj) {
      pending += 1

      var adj = []
      var acc = 0
      for (var i = 0; i < outAdj.v.length; ++i) {
        acc += outAdj.v[i]
        adj.push(acc)
      }
      acc = 0
      for (var j = 0; j < inAdj.v.length; ++j) {
        acc += inAdj.v[j]
        adj.push(acc)
      }

      getPlaceList(adj, function (err, data) {
        if (done) {
          return
        }
        if (err) {
          done = true
          return cb(err)
        }

        var sdata = data.slice(0, outAdj.v.length)
        var tdata = data.slice(outAdj.v.length)

        var bestV = -1
        var bestD = Infinity

        for (var i = 0; i < sdata.length; ++i) {
          var sv = sdata[i]
          var sw = outAdj.w[i]
          for (var j = 0; j < tdata.length; ++j) {
            var tv = tdata[j]
            var tw = inAdj.w[j]

            var link = merge(sv.lo, tv.li)
            if (link) {
              var d = sw + tw + link.distance
              if (d < bestD) {
                bestV = link.vertex
                bestD = d
              }
            }
          }
        }

        if (bestV < 0 || bestV === start || bestV === end) {
          // should never happend if index is valid
          done = true
          return cb('index invalid, error linking vertex')
        }

        pending -= 1
        refineRoute(start, bestV)
        refineRoute(bestV, end)
      })
    }
  }

  return {
    distance: getDistance,
    route: getRoute
  }
}